import prisma from "../db.js";
import { getUserId } from "../utils/getUserId.js";
import { io } from "../server.js";
import { type Request, type Response } from "express";

export const getGroups = async (req: Request, res: Response) => {
  const userId = getUserId(req);

  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: Number(userId) } } },
      orderBy: { createdAt: "desc" },
      include: { members: true, messages: true },
    });

    res.json(groups);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};

export const addGroup = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Group name is required" });
  }

  try {
    const group = await prisma.group.create({
      data: {
        name,
        members: { create: { userId: Number(userId) } },
      },
      include: { members: true },
    });

    res.status(201).json(group);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  try {
    const group = await prisma.group.findFirst({
      where: { id: Number(id), members: { some: { userId: Number(userId) } } },
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
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};

export const newGroupMsg = async (req: Request, res: Response) => {
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ error: "No data received. Ensure Multer is configured." });
    }

    const fileUrl = req.file ? req.file.path : null;
    const userId = getUserId(req);
    const { groupId, text } = req.body;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!groupId) {
      return res.status(400).json({ error: "groupId is required" });
    }

    const parsedGroupId = parseInt(groupId, 10);
    if (isNaN(parsedGroupId)) {
      return res.status(400).json({ error: "groupId must be a valid number" });
    }

    const isMember = await prisma.groupMember.findFirst({
      where: { groupId: parsedGroupId, userId: Number(userId) },
    });

    if (!isMember) return res.status(403).json({ error: "Not a member" });

    const message = await prisma.groupMessage.create({
      data: {
        text: text || "",
        groupId: parsedGroupId,
        senderId: Number(userId),
        fileUrl,
      },
      include: { sender: { select: { id: true, username: true } } },
    });

    io.to(`group_${groupId}`).emit("newMessage", message);
    res.status(201).json(message);
  } catch (error: unknown) {
    console.error("Critical Error in newGroupMsg:", error);
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};

export const addToGroup = async (req: Request, res: Response) => {
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

export const getAvailableFriends = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  try {
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId: Number(id) },
      select: { userId: true },
    });

    const availableFriendsRaw = await prisma.friend.findMany({
      where: {
        userId: Number(userId),
        friendId: { notIn: groupMembers.map((member) => member.userId) },
      },
      include: { friend: { select: { id: true, username: true } } },
    });

    const availableFriends = availableFriendsRaw.map((f) => ({
      id: f.friend.id,
      username: f.friend.username,
    }));

    res.json(availableFriends);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { groupId } = req.body;
  try {
    await prisma.groupMember.deleteMany({
      where: { groupId: Number(groupId), userId: Number(userId) },
    });
    res.json({ message: "Left group successfully" });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};
