import { t } from '../i18n.js';
import { TAU } from '../math.js';
import { stage, select, controls, player, canvasContext, dark, gold } from './helpers.js';

export function television(root) {
  const kit = stage(root, { canvas: true, label: t("A moon drawing built line by line beside a rotating scanning disc"), controls: controls(select('tv-lines', t("Lines per picture"), [[12, t("12 lines")], [24, t("24 lines")], [48, t("48 lines")]], 24), t("Start scanning")) });
  const ctx = canvasContext(kit.$('canvas'));
  const source = document.createElement('canvas'); source.width = 240; source.height = 240;
  const pen = source.getContext('2d'); pen.fillStyle = '#132638'; pen.fillRect(0, 0, 240, 240);
  pen.fillStyle = '#f4df9b'; pen.beginPath(); pen.arc(113, 116, 80, 0, TAU); pen.fill();
  pen.fillStyle = '#132638'; pen.beginPath(); pen.arc(150, 91, 73, 0, TAU); pen.fill();
  pen.fillStyle = '#c6af74'; for (const [x, y, r] of [[62, 119, 12], [83, 165, 10], [106, 182, 7], [44, 94, 6]]) { pen.beginPath(); pen.arc(x, y, r, 0, TAU); pen.fill(); }
  pen.fillStyle = '#f3e2b3'; for (const [x, y] of [[176, 37], [206, 158], [33, 31], [183, 203], [217, 72]]) { pen.fillRect(x, y, 3, 3); }
  function draw(time) {
    const count = Number(kit.$('#tv-lines').value); const progress = Math.min(1, time / 4); const complete = Math.floor(progress * count);
    ctx.clearRect(0, 0, 720, 430); ctx.fillStyle = dark; ctx.font = '13px Manrope'; ctx.fillText(t("Receiver image"), 38, 35); ctx.fillText(t("Scanning disc"), 480, 35);
    ctx.fillStyle = '#102436'; ctx.fillRect(31, 68, 283, 283);
    for (let row = 0; row < complete; row++) { const height = 280 / count; ctx.drawImage(source, 0, Math.min(239, (row + .5) / count * 240), 240, 1, 33, 70 + row * height, 280, height + .5); }
    if (complete < count) { ctx.strokeStyle = '#b38a3d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(26, 70 + complete * 280 / count); ctx.lineTo(319, 70 + complete * 280 / count); ctx.stroke(); }
    ctx.save(); ctx.translate(526, 205); ctx.rotate(-progress * TAU); ctx.fillStyle = '#b99b60'; ctx.strokeStyle = '#79683f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 126, 0, TAU); ctx.fill(); ctx.stroke();
    for (let i = 0; i < count; i++) { const a = i / count * TAU; const r = 105 - i / count * 49; ctx.fillStyle = i === complete % count ? '#f9f0cb' : '#304a55'; ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r, Math.max(2.6, 6 - count / 18), 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#e0cd94'; ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill(); ctx.restore();
    ctx.strokeStyle = '#4e6a69'; ctx.lineWidth = 2; ctx.strokeRect(511, 77, 30, 38);
    ctx.drawImage(source, 390, 348, 52, 52); ctx.fillStyle = '#5a6c6e'; ctx.font = '11px Manrope'; ctx.fillText(t("Source drawing"), 452, 371); ctx.fillText(t("Scan slowed for observation"), 38, 391);
    kit.$('[data-readout]').innerHTML = `<strong>${t("{done} / {total} lines scanned", { done: complete, total: count })}</strong><br>${t("Line count changes spatial detail. The disc indicates scanning order.")}`;
  }
  const animation = player(kit, draw, { end: () => 4, step: 4 / 24, label: t("Start scanning") }); animation.seek(4);
  kit.on(kit.$('#tv-lines'), 'change', () => animation.seek(4));
  return () => { animation.destroy(); kit.destroy(); };
}
