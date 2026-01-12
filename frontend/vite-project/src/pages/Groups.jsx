import { useState, useEffect, useContext } from "react";
import api from "../api";
import "../styles/groups.css";
import socket from "../socket";
import { AuthContext } from "../context/AuthContext";

export default function Groups() {
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [friends, setFriends] = useState([]);
  const [friendsMenu, setFriendsMenu] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const { user } = useContext(AuthContext);

  const getGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data);
    } catch (err) {
      setError("Failed to load groups");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      await api.post("/groups", { name: newGroupName });
      setNewGroupName("");
      getGroups();
    } catch (err) {
      console.error(err);
    }
  };

  const getFriends = async () => {
    try {
      const res = await api.get("/friends");
      setFriends(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedGroup) return;

    try {
      const res = await api.post("/groups/message", {
        groupId: selectedGroup.id,
        text: messageText,
      });
      setGroupMessages((prev) => [...prev, res.data]);
      setMessageText("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleGroupClick = async (id) => {
    try {
      const res = await api.get(`/groups/${id}`);
      setSelectedGroup(res.data);
      setGroupMessages(res.data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const addMember = async (memberId) => {
    try {
      const res = await api.post("/groups/addmember", {
        groupId: selectedGroup.id,
        memberID: memberId,
      });
      alert(`${res.data.userId} added to group!`);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getGroups();
  }, []);

  useEffect(() => {
    if (!selectedGroup) return;

    socket.emit("joinGroup", selectedGroup.id);

    socket.on("newMessage", (message) => {
      setGroupMessages((prev) => [...prev, message]);
    });

    return () => {
      socket.off("newMessage");
    };
  }, [selectedGroup]);

  if (isLoading) return <p>Loading groups...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="groups-container">
      {/* Left side: groups list */}
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
              className="group-item"
              onClick={() => handleGroupClick(group.id)}
            >
              {group.name}
            </p>
          ))}
        </div>
      </div>

      {/* Right side: chat area */}
      <div className="groups-right">
        {!selectedGroup ? (
          <p>Select a group</p>
        ) : (
          <>
            <div className="messages-container">
              {groupMessages.map((msg) => {
                const time = new Date(msg.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                const isMyMessage = msg.senderId === user.userId;

                return (
                  <div
                    key={msg.id}
                    className={`message-wrapper ${
                      isMyMessage
                        ? "my-message-wrapper"
                        : "other-message-wrapper"
                    }`}
                  >
                    <p
                      className={`message ${
                        isMyMessage ? "my-message" : "other-message"
                      }`}
                    >
                      <strong>{msg.sender.username}:</strong> {msg.text}
                    </p>
                    <span className="message-time">{time}</span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={sendMessage} className="input-container">
              <input
                className="message-input"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
              />
              <button className="send-button" type="submit">
                Send
              </button>
            </form>

            <button
              onClick={() => {
                setFriendsMenu((prev) => !prev);
                getFriends();
              }}
            >
              Get Friends
            </button>

            {friendsMenu &&
              friends.map((friend) => (
                <div key={friend.id} className="friend-item">
                  <p>{friend.username}</p>
                  <button onClick={() => addMember(friend.id)}>Add member</button>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
