import { AppNotification, UserRole } from '../../types';
import {
  COLLECTIONS,
  listDocuments,
  setDocument,
  updateDocument,
} from './collections';

export async function createNotification(params: {
  userId: string;
  roleTarget?: UserRole;
  title: string;
  message: string;
  type: AppNotification['type'];
  link?: string;
  demo?: boolean;
}): Promise<AppNotification> {
  const id = `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const item: AppNotification = {
    id,
    userId: params.userId,
    roleTarget: params.roleTarget,
    title: params.title,
    message: params.message,
    type: params.type,
    read: false,
    link: params.link,
    demo: params.demo ?? false,
    createdAt: new Date().toISOString(),
  };
  return setDocument(COLLECTIONS.NOTIFICATIONS, id, item);
}

export async function getUserNotifications(
  userId: string,
  role?: UserRole
): Promise<AppNotification[]> {
  const all = await listDocuments<AppNotification>(COLLECTIONS.NOTIFICATIONS);
  return all
    .filter(
      (n) =>
        n.userId === userId ||
        (role && n.userId === `role_${role}`)
    )
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  await updateDocument<AppNotification>(COLLECTIONS.NOTIFICATIONS, notificationId, {
    read: true,
  });
}

export async function markAllUserNotificationsRead(
  userId: string,
  role?: UserRole
): Promise<void> {
  const items = await getUserNotifications(userId, role);
  for (const item of items) {
    if (!item.read) {
      await updateDocument<AppNotification>(COLLECTIONS.NOTIFICATIONS, item.id, {
        read: true,
      });
    }
  }
}

