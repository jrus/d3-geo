import {hypot} from "./math.js";
import {planisphere} from "./planisphere.js";

// See https://observablehq.com/@jrus/circle-arc-interpolation

export default function interpolate(a, b) {
  var [xa, ya] = planisphere(a),
      [xb, yb] = planisphere(b);

  // if a == b, don’t bother interpolating
  if ((xa === xb) & (ya === yb)) {
    return function () { return a; }
  }

  // TODO: make sure we still pick a meaningful midpoint for a antipodal to b

  var za = 0.5*(1 - xa*xa - ya*ya),
      zb = 0.5*(1 - xb*xb - yb*yb),
      wa = 1 - za,
      wb = 1 - zb,
      denom = 1 / ((wa*zb + wb*za) +
        hypot(wa*zb + wb*za, wa*xb + wb*xa, wa*yb + wb*ya)),
      xh = xb - xa,
      yh = yb - ya;

  // edge case when the midpoint is near infinity
  if (denom*denom === Infinity) {
    return function interpolate(t) {
      var q = t / (2*t - 1);
      return planisphere.inverse([
        xa + q * xh,
        ya + q * yh
      ]);
    }
  }

  var xm = (wa*xb + wb*xa) * denom,  // midpoint
      ym = (wa*yb + wb*ya) * denom,
      xu = xm - xa,
      yu = ym - ya,
      xv = xb - xm,
      yv = yb - ym,
      // reverse == true if a is further away from the origin than b.
      reverse = +(wa > wb),
      forward = 1 - reverse;

  // edge case where a or b is infinite
  if ((xh*xh + yh*yh) === Infinity) {
    if (reverse) xa = xb, ya = yb, xu = -xv, yu = -yv;
    return function interpolate(t) {
      var q = - (t - reverse) / (t - forward);
      return planisphere.inverse([
        xa + q * xu,
        ya + q * yu
      ]);
    }
  }

  var x_p0, y_p0, x_p1, y_p1;
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

  return function interpolate(t) {
    var t_ = 1 - t,
        x_q = xv*t_ + xu*t,
        y_q = yv*t_ + yu*t,
        q = (t - reverse) / (x_q*x_q + y_q*y_q);
    return planisphere.inverse([
      xa + q * (x_p0*t_ + x_p1*t),
      ya + q * (y_p0*t_ + y_p1*t)
    ]);
  }
}
