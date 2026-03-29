import { createContext, useMemo, useState } from "react";

import type { Role } from "../types";

type AuthState = {
  isAuthenticated: boolean;
  role: Role | null;
  csrfToken: string;
  login: (role: Role, csrfToken: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [csrfToken, setCsrfToken] = useState("");

  const value = useMemo(
    () => ({
      isAuthenticated: !!role,
      role,
      csrfToken,
      login: (nextRole: Role, token: string) => {
        setRole(nextRole);
        setCsrfToken(token);
      },
      logout: () => {
        setRole(null);
        setCsrfToken("");
      }
    }),
    [role, csrfToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
