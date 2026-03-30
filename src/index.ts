import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import * as http from "http";
import { randomUUID } from "crypto";
import { loadConfig } from "./lib/config.js";
import { GraphQLClient } from "./lib/graphql.js";
import { registerDockerTools } from "./tools/docker/index.js";
import { registerVmTools } from "./tools/vms/index.js";
import { registerArrayTools } from "./tools/array/index.js";
import { registerShareTools } from "./tools/shares/index.js";
import { registerUserTools } from "./tools/users/index.js";
import { registerSystemTools } from "./tools/system/index.js";
import { registerPluginTools } from "./tools/plugins/index.js";
import { registerNetworkTools } from "./tools/network/index.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const graphqlClient = new GraphQLClient(config);

  const server = new McpServer({
    name: "unraid-mcp",
    version: "0.1.0",
  });

  // Register all tool categories
  registerDockerTools(server, graphqlClient);
  registerVmTools(server, graphqlClient);
  registerArrayTools(server, graphqlClient);
  registerShareTools(server, graphqlClient);
  registerUserTools(server, graphqlClient);
  registerSystemTools(server, graphqlClient);
  registerPluginTools(server, graphqlClient);
  registerNetworkTools(server, graphqlClient);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await server.connect(transport);

  const httpServer = http.createServer((req, res) => {
    transport.handleRequest(req, res);
  });

  await new Promise<void>((resolve) => httpServer.listen(config.serverPort, resolve));

  console.log(`Unraid MCP server listening on port ${config.serverPort}`);
  console.log(`Connected to Unraid at ${config.unraid.host}:${config.unraid.port}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
