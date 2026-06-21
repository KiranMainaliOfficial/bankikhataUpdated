import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function PrivateRoute({ children }) {
  const { user, booting } = useAuth();
  if (booting) return <div className="grid min-h-screen place-items-center">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
