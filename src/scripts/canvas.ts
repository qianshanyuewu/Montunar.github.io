export function setupCanvas() {
  const canvas = document.querySelector<HTMLCanvasElement>('#background-canvas');
  if (!canvas) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const ctx = context;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let width = innerWidth,
    height = innerHeight,
    request = 0,
    last = 0;
  const lines = Array.from({ length: 12 }, (_, i) => ({
    x: Math.random(),
    y: Math.random(),
    dx: (Math.random() - 0.5) * 0.00012,
    dy: (Math.random() - 0.5) * 0.00012,
    vertical: i % 2 === 0,
  }));
  const resize = () => {
    width = innerWidth;
    height = innerHeight;
    canvas.width = width;
    canvas.height = height;
  };
  const active = () =>
    !document.hidden && !reduced.matches && !document.querySelector('dialog[open]');
  const draw = (time: number) => {
    if (!active()) {
      request = 0;
      return;
    }
    request = requestAnimationFrame(draw);
    if (time - last < 1000 / 30) return;
    const delta = Math.min(50, time - last);
    last = time;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = document.documentElement.dataset.theme === 'dark' ? '#555' : '#ddd';
    ctx.lineWidth = 0.6;
    for (const line of lines) {
      line.x += line.dx * delta;
      line.y += line.dy * delta;
      if (line.x < 0 || line.x > 1) line.dx *= -1;
      if (line.y < 0 || line.y > 1) line.dy *= -1;
      ctx.beginPath();
      if (line.vertical) {
        ctx.moveTo(line.x * width, 0);
        ctx.lineTo(line.y * width, height);
      } else {
        ctx.moveTo(0, line.y * height);
        ctx.lineTo(width, line.x * height);
      }
      ctx.stroke();
    }
  };
  const refresh = () => {
    if (active() && !request) {
      last = performance.now();
      request = requestAnimationFrame(draw);
    } else if (!active() && request) {
      cancelAnimationFrame(request);
      request = 0;
    }
  };
  resize();
  refresh();
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', refresh);
  reduced.addEventListener('change', refresh);
  document.querySelectorAll('dialog').forEach((dialog) =>
    new MutationObserver(refresh).observe(dialog, {
      attributes: true,
      attributeFilter: ['open'],
    }),
  );
}
