import { sampledFrame, TAU } from '../math.js';
import { stage, range, select, controls, player, canvasContext, dark, rust, teal } from './helpers.js';
import { format } from '../ui.js';

export function zoetrope(root) {
  const kit = stage(root, { canvas: true, label: 'Bir resim şeridindeki sıçrayan topun kesikli gösterimde hareket etmesi', controls: controls(select('zoe-frames', 'Bir turdaki çerçeve', [[6, '6 çerçeve'], [12, '12 çerçeve'], [18, '18 çerçeve']], 12) + range('zoe-speed', 'Dönüş hızı', .2, 1.8, .1, .7, ' tur/s') + '<label class="control"><span class="control-top"><span>Yarık görünümü</span><input type="checkbox" id="zoe-shutter" checked></span></label>', 'Döndür') });
  const ctx = canvasContext(kit.$('canvas'));
  function ball(x, y, radius, phase, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; const height = Math.abs(Math.sin(phase * Math.PI)); ctx.fillStyle = rust; ctx.beginPath(); ctx.ellipse(x, y - height * radius * 5, radius * (height < .1 ? 1.2 : 1), radius * (height < .1 ? .8 : 1), 0, 0, TAU); ctx.fill(); ctx.restore(); }
  function draw(time) {
    const count = Number(kit.$('#zoe-frames').value); const speed = Number(kit.$('#zoe-speed').value); const shutter = kit.$('#zoe-shutter').checked;
    const phase = sampledFrame(time, speed, count, shutter); const continuous = sampledFrame(time, speed, count, false); const width = 640 / count;
    ctx.clearRect(0, 0, 720, 430); ctx.fillStyle = dark; ctx.font = '12px Manrope'; ctx.fillText('Bir turun resim şeridi', 38, 28);
    for (let i = 0; i < count; i++) { ctx.fillStyle = i === Math.floor(continuous * count) ? '#c3cfb6' : '#ddd1b3'; ctx.fillRect(39 + i * width, 43, width - 3, 76); ball(39 + (i + .5) * width - 1, 106, Math.min(7, width * .12), i / count); }
    ctx.strokeStyle = '#a4a48c'; ctx.lineWidth = 2; ctx.strokeRect(52, 159, 350, 227); ctx.fillStyle = '#f0e5cc'; ctx.fillRect(54, 161, 346, 223); ctx.strokeStyle = '#a8a58b'; ctx.beginPath(); ctx.moveTo(76, 348); ctx.lineTo(379, 348); ctx.stroke();
    if (shutter) ball(226, 326, 26, phase); else for (let i = 6; i >= 0; i--) ball(226, 326, 26, (phase - i * .018 + 1) % 1, .14 + (6 - i) * .025);
    ctx.fillStyle = dark; ctx.font = '11px Manrope'; ctx.fillText(shutter ? 'Kısa bakış: tek bir poz' : 'Sürekli bakış: bulanıklık benzetimi', 73, 182);
    ctx.save(); ctx.translate(546, 263); ctx.fillStyle = '#cbb792'; ctx.strokeStyle = dark; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 88, 0, TAU); ctx.fill(); ctx.stroke(); ctx.rotate(time * speed * TAU); for (let i = 0; i < count; i++) { ctx.rotate(TAU / count); ctx.fillStyle = dark; ctx.fillRect(-3, -84, 6, 19); ctx.fillStyle = teal; ctx.beginPath(); ctx.arc(0, -57, 7, 0, TAU); ctx.fill(); } ctx.restore();
    ctx.fillStyle = '#6a776f'; ctx.font = '11px Manrope'; ctx.fillText('Yukarıdan tambur şeması', 469, 385); ctx.fillText('Özgün bir top döngüsü · Tam ekran flaş yok', 52, 412);
    kit.$('[data-readout]').innerHTML = `<strong>${format(speed * count)} poz / saniye</strong><br>Bir tur ${format(1 / speed, 2)} s sürüyor. ${shutter ? 'Yarık görünümü açık.' : 'Yarık görünümü kapalı.'}`;
  }
  const animation = player(kit, draw, { end: () => 60, loop: true, step: 1 / 12, label: 'Döndür' });
  for (const selector of ['#zoe-frames', '#zoe-shutter']) kit.on(kit.$(selector), 'change', () => animation.redraw());
  kit.on(kit.$('#zoe-speed'), 'input', () => animation.redraw());
  return () => { animation.destroy(); kit.destroy(); };
}
