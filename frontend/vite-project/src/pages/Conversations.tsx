import { useState, useEffect, useContext, useRef } from "react";
import api from "../api.js";
import "../styles/conversations.css";
import { AuthContext } from "../context/authContext.js";
import socket from "../socket.js";
import { Link } from "react-router-dom";
import { type Friend, type Message } from "../types/messages.js";
import { useAuth } from "../context/useAuth.js";

export default function Conversations() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendClicked, setFriendClicked] = useState<Friend | null>(null);
  const [sentMessage, setSentMessage] = useState("");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [file, setFile] = useState<null | File>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const { user } = useAuth();

  useEffect(() => {
    if (!user?.userId) return;
    socket.emit("joinUser", user.userId);

    return () => {
      socket.off("privateMessage");
    };
  }, [user]);
  useEffect(() => {
    const handler = (message: Message) => {
      setAllMessages((prev) => {
        if (!friendClicked) return prev;

        const valid =
          message.senderId === friendClicked.id ||
          message.receiverId === friendClicked.id;

        return valid ? [...prev, message] : prev;
      });
    };

    socket.on("privateMessage", handler);

    return () => {
      socket.off("privateMessage", handler);
    };
  }, []); // ✅ run once
  const handlekeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };
  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
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

  const handleClick = async (id: number) => {
    try {
      const res = await api.get(`/friends/${id}`);
      setFriendClicked(res.data);
      getMessages(String(id));
    } catch (err) {
      console.error("Failed to fetch friend", err);
    }
  };

  const getMessages = async (id: string) => {
    try {
      const res = await api.get(`/messages/${id}`);

      setAllMessages(
        res.data.sort(
          (a: Message, b: Message) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        ),
      );
    } catch (error) {
      console.error("Failed to load messages", error);
    }
  };

  const sendMessage = async () => {
    if ((!sentMessage && !file) || !friendClicked) return;

    try {
      const formData = new FormData();
      formData.append("text", sentMessage || "");
      formData.append("receiverId", String(friendClicked.id));
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
            <h2 className="chat">Chat with ddd {friendClicked.username}</h2>
            <div className="messages-container">
              {allMessages.map((msg) => {
                const messageTime = new Date(msg.createdAt).toLocaleString([], {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                console.log("Comparison:", {
                  sender: msg.senderId,
                  me: user?.userId,
                  match: msg.senderId === user?.userId,
                  senderType: typeof msg.senderId,
                  meType: typeof user?.userId,
                });

                return (
                  <div
                    key={msg.id}
                    className={`message-wrapper ${
                      msg.senderId?.toString() === user?.userId?.toString()
                        ? "my-message-wrapper"
                        : "other-message-wrapper"
                    }`}
                  >
                    <div
                      className={`message ${
                        msg.senderId?.toString() === user?.userId?.toString()
                          ? "my-message"
                          : "other-message"
                      }`}
                    >
                      {msg.fileUrl && (
                        <div className="file-attachment">
                          {isImage(msg.fileUrl) ? (
                            <img
                              src={msg.fileUrl}
                              alt="attachment"
                              className="chat-image"
                              onClick={() => window.open(msg.fileUrl, "_blank")}
                            />
                          ) : (
                            <div
                              className="document-link"
                              onClick={() => window.open(msg.fileUrl, "_blank")}
                            >
                              <span className="file-icon">📄</span>
                              <p>View PDF Document</p>
                            </div>
                          )}
                        </div>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFile(e.target.files?.[0] ?? null)
                }
                style={{ display: "none" }}
              />
              <input
                className="message-input"
                value={sentMessage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSentMessage(e.target.value)
                }
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
