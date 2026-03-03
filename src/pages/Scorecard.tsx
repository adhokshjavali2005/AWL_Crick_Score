import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';
import { BallEvent, Player } from '@/contexts/MatchContext';
import { ArrowLeft } from 'lucide-react';

interface BatsmanStats {
  player: Player;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  outs: number;
  team: string;
}

interface BowlerStats {
  player: Player;
  overs: number;
  balls: number;
  runs: number;
  wickets: number;
  noBalls: number;
  wides: number;
  team: string;
}

const Scorecard = () => {
  const { isAuthenticated, loading } = useAuth();
  const { match } = useMatch();

  if (loading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (match.status === 'idle') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <p className="text-muted-foreground">No match data available</p>
      </div>
    );
  }

  // Combine all ball events from both innings
  const allBallEvents = [...match.firstInningsBallEvents, ...match.ballEvents];

  // Build batsman stats
  const buildBatsmanStats = (players: Player[], teamName: string): BatsmanStats[] => {
    return players.map(player => {
      const events = allBallEvents.filter(e => e.batsmanId === player.id);
      const runs = events.reduce((sum, e) => sum + (e.isOut ? 0 : Math.max(0, e.runs)), 0);
      const balls = events.filter(e => e.deliveryType === 'normal').length;
      const fours = events.filter(e => !e.isOut && e.runs === 4).length;
      const sixes = events.filter(e => !e.isOut && e.runs === 6).length;
      const outs = events.filter(e => e.isOut).length;
      return { player, runs, balls, fours, sixes, outs, team: teamName };
    });
  };

  // Build bowler stats
  const buildBowlerStats = (players: Player[], teamName: string): BowlerStats[] => {
    return players.map(player => {
      const events = allBallEvents.filter(e => e.bowlerId === player.id);
      const normalBalls = events.filter(e => e.deliveryType === 'normal').length;
      const overs = Math.floor(normalBalls / 6);
      const balls = normalBalls % 6;
      const runs = events.reduce((sum, e) => sum + Math.max(0, e.runs), 0);
      const wickets = events.filter(e => e.isOut).length;
      const noBalls = events.filter(e => e.deliveryType === 'noBall').length;
      const wides = events.filter(e => e.deliveryType === 'wide').length;
      return { player, overs, balls, runs, wickets, noBalls, wides, team: teamName };
    });
  };

  const teamABatters = buildBatsmanStats(match.teamA.players, match.teamA.name);
  const teamBBatters = buildBatsmanStats(match.teamB.players, match.teamB.name);
  // Team A bowlers are actually from team B bowling at team A batters
  const teamABowlers = buildBowlerStats(match.teamB.players, match.teamB.name);
  const teamBBowlers = buildBowlerStats(match.teamA.players, match.teamA.name);

  const hasEvents = allBallEvents.length > 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-6">
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link to="/match" className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">Scorecard</h1>
            <p className="text-xs text-muted-foreground">
              {match.teamA.name} vs {match.teamB.name}
            </p>
          </div>
        </div>

        {!hasEvents && (
          <div className="glass-card p-6 text-center animate-scale-in">
            <p className="text-muted-foreground text-sm">No ball events yet. Start playing to see stats!</p>
          </div>
        )}

        {/* Team A Batting */}
        <ScorecardSection
          title={`${match.teamA.name} — Batting`}
          icon="bat"
          delay={0}
        >
          <BattingTable batters={teamABatters} score={match.scoreA} totalOvers={match.totalOvers} />
        </ScorecardSection>

        {/* Team A Bowlers (i.e. Team B players bowling) */}
        <ScorecardSection
          title={`${match.teamB.name} — Bowling`}
          icon="ball"
          delay={1}
        >
          <BowlingTable bowlers={teamABowlers} />
        </ScorecardSection>

        {/* Team B Batting */}
        <ScorecardSection
          title={`${match.teamB.name} — Batting`}
          icon="bat"
          delay={2}
        >
          <BattingTable batters={teamBBatters} score={match.scoreB} totalOvers={match.totalOvers} />
        </ScorecardSection>

        {/* Team B Bowlers (i.e. Team A players bowling) */}
        <ScorecardSection
          title={`${match.teamA.name} — Bowling`}
          icon="ball"
          delay={3}
        >
          <BowlingTable bowlers={teamBBowlers} />
        </ScorecardSection>

      </div>
    </div>
  );
};

const ScorecardSection = ({
  title, icon, children, delay,
}: {
  title: string; icon: 'bat' | 'ball'; children: React.ReactNode; delay: number;
}) => (
  <div
    className="glass-card p-4 space-y-3 animate-fade-in"
    style={{ animationDelay: `${delay * 80}ms`, animationFillMode: 'both' }}
  >
    <div className="flex items-center gap-2">
      {icon === 'bat'
        ? <span className="text-base">🏏</span>
        : <span className="text-base">⚾</span>
      }
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">{title}</p>
    </div>
    {children}
  </div>
);

const BattingTable = ({ batters, score, totalOvers }: { batters: BatsmanStats[]; score: { runs: number; overs: number; balls: number }; totalOvers: number }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-5 gap-1 px-1">
      <span className="text-[10px] text-muted-foreground uppercase col-span-2">Player</span>
      <span className="text-[10px] text-muted-foreground uppercase text-center">R</span>
      <span className="text-[10px] text-muted-foreground uppercase text-center">B</span>
      <span className="text-[10px] text-muted-foreground uppercase text-center">4s/6s</span>
    </div>
    {batters.map((b, i) => (
      <div
        key={b.player.id}
        className="grid grid-cols-5 gap-1 px-2 py-2 rounded-lg bg-secondary/50 items-center animate-fade-in"
        style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
      >
        <div className="col-span-2 flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{b.player.name}</span>
          {b.outs > 0 && (
            <span className="text-[9px] px-1 py-0.5 rounded bg-destructive/20 text-destructive shrink-0">OUT×{b.outs}</span>
          )}
        </div>
        <span className="text-sm font-bold text-score text-center">{b.runs}</span>
        <span className="text-sm text-muted-foreground text-center">{b.balls}</span>
        <span className="text-xs text-muted-foreground text-center">{b.fours}/{b.sixes}</span>
      </div>
    ))}
    <div className="flex items-center justify-between pt-1 border-t border-border/50 px-1">
      <span className="text-xs text-muted-foreground">Total</span>
      <span className="text-sm font-bold text-foreground font-mono">
        {score.runs} ({score.overs}.{score.balls}{totalOvers > 0 ? `/${totalOvers}` : ''} ov)
      </span>
    </div>
  </div>
);

const BowlingTable = ({ bowlers }: { bowlers: BowlerStats[] }) => (
  <div className="space-y-2">
    <div className="grid grid-cols-5 gap-1 px-1">
      <span className="text-[10px] text-muted-foreground uppercase col-span-2">Bowler</span>
      <span className="text-[10px] text-muted-foreground uppercase text-center">O</span>
      <span className="text-[10px] text-muted-foreground uppercase text-center">R</span>
      <span className="text-[10px] text-muted-foreground uppercase text-center">W</span>
    </div>
    {bowlers.map((b, i) => (
      <div
        key={b.player.id}
        className="grid grid-cols-5 gap-1 px-2 py-2 rounded-lg bg-secondary/50 items-center animate-fade-in"
        style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
      >
        <div className="col-span-2 flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{b.player.name}</span>
        </div>
        <span className="text-sm text-muted-foreground text-center font-mono">{b.overs}.{b.balls}</span>
        <span className="text-sm text-muted-foreground text-center">{b.runs}</span>
        <span className="text-sm font-bold text-accent text-center">{b.wickets}</span>
      </div>
    ))}
    {bowlers.every(b => b.overs === 0 && b.balls === 0) && (
      <p className="text-xs text-muted-foreground text-center py-2">No bowling data yet</p>
    )}
  </div>
);

export default Scorecard;
