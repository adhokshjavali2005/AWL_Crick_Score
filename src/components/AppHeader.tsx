import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatchAdmin } from '@/contexts/MatchContext';
import { LogOut, Shield, LayoutDashboard, ClipboardList, Menu, X, Mail, User } from 'lucide-react';

const AppHeader = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const isMatchAdmin = useMatchAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on route change
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Close menu on outside click
  useEffect(() => {
    if (!mobileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md" ref={menuRef}>
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
          className="sm:hidden p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all active:scale-90"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <div className="relative w-5 h-5">
            <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-200 ${mobileOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
            <X className={`w-5 h-5 absolute inset-0 transition-all duration-200 ${mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
          </div>
        </button>
      </div>

      {/* Mobile menu overlay */}
      <div className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="border-t border-border/30 bg-card/95 backdrop-blur-xl px-4 py-4">
          {isAuthenticated ? (
            <div className="space-y-1">
              {/* User info card */}
              <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-secondary/50 mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    {user?.email}
                  </p>
                </div>
              </div>

              {/* Nav links */}
              <Link
                to="/live-matches"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all active:scale-[0.98]"
              >
                <LayoutDashboard className="w-[18px] h-[18px]" />
                Match
              </Link>
              <Link
                to="/scorecard"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all active:scale-[0.98]"
              >
                <ClipboardList className="w-[18px] h-[18px]" />
                Scorecard
              </Link>
              {isMatchAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium text-primary hover:bg-primary/10 transition-all active:scale-[0.98]"
                >
                  <Shield className="w-[18px] h-[18px]" />
                  Admin Panel
                </Link>
              )}

              <div className="pt-2">
                <button
                  onClick={() => { setMobileOpen(false); logout(); navigate('/'); }}
                  className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sm font-medium text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-[0.98]"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary transition-all active:scale-[0.98]"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center w-full px-4 py-3 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.98]"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
