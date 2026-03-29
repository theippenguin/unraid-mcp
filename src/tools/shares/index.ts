import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GraphQLClient } from "../../lib/graphql.js";
import { Share } from "../../types/index.js";

const LIST_SHARES_QUERY = `
  query ListShares {
    shares {
      name
      comment
      useCache
      exportEnabled
      security
      allocator
    }
  }
`;

export function registerShareTools(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "shares_list",
    "List all user shares on the Unraid server with their SMB export status and cache settings",
    {},
    async () => {
      const data = await client.query<{ shares: Share[] }>(LIST_SHARES_QUERY);
      const shares = data.shares;

      const formatted = shares.map(
        (s) =>
          `${s.name} [${s.security}] cache=${s.useCache} export=${s.exportEnabled ? "yes" : "no"}${s.comment ? ` "${s.comment}"` : ""}`
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${shares.length} shares:\n\n${formatted.join("\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "shares_get",
    "Get detailed configuration of a specific share",
    { name: z.string().describe("Share name") },
    async ({ name }) => {
      const query = `
        query GetShare($name: String!) {
          share(name: $name) {
            name
            comment
            allocator
            floor
            splitLevel
            include
            exclude
            useCache
            exportEnabled
            security
          }
        }
      `;
      const data = await client.query<{ share: Share }>(query, { name });
      return {
        content: [{ type: "text", text: JSON.stringify(data.share, null, 2) }],
      };
    }
  );
}
