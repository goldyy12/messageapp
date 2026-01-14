import { useState, useEffect, useContext ,useRef} from "react";
import api from "../api";
import "../styles/groups.css";
import socket from "../socket";
import { AuthContext } from "../context/AuthContext.jsx";

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
    const messagesEndRef = useRef(null);

  
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
      console.error(err);
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
    } catch (err) {
      console.error(err);
    }
  };

const getFriends = async () => {
  if (!selectedGroup) return;

  try {
    const res = await api.get(
      `/groups/${selectedGroup.id}/available-friends`
    );
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
    await api.post("/groups/addmember", {
      groupId: selectedGroup.id,
      memberID: memberId,
    });

    setFriends((prev) => {
      const updated = prev.filter((f) => f.id !== memberId);
      if (updated.length === 0) setFriendsMenu(false);
      return updated;
    });

  } catch (err) {
    console.error(err);
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

      
      <div className="groups-right">
         

        {!selectedGroup ? (
          <div className="empty-state">
            <div className="icon-circle">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h2>Select a Group</h2>
            <p>Pick a community from the left sidebar to join the conversation.</p>
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
            <button className="leave" onClick={leaveGroup}>Leave</button>
            </div>
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
              <div ref={messagesEndRef} />
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

           
           {friendsMenu && (
  <div className="modal-overlay" onClick={() => setFriendsMenu(false)}>
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
