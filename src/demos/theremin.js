import { t } from '../i18n.js';
import { audioFrequency, clamp, TAU } from '../math.js';
import { stage, range, canvasContext, dark, teal, gold } from './helpers.js';
import { icon, format } from '../ui.js';

export function theremin(root) {
  const kit = stage(root, { canvas: true, extraClass: 'theremin-field', label: t("Theremin field: horizontal position controls pitch and vertical position controls volume; the sliders provide the same controls"), controls: range('theremin-pitch', t("Pitch position"), 0, 100, 1, 50, '%') + range('theremin-volume', t("Volume"), 0, 100, 1, 35, '%') + `<div class="control-buttons"><button class="button small" type="button" data-audio aria-pressed="false">${icon('sound', 16)} <span>${t("Enable sound")}</span></button><button class="button secondary small" type="button" data-audio-reset>${icon('reset', 16)} ${t("Reset")}</button></div><div class="lab-readout" data-readout aria-live="off"></div>` });
  const canvas = kit.$('canvas'); const pen = canvasContext(canvas); const audioButton = kit.$('[data-audio]');
  let audio; let oscillator; let gain; let enabled = false; let disposed = false; let pressed = false;
  function values() { return { x: Number(kit.$('#theremin-pitch').value) / 100, y: Number(kit.$('#theremin-volume').value) / 100 }; }
  function audioState() { audioButton.setAttribute('aria-pressed', enabled); audioButton.innerHTML = `${icon('sound', 16)} <span>${enabled ? t("Mute sound") : t("Enable sound")}</span>`; }
  function stop() {
    enabled = false; if (oscillator) { try { oscillator.stop(); } catch {} oscillator = null; }
    if (audio) { audio.close().catch(() => {}); audio = null; } gain = null; audioState();
  }
  function wave(x, y, width, height, cycles, color) {
    pen.strokeStyle = color; pen.lineWidth = 1.4; pen.beginPath(); for (let i = 0; i <= 210; i++) { const xx = x + width * i / 210; const yy = y + Math.sin(i / 210 * TAU * cycles) * height; if (i) pen.lineTo(xx, yy); else pen.moveTo(xx, yy); } pen.stroke();
  }
  function draw() {
    const { x, y } = values(); const frequency = audioFrequency(x);
    if (enabled && audio && oscillator && gain) { oscillator.frequency.setTargetAtTime(frequency, audio.currentTime, .025); gain.gain.setTargetAtTime(y * .065, audio.currentTime, .03); }
    pen.clearRect(0, 0, 720, 430); pen.fillStyle = '#d8dfc9'; pen.fillRect(35, 43, 417, 321);
    pen.strokeStyle = '#aab7a0'; pen.lineWidth = 1; for (let i = 0; i <= 6; i++) { pen.beginPath(); pen.moveTo(35 + i * 417 / 6, 43); pen.lineTo(35 + i * 417 / 6, 364); pen.stroke(); pen.beginPath(); pen.moveTo(35, 43 + i * 321 / 6); pen.lineTo(452, 43 + i * 321 / 6); pen.stroke(); }
    const px = 35 + x * 417; const py = 364 - y * 321;
    pen.strokeStyle = '#557d7666'; pen.beginPath(); pen.moveTo(px, 43); pen.lineTo(px, 364); pen.moveTo(35, py); pen.lineTo(452, py); pen.stroke(); pen.fillStyle = teal; pen.beginPath(); pen.arc(px, py, 10, 0, TAU); pen.fill(); pen.strokeStyle = '#f0e5cc'; pen.lineWidth = 2; pen.beginPath(); pen.arc(px, py, 19, 0, TAU); pen.stroke();
    pen.fillStyle = dark; pen.font = '12px Manrope'; pen.fillText(t("Pointer position stands in for a hand"), 35, 26); pen.fillText(t("Lower pitch"), 35, 390); pen.fillText(t("Higher pitch"), 382, 390); pen.font = '11px Manrope'; pen.fillText(t("RF signals · 60 µs window"), 483, 56); pen.fillText(t("f₁ = 100,000 Hz"), 483, 83); wave(483, 113, 202, 17, 6, gold); pen.fillText(`f₂ = ${format(100000 + frequency, 0)} Hz`, 483, 164); wave(483, 195, 202, 17, (100000 + frequency) * .00006, teal); pen.fillText(t("Audible difference · 10 ms window"), 483, 258); wave(483, 300, 202, 25 * Math.max(.1, y), frequency * .01, dark); pen.fillText(enabled ? t("Sound on") : t("Sound off · Enable it if you like"), 483, 367);
    kit.$('[data-readout]').innerHTML = `<strong>${t("{frequency} Hz · Volume {volume}%", { frequency: format(frequency, 0), volume: format(y * 100, 0) })}</strong><br>${t("The difference between 100,000 Hz and {frequency} Hz. RF values are illustrative.", { frequency: format(100000 + frequency, 0) })}`;
  }
  kit.on(audioButton, 'click', async () => {
    if (enabled) { stop(); draw(); return; }
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) { audioButton.disabled = true; audioButton.textContent = t("Audio is unavailable in this browser"); return; }
    audioButton.disabled = true;
    try {
      audio = new Audio(); oscillator = audio.createOscillator(); gain = audio.createGain(); gain.gain.value = 0; oscillator.type = 'sine'; oscillator.connect(gain); gain.connect(audio.destination);
      await audio.resume(); if (disposed) { stop(); return; } oscillator.start(); enabled = true; audioState(); draw();
    } catch { stop(); kit.$('[data-readout]').textContent = t("Sound could not start. Check the browser’s audio permission and try again."); }
    finally { audioButton.disabled = false; }
  });
  for (const id of ['#theremin-pitch', '#theremin-volume']) kit.on(kit.$(id), 'input', draw);
  function move(event) {
    const box = canvas.getBoundingClientRect(); const xx = (event.clientX - box.left) / box.width * 720; const yy = (event.clientY - box.top) / box.height * 430;
    const x = Math.round(clamp((xx - 35) / 417, 0, 1) * 100); const y = Math.round(clamp((364 - yy) / 321, 0, 1) * 100);
    kit.$('#theremin-pitch').value = x; kit.$('#theremin-volume').value = y; kit.$('#theremin-pitch-value').textContent = `${x}%`; kit.$('#theremin-volume-value').textContent = `${y}%`; draw();
  }
  kit.on(canvas, 'pointerdown', event => { pressed = true; canvas.setPointerCapture(event.pointerId); move(event); });
  kit.on(canvas, 'pointermove', event => { if (pressed || event.pointerType === 'mouse') move(event); });
  kit.on(canvas, 'pointerup', () => { pressed = false; }); kit.on(canvas, 'pointercancel', () => { pressed = false; });
  kit.on(kit.$('[data-audio-reset]'), 'click', () => { stop(); kit.$('#theremin-pitch').value = 50; kit.$('#theremin-volume').value = 35; kit.$('#theremin-pitch-value').textContent = '50%'; kit.$('#theremin-volume-value').textContent = '35%'; draw(); });
  kit.on(document, 'visibilitychange', () => { if (document.hidden) { stop(); draw(); } });
  const observer = new IntersectionObserver(entries => { if (!entries[0].isIntersecting && enabled) { stop(); draw(); } }, { threshold: .05 }); observer.observe(root);
  draw();
  return () => { disposed = true; stop(); observer.disconnect(); kit.destroy(); };
}
