import { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'info' | 'error';
  onDismiss: () => void;
  duration?: number;
}

export function Toast({ message, type, onDismiss, duration = 3000 }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));

    const exitTimeout = setTimeout(() => {
      setIsExiting(true);
    }, duration);

    const dismissTimeout = setTimeout(() => {
      onDismiss();
    }, duration + 300);

    return () => {
      clearTimeout(exitTimeout);
      clearTimeout(dismissTimeout);
    };
  }, [duration, onDismiss]);

  const prefix = { success: '[ok]', info: '[--]', error: '[!!]' };

  return (
    <div
      className="fixed top-4 left-1/2 z-50 transition-all duration-200 ease-out"
      style={{
        transform: `translateX(-50%) translateY(${isVisible && !isExiting ? '0' : '-12px'})`,
        opacity: isVisible && !isExiting ? 1 : 0,
      }}
      role="alert"
    >
      <div
        className="flex items-center gap-3 text-[12px]"
        style={{
          background: type === 'success' ? '#162b1e' : type === 'error' ? '#2d1518' : '#152240',
          border: `1px solid ${type === 'success' ? '#41b65c' : type === 'error' ? '#e55048' : '#4e9af5'}`,
          color: '#c5cdd8',
          padding: '7px 12px',
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        <span style={{ color: type === 'success' ? '#41b65c' : type === 'error' ? '#e55048' : '#4e9af5' }}>
          {prefix[type]}
        </span>
        <span>{message}</span>
      </div>
    </div>
  );
}
