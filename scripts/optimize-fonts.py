"""Rebuild committed WOFF2 subsets from current Chinese content and interface.
Requires fonttools[woff]. Fonts missing a new glyph use the system fallback until
this optional asset regeneration is run; new articles never require this script.
"""
from pathlib import Path
from fontTools import subset
import json

text = ''.join(p.read_text() for p in Path('src').rglob('*')
               if p.is_file() and p.suffix in ['.md','.astro','.ts','.css'])
unicodes = set(range(32,127)) | set(map(ord,text))
out = Path('public/media'); out.mkdir(parents=True,exist_ok=True)
manifest = []
for weight, name in [(300,'Light'),(400,'Regular')]:
    source = f'fonts/HarmonyOS_Sans_SC_{name}.ttf'
    options = subset.Options()
    options.flavor = 'woff2'
    options.desubroutinize = True
    font = subset.load_font(source, options)
    sub = subset.Subsetter(options=options); sub.populate(unicodes=unicodes); sub.subset(font)
    destination = out/f'harmony-{weight}.woff2'
    subset.save_font(font,str(destination),options)
    manifest.append({'source':source,'output':str(destination),
                     'sourceBytes':Path(source).stat().st_size,
                     'outputBytes':destination.stat().st_size,
                     'requestedCodepoints':len(unicodes)})
Path('docs/optimized-fonts.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest,indent=2))
