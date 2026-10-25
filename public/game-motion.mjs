// Critically damped motion keeps its current position and velocity when interrupted.
export function springStep(value, velocity, target, seconds, response = 0.32) {
  const omega = 2 * Math.PI / response;
  const offset = value - target;
  const carry = velocity + omega * offset;
  const decay = Math.exp(-omega * seconds);
  return { value: target + (offset + carry * seconds) * decay, velocity: (velocity - omega * carry * seconds) * decay };
}
const sheets = new WeakMap();
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function sheetState(dialog) {
  if (sheets.has(dialog)) return sheets.get(dialog);
  const state = { value: 0, velocity: 0, target: 0, frame: null, last: 0, finish: null, drag: null, suppressClick: false, surface: null, veil: null, ignoreClose: 0 };
  sheets.set(dialog, state);
  const paint = () => {
    const surface = state.surface || dialog;
    const range = window.matchMedia('(max-width: 760px)').matches ? Math.max(100, surface.getBoundingClientRect().height) : 44;
    surface.style.transform = `translateY(${state.value}px)`;
    surface.style.opacity = window.matchMedia('(max-width: 760px)').matches ? '1' : String(Math.max(0, 1 - state.value / 36));
    const veil = Math.max(0, 1 - state.value / (range * 0.85));
    surface.style.setProperty('--sheet-veil', String(veil));
    if (state.veil) state.veil.style.opacity = String(veil);
  };
  state.paint = paint;
  const stop = () => { cancelAnimationFrame(state.frame); state.frame = null; };
  state.to = (target, velocity = state.velocity, finish = null) => {
    stop(); state.target = target; state.velocity = velocity; state.finish = finish; state.last = 0;
    if (reduced()) { state.value = target; paint(); finish?.(); return; }
    const tick = now => {
      const dt = state.last ? Math.min((now - state.last) / 1000, 0.032) : 1 / 60;
      state.last = now;
      Object.assign(state, springStep(state.value, state.velocity, state.target, dt));
      paint();
      if (Math.abs(state.value - state.target) < 0.15 && Math.abs(state.velocity) < 1) {
        state.value = state.target; paint(); state.frame = null; const done = state.finish; state.finish = null; done?.();
      } else state.frame = requestAnimationFrame(tick);
    };
    state.frame = requestAnimationFrame(tick);
  };
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeGameSheet(dialog); });
  dialog.addEventListener('close', () => { if (state.ignoreClose) { state.ignoreClose--; return; } stop(); state.value = state.velocity = 0; state.finish = null; state.suppressClick = false; dialog.style.removeProperty('transform'); dialog.style.removeProperty('--sheet-veil'); dialog.style.removeProperty('opacity'); });
  dialog.addEventListener('pointerdown', event => {
    if (!event.target.closest('[data-sheet-handle]') || event.button !== 0) return;
    stop(); state.finish = null; state.drag = { start: event.clientY, base: state.value, samples: [[event.clientY, event.timeStamp]], moved: false };
    dialog.setPointerCapture(event.pointerId);
  });
  dialog.addEventListener('pointermove', event => {
    if (!state.drag) return;
    const delta = event.clientY - state.drag.start;
    state.drag.moved ||= Math.abs(delta) > 8;
    state.value = Math.max(0, state.drag.base + delta);
    state.drag.samples.push([event.clientY, event.timeStamp]);
    state.drag.samples = state.drag.samples.filter(sample => event.timeStamp - sample[1] <= 100);
    paint();
  });
  const release = event => {
    if (!state.drag) return;
    const drag = state.drag; state.drag = null;
    if (dialog.hasPointerCapture(event.pointerId)) dialog.releasePointerCapture(event.pointerId);
    const first = drag.samples[0], last = drag.samples.at(-1);
    const velocity = last[1] > first[1] ? (last[0] - first[0]) / (last[1] - first[1]) * 1000 : 0;
    state.suppressClick = drag.moved;
    if (!drag.moved) { state.suppressClick = true; if (event.type === 'pointerup') closeGameSheet(dialog); else state.to(0); return; }
    const projected = state.value + velocity / 1000 * 0.998 / (1 - 0.998);
    if (event.type !== 'pointercancel' && velocity >= -80 && projected > dialog.getBoundingClientRect().height * 0.3) closeGameSheet(dialog, velocity);
    else state.to(0, velocity);
  };
  dialog.addEventListener('pointerup', release);
  dialog.addEventListener('pointercancel', release);
  dialog.addEventListener('click', event => {
    if (state.suppressClick) { state.suppressClick = false; event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  state.clearGhost = reset => {
    state.surface?.remove(); state.veil?.remove(); state.surface = state.veil = null;
    if (reset) { state.value = state.velocity = 0; state.suppressClick = false; dialog.style.removeProperty('transform'); dialog.style.removeProperty('opacity'); dialog.style.removeProperty('--sheet-veil'); }
  };
  return state;
}
export function openGameSheet(dialog) {
  const state = sheetState(dialog);
  if (!dialog.open) {
    const interrupted = !!state.surface;
    state.clearGhost(false);
    state.suppressClick = false;
    dialog.showModal();
    if (!interrupted) { state.value = reduced() ? 0 : window.matchMedia('(max-width: 760px)').matches ? dialog.getBoundingClientRect().height * 0.75 : 28; state.velocity = 0; }
  }
  state.paint();
  state.to(0);
}
export function closeGameSheet(dialog, velocity) {
  if (!dialog.open) return;
  const state = sheetState(dialog);
  if (reduced()) { dialog.close(); return; }
  // Release the native modal immediately. A noninteractive visual copy finishes the exit,
  // so the next tap can already open a lesson or reverse the sheet's current motion.
  const rect = dialog.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = `${dialog.className} sheet-exit`;
  ghost.setAttribute('aria-hidden', 'true'); ghost.inert = true;
  ghost.innerHTML = dialog.innerHTML;
  ghost.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
  Object.assign(ghost.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top - state.value}px`, width: `${rect.width}px`, height: `${rect.height}px`, maxWidth: 'none', maxHeight: 'none', margin: '0', zIndex: '210', pointerEvents: 'none' });
  const veil = document.createElement('div'); veil.className = 'sheet-exit-veil'; veil.setAttribute('aria-hidden', 'true');
  document.body.append(veil, ghost); ghost.scrollTop = dialog.scrollTop;
  state.surface = ghost; state.veil = veil; state.ignoreClose++;
  dialog.close();
  const target = window.matchMedia('(max-width: 760px)').matches ? rect.height + 50 : 36;
  state.paint();
  state.to(target, velocity ?? state.velocity, () => state.clearGhost(true));
}
