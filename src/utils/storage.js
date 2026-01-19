import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

// Helper to get storage based on platform
const getStorage = () => {
    if (isNative) {
        return Preferences;
    } else if (typeof localStorage !== 'undefined') {
        return {
            get: async ({ key }) => ({ value: localStorage.getItem(key) }),
            set: async ({ key, value }) => localStorage.setItem(key, value),
            remove: async ({ key }) => localStorage.removeItem(key)
        };
    }
    return null;
};

export const loadSubscriptions = async () => {
    try {
        const storage = getStorage();
        if (!storage) {
            console.warn('No storage available');
            return [];
        }

        const { value } = await storage.get({ key: 'subscriptions' });
        console.log('📱 Loading subscriptions:', { value, isNative });
        const parsed = value ? JSON.parse(value) : [];
        console.log('📱 Parsed subscriptions:', parsed.length, parsed);
        return parsed;
    } catch (e) {
        console.error('Failed to load subscriptions', e);
        return [];
    }
};

export const saveSubscriptions = async (subscriptions) => {
    try {
        const storage = getStorage();
        if (!storage) {
            console.warn('No storage available');
            return;
        }

        const value = JSON.stringify(subscriptions);
        console.log('💾 Saving subscriptions:', { count: subscriptions.length, isNative, value });
        await storage.set({
            key: 'subscriptions',
            value: value
        });
        console.log('✅ Subscriptions saved successfully');
    } catch (e) {
        console.error('Failed to save subscriptions', e);
    }
};

export const loadUserProfile = async () => {
    try {
        const storage = getStorage();
        if (!storage) {
            console.warn('No storage available');
            return { name: '', reminderDays: [1, 3], notificationsEnabled: false };
        }

        const [nameResult, daysResult, notifResult] = await Promise.all([
            storage.get({ key: 'userName' }),
            storage.get({ key: 'reminderDays' }),
            storage.get({ key: 'notificationsEnabled' })
        ]);

        return {
            name: nameResult.value || '',
            reminderDays: daysResult.value ? JSON.parse(daysResult.value) : [1, 3],
            notificationsEnabled: notifResult.value === 'true'
        };
    } catch (e) {
        console.error('Failed to load user profile', e);
        return { name: '', reminderDays: [1, 3], notificationsEnabled: false };
    }
};

export const saveUserProfile = async (profile) => {
    try {
        const storage = getStorage();
        if (!storage) {
            console.warn('No storage available');
            return;
        }

        const promises = [];

        if (profile.name !== undefined) {
            promises.push(storage.set({ key: 'userName', value: profile.name }));
        }
        if (profile.reminderDays !== undefined) {
            promises.push(storage.set({ key: 'reminderDays', value: JSON.stringify(profile.reminderDays) }));
        }
        if (profile.notificationsEnabled !== undefined) {
            promises.push(storage.set({ key: 'notificationsEnabled', value: String(profile.notificationsEnabled) }));
        }

        await Promise.all(promises);
    } catch (e) {
        console.error('Failed to save user profile', e);
    }
};

// Sync function for API key (for compatibility)
export const getApiKey = async () => {
    try {
        const storage = getStorage();
        if (!storage) return '';
        const { value } = await storage.get({ key: 'geminiApiKey' });
        return value || '';
    } catch (e) {
        console.error('Failed to get API key', e);
        return '';
    }
};

export const setApiKey = async (key) => {
    try {
        const storage = getStorage();
        if (!storage) return;
        if (key) {
            await storage.set({ key: 'geminiApiKey', value: key });
        } else {
            await storage.remove({ key: 'geminiApiKey' });
        }
    } catch (e) {
        console.error('Failed to set API key', e);
    }
};