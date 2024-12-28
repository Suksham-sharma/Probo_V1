import { engineManger } from "handlers/engineManager";
import { redisManager } from "lib/redisManager";

export function handleIncomingRequests(subscriptionId: string, message: any) {
  switch (message.action) {
    case "CREATE_USER":
      {
        try {
          const data = engineManger.createUser(message.data);

          if (!data?.userId) {
            throw new Error(data?.message);
          }

          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "USER_CREATION_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "RESET":
      {
        try {
          const data = engineManger.resetData();
          if (!data?.status) {
            throw new Error(data?.message);
          }
          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "RESET_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "CREATE_MARKET":
      {
        try {
          const data = engineManger.createMarket(message.data);

          if (!data?.status) {
            throw new Error(data?.message);
          }

          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "MARKET_CREATION_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "END_MARKET":
      {
        try {
          const data = engineManger.endMarket(message.data);

          if (!data?.status) {
            throw new Error(data?.message);
          }
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "MARKET_END_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "GET_INR":
      {
        try {
          const data = engineManger.getInrBalances();

          if (!data?.status) {
            throw new Error(data?.message);
          }

          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "INR_BALANCES_FETCH_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "GET_STOCKS":
      {
        try {
          const data = engineManger.getStockSymbols();

          if (!data?.status) {
            throw new Error(data?.message);
          }

          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "STOCK_SYMBOLS_FETCH_FAILED",
            message: error.message,
          });
        }
      }
      break;
    case "GET_ORDERBOOK":
      {
        try {
          const data = engineManger.getOrderbook();

          if (!data?.orderbook) {
            throw new Error("Orderbook , Not available currently !!");
          }
          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "FETCHING_ORDERBOOK_ERROR",
            message: error.message,
          });
        }
      }
      break;
    case "GET_MARKET":
      {
        try {
          const data = engineManger.getMarketbySymbol(message.data);
          if (!data?.status) {
            throw new Error(data?.message);
          }
          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "FETCHING MARKET FAILED",
            message: error.message,
          });
        }
      }
      break;
    case "USER_INR":
      {
        try {
          const data = engineManger.getUserINRBalance(message.data);

          if (!data?.msg) {
            throw new Error(data?.message);
          }

          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "INR_FETCH_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "USER_STOCKS":
      {
        try {
          const data = engineManger.getUserStocks(message.data);

          if (!data?.stocks) {
            throw new Error(data?.message);
          }

          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "STOCKS_FETCH_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "ONRAMP_INR":
      {
        try {
          const data = engineManger.OnRampUserBalance(message.data);

          if (!data?.msg) {
            throw new Error(data?.message);
          }
          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "ONRAMP_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "BUY_ORDER":
      {
        try {
          const data = engineManger.placeBuyOrder(message.data);

          if (!data?.stocks) {
            throw new Error(data?.message);
          }

          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "BUY_ORDER_FAILED",
            error: error.message,
          });
        }
      }
      break;
    case "SELL_ORDER": {
      try {
        const data = engineManger.placeSellOrder(message.data);

        if (!data?.orderbook) {
          throw new Error(data?.message);
        }

        redisManager.sendResponseToApi(subscriptionId, data);
        redisManager.sendUpdatesToWs(data.stockSymbol || "", data.orderbook);
      } catch (error: any) {
        redisManager.sendResponseToApi(subscriptionId, {
          status: false,
          error: error.message,
        });
      }
      break;
    }
    case "CANCEL_ORDER":
      {
        try {
          const data = engineManger.cancelOrder(message.data);

          if (!data?.status) {
            throw new Error(data?.message);
          }

          redisManager.sendResponseToApi(subscriptionId, data);
        } catch (error: any) {
          redisManager.sendResponseToApi(subscriptionId, {
            status: "CANCEL_ORDER_FAILED",
            error: error.message,
          });
        }
      }
      break;
    default:
      break;
  }
}
