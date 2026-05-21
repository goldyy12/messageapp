import prisma from "../db";
import { getUserId } from "../utils/getUserId";
import { io } from "../server";
import { type Request, type Response } from "express";
import redisClient, { connectRedis } from "../lib/redis";
import { group } from "console";

export const getGroups = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const uID = Number(userId);

  console.log("Fetching groups for userId:", userId);

  if (!userId || isNaN(uID)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const cacheKey = `groups:${uID}`;

  try {
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log("⚡ Groups from Redis cache");
      return res.json(JSON.parse(cached));
    }

    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: uID } } },
      orderBy: { createdAt: "desc" },
      include: { members: true, messages: true },
    });

    await redisClient.set(cacheKey, JSON.stringify(groups), {
      EX: 60 * 5,
    });

    console.log("💾 Groups cached");

    return res.json(groups);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
};

export const addGroup = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const uID = Number(userId);
  const { name } = req.body;

  if (!userId || isNaN(uID)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!name) {
    return res.status(400).json({ error: "Group name is required" });
  }

  try {
    const group = await prisma.group.create({
      data: {
        name,
        members: { create: { userId: uID } },
      },
      include: { members: true },
    });

    await redisClient.del(`groups:${uID}`);
    await redisClient.del(`group:${group.id}`);

    return res.status(201).json(group);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
};

export const getGroupById = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const uID = Number(userId);
  const { id } = req.params;

  try {
    if (!userId || isNaN(uID)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const cacheKey = `group:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const group = await prisma.group.findFirst({
      where: { id: Number(id), members: { some: { userId: uID } } },
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

    await redisClient.set(cacheKey, JSON.stringify(group), {
      EX: 60 * 5,
    });

    res.json(group);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};

export const newGroupMsg = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const uID = Number(userId);
  try {
    if (!req.body) {
      return res
        .status(400)
        .json({ error: "No data received. Ensure Multer is configured." });
    }

    const fileUrl = req.file ? req.file.path : null;

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

    await redisClient.del(`group:${parsedGroupId}`);
    await redisClient.del(`groups:${uID}`);
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
  const uID = Number(userId);

  if (!userId || isNaN(uID)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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
    await redisClient.del(`group:${groupId}`);
    await redisClient.del(`groups:${userId}`);

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
    await redisClient.del(`group:${groupId}`);
    await redisClient.del(`groups:${userId}`);

    res.json({ message: "Left group successfully" });
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};
