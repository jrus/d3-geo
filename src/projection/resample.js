import {planisphere, midpoint, raterp} from "../planisphere.js";
import {transformer} from "../transform.js";

var maxDepth = 16; // maximum depth of subdivision

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
    var dx = b[0] - a[0],
        dy = b[1] - a[1],
        qinv = 1 / (dx*dx + dy*dy),
        dx2 = m[0] - a[0],
        dy2 = m[1] - a[1],
        darea = dy * dx2 - dx * dy2, // parallelogram area between p0, p1, pm
        dparallel = (dx * dx2 + dy * dy2) * qinv - 0.5;
    return (darea * darea * qinv > delta2     // perpendicular distance to midpoint too big
            || dparallel * dparallel > 0.09); // projected midpoint too far from segment midpoint
  }

  function distance2(a, b) {
    var dx = b[0] - a[0],
        dy = b[1] - a[1];
    return dx * dx + dy * dy;
  }
  
  // The square of the stereographic distance from a to b is
  // distance2(a, b) / distanceDenom2(a, b)
  function distanceDenom2(a, b) {
    var d1 = 1 + a[0] * b[0] + a[1] + b[1],
        dI = a[0] * b[1] - a[1] * b[0];
    return d1 * d1 + dI * dI;
  }
  
  function resampleLineTo(p0, s0, p1, s1, depth, stream) {
    if (distance2(p0, p1) > 4 * delta2 && depth--) {
      var sm = midpoint(s0, s1),
          [lonm, latm] = planisphere.inverse(sm),
          pm = project(lonm, latm); // projected midpoint
      
      // make sure we bisect until smaller than ~28 degree segments
      var distp = distance2(s0, s1) * 16,
          distq = distanceDenom2(s0, s1);
      
      if (midpointTooFar(p0, pm, p1, delta2) || (distp > distq)) {
        var interp = raterp(s0, sm, s1); // set up interpolation function

        resampleFromInterp(p0, 0, pm, 0.5, interp, (distp > distq * 4), depth, stream);
        stream.point(pm[0], pm[1]);
        resampleFromInterp(pm, 0.5, p1, 1, interp, (distp > distq * 4), depth, stream);
      }
    }
  }
  
  function resampleFromInterp(p0, t0, p1, t1, interp, forceOneBisection, depth, stream) {
    if (distance2(p0, p1) > 4 * delta2 && depth--) {
      var tm = 0.5 * (t0 + t1),
          [lonm, latm] = planisphere.inverse(interp(tm)),
          pm = project(lonm, latm); // projected midpoint

      if (midpointTooFar(p0, pm, p1, delta2) || forceOneBisection) {
        resampleFromInterp(p0, t0, pm, tm, interp, 0, depth, stream);
        stream.point(pm[0], pm[1]);
        resampleFromInterp(pm, tm, p1, t1, interp, 0, depth, stream);
      }
    } 
  }
  
  
  return function(stream) {
    var p00, s00, // first point
        p0, s0;   // previous point

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
      p0 = [NaN, NaN]; // notice that distance2(p0, p) > 4 * delta2 will be false for this p0
      resampleStream.point = linePoint;
      stream.lineStart();
    }

    function linePoint(lon, lat) {
      var s = planisphere([lon, lat]),
          p = project(lon, lat);
      resampleLineTo(p0, s0, p0 = p, s0 = s, maxDepth, stream);
      stream.point(p[0], p[1]);
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

    function ringPoint(lon, lat) {
      linePoint(lon, lat), p00 = p0, s00 = s0;
      resampleStream.point = linePoint;
    }

    function ringEnd() {
      resampleLineTo(p0, s0, p00, s00, maxDepth, stream);
      resampleStream.lineEnd = lineEnd;
      lineEnd();
    }

    return resampleStream;
  };
}
