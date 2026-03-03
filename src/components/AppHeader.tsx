import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatchAdmin } from '@/contexts/MatchContext';
import { LogOut, Shield, LayoutDashboard, ClipboardList, Menu, X } from 'lucide-react';

const AppHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const isMatchAdmin = useMatchAdmin();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container flex items-center justify-between h-14 px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">🏏</span>
          </div>
          <span className="font-semibold text-sm text-foreground">CricLive</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/live-matches"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Match
              </Link>
              <Link
                to="/scorecard"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ClipboardList className="w-3.5 h-3.5" />
                Scorecard
              </Link>
              {isMatchAdmin && (
                <Link
                  to="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]" title={user?.email}>
                {user?.email}
              </span>
              <button
                onClick={() => { logout(); navigate('/'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title={user?.email}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 space-y-1 animate-fade-in">
          {isAuthenticated ? (
            <>
              <Link
                to="/live-matches"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Match
              </Link>
              <Link
                to="/scorecard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Scorecard
              </Link>
              {isMatchAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <div className="border-t border-border/30 my-2" />
              <div className="px-3 py-1.5 text-[11px] text-muted-foreground truncate">
                {user?.email}
              </div>
              <button
                onClick={() => { setMobileOpen(false); logout(); navigate('/'); }}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default AppHeader;
