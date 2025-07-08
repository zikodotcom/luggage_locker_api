/*
  Warnings:

  - You are about to drop the column `price` on the `Place` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_placeId_fkey";

-- AlterTable
ALTER TABLE "Place" DROP COLUMN "price";

-- CreateTable
CREATE TABLE "Locker" (
    "id" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "placeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Locker_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Locker" ADD CONSTRAINT "Locker_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "Locker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
