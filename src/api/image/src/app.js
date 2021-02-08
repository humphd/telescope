const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const createError = require('http-errors');
const expressPino = require('express-pino-logger');

const logger = require('./lib/logger');
const routes = require('./routes');

const app = express();
app.use(expressPino({ logger }));
app.use(helmet());
app.use(cors());

// Include our router with all endpoints
app.use('/', routes);

// 404
app.use(function (req, res, next) {
  next(createError(404));
});

// Default error handler
// eslint-disable-next-line no-unused-vars
app.use(function (err, req, res, next) {
  req.log.error(err.stack);

  res.status(err.status || 500);

  if (req.accepts('html')) {
    res.set('Content-Type', 'text/html');
    res.send(`<h1>${err.status} Error</h1><p>${err.message}</p>`);
  } else if (req.accepts('json')) {
    res.json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.send(`${err.status} Error: ${err.message}\n`);
  }
});

module.exports = app;
