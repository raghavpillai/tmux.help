interface KeyComboProps {
  keys: string[];
  isSequential?: boolean;
  size?: 'sm' | 'md';
}

export function KeyCombo({ keys, isSequential = false, size = 'md' }: KeyComboProps) {
  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-[2px] text-[10px] min-w-[20px]'
    : 'px-2 py-1 text-xs min-w-[28px]';

  return (
    <span className="inline-flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={i} className="inline-flex items-center gap-1">
          {i > 0 && (
            <span className="text-[10px]" style={{ color: '#565e6a' }}>
              {isSequential ? 'then' : '+'}
            </span>
          )}
          <kbd
            className={`${sizeClasses} inline-flex items-center justify-center rounded font-medium`}
            style={{
              background: '#171d26',
              border: '1px solid #252d38',
              borderBottom: '2px solid #252d38',
              color: '#c5cdd8',
              boxShadow: '0 1px 0 rgba(0,0,0,0.3)',
              fontFamily: "'Geist Mono', monospace",
              fontSize: size === 'sm' ? '10px' : '11px',
            }}
          >
            {key}
          </kbd>
        </span>
      ))}
    </span>
  );
}
