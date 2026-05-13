import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@smartnutri/diagnostic_logging';

let installed = false;

async function persistError(message: string, stack?: string) {
  const payload = JSON.stringify({
    at: new Date().toISOString(),
    message: message.slice(0, 2000),
    stack: stack?.slice(0, 4000),
  });
  try {
    await AsyncStorage.setItem('@smartnutri/last_diagnostic', payload.slice(0, 8000));
  } catch {
    return;
  }
}

export async function getDiagnosticLoggingEnabled(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === '1';
  } catch {
    return false;
  }
}

export async function setDiagnosticLoggingEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(KEY, enabled ? '1' : '0');
}

export function installDiagnosticHandlerIfNeeded(): void {
  if (installed) return;
  installed = true;
  const ErrorUtilsGlobal = (global as unknown as { ErrorUtils?: { getGlobalHandler: () => (e: Error, isFatal?: boolean) => void; setGlobalHandler: (fn: (e: Error, isFatal?: boolean) => void) => void } }).ErrorUtils;
  if (!ErrorUtilsGlobal?.getGlobalHandler || !ErrorUtilsGlobal.setGlobalHandler) {
    return;
  }
  const defaultHandler = ErrorUtilsGlobal.getGlobalHandler();
  ErrorUtilsGlobal.setGlobalHandler((error: Error, isFatal) => {
    void (async () => {
      try {
        if (await getDiagnosticLoggingEnabled() && error) {
          await persistError(error.message || 'Error', error.stack);
        }
      } catch {
        return;
      }
    })();
    defaultHandler(error, isFatal);
  });
}
