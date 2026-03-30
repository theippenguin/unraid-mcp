import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { GraphQLClient } from "../../lib/graphql.js";
import { DockerContainer } from "../../types/index.js";

const LIST_CONTAINERS_QUERY = `
  query ListContainers {
    dockerContainers {
      id
      name
      image
      status
      state
      autostart
      ports {
        hostPort
        containerPort
        protocol
      }
    }
  }
`;

const START_CONTAINER_MUTATION = `
  mutation StartContainer($id: String!) {
    startDockerContainer(id: $id) {
      success
      message
    }
  }
`;

const STOP_CONTAINER_MUTATION = `
  mutation StopContainer($id: String!) {
    stopDockerContainer(id: $id) {
      success
      message
    }
  }
`;

const RESTART_CONTAINER_MUTATION = `
  mutation RestartContainer($id: String!) {
    restartDockerContainer(id: $id) {
      success
      message
    }
  }
`;

function registerListContainers(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "docker_list_containers",
    "List all Docker containers on the Unraid server with their status, image, and port mappings",
    {},
    async (): Promise<CallToolResult> => {
      const data = await client.query<{ dockerContainers: DockerContainer[] }>(LIST_CONTAINERS_QUERY);
      const containers = data.dockerContainers;
      const formatted = containers.map((c) => {
        const ports = c.ports.map((p) => `${p.hostPort}->${p.containerPort}/${p.protocol}`).join(", ");
        return `${c.name} [${c.status}] image=${c.image} ports=${ports || "none"} autostart=${c.autostart}`;
      });
      return {
        content: [{ type: "text", text: `Found ${containers.length} containers:\n\n${formatted.join("\n")}` }],
      };
    }
  );
}

function registerStartContainer(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "docker_start_container",
    "Start a stopped Docker container by name or ID",
    { id: z.string() },
    async ({ id }): Promise<CallToolResult> => {
      const data = await client.mutation<{ startDockerContainer: { success: boolean; message: string } }>(
        START_CONTAINER_MUTATION,
        { id }
      );
      const result = data.startDockerContainer;
      return { content: [{ type: "text", text: result.message }], isError: !result.success };
    }
  );
}

function registerStopContainer(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "docker_stop_container",
    "Stop a running Docker container by name or ID",
    { id: z.string().describe("Container name or ID") },
    async ({ id }): Promise<CallToolResult> => {
      const data = await client.mutation<{ stopDockerContainer: { success: boolean; message: string } }>(
        STOP_CONTAINER_MUTATION,
        { id }
      );
      const result = data.stopDockerContainer;
      return { content: [{ type: "text", text: result.message }], isError: !result.success };
    }
  );
}

function registerRestartContainer(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "docker_restart_container",
    "Restart a Docker container by name or ID",
    { id: z.string().describe("Container name or ID") },
    async ({ id }): Promise<CallToolResult> => {
      const data = await client.mutation<{ restartDockerContainer: { success: boolean; message: string } }>(
        RESTART_CONTAINER_MUTATION,
        { id }
      );
      const result = data.restartDockerContainer;
      return { content: [{ type: "text", text: result.message }], isError: !result.success };
    }
  );
}

function registerGetLogs(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "docker_get_logs",
    "Get recent logs from a Docker container",
    {
      id: z.string().describe("Container name or ID"),
      lines: z.number().describe("Number of log lines to retrieve (default 100)").optional(),
    },
    async ({ id, lines }): Promise<CallToolResult> => {
      const logLines = lines ?? 100;
      const query = `
        query GetContainerLogs($id: String!, $lines: Int) {
          dockerContainerLogs(id: $id, lines: $lines)
        }
      `;
      const data = await client.query<{ dockerContainerLogs: string }>(query, { id, lines: logLines });
      return { content: [{ type: "text", text: data.dockerContainerLogs || "(no logs)" }] };
    }
  );
}

function registerInspectContainer(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "docker_inspect_container",
    "Get detailed configuration and state of a Docker container",
    { id: z.string().describe("Container name or ID") },
    async ({ id }): Promise<CallToolResult> => {
      const query = `
        query InspectContainer($id: String!) {
          dockerContainer(id: $id) {
            id name image status state autostart cpuPercent memUsage
            ports { hostPort containerPort protocol }
          }
        }
      `;
      const data = await client.query<{ dockerContainer: DockerContainer }>(query, { id });
      return { content: [{ type: "text", text: JSON.stringify(data.dockerContainer, null, 2) }] };
    }
  );
}

export function registerDockerTools(server: McpServer, client: GraphQLClient): void {
  registerListContainers(server, client);
  registerStartContainer(server, client);
  registerStopContainer(server, client);
  registerRestartContainer(server, client);
  registerGetLogs(server, client);
  registerInspectContainer(server, client);
}
