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

    const timeout = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onDismiss, 300);
    }, duration);

    return () => clearTimeout(timeout);
  }, [duration, onDismiss]);

  const colors = {
    success: { bg: '#162b1e', border: '#41b65c', icon: '\u2713' },
    info: { bg: '#152240', border: '#4e9af5', icon: 'i' },
    error: { bg: '#2d1518', border: '#e55048', icon: '!' },
  };

  const c = colors[type];

  return (
    <div
      className="fixed top-5 left-1/2 z-50 transition-all duration-300 ease-out"
      style={{
        transform: `translateX(-50%) translateY(${isVisible && !isExiting ? '0' : '-16px'})`,
        opacity: isVisible && !isExiting ? 1 : 0,
      }}
    >
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-lg text-[12px] leading-relaxed"
        style={{
          background: c.bg,
          border: `1px solid ${c.border}`,
          color: '#c5cdd8',
          minWidth: '320px',
          maxWidth: '520px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
          fontFamily: "'Geist Mono', monospace",
        }}
      >
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
          style={{
            background: c.border,
            color: '#0a0e14',
          }}
        >
          {c.icon}
        </span>
        <span className="flex-1">{message}</span>
      </div>
    </div>
  );
}
