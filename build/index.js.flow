// @flow

import path from 'path';

import GPXLoader from './gpx-loader';
import { latLonToXY, pointToZoom } from './gpx-utils';
import GPXTrackImage from './gpx-track-image';

const loader = new GPXLoader();

const BaliConstraints = {
  minLat: -8.903574,
  minLon: 114.377407,
  maxLat: -8.022882,
  maxLon: 115.734614,
};

async function foo() {
  console.time('read files');
  await loader.loadDir(path.resolve('../gpx-files'));
  console.timeEnd('read files');

  console.time('constrain');
  // const baliPoints = loader.constrainTo(BaliConstraints).getPoints();
  const baliPoints = loader.getPoints();
  console.timeEnd('constrain');

  const pixelConstraints = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };

  const zoom = 13;

  baliPoints.forEach(point => {
    point.pos = latLonToXY(point.lat, point.lon);
    if (point.pos.x < pixelConstraints.minX) pixelConstraints.minX = point.pos.x;
    if (point.pos.y < pixelConstraints.minY) pixelConstraints.minY = point.pos.y;
    if (point.pos.x > pixelConstraints.maxX) pixelConstraints.maxX = point.pos.x;
    if (point.pos.y > pixelConstraints.maxY) pixelConstraints.maxY = point.pos.y;
  });

  const width = (pixelConstraints.maxX - pixelConstraints.minX) / (1 << zoom);
  const height = (pixelConstraints.maxY - pixelConstraints.minY) / (1 << zoom);
  const img = new GPXTrackImage(width, height);

  img.addPoints(
    baliPoints.map(point => ({
      lat: point.lat,
      lon: point.lon,
      datetime: point.datetime,
      x: (point.pos.x - pixelConstraints.minX) / (1 << zoom),
      y: height - (point.pos.y - pixelConstraints.minY) / (1 << zoom),
    })),
  );

  img.create();

  await img.saveTo(path.resolve('../images/bali.png'));
}

foo();
