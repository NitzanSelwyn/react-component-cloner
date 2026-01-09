// Core type definitions for React Component Cloner

export interface ReactFiberNode {
  tag: number;
  key: string | null;
  elementType: any;
  type: any;
  stateNode: any;
  return: ReactFiberNode | null;
  child: ReactFiberNode | null;
  sibling: ReactFiberNode | null;
  index: number;
  ref: any;
  pendingProps: any;
  memoizedProps: any;
  memoizedState: any;
  dependencies: any;
  mode: number;
  flags: number;
  alternate: ReactFiberNode | null;
  _debugSource?: {
    fileName: string;
    lineNumber: number;
    columnNumber: number;
  };
  _debugOwner?: ReactFiberNode;
}

export interface ComponentInfo {
  name: string;
  type: ComponentType;
  props: Record<string, any>;
  children: ComponentInfo[];
  domNode: HTMLElement | null;
  fiberNode: ReactFiberNode;
  styles: ExtractedStyles;
  hooks?: HookState[];
}

export type ComponentType =
  | 'function'
  | 'class'
  | 'html'
  | 'memo'
  | 'forwardRef'
  | 'fragment'
  | 'context.provider'
  | 'context.consumer';

export interface ExtractedStyles {
  inline: Record<string, string>;
  computed: Record<string, string>;
  classes: string[];
  strategy: StyleStrategy;
}

export type StyleStrategy =
  | 'inline'
  | 'css-module'
  | 'styled-components'
  | 'tailwind'
  | 'plain-css';

export interface HookState {
  type: string;
  value: any;
}

export interface GeneratorOptions {
  includeStyles: boolean;
  styleStrategy: StyleStrategy;
  includeComments: boolean;
  formatCode: boolean;
  extractDepth: 'shallow' | 'deep';
  outputLanguage: 'javascript' | 'typescript';
}

export interface GeneratedCode {
  jsx: string;
  styles: string;
  imports: string[];
  types?: string;
  fullCode: string;
}

export interface ExtensionSettings {
  codeStyle: 'javascript' | 'typescript';
  styleStrategy: StyleStrategy;
  autoFormat: boolean;
  includeComments: boolean;
  defaultExtractDepth: 'shallow' | 'deep';
}

export interface ComponentHistory {
  id: number;
  timestamp: string;
  component: ComponentInfo;
  generatedCode: GeneratedCode;
  url: string;
}

// Message types for Chrome extension messaging
export type MessageType =
  | 'CHECK_REACT'
  | 'TOGGLE_INSPECTOR'
  | 'TOGGLE_INSPECTOR_FROM_COMMAND'
  | 'COMPONENT_SELECTED'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'STORE_COMPONENT'
  | 'GET_HISTORY';

export interface ExtensionMessage {
  type: MessageType;
  payload?: any;
}

// Inspector state
export interface InspectorState {
  active: boolean;
  hoveredElement: HTMLElement | null;
  selectedElement: HTMLElement | null;
  hoveredComponent: ComponentInfo | null;
  selectedComponent: ComponentInfo | null;
}

// Preview state
export interface PreviewState {
  visible: boolean;
  component: ComponentInfo | null;
  generatedCode: GeneratedCode | null;
  error: string | null;
}
