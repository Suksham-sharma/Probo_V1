import { Router } from "express";
import { redisManager, RedisManager } from "../lib/redis";
import { ActionTypes } from "../types/ActionTypes";

export const stocksRouter = Router();

stocksRouter.post("/create/:stockSymbol", async (req: any, res: any) => {
  const stockSymbol = req.params.stockSymbol;
  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.CREATE_MARKET,
    data: stockSymbol,
  });

  res.json(response);
});
