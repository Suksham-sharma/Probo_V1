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
    try {
      const findOrder = await this.prisma.order.findFirst({
        where: { id: data.orderId },
      });

      if (!findOrder) {
        const order = await this.prisma.order.create({
          data: {
            id: data?.orderId,
            type: data?.type,
            price: data?.price,
            quantity: data?.quantity,
            userId: data?.userId,
            status: data?.status,
            stockSymbol: data?.stockSymbol,
            filledQty: data?.filledQty,
            stockType: data?.stockOption,
          },
        });
        return order;
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: data.orderId },
        data: {
          filledQty: findOrder?.filledQty + (data?.filledQty ?? 0),
          status: data?.status ?? findOrder.status,
        },
      });

      return updatedOrder;
    } catch (error) {
      console.log(error);
    }
  }

  async createOrUpdateInrBalances(data: any) {
    try {
      console.log("data inside", data);
      console.log(data);
      const userId = Object.keys(data)[0];
      const InrBalanceData = data[userId];
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

  async createOrUpdateUserStockBalance(data: any) {
    try {
      console.log("data inside", data);
      console.log(data?.userId);
      const userStockBalance = await this.prisma.user.upsert({
        where: { id: data?.userId },
        update: {
          stockBalances: data.data,
        },
        create: {
          id: data?.userId,
          stockBalances: data.data,
        },
      });
      console.log(userStockBalance);
      return userStockBalance;
    } catch (error: any) {
      console.log(error);
    }
  }
}

export const dbEngine = DB_Engine.getInstance();
