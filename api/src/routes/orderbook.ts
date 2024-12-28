import { Router } from "express";
import { redisManager } from "../lib/redis";
import { ActionTypes } from "../types/ActionTypes";

export const orderBookRouter = Router();

orderBookRouter.get("/", async (req: any, res: any) => {
  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.GET_ORDERBOOK,
    data: {},
  });

  res.json(response);
});

orderBookRouter.get("/:stockSymbol", async (req: any, res: any) => {
  const stockSymbol = req.params.stockSymbol;

  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.GET_MARKET,
    data: stockSymbol,
  });

  console.log("Response :", response);
  res.json(response);
});
