import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';
import { searchProfileByEmail } from '@/lib/api';
import AdminOnly from '@/components/AdminOnly';
import PlayerBadge from '@/components/PlayerBadge';
import { Plus, Play, Pause, StopCircle, Zap, UserPlus, RotateCcw } from 'lucide-react';

const AdminPanelContent = () => {
  const { user } = useAuth();
  const {
    match, createMatch, addPlayer, removePlayer,
    setBattingTeam, setStriker, setNonStriker, setBowler,
    setTotalOvers, startMatch, pauseMatch, endMatch, addAdmin, resetMatch,
  } = useMatch();

  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [addingTeam, setAddingTeam] = useState<'A' | 'B'>('A');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminMsg, setAdminMsg] = useState('');
  const [battingFirst, setBattingFirst] = useState<'A' | 'B'>('A');
  const [oversInput, setOversInput] = useState<string>(String(match.totalOvers));

  const handleCreateMatch = () => {
    if (teamAName && teamBName) {
      createMatch(teamAName, teamBName);
      setBattingTeam(battingFirst);
      if (user) addAdmin(user.id);
    }
  };

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      addPlayer(addingTeam, playerName.trim());
      setPlayerName('');
    }
  };

  const handleAddAdmin = async () => {
    try {
      const target = await searchProfileByEmail(adminEmail);
      if (!target) {
        setAdminMsg('User not found. They must register first.');
        return;
      }
      addAdmin(target.id);
      setAdminMsg(`${target.name} is now an admin for this match!`);
      setAdminEmail('');
    } catch {
      setAdminMsg('User not found. They must register first.');
    }
  };

  // Setup phase
  if (match.status === 'idle') {
    return (
      <div className="space-y-6 max-w-lg mx-auto px-4 py-6 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground">Create Match</h1>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team A Name</label>
            <input
              value={teamAName}
              onChange={e => setTeamAName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Mumbai XI"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team B Name</label>
            <input
              value={teamBName}
              onChange={e => setTeamBName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="e.g. Chennai XI"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Number of Overs (1–50)
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={oversInput}
              onChange={e => {
                const raw = e.target.value;
                setOversInput(raw);
                const val = Number(raw);
                if (raw !== '' && !isNaN(val) && val >= 1 && val <= 50) setTotalOvers(val);
              }}
              onBlur={() => {
                if (oversInput === '' || isNaN(Number(oversInput)) || Number(oversInput) < 1) {
                  setOversInput('1');
                  setTotalOvers(1);
                } else {
                  const clamped = Math.min(50, Math.max(1, Number(oversInput)));
                  setOversInput(String(clamped));
                  setTotalOvers(clamped);
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Enter overs (1-50)"
            />
            <p className="text-xs text-muted-foreground">Selected: {match.totalOvers} over{match.totalOvers !== 1 ? 's' : ''}</p>
          </div>

          {/* Batting First Selection */}
          {teamAName && teamBName && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Who bats first?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setBattingFirst('A')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    battingFirst === 'A'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {teamAName}
                </button>
                <button
                  type="button"
                  onClick={() => setBattingFirst('B')}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
                    battingFirst === 'B'
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {teamBName}
                </button>
              </div>
            </div>
          )}

          <button
            onClick={handleCreateMatch}
            disabled={!teamAName || !teamBName}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40"
          >
            Create Match
          </button>
        </div>
      </div>
    );
  }

  const battingPlayers = match.battingTeam === 'A' ? match.teamA.players : match.teamB.players;
  const bowlingPlayers = match.battingTeam === 'A' ? match.teamB.players : match.teamA.players;
  const pageTitle = match.status === 'live'
    ? 'Live Match Control'
    : match.status === 'paused'
      ? 'Paused Match Control'
      : match.status === 'inningsBreak'
        ? 'Innings Break Control'
        : match.status === 'ended'
          ? 'Match Complete'
          : 'Match Setup';
  const firstInningsRuns = match.currentInnings === 1
    ? (match.battingTeam === 'A' ? match.scoreA.runs : match.scoreB.runs)
    : (match.battingTeam === 'A' ? match.scoreB.runs : match.scoreA.runs);
  const targetScore = firstInningsRuns + 1;
  const chasingRuns = match.battingTeam === 'A' ? match.scoreA.runs : match.scoreB.runs;
  const runsToWin = Math.max(0, targetScore - chasingRuns);
  const showRunsToWin = match.currentInnings === 2 || match.status === 'ended';

  const isScoreReady = !!(match.strikerId && match.nonStrikerId && match.bowlerId);

  return (
    <div className="space-y-6 max-w-lg mx-auto px-4 py-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
        {(match.status === 'live' || match.status === 'inningsBreak') && (
          isScoreReady ? (
            <Link
              to="/admin/scoring"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Score
            </Link>
          ) : (
            <span
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/40 text-primary-foreground/50 font-semibold text-sm cursor-not-allowed"
              title="Select striker, non-striker and bowler first"
            >
              <Zap className="w-4 h-4" />
              Score
            </span>
          )
        )}
      </div>

      {/* Match Controls */}
      <div className="glass-card p-4">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Match Control</p>
        <div className="flex gap-2 flex-wrap">
          {(match.status === 'setup' || match.status === 'paused') && (() => {
            const canStart = match.teamA.players.length >= 2 && match.teamB.players.length >= 2;
            return canStart ? (
              <button onClick={startMatch} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/80 transition-all">
                <Play className="w-5 h-5" /> Start Match
              </button>
            ) : (
              <span
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary/40 text-primary-foreground/50 text-sm font-semibold cursor-not-allowed"
                title="Add at least 2 players to each team"
              >
                <Play className="w-5 h-5" /> Start Match
              </span>
            );
          })()}
          {match.status === 'live' && (
            <button onClick={pauseMatch} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-accent text-accent-foreground text-sm font-semibold hover:bg-accent/80 transition-all">
              <Pause className="w-5 h-5" /> Pause
            </button>
          )}
          {(match.status === 'live' || match.status === 'paused') && (
            <button onClick={endMatch} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/80 transition-all">
              <StopCircle className="w-5 h-5" /> End Match
            </button>
          )}
          {match.status === 'ended' && (
            <button onClick={resetMatch} className="flex items-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground text-sm font-semibold hover:bg-secondary/80 transition-all">
              <RotateCcw className="w-5 h-5" /> New Match
            </button>
          )}
          {match.status === 'inningsBreak' && (
            <p className="text-xs text-muted-foreground">Innings Break — go to Score panel to start 2nd innings</p>
          )}
        </div>
      </div>

      {/* Target Score */}
      {match.status !== 'setup' && (
        <div className="glass-card p-4">
          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Target</p>
              <p className="mt-1 text-4xl leading-none font-bold text-foreground">{targetScore}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Runs to win</p>
              <p className="mt-1 text-4xl leading-none font-bold text-primary">{showRunsToWin ? runsToWin : targetScore}</p>
            </div>
          </div>
        </div>
      )}

      {/* Total Overs */}
      {(match.status === 'setup' || match.status === 'paused') && (
        <div className="glass-card p-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Overs</p>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={50}
              value={oversInput}
              onChange={e => {
                const raw = e.target.value;
                setOversInput(raw);
                const val = Number(raw);
                if (raw !== '' && !isNaN(val) && val >= 1 && val <= 50) setTotalOvers(val);
              }}
              onBlur={() => {
                if (oversInput === '' || isNaN(Number(oversInput)) || Number(oversInput) < 1) {
                  setOversInput('1');
                  setTotalOvers(1);
                } else {
                  const clamped = Math.min(50, Math.max(1, Number(oversInput)));
                  setOversInput(String(clamped));
                  setTotalOvers(clamped);
                }
              }}
              className="w-28 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <span className="text-sm text-muted-foreground">over{match.totalOvers !== 1 ? 's' : ''} selected</span>
          </div>
        </div>
      )}

      {/* Add Players */}
      {(match.status === 'setup' || match.status === 'paused') && (
        <div className="glass-card p-4 space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Add Players</p>
          <div className="flex gap-2">
            <button
              onClick={() => setAddingTeam('A')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${addingTeam === 'A' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              {match.teamA.name}
            </button>
            <button
              onClick={() => setAddingTeam('B')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${addingTeam === 'B' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}
            >
              {match.teamB.name}
            </button>
          </div>
          <div className="flex gap-2">
            <input
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
              className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Player name"
            />
            <button onClick={handleAddPlayer} className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(addingTeam === 'A' ? match.teamA : match.teamB).players.map(p => (
              <PlayerBadge key={p.id} name={p.name} onRemove={() => removePlayer(addingTeam, p.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Batting Team Selection */}
      {(() => {
        const hasBallsBowled = match.ballEvents.length > 0 || match.firstInningsBallEvents.length > 0;
        const isLocked = (match.status === 'live' && hasBallsBowled) || match.status === 'inningsBreak';
        return (
          <div className={`glass-card p-4 space-y-3 ${isLocked ? 'opacity-50 pointer-events-none' : ''}`}>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Batting Team</p>
            <div className="flex gap-2">
              <button
                onClick={() => setBattingTeam('A')}
                disabled={isLocked}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${match.battingTeam === 'A' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} ${isLocked ? 'cursor-not-allowed' : ''}`}
              >
                {match.teamA.name || 'Team A'}
              </button>
              <button
                onClick={() => setBattingTeam('B')}
                disabled={isLocked}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${match.battingTeam === 'B' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} ${isLocked ? 'cursor-not-allowed' : ''}`}
              >
                {match.teamB.name || 'Team B'}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Select Striker / Non-Striker */}
      <div className="glass-card p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Striker</p>
        <div className="flex flex-wrap gap-2">
          {battingPlayers.map(p => (
            <button
              key={p.id}
              onClick={() => setStriker(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${match.strikerId === p.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              {p.name}
            </button>
          ))}
        </div>

        <p className="text-xs uppercase tracking-widest text-muted-foreground pt-2">Non-Striker</p>
        <div className="flex flex-wrap gap-2">
          {battingPlayers.filter(p => p.id !== match.strikerId).map(p => (
            <button
              key={p.id}
              onClick={() => setNonStriker(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${match.nonStrikerId === p.id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Bowler */}
      <div className="glass-card p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Bowler</p>
        <div className="flex flex-wrap gap-2">
          {bowlingPlayers.map(p => (
            <button
              key={p.id}
              onClick={() => setBowler(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${match.bowlerId === p.id ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Add Admin */}
      <div className="glass-card p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Add Admin</p>
        <div className="flex gap-2">
          <input
            value={adminEmail}
            onChange={e => setAdminEmail(e.target.value)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="User email"
          />
          <button onClick={handleAddAdmin} className="px-3 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <UserPlus className="w-4 h-4" />
          </button>
        </div>
        {adminMsg && <p className="text-xs text-primary">{adminMsg}</p>}
      </div>
    </div>
  );
};

const AdminPanel = () => (
  <AdminOnly>
    <AdminPanelContent />
  </AdminOnly>
);

export default AdminPanel;
