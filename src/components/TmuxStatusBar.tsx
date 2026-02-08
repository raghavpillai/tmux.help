import { useEffect, useState } from 'react';

interface WindowInfo {
  id: string;
  name: string;
  isActive: boolean;
  index: number;
}

interface TmuxStatusBarProps {
  sessionName: string;
  windows: WindowInfo[];
  prefixActive: boolean;
  mode: 'normal' | 'copy' | 'command';
}

export function TmuxStatusBar({ sessionName, windows, prefixActive, mode }: TmuxStatusBarProps) {
  const [time, setTime] = useState(formatTime());

  useEffect(() => {
    const interval = setInterval(() => setTime(formatTime()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center h-[22px] px-0 text-[11px] select-none shrink-0"
      style={{
        background: prefixActive ? '#b8860b' : '#236b2e',
        color: prefixActive ? '#000000' : 'rgba(255,255,255,0.9)',
        transition: 'background-color 0.15s ease',
        fontFamily: "'Geist Mono', monospace",
        letterSpacing: '0.01em',
      }}
    >
      {/* Session name */}
      <span
        className="px-2 h-full flex items-center font-semibold"
        style={{
          background: 'rgba(0,0,0,0.25)',
        }}
      >
        [{sessionName}]
      </span>

      {/* Window list */}
      <div className="flex flex-1 h-full">
        {windows.map((win) => (
          <span
            key={win.id}
            className="px-2 h-full flex items-center"
            style={{
              background: win.isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
              fontWeight: win.isActive ? 600 : 400,
            }}
          >
            {win.index}:{win.name}{win.isActive ? '*' : '-'}
          </span>
        ))}
      </div>

      {/* Mode indicator */}
      {mode !== 'normal' && (
        <span
          className="px-2 h-full flex items-center font-semibold"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          [{mode === 'copy' ? 'copy' : 'cmd'}]
        </span>
      )}

      {/* Prefix indicator */}
      {prefixActive && (
        <span
          className="px-2 h-full flex items-center font-semibold"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          ^B
        </span>
      )}

      {/* Right side: hostname + time */}
      <span
        className="px-2 h-full flex items-center"
        style={{ color: 'rgba(255,255,255,0.7)' }}
      >
        "tmux-learn" {time}
      </span>
    </div>
  );
}

function formatTime(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
