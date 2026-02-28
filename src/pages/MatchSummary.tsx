import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch, useMatchAdmin, BallEvent } from '@/contexts/MatchContext';
import { Zap } from 'lucide-react';

const MatchSummary = () => {
  const { isAuthenticated } = useAuth();
  const { match, startSuperOver } = useMatch();
  const isMatchAdmin = useMatchAdmin();
  const navigate = useNavigate();
  const [adminNames, setAdminNames] = useState<string[]>([]);

  useEffect(() => {
    // Build admin display names from match state — no need for users array
    // Admins are just user IDs; we show them as "Admin 1", "Admin 2" etc.
    // For a richer display we'd fetch profiles, but IDs suffice for now
    setAdminNames(match.admins.map((_, i) => `Admin ${i + 1}`));
  }, [match.admins]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (match.status === 'idle') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No match data available</p>
          <p className="text-xs text-muted-foreground">Match Status: idle</p>
          <a href="/live-matches" className="text-primary hover:underline">View Live Matches</a>
        </div>
      </div>
    );
  }

  // Admin display handled via adminNames state above
  const allPlayers = [...match.teamA.players, ...match.teamB.players];

  const battingOrderNames = match.battingOrder
    .map(id => allPlayers.find(p => p.id === id)?.name)
    .filter(Boolean);

  // Derive bowling order
  const bowlingOrderIds: string[] = [];
  [...match.firstInningsBallEvents, ...match.ballEvents].forEach(e => {
    if (e.bowlerId && !bowlingOrderIds.includes(e.bowlerId)) {
      bowlingOrderIds.push(e.bowlerId);
    }
  });
  const bowlingOrderNames = bowlingOrderIds
    .map(id => allPlayers.find(p => p.id === id)?.name)
    .filter(Boolean);

  // Group balls by over (6 legal deliveries per over)
  const groupByOvers = (events: BallEvent[]) => {
    const overs: BallEvent[][] = [];
    let current: BallEvent[] = [];
    let legal = 0;
    for (const e of events) {
      current.push(e);
      if (e.deliveryType === 'normal' || e.isOut) {
        legal++;
        if (legal >= 6) {
          overs.push(current);
          current = [];
          legal = 0;
        }
      }
    }
    if (current.length > 0) overs.push(current);
    return overs;
  };

  const ballLabel = (e: BallEvent) => {
    if (e.isOut) return 'W';
    if (e.deliveryType === 'noBall') return 'NB';
    if (e.deliveryType === 'wide') return 'WD';
    return String(e.runs);
  };

  const ballClass = (e: BallEvent) => {
    if (e.isOut) return 'bg-destructive/20 text-destructive';
    if (e.deliveryType === 'noBall') return 'bg-yellow-500/20 text-yellow-400';
    if (e.deliveryType === 'wide') return 'bg-blue-500/20 text-blue-400';
    if (e.runs >= 4) return 'bg-primary/20 text-primary';
    return 'bg-secondary text-secondary-foreground';
  };

  const renderInnings = (events: BallEvent[], label: string) => {
    if (events.length === 0) return null;
    const overs = groupByOvers(events);
    return (
      <div className="glass-card p-4 space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        {overs.map((over, oi) => (
          <div key={oi} className="space-y-1">
            <p className="text-[10px] font-medium text-muted-foreground">Over {oi + 1}</p>
            <div className="flex flex-wrap gap-1.5">
              {over.map((e, i) => (
                <div key={i} className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${ballClass(e)}`}>
                  {ballLabel(e)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-6">
      <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-foreground">Match Summary</h1>
          {match.isSuperOver && (
            <span className="px-2.5 py-1 rounded-lg bg-primary/20 text-primary text-xs font-bold uppercase flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Super Over {match.superOverHistory.length + 1}
            </span>
          )}
        </div>

        {/* Winner Announcement */}
        {(match.firstInningsBallEvents.length > 0 || match.ballEvents.length > 0 || match.status === 'ended') && (
          <div className="glass-card p-6 space-y-3 bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
            <div className="text-center">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-2xl font-bold text-primary mb-2">Match End</h2>
              {match.scoreB.runs > match.scoreA.runs ? (
                <>
                  <p className="text-lg font-semibold text-foreground">{match.teamB.name} wins!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {match.scoreB.runs} runs vs {match.scoreA.runs} runs
                  </p>
                </>
              ) : match.scoreA.runs > match.scoreB.runs ? (
                <>
                  <p className="text-lg font-semibold text-foreground">{match.teamA.name} wins!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {match.scoreA.runs} runs vs {match.scoreB.runs} runs
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-foreground">Match Tied!</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Both teams scored {match.scoreA.runs} runs
                  </p>
                </>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                {match.scoreA.runs === match.scoreB.runs && isMatchAdmin && (
                  <button
                    onClick={() => {
                      startSuperOver();
                      navigate('/admin');
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
                  >
                    <Zap className="w-4 h-4" />
                    {match.isSuperOver ? 'Start Another Super Over' : 'Start Super Over'}
                  </button>
                )}
                <button
                  onClick={() => navigate('/create-match')}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95"
                >
                  New Match
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Final Scores */}
        <div className="glass-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{match.teamA.name}</span>
            <span className="font-mono text-xl text-score">
              {match.scoreA.runs}
              <span className="text-sm text-muted-foreground ml-1">({match.scoreA.overs}.{match.scoreA.balls})</span>
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium text-foreground">{match.teamB.name}</span>
            <span className="font-mono text-xl text-secondary-foreground">
              {match.scoreB.runs}
              <span className="text-sm text-muted-foreground ml-1">({match.scoreB.overs}.{match.scoreB.balls})</span>
            </span>
          </div>
        </div>

        {/* Batting Order */}
        {battingOrderNames.length > 0 && (
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Batting Order</p>
            <div className="flex flex-wrap gap-2">
              {battingOrderNames.map((name, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground text-xs font-medium">
                  {i + 1}. {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bowling Order */}
        {bowlingOrderNames.length > 0 && (
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Bowling Order</p>
            <div className="flex flex-wrap gap-2">
              {bowlingOrderNames.map((name, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-medium">
                  {i + 1}. {name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ball Events by Innings */}
        {match.isSuperOver && (match.mainMatchFirstInnings.length > 0 || match.mainMatchSecondInnings.length > 0) && (
          <>
            <div className="glass-card p-3 bg-secondary/20">
              <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Main Match Ball Events</p>
            </div>
            {renderInnings(match.mainMatchFirstInnings, 'Main Match - 1st Innings')}
            {renderInnings(match.mainMatchSecondInnings, 'Main Match - 2nd Innings')}
          </>
        )}

        {/* Previous Super Overs */}
        {match.superOverHistory.length > 0 && match.superOverHistory.map((superOver, idx) => (
          <div key={idx}>
            <div className="glass-card p-3 bg-primary/20">
              <p className="text-xs uppercase tracking-widest text-primary font-bold">
                Super Over {idx + 1} - Tied
              </p>
            </div>
            {renderInnings(superOver.firstInnings, `Super Over ${idx + 1} - 1st Innings`)}
            {renderInnings(superOver.secondInnings, `Super Over ${idx + 1} - 2nd Innings`)}
          </div>
        ))}

        {/* Current Super Over or Regular Innings */}
        {match.isSuperOver && (match.firstInningsBallEvents.length > 0 || match.ballEvents.length > 0) && (
          <div className="glass-card p-3 bg-primary/20">
            <p className="text-xs uppercase tracking-widest text-primary font-bold">
              Super Over {match.superOverHistory.length + 1}{match.status === 'ended' ? '' : ' (Current)'}
            </p>
          </div>
        )}
        {renderInnings(match.firstInningsBallEvents, match.isSuperOver ? `Super Over ${match.superOverHistory.length + 1} - 1st Innings` : '1st Innings')}
        {renderInnings(match.ballEvents, match.isSuperOver ? `Super Over ${match.superOverHistory.length + 1} - 2nd Innings` : (match.firstInningsBallEvents.length > 0 ? '2nd Innings' : 'Ball Events'))}

        {/* Admins */}
        {adminNames.length > 0 && (
          <div className="glass-card p-4 space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Admins</p>
            <div className="space-y-1">
              {adminNames.map((name, i) => (
                <p key={i} className="text-sm text-secondary-foreground">{name}</p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchSummary;
