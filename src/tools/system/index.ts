import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GraphQLClient } from "../../lib/graphql.js";
import { SystemInfo } from "../../types/index.js";

const SYSTEM_INFO_QUERY = `
  query SystemInfo {
    system {
      hostname
      version
      uptime
      motherboard
      cpu {
        model
        cores
        threads
        usagePercent
        temp
      }
      memory {
        totalMb
        usedMb
        freeMb
      }
    }
  }
`;

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return parts.join(" ");
}

export function registerSystemTools(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "system_info",
    "Get system information including CPU, memory, uptime, and Unraid version",
    {},
    async () => {
      const data = await client.query<{ system: SystemInfo }>(SYSTEM_INFO_QUERY);
      const sys = data.system;

      const memUsedPct = ((sys.memory.usedMb / sys.memory.totalMb) * 100).toFixed(1);
      const cpuTemp = sys.cpu.temp !== undefined ? ` ${sys.cpu.temp}°C` : "";

      const lines = [
        `Hostname: ${sys.hostname}`,
        `Unraid Version: ${sys.version}`,
        `Uptime: ${formatUptime(sys.uptime)}`,
        sys.motherboard ? `Motherboard: ${sys.motherboard}` : null,
        "",
        `CPU: ${sys.cpu.model} (${sys.cpu.cores}c/${sys.cpu.threads}t)${cpuTemp}`,
        `CPU Usage: ${sys.cpu.usagePercent.toFixed(1)}%`,
        "",
        `Memory: ${sys.memory.usedMb} MB / ${sys.memory.totalMb} MB used (${memUsedPct}%)`,
        `Memory Free: ${sys.memory.freeMb} MB`,
      ].filter(Boolean);

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    }
  );

  server.tool(
    "system_reboot",
    "Reboot the Unraid server",
    {},
    async () => {
      const mutation = `
        mutation RebootSystem {
          reboot { success message }
        }
      `;
      const data = await client.mutation<{ reboot: { success: boolean; message: string } }>(mutation);
      return {
        content: [{ type: "text", text: data.reboot.message }],
        isError: !data.reboot.success,
      };
    }
  );

  server.tool(
    "system_shutdown",
    "Shut down the Unraid server",
    {},
    async () => {
      const mutation = `
        mutation ShutdownSystem {
          shutdown { success message }
        }
      `;
      const data = await client.mutation<{ shutdown: { success: boolean; message: string } }>(mutation);
      return {
        content: [{ type: "text", text: data.shutdown.message }],
        isError: !data.shutdown.success,
      };
    }
  );
}
