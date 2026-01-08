
export const loadSubscriptions = () => {
    try {
        const saved = localStorage.getItem('subscriptions');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        console.error('Failed to load subscriptions', e);
        return [];
    }
};

export const saveSubscriptions = (subscriptions) => {
    try {
        localStorage.setItem('subscriptions', JSON.stringify(subscriptions));
    } catch (e) {
        console.error('Failed to save subscriptions', e);
    }
};

export const loadUserProfile = () => {
    try {
        return {
            name: localStorage.getItem('userName') || '',
            reminderDays: JSON.parse(localStorage.getItem('reminderDays')) || [1, 3],
            notificationsEnabled: localStorage.getItem('notificationsEnabled') === 'true'
        };
    } catch (e) {
        return { name: '', reminderDays: [1, 3], notificationsEnabled: false };
    }
};

export const saveUserProfile = (profile) => {
    if (profile.name !== undefined) localStorage.setItem('userName', profile.name);
    if (profile.reminderDays !== undefined) localStorage.setItem('reminderDays', JSON.stringify(profile.reminderDays));
    if (profile.notificationsEnabled !== undefined) localStorage.setItem('notificationsEnabled', String(profile.notificationsEnabled));
};
