/*
  Warnings:

  - You are about to drop the column `is_cancelled` on the `Booking` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "is_cancelled",
ADD COLUMN     "status" "BookingStatus" NOT NULL DEFAULT 'PENDING';
