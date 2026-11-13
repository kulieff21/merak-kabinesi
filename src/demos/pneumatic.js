import { t } from '../i18n.js';
import { capsuleMotion } from '../math.js';
import { stage, range, controls, player, dark, teal, gold, svgText } from './helpers.js';
import { format } from '../ui.js';

export function pneumatic(root) {
  const kit = stage(root, { label: t("A mail capsule travelling along a straight tube under a constant pressure difference"), controls: controls(range('tube-pressure', t("Pressure difference"), 0, 1200, 20, 600, ' Pa') + range('tube-mass', t("Capsule and load"), .5, 5, .5, 2, ' kg'), t("Send")) });
  const svg = kit.$('svg');
  const model = time => capsuleMotion({ pressurePa: Number(kit.$('#tube-pressure').value), diameterM: .1, massKg: Number(kit.$('#tube-mass').value), frictionN: 2, distanceM: 30, timeS: time });
  function draw(time) {
    const motion = model(time); const x = 75 + motion.position / 30 * 550;
    svg.innerHTML = `<defs><linearGradient id="pipe-fill" x2="0" y2="1"><stop stop-color="#c9cbb6"/><stop offset=".5" stop-color="#f0e5cc"/><stop offset="1" stop-color="#afbaa7"/></linearGradient></defs><g fill="${dark}" opacity=".13">${[[60, 85, 74, 107], [145, 60, 91, 132], [248, 105, 70, 87], [340, 75, 90, 117], [464, 95, 66, 97], [555, 65, 106, 127]].map(([xx, yy, w, h]) => `<rect x="${xx}" y="${yy}" width="${w}" height="${h}"/><path d="M${xx - 5} ${yy}L${xx + w / 2} ${yy - 23} ${xx + w + 5} ${yy}Z"/>`).join('')}</g><path d="M25 193H695" stroke="#969e8b" stroke-width="2"/><rect x="45" y="223" width="630" height="78" rx="12" fill="url(#pipe-fill)" stroke="#8b9d96" stroke-width="3"/><path d="M55 234H665M55 288H665" stroke="#ffffff" opacity=".55"/><g transform="translate(${x - 29},238)"><rect width="58" height="48" rx="15" fill="${gold}" stroke="#7e693b" stroke-width="2"/><path d="M9 0V48M49 0V48" stroke="#736044" stroke-width="5"/><rect x="19" y="13" width="22" height="20" fill="#f4e8c6"/><path d="M19 13L30 23 41 13" stroke="#9c8f70" fill="none"/></g><path d="M75 330H625M75 322V338M625 322V338" stroke="${dark}"/>${svgText(316, 353, t("30-metre straight tube"))}${svgText(50, 210, t("Higher pressure"))}${svgText(555, 210, t("Lower pressure"))}${svgText(49, 390, t("Model time: {time} s · Display runs 3× faster", { time: format(time) }))}${motion.acceleration === 0 ? svgText(360, 152, t("Pressure cannot overcome friction"), 'text-anchor="middle" fill="#a16e55"') : ''}`;
    kit.$('[data-readout]').innerHTML = `<strong>${t("Force: {force} N · Acceleration: {acceleration} m/s²", { force: format(motion.force, 2), acceleration: format(motion.acceleration, 2) })}</strong><br>${Number.isFinite(motion.arrival) ? t("Ideal arrival time: {time} s", { time: format(motion.arrival) }) : t("The capsule does not move at this setting.")}<br>${t("Distance: {distance} / 30 m", { distance: format(motion.position) })}`;
  }
  const animation = player(kit, draw, { speed: 3, end: () => Number.isFinite(model(0).arrival) ? model(0).arrival : 1, step: .5, label: t("Send") });
  for (const id of ['#tube-pressure', '#tube-mass']) kit.on(kit.$(id), 'input', () => animation.seek(0));
  return () => { animation.destroy(); kit.destroy(); };
}
