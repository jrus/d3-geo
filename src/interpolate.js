import {hypot, pi} from "./math.js";
import {midpoint, planisphere, raterp} from "./planisphere.js";

// See https://observablehq.com/@jrus/circle-arc-interpolation
  
var halfangle = function halfangle (a, b) {
  var [ax, ay] = a, [bx, by] = b;
  var aq = 1 / (1 + ax * ax + ay * ay),
      bq = 1 / (1 + bx * bx + by * by);
  if (aq === 0) ax = ay = 0;
  if (bq === 0) bx = by = 0;
  return Math.asin(hypot(
    aq - bq, aq * ax - bq * bx, aq * ay - bq * by)) /  pi;
}

// This function is a fast approximation of "slerp".
// It returns points which are quite accurately placed along
// the great circle arc from a to b. The travel along the path
// approximates uniform velocity to an accuracy of about 8
// decimal digits in the worst case, with relatively little
// arithmetic overhead beyond calling the rational
// approximation function.
export default function interpolate (a, b) {
  // short circuit if a == b
  // TODO: consider whether this is really desirable
  if ((a[0] === b[0]) & (a[1] === b[1]))
    return function slerp() { return [a[0], a[1]]; };
  
  a = planisphere(a);
  b = planisphere(b);
  
  var rerp = raterp(a, midpoint(a, b), b),
      angle = halfangle(a,b),
      k = (1 - angle*angle),
      scale = 0.5 / (angle * (
        ((-0.000221184 * k + 0.0024971104) * k - 0.02301937096) * k
        + 0.3182994604 + 1.2732402998 / k));

  return function slerp (t) {
    // reparametrize
    t = (2 * t - 1) * angle;
    var s = (1 - t*t);
    t *= ((-0.000221184 * s + 0.0024971104) * s - 0.02301937096) * s
         + 0.3182994604 + 1.2732402998 / s;
    return planisphere.inverse(rerp(scale*t + 0.5));
  }
}
