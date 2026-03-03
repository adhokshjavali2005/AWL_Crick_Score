import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';
import { ArrowRight, Radio, Plus, Eye } from 'lucide-react';

const Landing = () => {
  const { isAuthenticated, loading } = useAuth();
  const { match } = useMatch();

  if (loading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-3.5rem)] cricket-gradient flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-md w-full space-y-8">
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto text-3xl">
            🏏
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">CricLive</h1>
          <p className="text-muted-foreground text-sm">Live Cricket Score Monitor</p>
        </div>



        {!isAuthenticated ? (
          <div className="flex flex-col gap-3">
            <Link
              to="/register"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors text-center"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors text-center"
            >
              Login
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Link
              to="/create-match"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors text-center flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create a Match
            </Link>
            <Link
              to="/live-matches"
              className="w-full py-3 rounded-xl bg-secondary text-secondary-foreground font-medium text-sm hover:bg-secondary/80 transition-colors text-center flex items-center justify-center gap-2 border border-border/50"
            >
              <Eye className="w-4 h-4" />
              View Live Matches
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;
