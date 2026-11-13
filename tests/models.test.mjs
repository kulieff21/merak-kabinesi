import test from 'node:test';
import assert from 'node:assert/strict';
import { reflectedRay, capsuleMotion, metonic, oscillatorPoint, lensImage, projectionRays, sampledFrame, audioFrequency, patternRow, TAU } from '../src/math.js';
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} differs from ${b}`);

test('parallel rays reach the focus of every supported parabolic mirror', () => {
  for (const f of [90, 140, 180]) for (const y of [-160, -90, -5, 0, 70, 160]) {
    const ray = reflectedRay(y, f); const t = (f - ray.x) / ray.dx;
    near(y + t * ray.dy, 0); near(Math.hypot(ray.dx, ray.dy), 1);
  }
});
test('off-axis incidence changes the ray crossing rather than inventing gain', () => {
  const ray = reflectedRay(90, 140, Math.PI / 12);
  assert.ok(Math.abs(ray.y + (140 - ray.x) / ray.dx * ray.dy) > 1);
});
const tube = { pressurePa: 600, diameterM: .1, massKg: 2, frictionN: 2, distanceM: 30, timeS: 0 };
test('capsule force uses pressure difference times circular area in SI units', () => {
  const value = capsuleMotion(tube); near(value.force, 1.5 * Math.PI); near(value.acceleration, (1.5 * Math.PI - 2) / 2);
});
test('capsule stalls below static threshold and never invents reverse motion', () => {
  const value = capsuleMotion({ ...tube, pressurePa: 100, timeS: 40 });
  assert.equal(value.position, 0); assert.equal(value.speed, 0); assert.equal(value.arrival, Infinity);
});
test('four times the load doubles arrival time under the stated model', () => {
  near(capsuleMotion({ ...tube, massKg: 8 }).arrival, capsuleMotion(tube).arrival * 2);
});
test('capsule reaches exactly the destination and does not overshoot', () => {
  const arrival = capsuleMotion(tube).arrival;
  near(capsuleMotion({ ...tube, timeS: arrival }).position, 30);
  assert.equal(capsuleMotion({ ...tube, timeS: arrival + 100 }).position, 30);
  assert.throws(() => capsuleMotion({ ...tube, massKg: 0 }), RangeError);
});
test('the chosen Metonic model completes 235 months after 19 years', () => {
  const value = metonic(19); assert.equal(value.months, 235); assert.equal(value.solarPhase, 0); assert.equal(value.lunarPhase, 0);
  assert.notEqual(metonic(1).lunarPhase, 0);
});
test('a quadrature 1:1 undamped oscillator traces a unit circle', () => {
  for (let t = 0; t < 3; t += .07) { const p = oscillatorPoint(t, 1, Math.PI / 2, 0); near(p.x ** 2 + p.y ** 2, 1); }
});
test('damping contracts a quadrature trace with the correct envelope', () => {
  for (const time of [1, 5, 16]) { const p = oscillatorPoint(time, 1, Math.PI / 2, .04); near(Math.hypot(p.x, p.y), Math.exp(-.04 * time)); }
});
test('the 2:3 undamped trajectory closes after two model seconds', () => {
  const a = oscillatorPoint(0, 1.5, .3, 0); const b = oscillatorPoint(2, 1.5, .3, 0); near(a.x, b.x); near(a.y, b.y);
});
test('thin-lens worked example produces a reversed two-times image', () => {
  const value = lensImage(80, 120); assert.equal(value.distance, 240); assert.equal(value.magnification, -2);
});
test('thin-lens reciprocal relation holds throughout the controls', () => {
  for (let u = 90; u <= 200; u += 3) { const v = lensImage(80, u); near(1 / 80, 1 / u + 1 / v.distance); assert.ok(v.magnification < 0); }
  assert.ok(lensImage(80, 90).distance > lensImage(80, 120).distance); assert.throws(() => lensImage(80, 80), RangeError);
});
test('zoetrope sampling quantizes position while preserving the cycle', () => {
  near(sampledFrame(.2, 1, 6), 1 / 6); near(sampledFrame(.2, 1, 6, false), .2);
  near(sampledFrame(1.2, 1, 6), 1 / 6); assert.equal(sampledFrame(1, 1, 12), 0);
});
test('the two illustrated projection rays meet at the computed image plane', () => {
  for (const u of [90, 120, 161, 200]) {
    const image = lensImage(80, u); const rays = projectionRays(80, u, image.distance, 12);
    near(rays.parallel, rays.central); near(rays.central, -12 * image.magnification);
  }
});
test('defocused screen receives separated rays on either side of focus', () => {
  for (const distance of [140, 350]) { const rays = projectionRays(80, 120, distance, 12); assert.notEqual(rays.parallel, rays.central); }
});
test('theremin controls stay within three octaves including out-of-range inputs', () => {
  near(audioFrequency(0), 110); near(audioFrequency(1), 880); near(audioFrequency(.5), 110 * Math.sqrt(8));
  near(audioFrequency(-1), 110); near(audioFrequency(2), 880);
});
test('card rows repeat without mutating the source pattern', () => {
  const pattern = [[1, 0], [0, 1]]; assert.deepEqual(patternRow(pattern, 3), [0, 1]);
  const row = patternRow(pattern, 2); row[0] = 0; assert.deepEqual(pattern[0], [1, 0]);
});
