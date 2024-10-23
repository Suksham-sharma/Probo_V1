import { redisManager } from "lib/redisManager";
import type {
  INRBalances,
  OnRampProps,
  Orderbook,
  OrderProps,
  StockBalances,
} from "Types";

class EngineManager {
  private INR_BALANCES: INRBalances = {
    user1: {
      balance: 300,
      locked: 0,
    },
  };

  private STOCK_BALANCES: StockBalances = {
    user1: {
      IND_BNG: {
        yes: {
          quantity: 20,
          locked: 0,
        },
        no: {
          quantity: 10,
          locked: 0,
        },
      },
    },
  };

  private ORDERBOOK: Orderbook = {};

  static instance: EngineManager;

  static getInstance(): EngineManager {
    if (!this.instance) {
      this.instance = new EngineManager();
    }
    return this.instance;
  }

  private mintStocks(
    userId: string,
    stockSymbol: string,
    sellerId: string,
    price: number,
    stockOption: "yes" | "no",
    availableQuantity: number
  ) {
    const oppositeStockOption = stockOption === "yes" ? "no" : "yes";
    const correspondingPrice = 10 - price;

    this.STOCK_BALANCES[sellerId][stockSymbol][oppositeStockOption].quantity +=
      availableQuantity;
    this.STOCK_BALANCES[userId][stockSymbol][stockOption].quantity +=
      availableQuantity;
    this.INR_BALANCES[userId].balance -= availableQuantity * price;
    this.INR_BALANCES[sellerId].locked -=
      availableQuantity * correspondingPrice;

    redisManager.sendDataToDB_Engine({
      action: "UPDATE_INR_BALANCE",
      data: { [userId]: this.INR_BALANCES[userId] },
    });

    redisManager.sendDataToDB_Engine({
      action: "UPDATE_INR_BALANCE",
      data: { [sellerId]: this.INR_BALANCES[sellerId] },
    });
  }

  private swapStocks(
    userId: string,
    stockSymbol: string,
    sellerId: string,
    price: number,
    stockOption: "yes" | "no",
    availableQuantity: number
  ) {
    this.STOCK_BALANCES[sellerId][stockSymbol][stockOption].locked -=
      availableQuantity;
    this.STOCK_BALANCES[userId][stockSymbol][stockOption].quantity +=
      availableQuantity;
    this.INR_BALANCES[userId].balance -= availableQuantity * price;
    this.INR_BALANCES[sellerId].balance += availableQuantity * price;

    redisManager.sendDataToDB_Engine({
      action: "UPDATE_INR_BALANCE",
      data: { [userId]: this.INR_BALANCES[userId] },
    });

    redisManager.sendDataToDB_Engine({
      action: "UPDATE_INR_BALANCE",
      data: { [sellerId]: this.INR_BALANCES[sellerId] },
    });
  }

  private handleSendUpdatesToDB(
    userId: string,
    stockSymbol: string,
    stockOption: string,
    price: number,
    quantity: number,
    type: "BUY" | "SELL",
    orderStatus: "PENDING" | "COMPLETED" | "CANCELLED"
  ) {
    redisManager.sendDataToDB_Engine({
      action: "UPDATE_STOCK_BALANCE",
      data: { [userId]: this.STOCK_BALANCES[userId] },
    });

    redisManager.sendDataToDB_Engine({
      action: "UPDATE_ORDERBOOK",
      [stockSymbol]: this.ORDERBOOK[stockSymbol],
    });

    redisManager.sendDataToDB_Engine({
      action: "UPSERT_ORDER",
      data: {
        type: type,
        price: price,
        quantity: quantity,
        userId: userId,
        stockType: stockOption,
        stockSymbol: stockSymbol,
        status: orderStatus,
      },
    });
  }

  createUser(userId: string) {
    try {
      if (this.INR_BALANCES[userId]) {
        throw new Error("User already exists");
      }

      console.log("userID", userId);

      this.INR_BALANCES[userId] = { balance: 0, locked: 0 };
      return {
        status: true,
        userId: this.INR_BALANCES[userId],
        message: "USER_CREATED",
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  getUserINRBalance(userId: string) {
    try {
      console.log("INR", userId);
      const balance = this.INR_BALANCES[userId];

      if (!balance) {
        throw new Error("User doesn't exist");
      }

      return { status: true, message: "USER_INR_FETCHED", balance: balance };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  getUserStocks(userId: string) {
    try {
      const stocks = this.STOCK_BALANCES[userId];

      if (!stocks) {
        throw new Error("User doesn't exist");
      }
      return { status: true, message: "USER_STOCKS_FETCHED", stocks: stocks };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  OnRampUserBalance(onRampData: OnRampProps) {
    try {
      const { userId, amount } = onRampData;
      if (!this.INR_BALANCES[userId]) {
        return {
          status: false,
          message: "User with the given Id dosen't exists",
        };
      }

      this.INR_BALANCES[userId].balance += amount;
      return {
        status: true,
        message: "Successfully added the amount",
        balance: { [userId]: this.INR_BALANCES[userId] },
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message,
      };
    }
  }

  getInrBalances() {
    try {
      return {
        status: true,
        message: "INR Balances fetched successfully",
        data: this.INR_BALANCES,
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message,
      };
    }
  }

  placeBuyOrder(orderData: OrderProps) {
    try {
      const { userId, stockSymbol, quantity, price, stockOption } = orderData;
      let requiredQuantity = quantity;
      const oppositeStockOption = stockOption === "yes" ? "no" : "yes";
      const correspondingPrice = 10 - price;

      if (price > 10 || price < 0) {
        throw new Error("Invalid price , Price should be between 0 and 10");
      }

      if (!this.INR_BALANCES[userId]) {
        throw new Error("User with the given Id  dosen't exist");
      }

      if (!this.ORDERBOOK[stockSymbol]) {
        this.ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
      }

      if (this.INR_BALANCES[userId].balance < quantity * price) {
        throw new Error("Insufficient balance");
      }

      if (!this.STOCK_BALANCES[userId]) {
        this.STOCK_BALANCES[userId] = {};
      }

      if (!this.STOCK_BALANCES[userId][stockSymbol]) {
        this.STOCK_BALANCES[userId][stockSymbol] = {
          yes: { quantity: 0, locked: 0 },
          no: { quantity: 0, locked: 0 },
        };
      }

      // if total is greater than the required quantity , then we'll proceed , no need to create corrosponding sell orders
      if (
        this.ORDERBOOK[stockSymbol][stockOption][price] &&
        this.ORDERBOOK[stockSymbol][stockOption][price].total >=
          requiredQuantity
      ) {
        this.ORDERBOOK[stockSymbol][stockOption][price].total -=
          requiredQuantity;

        for (const sellerId in this.ORDERBOOK[stockSymbol][stockOption][price]
          .orders) {
          const seller =
            this.ORDERBOOK[stockSymbol][stockOption][price].orders[sellerId];
          if (seller.quantity > 0) {
            const availableQuantity = Math.min(
              seller.quantity,
              requiredQuantity
            );

            if (seller.type === "minted") {
              // mint the required tokens
              this.mintStocks(
                userId,
                stockSymbol,
                sellerId,
                price,
                stockOption,
                availableQuantity
              );
            } else {
              // regular (selling order)
              this.swapStocks(
                userId,
                stockSymbol,
                sellerId,
                price,
                stockOption,
                availableQuantity
              );
            }

            requiredQuantity -= availableQuantity;

            this.ORDERBOOK[stockSymbol][stockOption][price].orders[
              sellerId
            ].quantity -= availableQuantity;

            if (requiredQuantity === 0) {
              break;
            }
          }

          // INR Balances will be updated automattically for the user and seller

          this.handleSendUpdatesToDB(
            userId,
            stockSymbol,
            stockOption,
            price,
            quantity,
            "BUY",
            "COMPLETED"
          );

          return {
            status: true,
            message: "Successfully bought the required quantity",
            stocks: this.STOCK_BALANCES[userId][stockSymbol],
            orderbook: this.ORDERBOOK[stockSymbol],
          };
        }
      } else {
        // traverse through the sell orders , and swap available , and send the minting flow for the required ones .

        if (
          this.ORDERBOOK[stockSymbol][stockOption][price] &&
          this.ORDERBOOK[stockSymbol][stockOption][price].total > 0
        ) {
          for (const sellerId in this.ORDERBOOK[stockSymbol][stockOption][price]
            .orders) {
            const seller =
              this.ORDERBOOK[stockSymbol][stockOption][price].orders[sellerId];
            if (seller.quantity > 0) {
              const availableQuantity = Math.min(
                seller.quantity,
                requiredQuantity
              );

              if (seller.type === "minted") {
                this.mintStocks(
                  userId,
                  stockSymbol,
                  sellerId,
                  price,
                  stockOption,
                  availableQuantity
                );
              } else {
                // regular (selling order)
                this.swapStocks(
                  userId,
                  stockSymbol,
                  sellerId,
                  price,
                  stockOption,
                  availableQuantity
                );
              }

              if (seller.quantity < requiredQuantity) {
                delete this.ORDERBOOK[stockSymbol][stockOption][price].orders[
                  sellerId
                ];
              } else {
                this.ORDERBOOK[stockSymbol][stockOption][price].orders[
                  sellerId
                ].quantity -= availableQuantity;
              }

              this.ORDERBOOK[stockSymbol][stockOption][price].total -=
                availableQuantity;

              requiredQuantity -= availableQuantity;
            }
          }

          // records for partially filled orders
          this.handleSendUpdatesToDB(
            userId,
            stockSymbol,
            stockOption,
            price,
            quantity - requiredQuantity,
            "BUY",
            "COMPLETED"
          );
        }

        if (
          !this.ORDERBOOK[stockSymbol][oppositeStockOption][correspondingPrice]
        ) {
          this.ORDERBOOK[stockSymbol][oppositeStockOption][correspondingPrice] =
            {
              total: 0,
              orders: {},
            };
        }

        this.ORDERBOOK[stockSymbol][oppositeStockOption][
          correspondingPrice
        ].total += requiredQuantity;

        if (
          !this.ORDERBOOK[stockSymbol][oppositeStockOption][correspondingPrice]
            .orders[userId]
        ) {
          this.ORDERBOOK[stockSymbol][oppositeStockOption][
            correspondingPrice
          ].orders[userId] = {
            quantity: 0,
            type: "minted",
          };
        }

        this.ORDERBOOK[stockSymbol][oppositeStockOption][
          correspondingPrice
        ].orders[userId].quantity =
          (this.ORDERBOOK[stockSymbol][oppositeStockOption][correspondingPrice]
            .orders[userId].quantity || 0) + requiredQuantity;

        // required INR balance will be locked
        this.INR_BALANCES[userId].locked += requiredQuantity * price;
        this.INR_BALANCES[userId].balance -= requiredQuantity * price;

        this.handleSendUpdatesToDB(
          userId,
          stockSymbol,
          stockOption,
          price,
          quantity,
          "BUY",
          "PENDING"
        );

        redisManager.sendDataToDB_Engine({
          action: "UPDATE_INR_BALANCE",
          data: { [userId]: this.INR_BALANCES[userId] },
        });
      }

      return {
        status: true,
        message: "Successfully placed the buy order",
        stocks: this.STOCK_BALANCES[userId][stockSymbol],
        orderbook: this.ORDERBOOK[stockSymbol],
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  placeSellOrder(orderData: OrderProps) {
    try {
      const { userId, stockSymbol, quantity, price, stockOption } = orderData;
      if (price > 10 || price < 0) {
        throw new Error("Price should be between 0 and 10rs");
      }

      if (!this.INR_BALANCES[userId]) {
        throw new Error("User with the given Id dosen't exists");
      }

      if (!this.STOCK_BALANCES[userId]) {
        this.STOCK_BALANCES[userId] = {};
        throw new Error("User dosen't have the required stocks to sell");
      }
      if (
        !this.STOCK_BALANCES[userId][stockSymbol] ||
        this.STOCK_BALANCES[userId][stockSymbol][stockOption].quantity <
          quantity
      ) {
        throw new Error("User dosen't have the required qty.");
      }

      if (!this.ORDERBOOK[stockSymbol]) {
        this.ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
      }

      if (!this.ORDERBOOK[stockSymbol][stockOption][price]) {
        this.ORDERBOOK[stockSymbol][stockOption][price] = {
          total: 0,
          orders: {},
        };
      }

      this.ORDERBOOK[stockSymbol][stockOption][price].total += quantity;

      if (!this.ORDERBOOK[stockSymbol][stockOption][price].orders[userId]) {
        this.ORDERBOOK[stockSymbol][stockOption][price].orders[userId] = {
          quantity: 0,
          type: "regular",
        };
      }
      this.ORDERBOOK[stockSymbol][stockOption][price].orders[userId].quantity =
        (this.ORDERBOOK[stockSymbol][stockOption][price].orders[userId]
          .quantity || 0) + quantity;

      // lock the required quantity of stocks
      this.STOCK_BALANCES[userId][stockSymbol][stockOption].quantity -=
        quantity;
      this.STOCK_BALANCES[userId][stockSymbol][stockOption].locked += quantity;

      this.handleSendUpdatesToDB(
        userId,
        stockSymbol,
        stockOption,
        price,
        quantity,
        "SELL",
        "PENDING"
      );

      return {
        status: true,
        message: "Successfully placed the sell order",
        stockSymbol: stockSymbol,
        orderbook: this.ORDERBOOK[stockSymbol],
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  createMarket(stockSymbol: string) {
    try {
      const userId = "user1";

      for (const user in this.STOCK_BALANCES) {
        if (this.STOCK_BALANCES[user][stockSymbol]) {
          throw new Error("Market already exists");
        }
      }

      this.ORDERBOOK[stockSymbol] = { yes: {}, no: {} };

      if (!this.STOCK_BALANCES[userId]) {
        this.STOCK_BALANCES[userId] = {};
      }

      this.STOCK_BALANCES[userId][stockSymbol] = {
        yes: { quantity: 0, locked: 0 },
        no: { quantity: 0, locked: 0 },
      };

      return {
        status: true,
        STOCK_BALANCES: this.STOCK_BALANCES[userId][stockSymbol],
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  getMarketbySymbol(marketSymbol: string) {
    try {
      const market = this.ORDERBOOK[marketSymbol];
      console.log("market", market);
      console.log("stock", marketSymbol);
      if (!market) {
        throw new Error("Market dosen't exist");
      }
      return { status: true, message: "MARKET_FETCHED", market: market };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  getOrderbook() {
    try {
      const orderbook = this.ORDERBOOK;
      if (!orderbook) {
        throw new Error("Orderbook dosen't exist");
      }
      return {
        status: true,
        message: "ORDERBOOK_FETCHED",
        orderbook: orderbook,
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  getStockSymbols() {
    try {
      return {
        status: true,
        message: "Stock Symbols fetched successfully",
        data: Object.keys(this.ORDERBOOK),
      };
    } catch (error: any) {
      return {
        status: false,
        message: error.message,
      };
    }
  }
}

export const engineManger = EngineManager.getInstance();
