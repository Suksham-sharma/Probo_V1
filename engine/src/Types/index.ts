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

export interface Orderbook {
  [stockSymbol: string]: {
    yes: {
      [price: number]: {
        total: number;
        orders: {
          [userId: string]: {
            quantity: number;
            type: "minted" | "regular";
          };
        };
      };
    };
    no: {
      [price: number]: {
        total: number;
        orders: {
          [userId: string]: {
            quantity: number;
            type: "minted" | "regular";
          };
        };
      };
    };
  };
}

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
