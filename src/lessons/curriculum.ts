export interface Lesson {
  id: string;
  title: string;
  description: string;
  objective: string;
  hints: string[];
  keysToShow?: KeyCombo[];
  validation: ValidationRule;
  congratsMessage: string;
}

export interface KeyCombo {
  keys: string[];
  label: string;
  isSequential?: boolean;
}

export interface ValidationRule {
  type: 'action' | 'state' | 'command';
  action?: string;
  stateCheck?: {
    path: string;
    condition: 'equals' | 'greaterThan' | 'includes' | 'exists';
    value?: any;
  };
  command?: string;
}

export interface Chapter {
  id: string;
  title: string;
  icon: string;
  description: string;
  lessons: Lesson[];
}

export type Curriculum = Chapter[];

export const curriculum: Curriculum = [
  // ─── Chapter 1: Welcome to tmux ───────────────────────────────────
  {
    id: 'welcome',
    title: 'Welcome to tmux',
    icon: '🚀',
    description: 'Get introduced to tmux and learn the fundamental concepts that make it indispensable for terminal power users.',
    lessons: [
      {
        id: 'what-is-tmux',
        title: 'What is tmux?',
        description:
          'tmux is a terminal multiplexer — it lets you run multiple terminal sessions inside a single window. You can split your screen into panes, create tabs (called windows), and even detach from a session and come back later with everything still running. It is a must-have tool for remote work, long-running processes, and anyone who lives in the terminal.',
        objective: 'Read the introduction above, then press Enter to continue.',
        hints: [
          'Just press the Enter key to move on.',
          'Hit Enter — no other input is needed for this step.',
          'Press the Enter/Return key on your keyboard.',
        ],
        validation: { type: 'action', action: 'enter-pressed' },
        congratsMessage:
          'Great start! Now you know what tmux is — a terminal multiplexer that gives you superpowers in the terminal.',
      },
      {
        id: 'first-session',
        title: 'Your First Session',
        description:
          'Everything in tmux starts with a session. When you type `tmux`, a new session is created and you are attached to it. You will see a green status bar appear at the bottom of the screen — that is how you know you are inside tmux.',
        objective: 'Type `tmux` and press Enter to start a new session.',
        hints: [
          'Type the word tmux into the terminal.',
          'Type `tmux` and hit Enter — this launches a brand-new tmux session.',
          'Make sure you type exactly: tmux',
        ],
        validation: { type: 'command', command: 'tmux' },
        congratsMessage:
          'You just created your first tmux session! Notice the status bar at the bottom — that is tmux in action.',
      },
      {
        id: 'prefix-key',
        title: 'The Prefix Key',
        description:
          'tmux uses a special key combination called the prefix to avoid conflicts with other programs. The default prefix is Ctrl+b. You press Ctrl+b first, release it, and then press another key to tell tmux what to do. Think of it as saying "Hey tmux, the next key is for you."',
        objective: 'Press Ctrl+b to activate the prefix.',
        hints: [
          'Hold Ctrl and press b at the same time.',
          'Press Ctrl+b and then release both keys. This activates the tmux prefix.',
          'The prefix is Ctrl+b — hold the Control key, tap b, then release.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b'], label: 'Prefix key', isSequential: false },
        ],
        validation: { type: 'action', action: 'prefix-activated' },
        congratsMessage:
          'You activated the prefix key! Every tmux shortcut begins with Ctrl+b. This is the foundation of all tmux commands.',
      },
      {
        id: 'command-line',
        title: 'The Command Line',
        description:
          'tmux has its own built-in command prompt, similar to the one in vim. You can open it by pressing Ctrl+b then : (colon). From here you can type any tmux command directly, like `split-window` or `new-window`. It is a powerful way to control tmux beyond just keyboard shortcuts.',
        objective: 'Press Ctrl+b then : to open the tmux command prompt.',
        hints: [
          'First press Ctrl+b (the prefix), then press the colon key (:).',
          'Remember: prefix first (Ctrl+b), release, then press : to open the command prompt.',
          'Ctrl+b followed by Shift+; (which types a colon) opens the tmux command line.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', ':'], label: 'Open command prompt', isSequential: true },
        ],
        validation: { type: 'action', action: 'command-mode-entered' },
        congratsMessage:
          'You opened the tmux command prompt! You can type tmux commands here directly. Press Escape to close it for now.',
      },
    ],
  },

  // ─── Chapter 2: Panes — Split Your World ──────────────────────────
  {
    id: 'panes',
    title: 'Panes — Split Your World',
    icon: '🪟',
    description: 'Learn to split your terminal into multiple panes so you can see and work on several things at once.',
    lessons: [
      {
        id: 'split-vertically',
        title: 'Split Vertically',
        description:
          'Panes let you divide a single window into multiple sections. Pressing Ctrl+b then % splits the current pane vertically — you get two panes side by side. This is perfect for editing code on one side and running it on the other.',
        objective: 'Press Ctrl+b then % to split the pane vertically (side by side).',
        hints: [
          'Press Ctrl+b first, then press % (Shift+5 on most keyboards).',
          'The prefix is Ctrl+b, then the percent sign % creates a vertical split.',
          'Ctrl+b, release, then Shift+5 to type %. You should see two panes appear side by side.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', '%'], label: 'Split vertically', isSequential: true },
        ],
        validation: { type: 'action', action: 'pane-split-horizontal' },
        congratsMessage:
          'Nice split! You now have two panes side by side. In tmux, % creates a vertical divider (which tmux internally calls a "horizontal" split).',
      },
      {
        id: 'split-horizontally',
        title: 'Split Horizontally',
        description:
          'You can also split panes horizontally — one on top, one on the bottom. Press Ctrl+b then " (double quote) to split the current pane into a top and bottom half. Combine vertical and horizontal splits to build any layout you want.',
        objective: 'Press Ctrl+b then " to split the pane horizontally (top/bottom).',
        hints: [
          'Press Ctrl+b first, then press " (Shift+\' on most keyboards).',
          'The prefix is Ctrl+b, then the double-quote key " creates a horizontal split.',
          'Ctrl+b, release, then Shift+\' to type ". You should see a pane appear above or below.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', '"'], label: 'Split horizontally', isSequential: true },
        ],
        validation: { type: 'action', action: 'pane-split-vertical' },
        congratsMessage:
          'You split horizontally! You can now arrange panes in any combination of side-by-side and stacked layouts.',
      },
      {
        id: 'navigate-panes',
        title: 'Navigate Between Panes',
        description:
          'With multiple panes open, you need a way to jump between them. Press Ctrl+b followed by an arrow key to move focus to the pane in that direction. The active pane is highlighted with a green border.',
        objective: 'Press Ctrl+b then an arrow key to move to another pane.',
        hints: [
          'Press Ctrl+b, then press any arrow key (Up, Down, Left, or Right).',
          'First the prefix (Ctrl+b), then an arrow key pointing toward the pane you want.',
          'Try Ctrl+b then the Right arrow if you have a pane to the right.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', '←↑↓→'], label: 'Navigate panes', isSequential: true },
        ],
        validation: { type: 'action', action: 'pane-navigated' },
        congratsMessage:
          'You moved between panes! Use this constantly to jump around your workspace.',
      },
      {
        id: 'resize-pane',
        title: 'Resize a Pane',
        description:
          'Panes do not have to be equal sizes. Press Ctrl+b then hold Ctrl and press an arrow key to resize the active pane in that direction. This lets you give more space to whichever task needs it.',
        objective: 'Press Ctrl+b then Ctrl+arrow to resize a pane.',
        hints: [
          'Press Ctrl+b (prefix), then hold Ctrl and press an arrow key.',
          'After the prefix, keep Ctrl held and tap an arrow key to grow or shrink the pane.',
          'Try Ctrl+b, then Ctrl+Right to make the current pane wider.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', 'Ctrl+←↑↓→'], label: 'Resize pane', isSequential: true },
        ],
        validation: { type: 'action', action: 'pane-resized' },
        congratsMessage:
          'Pane resized! You can fine-tune your layout by resizing any pane to fit your workflow.',
      },
      {
        id: 'zoom-pane',
        title: 'Zoom a Pane',
        description:
          'Sometimes you need to focus on just one pane. Press Ctrl+b then z to zoom the current pane to fill the entire window. Press the same combo again to restore the original layout. The other panes are still there, just hidden.',
        objective: 'Press Ctrl+b then z to toggle zoom on the active pane.',
        hints: [
          'Press Ctrl+b, then press z.',
          'The prefix (Ctrl+b) followed by z toggles zoom. Try it!',
          'Ctrl+b then z — the pane will expand to fill the window. Press it again to unzoom.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', 'z'], label: 'Zoom pane', isSequential: true },
        ],
        validation: { type: 'action', action: 'pane-zoomed' },
        congratsMessage:
          'Zoomed! This is incredibly handy when you need to focus on one thing without losing your layout.',
      },
      {
        id: 'close-pane',
        title: 'Close a Pane',
        description:
          'When you are done with a pane, you can close it. Press Ctrl+b then x to close the active pane (tmux will ask for confirmation). Alternatively, you can type `exit` in the pane. When the last pane in a window closes, the window closes too.',
        objective: 'Press Ctrl+b then x to close the current pane.',
        hints: [
          'Press Ctrl+b, then press x.',
          'After pressing Ctrl+b then x, tmux will ask you to confirm — press y to confirm.',
          'Ctrl+b then x closes the pane. You can also type `exit` and press Enter.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', 'x'], label: 'Close pane', isSequential: true },
        ],
        validation: { type: 'action', action: 'pane-closed' },
        congratsMessage:
          'Pane closed! You have mastered the full pane lifecycle — create, navigate, resize, zoom, and close.',
      },
    ],
  },

  // ─── Chapter 3: Windows — Multiple Workspaces ─────────────────────
  {
    id: 'windows',
    title: 'Windows — Multiple Workspaces',
    icon: '📑',
    description: 'Learn to use windows as tabs inside tmux to organize different tasks within a single session.',
    lessons: [
      {
        id: 'create-window',
        title: 'Create a Window',
        description:
          'Windows in tmux are like tabs in a browser. Each window has its own set of panes and runs independently. Press Ctrl+b then c to create a new window. You will see it appear in the status bar at the bottom.',
        objective: 'Press Ctrl+b then c to create a new window.',
        hints: [
          'Press Ctrl+b (prefix), then press c.',
          'c stands for "create." Press the prefix first, then c.',
          'Ctrl+b then c — look at the status bar to see your new window.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', 'c'], label: 'Create window', isSequential: true },
        ],
        validation: { type: 'action', action: 'window-created' },
        congratsMessage:
          'New window created! Check the status bar — you can see all your windows listed there.',
      },
      {
        id: 'switch-windows',
        title: 'Switch Windows',
        description:
          'You can cycle through windows using Ctrl+b then n (next) or Ctrl+b then p (previous). This is the quickest way to move between windows when you have a few open.',
        objective: 'Press Ctrl+b then n or p to switch to the next or previous window.',
        hints: [
          'Press Ctrl+b, then press n to go to the next window.',
          'You can also press Ctrl+b then p to go to the previous window.',
          'Ctrl+b then n moves forward, Ctrl+b then p moves backward through windows.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', 'n'], label: 'Next window', isSequential: true },
          { keys: ['Ctrl', 'b', 'p'], label: 'Previous window', isSequential: true },
        ],
        validation: { type: 'action', action: 'window-switched' },
        congratsMessage:
          'You switched windows! Use n and p to quickly cycle through your workspaces.',
      },
      {
        id: 'window-by-number',
        title: 'Window by Number',
        description:
          'Each window has a number shown in the status bar (starting from 0). Press Ctrl+b then the number to jump directly to that window. This is faster than cycling when you have many windows open.',
        objective: 'Press Ctrl+b then a number (0-9) to jump to a specific window.',
        hints: [
          'Press Ctrl+b, then press a number like 0 or 1.',
          'Look at the status bar to see which numbers are assigned to your windows.',
          'Ctrl+b then 0 goes to the first window, Ctrl+b then 1 goes to the second, and so on.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', '0-9'], label: 'Go to window #', isSequential: true },
        ],
        validation: { type: 'action', action: 'window-switched-by-number' },
        congratsMessage:
          'Direct jump! Switching by number is the fastest way to navigate when you know where you are going.',
      },
      {
        id: 'rename-window',
        title: 'Rename a Window',
        description:
          'By default, tmux names windows after the running program. You can rename a window to something meaningful by pressing Ctrl+b then , (comma). A prompt will appear at the bottom where you can type the new name.',
        objective: 'Press Ctrl+b then , to rename the current window.',
        hints: [
          'Press Ctrl+b, then press the comma key (,).',
          'After pressing Ctrl+b then , you will see a rename prompt. Type a name and hit Enter.',
          'Ctrl+b then , — clear the current name with Ctrl+u, type your new name, then Enter.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', ','], label: 'Rename window', isSequential: true },
        ],
        validation: { type: 'action', action: 'window-renamed' },
        congratsMessage:
          'Window renamed! Giving windows meaningful names makes it much easier to stay organized.',
      },
      {
        id: 'close-window',
        title: 'Close a Window',
        description:
          'To close a window, you can press Ctrl+b then & which will ask for confirmation before closing the window and all its panes. You can also close all panes in the window individually, which closes the window automatically.',
        objective: 'Press Ctrl+b then & to close the current window.',
        hints: [
          'Press Ctrl+b, then press & (Shift+7 on most keyboards).',
          'After pressing Ctrl+b then &, tmux asks for confirmation. Press y to confirm.',
          'Ctrl+b then & — confirm with y. The window and all its panes will close.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', '&'], label: 'Close window', isSequential: true },
        ],
        validation: { type: 'action', action: 'window-closed' },
        congratsMessage:
          'Window closed! You now know how to fully manage windows — create, switch, rename, and close them.',
      },
    ],
  },

  // ─── Chapter 4: Sessions — The Big Picture ────────────────────────
  {
    id: 'sessions',
    title: 'Sessions — The Big Picture',
    icon: '🗂️',
    description: 'Learn to manage sessions — the top-level containers that let you organize entire projects and persist your work.',
    lessons: [
      {
        id: 'detach-session',
        title: 'Detach from Session',
        description:
          'The killer feature of tmux: detaching. Press Ctrl+b then d to detach from the current session. The session keeps running in the background with all your windows and panes intact. You can come back to it later, even from a different computer over SSH.',
        objective: 'Press Ctrl+b then d to detach from the session.',
        hints: [
          'Press Ctrl+b (prefix), then press d.',
          'd stands for "detach." The session keeps running in the background.',
          'Ctrl+b then d — you will be dropped back to the regular terminal. The session is still alive.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', 'd'], label: 'Detach session', isSequential: true },
        ],
        validation: { type: 'action', action: 'session-detached' },
        congratsMessage:
          'You detached! The session is still running in the background. This is what makes tmux essential for remote work.',
      },
      {
        id: 'list-sessions',
        title: 'List Sessions',
        description:
          'After detaching, how do you know what sessions are running? Type `tmux ls` to list all active sessions. You will see the session name, number of windows, and when it was created.',
        objective: 'Type `tmux ls` to list all active sessions.',
        hints: [
          'Type tmux ls in the terminal and press Enter.',
          'ls is short for "list-sessions." It shows all running tmux sessions.',
          'Type exactly: tmux ls',
        ],
        validation: { type: 'command', command: 'tmux ls' },
        congratsMessage:
          'Now you can see all running sessions! Each one persists until you explicitly kill it or the server restarts.',
      },
      {
        id: 'named-session',
        title: 'Create Named Session',
        description:
          'Instead of letting tmux auto-number sessions, you can give them meaningful names. Type `tmux new -s work` to create a session named "work." Named sessions make it easy to organize different projects.',
        objective: 'Type `tmux new -s work` to create a named session.',
        hints: [
          'Type tmux new -s followed by a name, like "work."',
          'The -s flag sets the session name. Try: tmux new -s work',
          'Type exactly: tmux new -s work',
        ],
        validation: { type: 'command', command: 'tmux new -s' },
        congratsMessage:
          'Named session created! Use descriptive names like "work," "server," or "monitoring" to keep things organized.',
      },
      {
        id: 'attach-session',
        title: 'Attach to Session',
        description:
          'To reconnect to a detached session, use `tmux attach -t session-name` (or `tmux a -t session-name` for short). This drops you right back where you left off with everything intact.',
        objective: 'Type `tmux attach -t` followed by a session name to reattach.',
        hints: [
          'Type tmux attach -t followed by the session name you want to rejoin.',
          'The -t flag targets a specific session. Try: tmux attach -t work',
          'Type: tmux attach -t work (or whatever session name you used).',
        ],
        validation: { type: 'command', command: 'tmux attach' },
        congratsMessage:
          'You reattached to a session! The detach/attach workflow is the heart of tmux — your sessions survive disconnects, reboots, and more.',
      },
    ],
  },

  // ─── Chapter 5: Copy Mode — Scrollback & Search ───────────────────
  {
    id: 'copy-mode',
    title: 'Copy Mode — Scrollback & Search',
    icon: '📋',
    description: 'Learn to scroll through terminal output and search for text using tmux copy mode.',
    lessons: [
      {
        id: 'enter-copy-mode',
        title: 'Enter Copy Mode',
        description:
          'By default, you cannot scroll up in tmux like a normal terminal. To view previous output, press Ctrl+b then [ to enter copy mode. In copy mode you can scroll with arrow keys or Page Up/Down, and even search with / (forward) or ? (backward).',
        objective: 'Press Ctrl+b then [ to enter copy mode.',
        hints: [
          'Press Ctrl+b (prefix), then press [ (left square bracket).',
          'The [ key enters copy mode. You will see a position indicator in the top right.',
          'Ctrl+b then [ — once in copy mode, try using the arrow keys to scroll.',
        ],
        keysToShow: [
          { keys: ['Ctrl', 'b', '['], label: 'Enter copy mode', isSequential: true },
        ],
        validation: { type: 'action', action: 'copy-mode-entered' },
        congratsMessage:
          'You are in copy mode! You can now scroll through your terminal history. Use arrow keys or Page Up/Down to navigate.',
      },
      {
        id: 'exit-copy-mode',
        title: 'Exit Copy Mode',
        description:
          'When you are done looking through the scrollback, press q or Escape to leave copy mode and return to your normal terminal. Copy mode is read-only, so nothing you do there affects your running programs.',
        objective: 'Press q or Escape to exit copy mode.',
        hints: [
          'Press the q key to quit copy mode.',
          'You can also press Escape to exit copy mode.',
          'Either q or Escape will bring you back to the normal terminal.',
        ],
        keysToShow: [
          { keys: ['q'], label: 'Exit copy mode', isSequential: false },
          { keys: ['Esc'], label: 'Exit copy mode', isSequential: false },
        ],
        validation: { type: 'action', action: 'copy-mode-exited' },
        congratsMessage:
          'You exited copy mode! Now you know how to browse your terminal history whenever you need to.',
      },
    ],
  },

  // ─── Chapter 6: Pro Tips & Customization ──────────────────────────
  {
    id: 'pro-tips',
    title: 'Pro Tips & Customization',
    icon: '⚙️',
    description: 'Discover how to customize tmux and make it truly your own with configuration files and advanced tips.',
    lessons: [
      {
        id: 'tmux-conf',
        title: 'The .tmux.conf File',
        description:
          'tmux is highly customizable through the ~/.tmux.conf file. Common tweaks include changing the prefix key, enabling mouse support (`set -g mouse on`), setting a larger scroll buffer, and rebinding split keys to something more intuitive like | and -. Changes take effect when you reload with `tmux source ~/.tmux.conf`.',
        objective: 'Run `cat ~/.tmux.conf` to view the tmux configuration file.',
        hints: [
          'Type cat ~/.tmux.conf and press Enter.',
          'This command displays the contents of the tmux config file.',
          'Type exactly: cat ~/.tmux.conf',
        ],
        validation: { type: 'command', command: 'cat ~/.tmux.conf' },
        congratsMessage:
          'Now you know where tmux keeps its configuration! Edit ~/.tmux.conf to customize key bindings, colors, behavior, and more.',
      },
      {
        id: 'congratulations',
        title: 'Congratulations!',
        description:
          'You have completed the tmux interactive tutorial! You now know how to create and manage sessions, split your terminal into panes, organize work with windows, scroll through history with copy mode, and customize tmux to fit your workflow. tmux is a tool you will use every single day — the more you practice, the more natural it becomes.',
        objective: 'Press Enter to finish the tutorial.',
        hints: [
          'Just press Enter to wrap things up!',
          'Press the Enter key to complete the course.',
          'Hit Enter — you have earned it!',
        ],
        validation: { type: 'action', action: 'enter-pressed' },
        congratsMessage:
          'You did it! You are now a tmux user. Go forth and multiplex! Remember: Ctrl+b is your best friend.',
      },
    ],
  },
];

// ─── Helper Functions ─────────────────────────────────────────────────

const allLessons: Lesson[] = curriculum.flatMap((chapter) => chapter.lessons);

export function getLessonById(id: string): Lesson | undefined {
  return allLessons.find((lesson) => lesson.id === id);
}

export function getNextLesson(currentId: string): Lesson | undefined {
  const index = allLessons.findIndex((lesson) => lesson.id === currentId);
  if (index === -1 || index === allLessons.length - 1) return undefined;
  return allLessons[index + 1];
}

export function getChapterForLesson(lessonId: string): Chapter | undefined {
  return curriculum.find((chapter) =>
    chapter.lessons.some((lesson) => lesson.id === lessonId)
  );
}

export function getTotalLessons(): number {
  return allLessons.length;
}

export function getLessonIndex(lessonId: string): number {
  return allLessons.findIndex((lesson) => lesson.id === lessonId);
}
