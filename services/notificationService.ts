import api from '@/lib/api';
import type { AppNotification, NotificationType } from '@/types/notification';

export async function addNotification(data: {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  relatedId?: string;
  data?: Record<string, string>;
}): Promise<void> {
  if (data.userId === 'emergency') return;
  // This should ideally be called by the backend itself during triggers,
  // but keeping it for manual client-side notifications if any
  await api.post('/notifications', data);
}

export async function getNotificationsForUser(userId: string): Promise<AppNotification[]> {
  const res = await api.get('/notifications');
  return res.data;
}

export function subscribeToNotifications(userId: string, callback: (notifs: AppNotification[]) => void): () => void {
  const fetch = async () => {
    try {
      const res = await getNotificationsForUser(userId);
      callback(res);
    } catch (e) {
      console.error('Notification poll failed', e);
    }
  };

  fetch();
  const interval = setInterval(fetch, 15000); // Poll every 15s
  return () => clearInterval(interval);
}

export async function markNotificationRead(notifId: string) {
  await api.patch(`/notifications/${notifId}/read`);
}

export async function markAllNotificationsRead(userId: string) {
  await api.post('/notifications/read-all');
}
