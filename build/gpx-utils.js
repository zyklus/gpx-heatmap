'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.latLonToXY = latLonToXY;
exports.pointToZoom = pointToZoom;
exports.distanceFrom = distanceFrom;
exports.speedFrom = speedFrom;
exports.distanceAndSpeedFrom = distanceAndSpeedFrom;

var _proj = require('proj4');

var _proj2 = _interopRequireDefault(_proj);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const maxZoom = 16;

const LatLngProjection = new _proj2.default.Proj('EPSG:4326');
const GoogleProjection = new _proj2.default.Proj('GOOGLE');

function latLonToXY(lat, lon) {
  return (0, _proj2.default)(LatLngProjection, GoogleProjection, {
    x: lon,
    y: lat
  });
}

function pointToZoom(point, zoom) {
  const divider = 1 << maxZoom - zoom;
  return {
    x: point.x / divider,
    y: point.y / divider
  };
}

function toRadians(n) {
  return n * Math.PI / 180;
}

function distanceFrom(point1, point2) {
  const R = 6371000;
  const phi1 = toRadians(point1.lat);
  const phi2 = toRadians(point2.lat);
  const deltaPhi = toRadians(point2.lat - point1.lat);
  const deltaLambda = toRadians(point2.lon - point1.lon);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function speedFrom(point1, point2, distance = distanceFrom(point1, point2)) {
  const seconds = Math.abs(point2.datetime - point1.datetime) / 1000;

  return seconds === Infinity ? 0 : distance / seconds;
}

function distanceAndSpeedFrom(point1, point2) {
  const distance = distanceFrom(point1, point2);
  const speed = speedFrom(point1, point2, distance);

  return { distance, speed };
}