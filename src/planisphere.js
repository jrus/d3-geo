import {atan, atan2, cos, degrees, halfPi, hypot, radians, sin, sqrt, tan} from "./math.js";

var planisphere = function planisphere([longitude, latitude]) {
  longitude *= radians;
  const stereo_radius = tan(radians * 0.5 * (90 + latitude));
  return [cos(longitude) * stereo_radius, sin(longitude) * stereo_radius];
}

planisphere.inverse = function planisphereinverse([X, Y]) {
  const longitude = degrees * atan2(Y, X);
  const latitude = 2 * degrees * atan(hypot(X, Y)) - 90;
  return [longitude, latitude];
};


var planisphereRadians = function planisphere([longitude, latitude]) {
  const stereo_radius = tan(0.5 * (halfPi + latitude));
  return [cos(longitude) * stereo_radius, sin(longitude) * stereo_radius];
}

planisphereRadians.inverse = function planisphereinverse([X, Y]) {
  const longitude = atan2(Y, X);
  const latitude = 2 * atan(hypot(X, Y)) - halfPi;
  return [longitude, latitude];
};

// stereographic midpoint
var midpoint = (function () {
  var SMALL = 1/32,
      BIG = 1e8,
      HUGE = 1e100;

  return function midpoint([xa, ya], [xb, yb]) {
    var ra = xa*xa + ya*ya,
        rb = xb*xb + yb*yb,
        denom;

    // edge cases where a and/or b is close to the pole at infinity
    if ((ra > BIG) & (rb > BIG)) {
      // reflect across the equator, linearly interpolate, reflect back
      if (ra === Infinity) xa = ya = 0;
      else (xa *= 1/ra), (ya *= 1/ra);
      if (rb === Infinity) xb = yb = 0;
      else (xb *= 1/rb), (yb *= 1/rb);
      var xm = 0.5 * (xa + xb),
          ym = 0.5 * (ya + yb);
      denom = 1 / (xm*xm + ym*ym);
      if (denom > HUGE) return [Infinity, 0];
      return [xm * denom, ym * denom];
    }
    if (ra > HUGE) {
      if (rb === 0) return [1, 0]; // a infinite, b zero
      denom = 1 / (hypot(xb, yb, rb) - rb);
      return [xb * denom, yb * denom];
    }
    if (rb > HUGE) {
      if (ra === 0) return [1, 0]; // a zero, b infinite
      denom = 1 / (hypot(xa, ya, ra) - ra);
      return [xa * denom, ya * denom];
    }

    var wa = 0.5 + 0.5 * ra,
        wb = 0.5 + 0.5 * rb,
        zsum = wa + wb - 2*wa*wb,
        xsum = wb*xa + wa*xb,
        ysum = wb*ya + wa*yb,
        sum_length = hypot(zsum, xsum, ysum);

    // if points are nearly antipodal, orthogonalize; there can still
    // be errors here but we do get some point equidistant from both
    if (sum_length < (wa*wb) * SMALL) {
      var zdiff = wa - wb,
          xdiff = wa*xb - wb*xa,
          ydiff = wa*yb - wb*ya,
          scale = (zdiff*zsum + xdiff*xsum + ydiff*ysum) /
                   (zdiff*zdiff + xdiff*xdiff + ydiff*ydiff);
      // subtract part parallel to the diff vector
      zsum -= scale * zdiff;
      xsum -= scale * xdiff;
      ysum -= scale * ydiff;
      
      sum_length = hypot(zsum, xsum, ysum);
      
      // points are antipodal, so arbitrarily pick the
      // midpoint in the direction through the origin
      if (sum_length === 0) {
        zsum = sqrt(ra);
        xsum = (1 - zsum) * xa;
        ysum = (1 - zsum) * ya;
        sum_length = ra;
      }
    }
    denom = 1 / (zsum + sum_length);

    if (denom > HUGE) return [Infinity, 0]; // a = -b, |a| > 1
    return [xsum * denom, ysum * denom];
  }
})();


// Rational interpolation along a circular arc through a, m, and b.
// After arc = raterp(a, m, b), we have:
//   arc(0) == a, arc(0.5) == m, arc(1) == b
var raterp = function raterp(a, m, b) {
  var [xa, ya] = a, a2 = xa*xa + ya*ya,
      [xm, ym] = m, m2 = xm*xm + ym*ym,
      [xb, yb] = b, b2 = xb*xb + yb*yb,
      xh = xb - xa, yh = yb - ya,
      xu = xm - xa, yu = ym - ya,
      xv = xb - xm, yv = yb - ym,        
      // reverse === 1 if a is further away from the origin than b.
      reverse = +(a2 > b2), forward = 1 - reverse,        
      x_p0, y_p0, x_p1, y_p1;

  if (forward) {
    x_p0 = (xu*xv + yu*yv) * xh + (xu*yv - xv*yu) * yh; // uvh
    y_p0 = (xu*xv + yu*yv) * yh - (xu*yv - xv*yu) * xh;
    x_p1 = (xu*xu + yu*yu) * xh; // uuh
    y_p1 = (xu*xu + yu*yu) * yh;
  } else {
    // In the case where a is further from the origin than b
    // we anchor interpolation at b. This protects against
    // loss of significance in the case where b is much closer
    // to the origin than a, for which a + (b - a) might be
    // rounded heavily enough to not be especially close to b.
    xa = xb, ya = yb;
    x_p0 = (xv*xv + yv*yv) * xh; // vvh
    y_p0 = (xv*xv + yv*yv) * yh;
    x_p1 = (xu*xv + yu*yv) * xh - (xu*yv - xv*yu) * yh; // vuh
    y_p1 = (xu*xv + yu*yv) * yh + (xu*yv - xv*yu) * xh;
  }

  // hack the below interpolation function to correctly handle
  // the limited special cases where a, m, or b is infinity
  if ((a2 === Infinity) | (m2 === Infinity) | (b2 === Infinity)) {
    if ((a2 === Infinity) & (b2 === Infinity)) xa = NaN;
    if (m2 === Infinity) {
      x_p0 = -xh, y_p1 = -yh, xv = -1;
      x_p1 = xh, y_p1 = yh, xu = 1;
    } else {
      x_p0 = forward * xu, y_p1 = forward * yu, xv = forward;
      x_p1 = reverse * xv, y_p1 = reverse * yv, xu = reverse;
    }
    yv = yu = 0;
  }

  return function raterp(t) {
    var t_ = 1 - t,
        x_q = xv*t_ + xu*t, y_q = yv*t_ + yu*t,
        q = (t - reverse) / (x_q*x_q + y_q*y_q),
        xout = xa + q * (x_p0*t_ + x_p1*t),
        yout = ya + q * (y_p0*t_ + y_p1*t);

    // Handle NaNs from trying to divide 0 / 0^2 in edge cases
    if (xout !== xout) xout = Infinity, yout = 0;
    return ([xout, yout]);
  }
}


export {midpoint, planisphere, planisphereRadians, raterp};