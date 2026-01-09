import prisma from "../db.js";
import { getUserId } from "../utils/getUserId.js";

export const getFriends = async (req, res) => {
  const userId = getUserId(req);

  try {
    const friends = await prisma.friend.findMany({
      where: { userId },
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
      new Map(friendList.map((f) => [f.id, f])).values()
    );

    res.json(uniqueFriends);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableFriends = async (req, res) => {
  const userId = getUserId(req);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const existingFriends = await prisma.friend.findMany({
      where: { userId },
      select: { friendId: true },
    });

    const excludedIds = [
      userId,
      ...existingFriends.map((f) => f.friendId),
    ].filter(Boolean);

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

    res.json(availableUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addFriend = async (req, res) => {
  const userId = getUserId(req);
  const { friendId } = req.body;

  if (!friendId) {
    return res.status(400).json({ error: "friendId is required" });
  }

  if (userId === friendId) {
    return res.status(400).json({ error: "You cannot add yourself" });
  }

  try {
    const existing = await prisma.friend.findFirst({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already friends" });
    }

    await prisma.friend.createMany({
      data: [
        { userId, friendId },
        { userId: friendId, friendId: userId },
      ],
      skipDuplicates: true,
    });

    return res.status(201).json({
      message: "Friend added successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getFriendsOnline = async (req, res) => {
  const userId = getUserId(req);

  try {
    const userFriends = await prisma.friend.findMany({
      where: { userId },
      select: { friendId: true },
    });

    const friendIds = userFriends.map((f) => f.friendId);

    if (friendIds.length === 0) {
      return res.json([]);
    }
    const fiveMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const onlineFriends = await prisma.user.findMany({
      where: {
        id: { in: friendIds },
        lastActive: { gte: fiveMinutesAgo ,  not:null},
        
      },
      select: {
        id: true,
        username: true,
        lastActive: true,
      },
    });

    res.json(onlineFriends);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.error("getFriendsOnline error:", error)
  }
};

export const searchFriends = async (req, res) => {
  const userId = getUserId(req);
  const { q } = req.query;

  if (!q || q.trim() === "") {
    return res.json([]);
  }

  try {
    const friends = await prisma.friend.findMany({
      where: {
        userId,
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};
