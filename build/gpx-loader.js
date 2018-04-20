'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _desc, _value, _class;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _util = require('util');

var _nodeUtils = require('node-utils');

var _memoizedDecorator = require('memoized-decorator');

var _memoizedDecorator2 = _interopRequireDefault(_memoizedDecorator);

var _xml2js = require('xml2js');

var _gpxUtils = require('./gpx-utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

const { readdir, readFile, writeFile } = _nodeUtils.fsAsync;
const parseXML = (0, _util.promisify)(_xml2js.parseString);

const CACHE_FILE_NAME = '.gpx-cache.json';
const MIN_SPEED_M_S = 0.2778; // 1km/hr

const dateSorter = (a, b) => a.datetime - b.datetime;
const getPointFilter = constraints => point => {
  const min = constraints.min || {};
  const max = constraints.max || {};
  if (min.lat > point.lat || min.lon > point.lon || min.datetime > point.datetime || max.lat < point.lat || max.lon < point.lon || max.datetime < point.datetime) {
    return false;
  }
  return true;
};

function shouldKeepPoint(point, index, points) {
  const prevPoint = points[index - 1];
  const nextPoint = points[index + 1];

  if (!prevPoint || !nextPoint) return true;

  const speedA = (0, _gpxUtils.speedFrom)(prevPoint, point);
  const speedB = (0, _gpxUtils.speedFrom)(point, nextPoint);

  if (speedA < MIN_SPEED_M_S && speedB < MIN_SPEED_M_S) return false;

  return true;
}

let GPXLoader = (_class = class GPXLoader {
  constructor() {
    this._points = [];
    this._gpxFilesConsumed = [];
    this._newFilesConsumed = false;
    this.constraints = {};
  }

  async loadFile(filePath) {
    if (this._gpxFilesConsumed.indexOf(filePath) >= 0) {
      return;
    }

    const contents = await readFile(filePath);
    const ext = _path2.default.extname(filePath).toLowerCase();

    switch (ext) {
      case '.gpx':
        await this.loadGPX(contents);
        this._gpxFilesConsumed.push(filePath);
        this._newFilesConsumed = true;
        break;

      case '.json':
        await this.loadJSON(contents);
        break;
    }
  }

  async loadGPX(contents) {
    const gpxData = await parseXML(contents);
    const trks = gpxData.gpx.trk;
    let prevPoint = null;

    trks.forEach(trk => trk.trkseg.forEach(trkseg => trkseg.trkpt.forEach(trkpt => {
      const attribs = trkpt.$;
      const point = {
        lat: +(+attribs.lat).toFixed(6),
        lon: +(+attribs.lon).toFixed(6),
        datetime: new Date(trkpt.time[0])
      };
      this._points.push(point);
      prevPoint = point;
    })));

    this._points = this._points.filter(shouldKeepPoint);
  }

  loadJSON(contents) {
    const jsonData = JSON.parse(contents.toString());

    if (!jsonData.points) {
      throw new Error('JSON structure does not contain any points');
    }

    jsonData.points.forEach(point => this._points.push({ lat: point[0], lon: point[1], datetime: new Date(point[2]) }));
    (jsonData.gpxFilesConsumed || []).forEach(filePath => this._gpxFilesConsumed.push(filePath));
  }

  async loadDir(dirPath) {
    const files = await readdir(dirPath);
    const cacheIndex = files.indexOf(CACHE_FILE_NAME);

    if (cacheIndex >= 0) {
      await this.loadFile(_path2.default.resolve(dirPath, CACHE_FILE_NAME));
    }

    await Promise.all(files.map(file => this.loadFile(_path2.default.resolve(dirPath, file)))).then(() => this.sort()).then(() => this.writeJSON(_path2.default.resolve(dirPath, CACHE_FILE_NAME)));
  }

  sort() {
    this._points = this._points.sort(dateSorter);
  }

  async writeJSON(filePath) {
    if (!this._newFilesConsumed) return;

    const data = {
      points: this._points.map(point => [point.lat, point.lon, point.datetime.toISOString()]),
      gpxFilesConsumed: this._gpxFilesConsumed
    };

    await writeFile(filePath, JSON.stringify(data));
  }

  getPoints() {
    return this._points.filter(getPointFilter(this.constraints));
  }

  constrainTo({
    minLat,
    minLon,
    minDate,
    maxLat,
    maxLon,
    maxDate
  }) {
    if (minLat > maxLat) throw new Error('min lat > max lat');
    if (minLon > maxLon) throw new Error('min lon > max lon');
    if (minDate > maxDate) throw new Error('min date > max date');
    this.constraints.min = { lat: minLat, lon: minLon, datetime: minDate };
    this.constraints.max = { lat: maxLat, lon: maxLon, datetime: maxDate };

    return this;
  }
}, (_applyDecoratedDescriptor(_class.prototype, 'loadFile', [_memoizedDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'loadFile'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'loadDir', [_memoizedDecorator2.default], Object.getOwnPropertyDescriptor(_class.prototype, 'loadDir'), _class.prototype)), _class);
exports.default = GPXLoader;