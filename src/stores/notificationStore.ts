import { create } from "zustand";

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    message: string;
    duration?: number; // time
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (type: NotificationType, message:string, duration?:number) => void;
    removeNotification: (id:string) => void;
    clearAll: () => void;
}

export const useNotification = create<NotificationState>((set) => ({notifications: [],
    addNotification: (type, message, duration = 3000) => {
        const id = Math.random().toString(36).substring(7);
        const notification: Notification = {id, type, message, duration};

        set((state) => ({
            notifications: [...state.notifications, notification],
        }));

        if(duration > 0){
            setTimeout(() => {
                set((state) => ({
                    notifications: state.notifications.filter((n) => n.id != id),
                }));
            }, duration);
        }
    },

    removeNotification: (id) => {
        set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
        }));
    },

    clearAll: () => set({ notifications: [] }),
}))