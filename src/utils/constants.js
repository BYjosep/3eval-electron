const path = require('path');
const { app } = require('electron');

const POINTS_FILE = path.join(app.getPath('userData'), 'points.json');

module.exports = { POINTS_FILE };
