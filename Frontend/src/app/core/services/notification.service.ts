import { Injectable } from '@angular/core';

export interface Notification {
    title: string;
    description?: string;
    type?: 'success' | 'error' | 'info' | 'warning';
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    show(notification: Notification): void {
        console.log(`[${notification.type?.toUpperCase() || 'INFO'}] ${notification.title}`, notification.description);
        this.showToast(notification);
    }

    private showToast(notification: Notification): void {
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg max-w-sm animate-slide-in ${this.getToastClass(notification.type)}`;
        toast.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="flex-1">
                    <p class="font-semibold">${notification.title}</p>
                    ${notification.description ? `<p class="text-sm mt-1">${notification.description}</p>` : ''}
                </div>
                <button onclick="this.parentElement.parentElement.remove()" class="text-xl leading-none">&times;</button>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }

    private getToastClass(type?: string): string {
        const classes: { [key: string]: string } = {
            'success': 'bg-green-500 text-white',
            'error': 'bg-red-500 text-white',
            'warning': 'bg-yellow-500 text-white',
            'info': 'bg-blue-500 text-white'
        };
        return classes[type || 'info'] || classes['info'];
    }

    success(title: string, description?: string): void {
        this.show({ title, description, type: 'success' });
    }

    error(title: string, description?: string): void {
        this.show({ title, description, type: 'error' });
    }

    info(title: string, description?: string): void {
        this.show({ title, description, type: 'info' });
    }

    warning(title: string, description?: string): void {
        this.show({ title, description, type: 'warning' });
    }
}
