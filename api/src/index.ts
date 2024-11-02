import express from "express";
import cors from "cors";
import { orderRouter } from "./routes/order";
import { orderBookRouter } from "./routes/orderbook";
import { balanceRouter } from "./routes/balance";
import { stocksRouter } from "./routes/stocks";
import { userRouter } from "./routes/user";
import { redisManager } from "./lib/redis";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/order", orderRouter);
app.use("/orderbook", orderBookRouter);
app.use("/balance", balanceRouter);
app.use("/symbol", stocksRouter);
app.use("/user", userRouter);

app.post("/onramp/inr", async (req: any, res: any) => {
  const { userId, amount }: { userId: string; amount: number } = req.body;
  const response = await redisManager.sendRequestAndSubscribe({
    action: "ONRAMP_INR",
    data: {
      userId,
      amount,
    },
  });

  console.log("Response Recieved", response);
  res.json(response);
});

app.post("/reset", async (req: any, res: any) => {
  const response = await redisManager.sendRequestAndSubscribe({
    action: "RESET",
    data: {},
  });

  console.log("Response Recieved", response);
  res.json(response);
});

async function startServer() {
  try {
    await redisManager;
    console.log("Connected to Redis Clients 🚀");
    app.listen(3000, () => {
      console.log("Server started on port 3000 🚀");
    });
  } catch (error) {
    console.error("Something Didn't Worked 👀", error);
  }
}

startServer();
