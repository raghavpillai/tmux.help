# tmux.help

A browser-based tmux tutorial. You type real tmux keybindings into a simulated terminal and it responds like tmux would. 23 lessons, nothing to install.

## Why

Most tmux tutorials are blog posts you read once and forget. The keybindings don't stick until your fingers learn them. This puts a terminal in front of you and walks you through each command one at a time.

It's not a complete tmux emulation. It covers the commands that matter when you're starting out: splits, panes, windows, sessions, copy mode. Enough to stop Googling "tmux cheat sheet" every time you SSH into something.

## Running locally

```bash
bun install
bun dev
```

That's it. Opens on `localhost:5173`.

## How it works

A ~1400-line `TmuxEngine` class handles all the simulation -- sessions, windows, panes, layout trees, prefix key state, command mode, copy mode. It takes keyboard events in and emits state changes out. React renders whatever the engine says the terminal looks like.

Each lesson defines a validation rule. Some check for specific actions (like `pane-split-horizontal`), others check if you typed a particular command. Do the thing, lesson completes, move to the next one.

## The 23 lessons

Getting started (4) -- what tmux is, starting a session, prefix key, command mode

Panes (6) -- horizontal/vertical splits, navigating between panes, resizing, zoom, closing

Windows (5) -- new windows, switching, renaming, closing

Sessions (4) -- named sessions, detach, list, reattach

Copy mode (2) -- scrollback, search

Pro tips (2) -- mouse mode, config

## Stack

React, TypeScript, Vite, Tailwind v4, Biome. Geist Mono for the font.

## License

MIT
