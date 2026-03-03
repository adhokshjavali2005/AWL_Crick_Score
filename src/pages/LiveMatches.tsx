import { Link, useNavigate } from 'react-router-dom';
import { useMatch } from '@/contexts/MatchContext';
import { ArrowLeft, Radio, RefreshCw, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

const LiveMatches = () => {
  const { allMatches, loadMatch } = useMatch();
  const navigate = useNavigate();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Track when allMatches changes = data was refreshed
  useEffect(() => {
    if (allMatches.length > 0) {
      setLastUpdate(new Date());
    }
  }, [allMatches]);

  const liveMatches = allMatches.filter(
    m => m.status === 'live' || m.status === 'inningsBreak' || m.status === 'setup' || m.status === 'paused' || m.status === 'ended'
  );

  // Sort: live first, then innings break, then paused, then setup, then ended
  const statusOrder: Record<string, number> = { live: 0, inningsBreak: 1, paused: 2, setup: 3, ended: 4 };
  const sortedMatches = [...liveMatches].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));

  const handleViewMatch = (matchId: string) => {
    loadMatch(matchId);
    navigate('/match');
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Live Matches</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {liveMatches.length} active match{liveMatches.length !== 1 ? 'es' : ''}
              <span className="mx-1">·</span>
              <RefreshCw className="w-3 h-3 animate-spin" style={{ animationDuration: '5s' }} />
              <span>Updated {lastUpdate.toLocaleTimeString()}</span>
            </p>
          </div>
        </div>

        {liveMatches.length === 0 ? (
          <div className="glass-card p-8 text-center animate-scale-in">
            <div className="text-4xl mb-3">🏏</div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No Live Matches</h2>
            <p className="text-sm text-muted-foreground mb-4">
              There are no active matches right now.
            </p>
            <Link
              to="/create-match"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
            >
              Create a Match
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedMatches.map(m => (
              <button
                key={m.id}
                onClick={() => handleViewMatch(m.id)}
                className="glass-card p-4 block w-full text-left group hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-widest ${
                    m.status === 'live' ? 'live-pulse pl-3 text-live' : 
                    m.status === 'inningsBreak' ? 'text-yellow-400' :
                    m.status === 'paused' ? 'text-muted-foreground' :
                    m.status === 'ended' ? 'text-primary' :
                    'text-blue-400'
                  }`}>
                    {m.status === 'live' ? 'Live' : 
                     m.status === 'inningsBreak' ? 'Innings Break' :
                     m.status === 'paused' ? 'Paused' :
                     m.status === 'ended' ? 'Ended' :
                     'Setting Up'}
                  </span>
                  {m.status === 'live' && <Radio className="w-4 h-4 text-live animate-pulse" />}
                  {m.status === 'ended' && <Trophy className="w-4 h-4 text-primary" />}
                </div>
                {/* Team names with vs animation */}
                <div className="flex items-center justify-center gap-2 my-2">
                  <span className="text-base font-bold text-foreground truncate max-w-[40%] text-right animate-fade-in"
                    style={{ animationDelay: '80ms', animationFillMode: 'both' }}>
                    {m.teamA.name || 'Team A'}
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-primary animate-pulse px-1.5 py-0.5 rounded-md bg-primary/10">
                    vs
                  </span>
                  <span className="text-base font-bold text-foreground truncate max-w-[40%] text-left animate-fade-in"
                    style={{ animationDelay: '160ms', animationFillMode: 'both' }}>
                    {m.teamB.name || 'Team B'}
                  </span>
                </div>
                {/* Scores */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-score">
                    <span className="font-bold">{m.scoreA.runs}</span>
                    <span className="text-xs text-muted-foreground ml-1">({m.scoreA.overs}.{m.scoreA.balls} ov)</span>
                  </span>
                  <span className="text-sm text-secondary-foreground">
                    <span className="font-bold">{m.scoreB.runs}</span>
                    <span className="text-xs text-muted-foreground ml-1">({m.scoreB.overs}.{m.scoreB.balls} ov)</span>
                  </span>
                </div>
                {m.currentInnings === 2 && m.status !== 'ended' && (
                  <p className="text-xs text-muted-foreground mt-1">2nd Innings</p>
                )}
                {m.status === 'ended' && (
                  <p className="text-xs font-medium mt-2 text-primary">
                    {m.scoreA.runs > m.scoreB.runs
                      ? `🏆 ${m.teamA.name || 'Team A'} won by ${m.scoreA.runs - m.scoreB.runs} runs`
                      : m.scoreB.runs > m.scoreA.runs
                      ? `🏆 ${m.teamB.name || 'Team B'} won by ${m.scoreB.runs - m.scoreA.runs} runs`
                      : '🤝 Match Tied'}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMatches;
