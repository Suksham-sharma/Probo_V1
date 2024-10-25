import { dbEngine } from "./dbEngine";

export async function handleIncomingRequests(message: any) {
  switch (message.action) {
    // sell
    // buy , cancel order .
    case "UPSERT_ORDER":
      {
        try {
          const response = await dbEngine.CreateOrUpdateOrder(message.data);
          if (response) {
            console.log(response);
          }
          return response;
        } catch (error: any) {}
      }
      break;
    // onramp , buy order
    // cancel order , sell order
    case "UPDATE_INR_BALANCE":
      {
        try {
          const response = dbEngine.createOrUpdateInrBalances(message.data);
        } catch (error: any) {}
      }
      break;
    // buy order, sell order
    // cancel order
    case "UPDATE_STOCK_BALANCE":
      {
        try {
          const response = dbEngine.createOrUpdateUserStockBalance(
            message.data
          );
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
