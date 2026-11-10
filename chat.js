(() => {
  const { avatar, messages } = window.CHAT;
  const $ = (id) => document.getElementById(id);
  const log = $("log");
  const draft = $("draft");
  const statusEl = $("status");
  const intro = $("intro");
  const nameInput = $("name");
  const pauseBtn = $("pause");
  const state = { speed: 1, paused: false, skipping: false, playing: false };
  const STATUS = { online: "オンライン", typing: "入力中…", offline: "オフライン" };
  let lastFrom = null;

  for (const img of document.querySelectorAll("[data-avatar]")) img.src = avatar;

  // 再生速度・一時停止・スキップに追従する待機
  const sleep = (ms) =>
    new Promise((resolve) => {
      let left = ms;
      let last = performance.now();
      const tick = () => {
        const now = performance.now();
        if (!state.paused) left -= (now - last) * state.speed;
        last = now;
        if (state.skipping || left <= 0) resolve();
        else setTimeout(tick, 30);
      };
      tick();
    });

  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  };

  const fill = (text, name) =>
    text
      .replaceAll("{name、}", name ? `${name}さん、` : "")
      .replaceAll("{name}", name ? `${name}さん` : "あなた");

  const clock = () =>
    new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });

  function setStatus(key) {
    statusEl.textContent = STATUS[key];
    statusEl.dataset.state = key;
  }

  function setPaused(paused) {
    state.paused = paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.setAttribute("aria-label", paused ? "再開" : "一時停止");
  }

  // 読み返し中(上にスクロール中)は勝手に最下部へ戻さない
  function add(node) {
    const pinned =
      state.skipping || log.scrollHeight - log.scrollTop - log.clientHeight < 160;
    log.append(node);
    if (pinned) {
      log.scrollTo({ top: log.scrollHeight, behavior: state.skipping ? "auto" : "smooth" });
    }
    return node;
  }

  function arisuRow(extra) {
    const row = el("div", `row row--arisu ${extra || ""}`);
    if (lastFrom !== "arisu") row.classList.add("row--head");
    const img = el("img", "avatar");
    img.src = avatar;
    img.alt = "";
    row.append(img);
    return row;
  }

  function bubble(from, text, big) {
    const body = el("div", big ? "bubble bubble--big" : "bubble", text);
    const meta = el("span", "meta");
    let row;
    if (from === "me") {
      row = el("div", "row row--me");
      if (lastFrom !== "me") row.classList.add("row--head");
      meta.append(el("span", "read", "既読"), el("time", null, clock()));
      row.append(meta, body);
    } else {
      row = arisuRow();
      meta.append(el("time", null, clock()));
      row.append(body, meta);
    }
    lastFrom = from;
    add(row);
  }

  function markRead() {
    for (const node of log.querySelectorAll(".read:not(.on)")) node.classList.add("on");
  }

  async function typing(ms) {
    const row = arisuRow("row--typing");
    row.setAttribute("aria-hidden", "true");
    const dots = el("div", "bubble dots");
    dots.append(el("i"), el("i"), el("i"));
    row.append(dots);
    setStatus("typing");
    add(row);
    await sleep(ms);
    row.remove();
    setStatus("online");
  }

  async function type(text) {
    for (const ch of text) {
      draft.textContent += ch;
      await sleep(/[、。…?!\s]/.test(ch) ? 190 : 75);
    }
  }

  async function erase() {
    while (draft.textContent) {
      draft.textContent = [...draft.textContent].slice(0, -1).join("");
      await sleep(45);
    }
  }

  async function play(name) {
    state.playing = true;
    lastFrom = null;
    log.replaceChildren();
    setStatus("online");
    const today = new Date().toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
    add(el("div", "system", today));

    for (const m of messages) {
      const from = "me" in m ? "me" : "arisu";
      const text = fill(m[from], name);
      if (m.wait) await sleep(m.wait);

      if (from === "me") {
        await sleep(lastFrom === "me" ? 600 : 1200);
        if (m.fake) {
          await type(fill(m.fake, name));
          await sleep(900);
          await erase();
          await sleep(500);
        }
        if (!m.big) await type(text);
        await sleep(300);
        draft.textContent = "";
        bubble("me", text, m.big);
      } else {
        await sleep(lastFrom === "arisu" ? 400 : 900);
        markRead();
        await sleep(400);
        if (m.hesitate) {
          await typing(1500);
          await sleep(1400);
        }
        await typing(Math.min(3600, Math.max(900, text.length * 80)));
        bubble("arisu", text, m.big);
      }
    }

    await sleep(1500);
    markRead();
    await sleep(1500);
    setStatus("offline");
    const again = el("button", "again", "もう一度再生");
    again.type = "button";
    again.addEventListener("click", () => play(name));
    add(again);
    state.skipping = false;
    state.playing = false;
    setPaused(false);
  }

  $("speed").addEventListener("click", (e) => {
    state.speed = state.speed === 4 ? 1 : state.speed * 2;
    e.currentTarget.textContent = `${state.speed}×`;
  });
  pauseBtn.addEventListener("click", () => setPaused(!state.paused));
  $("skip").addEventListener("click", () => {
    if (state.playing) state.skipping = true;
  });

  // file:// などで localStorage が使えなくても再生は止めない
  const store = {
    get: () => {
      try {
        return localStorage.getItem("oc-name");
      } catch {
        return null;
      }
    },
    set: (value) => {
      try {
        localStorage.setItem("oc-name", value);
      } catch {}
    },
  };

  nameInput.value = new URLSearchParams(location.search).get("name") ?? store.get() ?? "";
  intro.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim().replace(/さん$/, "");
    store.set(name);
    intro.hidden = true;
    play(name);
  });
})();
