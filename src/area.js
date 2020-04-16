import {atan2, tau} from "./math.js";
import noop from "./noop.js";
import {planisphere} from "./planisphere.js";
import stream from "./stream.js";

export var areaRingSum = 0;

var areaSum = 0,
  longitude_first,
  latitude_first,
  x_prev,
  y_prev;

export var areaStream = {
  point: noop,
  lineStart: noop,
  lineEnd: noop,
  polygonStart: function() {
    areaRingSum = 0;
    areaStream.lineStart = areaRingStart;
    areaStream.lineEnd = areaRingEnd;
  },
  polygonEnd: function() {
    // ignore areas smaller than 10^-16
    if ((areaRingSum > 1e-16) | (-areaRingSum > 1e-16))
      areaSum += areaRingSum + tau * (areaRingSum < 0);
    this.lineStart = this.lineEnd = this.point = noop;
  },
  sphere: function() {
    areaSum += tau;
  }
};

function areaRingStart() {
  areaStream.point = areaPointFirst;
}

function areaRingEnd() {
  areaPoint(longitude_first, latitude_first);
}

function areaPointFirst(longitude, latitude) {
  (longitude_first = longitude), (latitude_first = latitude);
  var [x, y] = planisphere([longitude, latitude]);
  (x_prev = x), (y_prev = y);
  areaStream.point = areaPoint;
}
 
function areaPoint(longitude, latitude) {
  var [x, y] = planisphere([longitude, latitude]);
  
  // Spherical excess of a spherical triangle with vertices:
  // [(0, 0), previous point, current point]
  areaRingSum += atan2(
    x_prev * y - y_prev * x,
    x_prev * x + y_prev * y + 1);
  
  (x_prev = x), (y_prev = y);  // advance previous points
}

export default function(object) {
  areaSum = 0;
  stream(object, areaStream);
  return areaSum * 2;
}
