import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

type AppRole = 'admin' | 'general_doctor' | 'specialist_doctor' | 'laboratory_technician';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    const redirectMap: Record<AppRole, string> = {
      admin: '/admin/dashboard',
      general_doctor: '/doctor/general',
      specialist_doctor: '/doctor/specialist',
      laboratory_technician: '/laboratory/dashboard',
    };
    return <Navigate to={redirectMap[role] || '/login'} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

