import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/protectedRoutes";

import Login from "./pages/Login";
import Groups from "./pages/Groups";
import Conversations from "./pages/Conversations";
import Friends from "./pages/Friends";
import Account from "./pages/Account";
import Signup from "./pages/Signup";
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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
    </Routes>
  );
}

export default App;
