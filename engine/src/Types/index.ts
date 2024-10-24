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
//           type: "minted" | "regular";
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
  type: "minted" | "regular";
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

// price: {total: 78, orders: {[orderId]: {userId: "123", quantity:10 type:"minted" }}}

// export interface OrderBookPerStock {
//   yes: {
//     [price: number]: {
//       total: number;
//       orders: {
//         [userId: string]: {
//           quantity: number;
//           type: "minted" | "regular";
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
//           type: "minted" | "regular";
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
  stockOption: "yes" | "no";
};

export type OnRampProps = {
  userId: string;
  amount: number;
};

export type CancelOrderProps = {
  userId: string;
  stockSymbol: string;
  orderId: string;
  stockOption: "yes" | "no";
  price: number;
};
