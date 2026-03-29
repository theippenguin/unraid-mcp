import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GraphQLClient } from "../../lib/graphql.js";
import { ArrayStatus } from "../../types/index.js";

const ARRAY_STATUS_QUERY = `
  query ArrayStatus {
    array {
      state
      capacity {
        totalBytes
        usedBytes
        freeBytes
      }
      disks {
        id
        name
        device
        status
        sizeMb
        fsTotalMb
        fsUsedMb
        fsFreeMb
        temp
      }
      parity {
        id
        name
        device
        status
        sizeMb
      }
    }
  }
`;

function formatBytes(bytes: number): string {
  const tb = bytes / (1024 ** 4);
  if (tb >= 1) return `${tb.toFixed(2)} TB`;
  const gb = bytes / (1024 ** 3);
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  return `${(bytes / (1024 ** 2)).toFixed(2)} MB`;
}

export function registerArrayTools(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "array_status",
    "Get the current status of the Unraid storage array including disk health, capacity, and temperatures",
    {},
    async () => {
      const data = await client.query<{ array: ArrayStatus }>(ARRAY_STATUS_QUERY);
      const array = data.array;

      const cap = array.capacity;
      const usedPct = ((cap.usedBytes / cap.totalBytes) * 100).toFixed(1);

      const diskLines = array.disks.map((d) => {
        const temp = d.temp !== undefined ? ` ${d.temp}°C` : "";
        return `  ${d.name} (${d.device}) [${d.status}]${temp} ${formatBytes(d.fsUsedMb * 1024 * 1024)}/${formatBytes(d.fsTotalMb * 1024 * 1024)} used`;
      });

      const parityLines = array.parity.map(
        (p) => `  ${p.name} (${p.device}) [${p.status}] ${formatBytes(p.sizeMb * 1024 * 1024)}`
      );

      const lines = [
        `Array State: ${array.state}`,
        `Total Capacity: ${formatBytes(cap.totalBytes)} (${usedPct}% used)`,
        `Free: ${formatBytes(cap.freeBytes)}`,
        "",
        `Data Disks (${array.disks.length}):`,
        ...diskLines,
        "",
        `Parity Disks (${array.parity.length}):`,
        ...parityLines,
      ];

      return {
        content: [{ type: "text", text: lines.join("\n") }],
      };
    }
  );

  server.tool(
    "array_start",
    "Start the Unraid storage array",
    {},
    async () => {
      const mutation = `
        mutation StartArray {
          startArray { success message }
        }
      `;
      const data = await client.mutation<{ startArray: { success: boolean; message: string } }>(mutation);
      return {
        content: [{ type: "text", text: data.startArray.message }],
        isError: !data.startArray.success,
      };
    }
  );

  server.tool(
    "array_stop",
    "Stop the Unraid storage array (spins down disks)",
    {},
    async () => {
      const mutation = `
        mutation StopArray {
          stopArray { success message }
        }
      `;
      const data = await client.mutation<{ stopArray: { success: boolean; message: string } }>(mutation);
      return {
        content: [{ type: "text", text: data.stopArray.message }],
        isError: !data.stopArray.success,
      };
    }
  );
}
