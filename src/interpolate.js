import {hypot} from "./math.js";
import {planisphere} from "./planisphere.js";

export default function interpolate(a, b) {
  var [xa, ya] = planisphere(a),
      [xb, yb] = planisphere(b);

  if ((xa === xb) & (ya === yb)) {
    return function () { return a; }
  }
  
  // TODO: make sure we still pick a meaningful midpoint for a antipodal to b
  // TODO: properly handle the case where a or b is the pole at infinity

  var za = 0.5*(1 - xa*xa - ya*ya), 
      zb = 0.5*(1 - xb*xb - yb*yb),
      wa = 1 - za,
      wb = 1 - zb,
      denom = 1 / ((wa*zb + wb*za) +
        hypot(wa*zb + wb*za, wa*xb + wb*xa, wa*yb + wb*ya)),
      xh = xb - xa,
      yh = yb - ya;

  // edge case when the midpoint is near infinity and we can let u/v = -1
  if (denom*denom == Infinity) {
    return function interpolate(t) {
      var q = t / (2*t - 1);  // t / lerp(-1,1,t)
      return planisphere.inverse([
        xa + q * xh,
        ya + q * yh
      ]);
    }
  }
  var xm = (wa*xb + wb*xa) * denom,  // midpoint
      ym = (wa*yb + wb*ya) * denom,

      // See https://observablehq.com/@jrus/circle-arc-interpolation
      xu = xm - xa,
      yu = ym - ya,
      xv = xb - xm,
      yv = yb - ym,
      x_uvh = (xu*xv + yu*yv) * xh + (xu*yv - xv*yu) * yh,
      y_uvh = (xu*xv + yu*yv) * yh - (xu*yv - xv*yu) * xh,
      x_uuh = (xu*xu + yu*yu) * xh,
      y_uuh = (xu*xu + yu*yu) * yh;
  return function interpolate(t) {
    var t_ = 1 - t,
        x_q = xv*t_ + xu*t,
        y_q = yv*t_ + yu*t,
        q = t / (x_q*x_q + y_q*y_q);  // t / lerp(v,u,t)^2
    return planisphere.inverse([
      xa + q * (x_uvh*t_ + x_uuh*t),  // a + q * lerp(uvh,uuh,t)
      ya + q * (y_uvh*t_ + y_uuh*t)
    ]);
  }
}
