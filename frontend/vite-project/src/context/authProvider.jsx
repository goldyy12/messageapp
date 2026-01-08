import { useState } from "react";
import { jwtDecode } from "jwt-decode";
import { NavLink, Link } from "react-router-dom"; // ✅ works with new versions

import { AuthContext } from "./authContext";

function getUserFromToken() {
  const token = localStorage.getItem("token");
  return token ? jwtDecode(token) : null;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(getUserFromToken);

  const login = (token) => {
    localStorage.setItem("token", token);
    setUser(jwtDecode(token));
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
