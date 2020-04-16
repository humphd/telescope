require('../../lib/config');
const express = require('express');
const { UI } = require('bull-board');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

const { protectAdmin } = require('../authentication');
const { logger } = require('../../utils/logger');

const router = express.Router();

// Only authenticated admins can use these routes
router.use('/queues', protectAdmin(true), UI);

// Only authenticated admin users can see this route
router.get('/log', protectAdmin(true), (req, res) => {
  let readStream;
  if (!process.env.LOG_FILE) {
    res.send('LOG_FILE undefined in .env file');
    return;
  }
  try {
    readStream = fs.createReadStream(process.env.LOG_FILE);

    res.append('Content-type', 'text/plain');
    readStream.pipe(res).on('error', (error) => {
      logger.error({ error });
      readStream.destroy();
    });

    res.on('error', (error) => {
      logger.error({ error });
      readStream.destroy();
    });
  } catch (error) {
    res.send(error.message);
  }
});

/**
 * Proxy a few useful requests from the auto deployment server here.  The first
 * is for getting status info about the state of the deploy server.  The second
 * is for piping build logs in real-time.  Get the port for the deploy server
 * from the tools/autodeployment/.env file.
 */
let DEPLOY_PORT;
try {
  const deployEnv = dotenv.config({
    path: path.join(__dirname, '../../../../', 'tools/autodeployment/.env'),
  });
  DEPLOY_PORT = parseInt(deployEnv.parsed.DEPLOY_PORT, 10);
} catch (err) {
  logger.debug('No DEPLOY_PORT found, skipping /admin/build/status and /admin/build/log routes');
}

if (DEPLOY_PORT) {
  router.use(
    '/build/status',
    protectAdmin(true),
    createProxyMiddleware({
      target: `http://localhost:${DEPLOY_PORT}`,
      pathRewrite: {
        '^/admin/build/status': '/status',
      },
    })
  );
  router.use(
    '/build/log',
    protectAdmin(true),
    createProxyMiddleware({
      target: `http://localhost:${DEPLOY_PORT}`,
      pathRewrite: {
        '^/admin/build/log': '/log',
      },
    })
  );
}

module.exports = router;
