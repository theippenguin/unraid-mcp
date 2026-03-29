import { McpServerConfig } from "../types/index.js";
import { buildAuthHeaders } from "./auth.js";

export class GraphQLClient {
  private readonly endpoint: string;
  private readonly headers: Record<string, string>;

  constructor(config: McpServerConfig) {
    const protocol = config.unraid.useTls ? "https" : "http";
    this.endpoint = `${protocol}://${config.unraid.host}:${config.unraid.port}/graphql`;
    this.headers = buildAuthHeaders(config);
  }

  async query<T = unknown>(query: string, variables?: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed: ${response.status} ${response.statusText}`);
    }

    const json = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

    if (json.errors && json.errors.length > 0) {
      throw new Error(`GraphQL error: ${json.errors.map((e) => e.message).join(", ")}`);
    }

    if (json.data === undefined) {
      throw new Error("GraphQL response missing data field");
    }

    return json.data;
  }

  async mutation<T = unknown>(mutation: string, variables?: Record<string, unknown>): Promise<T> {
    return this.query<T>(mutation, variables);
  }
}
