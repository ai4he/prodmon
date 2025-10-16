/**
 * Windows URL Capture Module
 *
 * Uses Windows UI Automation API to capture browser URLs on Windows.
 * This provides feature parity with macOS Accessibility permission.
 */

let nativeModule: any = null;

/**
 * Get the URL from the active browser window using Windows UI Automation
 * @returns The URL of the active browser tab, or empty string if not available
 */
export function getActiveWindowUrl(): string {
  if (process.platform !== 'win32') {
    return '';
  }

  try {
    // Lazy load the native module only on Windows
    if (!nativeModule) {
      nativeModule = require('../../../build/Release/windows_url_capture.node');
    }

    const url = nativeModule.getActiveWindowUrl();
    return url || '';
  } catch (error) {
    // Native module not built or not available - gracefully fallback
    if (error instanceof Error && !error.message.includes('Cannot find module')) {
      console.warn('Windows URL capture error:', error.message);
    }
    return '';
  }
}

/**
 * Check if Windows URL capture is available
 */
export function isAvailable(): boolean {
  if (process.platform !== 'win32') {
    return false;
  }

  try {
    if (!nativeModule) {
      nativeModule = require('../../../build/Release/windows_url_capture.node');
    }
    return true;
  } catch {
    return false;
  }
}
