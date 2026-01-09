import { useEffect, useState } from "react";
import api from "../api";

export default function Friends() {
  const [friends, setFriends] = useState([]);
  const [available, setAvailable] = useState([]);
  const [online, setOnline] = useState([]);

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
        console.log(res.data)
      } catch (error) {
        console.log(error);
      }
    };

    getFriends();
    availableFriends();
    onlineFriends();
  }, []);

  const addFriend = async (id) => {
    try {
      await api.post("/friends", { friendId: id });

      const friendsRes = await api.get("/friends");
      const availableRes = await api.get("/friends/available");

      setFriends(friendsRes.data);
      setAvailable(availableRes.data);
    } catch (error) {
      console.error("Add friend failed:", error.response?.data);
    }
  };

  return (
    <div>
      <h2>My Friends</h2>
      <ul>
        {friends.length === 0 ? (
          <p>You have no friends, add one</p>
        ) : (
          friends.map((friend) => (
            <li key={friend.id}>{friend.username}</li>
          ))
        )}
      </ul>

      <h2>Available Friends</h2>
      <ul>
        {available.length === 0 ? (
          <p>No available friends</p>
        ) : (
          available.map((user) => (
            <li key={user.id}>
              {user.username}
              <button onClick={() => addFriend(user.id)}>Add</button>
            </li>
          ))
        )}
      </ul>

      <h2>Online Friends</h2>
      <ul>
        {online.map((user) => (
          <li key={user.id}>{user.username}</li>
        ))}
      </ul>
    </div>
  );
}
