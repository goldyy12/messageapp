import { useState, useEffect, useContext, useRef } from "react";
import api from "../api.js";
import "../styles/groups.css";
import socket from "../socket.js";
import { AuthContext } from "../context/authContext.js";
import { type Friend, type Group, type Message } from "../types/messages.js";
import { useAuth } from "../context/useAuth.js";
import axios, { AxiosError } from "axios";

export default function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState<string>("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsMenu, setFriendsMenu] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const { user } = useAuth();

  const getGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        setError(axiosError.response?.data.error || "Failed to load groups");
      } else {
        console.error("Failed to load groups", err);
        setError("Failed to load groups");
      }
    } finally {
      setIsLoading(false);
    }
  };
  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await api.post("/groups", { name: newGroupName });
      setNewGroupName("");
      getGroups();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        console.error("Add group failed:", axiosError.response?.data.error);
      } else {
        console.error(
          "Add group failed:",
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    }
  };

  const leaveGroup = async () => {
    if (!selectedGroup) return;
    try {
      await api.delete("/groups/leavegroup", {
        data: { groupId: selectedGroup.id },
      });
      setSelectedGroup(null);
      getGroups();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Leave group failed:", err.response?.data.error);
      } else {
        console.error(
          "Leave group failed:",
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    }
  };

  const getFriends = async () => {
    if (!selectedGroup) return;

    try {
      const res = await api.get(
        `/groups/${selectedGroup.id}/available-friends`,
      );
      setFriends(res.data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<{ error: string }>;
        console.error("Get friends failed:", axiosError.response?.data.error);
      } else {
        console.error(
          "Get friends failed:",
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    }
  };

  const sendMessage = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if ((!messageText.trim() && !file) || !selectedGroup) return;

    try {
      const formData = new FormData();
      formData.append("groupId", String(selectedGroup.id));
      if (messageText) formData.append("text", messageText);
      if (file) formData.append("file", file);

      const res = await api.post("/groups/message", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setGroupMessages((prev) => [...prev, res.data]);
      setMessageText("");
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
    }
  };
  const handleGroupClick = async (id: number) => {
    try {
      const res = await api.get(`/groups/${id}`);
      setSelectedGroup(res.data);
      setGroupMessages(res.data.messages);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error(
          "Failed to load group details:",
          err.response?.data.error,
        );
      } else {
        console.error(
          "Failed to load group details:",
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    }
  };

  const addMember = async (memberId: number) => {
    try {
      await api.post("/groups/addmember", {
        groupId: selectedGroup?.id,
        memberID: memberId,
      });

      setFriends((prev) => {
        const updated = prev.filter((f) => f.id !== memberId);
        if (updated.length === 0) setFriendsMenu(false);
        return updated;
      });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        console.error("Add member failed:", err.response?.data.error);
      } else {
        console.error(
          "Add member failed:",
          err instanceof Error ? err.message : "Unknown error",
        );
      }
    }
  };

  useEffect(() => {
    getGroups();
  }, []);
  useEffect(() => {
    scrollToBottom();
  }, [groupMessages]);

  useEffect(() => {
    if (!selectedGroup) return;

    socket.emit("joinGroup", selectedGroup.id);

    const handleNewMessage = (message: any) => {
      // Only add if message belongs to the currently active group
      if (message.groupId === selectedGroup.id) {
        setGroupMessages((prev) => [...prev, message]);
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.emit("leaveGroup", selectedGroup.id); // Add 'leave' event on backend
    };
  }, [selectedGroup]);
  if (isLoading) return <p>Loading groups...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="groups-container">
      <div className="groups-left">
        <div className="add-group">
          <input
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            placeholder="New group name"
          />
          <button onClick={addGroup}>Add Group</button>
        </div>

        <div className="groups-list">
          {groups.map((group) => (
            <p
              key={group.id}
              className={`group-item ${selectedGroup?.id === group.id ? "active-group" : ""}`}
              onClick={() => handleGroupClick(group.id)}
            >
              {group.name}
            </p>
          ))}
        </div>
      </div>

      <div className="groups-right">
        {!selectedGroup ? (
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
            <h2>Select a Group</h2>
            <p>
              Pick a community from the left sidebar to join the conversation.
            </p>
          </div>
        ) : (
          <>
            <div className="buttons">
              <button
                className="add"
                onClick={() => {
                  setFriendsMenu((prev) => !prev);
                  getFriends();
                }}
              >
                +
              </button>
              <button className="leave" onClick={leaveGroup}>
                Leave
              </button>
            </div>
            <div className="messages-container">
              {groupMessages.map((msg) => {
                const time = new Date(msg.createdAt).toLocaleString([], {
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const isMyMessage = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`message-wrapper ${isMyMessage ? "my-message-wrapper" : "other-message-wrapper"}`}
                  >
                    {/* Combined Message Bubble */}
                    <div
                      className={`message ${isMyMessage ? "my-message" : "other-message"}`}
                    >
                      <strong>{msg.sender.username || "Unknown User"}:</strong>

                      {/* Render text if it exists */}
                      {msg.text && <p className="message-text">{msg.text}</p>}

                      {/* Render file inside the same bubble */}
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
                              style={{ cursor: "pointer", marginTop: "5px" }}
                              onClick={() => window.open(msg.fileUrl, "_blank")}
                            >
                              <span className="file-icon">📄</span>
                              <span>View PDF Document</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <span className="message-time">{time}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="input-container">
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
                value={messageText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMessageText(e.target.value)
                }
                placeholder={
                  file ? `Attached: ${file.name}` : "Type a message..."
                }
              />
              <button className="send-button" type="submit">
                Send
              </button>
            </form>

            {friendsMenu && (
              <div
                className="modal-overlay"
                onClick={() => setFriendsMenu(false)}
              >
                <div
                  className="modal-content"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3>Add members</h3>

                  <div className="modal-friends-list">
                    {friends.map((friend) => (
                      <div key={friend.id} className="friend-item">
                        <p>{friend.username}</p>
                        <button onClick={() => addMember(friend.id)}>
                          Add member
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    className="modal-close"
                    onClick={() => setFriendsMenu(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
