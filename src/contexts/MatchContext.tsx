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
  syncVersion?: number;
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
  syncVersion: 0,
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
};

const MATCH_STORAGE_KEY = 'criclive_match_state';
const ALL_MATCHES_KEY = 'criclive_all_matches';
const TEAM_PLAYERS_KEY = 'criclive_team_players';

const getSyncVersion = (state: Partial<MatchState> | null | undefined): number => Number(state?.syncVersion ?? 0);

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
    const stored = localStorage.getItem(MATCH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as MatchState;
    }
  } catch (e) {
    // ignore parse errors
  }
  return { ...initialMatch };
};

const loadAllMatches = (): MatchState[] => {
  try {
    const stored = localStorage.getItem(ALL_MATCHES_KEY);
    if (stored) return JSON.parse(stored) as MatchState[];
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
  const localMutationIdRef = useRef<number>(0);
  const lastLocalMutationAtRef = useRef<number>(0);

  const scheduleSocketEmit = useCallback((next: MatchState) => {
    if (!next.id || next.admins.length === 0) return;
    if (socketEmitTimerRef.current) clearTimeout(socketEmitTimerRef.current);
    socketEmitTimerRef.current = setTimeout(() => {
      emitMatchUpdate(next.id, next);
    }, 40);
  }, []);

  // Wrapper for setMatch that marks the change as local (from user action)
  // Also emits socket update SYNCHRONOUSLY (no effect delay) for zero-lag spectator updates
  const setMatchLocal = useCallback((updater: MatchState | ((prev: MatchState) => MatchState)) => {
    isLocalChangeRef.current = true;
    localMutationIdRef.current += 1;
    lastLocalMutationAtRef.current = Date.now();
    setMatch(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const nextVersion = Math.max(getSyncVersion(prev), getSyncVersion(next)) + 1;
      const versionedNext: MatchState = { ...next, syncVersion: nextVersion };
      // Synchronously update isAdminRef so poll/socket guards work immediately
      isAdminRef.current = user ? versionedNext.admins.includes(user.id) : false;
      // Batch socket broadcasts during rapid scoring bursts.
      scheduleSocketEmit(versionedNext);
      return versionedNext;
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
        }, 180);
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
      const remoteState = data.state as MatchState;

      // Update allMatches instantly (for LiveMatches page)
      setAllMatches(prev => {
        const idx = prev.findIndex(m => m.id === data.matchId);
        if (idx === -1) return prev;
        const current = prev[idx];
        if (getSyncVersion(remoteState) < getSyncVersion(current)) return prev;
        const updated = [...prev];
        updated[idx] = remoteState;
        saveAllMatches(updated);
        return updated;
      });

      // Apply remote update unless this tab is actively performing local scoring actions.
      if (data.matchId === match.id) {
        const localChangeIsFresh = Date.now() - lastLocalMutationAtRef.current < 2000;
        if (isAdminRef.current && localChangeIsFresh) {
          return;
        }
        lastSocketUpdateRef.current = Date.now();
        setMatch(prev => {
          if (getSyncVersion(remoteState) < getSyncVersion(prev)) return prev;
          return remoteState;
        });
        console.log('[CricLive] Socket update received — score:', remoteState.scoreA?.runs + '/' + remoteState.scoreA?.overs + '.' + remoteState.scoreA?.balls);
      }
    });

    const unsubList = onMatchesUpdated(() => {
      // Refresh match list from API
      fetchMatches().then(matches => {
        const states = matches.map((m: { state: MatchState }) => m.state);
        setAllMatches(states);
        saveAllMatches(states);
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
      const states = matches.map((m: { state: MatchState }) => m.state);
      setAllMatches(states);
      saveAllMatches(states);
      console.log('[CricLive] Initial fetch: loaded', states.length, 'matches');
    }).catch((err) => {
      console.error('[CricLive] Initial fetch failed:', err);
    });

    // Poll every 5s as fallback for Socket.io (socket is primary update path now)
    const interval = setInterval(() => {
      // Refresh all matches list (for LiveMatches page)
      fetchMatches().then(matches => {
        const states = matches.map((m: { state: MatchState }) => m.state);
        setAllMatches(states);
        saveAllMatches(states);
      }).catch((err) => {
        console.error('[CricLive] Poll fetch failed:', err);
      });

      // Refresh current match unless this tab is actively doing local scoring.
      const currentId = matchIdRef.current;
      const socketFresh = Date.now() - lastSocketUpdateRef.current < 5000; // socket delivered in last 5s
      const localChangeIsFresh = Date.now() - lastLocalMutationAtRef.current < 2000;
      const allowRemoteRefresh = !isAdminRef.current || !localChangeIsFresh;
      if (currentId && allowRemoteRefresh && !socketFresh) {
        fetchMatch(currentId).then(remoteState => {
          const remote = remoteState as MatchState;
          setMatch(prev => {
            if (getSyncVersion(remote) < getSyncVersion(prev)) return prev;
            return remote;
          });
          console.log('[CricLive] Poll fallback applied — no recent socket data');
        }).catch((err) => {
          console.error('[CricLive] Poll match fetch failed:', err);
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Also listen for localStorage changes from other local tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === MATCH_STORAGE_KEY && e.newValue) {
          try {
            const incomingMatch = JSON.parse(e.newValue) as MatchState;
            const isEditingCurrentMatch = isAdminRef.current && incomingMatch.id === matchIdRef.current;
            const localChangeIsFresh = Date.now() - lastLocalMutationAtRef.current < 2000;
            if (!isEditingCurrentMatch && !localChangeIsFresh) {
              setMatch(incomingMatch);
            }
          } catch { /* ignore */ }
      }
      if (e.key === ALL_MATCHES_KEY && e.newValue) {
        try { setAllMatches(JSON.parse(e.newValue) as MatchState[]); } catch { /* ignore */ }
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
      setMatch(state);
    }).catch(() => { /* use local version */ });
  }, [allMatches]);

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

