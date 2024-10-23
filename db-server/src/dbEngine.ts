import { PrismaClient } from "@prisma/client";

class DB_Engine {
  static instance: DB_Engine;

  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new DB_Engine();
    }
    return this.instance;
  }

  async CreateOrUpdateOrder(data: any) {
    const order = await this.prisma.order.upsert({
      data: {
        type: data.type,
        price: data.price,
        quantity: data.quantity,
        userId: data.userId,
      },
    });

    return order;
  }

  async createOrUpdateInrBalances(data: any) {
    try {
      const userId = Object.keys(data.balance)[0];
      const InrBalanceData = data.balance[userId];
      const userBalance = await this.prisma.inrBalances.upsert({
        where: { userId: userId },
        update: {
          balance: InrBalanceData.balance,
          locked: InrBalanceData.locked,
        },
        create: {
          userId: userId,
          balance: InrBalanceData.balance,
          locked: InrBalanceData.locked,
        },
      });
      return userBalance;
    } catch (error) {
      console.log(error);
    }
  }

  async createOrUpdateOrderbook(OrderbookData: any) {
    const updatedOrderBook = await this.prisma.orderbook.upsert({
      where: { symbol: OrderbookData.symbol },
      update: { data: OrderbookData.data },
      create: {
        symbol: OrderbookData.symbol,
        data: OrderbookData.data,
      },
    });
    return updatedOrderBook;
  }

  async createOrUpdateUserStockBalance(data: any) {
    const userStockBalance = await this.prisma.user.upsert({
      where: { id: data.userId },
      update: {
        stockBalances: data.data,
      },
      create: {
        id: data.userId,
        stockBalances: data.data,
      },
    });
    return userStockBalance;
  }
}

export const dbEngine = DB_Engine.getInstance();
