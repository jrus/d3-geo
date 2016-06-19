import {asin, atan2, cos, sin, sqrt} from "../math";
import {conicProjection} from "./conic";

function conicEqualArea(y0, y1) {
  var sy0 = sin(y0),
      n = (sy0 + sin(y1)) / 2,
      c = 1 + sy0 * (2 * n - sy0),
      r0 = sqrt(c) / n;

  function project(x, y) {
    var r = sqrt(c - 2 * n * sin(y)) / n;
    return [r * sin(x *= n), r0 - r * cos(x)];
  }

  project.invert = function(x, y) {
    var r0y = r0 - y;
    return [atan2(x, r0y) / n, asin((c - (x * x + r0y * r0y) * n * n) / (2 * n))];
  };

  return project;
}

export default function() {
  return conicProjection(conicEqualArea)
      .scale(151)
      .translate([480, 347]);
}
