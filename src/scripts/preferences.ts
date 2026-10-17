function saved(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Private browsing still works. */
  }
}
export function setupPreferences() {
  const root = document.documentElement;
  const theme = document.querySelector<HTMLButtonElement>('#theme-toggle')!;
  const syncTheme = () => {
    theme.setAttribute(
      'aria-label',
      root.dataset.theme === 'dark' ? '切换为白天主题' : '切换为暗夜主题',
    );
    theme.title = theme.getAttribute('aria-label')!;
  };
  syncTheme();
  theme.addEventListener('click', () => {
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    save('theme', root.dataset.theme);
    syncTheme();
  });
  const settings = document.querySelector<HTMLElement>('#reading-settings')!;
  const settingsToggle = document.querySelector('#settings-toggle')!;
  settingsToggle.addEventListener('click', () => {
    settings.hidden = !settings.hidden;
    settingsToggle.setAttribute('aria-expanded', String(!settings.hidden));
  });
  document.addEventListener('click', (event) => {
    if (!(event.target as Element).closest('.toolbar')) {
      settings.hidden = true;
      settingsToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.querySelectorAll<HTMLButtonElement>('[data-font]').forEach((button) =>
    button.addEventListener('click', () => {
      const old = Number(saved('articleFontSize')) || 100;
      const change = Number(button.dataset.font);
      const size = change === 0 ? 100 : Math.min(150, Math.max(80, old + change));
      root.style.setProperty('--reading-scale', String(size / 100));
      save('articleFontSize', String(size));
    }),
  );
  const animation = document.querySelector<HTMLButtonElement>('#animation-toggle')!;
  const syncAnimation = () => {
    animation.setAttribute('aria-pressed', String(root.dataset.animation === 'slideUp'));
  };
  syncAnimation();
  animation.addEventListener('click', () => {
    root.dataset.animation = root.dataset.animation === 'slideUp' ? 'fade' : 'slideUp';
    save('animationMode', root.dataset.animation);
    syncAnimation();
  });
  const back = document.querySelector<HTMLButtonElement>('#back-to-top')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  addEventListener(
    'scroll',
    () => {
      back.hidden = scrollY <= 300;
    },
    { passive: true },
  );
  back.addEventListener('click', () =>
    scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' }),
  );
  document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
    dialog.querySelector('[data-close-dialog]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog && dialog.id === 'search-dialog') {
        const rect = dialog.getBoundingClientRect();
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          dialog.close();
      }
    });
    dialog.addEventListener('close', () => {
      root.style.overflow = '';
    });
  });
}
