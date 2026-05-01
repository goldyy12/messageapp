import { useState } from "react";
import { jwtDecode } from "jwt-decode";

import { AuthContext } from "./authContext.js";
import type { AuthContextType, DecodedToken, User } from "../types/auth.js";

function getUserFromToken() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  const decoded: DecodedToken = jwtDecode(token);
  return {
    id: decoded.userId,
    username: decoded.username,
    email: decoded.email,
  };
}

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(getUserFromToken);

  const login = (token: string) => {
    localStorage.setItem("token", token);
    const decoded: DecodedToken = jwtDecode(token);
    setUser({
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };
  const value: AuthContextType = { user, login, logout, setUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
