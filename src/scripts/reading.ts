import { fetchJson, invalidateJson } from './network';
type ArticlePayload = { title: string; html: string };
const tasks = new WeakMap<HTMLDetailsElement, Promise<void>>();

export function setupReading() {
  const cards = Array.from(document.querySelectorAll<HTMLDetailsElement>('details[data-article]'));
  const dialog = document.querySelector<HTMLDialogElement>('#immersive-dialog')!;
  const show = (prose: HTMLElement, title: string) => {
    document.querySelector('#immersive-heading')!.textContent = title;
    const target = document.querySelector('#immersive-body')!;
    target.innerHTML = prose.innerHTML;
    // Modal and document must not contain duplicate heading IDs.
    target.querySelectorAll('[id]').forEach((el) => (el.id = `immersive-${el.id}`));
    target
      .querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
      .forEach((a) => (a.hash = `immersive-${a.hash.slice(1)}`));
    dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  };
  async function ensure(card: HTMLDetailsElement) {
    if (card.dataset.state === 'ready') return;
    if (tasks.has(card)) return tasks.get(card);
    const body = card.querySelector<HTMLElement>('[data-article-body]')!;
    const task = (async () => {
      card.dataset.state = 'loading';
      body.textContent = '正在加载正文…';
      body.setAttribute('aria-busy', 'true');
      try {
        const payload = await fetchJson<ArticlePayload>(card.dataset.endpoint!);
        if (typeof payload.html !== 'string' || typeof payload.title !== 'string')
          throw new Error('Invalid article payload');
        const prose = document.createElement('div');
        prose.className = 'prose';
        prose.innerHTML = payload.html;
        body.replaceChildren(prose);
        card.dataset.state = 'ready';
      } catch {
        invalidateJson(card.dataset.endpoint!);
        card.dataset.state = 'error';
        const message = document.createElement('p');
        message.textContent = '正文暂时未能加载。可以重试，或使用下方的独立阅读。';
        const retry = document.createElement('button');
        retry.textContent = '重试加载';
        retry.addEventListener('click', () => {
          void ensure(card);
        });
        body.replaceChildren(message, retry);
      } finally {
        body.removeAttribute('aria-busy');
      }
    })();
    tasks.set(card, task);
    try {
      await task;
    } finally {
      tasks.delete(card);
    }
  }
  cards.forEach((card) => {
    card.addEventListener('toggle', () => {
      if (card.open) void ensure(card);
    });
    card.querySelector('[data-immersive-card]')?.addEventListener('click', async () => {
      await ensure(card);
      const prose = card.querySelector<HTMLElement>('.prose');
      if (prose) show(prose, card.querySelector('.article-title')!.textContent || '文章');
    });
  });
  const expandAll = document.querySelector<HTMLButtonElement>('#expand-all-articles');
  let expansionGeneration = 0;
  expandAll?.addEventListener('click', async () => {
    const generation = ++expansionGeneration;
    const expand = expandAll.getAttribute('aria-pressed') !== 'true';
    expandAll.setAttribute('aria-pressed', String(expand));
    expandAll.textContent = expand ? '折叠全部文章' : '展开全部文章';
    if (!expand) {
      expandAll.removeAttribute('aria-busy');
      cards.forEach((card) => {
        card.open = false;
      });
      return;
    }
    expandAll.setAttribute('aria-busy', 'true');
    // Load in four workers. Only open a card after scheduling its request, so
    // native toggle events join the same promise rather than starting 100 fetches.
    const queue = [...cards];
    await Promise.all(
      Array.from({ length: Math.min(4, queue.length) }, async () => {
        while (queue.length && generation === expansionGeneration) {
          const card = queue.shift()!;
          const pending = ensure(card);
          card.open = true;
          await pending;
        }
      }),
    );
    if (generation === expansionGeneration) expandAll.removeAttribute('aria-busy');
  });
  document.querySelector('[data-immersive-page]')?.addEventListener('click', () => {
    const prose = document.querySelector<HTMLElement>('#article-prose');
    if (prose) show(prose, document.querySelector('h1')!.textContent || '文章');
  });
  const article = document.querySelector<HTMLElement>('#article-prose');
  const progress = document.querySelector<HTMLElement>('#reading-progress');
  if (article && progress) {
    let ticking = false;
    const update = () => {
      const top = article.getBoundingClientRect().top + scrollY;
      const distance = Math.max(1, article.offsetHeight - innerHeight);
      const value = Math.min(100, Math.max(0, ((scrollY - top) / distance) * 100));
      progress.style.transform = `scaleX(${value / 100})`;
      progress.setAttribute('aria-valuenow', String(Math.round(value)));
      ticking = false;
    };
    addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    addEventListener('resize', update);
    update();
  }
}
