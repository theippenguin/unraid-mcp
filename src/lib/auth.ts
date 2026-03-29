import { McpServerConfig } from "../types/index.js";

export function buildAuthHeaders(config: McpServerConfig): Record<string, string> {
  return {
    "x-api-key": config.unraid.apiKey,
    "Content-Type": "application/json",
  };
}

export function validateApiKey(provided: string, expected: string): boolean {
  // Constant-time comparison to prevent timing attacks
  if (provided.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < provided.length; i++) {
    diff |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
