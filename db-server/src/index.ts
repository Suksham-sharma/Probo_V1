import { redisManager } from "./lib/RedisManager";

async function main() {
  while (true) {
    await redisManager.getDataFromQueue();
  }
}

main();
