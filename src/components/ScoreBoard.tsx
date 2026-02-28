import { useState } from 'react';
import { useMatch, useMatchAdmin } from '@/contexts/MatchContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeftRight, RefreshCw, Zap } from 'lucide-react';

type EditingField = 'striker' | 'nonStriker' | 'bowler' | null;

const ScoreBoard = () => {
  const { match, currentBattingScore, currentBowlingScore, setStriker, setNonStriker, setBowler, swapStriker, battingPlayers, bowlingPlayers } = useMatch();
  const isMatchAdmin = useMatchAdmin();
  const [editing, setEditing] = useState<EditingField>(null);

  const battingTeam = match.battingTeam === 'A' ? match.teamA : match.teamB;
  const bowlingTeam = match.battingTeam === 'A' ? match.teamB : match.teamA;

  const striker = battingPlayers.find(p => p.id === match.strikerId);
  const nonStriker = battingPlayers.find(p => p.id === match.nonStrikerId);
  const bowler = bowlingPlayers.find(p => p.id === match.bowlerId);

  const strikerOptions = battingPlayers.filter(p => p.id !== match.nonStrikerId);
  const nonStrikerOptions = battingPlayers.filter(p => p.id !== match.strikerId);
  const bowlerOptions = bowlingPlayers;

  const handleChange = (field: EditingField, playerId: string) => {
    if (field === 'striker') setStriker(playerId);
    else if (field === 'nonStriker') setNonStriker(playerId);
    else if (field === 'bowler') setBowler(playerId);
    setEditing(null);
  };

  const targetScore = match.currentInnings === 2 ? currentBowlingScore.runs + 1 : null;
  const runsToWin = targetScore !== null ? Math.max(0, targetScore - currentBattingScore.runs) : null;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Main Score */}
      <div className="glass-card p-5 animate-scale-in" style={{ animationDelay: '0ms', animationFillMode: 'both' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Batting</p>
            <h2 className="text-lg font-semibold text-foreground">{battingTeam.name || 'Team A'}</h2>
          </div>
          {match.status === 'live' && (
            <div className="flex items-center gap-2">
              {match.isSuperOver && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-primary/20 text-primary flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  SUPER OVER {match.superOverHistory.length + 1}
                </span>
              )}
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                {match.currentInnings === 1 ? '1st Inn' : '2nd Inn'}
              </span>
              <span className="live-pulse pl-4 text-xs font-semibold uppercase tracking-widest text-live">
                Live
              </span>
            </div>
          )}
          {match.status === 'paused' && (
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">Paused</span>
          )}
          {match.status === 'inningsBreak' && (
            <span className="text-xs font-semibold uppercase tracking-widest text-accent">Innings Break</span>
          )}
        </div>

        <div className="flex items-end gap-2">
          <span className="score-display">{currentBattingScore.runs}</span>
          <span className="text-lg text-muted-foreground font-mono mb-1">
            ({currentBattingScore.overs}.{currentBattingScore.balls}
            {match.totalOvers > 0 ? `/${match.totalOvers}` : ''})
          </span>
        </div>
      </div>

      {targetScore !== null && (
        <div className="glass-card p-4 animate-scale-in" style={{ animationDelay: '40ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Target</p>
              <p className="text-lg font-semibold text-foreground">{targetScore}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Runs to win</p>
              <p className="text-lg font-semibold text-primary">{runsToWin}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bowling Team Score */}
      <div className="glass-card p-4 animate-scale-in" style={{ animationDelay: '60ms', animationFillMode: 'both' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Bowling</p>
            <h3 className="text-sm font-medium text-secondary-foreground">{bowlingTeam.name || 'Team B'}</h3>
          </div>
          <div className="text-right">
            <span className="font-mono text-xl text-secondary-foreground">{currentBowlingScore.runs}</span>
            <span className="text-xs text-muted-foreground font-mono ml-1">
              ({currentBowlingScore.overs}.{currentBowlingScore.balls})
            </span>
          </div>
        </div>
      </div>

      {/* Players */}
      <div className="glass-card p-4 space-y-3 animate-scale-in" style={{ animationDelay: '120ms', animationFillMode: 'both' }}>
        {/* Striker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
            {editing === 'striker' ? (
              <Select onValueChange={(v) => handleChange('striker', v)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
                <SelectTrigger className="h-7 text-xs w-40">
                  <SelectValue placeholder="Select striker" />
                </SelectTrigger>
                <SelectContent>
                  {strikerOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-foreground truncate">{striker?.name || 'Select striker'}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-medium">Striker</span>
            {isMatchAdmin && editing !== 'striker' && (
              <button onClick={() => setEditing('striker')} className="p-1 rounded hover:bg-secondary transition-colors" title="Change striker">
                <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Swap Button */}
        {isMatchAdmin && match.strikerId && match.nonStrikerId && (
          <div className="flex justify-center -my-1">
            <button
              onClick={swapStriker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
              title="Swap striker and non-striker"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Swap
            </button>
          </div>
        )}

        {/* Non-Striker */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground shrink-0" />
            {editing === 'nonStriker' ? (
              <Select onValueChange={(v) => handleChange('nonStriker', v)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
                <SelectTrigger className="h-7 text-xs w-40">
                  <SelectValue placeholder="Select non-striker" />
                </SelectTrigger>
                <SelectContent>
                  {nonStrikerOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-secondary-foreground truncate">{nonStriker?.name || 'Select non-striker'}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded bg-secondary text-muted-foreground">Non-Striker</span>
            {isMatchAdmin && editing !== 'nonStriker' && (
              <button onClick={() => setEditing('nonStriker')} className="p-1 rounded hover:bg-secondary transition-colors" title="Change non-striker">
                <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        {/* Bowler */}
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
            {editing === 'bowler' ? (
              <Select onValueChange={(v) => handleChange('bowler', v)} onOpenChange={(open) => { if (!open) setEditing(null); }}>
                <SelectTrigger className="h-7 text-xs w-40">
                  <SelectValue placeholder="Select bowler" />
                </SelectTrigger>
                <SelectContent>
                  {bowlerOptions.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span className="text-sm text-secondary-foreground truncate">{bowler?.name || 'Select bowler'}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded bg-accent/20 text-accent font-medium">Bowler</span>
            {isMatchAdmin && editing !== 'bowler' && (
              <button onClick={() => setEditing('bowler')} className="p-1 rounded hover:bg-secondary transition-colors" title="Change bowler">
                <ArrowLeftRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Over Tracker */}
      <OverTracker />
    </div>
  );
};

const OverTracker = () => {
  const { match, currentBattingScore } = useMatch();

  // Show balls from the current over; if new over just started (0 balls), show previous over
  const currentOver = currentBattingScore.overs;
  const showOver = (currentBattingScore.balls === 0 && currentOver > 0)
    ? currentOver - 1
    : currentOver;

  // Find start index by counting legal deliveries up to showOver * 6
  let legal = 0;
  let startIdx = 0;
  if (match.ballEvents.length > 0 && showOver > 0) {
    for (let i = 0; i < match.ballEvents.length; i++) {
      if (legal === showOver * 6) {
        startIdx = i;
        break;
      }
      const ev = match.ballEvents[i];
      if (ev.deliveryType === 'normal' || ev.isOut) {
        legal++;
      }
      if (i === match.ballEvents.length - 1) {
        startIdx = i + 1;
      }
    }
  }

  // Find end index: up to (showOver+1)*6 legal deliveries
  let endIdx = match.ballEvents.length;
  if (showOver < currentOver) {
    let l2 = 0;
    for (let i = 0; i < match.ballEvents.length; i++) {
      const ev = match.ballEvents[i];
      if (ev.deliveryType === 'normal' || ev.isOut) {
        l2++;
      }
      if (l2 === (showOver + 1) * 6) {
        endIdx = i + 1;
        break;
      }
    }
  }

  const recentBalls = match.ballEvents.slice(startIdx, endIdx);

  return (
    <div className="glass-card p-4 animate-scale-in" style={{ animationDelay: '180ms', animationFillMode: 'both' }}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">This Over</p>
      <div className="flex gap-2 flex-wrap">
        {recentBalls.map((event, i) => (
          <div
            key={i}
            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-all animate-scale-in
              ${event.isOut
                ? 'bg-destructive/20 text-destructive border border-destructive/30'
                : event.deliveryType === 'noBall'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : event.deliveryType === 'wide'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : event.runs === 4 || event.runs === 6
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-secondary text-secondary-foreground'
              }`}
            style={{ animationDelay: `${i * 40}ms`, animationFillMode: 'both' }}
          >
            {event.isOut ? 'W' : event.deliveryType === 'noBall' ? 'NB' : event.deliveryType === 'wide' ? 'Wd' : event.runs}
          </div>
        ))}
        {(() => {
          const legalBalls = recentBalls.filter(e => e.deliveryType === 'normal' || e.isOut).length;
          const remaining = Math.max(0, 6 - legalBalls);
          return Array.from({ length: remaining }).map((_, i) => (
            <div key={`empty-${i}`} className="w-9 h-9 rounded-full bg-muted/50 border border-border/30" />
          ));
        })()}
      </div>
    </div>
  );
};

export default ScoreBoard;
