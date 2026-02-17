interface TerminalTitleBarProps {
  title: string;
}

export function TerminalTitleBar({ title }: TerminalTitleBarProps) {
  return (
    <div
      className="flex items-center h-[38px] select-none shrink-0"
      style={{
        background: '#0a0e14',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
        padding: '0 20px',
      }}
    >
      {/* Traffic light buttons */}
      <div className="flex gap-2 shrink-0" aria-hidden="true">
        <div className="w-3 h-3 rounded-full" style={{ background: '#a3413a' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#a18332' }} />
        <div className="w-3 h-3 rounded-full" style={{ background: '#3f8a35' }} />
      </div>

      {/* Title */}
      <div
        className="flex-1 text-center text-[13px]"
        style={{ color: '#9ca3af', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        {title}
      </div>

      {/* Spacer to balance the traffic lights */}
      <div className="w-[52px] shrink-0" />
    </div>
  );
}
