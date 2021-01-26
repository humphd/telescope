require('dotenv').config();

const path = require('path');
const https = require('https');
const { IncomingMessage, ServerResponse } = require('http');
const createHandler = require('github-webhook-handler');
const shell = require('shelljs');
const mergeStream = require('merge-stream');
const fs = require('fs');

const { buildStart, buildStop, handleStatus } = require('./info');

let out;
const {
  SECRET,
  REPO_NAME,
  DEPLOY_PORT,
  DEPLOY_TYPE,
  UNSPLASH_CLIENT_ID,
  PATH_TO_CERTS,
} = process.env;

const privateKey = fs.readFileSync(path.join(PATH_TO_CERTS, 'privkey.pem'));
const certificate = fs.readFileSync(path.join(PATH_TO_CERTS, 'fullchain.pem'));

const credentials = {
  key: privateKey,
  cert: certificate,
};

/** @param {IncomingMessage} req */
/** @parm {import} */
function handleError(req, res) {
  res.statusCode = 404;
  res.end('Not Found');
}

// If a build is in process, pipe stderr and stdout to the request
function handleLog(req, res) {
  if (!out) {
    handleError(req, res);
    return;
  }

  /** @param {string} message */
  function end(message) {
    if (message) {
      res.write(message);
    }
    res.end();
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });

  out.on('data', (data) => res.write(data));
  out.on('error', () => end('Error, end of log.'));
  out.on('end', () => end('Build Complete.'));
}

const handleGitPush = createHandler({ path: '/', secret: SECRET });

https
  .createServer(credentials, (req, res) => {
    // Build Status Info as JSON
    if (req.url === '/status') {
      handleStatus(req, res);
    }
    // Build Log Stream (if build is happening)
    else if (req.url === '/log') {
      handleLog(req, res);
    }
    // Process GitHub Push Event, or error (404)
    else {
      handleGitPush(req, res, () => handleError(req, res));
    }
  })
  .listen(DEPLOY_PORT, () => {
    console.log(`Server listening on port ${DEPLOY_PORT}.\nUse /status or /log for build info.`);
  });

handleGitPush.on('error', (err) => {
  console.error('Error:', err.message);
});

if (!(DEPLOY_TYPE === 'staging' || DEPLOY_TYPE === 'production')) {
  console.error("DEPLOY_TYPE must be one of 'staging' or 'production'");
  process.exit(1);
}

/**
 * GitHub's webhooks send 3 POST requests with different actions whenever a release event takes place: created, published and released.
 * To prevent the autodeployment server from processing the 3 requests (and eventually crashing),
 * we need to only allow the request whose action is 'published'.
 * More information about release events here:
 * https://docs.github.com/en/actions/reference/events-that-trigger-workflows#release
 * The filter combines checking for staging or production build types and also for the right type of action for a release event in production builds
 * @param {string} name - Repository name (should be 'telescope')
 * @param {BuildType} buildType - Build type: staging or production
 * @param {string} action - Action for a specific release event: created, published, released, etc.
 */
function requestFilter(name, buildType, action) {
  return (
    name === REPO_NAME &&
    (buildType === 'staging' || (buildType === 'production' && action === 'published'))
  );
}

/**
 * Create a handler for the particular GitHub push event and build type
 * @param {BuildType} buildType one of `production` or `staging`
 * @param {import('@octokit/webhooks-definitions/schema').WebhookEventName} gitHubEvent the GitHub Push Event name
 */
function handleEventType(buildType, gitHubEvent) {
  if (DEPLOY_TYPE !== buildType) {
    return;
  }

  handleGitPush.on(gitHubEvent, (event) => {
    const { name } = event.payload.repository;
    const { action } = event.payload;

    if (requestFilter(name, buildType, action)) {
      buildStart(buildType);
      const proc = shell.exec(
        `./deploy.sh ${buildType} ${UNSPLASH_CLIENT_ID}`,
        { silent: true },
        (code, stdout, stderr) => {
          out = null;
          buildStop(code);
          console.log(stdout);
          console.error(stderr);
        }
      );

      // Combine stderr and stdout, like 2>&1
      out = mergeStream(proc.stdout, proc.stderr);
    }
  });
}

// Production builds happen when GitHub sends us a `release` event
handleEventType('production', 'release');

// Staging builds happen when GitHub sends us a `push` event
handleEventType('staging', 'push');
