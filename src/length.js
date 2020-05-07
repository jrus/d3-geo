import {asin, hypot} from "./math.js";
import noop from "./noop.js";
import {planisphere} from "./planisphere.js"
import stream from "./stream.js";

var x_prev, y_prev, z_prev, lengthSum = 0;

// The theory of this computation of spherical arclength
// from stereographic coordinates is that we can take
// the stereo coordinates x, y to represent the point (1, x, y)
// and then we can invert across a unit sphere to yield
// points on the unit-diameter sphere z^2 + x^2 + y^2 = z.
// To get from chord-length on this sphere to arclength,
// we can take the arcsine.
var lengthStream = {
  sphere: noop,
  point: noop,
  lineStart: lengthLineStart,
  lineEnd: noop,
  polygonStart: noop,
  polygonEnd: noop
};

function lengthLineStart() {
  lengthStream.point = lengthPointFirst;
  lengthStream.lineEnd = lengthLineEnd;
}

function lengthLineEnd() {
  lengthStream.point = lengthStream.lineEnd = noop;
}

function lengthPointFirst(longitude, latitude) {
  var [x, y] = planisphere([longitude, latitude]);
  z_prev = 1 / (1 + x * x + y * y);
  (x_prev = x * z_prev), (y_prev = y * z_prev);
  lengthStream.point = lengthPoint;
}

function lengthPoint(longitude, latitude) {
  var [x, y] = planisphere([longitude, latitude]);
  var z = 1 / (1 + x * x + y * y);
  if (z === 0) x = y = 0; // avoid NaN when x or y is infinite
  x *= z;
  y *= z;
  lengthSum += asin(hypot(
    z - z_prev, x - x_prev, y - y_prev));
  (z_prev = z), (x_prev = x), (y_prev = y);
}

export default function(object) {
  lengthSum = 0;
  stream(object, lengthStream);
  return 2 * lengthSum;
}
