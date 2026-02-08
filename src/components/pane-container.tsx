import { Pane } from './pane';
import type { PaneLayout, TmuxPane } from '../types';

interface PaneContainerProps {
  layout: PaneLayout;
  panes: TmuxPane[];
  zoomedPaneId: string | null;
  onInput: (paneId: string, char: string) => void;
  onKeyDown: (paneId: string, e: React.KeyboardEvent) => void;
  onFocus: (paneId: string) => void;
}

export function PaneContainer({
  layout,
  panes,
  zoomedPaneId,
  onInput,
  onKeyDown,
  onFocus,
}: PaneContainerProps) {
  // If a pane is zoomed, only show that pane
  if (zoomedPaneId) {
    const pane = panes.find((p) => p.id === zoomedPaneId);
    if (pane) {
      return (
        <div className="h-full w-full relative" style={{ background: '#0a0e14' }}>
          <Pane
            paneId={pane.id}
            lines={pane.shellHistory}
            currentInput={pane.currentInput}
            isActive={true}
            isZoomed={true}
            cwd={pane.cwd}
            onInput={onInput}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
          />
        </div>
      );
    }
  }

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: '#0a0e14' }}>
      <LayoutRenderer
        layout={layout}
        panes={panes}
        onInput={onInput}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
      />
    </div>
  );
}

function LayoutRenderer({
  layout,
  panes,
  onInput,
  onKeyDown,
  onFocus,
}: {
  layout: PaneLayout;
  panes: TmuxPane[];
  onInput: (paneId: string, char: string) => void;
  onKeyDown: (paneId: string, e: React.KeyboardEvent) => void;
  onFocus: (paneId: string) => void;
}) {
  if (layout.type === 'leaf') {
    const pane = panes.find((p) => p.id === layout.paneId);
    if (!pane) return null;

    return (
      <div
        className="h-full w-full relative"
        style={{
          border: `1px solid ${pane.isActive ? '#41b65c' : '#1e2630'}`,
          transition: 'border-color 0.15s ease',
        }}
      >
        <Pane
          paneId={pane.id}
          lines={pane.shellHistory}
          currentInput={pane.currentInput}
          isActive={pane.isActive}
          isZoomed={false}
          cwd={pane.cwd}
          onInput={onInput}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
        />
      </div>
    );
  }

  const isHorizontal = layout.type === 'horizontal';
  const children = layout.children || [];

  return (
    <div
      className="h-full w-full flex"
      style={{
        flexDirection: isHorizontal ? 'row' : 'column',
      }}
    >
      {children.map((child, i) => (
        <div
          key={child.paneId || `layout-${i}`}
          style={{
            flex: child.size ? `0 0 ${child.size}%` : '1 1 0%',
            minWidth: 0,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <LayoutRenderer
            layout={child}
            panes={panes}
            onInput={onInput}
            onKeyDown={onKeyDown}
            onFocus={onFocus}
          />
        </div>
      ))}
    </div>
  );
}
