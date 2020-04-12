import {atan, atan2, cos, sin, tan, hypot, radians, degrees} from "./math.js";

export function planisphere([longitude, latitude]) {
  longitude *= radians;
  const stereo_radius = tan(radians * 0.5 * (90 + latitude));
  return [cos(longitude) * stereo_radius, sin(longitude) * stereo_radius];
}

planisphere.inverse = function planisphereinverse([X, Y]) {
  const longitude = degrees * atan2(Y, X);
  const latitude = 2 * degrees * atan(hypot(X, Y)) - 90;
  return [longitude, latitude];
};
