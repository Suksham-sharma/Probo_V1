import { s3Service } from "lib/awsClient";
import { redisManager } from "lib/redisManager";
import { nanoid } from "nanoid";
import type {
  CancelOrderProps,
  INRBalances,
  Markets,
  OnRampProps,
  OrderBook,
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

  private ORDERBOOK: OrderBook = {};

  private MARKETS: Markets = {};

  constructor() {
    this.updateOrderBookDataFromS3();
    setInterval(() => {
      this.saveSnapshotToS3();
    }, 1000 * 60 * 100);
  }

  static instance: EngineManager;

  static getInstance(): EngineManager {
    if (!this.instance) {
      this.instance = new EngineManager();
    }
    return this.instance;
  }

  async sendInrAndStockBalancesToDB(InrBalances: any, stockBalances: any) {
    redisManager.sendDataToDB_Engine({
      action: "UPDATE_INR_BALANCE",
      data: InrBalances,
    });

    redisManager.sendDataToDB_Engine({
      action: "UPDATE_STOCK_BALANCE",
      data: stockBalances,
    });
  }

  private async updateOrderBookDataFromS3() {
    if (!this.ORDERBOOK || Object.keys(this.ORDERBOOK).length === 0) {
      console.log("Engine Manager Initialized");
      let snapshot = await s3Service.fetchJson();
      const ParsedData = JSON.parse(snapshot.data);

      if (snapshot) {
        this.ORDERBOOK = ParsedData;
        console.log("Snapshot found and loaded successfully !!");
        console.log("Snapshot Data", this.ORDERBOOK);
        return;
      }

      console.log("No snapshot found, initializing with empty data !!");
    }
  }

  private async saveSnapshotToS3() {
    try {
      await s3Service.uploadJsonToS3(this.ORDERBOOK);
    } catch (error) {
      console.error("Error while saving snapshot to S3", error);
    }
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

    this.sendInrAndStockBalancesToDB(
      { [userId]: this.INR_BALANCES[userId] },
      {
        userId: userId,
        data: this.STOCK_BALANCES[userId],
      }
    );

    this.sendInrAndStockBalancesToDB(
      { [sellerId]: this.INR_BALANCES[sellerId] },
      {
        userId: sellerId,
        data: this.STOCK_BALANCES[sellerId],
      }
    );
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

    this.sendInrAndStockBalancesToDB(
      { [userId]: this.INR_BALANCES[userId] },
      {
        userId: userId,
        data: this.STOCK_BALANCES[userId],
      }
    );

    this.sendInrAndStockBalancesToDB(
      { [sellerId]: this.INR_BALANCES[sellerId] },
      {
        usrerId: sellerId,
        data: this.STOCK_BALANCES[sellerId],
      }
    );
  }

  private ProcessWinnings(stockSymbol: string, winningStock: "yes" | "no") {
    const oppositeStockOption = winningStock === "yes" ? "no" : "yes";

    const STOCK_BALANCES = this.STOCK_BALANCES;

    for (const user in STOCK_BALANCES) {
      if (STOCK_BALANCES[user][stockSymbol]) {
        const stockBalance = STOCK_BALANCES[user][stockSymbol][winningStock];

        // give the person winning stocks * 10 , and for the opposite one 0
        // , and clear this from stock balances

        this.INR_BALANCES[user].balance += stockBalance.quantity * 10;
      }
      delete STOCK_BALANCES[user][stockSymbol];
    }
  }

  private ClearOrderBook(stockSymbol: string) {
    try {
      if (!stockSymbol) {
        throw new Error("Stock symbol is required");
      }

      const orderBook = this.ORDERBOOK[stockSymbol];
      if (!orderBook) {
        throw new Error(`Orderbook for symbol '${stockSymbol}' doesn't exist`);
      }

      Object.entries(orderBook).forEach(([stockOption, priceEntries]) => {
        Object.entries(priceEntries).forEach(([price, entry]) => {
          const priceNum = Number(price);
          if (isNaN(priceNum)) {
            throw new Error(`Invalid price value: ${price}`);
          }

          Object.values(entry.orders).forEach((order) => {
            this.processOrder(
              order,
              stockSymbol,
              stockOption === "yes" ? "yes" : "no",
              priceNum
            );
          });
        });
      });

      delete this.ORDERBOOK[stockSymbol];

      return { status: true };
    } catch (error) {
      return {
        status: false,
        message:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  }

  private processOrder(
    order: any,
    stockSymbol: string,
    stockOption: "yes" | "no",
    price: number
  ): void {
    if (
      !this.INR_BALANCES[order.userId] ||
      !this.STOCK_BALANCES[order.userId]?.[stockSymbol]?.[stockOption]
    ) {
      throw new Error(`Invalid balances for user ${order.userId}`);
    }

    const amount = order.quantity * price;

    switch (order.type) {
      case "minted":
        this.processMintedOrder(order.userId, amount);
        break;
      case "regular":
        this.processRegularOrder(
          order.userId,
          stockSymbol,
          stockOption,
          order.quantity
        );
        break;
      default:
        throw new Error(`Unknown order type: ${order.type}`);
    }
  }

  private processMintedOrder(userId: string, amount: number): void {
    const userBalance = this.INR_BALANCES[userId];
    if (userBalance.locked < amount) {
      throw new Error(`Insufficient locked balance for user ${userId}`);
    }

    userBalance.locked -= amount;
    userBalance.balance += amount;
  }

  private processRegularOrder(
    userId: string,
    stockSymbol: string,
    stockOption: "yes" | "no",
    quantity: number
  ): void {
    const stockBalance = this.STOCK_BALANCES[userId][stockSymbol][stockOption];
    if (stockBalance.locked < quantity) {
      throw new Error(`Insufficient locked stock quantity for user ${userId}`);
    }

    stockBalance.locked -= quantity;
    stockBalance.quantity += quantity;
  }

  createUser(userId: string) {
    try {
      if (this.INR_BALANCES[userId]) {
        throw new Error("User already exists");
      }

      console.log("userID", userId);

      this.INR_BALANCES[userId] = { balance: 0, locked: 0 };
      redisManager.sendDataToDB_Engine({
        action: "UPDATE_INR_BALANCE",
        data: { [userId]: this.INR_BALANCES[userId] },
      });
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

      redisManager.sendDataToDB_Engine({
        action: "UPDATE_INR_BALANCE",
        data: { [userId]: this.INR_BALANCES[userId] },
      });
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

      const orderId = nanoid();
      redisManager.sendDataToDB_Engine({
        action: "UPSERT_ORDER",
        data: {
          orderId: orderId,
          userId: userId,
          type: "BUY",
          stockSymbol: stockSymbol,
          stockOption: stockOption,
          price: price,
          quantity: requiredQuantity,
          filledQty: 0,
          status: "PENDING",
        },
      });

      // if total is greater than the required quantity , then we'll proceed , no need to create corrosponding sell orders
      if (
        this.ORDERBOOK[stockSymbol][stockOption][price] &&
        this.ORDERBOOK[stockSymbol][stockOption][price].total >=
          requiredQuantity
      ) {
        this.ORDERBOOK[stockSymbol][stockOption][price].total -=
          requiredQuantity;

        for (const sellOrderId in this.ORDERBOOK[stockSymbol][stockOption][
          price
        ].orders) {
          const sellerOrder =
            this.ORDERBOOK[stockSymbol][stockOption][price].orders[sellOrderId];
          if (sellerOrder.quantity > 0) {
            const availableQuantity = Math.min(
              sellerOrder.quantity,
              requiredQuantity
            );

            if (sellerOrder.type === "minted") {
              // mint the required tokens
              this.mintStocks(
                userId,
                stockSymbol,
                sellerOrder.userId,
                price,
                stockOption,
                availableQuantity
              );
            } else {
              // regular (selling order)
              this.swapStocks(
                userId,
                stockSymbol,
                sellerOrder.userId,
                price,
                stockOption,
                availableQuantity
              );
            }

            redisManager.sendDataToDB_Engine({
              action: "UPSERT_ORDER",
              data: {
                orderId: sellOrderId,
                filledQty: availableQuantity,
                status:
                  sellerOrder.quantity === availableQuantity
                    ? "FILLED"
                    : "PENDING",
              },
            });

            requiredQuantity -= availableQuantity;
            redisManager.sendDataToDB_Engine({
              action: "UPSERT_ORDER",
              data: {
                orderId: orderId,
                filledQty: availableQuantity,
                status: requiredQuantity === 0 ? "FILLED" : "PENDING",
              },
            });

            this.ORDERBOOK[stockSymbol][stockOption][price].orders[
              sellOrderId
            ].quantity -= availableQuantity;

            if (requiredQuantity === 0) {
              break;
            }
          }

          // INR Balances will be updated automattically for the user and seller

          redisManager.sendDataToDB_Engine({
            action: "UPDATE_INR_BALANCE",
            data: { [userId]: this.INR_BALANCES[userId] },
          });

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
          for (const sellerOrderId in this.ORDERBOOK[stockSymbol][stockOption][
            price
          ].orders) {
            const sellerOrder =
              this.ORDERBOOK[stockSymbol][stockOption][price].orders[
                sellerOrderId
              ];
            if (sellerOrder.quantity > 0) {
              const availableQuantity = Math.min(
                sellerOrder.quantity,
                requiredQuantity
              );

              if (sellerOrder.type === "minted") {
                this.mintStocks(
                  userId,
                  stockSymbol,
                  sellerOrder.userId,
                  price,
                  stockOption,
                  availableQuantity
                );
              } else {
                // regular (selling order)
                this.swapStocks(
                  userId,
                  stockSymbol,
                  sellerOrder.userId,
                  price,
                  stockOption,
                  availableQuantity
                );
              }

              if (sellerOrder.quantity < requiredQuantity) {
                delete this.ORDERBOOK[stockSymbol][stockOption][price].orders[
                  sellerOrderId
                ];
              } else {
                this.ORDERBOOK[stockSymbol][stockOption][price].orders[
                  sellerOrderId
                ].quantity -= availableQuantity;
              }

              this.ORDERBOOK[stockSymbol][stockOption][price].total -=
                availableQuantity;

              requiredQuantity -= availableQuantity;

              redisManager.sendDataToDB_Engine({
                action: "UPSERT_ORDER",
                data: {
                  orderId: orderId,
                  filledQty: availableQuantity,
                  status: "PENDING",
                },
              });

              redisManager.sendDataToDB_Engine({
                action: "UPSERT_ORDER",
                data: {
                  orderId: sellerOrderId,
                  filledQty: availableQuantity,
                  status:
                    sellerOrder.quantity === availableQuantity
                      ? "FILLED"
                      : "PENDING",
                },
              });
            }
          }

          // records for partially filled orders
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

        this.ORDERBOOK[stockSymbol][oppositeStockOption][
          correspondingPrice
        ].orders[orderId] = {
          quantity: requiredQuantity,
          type: "minted",
          userId: userId,
        };

        // required INR balance will be locked
        this.INR_BALANCES[userId].locked += requiredQuantity * price;
        this.INR_BALANCES[userId].balance -= requiredQuantity * price;

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

      // generate nano id

      const orderId = nanoid();

      this.ORDERBOOK[stockSymbol][stockOption][price].orders[orderId] = {
        quantity: quantity,
        type: "regular",
        userId: userId,
      };
      this.STOCK_BALANCES[userId][stockSymbol][stockOption].quantity -=
        quantity;
      this.STOCK_BALANCES[userId][stockSymbol][stockOption].locked += quantity;

      redisManager.sendDataToDB_Engine({
        action: "UPSERT_ORDER",
        data: {
          orderId: orderId,
          userId: userId,
          type: "SELL",
          stockSymbol: stockSymbol,
          stockOption: stockOption,
          price: price,
          quantity: quantity,
          filledQty: 0,
          status: "PENDING",
        },
      });

      redisManager.sendDataToDB_Engine({
        action: "UPDATE_STOCK_BALANCE",
        data: { userId: userId, data: this.STOCK_BALANCES[userId] },
      });

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

  cancelOrder(cancelData: CancelOrderProps) {
    try {
      const { userId, stockSymbol, price, orderId, stockOption } = cancelData;

      console.log("stockOption", stockOption);
      console.log("price", price);
      console.log("--", this.ORDERBOOK[stockSymbol][stockOption]);
      if (!this.INR_BALANCES[userId]) {
        throw new Error("User with the given Id dosen't exists");
      }

      console.log("ORDERBOOK", this.ORDERBOOK);

      if (!this.ORDERBOOK[stockSymbol]) {
        throw new Error("Orderbook dosen't exist");
      }
      console.log("2345");

      if (
        !this.ORDERBOOK[stockSymbol][stockOption][price] ||
        !this.ORDERBOOK[stockSymbol][stockOption][price].orders[orderId]
      ) {
        throw new Error("Order dosen't exist");
      }

      console.log("123456");

      if (
        this.ORDERBOOK[stockSymbol][stockOption][price].orders[orderId]
          .userId !== userId
      ) {
        throw new Error(
          "User dosen't have the required permissions to cancel the order"
        );
      }

      const order =
        this.ORDERBOOK[stockSymbol][stockOption][price].orders[orderId];

      if (order.type === "minted") {
        this.INR_BALANCES[userId].locked -= order.quantity * price;
        this.INR_BALANCES[userId].balance += order.quantity * price;
      } else {
        this.STOCK_BALANCES[userId][stockSymbol][stockOption].locked -=
          order.quantity;
        this.STOCK_BALANCES[userId][stockSymbol][stockOption].quantity +=
          order.quantity;
      }

      delete this.ORDERBOOK[stockSymbol][stockOption][price].orders[orderId];
      this.ORDERBOOK[stockSymbol][stockOption][price].total -= order.quantity;

      redisManager.sendDataToDB_Engine({
        action: "UPDATE_STOCK_BALANCE",
        data: { userId: userId, data: this.STOCK_BALANCES[userId] },
      });

      redisManager.sendDataToDB_Engine({
        action: "UPSERT_ORDER",
        data: {
          orderId: orderId,
          status: "CANCELLED",
        },
      });

      return {
        status: true,
        message: "Order cancelled successfully",
        orderbook: this.ORDERBOOK[stockSymbol],
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  createMarket(data: any) {
    try {
      const stockSymbol = data?.stockSymbol;

      if (!stockSymbol) {
        throw new Error("Stock Symbol is required");
      }

      const marketId = nanoid();

      if (this.MARKETS[marketId]) {
        throw new Error("Market already exists");
      }

      this.MARKETS[marketId] = {
        stockSymbol: stockSymbol,
        type: data.type == "automatic" ? "automatic" : "manual",
        heading: data.heading,
        eventType: data.eventType,
        price: data.price,
        status: "Active",
      };

      console.log(this.MARKETS);

      const userId = "user1";

      for (const user in this.STOCK_BALANCES) {
        if (this.STOCK_BALANCES[user][stockSymbol]) {
          throw new Error("Market already exists");
        }
      }

      if (!this.ORDERBOOK[stockSymbol]) {
        this.ORDERBOOK[stockSymbol] = { yes: {}, no: {} };
      }

      if (!this.STOCK_BALANCES[userId]) {
        this.STOCK_BALANCES[userId] = {};
      }

      this.STOCK_BALANCES[userId][stockSymbol] = {
        yes: { quantity: 0, locked: 0 },
        no: { quantity: 0, locked: 0 },
      };

      return {
        status: true,
        STOCK_BALANCES: this.STOCK_BALANCES[userId],
      };
    } catch (error: any) {
      return { status: false, message: error.message };
    }
  }

  endMarket(data: any) {
    try {
      const stockSymbol = data?.stockSymbol;
      const marketId = data?.marketId;
      const winningStock = data?.winningStock;

      if (!stockSymbol || !marketId) {
        throw new Error("Stock Symbol and Market Id are required");
      }

      if (!this.MARKETS[marketId]) {
        throw new Error("Market dosen't exist");
      }

      if (this.MARKETS[marketId].status === "COMPLETED") {
        throw new Error("Market already ended");
      }

      this.MARKETS[marketId].status = "COMPLETED";

      this.ClearOrderBook(stockSymbol);
      this.ProcessWinnings(stockSymbol, winningStock);

      return {
        status: true,
        message: "Market ended successfully",
        market: this.MARKETS[marketId],
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
