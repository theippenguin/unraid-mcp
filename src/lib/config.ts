import { McpServerConfig } from "../types/index.js";

export function loadConfig(): McpServerConfig {
  const host = process.env.UNRAID_HOST;
  if (!host) {
    throw new Error("UNRAID_HOST environment variable is required");
  }

  const apiKey = process.env.UNRAID_API_KEY;
  if (!apiKey) {
    throw new Error("UNRAID_API_KEY environment variable is required");
  }

  return {
    unraid: {
      host,
      port: parseInt(process.env.UNRAID_GRAPHQL_PORT ?? "31337", 10),
      apiKey,
      useTls: process.env.UNRAID_USE_TLS === "true",
    },
    serverPort: parseInt(process.env.MCP_SERVER_PORT ?? "3000", 10),
    logLevel: (process.env.LOG_LEVEL as McpServerConfig["logLevel"]) ?? "info",
  };
}
