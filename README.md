# unraid-mcp

An MCP (Model Context Protocol) server that enables AI assistants like Claude to manage Unraid servers through natural language. Install it once from Community Applications and control your homelab from any MCP-compatible AI client.

## Features

61 tools across 8 categories:

| Category | Tools | Description |
|----------|-------|-------------|
| Docker | 5 | List, start, stop, restart containers; get logs |
| VMs | 4 | List, start, stop, pause virtual machines |
| Array | 3 | Status, start, stop the storage array |
| Shares | 2 | List and inspect user shares |
| Users | 1 | List user accounts |
| System | 3 | System info, reboot, shutdown |
| Plugins | 2 | List plugins, trigger updates |
| Network | 1 | List network interfaces and stats |

Example interactions:
- *"Show me all running Docker containers and their memory usage"*
- *"Stop the Plex container, wait 10 seconds, then start it again"*
- *"What's the health of my array disks? Any temperatures I should worry about?"*
- *"List all VMs and tell me which ones are using the most memory"*

## Architecture

```
AI Client (Claude Desktop, etc.)
        │  MCP over HTTP (Streamable HTTP transport)
        ▼
  unraid-mcp server  ← binary compiled with bun, runs as Unraid plugin
        │
        ├── GraphQL API (port 31337, Unraid 7.2+) ← primary
        └── CLI / file parsing                     ← fallback
```

**GraphQL-first:** Unraid 7.2 introduced a GraphQL API on port 31337. All tools use it as the primary backend for reliability and type safety.

**CLI fallback:** For operations not yet in the GraphQL API, tools fall back to parsing `/proc` files, running `docker` CLI commands, or reading Unraid config files directly.

**Compiled binary:** The server is compiled to a standalone executable with `bun compile` — no Node.js or npm required on the Unraid host.

## Installation

### Community Applications (recommended)

1. Open Community Applications in your Unraid UI
2. Search for "Unraid MCP"
3. Click Install
4. Go to **Settings → Unraid MCP** to configure your API key and port

### Manual

Download the latest `.plg` file and install via **Plugins → Install Plugin** in your Unraid UI.

## Configuration

After installation, configure via **Settings → Unraid MCP** in the Unraid UI:

| Setting | Default | Description |
|---------|---------|-------------|
| `UNRAID_HOST` | `localhost` | Unraid host (usually localhost) |
| `UNRAID_GRAPHQL_PORT` | `31337` | GraphQL API port (Unraid 7.2+) |
| `UNRAID_API_KEY` | *(required)* | Generate at Settings → API Keys |
| `UNRAID_USE_TLS` | `false` | Use HTTPS for GraphQL connection |
| `MCP_SERVER_PORT` | `3000` | Port for the MCP server |
| `LOG_LEVEL` | `info` | Logging verbosity |

### Connecting Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "unraid": {
      "url": "http://YOUR_UNRAID_IP:3000/mcp"
    }
  }
}
```

Replace `YOUR_UNRAID_IP` with your Unraid server's IP address.

## Development

### Prerequisites

- Node.js 18+ or Bun
- TypeScript

### Setup

```bash
git clone https://github.com/lherron/unraid-mcp
cd unraid-mcp
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Unraid connection details

# Start in development mode
npm run dev
```

### Environment variables

```bash
UNRAID_HOST=192.168.1.100
UNRAID_GRAPHQL_PORT=31337
UNRAID_API_KEY=your-api-key-here
UNRAID_USE_TLS=false
MCP_SERVER_PORT=3000
LOG_LEVEL=debug
```

### Build

```bash
# TypeScript compilation
npm run build

# Compile to standalone binary (requires bun)
npm run compile

# Create Slackware .txz package for Unraid
npm run package
```

### Project structure

```
src/
  index.ts              # MCP server entry point
  lib/
    graphql.ts          # GraphQL client
    auth.ts             # API key auth helpers
    config.ts           # Config loading from env
  tools/
    docker/index.ts     # Docker management tools
    vms/index.ts        # VM management tools
    array/index.ts      # Array management tools
    shares/index.ts     # Share management tools
    users/index.ts      # User management tools
    system/index.ts     # System info tools
    plugins/index.ts    # Plugin management tools
    network/index.ts    # Network tools
  types/
    index.ts            # TypeScript type definitions
plugin/
  unraid-mcp.plg        # Unraid plugin descriptor
  settings.php          # Settings page for Unraid UI
scripts/
  package.sh            # Build and package script
```

## Contributing

Contributions welcome! Areas that need work:

- **More tools:** The Unraid GraphQL API has many more operations — PRs adding tools are very welcome
- **CLI fallbacks:** Improve fallbacks for Unraid versions below 7.2
- **Testing:** Integration tests against a real or mocked Unraid API
- **Documentation:** Better examples and use cases

### Adding a new tool

1. Find the relevant tool category under `src/tools/`
2. Add a new `server.tool(...)` call following the existing pattern
3. Define the GraphQL query/mutation as a constant
4. Add TypeScript types to `src/types/index.ts` if needed
5. Submit a PR with a description of the tool and the GraphQL operation it uses

### Reporting issues

Please open an issue at https://github.com/lherron/unraid-mcp/issues with:
- Your Unraid version
- The tool that failed
- The error message
- Steps to reproduce

## License

MIT — see [LICENSE](LICENSE)
