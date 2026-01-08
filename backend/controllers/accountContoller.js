import prisma from "../db.js";
import { getUserId } from "../utils/getUserId.js";
import bcrypt from "bcryptjs";

export const changePassword = async (req, res) => {
  const { oldpassword, newpassword, confirmnewpassword } = req.body;
  const userId = getUserId(req);

  if (!oldpassword || !newpassword || !confirmnewpassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (newpassword !== confirmnewpassword) {
    return res.status(400).json({ error: "New passwords do not match" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldpassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newpassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};
