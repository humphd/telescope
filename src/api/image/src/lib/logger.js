const pino = require('pino');
// const pinoElastic = require('pino-elasticsearch');
const ecsFormat = require('@elastic/ecs-pino-format');

const { ELASTICSEARCH_HOSTS, LOG_LEVEL, NODE_ENV } = process.env;

// Elastic index name for logs
// const indexName = 'image-service';

// Deal with log levels we don't know, or which are incorrectly formatted
let logLevel = (LOG_LEVEL || 'info').toLowerCase();
if (!pino.levels.values[logLevel]) {
  // Use `debug` by default in development mode, `info` otherwise.
  logLevel = NODE_ENV === 'development' ? 'debug' : 'info';
}

let logger;

// Use Elastic if configured, otherwise just a default logger
if (ELASTICSEARCH_HOSTS) {
  // const streamToElastic = pinoElastic({
  //   index: indexName,
  //   consistency: 'one',
  //   node: ELASTICSEARCH_HOSTS,
  //   'es-version': 7,
  //   'flush-bytes': 1000,
  // });
  logger = pino({ level: logLevel, ...ecsFormat() }); // , streamToElastic);
} else {
  logger = pino({
    prettyPrint: true,
    level: logLevel,
  });
}

module.exports = logger;
