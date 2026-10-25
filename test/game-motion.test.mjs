import test from 'node:test';
import assert from 'node:assert/strict';
import { springStep, openGameSheet, closeGameSheet } from '../public/game-motion.mjs';

test('a critically damped sheet settles without overshooting its resting point', () => {
  let state = { value: 400, velocity: 0 };
  for (let frame = 0; frame < 120; frame++) {
    state = springStep(state.value, state.velocity, 0, 1 / 60);
    assert.ok(state.value >= 0);
    assert.ok(Number.isFinite(state.velocity));
  }
  assert.ok(state.value < 0.01);
  assert.ok(Math.abs(state.velocity) < 0.01);
});

test('retargeting preserves the current presentation and velocity at the interruption', () => {
  const current = springStep(200, 0, 0, 0.06);
  const redirected = springStep(current.value, current.velocity, 400, 0);
  assert.ok(Math.abs(redirected.value - current.value) < 1e-10);
  assert.ok(Math.abs(redirected.velocity - current.velocity) < 1e-10);
  let state = redirected;
  for (let frame = 0; frame < 120; frame++) state = springStep(state.value, state.velocity, 400, 1 / 60);
  assert.ok(Math.abs(state.value - 400) < 0.01);
});

test('release velocity continues into the spring rather than restarting at rest', () => {
  const resting = springStep(100, 0, 0, 1 / 60);
  const thrown = springStep(100, -500, 0, 1 / 60);
  assert.ok(thrown.value < resting.value);
  assert.ok(thrown.velocity < resting.velocity);
});

test('reduced motion opens and dismisses the sheet without scheduling animation frames', t => {
  const previous = { window: globalThis.window, request: globalThis.requestAnimationFrame, cancel: globalThis.cancelAnimationFrame };
  t.after(() => {
    if (previous.window === undefined) delete globalThis.window; else globalThis.window = previous.window;
    if (previous.request === undefined) delete globalThis.requestAnimationFrame; else globalThis.requestAnimationFrame = previous.request;
    if (previous.cancel === undefined) delete globalThis.cancelAnimationFrame; else globalThis.cancelAnimationFrame = previous.cancel;
  });
  globalThis.window = { matchMedia: () => ({ matches: true }) };
  globalThis.requestAnimationFrame = () => assert.fail('Reduced motion must not animate the sheet');
  globalThis.cancelAnimationFrame = () => {};
  const events = new Map();
  const dialog = {
    open: false,
    style: { setProperty() {}, removeProperty() {} },
    getBoundingClientRect: () => ({ height: 600 }),
    addEventListener: (name, callback) => events.set(name, callback),
    showModal() { this.open = true; },
    close() { this.open = false; events.get('close')?.(); }
  };
  openGameSheet(dialog);
  assert.equal(dialog.open, true);
  closeGameSheet(dialog);
  assert.equal(dialog.open, false);
});
