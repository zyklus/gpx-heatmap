// @flow

import fs from 'fs';
import canvas from 'canvas';
import { speedFrom, distanceAndSpeedFrom } from './gpx-utils';

import blur from './canvas-blur';

type tPoint = { lat: number, lon: number, datetime: Date, x: number, y: number };

const CANVAS_LINE_WIDTH = 3;
const ALPHA_BLUR_RADIUS = 2;
const MIN_ALPHA = 10 / 255;
const MIN_SOLID_ALPHA = 100;
const MIN_SPEED_M_S = 1000 / 60 / 60; // 1km/hr
const ARC_MIN_SPEED_M_S = MIN_SPEED_M_S * 200;
const ARC_MIN_M = 100 * 1000;

const colors = [
  [0, 0, 150, 100],
  [0, 150, 150, 133],
  [0, 150, 0, 166],
  [255, 0, 0, 200],
  [255, 255, 0, 233],
  [255, 0, 0, 255],
  [255, 255, 255, 255],
];

const color_transitions = colors.map((color1, index) => {
  if (index === colors.length - 1) return [0, 0, 0, 0];

  return [
    colors[index + 1][0] - color1[0],
    colors[index + 1][1] - color1[1],
    colors[index + 1][2] - color1[2],
    colors[index + 1][3] - color1[3],
  ];
});

const phase_size = 254.9 / (255 / (colors.length - 1));

function getColors(alpha: number) {
  if (!alpha) {
    return [0, 0, 0, 0];
  }

  const phase = alpha * phase_size;
  const stage = Math.floor(phase);
  const transition = color_transitions[stage];
  const percent = phase % 1;
  const color1 = colors[stage];

  return [
    color1[0] + transition[0] * percent,
    color1[1] + transition[1] * percent,
    color1[2] + transition[2] * percent,
    alpha < MIN_ALPHA ? alpha * 255 * (MIN_SOLID_ALPHA / (MIN_ALPHA * 255)) : color1[3] + transition[3] * percent,
  ];
}

function colorize(pixels: Array<number>, maxAlpha: number, width: number, height: number) {
  for (let i = 0; i < pixels.length; i += 4) {
    const alpha = pixels[i + 3] / maxAlpha;
    const newPixels = getColors(easeOut(alpha));

    pixels[i + 0] = newPixels[0];
    pixels[i + 1] = newPixels[1];
    pixels[i + 2] = newPixels[2];
    pixels[i + 3] = newPixels[3];
  }
  const alpha = pixels[3] / maxAlpha;
  return getColors(easeOut(alpha));
}

function easeOut(percent: number) {
  return 1 - Math.abs(Math.pow(percent - 1, 2));
}

function shouldSkipDrawing(point, prevPoint): boolean {
  if (!prevPoint) return false;

  const speed = speedFrom(prevPoint, point);

  if (speed < MIN_SPEED_M_S) return true;

  return false;
}

function shouldDrawArc(point: tPoint, prevPoint: tPoint): boolean {
  const { distance, speed } = distanceAndSpeedFrom(point, prevPoint);

  return speed >= ARC_MIN_SPEED_M_S || distance >= ARC_MIN_M;
}

export default class GPXTrackImage {
  width: number;
  height: number;
  points: Array<tPoint>;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    this.width = Math.floor(width);
    this.height = Math.floor(height);
  }

  addPoints(points: Array<point>) {
    this.points = points;
  }

  create() {
    this.canvas = canvas.createCanvas(this.width, this.height);
    this.ctx = this.canvas.getContext('2d');

    this.ctx.antialias = 'none';
    this.ctx.strokeStyle = `rgba(255, 0, 0, ${MIN_ALPHA})`;
    this.ctx.lineWidth = CANVAS_LINE_WIDTH;

    this.ctx.moveTo(this.points[0].x, this.points[0].y);
    this.ctx.lineCap = 'butt';

    let prevPoint = null;
    console.time('draw initial paths');
    this.points.forEach(point => {
      if (!shouldSkipDrawing(point, prevPoint)) {
        // if (shouldDrawArc(point, prevPoint)) {
        //   this.drawArc(point, prevPoint);
        // } else {
        this.ctx.lineTo(point.x, point.y);
        this.ctx.stroke();
        // }
      }
      this.ctx.beginPath();
      this.ctx.moveTo(point.x, point.y);
      prevPoint = point;
    });
    console.timeEnd('draw initial paths');

    console.time('measure alpha');
    const pixelData = this.ctx.getImageData(0, 0, this.width, this.height);
    let maxAlpha = 0;
    for (let i = 3; i < pixelData.data.length; i += 4) {
      maxAlpha = Math.max(maxAlpha, pixelData.data[i]);
    }
    console.timeEnd('measure alpha');

    console.time('blur');
    blur(pixelData, this.width, this.height, ALPHA_BLUR_RADIUS);
    console.timeEnd('blur');

    console.time('colorize');
    colorize(pixelData.data, maxAlpha, this.width, this.height);
    console.timeEnd('colorize');

    console.time('write image data');
    this.ctx.putImageData(pixelData, 0, 0);
    console.timeEnd('write image data');
  }

  drawArc(point: tPoint, prevPoint: tPoint) {
    const { ctx } = this;
  }

  saveTo(path) {
    console.time('save file');
    fs.writeFile(path, this.canvas.toBuffer());
    console.timeEnd('save file');
  }
}
