// import "./accordion/accordion.js";
import { detectMenuByViewport } from "./viewportWidth/viewportWidth.js";
(function () {
  const DEFAULTS = {
    lines: 2,
    minSize: 12,
    maxSize: 60,
    lhRatio: 1.2,
    scale: 1,
    scaleMob: 1,
  };

  function detectDeviceType() {
    if (matchMedia("(max-width: 576px)").matches) return "mobile";
    if (matchMedia("(max-width: 1023px)").matches) return "tablet";
    return "desktop";
  }

  // --- helpers ---
  function applySize(el, sizePx, lhRatio) {
    el.style.fontSize = sizePx + "px";
    el.style.lineHeight = sizePx * lhRatio + "px"; // фіксуємо px — стабільні виміри
  }

  function fitsAt(el, sizePx, lines, lhRatio) {
    const prevFS = el.style.fontSize;
    const prevLH = el.style.lineHeight;

    applySize(el, sizePx, lhRatio);

    const lh = parseFloat(getComputedStyle(el).lineHeight);
    const maxH =
      lh * lines +
      (window.devicePixelRatio ? 1 / window.devicePixelRatio : 0.5);
    const h = el.getBoundingClientRect().height;

    // відкотити інлайн-стилі
    el.style.fontSize = prevFS;
    el.style.lineHeight = prevLH;

    return h <= maxH;
  }

  // парсер числових дата-атрибутів
  const num = (v, fallback) => {
    const n = Number(v);
    return Number.isNaN(n) ? fallback : n;
  };

  // вибір параметрів з урахуванням типу пристрою
  function pickLines(el, dt) {
    const mob = num(el.dataset.linesMob, NaN);
    const desk = num(el.dataset.lines, NaN);
    if (dt === "mobile" && !Number.isNaN(mob)) return mob;
    if (!Number.isNaN(desk)) return desk;
    return DEFAULTS.lines;
  }
  function pickMaxFontSize(el, dt) {
    const mob = num(el.dataset.maxSizeMob, NaN);
    const desk = num(el.dataset.maxSize, NaN);
    if (dt === "mobile" && !Number.isNaN(mob)) return mob;
    if (!Number.isNaN(desk)) return desk;
    return DEFAULTS.maxSize;
  }
  function pickMinFontSize(el, dt) {
    const mob = num(el.dataset.minSizeMob, NaN);
    const desk = num(el.dataset.minSize, NaN);
    if (dt === "mobile" && !Number.isNaN(mob)) return mob;
    if (!Number.isNaN(desk)) return desk;
    return DEFAULTS.minSize;
  }
  function pickScale(el, dt) {
    const mob = num(el.dataset.scaleMob, NaN);
    const desk = num(el.dataset.scale, NaN);
    if (dt === "mobile" && !Number.isNaN(mob)) return mob;
    if (!Number.isNaN(desk)) return desk;
    return dt === "mobile" ? DEFAULTS.scaleMob : DEFAULTS.scale;
  }

  function fitTextToLinesMax(el) {
    const dt = detectDeviceType(); // визначаємо один раз
    // console.log(dt);

    const lines = pickLines(el, dt);
    const minSize = pickMinFontSize(el, dt);
    const maxSize = pickMaxFontSize(el, dt);
    const lhRatio = num(el.dataset.lhRatio, DEFAULTS.lhRatio);
    const scale = pickScale(el, dt);

    // 1) якщо навіть мінімум не влазить — застосувати мінімум
    if (!fitsAt(el, minSize, lines, lhRatio)) {
      applySize(el, Math.floor(minSize * scale), lhRatio);
      return;
    }

    // 2) якщо максимум влазить — застосувати максимум
    if (fitsAt(el, maxSize, lines, lhRatio)) {
      applySize(el, Math.floor(maxSize * scale), lhRatio);
      return;
    }

    // 3) бінарний пошук у [minSize, maxSize]
    let lo = minSize;
    let hi = maxSize;
    for (let i = 0; i < 18; i++) {
      const mid = (lo + hi) / 2;
      if (fitsAt(el, mid, lines, lhRatio)) {
        lo = mid; // mid влазить — зсуваємо вгору
      } else {
        hi = mid; // mid не влазить — зсуваємо вниз
      }
    }
    const best = Math.floor(lo);
    applySize(el, best * scale, lhRatio);
  }

  // --- ініціалізація з ResizeObserver ---
  const nodes = document.querySelectorAll(".banner__title, .banner__subtitle");

  // легке тротлінг-оновлення (один перерахунок у кадр)
  let raf = 0;
  const schedule = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      nodes.forEach(fitTextToLinesMax);
    });
  };

  const ro = new ResizeObserver(schedule);
  nodes.forEach((el) => {
    fitTextToLinesMax(el);
    ro.observe(el);
  });

  window.addEventListener("load", schedule);
  window.addEventListener("orientationchange", schedule);

const MAIN_SELECTOR = '.mainContainer';

const observer = new MutationObserver(() => detectMenuByViewport(MAIN_SELECTOR));
observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

// одразу викликати при старті
detectMenuByViewport(MAIN_SELECTOR);
window.addEventListener('resize', () => detectMenuByViewport(MAIN_SELECTOR));
})();

(function () {
  const LOGIN_BUTTON_SELECTOR = '[data-role="header-login-button"]';
  const TARGET_BUTTON_SELECTOR = 'a.btn';
  const REGISTER_MODAL_HREF = "/promos/promo/welcome-bonus-casino/?from=header-desktop&page-in-modal=%2Fshort-register-modal%2F";
  const DEPOSIT_MODAL_HREF = "/promos/promo/welcome-bonus-casino/?from=header-desktop&page-in-modal=%2Fdeposit-modal%2F";

  const isUserLoggedOut = !!document.querySelector(LOGIN_BUTTON_SELECTOR);
  
  const TARGET_HREF = isUserLoggedOut ? REGISTER_MODAL_HREF : DEPOSIT_MODAL_HREF;
  
  const buttonsToUpdate = document.querySelectorAll(TARGET_BUTTON_SELECTOR); 
  
  buttonsToUpdate.forEach(button => {
    if (button.tagName === 'A') {
      button.href = TARGET_HREF;
    }
  });
})();

(function () {
  // ⚙️ Конфигурация и константы
  const LOGIN_BUTTON_SELECTOR = '[data-role="header-login-button"]';
  const TARGET_BUTTON_SELECTOR = 'a.btn';
  const REGISTER_MODAL_HREF = "/promos/promo/welcome-bonus-casino/?from=header-desktop&page-in-modal=%2Fshort-register-modal%2F";
  const DEPOSIT_MODAL_HREF = "/promos/promo/welcome-bonus-casino/?from=header-desktop&page-in-modal=%2Fdeposit-modal%2F";
  
  // Ключ для хранения флага в Local Storage
  const FOLLOW_UP_FLAG_KEY = 'showDepositAfterLogin'; 
  const FLAG_VALUE = 'true'; 
  const isUserLoggedOut = !!document.querySelector(LOGIN_BUTTON_SELECTOR);
  const TARGET_HREF = isUserLoggedOut ? REGISTER_MODAL_HREF : DEPOSIT_MODAL_HREF;
  const buttonsToUpdate = document.querySelectorAll(TARGET_BUTTON_SELECTOR); 
  
  buttonsToUpdate.forEach(button => {
    if (button.tagName === 'A') {
      button.href = TARGET_HREF;
      
      if (isUserLoggedOut) {
        button.addEventListener('click', function() {
          localStorage.setItem(FOLLOW_UP_FLAG_KEY, FLAG_VALUE);
        });
      }
    }
  });

//   // 4. Логика "Follow-up": Проверка после входа (сценарий "один раз")
  
//   if (!isUserLoggedOut && localStorage.getItem(FOLLOW_UP_FLAG_KEY) === FLAG_VALUE) {
    
//     localStorage.removeItem(FOLLOW_UP_FLAG_KEY); 
    
//     setTimeout(() => {
//         // Создаем временный элемент <a> для имитации клика и открытия модалки
//         const tempLink = document.createElement('a');
//         tempLink.href = DEPOSIT_MODAL_HREF;
        
//         // Для лучшей совместимости: добавляем элемент в DOM, кликаем и удаляем
//         document.body.appendChild(tempLink);
//         tempLink.click();
//         document.body.removeChild(tempLink);
        
//     }, 500); 
//   }
})();