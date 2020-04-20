import {hypot} from "./math.js";
import {planisphere} from "./planisphere.js";

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
      var q = t / (2*t - 1);  // t / lerp(-1,1,t)
      return planisphere.inverse([
        xa + q * xh,
        ya + q * yh
      ]);
    }
  }
  
  var xm = (wa*xb + wb*xa) * denom,  // midpoint
      ym = (wa*yb + wb*ya) * denom,
      xu = xm - xa, yu = ym - ya,
      xv = xb - xm, yv = yb - ym;
  
  // See https://observablehq.com/@jrus/circle-arc-interpolation
  
  // To avoid loss of significance, pick whether to anchor our
  // interpolation at either a or b depending on which one is
  // closer to the origin. This helps protect against the edge
  // case where a is close to the pole at infinity or b is close
  // to the pole at the origin, at the slight computational expense
  // of one extra branch here.
  var reverse = +(wa > wb),
      x0, y0, x_p0, y_p0, x_p1, y_p1;    
  if (!reverse) {
    x0 = xa;
    y0 = ya;
    x_p0 = (xu*xv + yu*yv) * xh + (xu*yv - xv*yu) * yh; // uvh
    y_p0 = (xu*xv + yu*yv) * yh - (xu*yv - xv*yu) * xh;
    x_p1 = (xu*xu + yu*yu) * xh; // uuh
    y_p1 = (xu*xu + yu*yu) * yh;
  } else {
    x0 = xb;
    y0 = yb;
    x_p0 = (xv*xv + yv*yv) * xh; // vvh
    y_p0 = (xv*xv + yv*yv) * yh;
    x_p1 = (xu*xv + yu*yv) * xh - (xu*yv - xv*yu) * yh; // vuh
    y_p1 = (xu*xv + yu*yv) * yh + (xu*yv - xv*yu) * xh;
  }
  
  // edge case where a or b is infinite
  // We redefine u and v to be [0, 0] and [1, 0] or vice versa
  // as a hack so the function below still behaves as desired.
  if ((xh*xh + yh*yh) === Infinity) {
    x_p0 = (1 - reverse) * xu;
    y_p0 = (1 - reverse) * yu;
    x_p1 = reverse * xv;
    y_p1 = reverse * yv;
    xv = 1 - reverse;
    xu = reverse;
    yv = yu = 0;
  }
  
  return function interpolate(t) {
    var t_ = 1 - t,
        x_q = xv*t_ + xu*t,
        y_q = yv*t_ + yu*t,
        q = (t - reverse) / (x_q*x_q + y_q*y_q);
    return planisphere.inverse([
      x0 + q * (x_p0*t_ + x_p1*t),
      y0 + q * (y_p0*t_ + y_p1*t)
    ]);
  }
}
