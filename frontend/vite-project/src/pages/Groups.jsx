import { useEffect, useState } from "react";
import api from "../api";
import "../styles/groups.css";
import socket from "../socket";

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
    try {
      if (!newGroupName.trim()) return;
      const res = await api.post("/groups", { name: newGroupName });
      console.log("Group created:", res.data);
      setNewGroupName("");
      getGroups();
    } catch (error) {
      console.log(error);
    }
  };
  const getFriends = async () => {
    try {
      const res = await api.get("/friends");
      setFriends(res.data);
      console.log(friends);
    } catch (error) {
      console.error("Failed to load friends", error);
    }
  };
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim()) return;

    await api.post("/groups/message", {
      groupId: selectedGroup.id,
      text: messageText,
    });

    setMessageText("");
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

  const handleGroupClick = async (id) => {
    try {
      const res = await api.get(`/groups/${id}`);
      setSelectedGroup(res.data);
      setGroupMessages(res.data.messages);
      console.log(selectedGroup);
    } catch (err) {
      console.error("Failed to load group", err);
    }
  };
  const addMember = async (memberId) => {
    try {
      const res = await api.post("/groups/addmember", {
        groupId: selectedGroup.id,
        memberID: memberId,
      });
      alert(`${res.data.userId} added to group!`);

      console.log("Member added:", res.data);
    } catch (error) {
      console.error("Failed to add member", error.response?.data || error);
    }
  };

  if (isLoading) return <p>Loading groups...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h3>Groups</h3>

      <div className="container">
        <div className="left">
          <div className="add-group">
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name"
            />
            <button onClick={addGroup}>Add Group</button>
          </div>
          {groups.length === 0 ? (
            <p>No groups found</p>
          ) : (
            groups.map((group) => (
              <p
                key={group.id}
                onClick={() => handleGroupClick(group.id)}
                style={{ cursor: "pointer" }}
              >
                {group.name}
              </p>
            ))
          )}
        </div>

        <div className="right">
          {!selectedGroup ? (
            <p>Select a group</p>
          ) : (
            <>
              <div className="messages">
                {groupMessages.length === 0 ? (
                  <p>No messages yet, write one</p>
                ) : (
                  groupMessages.map((message) => (
                    <p key={message.id}>
                      <strong>{message.sender.username}:</strong> {message.text}
                    </p>
                  ))
                )}
              </div>

              <form onSubmit={sendMessage} className="message-form">
                <input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                />
                <button type="submit">Send</button>
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
                    <button onClick={() => addMember(friend.id)}>
                      Add member
                    </button>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
