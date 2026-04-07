import prisma from "../db.js";
import { getUserId } from "../utils/getUserId.js";
import { io } from "../server.js";
export const getGroups = async (req, res) => {
  const userId = getUserId(req);

  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId } } },
      orderBy: { createdAt: "desc" },
      include: { members: true, messages: true },
    });

    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addGroup = async (req, res) => {
  const userId = getUserId(req);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Group name is required" });
  }

  try {
    const group = await prisma.group.create({
      data: {
        name,
        members: { create: { userId } },
      },
      include: { members: true },
    });

    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGroupById = async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  try {
    const group = await prisma.group.findFirst({
      where: { id: Number(id), members: { some: { userId } } },
      include: {
        members: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          include: { sender: { select: { id: true, username: true } } },
        },
      },
    });

    if (!group)
      return res
        .status(404)
        .json({ error: "Group not found or access denied" });

    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const newGroupMsg = async (req, res) => {
  // Cloudinary/Multer puts the URL in req.file.path
  const fileUrl = req.file ? req.file.path : null;

  const userId = getUserId(req);
  const { groupId, text } = req.body;

  // 1. Check if groupId exists
  if (!groupId) {
    return res.status(400).json({ error: "groupId is required" });
  }

  // 2. Convert to number safely
  const parsedGroupId = parseInt(groupId, 10);

  // 3. Check if conversion resulted in NaN
  if (isNaN(parsedGroupId)) {
    return res.status(400).json({ error: "groupId must be a valid number" });
  }

  try {
    const isMember = await prisma.groupMember.findFirst({
      where: { groupId: parsedGroupId, userId },
    });

    if (!isMember)
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });

    const message = await prisma.groupMessage.create({
      data: {
        text: text || "", // Ensure text is at least an empty string
        groupId: parsedGroupId,
        senderId: userId,
        fileUrl,
      },
      include: { sender: { select: { id: true, username: true } } },
    });

    io.to(`group_${groupId}`).emit("newMessage", message);
    res.status(201).json(message);
  } catch (error) {
    console.error("Prisma Error:", error.message); // This shows in your terminal
    res.status(500).json({ error: error.message });
  }
};

export const addToGroup = async (req, res) => {
  const userId = getUserId(req);

  const { groupId, memberID } = req.body;

  try {
    const alreadyMember = await prisma.groupMember.findFirst({
      where: {
        groupId: Number(groupId),
        userId: Number(memberID),
      },
    });

    if (alreadyMember) {
      return res.status(400).json({ error: "User already in group" });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: Number(groupId),
        userId: Number(memberID),
      },
    });

    res.status(201).json(member);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to add member" });
  }
};

export const getAvailableFriends = async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  try {
    // Get current group members
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId: Number(id) },
      select: { userId: true },
    });

    // Get friends NOT in the group
    const availableFriendsRaw = await prisma.friend.findMany({
      where: {
        userId,
        friendId: { notIn: groupMembers.map((member) => member.userId) },
      },
      include: { friend: { select: { id: true, username: true } } },
    });

    // Map to simple structure
    const availableFriends = availableFriendsRaw.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
    }));

    res.json(availableFriends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const leaveGroup = async (req, res) => {
  const userId = getUserId(req);
  const { groupId } = req.body;
  try {
    await prisma.groupMember.deleteMany({
      where: { groupId: Number(groupId), userId },
    });
    res.json({ message: "Left group successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
