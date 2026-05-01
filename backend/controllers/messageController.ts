import prisma from "../db.js";
import { getUserId } from "../utils/getUserId.js";
import { io, onlineUsers } from "../server.js";
import { type Request, type Response } from "express";

export const sendMessage = async (req: Request, res: Response) => {
  const senderId = getUserId(req);
  const { receiverId, text } = req.body || {}; // safe fallback
  const fileUrl = req.file ? req.file.path : null;

  console.log("CONTENT-TYPE:", req.headers["content-type"]);
  console.log("REQ.BODY:", req.body);
  console.log("REQ.FILE:", req.file);
  if (!senderId) return res.status(401).json({ error: "Unauthorized" });

  const receiverIdNum = Number(receiverId);
  if (!receiverIdNum || (!text && !fileUrl)) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const message = await prisma.message.create({
      data: {
        senderId: Number(senderId),
        recipientId: receiverIdNum,
        text: text || "",
        fileUrl,
      },
    });

    const receiverSocketId = onlineUsers.get(receiverIdNum);
    if (receiverSocketId)
      io.to(receiverSocketId).emit("privateMessage", message);

    const senderSocketId = onlineUsers.get(senderId);
    if (senderSocketId) io.to(senderSocketId).emit("privateMessage", message);

    res.status(201).json(message);
  } catch (error: unknown) {
    console.error("SEND MESSAGE ERROR:", error);
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    res.status(500).json({ error: msg });
  }
};
export const getMessages = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const friendId = Number(req.params.friendId);

  try {
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const fId = Number(friendId);
    const uId = Number(userId);
    if (!fId || fId <= 0) {
      return res.status(400).json({ error: "Invalid friendId" });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: uId, recipientId: fId },
          { senderId: fId, recipientId: uId },
        ],
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(messages);
  } catch (error: unknown) {
    const msg =
      error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: msg });
  }
};
