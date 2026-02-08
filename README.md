# tmux.help

Learn tmux by actually using it. No videos, no walls of text -- just a simulated terminal in your browser where you type real tmux commands and see what happens.

## What this is

An interactive tmux tutorial that runs entirely in the browser. There's a fake terminal on the left and a lesson sidebar on the right. You work through 23 lessons across 6 chapters: starting sessions, splitting panes, managing windows, detaching/attaching, copy mode, and some useful tricks.

The terminal behaves like tmux. Ctrl+b activates the prefix key. `%` splits horizontally. `"` splits vertically. Panes resize, windows rename, sessions detach. It's not a full tmux implementation, but it covers everything a beginner needs to build muscle memory.

## Running it

```bash
npm install
npm run dev
```

Opens at `localhost:5173`.

## How it works

The core is a `TmuxEngine` class that simulates tmux state -- sessions, windows, panes, layouts, prefix key handling, command mode, copy mode. It processes keyboard events and emits state changes that React renders.

Each lesson has a validation rule (either an action like `pane-split-horizontal` or a command string). When you do the right thing, the lesson completes and you move on.

Built with React, TypeScript, Vite, and Tailwind CSS v4. Uses Geist Mono throughout.

## Lessons

1. **Getting started** -- What tmux is, creating sessions, the prefix key, command mode
2. **Panes** -- Splitting, navigating, resizing, zooming, closing
3. **Windows** -- Creating, switching, renaming, closing
4. **Sessions** -- Creating named sessions, detaching, listing, reattaching
5. **Copy mode** -- Scrollback and search
6. **Pro tips** -- Mouse mode, config customization

## License

MIT
