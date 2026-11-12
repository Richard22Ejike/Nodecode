-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NodeType" ADD VALUE 'OPEN_URL';
ALTER TYPE "NodeType" ADD VALUE 'ACT';
ALTER TYPE "NodeType" ADD VALUE 'OBSERVE';
ALTER TYPE "NodeType" ADD VALUE 'EXTRACT';
ALTER TYPE "NodeType" ADD VALUE 'AGENT';
ALTER TYPE "NodeType" ADD VALUE 'SEND_EMAIL';
