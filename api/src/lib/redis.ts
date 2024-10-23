import { RedisClientType, createClient } from "redis";

type MessageProps = {
  action: string;
  data: any;
};

export class RedisManager {
  private static instance: RedisManager;
  private queueClient: RedisClientType;
  private subscribeClient: RedisClientType;
  private constructor() {
    this.queueClient = createClient();
    this.queueClient.connect();
    this.subscribeClient = createClient();
    this.subscribeClient.connect();
  }

  public static getInstance() {
    if (!RedisManager.instance) {
      RedisManager.instance = new RedisManager();
    }
    return RedisManager.instance;
  }

  private generateRandomId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  sendRequestAndSubscribe = (data: MessageProps): Promise<any> => {
    const id = this.generateRandomId();
    return new Promise(async (resolve, reject) => {
      try {
        await this.subscribeClient.subscribe(id, (message: string) => {
          this.subscribeClient.unsubscribe(id);
          return resolve(JSON.parse(message));
        });

        console.log("Sending request to Engine , Message pushed to queue");
        this.queueClient.lPush(
          "actions",
          JSON.stringify({ requestId: id, message: data })
        );
      } catch (error) {
        reject(error);
        console.log("Error while sending request to Engine");
      }
    });
  };
}

export const redisManager = RedisManager.getInstance();
