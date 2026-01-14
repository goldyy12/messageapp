import { NavLink, Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/authContext.jsx";
import styles from "../styles/Navbar.module.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className={styles.sidebar}>
      <Link to="/groups" className={styles.logo}>
        App Logo
      </Link>

      <div className={styles.links}>
        <NavLink
          to="/groups"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Groups
        </NavLink>

        <NavLink
          to="/conversations"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Conversations
        </NavLink>

        <NavLink
          to="/friends"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Friends
        </NavLink>

        <NavLink
          to="/account"
          className={({ isActive }) =>
            isActive ? `${styles.link} ${styles.active}` : styles.link
          }
        >
          Account Management
        </NavLink>

        <button onClick={logout} className={styles.logout}>
          Logout
        </button>
      </div>
    </nav>
  );
}