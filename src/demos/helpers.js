import { t } from '../i18n.js';
import { icon, format } from '../ui.js';

export function range(id, label, min, max, step, value, unit = '') {
  const digits = String(step).split('.')[1]?.length || 0;
  return `<label class="control" for="${id}"><span class="control-top"><span>${label}</span><output id="${id}-value" for="${id}" aria-live="off">${format(value, digits)}${unit}</output></span><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}" data-unit="${unit}" data-digits="${digits}"></label>`;
}
export function select(id, label, options, selected) {
  return `<label class="control" for="${id}"><span class="control-top">${label}</span><select id="${id}">${options.map(([value, title]) => `<option value="${value}" ${String(value) === String(selected) ? 'selected' : ''}>${title}</option>`).join('')}</select></label>`;
}
export function controls(extra = '', playLabel = t("Run")) {
  return `${extra}<div class="control-buttons"><button class="button small" type="button" data-play>${icon('play', 15)} <span>${playLabel}</span></button><button class="button secondary small" type="button" data-step aria-label="${t("Advance one step")}">${icon('arrow', 15)} ${t("Step")}</button><button class="button secondary small" type="button" data-reset aria-label="${t("Rewind the motion")}">${icon('reset', 15)}</button></div><div class="lab-readout" data-readout aria-live="off"></div>`;
}
export function stage(root, { label, art = '', controls: controlMarkup = '', canvas = false, extraClass = '' }) {
  root.innerHTML = `<div class="demo-stage ${extraClass}">${canvas ? `<canvas width="720" height="430" role="img" aria-label="${label}">${label}</canvas>` : `<svg viewBox="0 0 720 430" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">${art}</svg>`}<button class="expand-diagram" type="button" data-expand aria-label="${t("Enlarge diagram")}">${icon('external', 15)}</button></div><div class="demo-controls">${controlMarkup}</div>`;
  const controller = new AbortController();
  const on = (target, event, callback) => target.addEventListener(event, callback, { signal: controller.signal });
  root.querySelectorAll('input[type=range]').forEach(input => on(input, 'input', () => { const output = root.querySelector(`#${input.id}-value`); if (output) output.textContent = format(Number(input.value), Number(input.dataset.digits)) + input.dataset.unit; }));
  return { $: selector => root.querySelector(selector), on, destroy: () => controller.abort() };
}
export function canvasContext(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 720 * ratio; canvas.height = 430 * ratio;
  const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio);
  return ctx;
}
export function player(kit, draw, { speed = 1, end = () => 10, loop = false, step = 0.15, label = t("Run") } = {}) {
  let time = 0; let running = false; let frame = 0; let previous = 0; let lastDraw = 0; let destroyed = false;
  const button = kit.$('[data-play]');
  function buttonState() { if (button) { button.innerHTML = `${icon(running ? 'pause' : 'play', 15)} <span>${running ? t("Pause") : label}</span>`; button.setAttribute('aria-pressed', running); } }
  function pause() { running = false; cancelAnimationFrame(frame); previous = 0; buttonState(); }
  function tick(now) {
    if (!running || destroyed) return;
    if (!previous) previous = now;
    time += Math.min((now - previous) / 1000, .1) * speed; previous = now;
    const limit = end();
    if (time >= limit) { if (loop) time = limit ? time % limit : 0; else { time = limit; pause(); } }
    if (now - lastDraw >= 1000 / 30 || !running) { draw(time); lastDraw = now; }
    if (running) frame = requestAnimationFrame(tick);
  }
  function play() { if (destroyed) return; if (running) { pause(); return; } if (time >= end()) time = 0; running = true; previous = 0; buttonState(); frame = requestAnimationFrame(tick); }
  function seek(value) { pause(); time = Math.max(0, Math.min(end(), value)); draw(time); }
  kit.on(button, 'click', play);
  const stepButton = kit.$('[data-step]'); if (stepButton) kit.on(stepButton, 'click', () => { pause(); time = time >= end() ? 0 : Math.min(end(), time + step); draw(time); });
  const resetButton = kit.$('[data-reset]'); if (resetButton) kit.on(resetButton, 'click', () => seek(0));
  kit.on(document, 'visibilitychange', () => { if (document.hidden) pause(); });
  const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting) pause(); }, { threshold: .05 });
  const observed = button?.closest('.demo'); if (observed) observer.observe(observed);
  buttonState(); draw(0);
  return { get time() { return time; }, get running() { return running; }, play, pause, seek, redraw: () => draw(time), destroy: () => { destroyed = true; pause(); observer.disconnect(); } };
}
export function svgText(x, y, text, extra = '') { return `<text x="${x}" y="${y}" ${extra}>${text}</text>`; }
export const dark = '#314e5b';
export const teal = '#3c7b77';
export const rust = '#a16e55';
export const gold = '#b08b44';
