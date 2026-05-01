import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.js";
import ProtectedRoute from "./components/protectedRoutes.js";

import Login from "./pages/Login.js";
import Groups from "./pages/Groups.js";
import Conversations from "./pages/Conversations.js";
import Friends from "./pages/Friends.js";
import Account from "./pages/Account.js";
import Signup from "./pages/Signup.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />\
      <Route element={<Layout />}>
        <Route
          path="/groups"
          element={
            <ProtectedRoute>
              <Groups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/conversations"
          element={
            <ProtectedRoute>
              <Conversations />
            </ProtectedRoute>
          }
        />
        <Route
          path="/friends"
          element={
            <ProtectedRoute>
              <Friends />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
