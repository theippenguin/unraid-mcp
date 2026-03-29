import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GraphQLClient } from "../../lib/graphql.js";
import { NetworkInterface } from "../../types/index.js";

const LIST_INTERFACES_QUERY = `
  query NetworkInterfaces {
    networkInterfaces {
      name
      ipv4
      ipv6
      mac
      speed
      status
      rxBytes
      txBytes
    }
  }
`;

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / (1024 ** 2);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export function registerNetworkTools(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "network_interfaces",
    "List all network interfaces with IP addresses, MAC addresses, and traffic statistics",
    {},
    async () => {
      const data = await client.query<{ networkInterfaces: NetworkInterface[] }>(LIST_INTERFACES_QUERY);
      const interfaces = data.networkInterfaces;

      const formatted = interfaces.map((iface) => {
        const ip = iface.ipv4 ? ` ip=${iface.ipv4}` : "";
        const speed = iface.speed ? ` speed=${iface.speed}` : "";
        return [
          `${iface.name} [${iface.status}]${ip} mac=${iface.mac}${speed}`,
          `  RX: ${formatBytes(iface.rxBytes)}  TX: ${formatBytes(iface.txBytes)}`,
        ].join("\n");
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${interfaces.length} network interfaces:\n\n${formatted.join("\n\n")}`,
          },
        ],
      };
    }
  );
}
