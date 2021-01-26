const { formatDistance } = require('date-fns');

/** @type {BuildStatus} Status, one of 'idle' or 'building' */
let currentStatus = 'idle';
/** @type {BuildType} Type of build, one of 'production' or 'staging' */
let currentBuildType;
/** @type {Date} When the last build completed */
let recentBuildDate;
/** @type {'success' | 'failure'} Whether last build worked or failed */
let recentBuildResult;
/** @type {Date} Date when the last build began, null if not building */
let currentBuildStartedAt;

function handleStatus(req, res) {
  const info = {
    status: currentStatus,
  };

  if (currentStatus === 'building') {
    info.currentBuildType = currentBuildType;
  }

  if (recentBuildDate) {
    info.recentBuildDate = recentBuildDate;
  }

  if (recentBuildResult) {
    info.recentBuildResult = recentBuildResult;
  }

  // If a build is in progress, and we have a start time, format a duration
  if (currentBuildStartedAt) {
    info.started = currentBuildStartedAt;
    info.duration = formatDistance(new Date(), currentBuildStartedAt);
  }

  res.writeHead(200, { 'content-type': 'application/json' });
  res.write(JSON.stringify(info));
  res.end();
}

module.exports.buildStart = function (type) {
  currentBuildStartedAt = new Date();
  currentStatus = `building`;
  currentBuildType = type;
};

module.exports.buildStop = function (code) {
  currentBuildStartedAt = null;
  recentBuildResult = code === 0 ? 'success' : 'failure';
  recentBuildDate = new Date();
  currentStatus = 'idle';
};

module.exports.handleStatus = handleStatus;
