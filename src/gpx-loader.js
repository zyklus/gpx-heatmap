// @flow

import path from 'path';
import { promisify } from 'util';

import { fsAsync } from 'node-utils';
import memoize from 'memoized-decorator';
import { parseString } from 'xml2js';
import { speedFrom } from './gpx-utils';

import type { tAbsolutePath } from 'flow-types';

const { readdir, readFile, writeFile } = fsAsync;
const parseXML = promisify(parseString);

type tPoint = {
  lat: number,
  lon: number,
  datetime: Date,
};

type tConstraints = { min?: tPoint, max?: tPoint };

const CACHE_FILE_NAME = '.gpx-cache.json';
const MIN_SPEED_M_S = 0.2778; // 1km/hr

const dateSorter = (a: tPoint, b: tPoint) => a.datetime - b.datetime;
const getPointFilter = (constraints: tConstraints) => (point: tPoint) => {
  const min = constraints.min || {};
  const max = constraints.max || {};
  if (
    min.lat > point.lat ||
    min.lon > point.lon ||
    min.datetime > point.datetime ||
    max.lat < point.lat ||
    max.lon < point.lon ||
    max.datetime < point.datetime
  ) {
    return false;
  }
  return true;
};

function shouldKeepPoint(point: tPoint, index: number, points: Array<tPoint>): boolean {
  const prevPoint = points[index - 1];
  const nextPoint = points[index + 1];

  if (!prevPoint || !nextPoint) return true;

  const speedA = speedFrom(prevPoint, point);
  const speedB = speedFrom(point, nextPoint);

  if (speedA < MIN_SPEED_M_S && speedB < MIN_SPEED_M_S) return false;

  return true;
}

export default class GPXLoader {
  _points: Array<tPoint> = [];
  _gpxFilesConsumed: Array<tAbsolutePath> = [];
  _newFilesConsumed: boolean = false;
  constraints: tConstraints = {};

  @memoize
  async loadFile(filePath: tAbsolutePath): Promise<void> {
    if (this._gpxFilesConsumed.indexOf(filePath) >= 0) {
      return;
    }

    const contents = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();

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

  async loadGPX(contents: Buffer | string): Promise<void> {
    const gpxData = await parseXML(contents);
    const trks = gpxData.gpx.trk;
    let prevPoint = null;

    trks.forEach(trk =>
      trk.trkseg.forEach(trkseg =>
        trkseg.trkpt.forEach(trkpt => {
          const attribs = trkpt.$;
          const point = {
            lat: +(+attribs.lat).toFixed(6),
            lon: +(+attribs.lon).toFixed(6),
            datetime: new Date(trkpt.time[0]),
          };
          this._points.push(point);
          prevPoint = point;
        }),
      ),
    );

    this._points = this._points.filter(shouldKeepPoint);
  }

  loadJSON(contents: Buffer | string) {
    const jsonData = JSON.parse(contents.toString());

    if (!jsonData.points) {
      throw new Error('JSON structure does not contain any points');
    }

    jsonData.points.forEach(point => this._points.push({ lat: point[0], lon: point[1], datetime: new Date(point[2]) }));
    (jsonData.gpxFilesConsumed || []).forEach(filePath => this._gpxFilesConsumed.push(filePath));
  }

  @memoize
  async loadDir(dirPath: tAbsolutePath): Promise<void> {
    const files = await readdir(dirPath);
    const cacheIndex = files.indexOf(CACHE_FILE_NAME);

    if (cacheIndex >= 0) {
      await this.loadFile(path.resolve(dirPath, CACHE_FILE_NAME));
    }

    await Promise.all(files.map(file => this.loadFile(path.resolve(dirPath, file))))
      .then(() => this.sort())
      .then(() => this.writeJSON(path.resolve(dirPath, CACHE_FILE_NAME)));
  }

  sort() {
    this._points = this._points.sort(dateSorter);
  }

  async writeJSON(filePath: tAbsolutePath): Promise<void> {
    if (!this._newFilesConsumed) return;

    const data = {
      points: this._points.map(point => [point.lat, point.lon, point.datetime.toISOString()]),
      gpxFilesConsumed: this._gpxFilesConsumed,
    };

    await writeFile(filePath, JSON.stringify(data));
  }

  getPoints(): Array<tPoint> {
    return this._points.filter(getPointFilter(this.constraints));
  }

  constrainTo({
    minLat,
    minLon,
    minDate,
    maxLat,
    maxLon,
    maxDate,
  }: {
    minLat: number,
    minLon: number,
    minDate: Date,
    maxLat: number,
    maxLon: number,
    maxDate: Date,
  }): this {
    if (minLat > maxLat) throw new Error('min lat > max lat');
    if (minLon > maxLon) throw new Error('min lon > max lon');
    if (minDate > maxDate) throw new Error('min date > max date');
    this.constraints.min = { lat: minLat, lon: minLon, datetime: minDate };
    this.constraints.max = { lat: maxLat, lon: maxLon, datetime: maxDate };

    return this;
  }
}
