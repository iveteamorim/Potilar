'use client';

import { useLayoutEffect } from 'react';

function applyTouchLayout() {
  try {
    const touch = navigator.maxTouchPoints > 1;
    const big = window.matchMedia('(min-width: 1400px)').matches;
    document.documentElement.classList.toggle('touch-ui', touch && !big);
  } catch {
    // Ignore browsers that block these checks.
  }
}

export default function TouchLayout() {
  useLayoutEffect(() => {
    applyTouchLayout();
    window.addEventListener('resize', applyTouchLayout);
    window.addEventListener('orientationchange', applyTouchLayout);
    return () => {
      window.removeEventListener('resize', applyTouchLayout);
      window.removeEventListener('orientationchange', applyTouchLayout);
    };
  }, []);

  return null;
}
