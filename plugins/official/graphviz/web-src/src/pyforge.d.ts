/** The IDE's frame bridge (`window.pyforge`), injected before the page's scripts. */
interface PyforgeDocumentState {
  version: number;
  text: string;
}

interface PyforgeTextEdit {
  from: number;
  to: number;
  insert: string;
}

interface PyforgeFileFilter {
  name: string;
  extensions: string[];
}

interface PyforgeBridge {
  postMessage(text: string): void;
  onMessage(fn: (text: string) => void): void;
  readonly theme: { dark: boolean; vars: Readonly<Record<string, string>> } | null;
  onThemeChange(fn: (theme: { dark: boolean; vars: Readonly<Record<string, string>> }) => void): void;
  document: {
    /** `name`: the file's name, without its directory. */
    get(): Promise<PyforgeDocumentState & { readOnly: boolean; name: string }>;
    onChange(fn: (state: PyforgeDocumentState) => void): void;
    edit(version: number, edits: PyforgeTextEdit[]): Promise<{ version: number }>;
    replace(version: number, text: string): Promise<{ version: number }>;
  };
  saveFile(options: {
    name: string;
    data: string | Uint8Array | ArrayBuffer | Blob;
    filters?: PyforgeFileFilter[];
  }): Promise<string | null>;
  openFile(options?: { filters?: PyforgeFileFilter[] }): Promise<{ name: string; data: Uint8Array } | null>;
}

interface Window {
  pyforge?: PyforgeBridge;
}
