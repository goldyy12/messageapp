import { useEffect, useState } from "react";
import api from "../api.js";
import "../styles/friends.css"; // create this CSS file
import type { AxiosError } from "axios";
import axios from "axios";
import { type Friend } from "../types/messages.js";

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [available, setAvailable] = useState<Friend[]>([]);
  const [online, setOnline] = useState<Friend[]>([]);

  useEffect(() => {
    const getFriends = async () => {
      try {
        const res = await api.get("/friends");
        setFriends(res.data);
      } catch (error) {
        console.error("Failed to load friends", error);
      }
    };

    const availableFriends = async () => {
      try {
        const res = await api.get("/friends/available");
        setAvailable(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    const onlineFriends = async () => {
      try {
        const res = await api.get("/friends/online");
        setOnline(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    getFriends();
    availableFriends();
    onlineFriends();
  }, []);

  const addFriend = async (id: number) => {
    try {
      const res = await api.post("/friends", { friendId: id });

      // optimistic update (IMPORTANT)
      const newFriend = available.find((u) => u.id === id);
      if (newFriend) {
        setFriends((prev) => [...prev, newFriend]);
      }

      setAvailable((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className="friends-container">
      <div className="friends-column">
        <h2>My Friends</h2>
        {friends.length === 0 ? (
          <p>You have no friends, add one</p>
        ) : (
          <ul>
            {friends.map((friend) => (
              <li key={friend.id}>{friend.username}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="friends-column">
        <h2>Available Friends</h2>
        {available.length === 0 ? (
          <p>No available friends</p>
        ) : (
          <ul>
            {available.map((user) => (
              <li key={user.id}>
                {user.username}
                <button onClick={() => addFriend(user.id)}>Add</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="friends-column">
        <h2>Online Friends</h2>
        {online.length === 0 ? (
          <p>No one is online</p>
        ) : (
          <ul>
            {online.map((user) => (
              <li key={user.id}>{user.username}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
