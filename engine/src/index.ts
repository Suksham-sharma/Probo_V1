import { redisManager } from "lib/redisManager";

async function main() {
  await redisManager;

  while (true) {
    try {
      await redisManager.getRequestsFromQueue();
    } catch (error) {
      console.error("Error while getting requests from queue", error);
    }
  }
}

main();
