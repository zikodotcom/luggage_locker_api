/*
  Warnings:

  - You are about to drop the column `placeId` on the `Booking` table. All the data in the column will be lost.
  - Added the required column `lockerId` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_placeId_fkey";

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "placeId",
ADD COLUMN     "lockerId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_lockerId_fkey" FOREIGN KEY ("lockerId") REFERENCES "Locker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
