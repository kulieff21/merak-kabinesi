import { t } from '../i18n.js';
import { sampledFrame, TAU } from '../math.js';
import { stage, range, select, controls, player, canvasContext, dark, rust, teal } from './helpers.js';
import { format } from '../ui.js';

export function zoetrope(root) {
  const kit = stage(root, { canvas: true, label: t("A bouncing ball animated by discrete views of a picture strip"), controls: controls(select('zoe-frames', t("Frames per revolution"), [[6, t("6 frames")], [12, t("12 frames")], [18, t("18 frames")]], 12) + range('zoe-speed', t("Rotation speed"), .2, 1.8, .1, .7, t(" rev/s")) + `<label class="control"><span class="control-top"><span>${t("Slit view")}</span><input type="checkbox" id="zoe-shutter" checked></span></label>`, t("Spin")) });
  const ctx = canvasContext(kit.$('canvas'));
  function ball(x, y, radius, phase, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; const height = Math.abs(Math.sin(phase * Math.PI)); ctx.fillStyle = rust; ctx.beginPath(); ctx.ellipse(x, y - height * radius * 5, radius * (height < .1 ? 1.2 : 1), radius * (height < .1 ? .8 : 1), 0, 0, TAU); ctx.fill(); ctx.restore(); }
  function draw(time) {
    const count = Number(kit.$('#zoe-frames').value); const speed = Number(kit.$('#zoe-speed').value); const shutter = kit.$('#zoe-shutter').checked;
    const phase = sampledFrame(time, speed, count, shutter); const continuous = sampledFrame(time, speed, count, false); const width = 640 / count;
    ctx.clearRect(0, 0, 720, 430); ctx.fillStyle = dark; ctx.font = '12px Manrope'; ctx.fillText(t("One revolution of pictures"), 38, 28);
    for (let i = 0; i < count; i++) { ctx.fillStyle = i === Math.floor(continuous * count) ? '#c3cfb6' : '#ddd1b3'; ctx.fillRect(39 + i * width, 43, width - 3, 76); ball(39 + (i + .5) * width - 1, 106, Math.min(7, width * .12), i / count); }
    ctx.strokeStyle = '#a4a48c'; ctx.lineWidth = 2; ctx.strokeRect(52, 159, 350, 227); ctx.fillStyle = '#f0e5cc'; ctx.fillRect(54, 161, 346, 223); ctx.strokeStyle = '#a8a58b'; ctx.beginPath(); ctx.moveTo(76, 348); ctx.lineTo(379, 348); ctx.stroke();
    if (shutter) ball(226, 326, 26, phase); else for (let i = 6; i >= 0; i--) ball(226, 326, 26, (phase - i * .018 + 1) % 1, .14 + (6 - i) * .025);
    ctx.fillStyle = dark; ctx.font = '11px Manrope'; ctx.fillText(shutter ? t("Brief view: a single pose") : t("Continuous view: an analogy for blur"), 73, 182);
    ctx.save(); ctx.translate(546, 263); ctx.fillStyle = '#cbb792'; ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 88, 0, TAU); ctx.fill(); ctx.stroke(); ctx.rotate(time * speed * TAU); for (let i = 0; i < count; i++) { ctx.rotate(TAU / count); ctx.fillStyle = dark; ctx.fillRect(-3, -84, 6, 19); ctx.fillStyle = teal; ctx.beginPath(); ctx.arc(0, -57, 7, 0, TAU); ctx.fill(); } ctx.restore();
    ctx.fillStyle = '#6a776f'; ctx.font = '11px Manrope'; ctx.fillText(t("Drum viewed from above"), 469, 385); ctx.fillText(t("Original ball cycle · No full-screen flashes"), 52, 412);
    kit.$('[data-readout]').innerHTML = `<strong>${t("{rate} poses / second", { rate: format(speed * count) })}</strong><br>${t("One revolution takes {time} s.", { time: format(1 / speed, 2) })} ${shutter ? t("Slit view is on.") : t("Slit view is off.")}`;
  }
  const animation = player(kit, draw, { end: () => 60, loop: true, step: 1 / 12, label: t("Spin") });
  for (const selector of ['#zoe-frames', '#zoe-shutter']) kit.on(kit.$(selector), 'change', () => animation.redraw());
  kit.on(kit.$('#zoe-speed'), 'input', () => animation.redraw());
  return () => { animation.destroy(); kit.destroy(); };
}
