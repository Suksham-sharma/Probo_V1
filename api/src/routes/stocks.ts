import { Router } from "express";
import { redisManager, RedisManager } from "../lib/redis";
import cron from "node-cron";
import { ActionTypes } from "../types/ActionTypes";
import axios from "axios";

export const stocksRouter = Router();

stocksRouter.post("/create/:stockSymbol", async (req: any, res: any) => {
  const stockSymbol = req.params.stockSymbol;
  const response = await redisManager.sendRequestAndSubscribe({
    action: ActionTypes.CREATE_MARKET,
    data: stockSymbol,
  });

  res.json(response);
});

// route to create a stockSymbol / Market automattically  after a limited time which is given by user, if the user has
// depending upon the type , automatic or manual , and user also gives a end time after which a end Market function
// will be called to end the market , and according the truth , the results will be created and the market will be ended

async function getCurrentMarketPrice(stockSymbol: string) {
  const response = await axios.get(
    `https://api.coingecko.com/api/v3/simple/price?ids=${stockSymbol}&vs_currencies=inr`
  );
  return response.data;
}

async function createMarketCondition(stockSymbol: string) {
  const CryptoData = await getCurrentMarketPrice(stockSymbol);
  const price = CryptoData[stockSymbol].inr;

  const couldBePrice = (Math.random() > 0.5 ? 1 : -1) * price * 0.02 + price;

  return couldBePrice;
}

type CreateMarketRequestBody = {
  stockSymbol: string;
  type: "automatic" | "manual";
  endsIn?: number;
  sourceOfTruth: "automatic" | "manual_trigger";
  endTime?: number;
  heading?: string;
  eventType?: string;
  repeatTime?: number;
};

const automMaticMarketsAllowed = ["bitcoin", "ethereum"];

stocksRouter.post("/createMarket", async (req: any, res: any) => {
  const {
    stockSymbol,
    type,
    endsIn,
    sourceOfTruth,
    endTime,
    heading,
    eventType,
    repeatTime,
  }: CreateMarketRequestBody = req.body;

  // create market  request will be be called in
  console.log("body", req.body);

  if (type === "automatic" && sourceOfTruth === "automatic") {
    console.log("entereed");
    if (automMaticMarketsAllowed.includes(stockSymbol)) {
      console.log("entereed 2 ");
      console.log("repeatTime", repeatTime);
      cron.schedule(`*/${repeatTime} * * * *`, async () => {
        console.log("entered 3");
        const couldBePrice = await createMarketCondition(stockSymbol);

        const stockUniqueStockSymbol = `${stockSymbol}-${new Date().getTime()}`;

        console.log("Creating Market", stockUniqueStockSymbol);

        const createdMarket = await redisManager.sendRequestAndSubscribe({
          action: ActionTypes.CREATE_MARKET,
          data: {
            stockSymbol: stockUniqueStockSymbol,
            price: couldBePrice,
            heading,
            eventType,
            type,
          },
        });

        setTimeout(async () => {
          const stockData = await getCurrentMarketPrice(stockSymbol);
          const currentPrice = stockData[stockSymbol].inr;

          const winningStock = currentPrice > couldBePrice ? "yes" : "no";

          const response = await redisManager.sendRequestAndSubscribe({
            action: ActionTypes.END_MARKET,
            data: {
              stockUniqueStockSymbol,
              marketId: createdMarket?.marketId,
              winningStock,
            },
          });
          return response;
        }, endsIn);
      });
    }
  }
});
