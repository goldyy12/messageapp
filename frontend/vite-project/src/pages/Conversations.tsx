import { useState, useEffect, useRef } from "react";
import api from "../api.js";
import socket from "../socket.js";
import { useAuth } from "../context/useAuth.js";
import { type Friend, type Message } from "../types/messages.js";
import "../styles/chat.css";

export default function Conversations() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendClicked, setFriendClicked] = useState<Friend | null>(null);
  const [sentMessage, setSentMessage] = useState("");
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const friendRef = useRef<Friend | null>(null);

  const { user } = useAuth();

  // keep latest friend in ref (fix stale socket bug)
  useEffect(() => {
    friendRef.current = friendClicked;
  }, [friendClicked]);

  // join socket room
  useEffect(() => {
    if (!user?.id) return;
    socket.emit("joinUser", user.id);

    return () => {
      socket.off("privateMessage");
    };
  }, [user]);

  // socket listener (fixed)
  useEffect(() => {
    const handler = (message: Message) => {
      const friend = friendRef.current;
      if (!friend) return;

      const valid =
        message.senderId === friend.id || message.receiverId === friend.id;

      setAllMessages((prev) => (valid ? [...prev, message] : prev));
    };

    socket.on("privateMessage", handler);

    return () => {
      socket.off("privateMessage", handler);
    };
  }, []);

  // scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages]);

  // load friends
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

  // click friend
  const handleClick = async (id: number) => {
    try {
      const res = await api.get(`/friends/${id}`);
      setFriendClicked(res.data);
      getMessages(String(id));
    } catch (err) {
      console.error("Failed to fetch friend", err);
    }
  };

  // get messages
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

  // send message
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage();
  };

  const isImage = (url: string) => /\.(jpg|jpeg|png|webp|gif)$/i.test(url);

  return (
    <div className="chat-container">
      {/* Sidebar */}
      <div className="chat-sidebar">
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

            <div className="chat-messages">
              {allMessages.map((msg) => {
                const isMyMessage = String(msg.senderId) === String(user?.id);

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
                    className={`chat-message-wrapper ${
                      isMyMessage ? "mine" : ""
                    }`}
                  >
                    <div
                      className={`chat-message ${
                        isMyMessage ? "mine" : "other"
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
                              <span>📄</span>
                              <p>View Document</p>
                            </div>
                          )}
                        </div>
                      )}

                      {msg.text && <p className="message-text">{msg.text}</p>}
                    </div>

                    <span className="message-time">{messageTime}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-container">
              <label htmlFor="file-upload" className="file-upload-label">
                📎
              </label>

              <input
                id="file-upload"
                type="file"
                ref={fileInputRef}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: "none" }}
              />

              <input
                className="chat-input"
                value={sentMessage}
                onChange={(e) => setSentMessage(e.target.value)}
                placeholder={
                  file ? `Attached: ${file.name}` : "Type a message..."
                }
                onKeyDown={handleKeyDown}
              />

              <button className="chat-send" onClick={sendMessage}>
                Send
              </button>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <h2>Select a Friend</h2>
            <p>Select a friend to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
