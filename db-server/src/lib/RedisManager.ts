import { createClient, type RedisClientType } from "redis";
import { handleIncomingRequests } from "../services";

class RedisManager {
  private queueClient: RedisClientType;
  static instance: RedisManager;
  private constructor() {
    this.queueClient = createClient();
    this.queueClient.connect();
  }

  public static getInstance() {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  async getDataFromQueue() {
    const res = await this.queueClient.brPop("db-actions", 0);
    if (!res) return;
    const incomingData = JSON.parse(res.element);
    console.log("Incoming Data: ", incomingData);
    handleIncomingRequests(incomingData);
  }
}

export const redisManager = RedisManager.getInstance();
