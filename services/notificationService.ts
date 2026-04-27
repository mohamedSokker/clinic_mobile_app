import messaging from "@react-native-firebase/messaging";
import { Platform, PermissionsAndroid } from "react-native";
import api from "@/lib/api";

import * as Notifications from 'expo-notifications';

// Configure foreground notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const requestUserPermission = async () => {
  if (Platform.OS === "android" && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Permission denied for notifications");
      return false;
    }
  }

  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log("Authorization status:", authStatus);
  }
  return enabled;
};

export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    if (token) {
      console.log("FCM Token:", token);
      return token;
    }
  } catch (error) {
    console.log("Error getting FCM token:", error);
  }
  return null;
};

export const saveTokenToBackend = async (token: string) => {
  try {
    await api.patch("/users/fcm-token", { fcmToken: token });
    console.log("Token saved to backend");
  } catch (error) {
    console.log("Error saving token to backend:", error);
  }
};

let onMessageUnsubscribe: (() => void) | null = null;

export const initNotifications = async () => {
  const hasPermission = await requestUserPermission();
  if (hasPermission) {
    const token = await getFCMToken();
    if (token) {
      await saveTokenToBackend(token);
    }
  }

  // Foreground message listener
  if (onMessageUnsubscribe) {
    onMessageUnsubscribe();
  }

  onMessageUnsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log("A new FCM message arrived!", JSON.stringify(remoteMessage));
    
    if (remoteMessage.notification) {
      // Trigger a local notification to show the system banner even in foreground
      await Notifications.scheduleNotificationAsync({
        content: {
          title: remoteMessage.notification.title || 'Notification',
          body: remoteMessage.notification.body || '',
          data: remoteMessage.data,
          sound: 'default',
        },
        trigger: null, // show immediately
      });
    }
  });

  // Background/Quit state listener
  messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log(
      "Notification caused app to open from background state:",
      remoteMessage.notification,
    );
  });

  messaging()
    .getInitialNotification()
    .then((remoteMessage) => {
      if (remoteMessage) {
        console.log(
          "Notification caused app to open from quit state:",
          remoteMessage.notification,
        );
      }
    });

  return onMessageUnsubscribe;
};

export const subscribeToNotifications = (
  userId: string,
  callback: (notifs: any[]) => void,
) => {
  let isSubscribed = true;

  const fetchNotifs = async () => {
    try {
      const res = await api.get("/notifications");
      if (isSubscribed) {
        // Ensure dates are actual Date objects if needed,
        // though the UI check (instanceof Date) handles it
        callback(
          res.data.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
          })),
        );
      }
    } catch (err) {
      console.error("Fetch Notifs Error:", err);
    }
  };

  fetchNotifs();
  const interval = setInterval(fetchNotifs, 10000); // Poll every 10 seconds

  return () => {
    isSubscribed = false;
    clearInterval(interval);
  };
};

export const markNotificationRead = async (id: string) => {
  try {
    await api.patch(`/notifications/${id}/read`);
  } catch (err) {
    console.error("Mark Read Error:", err);
  }
};

export const markAllNotificationsRead = async (userId: string) => {
  try {
    await api.post("/notifications/read-all");
  } catch (err) {
    console.error("Mark All Read Error:", err);
  }
};

export const addNotification = async (data: {
  userId: string;
  title: string;
  body: string;
  type: string;
  relatedId?: string;
}) => {
  try {
    const res = await api.post("/notifications", data);
    return res.data;
  } catch (err) {
    console.error("Add Notification Error:", err);
    throw err;
  }
};
