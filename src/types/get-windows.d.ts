declare module 'get-windows' {
  export interface WindowOwner {
    name: string;
    processId: number;
    bundleId?: string;
    path?: string;
  }

  export interface ActiveWindowResult {
    title: string;
    id: number;
    bounds: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    owner: WindowOwner;
    memoryUsage?: number;
    url?: string;
  }

  export interface WindowOptions {
    screenRecordingPermission?: boolean;
    accessibilityPermission?: boolean;
  }

  export function activeWindow(options?: WindowOptions): Promise<ActiveWindowResult | undefined>;
  export function activeWindowSync(options?: WindowOptions): ActiveWindowResult | undefined;
  export function openWindows(options?: WindowOptions): Promise<ActiveWindowResult[]>;
  export function openWindowsSync(options?: WindowOptions): ActiveWindowResult[];
}
