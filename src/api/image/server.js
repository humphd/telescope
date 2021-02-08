const { createServer } = require('http');
const { createTerminus } = require('@godaddy/terminus');
const app = require('./src/app.js');
const { download } = require('./src/lib/photos');
const logger = require('./src/lib/logger');

const server = createServer(app);

// Graceful shutdown and /healthcheck
createTerminus(server, {
  healthChecks: {
    '/healthcheck': () => Promise.resolve(),
  },
  signal: 'SIGINT',
  logger,
});

const port = process.env.IMAGE_PORT || 4444;
server.listen(port, () => {
  // Once the server is running, start downloading any missing photos
  download();
});

module.exports = server;
