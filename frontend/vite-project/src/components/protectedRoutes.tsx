import { Navigate, useLocation } from "react-router-dom";
import { useContext, type JSX } from "react";
import { AuthContext } from "../context/authContext.js";
import { useAuth } from "../context/useAuth.js";

export default function ProtectedRoute({
  children,
}: {
  children: JSX.Element;
}) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
