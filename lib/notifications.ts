import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as TaskManager from 'expo-task-manager';
import { NativeModules, Platform } from 'react-native';
import { getApiToken, getNotificationsApi, setApiToken, type ApiNotification } from './api';
import { getPersistedToken } from './storage';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
export const BACKGROUND_SYNC_TASK = 'BACKGROUND_SYNC_NOTIFICATIONS';
const FOREGROUND_TASK_ID = 'MONKEY_NOTIFICATION_SYNC';
const STORAGE_NOTIFICATION_IDS_KEY = 'notification_seen_ids_v1';
const MAX_STORED_IDS = 200;

let NotificationsModule: typeof import('expo-notifications') | null = null;
let ForegroundServiceModule: typeof import('@supersami/rn-foreground-service').default | null = null;
let foregroundServiceConfigured = false;

function getForegroundService() {
  if (Platform.OS !== 'android' || isExpoGo) return null;
  if (!ForegroundServiceModule) {
    const nativeService = NativeModules.ForegroundService;
    if (nativeService) {
      nativeService.addListener ??= () => {};
      nativeService.removeListeners ??= () => {};
    }
    ForegroundServiceModule = require('@supersami/rn-foreground-service').default;
  }
  return ForegroundServiceModule;
}

function ensureForegroundServiceConfigured() {
  const foregroundService = getForegroundService();
  if (!foregroundService || foregroundServiceConfigured) return foregroundService;

  foregroundService.register({
    config: {
      alert: false,
      onServiceErrorCallBack: () => {},
    },
  });

  foregroundService.add_task(
    async () => {
      try {
        await syncServerNotifications();
      } catch {}
    },
    {
      delay: 30_000,
      onLoop: true,
      taskId: FOREGROUND_TASK_ID,
      onError: () => {},
    },
  );
  foregroundServiceConfigured = true;
  return foregroundService;
}

if (!isExpoGo) {
  try {
    NotificationsModule = require('expo-notifications');
    NotificationsModule?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {}
}

export async function triggerLocalNotification(
  title: string,
  body: string,
  appointmentId?: string,
) {
  if (isExpoGo || !NotificationsModule) return;

  await NotificationsModule.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      priority: NotificationsModule.AndroidNotificationPriority.MAX,
      vibrate: [0, 250, 250, 250],
      data: appointmentId ? { appointmentId } : undefined,
    },
    trigger: null,
  });
}

/**
 * Uses the backend notification inbox as the source of truth. On the first
 * successful sync it only establishes a baseline, so installing or signing in
 * does not replay the user's complete history as operating-system alerts.
 */
export async function processServerNotifications(list: ApiNotification[]): Promise<void> {
  if (!Array.isArray(list)) return;

  const rawSeen = await AsyncStorage.getItem(STORAGE_NOTIFICATION_IDS_KEY);
  const currentIds = list.map((notification) => notification._id).filter(Boolean);

  if (!rawSeen) {
    await AsyncStorage.setItem(
      STORAGE_NOTIFICATION_IDS_KEY,
      JSON.stringify(currentIds.slice(0, MAX_STORED_IDS)),
    );
    return;
  }

  let seenIds: string[] = [];
  try {
    const parsed = JSON.parse(rawSeen);
    if (Array.isArray(parsed)) seenIds = parsed.filter((id): id is string => typeof id === 'string');
  } catch {}

  const seen = new Set(seenIds);
  const unseen = list.filter((notification) => !seen.has(notification._id)).reverse();

  for (const notification of unseen) {
    await triggerLocalNotification(
      notification.title,
      notification.body,
      notification.appointmentId,
    );
  }

  const nextIds = Array.from(new Set([...currentIds, ...seenIds])).slice(0, MAX_STORED_IDS);
  await AsyncStorage.setItem(STORAGE_NOTIFICATION_IDS_KEY, JSON.stringify(nextIds));
}

export async function presentIncomingNotification(notification: ApiNotification): Promise<void> {
  const rawSeen = await AsyncStorage.getItem(STORAGE_NOTIFICATION_IDS_KEY);
  let seenIds: string[] = [];
  try {
    const parsed = rawSeen ? JSON.parse(rawSeen) : [];
    if (Array.isArray(parsed)) seenIds = parsed.filter((id): id is string => typeof id === 'string');
  } catch {}

  if (seenIds.includes(notification._id)) return;

  await triggerLocalNotification(
    notification.title,
    notification.body,
    notification.appointmentId,
  );
  await AsyncStorage.setItem(
    STORAGE_NOTIFICATION_IDS_KEY,
    JSON.stringify([notification._id, ...seenIds].slice(0, MAX_STORED_IDS)),
  );
}

export async function syncServerNotifications(): Promise<void> {
  const token = getApiToken() || (await getPersistedToken());
  if (!token) return;

  setApiToken(token);
  const list = await getNotificationsApi(100);
  await processServerNotifications(list);
}

export async function resetNotificationTracking(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_NOTIFICATION_IDS_KEY);
}

export async function startForegroundMonitoring() {
  if (Platform.OS !== 'android' || isExpoGo) return;
  if (!(await getPersistedToken())) return;
  const foregroundService = ensureForegroundServiceConfigured();
  if (!foregroundService || foregroundService.is_running()) return;

  type StartForegroundService = (config: {
    id: number;
    title: string;
    message: string;
    ServiceType: 'dataSync';
    icon: string;
    importance: string;
    visibility: string;
    button: boolean;
    setOnlyAlertOnce: string;
  }) => Promise<void>;

  await (foregroundService.start as unknown as StartForegroundService)({
    id: 144,
    title: 'Monkey Auto Spa',
    message: 'Monitoreando el estado de tus citas',
    ServiceType: 'dataSync',
    icon: 'ic_launcher',
    importance: 'low',
    visibility: 'public',
    button: false,
    setOnlyAlertOnce: 'true',
  });
}

export async function stopForegroundMonitoring() {
  if (Platform.OS !== 'android' || isExpoGo) return;
  const foregroundService = ForegroundServiceModule;
  if (foregroundService?.is_running()) {
    await foregroundService.stopAll();
  }
}

TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
  try {
    const token = await getPersistedToken();
    if (!token) return BackgroundFetch.BackgroundFetchResult.NoData;

    await syncServerNotifications();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundSyncTask() {
  if (isExpoGo) return;
  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_SYNC_TASK);
    if (!isRegistered) {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
        minimumInterval: 15 * 60,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    }
  } catch {}
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (isExpoGo || !NotificationsModule) return false;

  try {
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await NotificationsModule.setNotificationChannelAsync('default', {
        name: 'Estado de citas',
        importance: NotificationsModule.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#ef3b42',
        lockscreenVisibility: NotificationsModule.AndroidNotificationVisibility.PUBLIC,
      });
    }

    await registerBackgroundSyncTask();
    return true;
  } catch {
    return false;
  }
}
