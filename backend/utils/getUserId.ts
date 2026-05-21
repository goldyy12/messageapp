import { type Request } from "express";

export const getUserId = (req: Request): number | undefined => req.user?.userId;
