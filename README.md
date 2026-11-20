<div align="center">

```
                     .  *   .        .
            *    ·         .     *
        ╭──────────────────────────╮
   .   ╱      ·    ⟡    *          ╲    .
      │     ╭──────────────╮        │
   *  │  ·  │   ╭──────╮   │    .   │  *
      │     │  ╱  ●──╮  ╲  │        │
      │     │ │   ◉  │   │ │   *   │
      │     │  ╲  ──╯  ╱  │        │
   .  │     │   ╰──────╯   │   .   │  .
      │     ╰──────────────╯        │
   *  ╲    .      ⟡    ·      *    ╱   *
        ╰──────────────────────────╯
            .     *    ·        .
     .   *        C O Z M O        *   .
```

# Cozmo

### Your own AI assistant. Full memory. No terminal.

</div>

---

Cozmo wraps [Claude Code](https://claude.com/claude-code) in a desktop app with a
persistent vault, a visual galaxy of your notes, daily journaling, and project-scoped
memory across chats — download it, sign in twice, and that's the whole setup.

## What it actually does

- **Chat** — a real Claude Code session per conversation, not a toy wrapper.
- **Vault that builds itself as you go** — starts as an empty template
  (`~/Cozmo/vault`), not a form to fill out. Cozmo asks your name on first
  contact and writes it in; every turn appends to that day's log, every day
  gets a diary entry seeded from what actually happened. The vault a month in
  looks nothing like day one, and you never had to maintain it by hand.
  Browsable as a literal galaxy: folders are planets, notes orbit them, real
  `[[links]]` draw as connections between stars. Click any star to read or
  edit the note.
- **Projects** — group chats around a shared target. Every chat in a project
  gets a digest of what the others covered, plus whatever notes you give the
  project — shared context, not just a folder label.
- **Learn** — syncs course material into NotebookLM, with sign-in/out built in.
- **Zero setup** — first launch installs `claude` and `nlm` for you if they're
  missing, then walks you through sign-in. No terminal, ever.

## Installing

1. Grab the latest build from [Releases](../../releases) — unzip it.
2. **Right-click → Open** the first time (it's unsigned, so macOS Gatekeeper
   blocks a plain double-click once).
3. If that still shows an error with no override option (some macOS versions
   refuse a fully unsigned app outright instead of offering "Open Anyway"),
   open Terminal and run:
   ```bash
   xattr -cr ~/Downloads/Cozmo.app
   ```
   (adjust the path if you moved it elsewhere), then try opening it again.
4. Sign in to Claude when asked. If you use the Learn tab, sign in to
   NotebookLM from there too.

That's it — everything else (the vault, Diary, Logs) builds itself on first run.

## Building from source

```bash
npm install
npm start          # dev mode
npm run dist       # packaged .app in dist/mac
```

Needs `../cozbra-dashboard` as a sibling directory — it's bundled in at build
time, not vendored into this repo.

## Why it looks like this

Everything in Cozmo is deliberately spacey — the vault's a galaxy, the sign-in
screen has a starfield, the mark is an orbit. Not decoration for its own sake:
a vault is just files on disk until something makes it worth looking at.

