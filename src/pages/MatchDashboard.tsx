import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';
import ScoreBoard from '@/components/ScoreBoard';
import { Plus, ClipboardList, Eye } from 'lucide-react';

const MatchDashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { match, createMatch, addAdmin } = useMatch();
  const navigate = useNavigate();
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleCreateMatch = () => {
    if (teamAName && teamBName && user) {
      createMatch(teamAName, teamBName);
      addAdmin(user.id);
      navigate('/admin');
    }
  };

  if (match.status === 'idle') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm w-full animate-fade-in">
          <div className="text-5xl animate-scale-in">🏏</div>
          <h2 className="text-xl font-semibold text-foreground">No Active Match</h2>
          <p className="text-sm text-muted-foreground">No live match right now. Create one or view live scores!</p>

          {!showCreate ? (
            <div className="flex flex-col gap-3">
              <Link
                to="/create-match"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Create Match
              </Link>
              <Link
                to="/scorecard"
                className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-all hover:scale-105 active:scale-95 border border-border/50"
              >
                <Eye className="w-4 h-4" />
                View Live Score
              </Link>
            </div>
          ) : (
            <div className="space-y-3 text-left animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team A</label>
                <input
                  value={teamAName}
                  onChange={e => setTeamAName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  placeholder="e.g. Mumbai XI"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team B</label>
                <input
                  value={teamBName}
                  onChange={e => setTeamBName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  placeholder="e.g. Chennai XI"
                />
              </div>
              <button
                onClick={handleCreateMatch}
                disabled={!teamAName || !teamBName}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
              >
                Create & Go to Admin
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Live or in-progress match: show two options
  if (match.status === 'live' || match.status === 'inningsBreak') {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] cricket-gradient px-4 py-6">
        <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
          <ScoreBoard />

          {/* View Scorecard */}
          <Link
            to="/scorecard"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-all hover:scale-[1.01] active:scale-95 border border-border/50"
          >
            <ClipboardList className="w-4 h-4" />
            View Full Scorecard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] cricket-gradient px-4 py-6">
      <div className="max-w-lg mx-auto space-y-4 animate-fade-in">
        <ScoreBoard />

        {/* Scorecard Link */}
        <Link
          to="/scorecard"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-all hover:scale-[1.01] active:scale-95 border border-border/50"
        >
          <ClipboardList className="w-4 h-4" />
          View Full Scorecard
        </Link>
      </div>
    </div>
  );
};

export default MatchDashboard;
