"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = gaussianBlur;


function gaussianBlur(pixelData, width, height, radius) {
  const input = [];
  const output = [];

  for (let i = 0; i < pixelData.data.length; i += 4) {
    input.push(pixelData.data[i + 3]);
  }

  gaussBlur(input, output, width, height, radius);

  for (let i = 0; i < pixelData.data.length; i += 4) {
    pixelData.data[i + 3] = output[i / 4];
  }
}

function gaussBlur(scl, tcl, w, h, r) {
  const bxs = boxesForGauss(r, 3);
  boxBlur(scl, tcl, w, h, (bxs[0] - 1) / 2);
  boxBlur(tcl, scl, w, h, (bxs[1] - 1) / 2);
  boxBlur(scl, tcl, w, h, (bxs[2] - 1) / 2);
}

function boxesForGauss(sigma, n) // standard deviation, number of boxes
{
  const wIdeal = Math.sqrt(12 * sigma * sigma / n + 1); // Ideal averaging filter width
  let wl = Math.floor(wIdeal);
  if (wl % 2 === 0) wl--;
  const wu = wl + 2;

  const mIdeal = (12 * sigma * sigma - n * wl * wl - 4 * n * wl - 3 * n) / (-4 * wl - 4);
  const m = Math.round(mIdeal);
  // const sigmaActual = Math.sqrt( (m*wl*wl + (n-m)*wu*wu - n)/12 );

  const sizes = [];
  for (let i = 0; i < n; i++) sizes.push(i < m ? wl : wu);
  return sizes;
}

function boxBlur(scl, tcl, w, h, r) {
  for (let i = 0; i < scl.length; i++) tcl[i] = scl[i];
  boxBlurH(tcl, scl, w, h, r);
  boxBlurT(scl, tcl, w, h, r);
}
function boxBlurH(scl, tcl, w, h, r) {
  const iarr = 1 / (r + r + 1);
  for (let i = 0; i < h; i++) {
    let ti = i * w,
        li = ti,
        ri = ti + r;
    const fv = scl[ti],
          lv = scl[ti + w - 1];
    let val = (r + 1) * fv;
    for (let j = 0; j < r; j++) val += scl[ti + j];
    for (let j = 0; j <= r; j++) {
      val += scl[ri++] - fv;
      tcl[ti++] = Math.round(val * iarr);
    }
    for (let j = r + 1; j < w - r; j++) {
      val += scl[ri++] - scl[li++];
      tcl[ti++] = Math.round(val * iarr);
    }
    for (let j = w - r; j < w; j++) {
      val += lv - scl[li++];
      tcl[ti++] = Math.round(val * iarr);
    }
  }
}
function boxBlurT(scl, tcl, w, h, r) {
  const iarr = 1 / (r + r + 1);
  for (let i = 0; i < w; i++) {
    let ti = i,
        li = ti,
        ri = ti + r * w;
    const fv = scl[ti],
          lv = scl[ti + w * (h - 1)];
    let val = (r + 1) * fv;
    for (let j = 0; j < r; j++) val += scl[ti + j * w];
    for (let j = 0; j <= r; j++) {
      val += scl[ri] - fv;
      tcl[ti] = Math.round(val * iarr);
      ri += w;
      ti += w;
    }
    for (let j = r + 1; j < h - r; j++) {
      val += scl[ri] - scl[li];
      tcl[ti] = Math.round(val * iarr);
      li += w;
      ri += w;
      ti += w;
    }
    for (let j = h - r; j < h; j++) {
      val += lv - scl[li];
      tcl[ti] = Math.round(val * iarr);
      li += w;
      ti += w;
    }
  }
}