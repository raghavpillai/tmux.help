export interface ShellLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  prompt?: string;
}

export interface PaneLayout {
  type: 'leaf' | 'horizontal' | 'vertical';
  paneId?: string;
  children?: PaneLayout[];
  size?: number;
}

export interface TmuxPane {
  id: string;
  shellHistory: ShellLine[];
  currentInput: string;
  cwd: string;
  isActive: boolean;
}
