type MusicSession = { playing: boolean; time: number; page: string; updated: number };
export function setupMusic() {
  const music = document.querySelector<HTMLAudioElement>('#background-music')!;
  const button = document.querySelector<HTMLButtonElement>('#music-toggle')!;
  const status = document.querySelector<HTMLElement>('#tool-status')!;
  let departing = false;
  let statusTimer: ReturnType<typeof setTimeout>;
  const announce = (text: string) => {
    status.textContent = text;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => {
      status.textContent = '';
    }, 5000);
  };
  const snapshot = () => {
    try {
      const session: MusicSession = {
        playing: !music.paused && !music.error,
        time: music.currentTime,
        page: location.href,
        updated: Date.now(),
      };
      sessionStorage.setItem('music-session', JSON.stringify(session));
    } catch {
      /* Playback remains available if storage is blocked. */
    }
  };
  const sync = () => {
    const playing = !music.paused && !music.error;
    button.setAttribute('aria-pressed', String(playing));
    button.setAttribute('aria-label', playing ? '暂停背景音乐' : '播放背景音乐');
    button.title = button.getAttribute('aria-label')!;
    if (!departing) snapshot();
  };
  const play = async (restoreTime?: number) => {
    button.disabled = true;
    try {
      if (!music.src || music.error) {
        music.src = music.dataset.src!;
        music.load();
      }
      if (restoreTime !== undefined) {
        const seek = () => {
          music.currentTime = Math.max(
            0,
            Math.min(
              restoreTime,
              Number.isFinite(music.duration) ? music.duration - 0.1 : restoreTime,
            ),
          );
        };
        if (music.readyState >= HTMLMediaElement.HAVE_METADATA) seek();
        else music.addEventListener('loadedmetadata', seek, { once: true });
      }
      await music.play();
      status.textContent = '';
    } catch {
      announce(
        restoreTime === undefined
          ? '音乐暂时无法播放，点击音乐按钮可重试。'
          : '点击音乐按钮继续播放。',
      );
    } finally {
      button.disabled = false;
    }
  };
  button.addEventListener('click', () => {
    if (!music.paused) music.pause();
    else void play();
  });
  ['play', 'pause', 'ended', 'error'].forEach((event) => music.addEventListener(event, sync));
  music.addEventListener('timeupdate', () => {
    if (!departing && !music.paused) snapshot();
  });
  addEventListener('pagehide', () => {
    snapshot();
    departing = true;
  });
  // Resume only after navigation within this tab from the page that was playing.
  // A fresh visit never sets src or fetches the music.
  try {
    const previous = JSON.parse(
      sessionStorage.getItem('music-session') || 'null',
    ) as MusicSession | null;
    if (
      previous?.playing &&
      previous.page === document.referrer &&
      Date.now() - previous.updated < 60_000 &&
      Number.isFinite(previous.time)
    )
      void play(previous.time);
  } catch {
    /* A missing or malformed session simply starts paused. */
  }
}
