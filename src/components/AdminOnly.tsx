import { ReactNode } from 'react';
import { useMatchAdmin } from '@/contexts/MatchContext';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AdminOnly = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const isMatchAdmin = useMatchAdmin();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isMatchAdmin) return <Navigate to="/match" replace />;

  return <>{children}</>;
};

export default AdminOnly;
