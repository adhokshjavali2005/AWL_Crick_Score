import { useMatch } from '@/contexts/MatchContext';
import { useNavigate } from 'react-router-dom';
import AdminOnly from '@/components/AdminOnly';
import ScoreBoard from '@/components/ScoreBoard';
import ScoreButton from '@/components/ScoreButton';
import { Undo2, StopCircle, Trophy } from 'lucide-react';

const ScoringPanelContent = () => {
  const { match, addRuns, recordOut, undoLast, endMatch, swapInnings } = useMatch();
  const navigate = useNavigate();
  const { currentBattingScore, currentBowlingScore } = useMatch();
  const disabled = match.status !== 'live';

  // Calculate target: first innings score + 1 (bowling team scored in 1st innings)
  const target = match.currentInnings === 2 ? currentBowlingScore.runs + 1 : null;

  const handleEndMatch = () => {
    endMatch();
    navigate('/summary');
  };

  if (match.status === 'inningsBreak') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-sm w-full animate-fade-in">
          <div className="text-5xl animate-scale-in">🔄</div>
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Innings Break</h2>
            <p className="text-sm text-muted-foreground">
              First innings complete. Start the second innings — teams will swap batting and bowling.
            </p>
          </div>

          {/* Target Display */}
          {target !== null && (
            <div className="glass-card p-4 space-y-2">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Target Score</p>
              <p className="text-4xl font-bold text-primary">{target}</p>
              <p className="text-xs text-muted-foreground">
                {match.battingTeam === 'A' ? (match.teamB.name || 'Team B') : (match.teamA.name || 'Team A')} needs {target} runs to win
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            You'll need to select striker, non-striker, and bowler in the admin panel.
          </p>
          <button
            onClick={() => {
              swapInnings();
              navigate('/admin');
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
          >
            Start 2nd Innings
          </button>
          <button
            onClick={undoLast}
            disabled={match.ballEvents.length === 0}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
            Undo Last Ball
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] cricket-gradient flex flex-col animate-fade-in">
      {/* Score Display */}
      <div className="flex-shrink-0 px-4 pt-4 pb-2 max-w-lg mx-auto w-full">
        <ScoreBoard />
      </div>

      {/* Scoring Buttons - fixed bottom */}
      <div className="mt-auto sticky bottom-0 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-4 safe-area-bottom">
        <div className="max-w-lg mx-auto space-y-3">

          {/* Run buttons row 1 */}
          <div className="grid grid-cols-4 gap-2">
            <ScoreButton label="0" onClick={() => addRuns(0)} disabled={disabled} />
            <ScoreButton label="1" onClick={() => addRuns(1)} disabled={disabled} />
            <ScoreButton label="2" onClick={() => addRuns(2)} disabled={disabled} />
            <ScoreButton label="3" onClick={() => addRuns(3)} disabled={disabled} />
          </div>

          {/* Run buttons row 2: boundaries + OUT */}
          <div className="grid grid-cols-3 gap-2">
            <ScoreButton label="4" onClick={() => addRuns(4)} variant="boundary" disabled={disabled} />
            <ScoreButton label="6" onClick={() => addRuns(6)} variant="boundary" disabled={disabled} />
            <ScoreButton label="OUT" onClick={recordOut} variant="out" disabled={disabled} />
          </div>

          {/* Extras row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => addRuns(0, 'noBall')}
              disabled={disabled}
              className={`score-button bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 border border-yellow-500/30 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              No Ball <span className="text-xs opacity-70">(+1)</span>
            </button>
            <button
              onClick={() => addRuns(0, 'wide')}
              disabled={disabled}
              className={`score-button bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/30 ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              Wide <span className="text-xs opacity-70">(+1)</span>
            </button>
          </div>

          {/* Undo + End Match */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={undoLast}
              disabled={match.ballEvents.length === 0}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-accent/10 text-accent text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Undo2 className="w-4 h-4" />
              Undo Last
            </button>
            <button
              onClick={handleEndMatch}
              className="flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
            >
              <StopCircle className="w-4 h-4" />
              End Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScoringPanel = () => (
  <AdminOnly>
    <ScoringPanelContent />
  </AdminOnly>
);

export default ScoringPanel;

