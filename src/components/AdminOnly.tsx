import { ReactNode } from 'react';
import { useMatchAdmin } from '@/contexts/MatchContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminOnly = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const isMatchAdmin = useMatchAdmin();

  if (loading) return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isMatchAdmin) return <Navigate to="/match" replace />;

  return <>{children}</>;
};

export default AdminOnly;
