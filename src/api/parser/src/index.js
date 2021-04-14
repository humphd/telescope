const { Satellite, isAuthenticated, isAuthorized } = require('@senecacdot/satellite');
const { router } = require('bull-board');
// const startParserQueue = require('./parser-queue');

const service = new Satellite();

// We're commenting startParserQueue() for now so it doesn't clash with our current backend, will uncomment when tests go in and we remove the backend.
// startParserQueue();

// Only authenticated Telescope users, or other services, can hit this route
service.router.get(
  '/',
  isAuthenticated(),
  isAuthorized((req, user) => user.roles.includes('telescope') || user.roles.includes('service')),
  router
);

module.exports = service;
