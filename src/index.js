const http = require('http');
const path = require('path');

const HTTP_PORT = Number(process.env.HTTP_PORT || 3000);

const rest = require('./servers/rest');
const graphql = require('./servers/graphql');
const ws = require('./servers/ws');
const grpc = require('./servers/grpc');
const mqtt = require('./servers/mqtt');

async function startServer() {
  // Create REST express app
  const app = rest.createApp();

  // Attach GraphQL middleware to the same app
  await graphql.apply(app);

  // Start HTTP server for REST + GraphQL
  const server = http.createServer(app);
  server.listen(HTTP_PORT, () => {
    console.log(`REST API listening on http://localhost:${HTTP_PORT}`);
    console.log(`GraphQL API available at http://localhost:${HTTP_PORT}/graphql`);
  });

  // Start other protocol servers (they run independently)
  ws.start();
  grpc.start();
  mqtt.start();

  return server;
}

startServer().catch((error) => {
  console.error('Failed to start server', error);
  process.exit(1);
});
