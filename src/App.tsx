import { useState, useEffect, useRef, useCallback } from 'react';
import { TmuxEngine } from './engine/tmux-engine';
import type { TmuxEvent } from './engine/tmux-engine';
import { TerminalTitleBar } from './components/terminal-title-bar';
import { TmuxStatusBar } from './components/tmux-status-bar';
import { PaneContainer } from './components/pane-container';
import { Sidebar } from './components/sidebar';
import { Toast } from './components/toast';
import {
  curriculum,
  getLessonById,
  getNextLesson,
} from './lessons/curriculum';
import { taskPool, pickRandomTask } from './challenges/challenges';

export type AppMode = 'learn' | 'challenge';

function App() {
  const engineRef = useRef<TmuxEngine | null>(null);
  const [, forceUpdate] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState(curriculum[0].lessons[0].id);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [hintIndex, setHintIndex] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [detachedMessage, setDetachedMessage] = useState<string | null>(null);
  const completedRef = useRef(completedLessons);
  completedRef.current = completedLessons;
  const currentLessonRef = useRef(currentLessonId);
  currentLessonRef.current = currentLessonId;

  // ─── Challenge mode state ──────────────────────────────────────────
  const [mode, setMode] = useState<AppMode>('learn');
  const [currentTaskIndex, setCurrentTaskIndex] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);

  const modeRef = useRef(mode);
  modeRef.current = mode;
  const currentTaskIndexRef = useRef(currentTaskIndex);
  currentTaskIndexRef.current = currentTaskIndex;

  if (!engineRef.current) {
    engineRef.current = new TmuxEngine();
  }

  const engine = engineRef.current;

  // ─── Challenge: pick next task ─────────────────────────────────────

  const pickNext = useCallback(() => {
    const state = engine.getState();
    const next = pickRandomTask(state, currentTaskIndexRef.current);
    setCurrentTaskIndex(next);
  }, [engine]);

  const completeTask = useCallback(() => {
    setStreak((s) => s + 1);
    setToast({ message: 'Done!', type: 'success' });
    // Pick next after a short delay so the engine state settles
    setTimeout(() => pickNext(), 300);
  }, [pickNext]);

  // ─── Lesson completion ─────────────────────────────────────────────

  const completeLesson = useCallback(
    (lessonId: string, message: string) => {
      if (completedRef.current.has(lessonId)) return;

      setCompletedLessons((prev) => {
        const next = new Set(prev);
        next.add(lessonId);
        return next;
      });

      setToast({ message, type: 'success' });
      setHintIndex(0);

      setTimeout(() => {
        const next = getNextLesson(lessonId);
        if (next) {
          setCurrentLessonId(next.id);
        }
      }, 1500);
    },
    []
  );

  // ─── Event handler (learn + challenge) ─────────────────────────────

  useEffect(() => {
    const handler = (event: TmuxEvent) => {
      forceUpdate((n) => n + 1);

      // ─── Challenge: re-pick if we have no task ─────────────
      if (modeRef.current === 'challenge' && currentTaskIndexRef.current === null) {
        const state = engine.getState();
        const idx = pickRandomTask(state, null);
        if (idx !== null) {
          setCurrentTaskIndex(idx);
        }
        return;
      }

      // ─── Challenge validation ──────────────────────────────
      if (modeRef.current === 'challenge' && currentTaskIndexRef.current !== null) {
        const task = taskPool[currentTaskIndexRef.current];
        if (!task) return;

        if (event.type === 'action-performed' && task.validation.type === 'action') {
          if (task.validation.action === event.action) {
            completeTask();
          }
          return;
        }

        if (event.type === 'state-changed' && task.validation.type === 'command' && task.validation.command) {
          const cmd = task.validation.command;
          const state = engine.getState();
          for (const session of state.sessions) {
            for (const window of session.windows) {
              for (const pane of window.panes) {
                for (const line of pane.shellHistory) {
                  if (line.type === 'input' && line.content.trim().includes(cmd)) {
                    completeTask();
                    return;
                  }
                }
              }
            }
          }
          for (const typed of engine.getTypedCommands()) {
            if (typed.includes(cmd)) {
              completeTask();
              return;
            }
          }
        }
        return;
      }

      // ─── Learn validation ──────────────────────────────────
      if (event.type === 'action-performed') {
        let lesson = getLessonById(currentLessonRef.current);
        if (!lesson) return;

        while (lesson && completedRef.current.has(lesson.id)) {
          const next = getNextLesson(lesson.id);
          if (!next) return;
          lesson = next;
        }

        const { validation } = lesson;
        if (validation.type === 'action' && validation.action === event.action) {
          completeLesson(lesson.id, lesson.congratsMessage);
        }
      }

      if (event.type === 'state-changed') {
        let lesson = getLessonById(currentLessonRef.current);
        if (!lesson) return;

        while (lesson && completedRef.current.has(lesson.id)) {
          const next = getNextLesson(lesson.id);
          if (!next) return;
          lesson = next;
        }

        const { validation } = lesson;
        if (validation.type !== 'command' || !validation.command) return;

        const state = engine.getState();
        for (const session of state.sessions) {
          for (const window of session.windows) {
            for (const pane of window.panes) {
              for (const line of pane.shellHistory) {
                if (line.type === 'input' && line.content.trim().includes(validation.command!)) {
                  completeLesson(lesson.id, lesson.congratsMessage);
                  return;
                }
              }
            }
          }
        }

        for (const cmd of engine.getTypedCommands()) {
          if (cmd.includes(validation.command!)) {
            completeLesson(lesson.id, lesson.congratsMessage);
            return;
          }
        }
      }
    };

    engine.on('all', handler);
    return () => engine.off('all', handler);
  }, [engine, completeLesson, completeTask]);

  const handleLessonSelect = useCallback((lessonId: string) => {
    setCurrentLessonId(lessonId);
    setHintIndex(0);
  }, []);

  const handleRequestHint = useCallback(() => {
    setHintIndex((prev) => prev + 1);
  }, []);

  const handleInput = useCallback(
    (paneId: string, char: string) => {
      engine.handlePaneInput(paneId, char);
    },
    [engine]
  );

  const handleKeyDown = useCallback(
    (paneId: string, e: React.KeyboardEvent) => {
      engine.handlePaneKeyDown(paneId, e);

      const state = engine.getState();
      if (!state.isAttached && state.sessions.length > 0) {
        setDetachedMessage(`[detached (from session ${engine.getActiveSession()?.name || '0'})]`);
      }
    },
    [engine]
  );

  const handleFocus = useCallback(
    (paneId: string) => {
      engine.focusPane(paneId);
    },
    [engine]
  );

  const handleModeSwitch = useCallback((newMode: AppMode) => {
    setMode(newMode);
    if (newMode === 'challenge') {
      // Pick first task based on current state
      const state = engine.getState();
      const idx = pickRandomTask(state, null);
      setCurrentTaskIndex(idx);
      setStreak(0);
    } else {
      setCurrentTaskIndex(null);
    }
  }, [engine]);

  const handleSkipTask = useCallback(() => {
    setStreak(0);
    pickNext();
  }, [pickNext]);

  const state = engine.getState();
  const activeSession = engine.getActiveSession();
  const activeWindow = engine.getActiveWindow();

  const windowInfos = activeSession
    ? activeSession.windows.map((w) => ({
        id: w.id,
        name: w.name,
        isActive: w.id === activeSession.activeWindowId,
        index: w.index,
      }))
    : [];

  const showTmux = state.isInsideTmux && state.isAttached && activeWindow;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden" style={{ background: '#0a0e14' }}>
      <TerminalTitleBar
        title={
          showTmux
            ? `tmux — ${activeSession?.name || 'session'} — ${activeWindow?.name || 'bash'}`
            : 'Terminal — tmux-learn'
        }
      />

      <div className="flex flex-1 min-h-0">
        <div className="flex flex-col flex-1 min-w-0">
          {showTmux ? (
            <>
              <div className="flex-1 overflow-hidden relative">
                <PaneContainer
                  layout={activeWindow!.layout}
                  panes={activeWindow!.panes}
                  zoomedPaneId={state.zoomedPaneId}
                  onInput={handleInput}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                />

                {state.mode === 'confirm' && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[22px] flex items-center px-3 text-[11px]"
                    style={{ background: '#b8860b', color: '#0a0e14', fontFamily: "'Geist Mono', monospace" }}
                  >
                    {state.confirmAction === 'close-pane'
                      ? 'kill-pane? (y/n)'
                      : 'kill-window? (y/n)'}
                  </div>
                )}

                {state.mode === 'command' && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[22px] flex items-center px-3 text-[11px]"
                    style={{ background: '#236b2e', color: '#fff', fontFamily: "'Geist Mono', monospace" }}
                  >
                    <span style={{ color: '#dba036' }}>:</span>
                    <span>{state.commandInput}</span>
                    <span
                      className="inline-block w-[7px] h-[14px] ml-0.5"
                      style={{ background: '#c5cdd8', animation: 'blink 1s step-end infinite' }}
                    />
                  </div>
                )}

                {state.mode === 'rename' && (
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[22px] flex items-center px-3 text-[11px]"
                    style={{ background: '#236b2e', color: '#fff', fontFamily: "'Geist Mono', monospace" }}
                  >
                    <span style={{ color: '#dba036' }}>(rename-window) </span>
                    <span>{state.renameInput}</span>
                    <span
                      className="inline-block w-[7px] h-[14px] ml-0.5"
                      style={{ background: '#c5cdd8', animation: 'blink 1s step-end infinite' }}
                    />
                  </div>
                )}

                {state.mode === 'copy' && (
                  <div
                    className="absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-semibold tracking-wider"
                    style={{ background: '#dba036', color: '#0a0e14' }}
                  >
                    [COPY MODE] Press q to exit
                  </div>
                )}
              </div>

              <TmuxStatusBar
                sessionName={activeSession?.name || '0'}
                windows={windowInfos}
                prefixActive={state.prefixActive}
                mode={state.mode === 'copy' ? 'copy' : state.mode === 'command' ? 'command' : 'normal'}
              />
            </>
          ) : (
            <div className="flex-1 overflow-hidden">
              <PreTmuxTerminal
                engine={engine}
                detachedMessage={detachedMessage}
                onClearDetached={() => setDetachedMessage(null)}
              />
            </div>
          )}
        </div>

        <div className="w-[360px] shrink-0 overflow-hidden">
          <Sidebar
            mode={mode}
            onModeSwitch={handleModeSwitch}
            curriculum={curriculum}
            currentLessonId={currentLessonId}
            completedLessons={completedLessons}
            onLessonSelect={handleLessonSelect}
            hintIndex={hintIndex}
            onRequestHint={handleRequestHint}
            currentTaskIndex={currentTaskIndex}
            streak={streak}
            onSkipTask={handleSkipTask}
          />
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
          duration={3500}
        />
      )}

    </div>
  );
}

function PreTmuxTerminal({
  engine,
  detachedMessage,
  onClearDetached,
}: {
  engine: TmuxEngine;
  detachedMessage: string | null;
  onClearDetached: () => void;
}) {
  const [lines, setLines] = useState<Array<{ type: string; content: string; prompt?: string }>>([
    { type: 'system', content: 'Welcome to tmux.help \u2014 your interactive tmux tutorial!' },
    { type: 'system', content: 'Follow the lessons in the sidebar to get started.' },
    { type: 'output', content: '' },
  ]);
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (detachedMessage) {
      setLines((prev) => [...prev, { type: 'system', content: detachedMessage }]);
      onClearDetached();
    }
  }, [detachedMessage, onClearDetached]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, input]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (engine.handleKeyEvent(e.nativeEvent)) {
      e.preventDefault();
      forceUpdate((n) => n + 1);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const command = input.trim();
      const prompt = 'user@tmux-learn:~$ ';

      setLines((prev) => [...prev, { type: 'input', content: input, prompt }]);
      setInput('');

      if (command) {
        engine.recordCommand(command);
      }

      if (!command) {
        engine.executeCommand('__pretmux__', '');
        return;
      }

      if (command === 'tmux' || command.startsWith('tmux ')) {
        const parts = command.split(/\s+/);
        if (parts.length === 1) {
          engine.createSession();
          return;
        }

        const subCmd = parts[1];
        if (subCmd === 'ls' || subCmd === 'list-sessions') {
          const state = engine.getState();
          if (state.sessions.length === 0) {
            setLines((prev) => [...prev, { type: 'error', content: 'no server running on /tmp/tmux-1000/default' }]);
          } else {
            const sessionLines = state.sessions.map((s) => `${s.name}: ${s.windows.length} windows (created Mon Jan 15 10:30:00 2024)`);
            setLines((prev) => [...prev, { type: 'output', content: sessionLines.join('\n') }]);
          }
          return;
        }

        if (subCmd === 'new' || subCmd === 'new-session') {
          const sIdx = parts.indexOf('-s');
          const name = sIdx !== -1 ? parts[sIdx + 1] : undefined;
          engine.createSession(name);
          return;
        }

        if (subCmd === 'attach' || subCmd === 'attach-session' || subCmd === 'a') {
          const state = engine.getState();
          if (state.sessions.length === 0) {
            setLines((prev) => [...prev, { type: 'error', content: 'no sessions' }]);
            return;
          }
          const tIdx = parts.indexOf('-t');
          const targetName = tIdx !== -1 ? parts[tIdx + 1] : undefined;
          if (targetName) {
            const session = state.sessions.find((s) => s.name === targetName);
            if (!session) {
              setLines((prev) => [...prev, { type: 'error', content: `can't find session: ${targetName}` }]);
              return;
            }
          }
          const pane = engine.getActivePane();
          if (pane) {
            engine.executeCommand(pane.id, command);
          }
          return;
        }

        setLines((prev) => [...prev, { type: 'error', content: `tmux: unknown command: ${subCmd}` }]);
        return;
      }

      if (command === 'help') {
        setLines((prev) => [...prev, {
          type: 'output',
          content: `Available commands:
  tmux              Start a new tmux session
  tmux new -s name  Start a named session
  tmux ls           List sessions
  tmux attach -t n  Attach to a session
  help              Show this help
  clear             Clear screen`,
        }]);
        return;
      }

      if (command === 'clear') {
        setLines([]);
        return;
      }

      setLines((prev) => [...prev, { type: 'error', content: `${command.split(' ')[0]}: command not found` }]);
    } else if (e.ctrlKey && e.key === 'l') {
      e.preventDefault();
      setLines([]);
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      setLines((prev) => [...prev, { type: 'input', content: input + '^C', prompt: 'user@tmux-learn:~$ ' }]);
      setInput('');
    }
  };

  return (
    <div
      className="h-full w-full overflow-hidden cursor-text"
      style={{ background: '#0a0e14', fontFamily: "'Geist Mono', monospace", fontSize: '13px', lineHeight: '1.6', padding: '12px 20px 0' }}
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="h-full overflow-y-auto">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {line.type === 'input' && (
              <><span style={{ color: '#41b65c' }}>{line.prompt}</span><span style={{ color: '#c5cdd8' }}>{line.content}</span></>
            )}
            {line.type === 'output' && <span style={{ color: '#c5cdd8' }}>{line.content}</span>}
            {line.type === 'error' && <span style={{ color: '#e55048' }}>{line.content}</span>}
            {line.type === 'system' && <span style={{ color: '#4e9af5' }}>{line.content}</span>}
          </div>
        ))}
        <div className="whitespace-pre-wrap break-all flex">
          <span style={{ color: '#41b65c' }}>user@tmux-learn:~$ </span>
          <div className="relative flex-1">
            <span style={{ color: '#c5cdd8' }}>{input}</span>
            <span
              className="inline-block w-[7.8px] h-[19px] align-middle"
              style={{ background: '#c5cdd8', animation: 'blink 1s step-end infinite', marginLeft: '1px' }}
            />
            <input
              ref={inputRef}
              type="text"
              className="absolute inset-0 opacity-0 w-full h-full"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              aria-label="Terminal input"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
