export const TAU = Math.PI * 2;
export const clamp = (value, minimum, maximum) => Math.min(maximum, Math.max(minimum, value));
export const lerp = (a, b, t) => a + (b - a) * t;

/** Reflection from the parabola x = y²/(4f), opening toward positive x. */
export function reflectedRay(y, focalLength, incidentAngle = 0) {
  const x = y * y / (4 * focalLength);
  const tangent = { x: y / (2 * focalLength), y: 1 };
  const normal = { x: 1, y: -tangent.x };
  const length = Math.hypot(normal.x, normal.y);
  const nx = normal.x / length;
  const ny = normal.y / length;
  const dx = -Math.cos(incidentAngle);
  const dy = Math.sin(incidentAngle);
  const dot = dx * nx + dy * ny;
  return { x, y, dx: dx - 2 * dot * nx, dy: dy - 2 * dot * ny };
}

/** Constant-pressure, constant-friction, straight-tube thought experiment. SI units. */
export function capsuleMotion({ pressurePa, diameterM, massKg, frictionN, distanceM, timeS }) {
  if (diameterM <= 0 || massKg <= 0 || distanceM < 0) throw new RangeError('Invalid capsule dimensions');
  const force = pressurePa * Math.PI * (diameterM / 2) ** 2;
  const acceleration = Math.max(0, (force - frictionN) / massKg);
  const arrival = acceleration > 0 ? Math.sqrt(2 * distanceM / acceleration) : Infinity;
  const time = clamp(timeS, 0, arrival);
  return { force, acceleration, arrival, position: Math.min(distanceM, 0.5 * acceleration * time * time), speed: acceleration * time };
}

export function metonic(years) {
  return { years, months: years * 235 / 19, solarPhase: ((years % 1) + 1) % 1, lunarPhase: (((years * 235 / 19) % 1) + 1) % 1 };
}

export function oscillatorPoint(time, ratio, phase, damping) {
  const envelope = Math.exp(-damping * time);
  return { x: envelope * Math.sin(TAU * time), y: envelope * Math.sin(TAU * ratio * time + phase), envelope };
}

export function lensImage(focalLength, objectDistance) {
  if (focalLength <= 0 || objectDistance <= focalLength) throw new RangeError('A real projected image requires u > f > 0');
  const distance = focalLength * objectDistance / (objectDistance - focalLength);
  return { distance, magnification: -distance / objectDistance };
}

/** Heights of two paraxial rays at a screen, relative to the optical axis. */
export function projectionRays(focalLength, objectDistance, screenDistance, objectHeight = 1) {
  lensImage(focalLength, objectDistance);
  return { parallel: -objectHeight + screenDistance * objectHeight / focalLength, central: screenDistance * objectHeight / objectDistance };
}

export function sampledFrame(seconds, revolutionsPerSecond, frames, shutter = true) {
  const continuous = ((seconds * revolutionsPerSecond) % 1 + 1) % 1;
  return shutter ? Math.floor(continuous * frames) / frames : continuous;
}

export function audioFrequency(position) {
  return 110 * 2 ** (clamp(position, 0, 1) * 3);
}

export function patternRow(pattern, row) {
  if (!pattern.length) return [];
  return pattern[((row % pattern.length) + pattern.length) % pattern.length].slice();
}
