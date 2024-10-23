import { Router } from "express";
import { redisManager } from "../lib/redis";

export const balanceRouter = Router();

balanceRouter.get("/inr", async (req: any, res: any) => {
  const response = await redisManager.sendRequestAndSubscribe({
    action: "GET_INR",
    data: {},
  });

  console.log("Response Recieved", response);
  res.json(response);
});

balanceRouter.get("/stocks", async (req: any, res: any) => {
  const response = await redisManager.sendRequestAndSubscribe({
    action: "GET_STOCKS",
    data: {},
  });

  console.log("Response Recieved", response);
  res.json(response);
});

balanceRouter.get("/inr/:userId", async (req: any, res: any) => {
  const userId = req.params.userId;

  const response = await redisManager.sendRequestAndSubscribe({
    action: "USER_INR",
    data: userId,
  });

  console.log("Response Recieved", response);
  res.json(response);
});

balanceRouter.get("/stock/:userId", async (req: any, res: any) => {
  const userId = req.params.userId;

  const response = await redisManager.sendRequestAndSubscribe({
    action: "USER_STOCKS",
    data: userId,
  });

  console.log("Response Recieved", response);
  res.json(response);
});
