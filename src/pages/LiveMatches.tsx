import { Link, useNavigate } from 'react-router-dom';
import { useMatch } from '@/contexts/MatchContext';
import { ArrowLeft, Radio } from 'lucide-react';

const LiveMatches = () => {
  const { allMatches, loadMatch } = useMatch();
  const navigate = useNavigate();

  const liveMatches = allMatches.filter(
    m => m.status === 'live' || m.status === 'inningsBreak' || m.status === 'setup' || m.status === 'paused'
  );

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
            <p className="text-xs text-muted-foreground">
              {liveMatches.length} active match{liveMatches.length !== 1 ? 'es' : ''}
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
            {liveMatches.map(m => (
              <button
                key={m.id}
                onClick={() => handleViewMatch(m.id)}
                className="glass-card p-4 block w-full text-left group hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold uppercase tracking-widest ${
                    m.status === 'live' ? 'live-pulse pl-4 text-live' : 
                    m.status === 'inningsBreak' ? 'text-yellow-400' :
                    m.status === 'paused' ? 'text-muted-foreground' :
                    'text-blue-400'
                  }`}>
                    {m.status === 'live' ? 'Live' : 
                     m.status === 'inningsBreak' ? 'Innings Break' :
                     m.status === 'paused' ? 'Paused' :
                     'Setting Up'}
                  </span>
                  {m.status === 'live' && <Radio className="w-4 h-4 text-live animate-pulse" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{m.teamA.name || 'Team A'}</span>
                  <span className="font-mono text-sm text-score">
                    {m.scoreA.runs}/{m.scoreA.overs}.{m.scoreA.balls}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm font-medium text-foreground">{m.teamB.name || 'Team B'}</span>
                  <span className="font-mono text-sm text-secondary-foreground">
                    {m.scoreB.runs}/{m.scoreB.overs}.{m.scoreB.balls}
                  </span>
                </div>
                {m.currentInnings === 2 && (
                  <p className="text-xs text-muted-foreground mt-1">2nd Innings</p>
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
