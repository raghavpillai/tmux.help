import type { ShellLine, PaneLayout, TmuxPane } from '../types';
export type { ShellLine, PaneLayout, TmuxPane };

export interface TmuxWindow {
  id: string;
  name: string;
  panes: TmuxPane[];
  activePaneId: string;
  layout: PaneLayout;
  index: number;
}

export interface TmuxSession {
  id: string;
  name: string;
  windows: TmuxWindow[];
  activeWindowId: string;
}

export type TmuxMode = 'normal' | 'copy' | 'command' | 'confirm' | 'rename';

export interface TmuxState {
  sessions: TmuxSession[];
  activeSessionId: string | null;
  isAttached: boolean;
  isInsideTmux: boolean;
  mode: TmuxMode;
  prefixActive: boolean;
  zoomedPaneId: string | null;
  confirmAction: string | null;
  commandInput: string;
  renameInput: string;
}

export type TmuxEvent =
  | { type: 'state-changed' }
  | { type: 'pane-output'; paneId: string; line: ShellLine }
  | { type: 'notification'; message: string }
  | { type: 'prefix-activated' }
  | { type: 'prefix-deactivated' }
  | { type: 'mode-changed'; mode: TmuxMode }
  | { type: 'action-performed'; action: string };

type EventCallback = (event: TmuxEvent) => void;

interface FSNode {
  type: 'file' | 'dir';
  content?: string;
  children?: Record<string, FSNode>;
}

function createFS(): FSNode {
  return {
    type: 'dir',
    children: {
      home: {
        type: 'dir',
        children: {
          user: {
            type: 'dir',
            children: {
              projects: {
                type: 'dir',
                children: {
                  myapp: {
                    type: 'dir',
                    children: {
                      src: {
                        type: 'dir',
                        children: {
                          'index.ts': {
                            type: 'file',
                            content:
                              'import { createApp } from "./app";\n\nconst app = createApp();\napp.listen(3000, () => {\n  console.log("Server running on port 3000");\n});\n',
                          },
                          'utils.ts': {
                            type: 'file',
                            content:
                              'export function formatDate(d: Date): string {\n  return d.toISOString().split("T")[0];\n}\n\nexport function sleep(ms: number): Promise<void> {\n  return new Promise(resolve => setTimeout(resolve, ms));\n}\n',
                          },
                        },
                      },
                      'package.json': {
                        type: 'file',
                        content:
                          '{\n  "name": "myapp",\n  "version": "1.0.0",\n  "main": "src/index.ts",\n  "scripts": {\n    "start": "ts-node src/index.ts",\n    "build": "tsc",\n    "test": "jest"\n  },\n  "dependencies": {\n    "express": "^4.18.2"\n  }\n}\n',
                      },
                      'README.md': {
                        type: 'file',
                        content:
                          '# My App\n\nA simple Node.js application.\n\n## Getting Started\n\n```bash\nnpm install\nnpm start\n```\n',
                      },
                    },
                  },
                  website: {
                    type: 'dir',
                    children: {
                      'index.html': {
                        type: 'file',
                        content:
                          '<!DOCTYPE html>\n<html>\n<head><title>My Website</title></head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>\n',
                      },
                      'style.css': {
                        type: 'file',
                        content:
                          'body {\n  font-family: sans-serif;\n  margin: 2rem;\n  background: #1a1a2e;\n  color: #eee;\n}\n',
                      },
                    },
                  },
                },
              },
              documents: {
                type: 'dir',
                children: {
                  'notes.txt': {
                    type: 'file',
                    content:
                      'Meeting notes - 2024-01-15\n\n- Review Q4 results\n- Plan sprint goals\n- Update documentation\n',
                  },
                },
              },
              '.bashrc': {
                type: 'file',
                content:
                  '# ~/.bashrc\nexport PS1="\\u@\\h:\\w$ "\nexport EDITOR=vim\nalias ll="ls -la"\nalias gs="git status"\n',
              },
              '.tmux.conf': {
                type: 'file',
                content: `# ─── General ────────────────────────────────────────────
# Set prefix to Ctrl+a (alternative to Ctrl+b)
# unbind C-b
# set -g prefix C-a
# bind C-a send-prefix

# Enable mouse support
set -g mouse on

# Start window numbering at 1
set -g base-index 1
setw -g pane-base-index 1

# Increase scrollback buffer
set -g history-limit 10000

# Reduce escape time
set -sg escape-time 0

# ─── Key Bindings ───────────────────────────────────────
# Split panes with | and -
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"

# Reload config
bind r source-file ~/.tmux.conf \\; display "Config reloaded!"

# ─── Appearance ─────────────────────────────────────────
# Status bar
set -g status-style 'bg=#1a7f37 fg=#ffffff'
set -g status-left ' [#S] '
set -g status-right ' %H:%M '

# Active pane border
set -g pane-active-border-style 'fg=#3fb950'
set -g pane-border-style 'fg=#30363d'

# ─── Colors ─────────────────────────────────────────────
set -g default-terminal "screen-256color"
`,
              },
            },
          },
        },
      },
    },
  };
}

function resolvePath(fs: FSNode, path: string): FSNode | null {
  const parts = path.split('/').filter(Boolean);
  let node = fs;
  for (const part of parts) {
    if (node.type !== 'dir' || !node.children?.[part]) return null;
    node = node.children[part];
  }
  return node;
}

function normalizePath(cwd: string, target: string): string {
  if (target.startsWith('/')) return target;
  if (target.startsWith('~/')) return '/home/user/' + target.slice(2);
  if (target === '~') return '/home/user';

  const parts = cwd.split('/').filter(Boolean);
  const targetParts = target.split('/').filter(Boolean);

  for (const part of targetParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.') {
      parts.push(part);
    }
  }

  return '/' + parts.join('/');
}

export class TmuxEngine {
  private sessions: TmuxSession[] = [];
  private activeSessionId: string | null = null;
  private isAttached = false;
  private isInsideTmux = false;
  private mode: TmuxMode = 'normal';
  private prefixActive = false;
  private prefixTimeout: ReturnType<typeof setTimeout> | null = null;
  private zoomedPaneId: string | null = null;
  private confirmAction: string | null = null;
  private commandInput = '';
  private renameInput = '';
  private nextPaneId = 0;
  private nextWindowId = 0;
  private nextSessionId = 0;
  private listeners: EventCallback[] = [];
  private actionHistory: string[] = [];
  private typedCommands: string[] = [];
  private fs: FSNode;

  constructor() {
    this.fs = createFS();
  }

  reset(): void {
    this.sessions = [];
    this.activeSessionId = null;
    this.isAttached = false;
    this.isInsideTmux = false;
    this.mode = 'normal';
    this.prefixActive = false;
    if (this.prefixTimeout) {
      clearTimeout(this.prefixTimeout);
      this.prefixTimeout = null;
    }
    this.zoomedPaneId = null;
    this.confirmAction = null;
    this.commandInput = '';
    this.renameInput = '';
    this.nextPaneId = 0;
    this.nextWindowId = 0;
    this.nextSessionId = 0;
    this.actionHistory = [];
    this.typedCommands = [];
    this.fs = createFS();
    this.emit({ type: 'state-changed' });
  }

  on(_event: string, callback: EventCallback): void {
    this.listeners.push(callback);
  }

  off(_event: string, callback: EventCallback): void {
    this.listeners = this.listeners.filter((l) => l !== callback);
  }

  private emit(event: TmuxEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private recordAction(action: string): void {
    this.actionHistory.push(action);
    this.emit({ type: 'action-performed', action });
  }

  getActionHistory(): string[] {
    return [...this.actionHistory];
  }

  recordCommand(command: string): void {
    this.typedCommands.push(command);
    this.emit({ type: 'state-changed' });
  }

  getTypedCommands(): string[] {
    return [...this.typedCommands];
  }

  getState(): TmuxState {
    return {
      sessions: this.sessions,
      activeSessionId: this.activeSessionId,
      isAttached: this.isAttached,
      isInsideTmux: this.isInsideTmux,
      mode: this.mode,
      prefixActive: this.prefixActive,
      zoomedPaneId: this.zoomedPaneId,
      confirmAction: this.confirmAction,
      commandInput: this.commandInput,
      renameInput: this.renameInput,
    };
  }

  getActiveSession(): TmuxSession | null {
    return this.sessions.find((s) => s.id === this.activeSessionId) || null;
  }

  getActiveWindow(): TmuxWindow | null {
    const session = this.getActiveSession();
    if (!session) return null;
    return session.windows.find((w) => w.id === session.activeWindowId) || null;
  }

  getActivePane(): TmuxPane | null {
    const window = this.getActiveWindow();
    if (!window) return null;
    return window.panes.find((p) => p.id === window.activePaneId) || null;
  }

  private createPane(cwd: string = '/home/user'): TmuxPane {
    const id = String(this.nextPaneId++);
    return {
      id,
      shellHistory: [],
      currentInput: '',
      cwd,
      isActive: true,
    };
  }

  private createWindow(name: string = 'bash'): TmuxWindow {
    const id = String(this.nextWindowId++);
    const pane = this.createPane();
    const index = this.getActiveSession()?.windows.length ?? 0;

    return {
      id,
      name,
      panes: [pane],
      activePaneId: pane.id,
      layout: { type: 'leaf', paneId: pane.id, size: 100 },
      index,
    };
  }

  createSession(name?: string): TmuxSession {
    const id = String(this.nextSessionId++);
    const sessionName = name || String(id);
    const window = this.createWindow();

    const session: TmuxSession = {
      id,
      name: sessionName,
      windows: [window],
      activeWindowId: window.id,
    };

    this.sessions.push(session);
    this.activeSessionId = session.id;
    this.isAttached = true;
    this.isInsideTmux = true;

    this.addSystemMessage(
      window.panes[0].id,
      `[tmux] Session "${sessionName}" created`
    );

    this.emit({ type: 'state-changed' });
    return session;
  }

  executeCommand(paneId: string, command: string): void {
    const pane = this.findPane(paneId);
    if (!pane) {
      if (command === '') {
        this.recordAction('enter-pressed');
      }
      return;
    }

    const prompt = `user@tmux-learn:${this.shortenPath(pane.cwd)}$ `;

    pane.shellHistory.push({
      type: 'input',
      content: command,
      prompt,
    });

    const trimmed = command.trim();
    if (!trimmed) {
      this.recordAction('enter-pressed');
      this.emit({ type: 'state-changed' });
      return;
    }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    switch (cmd) {
      case 'ls':
        this.cmdLs(pane, args);
        break;
      case 'pwd':
        this.addOutput(paneId, pane.cwd);
        break;
      case 'cd':
        this.cmdCd(pane, args);
        break;
      case 'echo':
        this.addOutput(paneId, args.join(' '));
        break;
      case 'clear':
        pane.shellHistory = [];
        break;
      case 'cat':
        this.cmdCat(pane, args);
        break;
      case 'mkdir':
        this.cmdMkdir(pane, args);
        break;
      case 'help':
        this.cmdHelp(paneId);
        break;
      case 'tmux':
        this.cmdTmux(pane, args);
        break;
      case 'exit':
        this.closePaneById(paneId);
        this.recordAction('pane-closed');
        return;
      case 'whoami':
        this.addOutput(paneId, 'user');
        break;
      case 'hostname':
        this.addOutput(paneId, 'tmux-learn');
        break;
      case 'date':
        this.addOutput(paneId, new Date().toString());
        break;
      case 'uname':
        this.addOutput(paneId, 'Linux tmux-learn 5.15.0 x86_64 GNU/Linux');
        break;
      default:
        this.addError(paneId, `${cmd}: command not found`);
    }

    this.emit({ type: 'state-changed' });
  }

  private cmdLs(pane: TmuxPane, args: string[]): void {
    const flagArgs = args.filter((a) => a.startsWith('-'));
    const pathArgs = args.filter((a) => !a.startsWith('-'));
    const target = pathArgs[0] ? normalizePath(pane.cwd, pathArgs[0]) : pane.cwd;
    const node = resolvePath(this.fs, target);

    if (!node) {
      this.addError(pane.id, `ls: cannot access '${pathArgs[0] || target}': No such file or directory`);
      return;
    }

    if (node.type === 'file') {
      this.addOutput(pane.id, pathArgs[0] || target.split('/').pop() || '');
      return;
    }

    if (!node.children) {
      this.addOutput(pane.id, '');
      return;
    }

    const allFlags = flagArgs.join('');
    const showHidden = allFlags.includes('a');
    const showLong = allFlags.includes('l');

    let entries = Object.entries(node.children);
    if (!showHidden) {
      entries = entries.filter(([name]) => !name.startsWith('.'));
    } else {
      entries = [
        ['.', node],
        ['..', node],
        ...entries,
      ] as [string, FSNode][];
    }

    if (showLong) {
      const lines = entries.map(([name, child]) => {
        const isDir = (child as FSNode).type === 'dir';
        const perms = isDir ? 'drwxr-xr-x' : '-rw-r--r--';
        const size = isDir ? '4096' : String((child as FSNode).content?.length || 0);
        return `${perms}  1 user user  ${size.padStart(5)} Jan 15 10:30 ${name}${isDir ? '/' : ''}`;
      });
      this.addOutput(pane.id, `total ${entries.length * 4}\n` + lines.join('\n'));
    } else {
      const names = entries.map(([name, child]) => {
        const isDir = (child as FSNode).type === 'dir';
        return name + (isDir ? '/' : '');
      });
      this.addOutput(pane.id, names.join('  '));
    }
  }

  private cmdCd(pane: TmuxPane, args: string[]): void {
    const target = args[0] || '~';
    const newPath = normalizePath(pane.cwd, target);
    const node = resolvePath(this.fs, newPath);

    if (!node) {
      this.addError(pane.id, `cd: ${target}: No such file or directory`);
      return;
    }
    if (node.type !== 'dir') {
      this.addError(pane.id, `cd: ${target}: Not a directory`);
      return;
    }

    pane.cwd = newPath;
  }

  private cmdCat(pane: TmuxPane, args: string[]): void {
    if (!args[0]) {
      this.addError(pane.id, 'cat: missing file operand');
      return;
    }

    const target = normalizePath(pane.cwd, args[0]);
    const node = resolvePath(this.fs, target);

    if (!node) {
      this.addError(pane.id, `cat: ${args[0]}: No such file or directory`);
      return;
    }
    if (node.type === 'dir') {
      this.addError(pane.id, `cat: ${args[0]}: Is a directory`);
      return;
    }

    this.addOutput(pane.id, node.content || '');
  }

  private cmdMkdir(pane: TmuxPane, args: string[]): void {
    if (!args[0]) {
      this.addError(pane.id, 'mkdir: missing operand');
      return;
    }

    const dirName = args[0];
    const parentPath = pane.cwd;
    const parent = resolvePath(this.fs, parentPath);

    if (!parent || parent.type !== 'dir') return;

    if (!parent.children) parent.children = {};
    if (parent.children[dirName]) {
      this.addError(pane.id, `mkdir: cannot create directory '${dirName}': File exists`);
      return;
    }

    parent.children[dirName] = { type: 'dir', children: {} };
  }

  private cmdHelp(paneId: string): void {
    this.addOutput(
      paneId,
      `Available commands:
  ls [path]       List directory contents
  cd [path]       Change directory
  pwd             Print working directory
  cat <file>      Display file contents
  echo <text>     Display text
  mkdir <dir>     Create directory
  clear           Clear screen
  help            Show this help
  exit            Close pane
  tmux [cmd]      tmux commands (new, ls, attach, split-window, etc.)
  whoami          Print current user
  hostname        Print hostname
  date            Print current date`
    );
  }

  private cmdTmux(pane: TmuxPane, args: string[]): void {
    if (args.length === 0) {
      if (this.isInsideTmux) {
        this.addError(pane.id, 'sessions should be nested with care, unset $TMUX to force');
        return;
      }
      this.createSession();
      this.recordAction('session-created');
      return;
    }

    const subCmd = args[0];
    switch (subCmd) {
      case 'new':
      case 'new-session': {
        const sIdx = args.indexOf('-s');
        const name = sIdx !== -1 ? args[sIdx + 1] : undefined;
        if (this.isInsideTmux) {
          const session = this.createSession(name);
          this.addSystemMessage(pane.id, `[tmux] Session "${session.name}" created`);
        } else {
          this.createSession(name);
        }
        this.recordAction('session-created');
        break;
      }
      case 'ls':
      case 'list-sessions': {
        if (this.sessions.length === 0) {
          this.addError(pane.id, 'no server running on /tmp/tmux-1000/default');
        } else {
          const lines = this.sessions.map((s) => {
            const winCount = s.windows.length;
            const attached = s.id === this.activeSessionId && this.isAttached;
            return `${s.name}: ${winCount} windows (created Mon Jan 15 10:30:00 2024)${attached ? ' (attached)' : ''}`;
          });
          this.addOutput(pane.id, lines.join('\n'));
        }
        break;
      }
      case 'attach':
      case 'attach-session':
      case 'a': {
        const tIdx = args.indexOf('-t');
        const targetName = tIdx !== -1 ? args[tIdx + 1] : undefined;
        if (targetName) {
          const session = this.sessions.find((s) => s.name === targetName);
          if (session) {
            this.activeSessionId = session.id;
            this.isAttached = true;
            this.isInsideTmux = true;
            this.restoreActivePane();
            this.addSystemMessage(pane.id, `[tmux] Attached to session "${session.name}"`);
            this.recordAction('session-attached');
          } else {
            this.addError(pane.id, `can't find session: ${targetName}`);
          }
        } else {
          if (this.sessions.length > 0) {
            const session = this.sessions[this.sessions.length - 1];
            this.activeSessionId = session.id;
            this.isAttached = true;
            this.isInsideTmux = true;
            this.restoreActivePane();
            this.addSystemMessage(pane.id, `[tmux] Attached to session "${session.name}"`);
            this.recordAction('session-attached');
          } else {
            this.addError(pane.id, 'no sessions');
          }
        }
        break;
      }
      case 'split-window': {
        const isHorizontal = args.includes('-h');
        if (isHorizontal) {
          this.splitPane('horizontal');
        } else {
          this.splitPane('vertical');
        }
        break;
      }
      case 'kill-session': {
        const tIdx = args.indexOf('-t');
        const targetName = tIdx !== -1 ? args[tIdx + 1] : undefined;
        if (targetName) {
          this.sessions = this.sessions.filter((s) => s.name !== targetName);
          if (this.sessions.length === 0) {
            this.activeSessionId = null;
            this.isAttached = false;
            this.isInsideTmux = false;
          }
          this.addSystemMessage(pane.id, `[tmux] Session "${targetName}" killed`);
        }
        break;
      }
      default:
        this.addError(pane.id, `tmux: unknown command: ${subCmd}`);
    }
  }

  splitPane(direction: 'horizontal' | 'vertical'): void {
    const window = this.getActiveWindow();
    if (!window) return;

    const activePane = this.getActivePane();
    if (!activePane) return;

    activePane.isActive = false;

    const newPane = this.createPane(activePane.cwd);
    window.panes.push(newPane);
    window.activePaneId = newPane.id;

    window.layout = this.insertIntoLayout(
      window.layout,
      activePane.id,
      newPane.id,
      direction
    );

    const action =
      direction === 'horizontal' ? 'pane-split-horizontal' : 'pane-split-vertical';
    this.recordAction(action);
    this.emit({ type: 'state-changed' });
  }

  private insertIntoLayout(
    layout: PaneLayout,
    targetPaneId: string,
    newPaneId: string,
    direction: 'horizontal' | 'vertical'
  ): PaneLayout {
    if (layout.type === 'leaf' && layout.paneId === targetPaneId) {
      return {
        type: direction,
        children: [
          { type: 'leaf', paneId: targetPaneId, size: 50 },
          { type: 'leaf', paneId: newPaneId, size: 50 },
        ],
      };
    }

    if (layout.children) {
      return {
        ...layout,
        children: layout.children.map((child) =>
          this.insertIntoLayout(child, targetPaneId, newPaneId, direction)
        ),
      };
    }

    return layout;
  }

  navigatePane(direction: 'up' | 'down' | 'left' | 'right'): void {
    const window = this.getActiveWindow();
    if (!window || window.panes.length < 2) return;

    const currentIdx = window.panes.findIndex((p) => p.id === window.activePaneId);
    let nextIdx: number;

    if (direction === 'right' || direction === 'down') {
      nextIdx = (currentIdx + 1) % window.panes.length;
    } else {
      nextIdx = (currentIdx - 1 + window.panes.length) % window.panes.length;
    }

    window.panes.forEach((p) => (p.isActive = false));
    window.panes[nextIdx].isActive = true;
    window.activePaneId = window.panes[nextIdx].id;

    this.recordAction('pane-navigated');
    this.emit({ type: 'state-changed' });
  }

  resizePane(direction: 'up' | 'down' | 'left' | 'right'): void {
    const window = this.getActiveWindow();
    if (!window) return;

    const activePane = this.getActivePane();
    if (!activePane) return;

    const step = 5;
    this.resizeInLayout(window.layout, activePane.id, direction, step);

    this.recordAction('pane-resized');
    this.emit({ type: 'state-changed' });
  }

  private resizeInLayout(
    layout: PaneLayout,
    paneId: string,
    direction: 'up' | 'down' | 'left' | 'right',
    step: number
  ): boolean {
    if (!layout.children || layout.children.length < 2) return false;

    const idx = layout.children.findIndex(
      (child) => child.type === 'leaf' && child.paneId === paneId
    );

    if (idx !== -1) {
      const isHorizontal = layout.type === 'horizontal';
      const matchesAxis =
        (isHorizontal && (direction === 'left' || direction === 'right')) ||
        (!isHorizontal && (direction === 'up' || direction === 'down'));

      if (matchesAxis) {
        const towardStart = direction === 'left' || direction === 'up';
        const sibIdx = towardStart ? idx - 1 : idx + 1;
        if (sibIdx >= 0 && sibIdx < layout.children.length) {
          const current = layout.children[idx].size || 50;
          const sibling = layout.children[sibIdx].size || 50;
          layout.children[idx].size = Math.max(10, Math.min(90, current + step));
          layout.children[sibIdx].size = Math.max(10, Math.min(90, sibling - step));
          return true;
        }
      }
    }

    for (const child of layout.children) {
      if (this.resizeInLayout(child, paneId, direction, step)) return true;
    }
    return false;
  }

  zoomPane(): void {
    const pane = this.getActivePane();
    if (!pane) return;

    if (this.zoomedPaneId === pane.id) {
      this.zoomedPaneId = null;
    } else {
      this.zoomedPaneId = pane.id;
    }

    this.recordAction('pane-zoomed');
    this.emit({ type: 'state-changed' });
  }

  closePaneById(paneId: string): void {
    const window = this.getActiveWindow();
    if (!window) return;

    const paneIdx = window.panes.findIndex((p) => p.id === paneId);
    if (paneIdx === -1) return;

    window.panes.splice(paneIdx, 1);
    window.layout = this.removeFromLayout(window.layout, paneId);

    if (this.zoomedPaneId === paneId) {
      this.zoomedPaneId = null;
    }

    if (window.panes.length === 0) {
      this.closeWindow(window.id);
    } else {
      const newActive = window.panes[Math.min(paneIdx, window.panes.length - 1)];
      window.panes.forEach((p) => (p.isActive = false));
      newActive.isActive = true;
      window.activePaneId = newActive.id;
    }

    this.emit({ type: 'state-changed' });
  }

  private removeFromLayout(layout: PaneLayout, paneId: string): PaneLayout {
    if (layout.type === 'leaf') {
      return layout;
    }

    if (!layout.children) return layout;

    const filtered = layout.children.filter(
      (child) => !(child.type === 'leaf' && child.paneId === paneId)
    );

    if (filtered.length === 1) {
      return filtered[0];
    }

    const eachSize = 100 / filtered.length;
    filtered.forEach((c) => {
      c.size = eachSize;
    });

    return {
      ...layout,
      children: filtered.map((child) => this.removeFromLayout(child, paneId)),
    };
  }

  createNewWindow(name?: string): void {
    const session = this.getActiveSession();
    if (!session) return;

    const currentWindow = this.getActiveWindow();
    if (currentWindow) {
      currentWindow.panes.forEach((p) => (p.isActive = false));
    }

    const window = this.createWindow(name || 'bash');
    session.windows.push(window);
    session.activeWindowId = window.id;

    this.zoomedPaneId = null;
    this.recordAction('window-created');
    this.emit({ type: 'state-changed' });
  }

  switchWindow(direction: 'next' | 'prev'): void {
    const session = this.getActiveSession();
    if (!session || session.windows.length < 2) return;

    const currentIdx = session.windows.findIndex(
      (w) => w.id === session.activeWindowId
    );
    let nextIdx: number;

    if (direction === 'next') {
      nextIdx = (currentIdx + 1) % session.windows.length;
    } else {
      nextIdx = (currentIdx - 1 + session.windows.length) % session.windows.length;
    }

    this.activateWindow(session, nextIdx);
    this.recordAction('window-switched');
  }

  switchWindowByNumber(num: number): void {
    const session = this.getActiveSession();
    if (!session) return;

    const window = session.windows.find((w) => w.index === num);
    if (!window) return;

    const idx = session.windows.indexOf(window);
    this.activateWindow(session, idx);
    this.recordAction('window-switched-by-number');
  }

  private activateWindow(session: TmuxSession, index: number): void {
    const oldWindow = session.windows.find(
      (w) => w.id === session.activeWindowId
    );
    if (oldWindow) {
      oldWindow.panes.forEach((p) => (p.isActive = false));
    }

    const newWindow = session.windows[index];
    session.activeWindowId = newWindow.id;

    const activePane = newWindow.panes.find(
      (p) => p.id === newWindow.activePaneId
    );
    if (activePane) {
      activePane.isActive = true;
    }

    this.zoomedPaneId = null;
    this.emit({ type: 'state-changed' });
  }

  renameWindow(name: string): void {
    const window = this.getActiveWindow();
    if (!window) return;

    window.name = name;
    this.recordAction('window-renamed');
    this.emit({ type: 'state-changed' });
  }

  closeWindow(windowId: string): void {
    const session = this.getActiveSession();
    if (!session) return;

    const idx = session.windows.findIndex((w) => w.id === windowId);
    if (idx === -1) return;

    session.windows.splice(idx, 1);
    session.windows.forEach((w, i) => (w.index = i));

    if (session.windows.length === 0) {
      this.sessions = this.sessions.filter((s) => s.id !== session.id);
      if (this.sessions.length === 0) {
        this.activeSessionId = null;
        this.isAttached = false;
        this.isInsideTmux = false;
      } else {
        this.activeSessionId = this.sessions[0].id;
      }
    } else {
      session.activeWindowId =
        session.windows[Math.min(idx, session.windows.length - 1)].id;
      const newActiveWindow = this.getActiveWindow();
      if (newActiveWindow) {
        const activePane = newActiveWindow.panes.find(
          (p) => p.id === newActiveWindow.activePaneId
        );
        if (activePane) activePane.isActive = true;
      }
    }

    this.recordAction('window-closed');
    this.emit({ type: 'state-changed' });
  }

  detachSession(): void {
    this.isAttached = false;
    this.isInsideTmux = false;
    this.mode = 'normal';
    this.prefixActive = false;
    this.zoomedPaneId = null;

    const session = this.getActiveSession();
    if (session) {
      for (const w of session.windows) {
        w.panes.forEach((p) => (p.isActive = false));
      }
    }

    this.recordAction('session-detached');
    this.emit({ type: 'state-changed' });
  }

  handleKeyEvent(e: KeyboardEvent): boolean {
    if (this.mode === 'confirm') {
      if (e.key === 'y' || e.key === 'Y') {
        this.executeConfirmAction();
      } else {
        this.mode = 'normal';
        this.confirmAction = null;
      }
      this.emit({ type: 'state-changed' });
      return true;
    }

    if (this.mode === 'command') {
      if (e.key === 'Escape') {
        this.mode = 'normal';
        this.commandInput = '';
        this.emit({ type: 'state-changed' });
        return true;
      }
      if (e.key === 'Enter') {
        this.executeTmuxCommand(this.commandInput);
        this.mode = 'normal';
        this.commandInput = '';
        this.emit({ type: 'state-changed' });
        return true;
      }
      if (e.key === 'Backspace') {
        this.commandInput = this.commandInput.slice(0, -1);
        this.emit({ type: 'state-changed' });
        return true;
      }
      if (e.key.length === 1) {
        this.commandInput += e.key;
        this.emit({ type: 'state-changed' });
        return true;
      }
      return true;
    }

    if (this.mode === 'rename') {
      if (e.key === 'Escape') {
        this.mode = 'normal';
        this.renameInput = '';
        this.emit({ type: 'state-changed' });
        return true;
      }
      if (e.key === 'Enter') {
        if (this.renameInput.trim()) {
          this.renameWindow(this.renameInput.trim());
        }
        this.mode = 'normal';
        this.renameInput = '';
        this.emit({ type: 'state-changed' });
        return true;
      }
      if (e.key === 'Backspace') {
        this.renameInput = this.renameInput.slice(0, -1);
        this.emit({ type: 'state-changed' });
        return true;
      }
      if (e.ctrlKey && e.key === 'u') {
        this.renameInput = '';
        this.emit({ type: 'state-changed' });
        return true;
      }
      if (e.key.length === 1) {
        this.renameInput += e.key;
        this.emit({ type: 'state-changed' });
        return true;
      }
      return true;
    }

    if (this.mode === 'copy') {
      if (e.key === 'q' || e.key === 'Escape') {
        this.mode = 'normal';
        this.recordAction('copy-mode-exited');
        this.emit({ type: 'mode-changed', mode: 'normal' });
        this.emit({ type: 'state-changed' });
        return true;
      }
      return true;
    }

    if (!this.prefixActive && e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      this.activatePrefix();
      return true;
    }

    if (this.prefixActive) {
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
        return true;
      }

      if (e.ctrlKey && e.key === 'b') {
        this.activatePrefix();
        return true;
      }

      this.deactivatePrefix();

      if (!this.isInsideTmux) return false;

      switch (e.key) {
        case '%':
          this.splitPane('horizontal');
          return true;
        case '"':
          this.splitPane('vertical');
          return true;
        case 'ArrowUp':
          if (e.ctrlKey) { this.resizePane('up'); this.activatePrefix(); }
          else { this.navigatePane('up'); }
          return true;
        case 'ArrowDown':
          if (e.ctrlKey) { this.resizePane('down'); this.activatePrefix(); }
          else { this.navigatePane('down'); }
          return true;
        case 'ArrowLeft':
          if (e.ctrlKey) { this.resizePane('left'); this.activatePrefix(); }
          else { this.navigatePane('left'); }
          return true;
        case 'ArrowRight':
          if (e.ctrlKey) { this.resizePane('right'); this.activatePrefix(); }
          else { this.navigatePane('right'); }
          return true;
        case 'c':
          this.createNewWindow();
          return true;
        case 'n':
          this.switchWindow('next');
          return true;
        case 'p':
          this.switchWindow('prev');
          return true;
        case ',':
          this.mode = 'rename';
          this.renameInput = this.getActiveWindow()?.name || '';
          this.recordAction('window-rename-started');
          this.emit({ type: 'state-changed' });
          return true;
        case '&':
          this.mode = 'confirm';
          this.confirmAction = 'close-window';
          this.emit({ type: 'state-changed' });
          return true;
        case 'x':
          this.mode = 'confirm';
          this.confirmAction = 'close-pane';
          this.emit({ type: 'state-changed' });
          return true;
        case 'z':
          this.zoomPane();
          return true;
        case 'd':
          this.detachSession();
          return true;
        case '[':
          this.mode = 'copy';
          this.recordAction('copy-mode-entered');
          this.emit({ type: 'mode-changed', mode: 'copy' });
          this.emit({ type: 'state-changed' });
          return true;
        case ':':
          this.mode = 'command';
          this.commandInput = '';
          this.recordAction('command-mode-entered');
          this.emit({ type: 'mode-changed', mode: 'command' });
          this.emit({ type: 'state-changed' });
          return true;
        default:
          if (e.key >= '0' && e.key <= '9') {
            this.switchWindowByNumber(parseInt(e.key));
            return true;
          }
      }

      return false;
    }

    return false;
  }

  private activatePrefix(): void {
    this.prefixActive = true;
    this.recordAction('prefix-activated');
    this.emit({ type: 'prefix-activated' });
    this.emit({ type: 'state-changed' });

    if (this.prefixTimeout) clearTimeout(this.prefixTimeout);
    this.prefixTimeout = setTimeout(() => {
      this.deactivatePrefix();
    }, 2000);
  }

  private deactivatePrefix(): void {
    this.prefixActive = false;
    if (this.prefixTimeout) {
      clearTimeout(this.prefixTimeout);
      this.prefixTimeout = null;
    }
    this.emit({ type: 'prefix-deactivated' });
    this.emit({ type: 'state-changed' });
  }

  private executeConfirmAction(): void {
    if (this.confirmAction === 'close-pane') {
      const pane = this.getActivePane();
      if (pane) {
        this.closePaneById(pane.id);
        this.recordAction('pane-closed');
      }
    } else if (this.confirmAction === 'close-window') {
      const window = this.getActiveWindow();
      if (window) {
        this.closeWindow(window.id);
      }
    }
    this.mode = 'normal';
    this.confirmAction = null;
  }

  private executeTmuxCommand(command: string): void {
    const parts = command.trim().split(/\s+/);
    const cmd = parts[0];

    switch (cmd) {
      case 'split-window':
        this.splitPane(parts.includes('-h') ? 'horizontal' : 'vertical');
        break;
      case 'new-window':
        this.createNewWindow(parts[1]);
        break;
      case 'rename-window':
        if (parts[1]) this.renameWindow(parts[1]);
        break;
      default:
        this.emit({
          type: 'notification',
          message: `Unknown command: ${cmd}`,
        });
    }
  }

  private restoreActivePane(): void {
    const window = this.getActiveWindow();
    if (!window) return;
    const pane = window.panes.find((p) => p.id === window.activePaneId);
    if (pane) pane.isActive = true;
  }

  private findPane(paneId: string): TmuxPane | null {
    for (const session of this.sessions) {
      for (const window of session.windows) {
        const pane = window.panes.find((p) => p.id === paneId);
        if (pane) return pane;
      }
    }
    return null;
  }

  private addOutput(paneId: string, content: string): void {
    const pane = this.findPane(paneId);
    if (!pane) return;
    pane.shellHistory.push({ type: 'output', content });
  }

  private addError(paneId: string, content: string): void {
    const pane = this.findPane(paneId);
    if (!pane) return;
    pane.shellHistory.push({ type: 'error', content });
  }

  private addSystemMessage(paneId: string, content: string): void {
    const pane = this.findPane(paneId);
    if (!pane) return;
    pane.shellHistory.push({ type: 'system', content });
  }

  private shortenPath(path: string): string {
    if (path === '/home/user') return '~';
    if (path.startsWith('/home/user/')) return '~/' + path.slice('/home/user/'.length);
    return path;
  }

  handlePaneInput(paneId: string, char: string): void {
    const pane = this.findPane(paneId);
    if (!pane) return;
    pane.currentInput += char;
    this.emit({ type: 'state-changed' });
  }

  handlePaneKeyDown(paneId: string, e: React.KeyboardEvent): void {
    const nativeEvent = e.nativeEvent;
    if (this.handleKeyEvent(nativeEvent)) {
      e.preventDefault();
      return;
    }

    const pane = this.findPane(paneId);
    if (!pane) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const command = pane.currentInput;
      pane.currentInput = '';
      this.executeCommand(paneId, command);
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      pane.currentInput = pane.currentInput.slice(0, -1);
      this.emit({ type: 'state-changed' });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      this.tabComplete(pane);
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      pane.currentInput = '';
      const prompt = `user@tmux-learn:${this.shortenPath(pane.cwd)}$ `;
      pane.shellHistory.push({ type: 'input', content: '^C', prompt });
      this.emit({ type: 'state-changed' });
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      pane.shellHistory = [];
      this.emit({ type: 'state-changed' });
    } else if (e.ctrlKey && e.key === 'u') {
      e.preventDefault();
      pane.currentInput = '';
      this.emit({ type: 'state-changed' });
    }
  }

  private tabComplete(pane: TmuxPane): void {
    const parts = pane.currentInput.split(/\s+/);
    const last = parts[parts.length - 1] || '';
    const dir = last.includes('/') ? last.substring(0, last.lastIndexOf('/') + 1) : '';
    const prefix = last.includes('/') ? last.substring(last.lastIndexOf('/') + 1) : last;

    const targetDir = dir ? normalizePath(pane.cwd, dir) : pane.cwd;
    const node = resolvePath(this.fs, targetDir);

    if (!node || node.type !== 'dir' || !node.children) return;

    const matches = Object.keys(node.children).filter((name) =>
      name.startsWith(prefix)
    );

    if (matches.length === 1) {
      const match = matches[0];
      const isDir = node.children[match].type === 'dir';
      parts[parts.length - 1] = dir + match + (isDir ? '/' : '');
      pane.currentInput = parts.join(' ');
      this.emit({ type: 'state-changed' });
    } else if (matches.length > 1) {
      this.addOutput(pane.id, matches.join('  '));
      this.emit({ type: 'state-changed' });
    }
  }

  focusPane(paneId: string): void {
    const window = this.getActiveWindow();
    if (!window) return;

    const pane = window.panes.find((p) => p.id === paneId);
    if (!pane) return;

    window.panes.forEach((p) => (p.isActive = false));
    pane.isActive = true;
    window.activePaneId = paneId;

    this.emit({ type: 'state-changed' });
  }
}
