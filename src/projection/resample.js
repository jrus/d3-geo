import {cartesian} from "../cartesian.js";
import {asin, atan2, cos, epsilon, hypot, radians} from "../math.js";
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

  function resampleLineTo(x0, y0, lambda0, a0, b0, c0, x1, y1, lambda1, a1, b1, c1, depth, stream) {
    var dx = x1 - x0,
        dy = y1 - y0,
        d2 = dx * dx + dy * dy;
        
    // terminate if distance between ends is less than 2 * delta or recursion depth exceeded
    if (d2 > 4 * delta2 && depth--) {

      // find midpoint in cartesian coordinates
      var am = a0 + a1,
          bm = b0 + b1,
          cm = c0 + c1,
          scale = 1 / hypot(am, bm, cm);
      am *= scale, bm *= scale, cm *= scale;
      
      // get geo coordinates of midpoint; apply projection
      var phi2 = asin(cm),
          lambda2 = atan2(bm, am);
         
      if ((1 - cm*cm) < 2 * epsilon  // midpoint near north/south pole
          || (lambda0 - lambda1)*(lambda0 - lambda1) < epsilon*epsilon) // very close longitudes
        lambda2 = 0.5 * (lambda0 + lambda1);
      
      var p = project(lambda2, phi2),
          xm = p[0],
          ym = p[1],
      
          // displacement from first endpoint to midpoint
          dx2 = xm - x0,
          dy2 = ym - y0,
          
          // parallelogram area between p0, p1, pm
          darea = dy * dx2 - dx * dy2,
          dperp = darea * darea * (1 / d2),
          // proportional parallel distance between projected midpoint and segment midpoint
          dpara = (dx * dx2 + dy * dy2) * (1 / d2) - 0.5;
          
      if (dperp > delta2          // perpendicular distance to midpoint too big
          || dpara * dpara > 0.09 // projected midpoint too far from segment midpoint
          || a0 * a1 + b0 * b1 + c0 * c1 < cosMinDistance) { // angular distance too big

        // recursively bisect
        resampleLineTo(x0, y0, lambda0, a0, b0, c0, xm, ym, lambda2, am, bm, cm, depth, stream);
        stream.point(xm, ym);
        resampleLineTo(xm, ym, lambda2, am, bm, cm, x1, y1, lambda1, a1, b1, c1, depth, stream);
      }
    }
  }
  return function(stream) {
    var lambda00, x00, y00, a00, b00, c00, // first point
        lambda0, x0, y0, a0, b0, c0; // previous point

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
      x0 = NaN;
      resampleStream.point = linePoint;
      stream.lineStart();
    }

    function linePoint(lambda, phi) {
      var c = cartesian([lambda, phi]), p = project(lambda, phi);
      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x0 = p[0], y0 = p[1], lambda0 = lambda, a0 = c[0], b0 = c[1], c0 = c[2], maxDepth, stream);
      stream.point(x0, y0);
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
      linePoint(lambda00 = lambda, phi), x00 = x0, y00 = y0, a00 = a0, b00 = b0, c00 = c0;
      resampleStream.point = linePoint;
    }

    function ringEnd() {
      resampleLineTo(x0, y0, lambda0, a0, b0, c0, x00, y00, lambda00, a00, b00, c00, maxDepth, stream);
      resampleStream.lineEnd = lineEnd;
      lineEnd();
    }

    return resampleStream;
  };
}
