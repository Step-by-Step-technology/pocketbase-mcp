/**
 * Point d'entrée du MCP Server avec outils PocketBase
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerPocketbaseTools } from './pocketbase-tools.js';

// Créer le serveur MCP
const server = new McpServer({
  name: 'pocketbase-mcp-server',
  version: '1.0.0',
});

// Enregistrer les outils PocketBase
registerPocketbaseTools(server);

// Ajouter une ressource de statut
server.registerResource(
  'status',
  'status://pocketbase-mcp',
  {
    title: 'PocketBase MCP Server Status',
    description: 'État du serveur MCP pour PocketBase',
    mimeType: 'text/plain',
  },
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: `PocketBase MCP Server\nVersionn: 1.0.0\nDémarré: ${new Date().toISOString()}`,
      },
    ],
  })
);

// Connecter avec Stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[MCP] PocketBase Server connecté');
}

main().catch((error) => {
  console.error('[MCP] Erreur:', error);
  process.exit(1);
});
