import prisma from "../db";
import { getUserId } from "../utils/getUserId";
import { type Request, type Response } from "express";
import { type User } from "@prisma/client";
import redisClient, { connectRedis } from "../lib/redis";

export const getFriends = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const uID = Number(userId);

  if (!userId || isNaN(uID)) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const cacheKey = `friends:${uID}`;

  try {
    const cached = await redisClient.get(cacheKey);

    if (cached) {
      console.log("⚡ Friends from Redis cache");
      return res.json(JSON.parse(cached));
    }

    const friends = await prisma.friend.findMany({
      where: { userId: uID },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
            profilePic: true,
          },
        },
      },
    });

    const friendList = friends.map((f) => f.friend);

    const uniqueFriends = Array.from(
      new Map(friendList.map((f) => [f.id, f])).values(),
    );

  
    await redisClient.set(cacheKey, JSON.stringify(uniqueFriends));

    console.log("💾 Friends retrieved from DB and cached");

   
    return res.json(uniqueFriends);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal error";
    return res.status(500).json({ error: msg });
  }
};
export const getAvailableFriends = async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const uID = Number(userId);

  
  if (isNaN(uID)) {
    console.error("ID Conversion failed. Original userId:", userId);
    return res.status(400).json({ error: "Invalid user ID format" });
  }

  try {
    const cacheKey = `availableFriends:${uID}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      console.log("⚡ Available friends from Redis cache");
      return res.json(JSON.parse(cached));
    }
    const existingFriends = await prisma.friend.findMany({
      where: { userId: uID },
      select: { friendId: true },
    });

    const excludedIds: number[] = [
      uID,
      ...existingFriends.map((f) => f.friendId),
    ];

    const availableUsers = await prisma.user.findMany({
      where: {
        id: { notIn: excludedIds },
      },
      select: {
        id: true,
        username: true,
        profilePic: true,
      },
    });
    await redisClient.set(cacheKey, JSON.stringify(availableUsers), {
      EX: 60 * 5, // Cache for 5 minutes
    });

    res.json(availableUsers);
  } catch (error: unknown) {
    console.error("getAvailableFriends error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    res.status(500).json({ error: msg });
  }
};

export const addFriend = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { friendId } = req.body;

  if (!friendId) {
    return res.status(400).json({ error: "friendId is required" });
  }

  if (userId === friendId) {
    return res.status(400).json({ error: "You cannot add yourself" });
  }

  try {
    const uID = Number(userId);
    const fID = Number(friendId);
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId: uID, friendId: fID },
          { userId: fID, friendId: uID },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already friends" });
    }

    await prisma.$transaction([
      prisma.friend.create({ data: { userId: uID, friendId: fID } }),
      prisma.friend.create({ data: { userId: fID, friendId: uID } }),
    ]);

    await Promise.all([
      redisClient.del(`friends:${uID}`),
      redisClient.del(`friends:${fID}`),
      redisClient.del(`availableFriends:${uID}`),
      redisClient.del(`availableFriends:${fID}`),
    ]);

    return res.status(201).json({
      message: "Friend added successfully",
    });
  } catch (error: unknown) {
    console.error(error);
    const msg =
      error instanceof Error ? error.message : "Internal server error";
    return res.status(500).json({ error: msg });
  }
};
export const getFriendsOnline = async (req: Request, res: Response) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userFriends = await prisma.friend.findMany({
      where: { userId: Number(userId) },
      select: { friendId: true },
    });

    const friendIds = userFriends.map((f) => f.friendId);

    if (friendIds.length === 0) {
      return res.json([]);
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const onlineFriends = await prisma.user.findMany({
      where: {
        AND: [{ id: { in: friendIds } }, { lastActive: { gte: oneHourAgo } }],
      },
      select: {
        id: true,
        username: true,
        lastActive: true,
      },
    });

    return res.json(onlineFriends);
  } catch (error: unknown) {
    console.error("getFriendsOnline error:", error);
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
};
export const getFriendByID = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { id } = req.params;

  const friendId = Number(id);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!id || Number.isNaN(friendId)) {
    return res.status(400).json({ error: "Invalid friend ID" });
  }

  try {
    const friend = await prisma.friend.findUnique({
      where: {
        userId_friendId: {
          userId: Number(userId),
          friendId: Number(friendId),
        },
      },
      include: {
        friend: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!friend) {
      return res.status(404).json({ error: "Friend not found" });
    }

    res.json(friend.friend);
  } catch (error: unknown) {
    console.error("getFriendByID error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    res.status(500).json({ error: msg });
  }
};

export const searchFriends = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const { q } = req.query;

  if (typeof q !== "string" || q.trim() === "") {
    return res.json([]);
  }

  try {
    const friends = await prisma.friend.findMany({
      where: {
        userId: Number(userId),
        friend: {
          username: {
            contains: q,
            mode: "insensitive",
          },
        },
      },
      select: {
        friend: {
          select: {
            id: true,
            username: true,
            profilePic: true,
          },
        },
      },
    });

    const users = friends.map((f) => f.friend);

    res.json(users);
  } catch (error: unknown) {
    console.error("searchFriends error:", error);
    const msg = error instanceof Error ? error.message : "Internal error";
    res.status(500).json({ error: msg });
  }
};
