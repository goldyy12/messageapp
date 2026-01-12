import { useState, useEffect, useContext, useRef } from "react";
import api from "../api";
import "../styles/conversations.css";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";

export default function Conversations() {
  const [friends, setFriends] = useState([]);
  const [friendClicked, setFriendClicked] = useState(null);
  const [sentMessage, setSentMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { user } = useContext(AuthContext);

  // Join user for socket messages
  useEffect(() => {
    if (!user?.userId) return;
    socket.emit("joinUser", user.userId);

    return () => {
      socket.off("privateMessage");
    };
  }, [user]);

  // Listen for incoming messages
  useEffect(() => {
    socket.on("privateMessage", (message) => {
      if (
        friendClicked &&
        (message.senderId === friendClicked.id ||
          message.receiverId === friendClicked.id)
      ) {
        setAllMessages((prev) => [...prev, message]);
      }
    });

    return () => socket.off("privateMessage");
  }, [friendClicked]);

  // Load friends
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

  // Handle friend click
  const handleClick = async (id) => {
    try {
      const res = await api.get(`/friends/${id}`);
      setFriendClicked(res.data);
      getMessages(id);
    } catch (err) {
      console.error("Failed to fetch friend", err);
    }
  };

  // Load messages
  const getMessages = async (id) => {
    try {
      const res = await api.get(`/messages/${id}`);
      // Reverse messages so oldest appear first
      setAllMessages(res.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!sentMessage || !friendClicked) return;

    try {
      const res = await api.post("/messages", {
        text: sentMessage,
        receiverId: friendClicked.id,
      });

      // Add new message to the end
      setAllMessages((prev) => [...prev, res.data]);
      setSentMessage("");
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  return (
    <div className="conversations-container">
      {/* Friends List */}
      <div className="friends-list">
        <h2>My friends</h2>
        {friends.map((friend) => (
          <div
            key={friend.id}
            className="friend-item"
            onClick={() => handleClick(friend.id)}
          >
            {friend.username}
          </div>
        ))}
      </div>

      {/* Chat Area */}
      <div className="chat-area">
        {friendClicked ? (
          <>
            <h2 className="chat">Chat with {friendClicked.username}</h2>
            <div className="messages-container">
              {allMessages.map((msg) => {
                const messageTime = new Date(msg.createdAt).toLocaleTimeString(
                  [],
                  { hour: "2-digit", minute: "2-digit" }
                );

                return (
                  <div
                    key={msg.id}
                    className={`message-wrapper ${
                      msg.senderId === user.userId
                        ? "my-message-wrapper"
                        : "other-message-wrapper"
                    }`}
                  >
                    <p
                      className={`message ${
                        msg.senderId === user.userId
                          ? "my-message"
                          : "other-message"
                      }`}
                    >
                      {msg.text}
                    </p>
                    <span className="message-time">{messageTime}</span>
                  </div>
                );
              })}

              {/* Scroll target */}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <input
                className="message-input"
                value={sentMessage}
                onChange={(e) => setSentMessage(e.target.value)}
                placeholder="Type a message"
              />
              <button className="send-button" onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        ) : (
          <p>Select a friend to start chatting</p>
        )}
      </div>
    </div>
  );
}
