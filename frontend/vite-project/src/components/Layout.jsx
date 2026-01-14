import Navbar from "./navbar";
import { Outlet } from "react-router-dom";
import "../styles/layout.css";

export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="app-content">
        <Outlet />
      </main>
    </>
  );
}
