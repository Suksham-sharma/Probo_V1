export interface INRBalances {
  [userId: string]: {
    balance: number;
    locked: number;
  };
}

export interface StockBalances {
  [userId: string]: {
    [stockSymbol: string]: {
      yes: {
        quantity: number;
        locked: number;
      };
      no: {
        quantity: number;
        locked: number;
      };
    };
  };
}

// export interface UpdatedOrderBook {
//   [stockSymbol: string]: {
//     yes: {
//       [price: number]: {
//         [orderId: string]: {
//           userId: string;
//           quantity: number;
//           type: "reverted" | "regular";
//         };
//         totalx: string;
//       };
//     };
//     no: {};
//   };
// }

// interface OrderBookPerPrice {
//   total: number;
//   orders: {
//     [orderId: string]: OrderDetails;
//   };
// }

interface OrderDetails {
  userId: string;
  quantity: number;
  type: "reverted" | "regular";
}

type OrderBookOrders = Record<string, OrderDetails>;

type OrderBookPerPrice = {
  total: number;
  orders: OrderBookOrders;
};

type OrderBookPrices = Record<number, OrderBookPerPrice>;

type OrderBookPerStock = {
  yes: OrderBookPrices;
  no: OrderBookPrices;
};

export type OrderBook = Record<string, OrderBookPerStock>;

// price: {total: 78, orders: {[orderId]: {userId: "123", quantity:10 type:"reverted" }}}

// export interface OrderBookPerStock {
//   yes: {
//     [price: number]: {
//       total: number;
//       orders: {
//         [userId: string]: {
//           quantity: number;
//           type: "reverted" | "regular";
//         };
//       };
//     };
//   };
//   no: {
//     [price: number]: {
//       total: number;
//       orders: {
//         [userId: string]: {
//           quantity: number;
//           type: "reverted" | "regular";
//         };
//       };
//     };
//   };
// }
// type OrderBook = Record<string, OrderBookPerStock>;

export type OrderProps = {
  userId: string;
  stockSymbol: string;
  quantity: number;
  price: number;
  stockType: "yes" | "no";
};

export type OnRampProps = {
  userId: string;
  amount: number;
};

export type CancelOrderProps = {
  userId: string;
  stockSymbol: string;
  orderId: string;
  stockType: "yes" | "no";
  price: number;
};

export type Market = {
  stockSymbol: string;
  price: number;
  heading: string;
  eventType: string;
  type: "automatic" | "manual";
  status: "Active" | "COMPLETED";
};

export type Markets = Record<string, Market>;
