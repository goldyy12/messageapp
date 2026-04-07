import { useState, useEffect, useContext, useRef } from "react";
import api from "../api";
import "../styles/conversations.css";
import { AuthContext } from "../context/authContext.jsx";
import socket from "../socket";

export default function Conversations() {
  const [friends, setFriends] = useState([]);
  const [friendClicked, setFriendClicked] = useState(null);
  const [sentMessage, setSentMessage] = useState("");
  const [allMessages, setAllMessages] = useState([]);
  const [file, setFile] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.userId) return;
    socket.emit("joinUser", user.userId);

    return () => {
      socket.off("privateMessage");
    };
  }, [user]);

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
  const handlekeyDown = (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

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
      // Reverse messages so oldest appear first
      setAllMessages(
        res.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      );
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const sendMessage = async () => {
    if ((!sentMessage && !file) || !friendClicked) return;

    try {
      const formData = new FormData();
      formData.append("text", sentMessage || ""); // always include text
      formData.append("receiverId", friendClicked.id);
      if (file) formData.append("file", file);

      const res = await api.post("/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setAllMessages((prev) => [...prev, res.data]);
      setSentMessage("");
      setFile(null);
    } catch (error) {
      console.error("Failed to send message", error);
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  return (
    <div className="conversations-container">
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

      <div className="chat-area">
        {friendClicked ? (
          <>
            <h2 className="chat">Chat with {friendClicked.username}</h2>
            <div className="messages-container">
              {allMessages.map((msg) => {
                const messageTime = new Date(msg.createdAt).toLocaleString([], {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={msg.id}
                    className={`message-wrapper ${
                      msg.senderId === user.userId
                        ? "my-message-wrapper"
                        : "other-message-wrapper"
                    }`}
                  >
                    <div
                      className={`message ${
                        msg.senderId === user.userId
                          ? "my-message"
                          : "other-message"
                      }`}
                    >
                      {/* Render the image if fileUrl exists */}
                      {msg.fileUrl && (
                        <img
                          src={msg.fileUrl}
                          alt="attachment"
                          className="chat-image"
                          onClick={() => window.open(msg.fileUrl, "_blank")}
                        />
                      )}

                      {/* Render the text if it exists */}
                      {msg.text && <p className="message-text">{msg.text}</p>}
                    </div>
                    <span className="message-time">{messageTime}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <label htmlFor="file-upload" className="file-upload-label">
                📎
              </label>
              <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files[0])}
                style={{ display: "none" }}
              />
              <input
                className="message-input"
                value={sentMessage}
                onChange={(e) => setSentMessage(e.target.value)}
                placeholder={
                  file ? `Attached: ${file.name}` : "Type a message..."
                }
                onKeyDown={handlekeyDown}
              />
              <button className="send-button" onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <div className="icon-circle">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h2>Select a Friend</h2>
            <p>Select a friend to join the conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
