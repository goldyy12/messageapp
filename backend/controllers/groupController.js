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
  const userId = getUserId(req);
  const { groupId, text } = req.body;

  try {
    const isMember = await prisma.groupMember.findFirst({
      where: { groupId: Number(groupId), userId },
    });

    if (!isMember)
      return res
        .status(403)
        .json({ error: "You are not a member of this group" });

    const message = await prisma.groupMessage.create({
      data: { text, groupId: Number(groupId), senderId: userId },
      include: { sender: { select: { id: true, username: true } } },
    });
    io.to(`group_${groupId}`).emit("newMessage", message);
    res.status(201).json(message);
  } catch (error) {
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

    // 3️⃣ Add member
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
