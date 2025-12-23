// Prisma config file
// Load environment variables from .env file
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  // Use 'wasm' engine which doesn't require datasource in config
  // The schema.prisma datasource block handles the connection
});
