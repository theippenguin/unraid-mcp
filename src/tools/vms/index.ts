import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GraphQLClient } from "../../lib/graphql.js";
import { VirtualMachine } from "../../types/index.js";

const LIST_VMS_QUERY = `
  query ListVMs {
    vms {
      id
      name
      status
      cpus
      memoryMb
      os
    }
  }
`;

export function registerVmTools(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "vm_list",
    "List all virtual machines on the Unraid server with their status and resource allocation",
    {},
    async () => {
      const data = await client.query<{ vms: VirtualMachine[] }>(LIST_VMS_QUERY);
      const vms = data.vms;

      const formatted = vms.map(
        (vm) => `${vm.name} [${vm.status}] os=${vm.os} cpus=${vm.cpus} mem=${vm.memoryMb}MB`
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${vms.length} virtual machines:\n\n${formatted.join("\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "vm_start",
    "Start a stopped virtual machine by name or ID",
    { id: z.string().describe("VM name or ID") },
    async ({ id }) => {
      const mutation = `
        mutation StartVM($id: String!) {
          startVm(id: $id) { success message }
        }
      `;
      const data = await client.mutation<{ startVm: { success: boolean; message: string } }>(mutation, { id });
      return {
        content: [{ type: "text", text: data.startVm.message }],
        isError: !data.startVm.success,
      };
    }
  );

  server.tool(
    "vm_stop",
    "Stop a running virtual machine gracefully by name or ID",
    { id: z.string().describe("VM name or ID") },
    async ({ id }) => {
      const mutation = `
        mutation StopVM($id: String!) {
          stopVm(id: $id) { success message }
        }
      `;
      const data = await client.mutation<{ stopVm: { success: boolean; message: string } }>(mutation, { id });
      return {
        content: [{ type: "text", text: data.stopVm.message }],
        isError: !data.stopVm.success,
      };
    }
  );

  server.tool(
    "vm_pause",
    "Pause a running virtual machine",
    { id: z.string().describe("VM name or ID") },
    async ({ id }) => {
      const mutation = `
        mutation PauseVM($id: String!) {
          pauseVm(id: $id) { success message }
        }
      `;
      const data = await client.mutation<{ pauseVm: { success: boolean; message: string } }>(mutation, { id });
      return {
        content: [{ type: "text", text: data.pauseVm.message }],
        isError: !data.pauseVm.success,
      };
    }
  );
}
