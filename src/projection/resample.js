import {cartesian, cartesianDot, cartesianMidpoint} from "../cartesian.js";
import {abs, asin, atan2, cos, epsilon, radians} from "../math.js";
import {transformer} from "../transform.js";

var maxDepth = 16, // maximum depth of subdivision
    cosMinDistance = cos(30 * radians); // cos(minimum angular distance)

export default function(project, delta2) {
  return +delta2 ? resample(project, delta2) : resampleNone(project);
}

function resampleNone(project) {
  return transformer({
    point: function(x, y) {
      x = project(x, y);
      this.stream.point(x[0], x[1]);
    }
  });
}

function resample(project, delta2) {

  // Test if the projected midpoint m is close enough to the segment
  // midpoint between a and b that we can adequately approximate the
  // arc a-m-b using a straight line segment
  function midpointTooFar(a, m, b) {
    var [xa, ya] = a, [xm, ym] = m, [xb, yb] = b,
        dx = xb - xa, dy = yb - ya,
        qinv = 1 / (dx*dx + dy*dy),
        dx2 = xm - xa, dy2 = ym - ya,
        // parallelogram area between p0, p1, pm
        darea = dy * dx2 - dx * dy2,
        // proportional parallel distance between projected midpoint and segment midpoint
        dpara = (dx * dx2 + dy * dy2) * qinv - 0.5;
    return (darea * darea * qinv > delta2 // perpendicular distance to midpoint too big
            || dpara * dpara > 0.09);     // projected midpoint too far from segment midpoint
  }

  function distance2(a, b) {
    var dx = b[0] - a[0],
        dy = b[1] - a[1];
    return dx * dx + dy * dy;
  }

  function resampleLineTo(p0, lon0, c0, p1, lon1, c1, depth, stream) {

    // terminate if distance between ends is less than 2 * delta or recursion depth exceeded
    if (distance2(p0, p1) > 4 * delta2 && depth--) {
      var cm = cartesianMidpoint(c0, c1),
          latm = asin(cm[2]), // geo coordinates of midpoint
          lonm = atan2(cm[1], cm[0]);

      // fix edge case for midpoint near north/south pole or very close longitudes
      if ((1 - cm[2]*cm[2]) < 2 * epsilon || abs(lon1 - lon0) < epsilon)
        lonm = 0.5 * (lon0 + lon1);

      var pm = project(lonm, latm);

      // if midpoint outside box or arclength too long, recursively bisect
      if (midpointTooFar(p0, pm, p1) || cartesianDot(c0, c1) < cosMinDistance) {
        resampleLineTo(p0, lon0, c0, pm, lonm, cm, depth, stream);
        stream.point(pm[0], pm[1]);
        resampleLineTo(pm, lonm, cm, p1, lon1, c1, depth, stream);
      }
    }
  }
  return function(stream) {
    var lambda00, p00, c00, // first point
        lambda0, p0, c0; // previous point

    var resampleStream = {
      point: point,
      lineStart: lineStart,
      lineEnd: lineEnd,
      polygonStart: function() { stream.polygonStart(); resampleStream.lineStart = ringStart; },
      polygonEnd: function() { stream.polygonEnd(); resampleStream.lineStart = lineStart; }
    };

    function point(x, y) {
      x = project(x, y);
      stream.point(x[0], x[1]);
    }

    function lineStart() {
      p0 = [NaN, NaN];
      resampleStream.point = linePoint;
      stream.lineStart();
    }

    function linePoint(lambda, phi) {
      var c = cartesian([lambda, phi]), p = project(lambda, phi);
      resampleLineTo(p0, lambda0, c0, p0 = p, lambda0 = lambda, c0 = c, maxDepth, stream);
      stream.point(p0[0], p0[1]);
    }

    function lineEnd() {
      resampleStream.point = point;
      stream.lineEnd();
    }

    function ringStart() {
      lineStart();
      resampleStream.point = ringPoint;
      resampleStream.lineEnd = ringEnd;
    }

    function ringPoint(lambda, phi) {
      linePoint(lambda00 = lambda, phi), p00 = p0, c00 = c0;
      resampleStream.point = linePoint;
    }

    function ringEnd() {
      resampleLineTo(p0, lambda0, c0, p00, lambda00, c00, maxDepth, stream);
      resampleStream.lineEnd = lineEnd;
      lineEnd();
    }

    return resampleStream;
  };
}
