'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _gpxLoader = require('./gpx-loader');

var _gpxLoader2 = _interopRequireDefault(_gpxLoader);

var _gpxUtils = require('./gpx-utils');

var _gpxTrackImage = require('./gpx-track-image');

var _gpxTrackImage2 = _interopRequireDefault(_gpxTrackImage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const loader = new _gpxLoader2.default();

const BaliConstraints = {
  minLat: -8.903574,
  minLon: 114.377407,
  maxLat: -8.022882,
  maxLon: 115.734614
};

async function foo() {
  console.time('read files');
  await loader.loadDir(_path2.default.resolve('../gpx-files'));
  console.timeEnd('read files');

  console.time('constrain');
  // const baliPoints = loader.constrainTo(BaliConstraints).getPoints();
  const baliPoints = loader.getPoints();
  console.timeEnd('constrain');

  const pixelConstraints = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity
  };

  const zoom = 13;

  baliPoints.forEach(point => {
    point.pos = (0, _gpxUtils.latLonToXY)(point.lat, point.lon);
    if (point.pos.x < pixelConstraints.minX) pixelConstraints.minX = point.pos.x;
    if (point.pos.y < pixelConstraints.minY) pixelConstraints.minY = point.pos.y;
    if (point.pos.x > pixelConstraints.maxX) pixelConstraints.maxX = point.pos.x;
    if (point.pos.y > pixelConstraints.maxY) pixelConstraints.maxY = point.pos.y;
  });

  const width = (pixelConstraints.maxX - pixelConstraints.minX) / (1 << zoom);
  const height = (pixelConstraints.maxY - pixelConstraints.minY) / (1 << zoom);
  const img = new _gpxTrackImage2.default(width, height);

  img.addPoints(baliPoints.map(point => ({
    lat: point.lat,
    lon: point.lon,
    datetime: point.datetime,
    x: (point.pos.x - pixelConstraints.minX) / (1 << zoom),
    y: height - (point.pos.y - pixelConstraints.minY) / (1 << zoom)
  })));

  img.create();

  await img.saveTo(_path2.default.resolve('../images/bali.png'));
}

foo();