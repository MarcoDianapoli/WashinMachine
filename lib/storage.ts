import { Platform } from 'react-native';

const STORAGE_KEY = 'autolavado_data';

async function loadFromFileSystem(): Promise<string | null> {
  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, 'autolavado_data.json');
  if (!file.exists) return null;
  return await file.text();
}

async function saveToFileSystem(data: string): Promise<void> {
  const { File, Paths } = await import('expo-file-system');
  const file = new File(Paths.document, 'autolavado_data.json');
  file.create({ idempotent: true });
  await file.write(data);
}

function loadFromWeb(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveToWeb(data: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, data);
  } catch {}
}

export async function loadPersistedData<T>(): Promise<T | null> {
  try {
    let raw: string | null = null;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      raw = loadFromWeb();
    } else {
      raw = await loadFromFileSystem();
    }
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function savePersistedData<T>(data: T): Promise<void> {
  try {
    const raw = JSON.stringify(data);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      saveToWeb(raw);
    } else {
      await saveToFileSystem(raw);
    }
  } catch {}
}
