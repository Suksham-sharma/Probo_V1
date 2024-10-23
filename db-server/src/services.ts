import { dbEngine } from "./dbEngine";

export function handleIncomingRequests(message: any) {
  switch (message.action) {
    // place sell order
    // placing reverse sell order

    case "UPSERT_ORDER":
      {
        const response = dbEngine.CreateOrUpdateOrder(message.data);
        try {
        } catch (error: any) {}
      }
      break;
    // onramp , buy order
    case "UPDATE_INR_BALANCE":
      {
        try {
          const response = dbEngine.createOrUpdateInrBalances(message.data);
        } catch (error: any) {}
      }
      break;
    // buy order, sell order
    case "UPDATE_STOCK_BALANCE":
      {
        try {
          const response = dbEngine.createOrUpdateUserStockBalance(
            message.data
          );
        } catch (error: any) {}
      }
      break;
    // sell order , buy order
    case "UPDATE_ORDERBOOK":
      {
        try {
          const response = dbEngine.createOrUpdateOrderbook(message.data);
        } catch (error: any) {}
      }
      break;
    default:
      throw new Error("Invalid action, This type of action is not supported");
  }
}

// buy case :
// ORDERBOOk ,
// STOCK BALANCE
// INR BALANCE
// create order

// update the status , when the sell order is fullfilled, by the purchase order

// buy order , -> we're updating already
// the sell order
