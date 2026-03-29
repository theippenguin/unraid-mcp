import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { GraphQLClient } from "../../lib/graphql.js";
import { UnraidUser } from "../../types/index.js";

const LIST_USERS_QUERY = `
  query ListUsers {
    users {
      name
      description
      passwordSet
    }
  }
`;

export function registerUserTools(server: McpServer, client: GraphQLClient): void {
  server.tool(
    "users_list",
    "List all user accounts on the Unraid server",
    {},
    async () => {
      const data = await client.query<{ users: UnraidUser[] }>(LIST_USERS_QUERY);
      const users = data.users;

      const formatted = users.map(
        (u) =>
          `${u.name}${u.description ? ` (${u.description})` : ""} password=${u.passwordSet ? "set" : "NOT SET"}`
      );

      return {
        content: [
          {
            type: "text",
            text: `Found ${users.length} users:\n\n${formatted.join("\n")}`,
          },
        ],
      };
    }
  );
}
