const root = document.documentElement;
const TOL = 6;                           // допуск на HiDPI/зуми

const q = (s) => document.querySelector(s);
const near = (v, t, tol = TOL) => Math.abs(v - t) <= tol;

export function detectMenuByViewport(MAIN_SELECTOR) {
  const main = q(MAIN_SELECTOR);
  if (!main) return;                     // ще не змонтовано

  // ширина вʼюпорта без смуги прокрутки
  const vp = document.documentElement.clientWidth;

  // фактична ширина головного контенту
  const contentWidth = Math.round(main.getBoundingClientRect().width);

  // "залишок" ліворуч (або сумарні бічні відступи, якщо вони є)
  const leftover = Math.max(0, Math.round(vp - contentWidth));

  // мапимо leftover на 256 / 72 / 0 з урахуванням допуску
  let menu = 0;
  if (near(leftover, 256)) menu = 256;
  else if (near(leftover, 72)) menu = 72;
  else if (near(leftover, 0)) menu = 0;
  root.style.setProperty('--menu-width', `${menu}px`);
}