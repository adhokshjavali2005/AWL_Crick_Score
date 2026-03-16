import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createMatchAPI, updateMatchAPI, fetchMatch, fetchMatches, fetchTeamNames, fetchTeamPlayers, saveTeamPlayersAPI } from '@/lib/api';
import { joinMatch, leaveMatch, onMatchUpdate, onMatchesUpdated, emitMatchUpdate } from '@/lib/socket';

export interface Player {
  id: string;
  name: string;
}

export type DeliveryType = 'normal' | 'noBall' | 'wide';

export interface BallEvent {
  runs: number;
  isOut: boolean;
  deliveryType: DeliveryType;
  batsmanId: string;
  bowlerId: string;
  over: number;
  ball: number;
}

export type MatchStatus = 'idle' | 'setup' | 'live' | 'paused' | 'inningsBreak' | 'ended';

export interface TeamScore {
  runs: number;
  overs: number;
  balls: number;
}

export interface MatchState {
  id: string;
  status: MatchStatus;
  teamA: { name: string; players: Player[] };
  teamB: { name: string; players: Player[] };
  battingTeam: 'A' | 'B';
  scoreA: TeamScore;
  scoreB: TeamScore;
  strikerId: string | null;
  nonStrikerId: string | null;
  bowlerId: string | null;
  battingOrder: string[];
  ballEvents: BallEvent[];
  admins: string[];
  totalOvers: number; // configured by admin
  currentInnings: 1 | 2;
  firstInningsBallEvents: BallEvent[];
  isSuperOver: boolean;
  mainMatchFirstInnings: BallEvent[];
  mainMatchSecondInnings: BallEvent[];
  superOverHistory: Array<{ firstInnings: BallEvent[]; secondInnings: BallEvent[] }>;
  syncVersion: number;
  updatedAtMs: number;
}

interface MatchContextType {
  match: MatchState;
  allMatches: MatchState[];
  createMatch: (teamAName: string, teamBName: string) => void;
  loadMatch: (matchId: string) => void;
  addPlayer: (team: 'A' | 'B', name: string) => void;
  removePlayer: (team: 'A' | 'B', playerId: string) => void;
  setBattingTeam: (team: 'A' | 'B') => void;
  setStriker: (playerId: string) => void;
  setNonStriker: (playerId: string) => void;
  setBowler: (playerId: string) => void;
  swapStriker: () => void;
  setTotalOvers: (overs: number) => void;
  addRuns: (runs: number, deliveryType?: DeliveryType) => void;
  recordOut: () => void;
  undoLast: () => void;
  startMatch: () => void;
  pauseMatch: () => void;
  endMatch: () => void;
  addAdmin: (userId: string) => void;
  resetMatch: () => void;
  swapInnings: () => void;
  startSuperOver: () => void;
  getAllTeamNames: () => string[];
  currentBattingScore: TeamScore;
  currentBowlingScore: TeamScore;
  battingPlayers: Player[];
  bowlingPlayers: Player[];
}

const initialScore: TeamScore = { runs: 0, overs: 0, balls: 0 };

const initialMatch: MatchState = {
  id: '',
  status: 'idle',
  teamA: { name: '', players: [] },
  teamB: { name: '', players: [] },
  battingTeam: 'A',
  scoreA: { ...initialScore },
  scoreB: { ...initialScore },
  strikerId: null,
  nonStrikerId: null,
  bowlerId: null,
  battingOrder: [],
  ballEvents: [],
  admins: [],
  totalOvers: 5,
  currentInnings: 1,
  firstInningsBallEvents: [],
  isSuperOver: false,
  mainMatchFirstInnings: [],
  mainMatchSecondInnings: [],
  superOverHistory: [],
  syncVersion: 0,
  updatedAtMs: 0,
};

const MATCH_STORAGE_KEY = 'criclive_match_state';
const MATCH_BACKUP_KEY = 'criclive_match_state_backup';
const ALL_MATCHES_KEY = 'criclive_all_matches';
const TEAM_PLAYERS_KEY = 'criclive_team_players';

const getSyncVersion = (state: MatchState): number => (
  typeof state.syncVersion === 'number' ? state.syncVersion : 0
);

const normalizeMatchState = (state: MatchState): MatchState => ({
  ...state,
  syncVersion: getSyncVersion(state),
  updatedAtMs: typeof state.updatedAtMs === 'number' ? state.updatedAtMs : 0,
});

const saveMatchBackup = (state: MatchState) => {
  try {
    localStorage.setItem(MATCH_BACKUP_KEY, JSON.stringify(normalizeMatchState(state)));
  } catch {
    // ignore storage write errors
  }
};

const loadBestPersistedMatch = (): MatchState | null => {
  try {
    const primaryRaw = localStorage.getItem(MATCH_STORAGE_KEY);
    const backupRaw = localStorage.getItem(MATCH_BACKUP_KEY);
    const primary = primaryRaw ? normalizeMatchState(JSON.parse(primaryRaw) as MatchState) : null;
    const backup = backupRaw ? normalizeMatchState(JSON.parse(backupRaw) as MatchState) : null;

    if (!primary && !backup) return null;
    if (!primary) return backup;
    if (!backup) return primary;

    return shouldAcceptRemoteMatch(backup, primary, false) ? backup : primary;
  } catch {
    return null;
  }
};

const shouldAcceptRemoteMatch = (remote: MatchState, current: MatchState, localWindowActive: boolean): boolean => {
  const remoteVersion = getSyncVersion(remote);
  const currentVersion = getSyncVersion(current);

  if (remoteVersion > currentVersion) return true;
  if (remoteVersion < currentVersion) return false;

  // Same version: during fresh local edits, keep local state authoritative.
  if (localWindowActive) return false;

  return (remote.updatedAtMs || 0) >= (current.updatedAtMs || 0);
};

const mergeMatchesByVersion = (current: MatchState[], incoming: MatchState[]): MatchState[] => {
  return incoming.map(nextRaw => {
    const next = normalizeMatchState(nextRaw);
    const existing = current.find(m => m.id === next.id);
    if (!existing) return next;
    return shouldAcceptRemoteMatch(next, normalizeMatchState(existing), false) ? next : existing;
  });
};

const loadTeamPlayers = (teamName: string): Player[] => {
  try {
    const stored = localStorage.getItem(TEAM_PLAYERS_KEY);
    if (stored) {
      const teamPlayers = JSON.parse(stored) as Record<string, Player[]>;
      return teamPlayers[teamName] || [];
    }
  } catch (e) { /* ignore */ }
  return [];
};

const saveTeamPlayers = (teamName: string, players: Player[]) => {
  try {
    const stored = localStorage.getItem(TEAM_PLAYERS_KEY);
    const teamPlayers = stored ? JSON.parse(stored) as Record<string, Player[]> : {};
    teamPlayers[teamName] = players;
    localStorage.setItem(TEAM_PLAYERS_KEY, JSON.stringify(teamPlayers));
  } catch (e) { /* ignore */ }
};

const getAllTeamNames = (): string[] => {
  try {
    const stored = localStorage.getItem(TEAM_PLAYERS_KEY);
    if (stored) {
      const teamPlayers = JSON.parse(stored) as Record<string, Player[]>;
      return Object.keys(teamPlayers).sort();
    }
  } catch (e) { /* ignore */ }
  return [];
};

const loadMatchFromStorage = (): MatchState => {
  try {
    const recovered = loadBestPersistedMatch();
    if (recovered) {
      return recovered;
    }
  } catch (e) {
    // ignore parse errors
  }
  return { ...initialMatch };
};

const loadAllMatches = (): MatchState[] => {
  try {
    const stored = localStorage.getItem(ALL_MATCHES_KEY);
    if (stored) return (JSON.parse(stored) as MatchState[]).map(normalizeMatchState);
  } catch (e) { /* ignore */ }
  return [];
};

const saveAllMatches = (matches: MatchState[]) => {
  localStorage.setItem(ALL_MATCHES_KEY, JSON.stringify(matches));
};

const MatchContext = createContext<MatchContextType | null>(null);

export const MatchProvider = ({ children }: { children: ReactNode }) => {
  const [match, setMatch] = useState<MatchState>(loadMatchFromStorage);
  const [allMatches, setAllMatches] = useState<MatchState[]>(loadAllMatches);
  const { user } = useAuth();
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMatchIdRef = useRef<string>(match.id);
  const matchIdRef = useRef<string>(match.id);
  const isAdminRef = useRef<boolean>(false);
  const isLocalChangeRef = useRef<boolean>(false);  // true when change came from local user action
  const localStorageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketEmitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const matchRef = useRef<MatchState>(match); // latest match for deferred operations
  const lastSocketUpdateRef = useRef<number>(0);  // timestamp of last socket update received
  const lastFullListSyncAtRef = useRef<number>(0);
  const localMutationIdRef = useRef<number>(0);
  const lastLocalMutationAtRef = useRef<number>(0);

  const scheduleSocketEmit = useCallback((next: MatchState) => {
    if (!next.id || next.admins.length === 0) return;
    if (socketEmitTimerRef.current) clearTimeout(socketEmitTimerRef.current);
    socketEmitTimerRef.current = setTimeout(() => {
      emitMatchUpdate(next.id, next);
    }, 80);
  }, []);

  const isLocalAuthoritativeWindow = useCallback(() => {
    // Keep local admin interactions authoritative briefly so delayed remote
    // updates cannot roll back just-clicked values anywhere in admin flows.
    const localChangeIsFresh = Date.now() - lastLocalMutationAtRef.current < 4000;
    return isAdminRef.current && localChangeIsFresh;
  }, []);

  // Wrapper for setMatch that marks the change as local (from user action)
  // Also emits socket update SYNCHRONOUSLY (no effect delay) for zero-lag spectator updates
  const setMatchLocal = useCallback((updater: MatchState | ((prev: MatchState) => MatchState)) => {
    isLocalChangeRef.current = true;
    localMutationIdRef.current += 1;
    lastLocalMutationAtRef.current = Date.now();
    setMatch(prev => {
      const nextBase = typeof updater === 'function' ? updater(prev) : updater;
      if (nextBase === prev) return prev;
      const next: MatchState = {
        ...nextBase,
        syncVersion: Math.max(getSyncVersion(prev) + 1, getSyncVersion(nextBase) + 1),
        updatedAtMs: Date.now(),
      };
      // Immediate backup so selections/scoring survive crashes or transient rollback bugs.
      saveMatchBackup(next);
      // Synchronously update isAdminRef so poll/socket guards work immediately
      isAdminRef.current = user ? next.admins.includes(user.id) : false;
      // Batch socket broadcasts during rapid scoring bursts.
      scheduleSocketEmit(next);
      return next;
    });
  }, [scheduleSocketEmit, user]);

  // Keep refs in sync
  useEffect(() => {
    matchIdRef.current = match.id;
  }, [match.id]);

  useEffect(() => {
    // Defensive sync — also set in setMatchLocal for immediate use
    isAdminRef.current = user ? match.admins.includes(user.id) : false;
  }, [match.admins, user]);

  // Persist match state to localStorage (debounced) + API sync
  useEffect(() => {
    // Keep ref up to date for deferred operations
    matchRef.current = match;

    // Debounce localStorage writes — they block the main thread with JSON.stringify
    if (localStorageTimerRef.current) clearTimeout(localStorageTimerRef.current);
    localStorageTimerRef.current = setTimeout(() => {
      localStorage.setItem(MATCH_STORAGE_KEY, JSON.stringify(matchRef.current));
      saveMatchBackup(matchRef.current);

      // Update allMatches locally (also deferred)
      if (matchRef.current.id) {
        setAllMatches(prev => {
          const idx = prev.findIndex(m => m.id === matchRef.current.id);
          if (idx === -1) return prev;
          const updated = [...prev];
          updated[idx] = matchRef.current;
          return updated;
        });
      }
    }, 300); // Reduce main-thread storage churn during rapid scoring bursts

    // Sync to API — only for LOCAL changes by admin (socket already emitted in setMatchLocal)
    if (match.id && match.admins.length > 0 && isLocalChangeRef.current) {
      const isCriticalChange = match.status === 'ended' || match.status === 'inningsBreak';

      // API sync — instant for critical changes, 100ms debounce for scoring
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (isCriticalChange) {
        // Flush localStorage immediately for critical changes
        if (localStorageTimerRef.current) clearTimeout(localStorageTimerRef.current);
        localStorage.setItem(MATCH_STORAGE_KEY, JSON.stringify(match));

        updateMatchAPI(match.id, match).then(() => {
          console.log('[CricLive] Synced to API (critical):', match.status);
        }).catch((err) => {
          console.error('[CricLive] API sync failed:', err);
        });
      } else {
        syncTimerRef.current = setTimeout(() => {
          updateMatchAPI(matchRef.current.id, matchRef.current).then(() => {
            console.log('[CricLive] Synced to API');
          }).catch((err) => {
            console.error('[CricLive] API sync failed:', err);
          });
        }, 500);
      }
    }
    // Reset the local change flag
    isLocalChangeRef.current = false;
  }, [match]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
      if (localStorageTimerRef.current) clearTimeout(localStorageTimerRef.current);
      if (socketEmitTimerRef.current) clearTimeout(socketEmitTimerRef.current);
    };
  }, []);

  // Emergency durability: persist last known good state on runtime failures.
  useEffect(() => {
    const persistOnFailure = () => {
      saveMatchBackup(matchRef.current);
    };
    window.addEventListener('error', persistOnFailure);
    window.addEventListener('unhandledrejection', persistOnFailure);
    return () => {
      window.removeEventListener('error', persistOnFailure);
      window.removeEventListener('unhandledrejection', persistOnFailure);
    };
  }, []);

  // Socket.io: join/leave match room and listen for real-time updates
  useEffect(() => {
    if (match.id) {
      // Leave previous room if match changed
      if (prevMatchIdRef.current && prevMatchIdRef.current !== match.id) {
        leaveMatch(prevMatchIdRef.current);
      }
      joinMatch(match.id);
      prevMatchIdRef.current = match.id;
    }

    const unsubUpdate = onMatchUpdate((data: { matchId: string; state: unknown }) => {
      const remoteState = normalizeMatchState(data.state as MatchState);

      // Update allMatches instantly (for LiveMatches page)
      setAllMatches(prev => {
        const idx = prev.findIndex(m => m.id === data.matchId);
        if (idx === -1) return prev;
        const current = normalizeMatchState(prev[idx]);
        if (!shouldAcceptRemoteMatch(remoteState, current, false)) return prev;
        const updated = [...prev];
        updated[idx] = remoteState;
        saveAllMatches(updated);
        return updated;
      });

      // Apply remote update to current match
      if (data.matchId === matchRef.current.id) {
        const local = normalizeMatchState(matchRef.current);
        if (!shouldAcceptRemoteMatch(remoteState, local, isLocalAuthoritativeWindow())) {
          return;
        }
        lastSocketUpdateRef.current = Date.now();
        setMatch(remoteState);
        console.log('[CricLive] Socket update received — score:', remoteState.scoreA?.runs + '/' + remoteState.scoreA?.overs + '.' + remoteState.scoreA?.balls);
      }
    });

    const unsubList = onMatchesUpdated(() => {
      // Refresh match list from API
      fetchMatches().then(matches => {
        const states = matches.map((m: { state: MatchState }) => normalizeMatchState(m.state));
        setAllMatches(prev => {
          const merged = mergeMatchesByVersion(prev, states);
          saveAllMatches(merged);
          return merged;
        });
      }).catch(() => { /* ignore */ });
    });

    return () => {
      unsubUpdate();
      unsubList();
    };
  }, [match.id]);

  // Initial fetch of all matches from API on mount + polling fallback
  useEffect(() => {
    // Initial fetch
    fetchMatches().then(matches => {
      const states = matches.map((m: { state: MatchState }) => normalizeMatchState(m.state));
      setAllMatches(prev => {
        const merged = mergeMatchesByVersion(prev, states);
        saveAllMatches(merged);
        return merged;
      });
      lastFullListSyncAtRef.current = Date.now();
      console.log('[CricLive] Initial fetch: loaded', states.length, 'matches');
    }).catch((err) => {
      console.error('[CricLive] Initial fetch failed:', err);
    });

    // Poll every 8s as fallback for Socket.io (socket is primary update path now)
    const interval = setInterval(() => {
      const socketFresh = Date.now() - lastSocketUpdateRef.current < 8000; // socket delivered in last 8s
      const forceListSync = Date.now() - lastFullListSyncAtRef.current > 30000; // catch external DB edits/deletes

      // Refresh list if socket is stale OR at periodic consistency checkpoint.
      // This keeps manual Supabase deletes in sync without per-ball API load.
      if (!socketFresh || forceListSync) {
        fetchMatches().then(matches => {
          const states = matches.map((m: { state: MatchState }) => normalizeMatchState(m.state));
          setAllMatches(prev => {
            const merged = mergeMatchesByVersion(prev, states);
            saveAllMatches(merged);
            return merged;
          });
          lastFullListSyncAtRef.current = Date.now();
        }).catch((err) => {
          console.error('[CricLive] Poll fetch failed:', err);
        });
      }

      // Refresh current match unless this tab is actively doing local scoring.
      const currentId = matchIdRef.current;
      const allowRemoteRefresh = !isLocalAuthoritativeWindow();
      if (currentId && allowRemoteRefresh && !socketFresh) {
        fetchMatch(currentId).then(remoteState => {
          const remote = normalizeMatchState(remoteState as MatchState);
          const local = normalizeMatchState(matchRef.current);
          if (shouldAcceptRemoteMatch(remote, local, isLocalAuthoritativeWindow())) {
            setMatch(remote);
          }
          console.log('[CricLive] Poll fallback applied — no recent socket data');
        }).catch((err) => {
          console.error('[CricLive] Poll match fetch failed:', err);
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also listen for localStorage changes from other local tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MATCH_STORAGE_KEY && e.newValue) {
          try {
            const incomingMatch = normalizeMatchState(JSON.parse(e.newValue) as MatchState);
            const isSameMatch = incomingMatch.id === matchIdRef.current;
            const local = normalizeMatchState(matchRef.current);
            if (!isSameMatch || shouldAcceptRemoteMatch(incomingMatch, local, isLocalAuthoritativeWindow())) {
              setMatch(incomingMatch);
            }
          } catch { /* ignore */ }
      }
      if (e.key === ALL_MATCHES_KEY && e.newValue) {
        try {
          const incoming = (JSON.parse(e.newValue) as MatchState[]).map(normalizeMatchState);
          setAllMatches(prev => mergeMatchesByVersion(prev, incoming));
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Enhanced getAllTeamNames that also fetches from API
  const getAllTeamNamesWithApi = useCallback((): string[] => {
    const localNames = getAllTeamNames();
    // Fire-and-forget API fetch to enrich localStorage cache
    fetchTeamNames().then((apiNames: string[]) => {
      if (apiNames.length > 0) {
        const merged = Array.from(new Set([...localNames, ...apiNames])).sort();
        // Update localStorage with merged set
        const stored = localStorage.getItem(TEAM_PLAYERS_KEY);
        const teamPlayers = stored ? JSON.parse(stored) as Record<string, Player[]> : {};
        for (const name of apiNames) {
          if (!teamPlayers[name]) teamPlayers[name] = [];
        }
        localStorage.setItem(TEAM_PLAYERS_KEY, JSON.stringify(teamPlayers));
      }
    }).catch(() => { /* ignore */ });
    return localNames;
  }, []);

  const createMatch = useCallback((teamAName: string, teamBName: string) => {
    // Load previous players from localStorage cache
    const teamAPlayers = loadTeamPlayers(teamAName);
    const teamBPlayers = loadTeamPlayers(teamBName);

    // Include the current user as admin from the start
    const creatorId = user?.id;
    
    const newMatch: MatchState = {
      ...initialMatch,
      id: crypto.randomUUID(),
      status: 'setup',
      teamA: { name: teamAName, players: teamAPlayers },
      teamB: { name: teamBName, players: teamBPlayers },
      admins: creatorId ? [creatorId] : [],
      syncVersion: 1,
      updatedAtMs: Date.now(),
    };
    setMatchLocal(newMatch);
    setAllMatches(prev => {
      const updated = [...prev, newMatch];
      saveAllMatches(updated);
      return updated;
    });

    // Also try loading from API (async, enriches local cache)
    Promise.all([
      fetchTeamPlayers(teamAName).catch(() => null),
      fetchTeamPlayers(teamBName).catch(() => null),
    ]).then(([apiPlayersA, apiPlayersB]) => {
      setMatch(prev => {
        if (prev.id !== newMatch.id) return prev;
        const pA = (apiPlayersA && apiPlayersA.length > 0) ? apiPlayersA : prev.teamA.players;
        const pB = (apiPlayersB && apiPlayersB.length > 0) ? apiPlayersB : prev.teamB.players;
        return {
          ...prev,
          teamA: { ...prev.teamA, players: pA },
          teamB: { ...prev.teamB, players: pB },
        };
      });
    });

    // Persist to API
    createMatchAPI(newMatch).catch(() => { /* will sync later */ });
  }, [user]);

  const loadMatch = useCallback((matchId: string) => {
    // Try local first
    const found = allMatches.find(m => m.id === matchId);
    if (found) {
      setMatch(found);
    }
    // Also fetch from API for latest state
    const requestMutationId = localMutationIdRef.current;
    fetchMatch(matchId).then((state: MatchState) => {
      if (localMutationIdRef.current !== requestMutationId || matchIdRef.current !== matchId) return;
      const remote = normalizeMatchState(state);
      const local = normalizeMatchState(matchRef.current);
      if (shouldAcceptRemoteMatch(remote, local, isLocalAuthoritativeWindow())) {
        setMatch(remote);
      }
    }).catch(() => { /* use local version */ });
  }, [allMatches, isLocalAuthoritativeWindow]);

  const addPlayer = useCallback((team: 'A' | 'B', name: string) => {
    setMatchLocal(prev => {
      const key = team === 'A' ? 'teamA' : 'teamB';
      const teamName = prev[key].name;
      const newPlayer = { id: crypto.randomUUID(), name };
      const updatedPlayers = [...prev[key].players, newPlayer];
      
      // Save to localStorage cache + API
      if (teamName) {
        saveTeamPlayers(teamName, updatedPlayers);
        saveTeamPlayersAPI(teamName, updatedPlayers).catch(() => { /* will sync later */ });
      }
      
      return {
        ...prev,
        [key]: { ...prev[key], players: updatedPlayers },
      };
    });
  }, []);

  const removePlayer = useCallback((team: 'A' | 'B', playerId: string) => {
    setMatchLocal(prev => {
      const key = team === 'A' ? 'teamA' : 'teamB';
      const teamName = prev[key].name;
      const updatedPlayers = prev[key].players.filter(p => p.id !== playerId);
      
      // Update localStorage cache + API
      if (teamName) {
        saveTeamPlayers(teamName, updatedPlayers);
        saveTeamPlayersAPI(teamName, updatedPlayers).catch(() => { /* will sync later */ });
      }
      
      return {
        ...prev,
        [key]: { ...prev[key], players: updatedPlayers },
      };
    });
  }, []);

  const setBattingTeam = useCallback((team: 'A' | 'B') => {
    setMatchLocal(prev => ({ ...prev, battingTeam: team, strikerId: null, nonStrikerId: null, bowlerId: null }));
  }, [setMatchLocal]);

  const setStriker = useCallback((playerId: string) => {
    setMatchLocal(prev => {
      // If same player is already non-striker, swap them (move old non-striker out)
      if (playerId === prev.nonStrikerId) {
        return { ...prev, strikerId: playerId, nonStrikerId: prev.strikerId };
      }
      return { ...prev, strikerId: playerId };
    });
  }, [setMatchLocal]);

  const setNonStriker = useCallback((playerId: string) => {
    setMatchLocal(prev => {
      // If same player is already striker, swap them (move old striker out)
      if (playerId === prev.strikerId) {
        return { ...prev, nonStrikerId: playerId, strikerId: prev.nonStrikerId };
      }
      return { ...prev, nonStrikerId: playerId };
    });
  }, [setMatchLocal]);

  const setBowler = useCallback((playerId: string) => {
    setMatchLocal(prev => ({ ...prev, bowlerId: playerId }));
  }, [setMatchLocal]);

  const swapStriker = useCallback(() => {
    setMatchLocal(prev => ({
      ...prev,
      strikerId: prev.nonStrikerId,
      nonStrikerId: prev.strikerId,
    }));
  }, [setMatchLocal]);

  const getNextBatsman = (match: MatchState): string | null => {
    const team = match.battingTeam === 'A' ? match.teamA : match.teamB;
    // Exclude BOTH current striker and non-striker
    const usedIds = new Set([match.strikerId, match.nonStrikerId]);
    const available = team.players.filter(p => !usedIds.has(p.id));

    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)].id;
    }

    // All players used — pick any player that is NOT the non-striker
    const fallback = team.players.filter(p => p.id !== match.nonStrikerId);
    if (fallback.length > 0) {
      return fallback[Math.floor(Math.random() * fallback.length)].id;
    }

    // Only one player exists (edge case)
    return team.players[0]?.id || null;
  };

  const getNextBowler = (match: MatchState): string | null => {
    const fieldingTeam = match.battingTeam === 'A' ? match.teamB : match.teamA;
    
    // If current bowler is invalid or not a real player ID, pick first available
    if (!match.bowlerId || !fieldingTeam.players.find(p => p.id === match.bowlerId)) {
      return fieldingTeam.players[0]?.id || null;
    }
    
    const available = fieldingTeam.players.filter(p => p.id !== match.bowlerId);

    if (available.length === 0) {
      // Only one player, keep using them
      return match.bowlerId;
    }
    return available[Math.floor(Math.random() * available.length)]?.id || null;
  };

  const advanceBall = (score: TeamScore): TeamScore => {
    const newBalls = score.balls + 1;
    if (newBalls >= 6) {
      return { ...score, overs: score.overs + 1, balls: 0 };
    }
    return { ...score, balls: newBalls };
  };

  const setTotalOvers = useCallback((overs: number) => {
    setMatchLocal(prev => ({ ...prev, totalOvers: overs }));
  }, [setMatchLocal]);

  const addRuns = useCallback((runs: number, deliveryType: DeliveryType = 'normal') => {
    setMatchLocal(prev => {
      if (prev.status !== 'live') return prev;

      const scoreKey = prev.battingTeam === 'A' ? 'scoreA' : 'scoreB';
      const currentScore = prev[scoreKey];

      // No-ball and wide: add 1 penalty run, do NOT advance ball count
      if (deliveryType === 'noBall' || deliveryType === 'wide') {
        const penaltyRuns = runs + 1; // extra run always included
        const event: BallEvent = {
          runs: penaltyRuns,
          isOut: false,
          deliveryType,
          batsmanId: prev.strikerId || '',
          bowlerId: prev.bowlerId || '',
          over: currentScore.overs,
          ball: currentScore.balls,
        };
        return {
          ...prev,
          [scoreKey]: { ...currentScore, runs: currentScore.runs + penaltyRuns },
          ballEvents: [...prev.ballEvents, event],
        };
      }

      const newScore = advanceBall({ ...currentScore, runs: currentScore.runs + runs });

      const event: BallEvent = {
        runs,
        isOut: false,
        deliveryType: 'normal',
        batsmanId: prev.strikerId || '',
        bowlerId: prev.bowlerId || '',
        over: currentScore.overs,
        ball: currentScore.balls,
      };

      // Swap on odd runs
      let strikerId = prev.strikerId;
      let nonStrikerId = prev.nonStrikerId;
      if (runs % 2 === 1) {
        [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
      }

      // End of over swap — happens after EVERY over
      let newBowlerId = prev.bowlerId;
      if (newScore.balls === 0) {
        [strikerId, nonStrikerId] = [nonStrikerId, strikerId];
        // Change bowler at end of every over
        newBowlerId = getNextBowler(prev) || prev.bowlerId;
      }

      // Auto-end innings or match if totalOvers reached
      let newStatus: MatchStatus = prev.status;
      if (prev.totalOvers > 0 && newScore.overs >= prev.totalOvers) {
        newStatus = prev.currentInnings === 1 ? 'inningsBreak' : 'ended';
      }

      return {
        ...prev,
        status: newStatus,
        [scoreKey]: newScore,
        strikerId,
        nonStrikerId,
        bowlerId: newBowlerId,
        ballEvents: [...prev.ballEvents, event],
        battingOrder: prev.battingOrder.includes(prev.strikerId || '')
          ? prev.battingOrder
          : [...prev.battingOrder, prev.strikerId || ''],
      };
    });
  }, []);

  const recordOut = useCallback(() => {
    setMatchLocal(prev => {
      if (prev.status !== 'live') return prev;

      const scoreKey = prev.battingTeam === 'A' ? 'scoreA' : 'scoreB';
      const currentScore = prev[scoreKey];

      // OUT: subtract 5 runs
      const newRuns = currentScore.runs - 5;
      const newScore = advanceBall({ ...currentScore, runs: newRuns });

      const event: BallEvent = {
        runs: -5,
        isOut: true,
        deliveryType: 'normal',
        batsmanId: prev.strikerId || '',
        bowlerId: prev.bowlerId || '',
        over: currentScore.overs,
        ball: currentScore.balls,
      };

      // Get next batsman to replace striker (new batter comes to strike directly)
      // getNextBatsman guarantees the result is different from nonStrikerId
      const nextBatsman = getNextBatsman(prev);

      let strikerId = nextBatsman;
      let nonStrikerId = prev.nonStrikerId;
      let newBowlerId = prev.bowlerId;

      // NOTE: No end-of-over swap here. New batsman is already at strike position.
      // Normal end-of-over swap only happens in addRuns, not after an out.

      // Change bowler at end of every over
      if (newScore.balls === 0) {
        newBowlerId = getNextBowler(prev) || prev.bowlerId;
      }

      // Auto-end innings or match if totalOvers reached
      let newStatus: MatchStatus = prev.status;
      if (prev.totalOvers > 0 && newScore.overs >= prev.totalOvers) {
        newStatus = prev.currentInnings === 1 ? 'inningsBreak' : 'ended';
      }

      return {
        ...prev,
        status: newStatus,
        [scoreKey]: newScore,
        strikerId,
        nonStrikerId,
        bowlerId: newBowlerId,
        ballEvents: [...prev.ballEvents, event],
        battingOrder: [...prev.battingOrder, nextBatsman || ''],
      };
    });
  }, []);

  const undoLast = useCallback(() => {
    setMatchLocal(prev => {
      if (prev.ballEvents.length === 0) return prev;

      const events = [...prev.ballEvents];
      const lastEvent = events.pop()!;
      const scoreKey = prev.battingTeam === 'A' ? 'scoreA' : 'scoreB';
      const currentScore = prev[scoreKey];

      // Reverse ball count only for legal deliveries
      let overs = currentScore.overs;
      let balls = currentScore.balls;
      if (lastEvent.deliveryType === 'normal' || lastEvent.isOut) {
        if (balls === 0 && overs > 0) {
          overs--;
          balls = 5;
        } else {
          balls--;
        }
      }

      const runs = currentScore.runs - lastEvent.runs;

      // Restore status to live if it was ended or inningsBreak due to this ball
      const newStatus = (prev.status === 'ended' || prev.status === 'inningsBreak') ? 'live' : prev.status;

      let restoredStrikerId: string | null;
      let restoredNonStrikerId: string | null;

      if (lastEvent.isOut) {
        // Undo an out: restore the original batsman who was out to strike
        // The batsmanId in the event is who was batting (i.e., the one who got out)
        restoredStrikerId = lastEvent.batsmanId;
        restoredNonStrikerId = prev.nonStrikerId;
      } else if (lastEvent.deliveryType !== 'normal') {
        // Extras (no-ball/wide) don't cause swaps
        restoredStrikerId = prev.strikerId;
        restoredNonStrikerId = prev.nonStrikerId;
      } else {
        // Normal delivery: reverse swaps that happened
        restoredStrikerId = prev.strikerId;
        restoredNonStrikerId = prev.nonStrikerId;

        // Was it last ball of an over? (current balls=0 means over boundary was crossed)
        const wasEndOfOver = balls === 5 && overs < currentScore.overs;

        if (wasEndOfOver && lastEvent.runs % 2 === 1) {
          // Odd runs + end of over = two swaps happened (cancel out), so no net swap to reverse
          // Positions are already correct
        } else if (wasEndOfOver) {
          // Even runs + end of over = only end-of-over swap happened, reverse it
          [restoredStrikerId, restoredNonStrikerId] = [restoredNonStrikerId, restoredStrikerId];
        } else if (lastEvent.runs % 2 === 1) {
          // Odd runs mid-over = one swap happened, reverse it
          [restoredStrikerId, restoredNonStrikerId] = [restoredNonStrikerId, restoredStrikerId];
        }
        // Even runs mid-over = no swap, nothing to reverse
      }

      return {
        ...prev,
        status: newStatus,
        [scoreKey]: { runs, overs, balls },
        strikerId: restoredStrikerId,
        nonStrikerId: restoredNonStrikerId,
        bowlerId: lastEvent.bowlerId, // Restore the bowler who bowled this ball
        ballEvents: events,
      };
    });
  }, []);

  const startMatch = useCallback(() => {
    setMatchLocal(prev => ({ ...prev, status: 'live' }));
  }, [setMatchLocal]);

  const pauseMatch = useCallback(() => {
    setMatchLocal(prev => ({ ...prev, status: prev.status === 'live' ? 'paused' : 'live' }));
  }, [setMatchLocal]);

  const endMatch = useCallback(() => {
    setMatchLocal(prev => ({ ...prev, status: 'ended' }));
  }, [setMatchLocal]);

  const addAdmin = useCallback((userId: string) => {
    setMatchLocal(prev => ({
      ...prev,
      admins: prev.admins.includes(userId) ? prev.admins : [...prev.admins, userId],
    }));
  }, [setMatchLocal]);

  const resetMatch = useCallback(() => {
    setMatchLocal({ ...initialMatch });
  }, [setMatchLocal]);

  const swapInnings = useCallback(() => {
    setMatchLocal(prev => ({
      ...prev,
      status: 'live',
      battingTeam: prev.battingTeam === 'A' ? 'B' : 'A',
      currentInnings: 2 as const,
      strikerId: null,
      nonStrikerId: null,
      bowlerId: null,
      battingOrder: [],
      firstInningsBallEvents: prev.ballEvents,
      ballEvents: [],
    }));
  }, []);

  const startSuperOver = useCallback(() => {
    setMatchLocal(prev => {
      const isFirstSuperOver = !prev.isSuperOver;
      
      if (isFirstSuperOver) {
        // First super over - save main match
        return {
          ...prev,
          isSuperOver: true,
          mainMatchFirstInnings: prev.firstInningsBallEvents,
          mainMatchSecondInnings: prev.ballEvents,
          firstInningsBallEvents: [],
          ballEvents: [],
          scoreA: { runs: 0, overs: 0, balls: 0 },
          scoreB: { runs: 0, overs: 0, balls: 0 },
          totalOvers: 1,
          currentInnings: 1,
          status: 'live',
          battingTeam: prev.battingTeam === 'A' ? 'B' : 'A',
        };
      } else {
        // Subsequent super over - save previous super over to history
        return {
          ...prev,
          superOverHistory: [
            ...prev.superOverHistory,
            {
              firstInnings: prev.firstInningsBallEvents,
              secondInnings: prev.ballEvents,
            },
          ],
          firstInningsBallEvents: [],
          ballEvents: [],
          scoreA: { runs: 0, overs: 0, balls: 0 },
          scoreB: { runs: 0, overs: 0, balls: 0 },
          totalOvers: 1,
          currentInnings: 1,
          status: 'live',
          battingTeam: prev.battingTeam === 'A' ? 'B' : 'A',
        };
      }
    });
  }, []);

  const battingTeamData = match.battingTeam === 'A' ? match.teamA : match.teamB;
  const bowlingTeamData = match.battingTeam === 'A' ? match.teamB : match.teamA;
  const currentBattingScore = match.battingTeam === 'A' ? match.scoreA : match.scoreB;
  const currentBowlingScore = match.battingTeam === 'A' ? match.scoreB : match.scoreA;

  return (
    <MatchContext.Provider
      value={{
        match,
        allMatches,
        createMatch,
        loadMatch,
        addPlayer,
        removePlayer,
        setBattingTeam,
        setStriker,
        setNonStriker,
        setBowler,
        swapStriker,
        setTotalOvers,
        addRuns,
        recordOut,
        undoLast,
        startMatch,
        pauseMatch,
        endMatch,
        addAdmin,
        resetMatch,
        swapInnings,
        startSuperOver,
        getAllTeamNames: getAllTeamNamesWithApi,
        currentBattingScore,
        currentBowlingScore,
        battingPlayers: battingTeamData.players,
        bowlingPlayers: bowlingTeamData.players,
      }}
    >
      {children}
    </MatchContext.Provider>
  );
};

export const useMatch = () => {
  const ctx = useContext(MatchContext);
  if (!ctx) throw new Error('useMatch must be used within MatchProvider');
  return ctx;
};

export const useMatchAdmin = () => {
  const { user } = useAuth();
  const { match } = useMatch();
  return !!user && match.admins.includes(user.id);
};

