import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'autolavado_data';
const TOKEN_KEY = 'autolavado_auth_token';

export async function getPersistedToken(): Promise<string | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  } catch {
    return null;
  }
}

export async function setPersistedToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {}
}

export async function loadPersistedData<T>(): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function savePersistedData<T>(data: T): Promise<void> {
  try {
    const raw = JSON.stringify(data);
    await AsyncStorage.setItem(STORAGE_KEY, raw);
  } catch {}
}
