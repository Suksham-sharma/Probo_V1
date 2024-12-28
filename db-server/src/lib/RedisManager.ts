import { createClient, type RedisClientType } from "redis";
import { handleIncomingRequests } from "../services";

const URL = process.env.REDIS_URL || "redis://localhost:6379";
class RedisManager {
  private queueClient: RedisClientType;
  static instance: RedisManager;
  private constructor() {
    console.log("Redis URL: ", URL);
    this.queueClient = createClient({ url: URL });
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
