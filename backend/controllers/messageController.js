import prisma from "../db.js";
import { getUserId } from "../utils/getUserId.js";

export const sendMessage = async (req, res) => {
  const senderId = getUserId(req);
  const { receiverId, text } = req.body;

  if (!senderId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!receiverId || !text) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const message = await prisma.message.create({
      data: {
        senderId,
        recipientId,
        text,
      },
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
export const getMessages = async (req, res) => {
  const userId = getUserId(req);
  const { friendId } = req.params;

  try {
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, recipientId: friendId },
          { senderId: friendId, recipientId: userId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
