import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
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

export function registerDockerTools(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "docker_list_containers",
    "List all Docker containers on the Unraid server with their status, image, and port mappings",
    {},
    async () => {
      const data = await client.query<{ dockerContainers: DockerContainer[] }>(LIST_CONTAINERS_QUERY);
      const containers = data.dockerContainers;

      const formatted = containers.map((c) => {
        const ports = c.ports
          .map((p) => `${p.hostPort}->${p.containerPort}/${p.protocol}`)
          .join(", ");
        return `${c.name} [${c.status}] image=${c.image} ports=${ports || "none"} autostart=${c.autostart}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${containers.length} containers:\n\n${formatted.join("\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "docker_start_container",
    "Start a stopped Docker container by name or ID",
    { id: z.string().describe("Container name or ID") },
    async ({ id }) => {
      const data = await client.mutation<{ startDockerContainer: { success: boolean; message: string } }>(
        START_CONTAINER_MUTATION,
        { id }
      );
      const result = data.startDockerContainer;
      return {
        content: [{ type: "text", text: result.message }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    "docker_stop_container",
    "Stop a running Docker container by name or ID",
    { id: z.string().describe("Container name or ID") },
    async ({ id }) => {
      const data = await client.mutation<{ stopDockerContainer: { success: boolean; message: string } }>(
        STOP_CONTAINER_MUTATION,
        { id }
      );
      const result = data.stopDockerContainer;
      return {
        content: [{ type: "text", text: result.message }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    "docker_restart_container",
    "Restart a Docker container by name or ID",
    { id: z.string().describe("Container name or ID") },
    async ({ id }) => {
      const data = await client.mutation<{ restartDockerContainer: { success: boolean; message: string } }>(
        RESTART_CONTAINER_MUTATION,
        { id }
      );
      const result = data.restartDockerContainer;
      return {
        content: [{ type: "text", text: result.message }],
        isError: !result.success,
      };
    }
  );

  server.tool(
    "docker_get_logs",
    "Get recent logs from a Docker container",
    {
      id: z.string().describe("Container name or ID"),
      lines: z.number().optional().default(100).describe("Number of log lines to retrieve (default 100)"),
    },
    async ({ id, lines }) => {
      const query = `
        query GetContainerLogs($id: String!, $lines: Int) {
          dockerContainerLogs(id: $id, lines: $lines)
        }
      `;
      const data = await client.query<{ dockerContainerLogs: string }>(query, { id, lines });
      return {
        content: [{ type: "text", text: data.dockerContainerLogs || "(no logs)" }],
      };
    }
  );

  server.tool(
    "docker_inspect_container",
    "Get detailed configuration and state of a Docker container",
    { id: z.string().describe("Container name or ID") },
    async ({ id }) => {
      const query = `
        query InspectContainer($id: String!) {
          dockerContainer(id: $id) {
            id
            name
            image
            status
            state
            autostart
            cpuPercent
            memUsage
            ports {
              hostPort
              containerPort
              protocol
            }
          }
        }
      `;
      const data = await client.query<{ dockerContainer: DockerContainer }>(query, { id });
      return {
        content: [{ type: "text", text: JSON.stringify(data.dockerContainer, null, 2) }],
      };
    }
  );
}
