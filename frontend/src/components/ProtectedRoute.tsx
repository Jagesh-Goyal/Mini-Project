import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function isTokenExpired(token: string): boolean {
  try {
    const payloadBase64 = token.split('.')[1];
    const payload = JSON.parse(atob(payloadBase64)) as { exp?: number };

    if (!payload.exp) {
      return true;
    }

    return payload.exp <= Math.floor(Date.now() / 1000);
  } catch {
    return true;
  }
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('authToken');

  if (!token || isTokenExpired(token)) {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
