import { patternRow } from '../math.js';
import { stage, controls, player, canvasContext, dark, teal, rust } from './helpers.js';

export function jacquard(root) {
  let pattern = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => Math.abs(c - 3.5) + Math.abs(r - 3.5) <= 3 ? 1 : 0));
  const editor = `<div class="control control-full"><div class="control-top"><span>Kart zinciri · Karelere dokun</span><span>8 × 8</span></div><div class="card-editor" role="group" aria-label="Sekiz sıralı delikli kart düzenleyicisi">${pattern.map((row, r) => row.map((value, c) => `<button class="card-bit" type="button" data-bit="${r},${c}" aria-label="${r + 1}. sıra, ${c + 1}. sütun" aria-pressed="${!!value}" tabindex="${r === 0 && c === 0 ? '0' : '-1'}"></button>`).join('')).join('')}</div><p class="editor-caption">Delik = çözgüyü seç. Ok tuşlarıyla kareler arasında gez.</p><div class="preset-row"><button class="preset" type="button" data-pattern="diamond">Elmas</button><button class="preset" type="button" data-pattern="checker">Dama</button><button class="preset" type="button" data-pattern="wave">Dalga</button></div></div>`;
  const kit = stage(root, { canvas: true, label: 'Düzenlenen delikli kartın satır satır tekrarlanan dokumaya dönüştürülmesi', controls: controls(editor, 'Dokumayı başlat') });
  const ctx = canvasContext(kit.$('canvas'));
  function updateEditor(active) { root.querySelectorAll('[data-bit]').forEach(button => { const [r, c] = button.dataset.bit.split(',').map(Number); button.setAttribute('aria-pressed', !!pattern[r][c]); button.dataset.active = r === active; }); }
  function draw(time) {
    const rows = Math.min(24, Math.floor(time)); const active = rows % 8; const selected = patternRow(pattern, active);
    ctx.clearRect(0, 0, 720, 430); ctx.fillStyle = dark; ctx.font = '13px Manrope'; ctx.fillText('Karttan seçilen çözgüler', 40, 32); ctx.fillText('Dokunan tekrar', 418, 32);
    ctx.fillStyle = '#9a7650'; ctx.fillRect(37, 66, 316, 15); ctx.fillRect(37, 370, 316, 15);
    for (let c = 0; c < 8; c++) { const x = 62 + c * 37; ctx.strokeStyle = selected[c] ? rust : '#a8a18a'; ctx.lineWidth = selected[c] ? 5 : 3; ctx.beginPath(); ctx.moveTo(x, 81); ctx.lineTo(x + (selected[c] ? 8 : 0), selected[c] ? 156 : 185); ctx.lineTo(x, 370); ctx.stroke(); ctx.fillStyle = selected[c] ? teal : '#ac9f7c'; ctx.beginPath(); ctx.arc(x + (selected[c] ? 8 : 0), selected[c] ? 156 : 185, 5, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#ac8956'; ctx.fillRect(48, 203, 292, 7); ctx.fillStyle = '#e2d1a6'; ctx.fillRect(418, 65, 262, 318);
    const cellW = 262 / 16; const cellH = 318 / 24;
    for (let r = 0; r < rows; r++) { const row = patternRow(pattern, r); for (let c = 0; c < 16; c++) { const value = row[c % 8]; ctx.fillStyle = value ? '#4e7c78' : '#c38372'; ctx.fillRect(418 + c * cellW + .5, 65 + r * cellH + .5, cellW - 1, cellH - 1); ctx.strokeStyle = value ? '#88a49a' : '#e4b29b'; ctx.lineWidth = .7; ctx.beginPath(); if (value) { ctx.moveTo(418 + (c + .5) * cellW, 65 + r * cellH); ctx.lineTo(418 + (c + .5) * cellW, 65 + (r + 1) * cellH); } else { ctx.moveTo(418 + c * cellW, 65 + (r + .5) * cellH); ctx.lineTo(418 + (c + 1) * cellW, 65 + (r + .5) * cellH); } ctx.stroke(); } }
    ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.strokeRect(418, 65, 262, 318); ctx.setLineDash([4, 5]); ctx.lineWidth = 1; for (let r = 1; r < 3; r++) { ctx.beginPath(); ctx.moveTo(418, 65 + r * 8 * cellH); ctx.lineTo(680, 65 + r * 8 * cellH); ctx.stroke(); } ctx.setLineDash([]);
    ctx.fillStyle = '#6b776e'; ctx.font = '11px Manrope'; ctx.fillText('Her 8 sırada bir kart zinciri başa döner', 40, 413);
    updateEditor(rows === 24 ? -1 : active);
    kit.$('[data-readout]').innerHTML = `<strong>${rows} / 24 sıra dokundu</strong><br>${rows === 24 ? 'Sekiz sıralı motif üç kez tekrarlandı.' : `Okunan kart: ${active + 1}. sıra · ${selected.filter(Boolean).length} çözgü seçili.`}`;
  }
  const animation = player(kit, draw, { speed: 3, end: () => 24, step: 1, label: 'Dokumayı başlat' }); animation.seek(24);
  root.querySelectorAll('[data-bit]').forEach(button => {
    kit.on(button, 'click', () => { const [r, c] = button.dataset.bit.split(',').map(Number); pattern[r][c] = 1 - pattern[r][c]; animation.seek(0); });
    kit.on(button, 'keydown', event => {
      const [r, c] = button.dataset.bit.split(',').map(Number); let rr = r; let cc = c;
      if (event.key === 'ArrowRight') cc = (c + 1) % 8; else if (event.key === 'ArrowLeft') cc = (c + 7) % 8; else if (event.key === 'ArrowDown') rr = (r + 1) % 8; else if (event.key === 'ArrowUp') rr = (r + 7) % 8; else return;
      event.preventDefault(); button.tabIndex = -1; const next = kit.$(`[data-bit="${rr},${cc}"]`); next.tabIndex = 0; next.focus();
    });
    kit.on(button, 'focus', () => { root.querySelectorAll('[data-bit]').forEach(other => { other.tabIndex = other === button ? 0 : -1; }); });
  });
  root.querySelectorAll('[data-pattern]').forEach(button => kit.on(button, 'click', () => {
    pattern = Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => button.dataset.pattern === 'checker' ? (r + c) % 2 : button.dataset.pattern === 'wave' ? (c + r) % 8 < 3 ? 1 : 0 : Math.abs(c - 3.5) + Math.abs(r - 3.5) <= 3 ? 1 : 0)); animation.seek(0);
  }));
  return () => { animation.destroy(); kit.destroy(); };
}
