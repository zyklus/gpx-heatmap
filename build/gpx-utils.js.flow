// @flow

import proj4 from 'proj4';

const maxZoom = 16;
const LatLngProjection = new proj4.Proj('EPSG:4326');
const GoogleProjection = new proj4.Proj('GOOGLE');

type tPixel = {
  x: number,
  y: number,
};

type tPoint = {
  lat: number,
  lon: number,
  datetime: Date,
};

export function latLonToXY(lat: number, lon: number): tPixel {
  return proj4(LatLngProjection, GoogleProjection, {
    x: lon,
    y: lat,
  });
}

export function pointToZoom(point: tPixel, zoom: number): tPixel {
  const divider = 1 << (maxZoom - zoom);
  return {
    x: point.x / divider,
    y: point.y / divider,
  };
}

function toRadians(n: number): number {
  return n * Math.PI / 180;
}

export function distanceFrom(point1: tPoint, point2: tPoint): number {
  const R = 6371000;
  const phi1 = toRadians(point1.lat);
  const phi2 = toRadians(point2.lat);
  const deltaPhi = toRadians(point2.lat - point1.lat);
  const deltaLambda = toRadians(point2.lon - point1.lon);

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function speedFrom(point1: tPoint, point2: tPoint, distance: number = distanceFrom(point1, point2)): number {
  const seconds = Math.abs(point2.datetime - point1.datetime) / 1000;

  return seconds === Infinity ? 0 : distance / seconds;
}

export function distanceAndSpeedFrom(point1: tPoint, point2: tPoint): { distance: number, speed: number } {
  const distance = distanceFrom(point1, point2);
  const speed = speedFrom(point1, point2, distance);

  return { distance, speed };
}
