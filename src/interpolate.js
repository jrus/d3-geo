import {sqrt, hypot} from "./math.js";
import {planisphere} from "./planisphere.js";

export default function interpolate(a, b) {
  const [xa, ya] = planisphere(a);
  const [xb, yb] = planisphere(b);

  if ((xa === xb) & (ya === yb)) {
    return function interpolate(t) {
      return a;
    }
  }

  const za = 0.5*(1 - xa*xa - ya*ya), wa = 1 - za;
  const zb = 0.5*(1 - xb*xb - yb*yb), wb = 1 - zb;
  const denom = 1 / ((wa*zb + wb*za) +
    hypot(wa*zb + wb*za, wa*xb + wb*xa, wa*yb + wb*ya));
  const xm = (wa*xb + wb*xa) * denom;  // midpoint
  const ym = (wa*yb + wb*ya) * denom;
  const xu = xm - xa, xv = xb - xm, xh = xb - xa;
  const yu = ym - ya, yv = yb - ym, yh = yb - ya;
  const x_uvh = (xu*xv + yu*yv) * xh + (xu*yv - xv*yu) * yh;
  const y_uvh = (xu*xv + yu*yv) * yh - (xu*yv - xv*yu) * xh;
  const x_uuh = (xu*xu + yu*yu) * xh;
  const y_uuh = (xu*xu + yu*yu) * yh;
  return function interpolate(t) {
    const t_ = 1 - t;
    const x_q = xv*t_ + xu*t;
    const y_q = yv*t_ + yu*t;
    const q = t / (x_q*x_q + y_q*y_q);  // t / lerp(v,u,t)^2
    return planisphere.inverse([
      xa + q * (x_uvh*t_ + x_uuh*t),  // a + q * lerp(uvh,uuh,t)
      ya + q * (y_uvh*t_ + y_uuh*t)
    ]);
  }
}
