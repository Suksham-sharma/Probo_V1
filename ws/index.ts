import { createClient } from "redis";
import WebSocket, { WebSocketServer } from "ws";
import http from "http";
const redisURL = process.env.URL || "redis://localhost:6379";
const redisClient = createClient({ url: redisURL });

async function SendOrderBookToSubscribers(symbol: string, orderBook: any) {
  console.log("Sending order book to subscribers");
  console.log("abc", symbol, orderBook);
  const subscription = SubsriptionData.find((data) => data.symbol === symbol);

  if (subscription) {
    subscription.subscribers.forEach((subscriber) => {
      subscriber.send(
        JSON.stringify({
          event: "event_orderbook_update",
          message: orderBook[symbol],
        })
      );
    });
  }
}

const server = http.createServer();

const SubsriptionData: {
  symbol: string;
  subscribers: WebSocket[];
}[] = [];

async function handleIncomingRequests(message: any, ws: WebSocket) {
  const messageString = message.toString();
  console.log("message", messageString);

  const { type: method, stockSymbol: symbol } = JSON.parse(messageString);
  if (!method || !symbol) {
    // ws.send("Hit me up with a subscription or unsubscription request");
    return;
  }
  if (method === "subscribe") {
    let subscription = SubsriptionData.find((data) => data.symbol === symbol);

    if (!subscription) {
      subscription = {
        symbol,
        subscribers: [],
      };
      SubsriptionData.push(subscription);
      await redisClient.subscribe(symbol, (message) => {
        const data = JSON.parse(message);
        const { symbol, ...orderData } = data;
        SendOrderBookToSubscribers(symbol, orderData);
      });
    }
    subscription.subscribers.push(ws);
    // ws.send("Hello! You are successfully subsrcibed to " + symbol);
  } else if (method === "unsubscribe") {
    const subscription = SubsriptionData.find((data) => data.symbol === symbol);

    if (subscription) {
      subscription.subscribers = subscription.subscribers.filter(
        (subscriber) => subscriber !== ws
      );

      if (subscription.subscribers.length == 0) {
        redisClient.unsubscribe(symbol);
      }
    }
  }
}

async function handleConnectionClosed(ws: WebSocket) {
  SubsriptionData.forEach((data) => {
    data.subscribers = data.subscribers.filter(
      (subscriber) => subscriber !== ws
    );
  });
}

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  console.log(`${new Date().toISOString()} New client connected`);
  ws.send("connection successfull");
  ws.on("error", console.error);

  ws.on("message", (message) => {
    handleIncomingRequests(message, ws);
  });

  ws.on("close", () => {
    handleConnectionClosed(ws);
  });
});

async function startServer() {
  try {
    await redisClient.connect();
    console.log("Connected to Redis");

    server.listen(8080, function () {
      console.log(" Server is listening on port 8080");
    });
  } catch (err) {
    console.error(err);
  }
}

startServer();
