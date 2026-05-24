// =====================================================
// для Айсель · 25
// кнопки рядом, «нет» убегает в пределах своего ряда
// =====================================================

const STATE = {
  attempts: 0,
  currentSceneKey: 'beauty',
};

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const rand = (min, max) => Math.random() * (max - min) + min;
const isTouch = () => matchMedia('(hover: none)').matches;

// ===== убегающая «нет» =====
// принцип: кнопка остаётся в потоке (display: inline-flex),
// смещается transform translate в пределах окна, не телепортируется в позицию.
function setupRunaway(btn) {
  let attempts = 0;
  let dx = 0, dy = 0;
  let lastMove = 0;

  function jump() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const rect = btn.getBoundingClientRect();
    const margin = 16;

    // абсолютные координаты центра кнопки = rect.left+rect.width/2 - dx (где она была бы без offset)
    const baseCx = rect.left + rect.width / 2 - dx;
    const baseCy = rect.top  + rect.height / 2 - dy;

    // случайная цель в окне с отступами
    const targetCx = rand(margin + rect.width / 2,  w - margin - rect.width / 2);
    const targetCy = rand(margin + rect.height / 2, h - margin - rect.height / 2);

    dx = targetCx - baseCx;
    dy = targetCy - baseCy;

    const rot = rand(-8, 8);
    btn.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
    btn.classList.add('is-running');

    attempts++;
    STATE.attempts++;
  }

  // десктоп: ловим mousemove, прыгаем при сближении (порог 90px)
  document.addEventListener('mousemove', (e) => {
    const scene = btn.closest('.scene');
    if (!scene || scene.hasAttribute('hidden')) return;
    const now = Date.now();
    if (now - lastMove < 250) return; // не чаще 4 раз/сек
    const r = btn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top  + r.height / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
    if (dist < 90) {
      lastMove = now;
      jump();
    }
  });

  // мобайл: телепорт при тапе. без автопрыжков — раздражают.
  if (isTouch()) {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      jump();
    }, { passive: false });
  }

  // на клик мышью — тоже прыжок
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    jump();
  });
}

// ===== переключение сцен =====
function showScene(key) {
  $$('.scene').forEach(s => s.toggleAttribute('hidden', s.dataset.scene !== key));
  STATE.currentSceneKey = key;
  window.scrollTo(0, 0);
}

// ===== «да» =====
function setupYes() {
  const yesMap = {
    'yes-beauty': 'dance',
    'yes-dance':  'zoomer',
    'yes-zoomer': 'final',
  };
  Object.entries(yesMap).forEach(([action, next]) => {
    $(`[data-action="${action}"]`)?.addEventListener('click', () => {
      if (next === 'final') {
        showScene('final');
        runConfetti();
      } else {
        showScene(next);
      }
    });
  });

  $('[data-action="open-gift"]')?.addEventListener('click', () => {
    $('[data-modal]').removeAttribute('hidden');
    runConfetti(true);
  });
}

// ===== модалка =====
function setupModal() {
  const modal = $('[data-modal]');
  $$('[data-modal-close]').forEach(el => {
    el.addEventListener('click', () => modal.setAttribute('hidden', ''));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hasAttribute('hidden')) {
      modal.setAttribute('hidden', '');
    }
  });
}

// ===== конфетти =====
function runConfetti(big = false) {
  if (typeof confetti !== 'function') return;
  const end = Date.now() + (big ? 3500 : 2200);
  const colors = ['#ff2d8e', '#d9ff3e', '#6df3ff', '#ffc44d', '#fff4ea'];

  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 75, origin: { x: 0, y: 0.7 }, colors, scalar: 1.3 });
    confetti({ particleCount: 5, angle: 120, spread: 75, origin: { x: 1, y: 0.7 }, colors, scalar: 1.3 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();

  setTimeout(() => {
    confetti({ particleCount: big ? 220 : 130, spread: 110, origin: { y: 0.5 }, colors, scalar: 1.5 });
  }, 500);
}

// ===== старт =====
document.addEventListener('DOMContentLoaded', () => {
  $$('[data-runaway]').forEach(setupRunaway);
  setupYes();
  setupModal();

  // дебаг: ?scene=final / ?scene=dance / ?modal=1
  const params = new URLSearchParams(location.search);
  const startScene = params.get('scene');
  if (startScene && $(`.scene[data-scene="${startScene}"]`)) showScene(startScene);
  if (params.get('modal') === '1') $('[data-modal]').removeAttribute('hidden');
});
