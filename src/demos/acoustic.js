import { reflectedRay, TAU } from '../math.js';
import { stage, range, controls, player, svgText, teal, gold, dark } from './helpers.js';
import { format } from '../ui.js';

export function acoustic(root) {
  const kit = stage(root, { label: 'Parabol biçimli yansıtıcıya gelen ve odakta toplanan ses ışınları', controls: controls(range('sound-angle', 'Geliş açısı', -20, 20, 1, 0, '°') + range('sound-focus', 'Şemanın odak uzunluğu', 90, 180, 5, 140), 'Dalgayı göster') });
  const svg = kit.$('svg');
  function draw(time) {
    const angle = Number(kit.$('#sound-angle').value) * Math.PI / 180;
    const focus = Number(kit.$('#sound-focus').value);
    const ox = 135; const oy = 217;
    const curve = Array.from({ length: 65 }, (_, i) => { const y = -168 + i * 336 / 64; return `${i ? 'L' : 'M'}${ox + y * y / (4 * focus)} ${oy + y}`; }).join(' ');
    let gathered = 0;
    const rays = Array.from({ length: 9 }, (_, i) => {
      const y = -145 + i * 36.25; const ray = reflectedRay(y, focus, angle);
      const x = ox + ray.x; const yy = oy + y;
      const originY = yy - (630 - x) * Math.tan(angle);
      const along = (focus - ray.x) / ray.dx;
      if (Math.abs(y + along * ray.dy) < 12) gathered++;
      const endX = x + ray.dx * 490; const endY = yy + ray.dy * 490;
      const phase = (time / 3 + i / 12) % 1;
      const point = phase < .5 ? { x: 630 + (x - 630) * phase * 2, y: originY + (yy - originY) * phase * 2 } : { x: x + (endX - x) * (phase - .5) * 2, y: yy + (endY - yy) * (phase - .5) * 2 };
      return `<path d="M630 ${originY}L${x} ${yy}" stroke="${gold}" stroke-width="1.5" opacity=".55"/><path d="M${x} ${yy}L${endX} ${endY}" stroke="${teal}" stroke-width="1.5" opacity=".65"/>${time > 0 ? `<circle cx="${point.x}" cy="${point.y}" r="3" fill="${dark}"/>` : ''}`;
    }).join('');
    svg.innerHTML = `<defs><clipPath id="sound-clip"><rect width="720" height="430"/></clipPath></defs><g clip-path="url(#sound-clip)"><path d="M70 ${oy}H663" stroke="#7d8b7a" opacity=".25" stroke-dasharray="5 6"/>${rays}<path d="${curve}" stroke="${dark}" stroke-width="12" fill="none"/><path d="${curve}" stroke="#9ca99a" stroke-width="4" fill="none"/><path d="M${ox + focus} ${oy + 7}V355" stroke="${dark}" stroke-width="3"/><circle cx="${ox + focus}" cy="${oy}" r="10" fill="#c0a164" stroke="${dark}" stroke-width="2"/>${svgText(80, 31, 'İdeal bir parabol kesiti')}${svgText(490, 393, 'Gelen sesin yönü')}${svgText(ox + focus - 35, 382, 'Mikrofon')}${svgText(23, 407, 'Geometrik model · Ölçekli saha çizimi değildir', 'font-size="10"')}</g>`;
    kit.$('[data-readout]').innerHTML = `<strong>${format(angle * 180 / Math.PI, 0)}° geliş açısı</strong><br>9 çizgiden ${gathered} tanesi odak çevresindeki küçük bölgeden geçiyor.`;
  }
  const animation = player(kit, draw, { end: () => 6, loop: true, step: .3, label: 'Dalgayı göster' });
  for (const id of ['#sound-angle', '#sound-focus']) kit.on(kit.$(id), 'input', () => animation.redraw());
  return () => { animation.destroy(); kit.destroy(); };
}
