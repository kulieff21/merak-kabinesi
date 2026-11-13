import { oscillatorPoint, TAU } from '../math.js';
import { stage, range, controls, player, canvasContext, dark, teal, gold } from './helpers.js';
import { icon, format } from '../ui.js';

export function harmonograph(root) {
  const kit = stage(root, { canvas: true, label: 'İki sönümlü salınımın birlikte çizdiği parametrik eğri ve kalemin anlık konumu', controls: controls(range('harm-ratio', 'Y / X frekans oranı', .5, 3, .01, 1.5) + range('harm-phase', 'Faz farkı', 0, 180, 1, 45, '°') + range('harm-damping', 'Sönüm', 0, .12, .005, .035) + '<div class="preset-row"><button type="button" class="preset" data-ratio="1">1:1</button><button type="button" class="preset" data-ratio="1.5">2:3</button><button type="button" class="preset" data-ratio="2">1:2</button></div>', 'Çizdir') + `<div class="control-buttons"><button type="button" class="button secondary small" data-download>${icon('download', 15)} SVG indir</button></div>` });
  const ctx = canvasContext(kit.$('canvas')); let points = [];
  const parameters = () => ({ ratio: Number(kit.$('#harm-ratio').value), phase: Number(kit.$('#harm-phase').value) * Math.PI / 180, damping: Number(kit.$('#harm-damping').value) });
  function sample() { const { ratio, phase, damping } = parameters(); points = Array.from({ length: 2401 }, (_, i) => oscillatorPoint(i / 150, ratio, phase, damping)); }
  sample();
  function draw(time) {
    const count = Math.max(1, Math.min(points.length, Math.floor(time * 150) + 1)); const current = points[count - 1];
    ctx.clearRect(0, 0, 720, 430); ctx.strokeStyle = '#b9b496'; ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) { const x = 244 + i * 40; ctx.beginPath(); ctx.moveTo(x, 48); ctx.lineTo(x, 371); ctx.stroke(); const y = 49 + i * 40; ctx.beginPath(); ctx.moveTo(243, y); ctx.lineTo(567, y); ctx.stroke(); }
    ctx.fillStyle = '#f7ecd2'; ctx.fillRect(244, 49, 322, 321); ctx.strokeStyle = teal; ctx.lineWidth = 1.1; ctx.beginPath(); for (let i = 0; i < count; i++) { const point = points[i]; const x = 405 + point.x * 153; const y = 210 - point.y * 153; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke();
    ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(405 + current.x * 153, 210 - current.y * 153, 4, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#b9b496'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(40, 122); ctx.lineTo(190, 122); ctx.moveTo(115, 194); ctx.lineTo(115, 344); ctx.stroke(); ctx.fillStyle = teal; ctx.beginPath(); ctx.arc(115 + current.x * 65, 122, 8, 0, TAU); ctx.fill(); ctx.fillStyle = gold; ctx.beginPath(); ctx.arc(115, 269 - current.y * 65, 8, 0, TAU); ctx.fill();
    ctx.fillStyle = dark; ctx.font = '12px Manrope'; ctx.fillText('Yatay salınım', 57, 89); ctx.fillText('Düşey salınım', 58, 176); ctx.font = '11px Manrope'; ctx.fillText('Kalem iki hareketin anlık konumunu izliyor', 244, 402);
    kit.$('[data-readout]').innerHTML = `<strong>${format(time)} model saniyesi</strong><br>Başlangıç genliğinin %${format(current.envelope * 100, 0)}’i kaldı.`;
    kit.$('[data-download]').disabled = count < 2;
  }
  const animation = player(kit, draw, { end: () => 16, step: .2, label: 'Çizdir' }); animation.seek(16);
  for (const selector of ['#harm-ratio', '#harm-phase', '#harm-damping']) kit.on(kit.$(selector), 'input', () => { sample(); animation.seek(16); });
  root.querySelectorAll('[data-ratio]').forEach(button => kit.on(button, 'click', () => { kit.$('#harm-ratio').value = Number(button.dataset.ratio); kit.$('#harm-ratio-value').textContent = format(Number(kit.$('#harm-ratio').value), 2); sample(); animation.seek(16); }));
  kit.on(kit.$('[data-download]'), 'click', () => {
    const count = Math.max(2, Math.min(points.length, Math.floor(animation.time * 150) + 1));
    const path = points.slice(0, count).map((point, i) => `${i ? 'L' : 'M'}${(400 + point.x * 340).toFixed(3)},${(400 - point.y * 340).toFixed(3)}`).join(' ');
    const { ratio, phase, damping } = parameters();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 850"><title>Merak Kabinesi — Harmonograf</title><desc>r=${ratio}; phase=${phase} rad; damping=${damping}; time=${animation.time}. Educational two-oscillator model.</desc><rect width="800" height="850" fill="#f0e5cc"/><path d="${path}" fill="none" stroke="#365e62" stroke-width="1.1"/><text x="400" y="825" text-anchor="middle" font-family="Georgia,serif" font-size="13" fill="#36505a">Merak Kabinesi · r=${ratio} · φ=${Math.round(phase * 180 / Math.PI)}° · d=${damping}</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })); const link = document.createElement('a'); link.href = url; link.download = 'merak-kabinesi-harmonograf.svg'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  return () => { animation.destroy(); kit.destroy(); };
}
