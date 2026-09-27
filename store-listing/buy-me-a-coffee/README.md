# Buy Me a Coffee cover banner

"Still Typing" mark, dark lockup: `department of one▮` on #0b0d13, with a `// ... for now` code comment beneath.

- `banner-3200x800.png` — upload this one (2x, stays sharp on retina; BMAC asks for at least 1600x400).
- `banner-1600x400.png` — 1x fallback.
- `banner.html` — source. The wordmark is the outlined `lockup_dark` path from the Department of One
  marks (`concepts.json` → `typing`), unchanged. Colours are the marks page's dark tokens: paper `#eaede6`,
  accent `#8fa3ff`, muted `#9aa1ad`. Opened in a browser, the cursor blinks.
- `fonts/` — Geist Mono (SIL Open Font License), kept local so rendering doesn't need the network.

Content sits in the centre ~920px so it survives BMAC's narrower mobile crop.

Re-render (from this folder):

```sh
HS=$(ls /opt/pw-browsers/chromium_headless_shell-*/*/headless_shell)
$HS --no-sandbox --hide-scrollbars --window-size=1600,400 --force-device-scale-factor=2 \
  --virtual-time-budget=1500 --screenshot="$PWD/banner-3200x800.png" "file://$PWD/banner.html"
```

Use the headless shell, not full Chromium: `chromium --headless=new` loses about 90px of viewport height
to window chrome.
