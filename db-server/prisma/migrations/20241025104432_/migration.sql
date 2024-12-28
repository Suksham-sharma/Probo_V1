/*
  Warnings:

  - You are about to drop the column `data` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Orderbook` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `filledQty` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockSymbol` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stockType` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mainUserId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `type` on the `Transaction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'FILLED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('SOLD', 'BOUGHT', 'CANCEL', 'DEPOSIT');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "filledQty" TEXT NOT NULL,
ADD COLUMN     "status" "OrderStatus" NOT NULL,
ADD COLUMN     "stockSymbol" TEXT NOT NULL,
ADD COLUMN     "stockType" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT;
DROP SEQUENCE "Order_id_seq";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "data",
DROP COLUMN "userId",
ADD COLUMN     "amount" DOUBLE PRECISION,
ADD COLUMN     "associateUserId" TEXT,
ADD COLUMN     "mainUserId" TEXT NOT NULL,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "quantity" INTEGER,
ADD COLUMN     "stockSymbol" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "TransactionType" NOT NULL;

-- DropTable
DROP TABLE "Orderbook";
