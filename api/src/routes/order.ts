import { Router } from "express";
import { redisManager } from "../lib/redis";
import { ActionTypes } from "../types/ActionTypes";

export const orderRouter = Router();

interface OrderRequestBody {
  userId: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  stockOption: "yes" | "no";
}

orderRouter.post("/buy", async (req: any, res: any) => {
  const {
    userId,
    stockSymbol,
    quantity,
    price,
    stockOption,
  }: OrderRequestBody = req.body;

  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.BUY_ORDER,
    data: {
      userId,
      stockSymbol,
      quantity,
      price,
      stockOption,
    },
  });

  console.log("Response Recieved", response);

  res.json(response);
});

orderRouter.post("/sell", async (req: any, res: any) => {
  const {
    userId,
    stockSymbol,
    quantity,
    price,
    stockOption,
  }: OrderRequestBody = req.body;

  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.SELL_ORDER,
    data: {
      userId,
      stockSymbol,
      quantity,
      price,
      stockOption,
    },
  });

  console.log("Response Recieved", response);

  res.json(response);
});
