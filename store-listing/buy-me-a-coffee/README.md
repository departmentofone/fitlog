# Buy Me a Coffee cover banner

- `banner-3200x800.png` — upload this one (2x, stays sharp on retina; BMAC asks for at least 1600x400).
- `banner-1600x400.png` — 1x fallback.
- `banner.html` — source. FitLog palette (#0b0f1e navy, emerald #34d399) and Sora from `design-system/fonts`.
  Text is kept to the centre ~1000px so it survives BMAC's narrower mobile crop.

Re-render (from this folder):

```sh
HS=$(ls /opt/pw-browsers/chromium_headless_shell-*/*/headless_shell)
$HS --no-sandbox --hide-scrollbars --window-size=1600,400 --force-device-scale-factor=2 \
  --virtual-time-budget=3000 --screenshot="$PWD/banner-3200x800.png" "file://$PWD/banner.html"
```

Use the headless shell, not full Chromium: `chromium --headless=new` loses about 90px of viewport height
to window chrome, so the gradient cuts off.
