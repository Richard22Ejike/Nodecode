import { PrismaClient } from "@/generated/prisma/client";
import { NodeType } from "@/generated/prisma/enums";

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
  prismaSchemaStamp?: string;
};

// Recreate the client when generated enums change. Next.js HMR keeps the
// previous PrismaClient on `global`, which still validates against the old
// NodeType list (e.g. missing TELEGRAM_SEND) and rejects workflow saves.
const schemaStamp = Object.values(NodeType).join(",");

if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaStamp !== schemaStamp
) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaStamp = schemaStamp;
}

export default prisma;
