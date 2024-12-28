import { Router } from "express";
import { redisManager } from "../lib/redis";
import { ActionTypes } from "../types/ActionTypes";

export const userRouter = Router();
userRouter.post("/create/:userId", async (req: any, res: any) => {
  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.CREATE_USER,
    data: req.params.userId,
  });

  res.json(response);
});
