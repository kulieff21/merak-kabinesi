import { metonic, TAU } from '../math.js';
import { stage, range, controls, player, svgText, dark, gold, teal } from './helpers.js';
import { format } from '../ui.js';

function dial(cx, cy, radius, divisions, phase, color, title) {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#d6c69f" stroke="${dark}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${radius - 15}" fill="none" stroke="#b3a581"/>${Array.from({ length: divisions }, (_, i) => { const a = i / divisions * TAU - Math.PI / 2; return `<path d="M${cx + Math.cos(a) * (radius - 7)} ${cy + Math.sin(a) * (radius - 7)}L${cx + Math.cos(a) * (radius - 17)} ${cy + Math.sin(a) * (radius - 17)}" stroke="${dark}" stroke-width="1.5"/>`; }).join('')}<path d="M${cx} ${cy}L${cx + Math.sin(phase * TAU) * (radius - 25)} ${cy - Math.cos(phase * TAU) * (radius - 25)}" stroke="${color}" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="9" fill="${dark}"/>${svgText(cx, cy + radius + 32, title, 'text-anchor="middle"')}`;
}
export function antikythera(root) {
  const kit = stage(root, { label: 'Yıl ve sinodik ayın 235/19 oranıyla hareket ettiği iki kavramsal kadran', controls: controls(range('meton-years', 'Geçen yıl', 0, 19, .01, 0) + '<div class="preset-row"><button type="button" class="preset" data-year="1">1 yıl</button><button type="button" class="preset" data-year="19">19 yıl</button></div>', 'Kolu çevir') });
  function draw(time) {
    const value = metonic(time);
    kit.$('svg').innerHTML = `<path d="M210 212H532" stroke="#a8a286" stroke-dasharray="5 6"/>${dial(210, 205, 135, 12, value.solarPhase, gold, 'Bir tam tur = 1 yıl')}${dial(535, 205, 98, 29, value.lunarPhase, teal, 'Bir tam tur = 1 sinodik ay')}${svgText(210, 44, 'Güneş yılı', 'text-anchor="middle"')}${svgText(535, 78, 'Ay evresi çevrimi', 'text-anchor="middle"')}${svgText(360, 403, 'Kavramsal iki kadran · Tarihsel dişli treni değildir', 'text-anchor="middle" font-size="11"')}${Math.abs(time - 19) < .001 ? `<path d="M210 70V42M535 107V82" stroke="${teal}" stroke-width="4"/>` : ''}`;
    kit.$('#meton-years').value = time; kit.$('#meton-years-value').textContent = format(time, 2);
    kit.$('[data-readout]').innerHTML = `<strong>${format(time, 2)} yıl → ${format(value.months, 2)} sinodik ay</strong><br>${Math.abs(time - 19) < .001 ? 'Modelde 19 yıl ve 235 ay tamamlandı. İki gösterge başlangıç evresinde.' : 'İki kadran farklı hızlarda dönüyor. 19. yılda başlangıç evrelerine dönerler.'}`;
  }
  const animation = player(kit, draw, { speed: .65, end: () => 19, step: .25, label: 'Kolu çevir' });
  kit.on(kit.$('#meton-years'), 'input', event => animation.seek(Number(event.target.value)));
  root.querySelectorAll('[data-year]').forEach(button => kit.on(button, 'click', () => animation.seek(Number(button.dataset.year))));
  return () => { animation.destroy(); kit.destroy(); };
}
