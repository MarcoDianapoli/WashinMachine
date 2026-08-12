import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let NotificationsModule: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {
  try {
    NotificationsModule = require('expo-notifications');
    NotificationsModule?.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
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
    
    if (finalStatus !== 'granted') {
      return false;
    }

    if (Platform.OS === 'android') {
      await NotificationsModule.setNotificationChannelAsync('default', {
        name: 'Alertas de Lavado',
        importance: NotificationsModule.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e11d48',
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function triggerLocalNotification(title: string, body: string) {
  if (isExpoGo || !NotificationsModule) return;
  try {
    await NotificationsModule.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: NotificationsModule.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch {}
}
