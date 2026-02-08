import { useEffect, useRef, useCallback } from 'react';

interface ShellLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  prompt?: string;
}

interface PaneProps {
  paneId: string;
  lines: ShellLine[];
  currentInput: string;
  isActive: boolean;
  isZoomed: boolean;
  cwd: string;
  onInput: (paneId: string, char: string) => void;
  onKeyDown: (paneId: string, e: React.KeyboardEvent) => void;
  onFocus: (paneId: string) => void;
}

export function Pane({
  paneId,
  lines,
  currentInput,
  isActive,
  isZoomed,
  cwd,
  onInput,
  onKeyDown,
  onFocus,
}: PaneProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyConsumedRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, currentInput]);

  useEffect(() => {
    if (isActive && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isActive]);

  const handleClick = useCallback(() => {
    onFocus(paneId);
    inputRef.current?.focus();
  }, [paneId, onFocus]);

  const prompt = `user@tmux-learn:${shortenPath(cwd)}$ `;

  return (
    <div
      className="flex flex-col h-full w-full overflow-hidden cursor-text"
      style={{
        background: '#0a0e14',
        fontFamily: "'Geist Mono', monospace",
        fontSize: '13px',
        lineHeight: '1.6',
      }}
      onClick={handleClick}
    >
      {/* Scrollable output area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ padding: '12px 20px 0' }}
      >
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all">
            {line.type === 'input' && (
              <>
                <span style={{ color: '#41b65c' }}>{line.prompt}</span>
                <span style={{ color: '#c5cdd8' }}>{line.content}</span>
              </>
            )}
            {line.type === 'output' && (
              <span style={{ color: '#c5cdd8' }}>{line.content}</span>
            )}
            {line.type === 'error' && (
              <span style={{ color: '#e55048' }}>{line.content}</span>
            )}
            {line.type === 'system' && (
              <span style={{ color: '#4e9af5' }}>{line.content}</span>
            )}
          </div>
        ))}

        {/* Current input line */}
        <div className="whitespace-pre-wrap break-all flex pb-2">
          <span style={{ color: '#41b65c' }}>{prompt}</span>
          <div className="relative flex-1">
            <span style={{ color: '#c5cdd8' }}>{currentInput}</span>
            <span
              className="inline-block w-[7.8px] h-[18px] align-middle"
              style={{
                background: isActive ? '#c5cdd8' : 'transparent',
                animation: isActive ? 'blink 1s step-end infinite' : 'none',
                marginLeft: '1px',
              }}
            />
            {/* Hidden input to capture keystrokes */}
            <input
              ref={inputRef}
              type="text"
              className="absolute inset-0 opacity-0 w-full h-full"
              style={{ caretColor: 'transparent' }}
              value=""
              onKeyDown={(e) => {
                keyConsumedRef.current = false;
                onKeyDown(paneId, e);
                if (e.defaultPrevented) {
                  keyConsumedRef.current = true;
                }
              }}
              onChange={(e) => {
                if (e.target.value && !keyConsumedRef.current) {
                  onInput(paneId, e.target.value);
                }
                e.target.value = '';
                keyConsumedRef.current = false;
              }}
              autoFocus={isActive}
              aria-label={`Terminal pane ${paneId}`}
            />
          </div>
        </div>
      </div>

      {/* Zoom indicator */}
      {isZoomed && (
        <div
          className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded font-semibold tracking-wider"
          style={{ background: '#dba036', color: '#0a0e14' }}
        >
          ZOOMED
        </div>
      )}
    </div>
  );
}

function shortenPath(path: string): string {
  if (path === '/home/user') return '~';
  if (path.startsWith('/home/user/')) return '~/' + path.slice('/home/user/'.length);
  return path;
}
