import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useMatch } from '@/contexts/MatchContext';
import { fetchTeamNames } from '@/lib/api';
import { ArrowLeft, ChevronDown } from 'lucide-react';

const CreateMatch = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const { createMatch, addAdmin, getAllTeamNames } = useMatch();
  const navigate = useNavigate();
  const [teamAName, setTeamAName] = useState('');
  const [teamBName, setTeamBName] = useState('');
  const [showTeamADropdown, setShowTeamADropdown] = useState(false);
  const [showTeamBDropdown, setShowTeamBDropdown] = useState(false);
  const teamAInputRef = useRef<HTMLInputElement>(null);
  const teamBInputRef = useRef<HTMLInputElement>(null);

  const [previousTeams, setPreviousTeams] = useState<string[]>(() => getAllTeamNames());

  const refreshTeamNames = useCallback(() => {
    fetchTeamNames().then((names) => {
      const normalized = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
      setPreviousTeams(normalized);
    }).catch(() => {
      // Keep local fallback if API is temporarily unavailable.
      setPreviousTeams(getAllTeamNames());
    });
  }, [getAllTeamNames]);

  useEffect(() => {
    refreshTeamNames();

    const handleFocus = () => refreshTeamNames();
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [refreshTeamNames]);
  
  // Filter teams based on input
  const filteredTeamsA = previousTeams.filter(team =>
    team.toLowerCase().includes(teamAName.toLowerCase())
  );
  
  const filteredTeamsB = previousTeams.filter(team =>
    team.toLowerCase().includes(teamBName.toLowerCase())
  );

  if (loading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const handleCreateMatch = () => {
    if (teamAName && teamBName && user) {
      createMatch(teamAName, teamBName);
      addAdmin(user.id);
      navigate('/admin');
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4">
      <div className="text-center space-y-4 max-w-sm w-full animate-fade-in">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="text-5xl animate-scale-in">🏏</div>
        <h2 className="text-xl font-semibold text-foreground">Create New Match</h2>
        <p className="text-sm text-muted-foreground">Set up a new cricket match</p>

        <div className="space-y-3 text-left animate-fade-in">
          {/* Team A Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team A</label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <input
                  ref={teamAInputRef}
                  value={teamAName}
                  onChange={e => setTeamAName(e.target.value)}
                  onFocus={() => setShowTeamADropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowTeamADropdown(false);
                      e.preventDefault();
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowTeamADropdown(false), 150)}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  placeholder="e.g. Mumbai XI"
                />
                {(previousTeams.length > 0 || teamAName) && (
                  <button
                    type="button"
                    onClick={() => setShowTeamADropdown(!showTeamADropdown)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              
              {/* Team A Dropdown */}
              {showTeamADropdown && (filteredTeamsA.length > 0 || teamAName.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-secondary border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredTeamsA.length > 0 ? (
                    <>
                      {filteredTeamsA.map(team => (
                        <button
                          key={team}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setTeamAName(team);
                            setShowTeamADropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors first:rounded-t-lg"
                        >
                          {team}
                        </button>
                      ))}
                      {previousTeams.length > 0 && (
                        <>
                          <div className="border-t border-border my-1" />
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setTeamAName('');
                              setShowTeamADropdown(false);
                              setTimeout(() => teamAInputRef.current?.focus(), 0);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors last:rounded-b-lg font-medium"
                          >
                            + Create New Team
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowTeamADropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors rounded-lg font-medium"
                    >
                      + Create New Team: "{teamAName}"
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Team B Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Team B</label>
            <div className="relative">
              <div className="flex items-center gap-2">
                <input
                  ref={teamBInputRef}
                  value={teamBName}
                  onChange={e => setTeamBName(e.target.value)}
                  onFocus={() => setShowTeamBDropdown(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setShowTeamBDropdown(false);
                      e.preventDefault();
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowTeamBDropdown(false), 150)}
                  className="flex-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  placeholder="e.g. Chennai XI"
                />
                {(previousTeams.length > 0 || teamBName) && (
                  <button
                    type="button"
                    onClick={() => setShowTeamBDropdown(!showTeamBDropdown)}
                    className="p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              
              {/* Team B Dropdown */}
              {showTeamBDropdown && (filteredTeamsB.length > 0 || teamBName.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-secondary border border-border rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                  {filteredTeamsB.length > 0 ? (
                    <>
                      {filteredTeamsB.map(team => (
                        <button
                          key={team}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setTeamBName(team);
                            setShowTeamBDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 transition-colors first:rounded-t-lg"
                        >
                          {team}
                        </button>
                      ))}
                      {previousTeams.length > 0 && (
                        <>
                          <div className="border-t border-border my-1" />
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setTeamBName('');
                              setShowTeamBDropdown(false);
                              setTimeout(() => teamBInputRef.current?.focus(), 0);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors last:rounded-b-lg font-medium"
                          >
                            + Create New Team
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setShowTeamBDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-sm text-primary hover:bg-primary/10 transition-colors rounded-lg font-medium"
                    >
                      + Create New Team: "{teamBName}"
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleCreateMatch}
            disabled={!teamAName || !teamBName}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            Create & Go to Admin
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateMatch;
