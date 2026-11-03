// Small native equivalents of Magic UI's card spotlight and number ticker.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = matchMedia('(hover: hover) and (pointer: fine)');
  let frame = 0;
  let finishNumber = () => {};
  document.querySelectorAll('[data-magic-card]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      if (!pointer.matches || reduced.matches) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
        card.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
        card.setAttribute('data-active', '');
      });
    }, { passive: true });
    card.addEventListener('pointerleave', () => { cancelAnimationFrame(frame); card.removeAttribute('data-active'); });
  });
  const node = document.querySelector('[data-number]');
  if (node && 'IntersectionObserver' in window) {
    const target = Number(node.dataset.number);
    const visual = document.createElement('span'); visual.setAttribute('aria-hidden', 'true'); visual.textContent = String(target);
    const accessible = document.createElement('span'); accessible.className = 'about-count-text'; accessible.textContent = String(target);
    node.removeAttribute('aria-label'); node.replaceChildren(visual, accessible);
    let numberFrame = 0;
    finishNumber = () => { cancelAnimationFrame(numberFrame); visual.textContent = String(target); };
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      if (reduced.matches || document.hidden) return;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / 680);
        visual.textContent = String(Math.round(target * (1 - (1 - progress) ** 3)));
        if (progress < 1) numberFrame = requestAnimationFrame(tick);
      };
      numberFrame = requestAnimationFrame(tick);
    }, { threshold: .6 });
    observer.observe(node);
  }
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('effects-paused', document.hidden);
    if (document.hidden) finishNumber();
  });
  reduced.addEventListener('change', () => { if (reduced.matches) finishNumber(); });
})();
