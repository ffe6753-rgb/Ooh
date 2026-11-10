# 坂柳 有栖 — live chat

A scripted Japanese chat between Arisu Sakayanagi and your OC, set on the first night they
reconnect after she leaves the school. The conversation plays out live: your OC's lines are
typed into the input box and sent, Arisu shows a typing indicator before each reply, and
messages get real clock timestamps and 既読 receipts.

## Run

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
```

Header buttons: playback speed (1× / 2× / 4×), pause, and skip to the end.

## Customize

- **OC name** — enter it on the start screen (or pass `?name=ユウ`). Arisu calls them
  `〇〇さん`; if left blank she says `あなた`.
- **Dialogue** — edit `conversation.js`. Per-line options are documented at the top of the file.
- **Avatar** — `assets/arisu.svg` is an original illustration. To use another picture, put it
  in `assets/` and change `avatar` in `conversation.js`.
