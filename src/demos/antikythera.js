import { t } from '../i18n.js';
import { metonic, TAU } from '../math.js';
import { stage, range, controls, player, svgText, dark, gold, teal } from './helpers.js';
import { format } from '../ui.js';

function dial(cx, cy, radius, divisions, phase, color, title) {
  return `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="#d6c69f" stroke="${dark}" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${radius - 15}" fill="none" stroke="#b3a581"/>${Array.from({ length: divisions }, (_, i) => { const a = i / divisions * TAU - Math.PI / 2; return `<path d="M${cx + Math.cos(a) * (radius - 7)} ${cy + Math.sin(a) * (radius - 7)}L${cx + Math.cos(a) * (radius - 17)} ${cy + Math.sin(a) * (radius - 17)}" stroke="${dark}" stroke-width="1.5"/>`; }).join('')}<path d="M${cx} ${cy}L${cx + Math.sin(phase * TAU) * (radius - 25)} ${cy - Math.cos(phase * TAU) * (radius - 25)}" stroke="${color}" stroke-width="5" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="9" fill="${dark}"/>${svgText(cx, cy + radius + 32, title, 'text-anchor="middle"')}`;
}
export function antikythera(root) {
  const kit = stage(root, { label: t("Two conceptual calendar dials using the 235/19 ratio"), controls: controls(range('meton-years', t("Elapsed years"), 0, 19, .01, 0) + `<div class="preset-row"><button type="button" class="preset" data-year="1">${t("1 year")}</button><button type="button" class="preset" data-year="19">${t("19 years")}</button></div>`, t("Turn the handle")) });
  function draw(time) {
    const value = metonic(time);
    kit.$('svg').innerHTML = `<path d="M210 212H532" stroke="#a8a286" stroke-dasharray="5 6"/>${dial(210, 205, 135, 12, value.solarPhase, gold, t("One turn = 1 year"))}${dial(535, 205, 98, 29, value.lunarPhase, teal, t("One turn = 1 synodic month"))}${svgText(210, 44, t("Solar year"), 'text-anchor="middle"')}${svgText(535, 78, t("Lunar-phase cycle"), 'text-anchor="middle"')}${svgText(360, 403, t("Two conceptual dials · Not the historical gear train"), 'text-anchor="middle" font-size="11"')}${Math.abs(time - 19) < .001 ? `<path d="M210 70V42M535 107V82" stroke="${teal}" stroke-width="4"/>` : ''}`;
    kit.$('#meton-years').value = time; kit.$('#meton-years-value').textContent = format(time, 2);
    kit.$('[data-readout]').innerHTML = `<strong>${t("{years} years → {months} synodic months", { years: format(time, 2), months: format(value.months, 2) })}</strong><br>${Math.abs(time - 19) < .001 ? t("19 years and 235 months complete. Both indicators have returned to their starting phase.") : t("The dials turn at different speeds and return to their starting phases at year 19.")}`;
  }
  const animation = player(kit, draw, { speed: .65, end: () => 19, step: .25, label: t("Turn the handle") });
  kit.on(kit.$('#meton-years'), 'input', event => animation.seek(Number(event.target.value)));
  root.querySelectorAll('[data-year]').forEach(button => kit.on(button, 'click', () => animation.seek(Number(button.dataset.year))));
  return () => { animation.destroy(); kit.destroy(); };
}
