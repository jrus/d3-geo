import {hypot} from "./math.js";
import noop from "./noop.js";
import {planisphere} from "./planisphere.js"
import stream from "./stream.js";

var x_prev, y_prev, q_prev, lengthSum = 0;


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
  (x_prev = x), (y_prev = y);
  q_prev = 1 / (1 + x_prev * x_prev + y_prev * y_prev);
  lengthStream.point = lengthPoint;
}

function lengthPoint(longitude, latitude) {
  var [x, y] = planisphere([longitude, latitude]);
  var q = 1 / (1 + x * x + y * y);
  if (q === 0) x = y = 0; // handle pole at infinity
  lengthSum += Math.asin(hypot(
    q - q_prev, q * x - q_prev * x_prev, q * y - q_prev * y_prev));
  (q_prev = q), (x_prev = x), (y_prev = y);
}

export default function(object) {
  lengthSum = 0;
  stream(object, lengthStream);
  return 2 * lengthSum;
}
