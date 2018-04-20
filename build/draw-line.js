"use strict";

const iPart = x => Math.floor(x);
const round = x => Math.round(x);
const fPart = x => x % 1;
const rfPart = x => 1 - fPart(x);

function drawLine(drawPxFn, x0, y0, x1, y1, width = 1) {
  const isSteep = Math.abs(y1 - y0) > Math.abs(x1 - x0);

  if (isSteep) {
    [x0, y0] = [y0, x0];
    [x1, y1] = [y1, x1];
  }
  if (x0 > x1) {
    [x0, x1] = [x1, x0];
    [y0, y1] = [y1, y0];
  }

  const dX = x1 - x0;
  const dY = y1 - y0;
  const gradient = dX === 0 ? 1 : dY / dX;

  const xEnd = round(x0);
  const yEnd = y0 + gradient * (xEnd - x0);
  const xPxl1 = xEnd;
  const xPxl2 = round(x1);
  let intery = yEnd + gradient;

  // prettier-ignore
  const drawFn = isSteep ? (a, b, c) => drawPxFn(b, a, c) : (a, b, c) => drawPxFn(a, b, c);

  // main loop
  for (let x = xPxl1 + 1; x <= xPxl2 - 1; x++) {
    let w = width + fPart(intery) - 1;
    const rf = rfPart(w);
    drawFn(x, iPart(intery), rfPart(intery));
    w -= rf;
    let yOffset = 1;
    for (; w > 0; w--, yOffset++) {
      drawFn(x, iPart(intery) + yOffset, w);
    }
    intery += gradient;
  }
}