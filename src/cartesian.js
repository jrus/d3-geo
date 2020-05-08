import {asin, atan2, cos, hypot, sin} from "./math.js";

export function spherical(cartesian) {
  return [atan2(cartesian[1], cartesian[0]), asin(cartesian[2])];
}

export function cartesian(spherical) {
  var lambda = spherical[0], phi = spherical[1], cosPhi = cos(phi);
  return [cosPhi * cos(lambda), cosPhi * sin(lambda), sin(phi)];
}

export function cartesianDot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cartesianCross(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function cartesianMidpoint(a, b) {
  var m0 = a[0] + b[0],
      m1 = a[1] + b[1],
      m2 = a[2] + b[2],
      scale = 1 / hypot(m0, m1, m2);
  return [m0 * scale, m1 * scale, m2 * scale];
}

// TODO return a
export function cartesianAddInPlace(a, b) {
  a[0] += b[0], a[1] += b[1], a[2] += b[2];
}

export function cartesianScale(vector, k) {
  return [vector[0] * k, vector[1] * k, vector[2] * k];
}

// TODO return d
export function cartesianNormalizeInPlace(d) {
  var l = hypot(d[0], d[1], d[2]);
  d[0] /= l, d[1] /= l, d[2] /= l;
}
