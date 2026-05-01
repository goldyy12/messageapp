import { type Request } from "express";

export const getUserId = (req: Request): string | undefined => req.user?.userId;
