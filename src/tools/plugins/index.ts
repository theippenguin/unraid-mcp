import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GraphQLClient } from "../../lib/graphql.js";
import { Plugin } from "../../types/index.js";

const LIST_PLUGINS_QUERY = `
  query ListPlugins {
    plugins {
      name
      version
      author
      description
      installed
      updateAvailable
    }
  }
`;

export function registerPluginTools(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "plugins_list",
    "List all installed Community Applications plugins with version info and available updates",
    {},
    async () => {
      const data = await client.query<{ plugins: Plugin[] }>(LIST_PLUGINS_QUERY);
      const plugins = data.plugins;

      const formatted = plugins.map((p) => {
        const update = p.updateAvailable ? " [UPDATE AVAILABLE]" : "";
        return `${p.name} v${p.version} by ${p.author}${update}`;
      });

      return {
        content: [
          {
            type: "text",
            text: `Found ${plugins.length} plugins:\n\n${formatted.join("\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "plugins_update",
    "Update a plugin to its latest version",
    { name: z.string().describe("Plugin name") },
    async ({ name }) => {
      const mutation = `
        mutation UpdatePlugin($name: String!) {
          updatePlugin(name: $name) { success message }
        }
      `;
      const data = await client.mutation<{ updatePlugin: { success: boolean; message: string } }>(mutation, {
        name,
      });
      return {
        content: [{ type: "text", text: data.updatePlugin.message }],
        isError: !data.updatePlugin.success,
      };
    }
  );
}
