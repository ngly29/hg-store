"use client";

import { useNotification } from "@/stores/notificationStore";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import styles from "./Notification.module.css";

const iconMap = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const colorMap = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-yellow-500',
    info: 'bg-blue-500',
}

export default function Notification(){
    const { notifications, removeNotification } = useNotification();

    if(notifications.length === 0) return null;

    return (
        <div className={styles.notificationContainer}>
            {notifications.map((notification) => {
                const IconComponent = iconMap[notification.type];

                return (
                    <div
                        key={notification.id}
                        className={`${styles.notification} ${colorMap[notification.type]}`}
                    >
                        <IconComponent className={styles.notificationIcon} />
                        <span className={styles.notificationMessage}>{notification.message}</span>
                        <button
                            onClick={() => removeNotification(notification.id)}
                            className={styles.notificationClose}
                        >
                            <X className={styles.closeIcon} />
                        </button>
                    </div>
                );
            })}
        </div>
    )
}