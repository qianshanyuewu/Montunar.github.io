"""Derived animations only; archival GIFs are never overwritten.
Requires Pillow. Drops alternate frames and retains their elapsed durations.
"""
from pathlib import Path
from PIL import Image
import json

out = Path('public/media')
out.mkdir(parents=True, exist_ok=True)
manifest = []
for theme, source in [('light', 'images/测试0.gif'), ('dark', 'images/测试.gif')]:
    image = Image.open(source)
    frames, durations = [], []
    for index in range(image.n_frames):
        image.seek(index)
        duration = image.info.get('duration', 20)
        if index % 3 == 0:
            frame = image.convert('RGB')
            frame.thumbnail((640, 400), Image.Resampling.LANCZOS)
            frames.append(frame)
            durations.append(duration)
        else:
            durations[-1] += duration
    destination = out / f'home-{theme}.webp'
    frames[0].save(destination, save_all=True, append_images=frames[1:],
                   duration=durations, loop=0, quality=48, method=5)
    if theme == 'light':
        frames[0].save(out/'home-poster.webp', quality=65, method=5)
    manifest.append({'source':source, 'output':str(destination),
                     'sourceBytes':Path(source).stat().st_size,
                     'outputBytes':destination.stat().st_size,
                     'frames':len(frames), 'durationMs':sum(durations)})
Path('docs/optimized-animation.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
