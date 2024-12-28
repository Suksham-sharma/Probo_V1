import { createClient, type RedisClientType } from "redis";
import { handleIncomingRequests } from "../services";

class RedisManager {
  static instance: RedisManager;
  private queueClient: RedisClientType;
  private publisherClient: RedisClientType;
  private DBQueue: RedisClientType;
  private redisURL = process.env.REDIS_URL || "redis://localhost:6379";
  constructor() {
    try {
      this.queueClient = createClient({ url: this.redisURL });
      this.queueClient.connect();
      this.publisherClient = createClient({ url: this.redisURL });
      this.publisherClient.connect();
      this.DBQueue = createClient();
      this.DBQueue.connect();
      console.log("Connected to Redis Clients 🚀");
    } catch (error) {
      throw new Error(`Error connecting to Redis: ${error}`);
    }
  }

  public static getInstance() {
    if (!this.instance) {
      console.log("Creating new instance of RedisManager");
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  getRequestsFromQueue = async () => {
    const response = await this.queueClient.brPop("actions", 0);
    if (!response) {
      throw new Error("Something went wrong while connecting to Redis");
    }
    const IncomingData = JSON.parse(response.element);
    console.log("Incoming Data: ", IncomingData);
    handleIncomingRequests(IncomingData?.requestId, IncomingData?.message);
    return;
  };

  sendUpdatesToWs = async (stockSymbol: string, orderbook: any) => {
    this.publisherClient.publish(
      stockSymbol,
      JSON.stringify({ symbol: stockSymbol, [stockSymbol]: orderbook })
    );
  };

  sendResponseToApi = async (clientId: string, message: any) => {
    console.log("Sending response back to API");
    console.log("Message: ", message);
    this.publisherClient.publish(clientId, JSON.stringify(message));
  };

  sendDataToDB_Engine = async (data: any) => {
    this.DBQueue.lPush("db-actions", JSON.stringify(data));
  };
}

export const redisManager = RedisManager.getInstance();
