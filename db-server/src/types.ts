export type CreateTransactionData = {
  userId: string;
  associateUserId: string;
  type: "DEPOSIT" | "SOLD" | "BOUGHT" | "CANCEL";
  quantity?: number;
  price?: number;
  amount: number;
  stockSymbol?: string;
  stockType?: string;
};
