import { useState, useEffect } from "react";
import api from "../api";

export default function Conversations() {
  const [friends, setFriends] = useState([]);
  const [friendClicked, setFriendClicked] = useState(null);
  const [sentMessage, setSentMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);

  useEffect(() => {
    const getFriends = async () => {
      try {
        const res = await api.get("/friends");
        setFriends(res.data);
      } catch (error) {
        console.error("Failed to load friends", error);
      }
    };

    getFriends();
  }, []);

  const handleClick = async (id) => {
    try {
      const res = await api.get(`/friends/${id}`);
      setFriendClicked(res.data);
      getMessages(id);
    } catch (err) {
      console.error("Failed to fetch friend", err);
    }
  };

  const getMessages = async (id) => {
    try {
      const res = await api.get(`/messages/${id}`);
      setAllMessages(res.data);
      console.log(setAllMessages)
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const sendMessage = async () => {
    if (!sentMessage || !friendClicked) return;

    try {
      const res = await api.post("/messages", {
        text: sentMessage,
        receiverId: friendClicked.id,
      });
      console.log(res.data)
      setAllMessages((prev) => [...prev, res.data]);
      setSentMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  return (
    <div>
      <h1>Friends</h1>

      {friends.map((friend) => (
        <div
          key={friend.id}
          className="friend-item"
          onClick={() => handleClick(friend.id)}
        >
          <p>{friend.username}</p>
        </div>
      ))}

      {friendClicked && (
        <>
          <h2>Chat with {friendClicked.username}</h2>

          {allMessages.map((msg) => (
            <p key={msg.id}>{msg.text}</p>
          ))}

          <input
            value={sentMessage}
            onChange={(e) => setSentMessage(e.target.value)}
            placeholder="Type a message"
          />
          <button onClick={sendMessage}>Send</button>
        </>
      )}
    </div>
  );
}
