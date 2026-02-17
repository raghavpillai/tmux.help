import type { TmuxState } from '../engine/tmux-engine';
import type { ValidationRule } from '../lessons/curriculum';

export interface ChallengeTask {
  instruction: string;
  hint: string;
  validation: ValidationRule;
  canAttempt: (state: TmuxState) => boolean;
}

const inTmux = (s: TmuxState) => s.isInsideTmux && s.isAttached;
const notInTmux = (s: TmuxState) => !s.isInsideTmux || !s.isAttached;
const hasMultiplePanes = (s: TmuxState) => {
  if (!inTmux(s)) return false;
  const session = s.sessions.find((ses) => ses.id === s.activeSessionId);
  if (!session) return false;
  const win = session.windows.find((w) => w.id === session.activeWindowId);
  return win ? win.panes.length >= 2 : false;
};
const hasMultipleWindows = (s: TmuxState) => {
  if (!inTmux(s)) return false;
  const session = s.sessions.find((ses) => ses.id === s.activeSessionId);
  return session ? session.windows.length >= 2 : false;
};
const hasSessions = (s: TmuxState) => s.sessions.length > 0;
const inCopyMode = (s: TmuxState) => inTmux(s) && s.mode === 'copy';
const inNormalMode = (s: TmuxState) => inTmux(s) && s.mode === 'normal';

export const taskPool: ChallengeTask[] = [
  {
    instruction: 'Start a tmux session',
    hint: 'Type `tmux` and press Enter.',
    validation: { type: 'command', command: 'tmux' },
    canAttempt: notInTmux,
  },
  {
    instruction: 'Create a named session',
    hint: 'Type `tmux new -s myname` and press Enter.',
    validation: { type: 'command', command: 'tmux new -s' },
    canAttempt: notInTmux,
  },
  {
    instruction: 'List all sessions',
    hint: 'Type `tmux ls` and press Enter.',
    validation: { type: 'command', command: 'tmux ls' },
    canAttempt: (s) => notInTmux(s) && hasSessions(s),
  },
  {
    instruction: 'Attach to a session',
    hint: 'Type `tmux attach` or `tmux a -t name`.',
    validation: { type: 'command', command: 'tmux attach' },
    canAttempt: (s) => notInTmux(s) && hasSessions(s),
  },
  {
    instruction: 'Split the pane vertically',
    hint: 'Press Ctrl+b then %.',
    validation: { type: 'action', action: 'pane-split-horizontal' },
    canAttempt: inNormalMode,
  },
  {
    instruction: 'Split the pane horizontally',
    hint: 'Press Ctrl+b then ".',
    validation: { type: 'action', action: 'pane-split-vertical' },
    canAttempt: inNormalMode,
  },
  {
    instruction: 'Navigate to another pane',
    hint: 'Press Ctrl+b then an arrow key.',
    validation: { type: 'action', action: 'pane-navigated' },
    canAttempt: (s) => inNormalMode(s) && hasMultiplePanes(s),
  },
  {
    instruction: 'Resize a pane',
    hint: 'Press Ctrl+b then Ctrl+arrow.',
    validation: { type: 'action', action: 'pane-resized' },
    canAttempt: (s) => inNormalMode(s) && hasMultiplePanes(s),
  },
  {
    instruction: 'Zoom the current pane',
    hint: 'Press Ctrl+b then z.',
    validation: { type: 'action', action: 'pane-zoomed' },
    canAttempt: inNormalMode,
  },
  {
    instruction: 'Close a pane',
    hint: 'Press Ctrl+b then x, confirm with y.',
    validation: { type: 'action', action: 'pane-closed' },
    canAttempt: (s) => inNormalMode(s) && hasMultiplePanes(s),
  },
  {
    instruction: 'Create a new window',
    hint: 'Press Ctrl+b then c.',
    validation: { type: 'action', action: 'window-created' },
    canAttempt: inNormalMode,
  },
  {
    instruction: 'Switch to the next window',
    hint: 'Press Ctrl+b then n.',
    validation: { type: 'action', action: 'window-switched' },
    canAttempt: (s) => inNormalMode(s) && hasMultipleWindows(s),
  },
  {
    instruction: 'Switch to a window by number',
    hint: 'Press Ctrl+b then 0, 1, 2, etc.',
    validation: { type: 'action', action: 'window-switched-by-number' },
    canAttempt: (s) => inNormalMode(s) && hasMultipleWindows(s),
  },
  {
    instruction: 'Rename the current window',
    hint: 'Press Ctrl+b then , — type a name, press Enter.',
    validation: { type: 'action', action: 'window-renamed' },
    canAttempt: inNormalMode,
  },
  {
    instruction: 'Detach from the session',
    hint: 'Press Ctrl+b then d.',
    validation: { type: 'action', action: 'session-detached' },
    canAttempt: inNormalMode,
  },
  {
    instruction: 'Enter copy mode',
    hint: 'Press Ctrl+b then [.',
    validation: { type: 'action', action: 'copy-mode-entered' },
    canAttempt: inNormalMode,
  },
  {
    instruction: 'Exit copy mode',
    hint: 'Press q or Escape.',
    validation: { type: 'action', action: 'copy-mode-exited' },
    canAttempt: inCopyMode,
  },
  {
    instruction: 'Open the tmux command prompt',
    hint: 'Press Ctrl+b then :.',
    validation: { type: 'action', action: 'command-mode-entered' },
    canAttempt: inNormalMode,
  },
];

export function pickRandomTask(state: TmuxState, lastTaskIndex: number | null): number | null {
  const candidates = taskPool
    .map((task, i) => ({ task, i }))
    .filter(({ task, i }) => task.canAttempt(state) && i !== lastTaskIndex);

  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].i;
}
