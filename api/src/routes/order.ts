import { Router } from "express";
import { redisManager } from "../lib/redis";
import { ActionTypes } from "../types/ActionTypes";

export const orderRouter = Router();

interface OrderRequestBody {
  userId: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  stockType: "yes" | "no";
}

interface OrderCancelBody {
  userId: string;
  stockSymbol: string;
  price: number;
  orderId: string;
  stockType: string;
}

orderRouter.post("/buy", async (req: any, res: any) => {
  const { userId, stockSymbol, quantity, price, stockType }: OrderRequestBody =
    req.body;

  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.BUY_ORDER,
    data: {
      userId,
      stockSymbol,
      quantity,
      price,
      stockType,
    },
  });

  console.log("Response Recieved", response);

  res.json(response);
});

orderRouter.post("/sell", async (req: any, res: any) => {
  const { userId, stockSymbol, quantity, price, stockType }: OrderRequestBody =
    req.body;

  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.SELL_ORDER,
    data: {
      userId,
      stockSymbol,
      quantity,
      price,
      stockType,
    },
  });

  console.log("Response Recieved", response);

  res.json(response);
});

orderRouter.post("/cancel", async (req: any, res: any) => {
  const { userId, stockSymbol, price, orderId, stockType }: OrderCancelBody =
    req.body;

  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.CANCEL_ORDER,
    data: {
      userId,
      stockSymbol,
      price,
      orderId,
      stockType,
    },
  });
  res.json(response);
});
