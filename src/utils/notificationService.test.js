
import { checkAndSendNotifications } from './notificationService';

describe('checkAndSendNotifications', () => {
    let mockSubscriptions;
    let mockProfile;
    let mockNotification;
    let mockStorage;

    beforeEach(() => {
        mockSubscriptions = [];
        mockProfile = {
            notificationsEnabled: true,
            reminderDays: [1, 3]
        };
        mockNotification = jest.fn();
        mockNotification.permission = 'granted';
        mockStorage = {
            getItem: jest.fn(),
            setItem: jest.fn()
        };
    });

    test('should not send notification if disabled in profile', () => {
        mockProfile.notificationsEnabled = false;
        checkAndSendNotifications(mockSubscriptions, mockProfile, mockNotification, mockStorage);
        expect(mockNotification).not.toHaveBeenCalled();
    });

    test('should send notification if subscription is due in reminderDays', () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        mockSubscriptions = [{
            id: '1',
            name: 'Netflix',
            cost: '15',
            currency: 'USD',
            nextBillingDate: tomorrow.toISOString()
        }];

        checkAndSendNotifications(mockSubscriptions, mockProfile, mockNotification, mockStorage);
        expect(mockNotification).toHaveBeenCalledWith('Subscription Reminder 📅', expect.objectContaining({
            body: expect.stringContaining('Netflix')
        }));
        expect(mockStorage.setItem).toHaveBeenCalledWith(
            expect.stringContaining('notified_1'),
            'true'
        );
    });

    test('should not send duplicate notification', () => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        mockSubscriptions = [{
            id: '1',
            name: 'Netflix',
            cost: '15',
            currency: 'USD',
            nextBillingDate: tomorrow.toISOString()
        }];

        mockStorage.getItem.mockReturnValue('true'); // Already notified

        checkAndSendNotifications(mockSubscriptions, mockProfile, mockNotification, mockStorage);
        expect(mockNotification).not.toHaveBeenCalled();
    });

    test('should not send notification if days until is not in reminderDays', () => {
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + 5);

        mockSubscriptions = [{
            id: '1',
            name: 'Netflix',
            cost: '15',
            currency: 'USD',
            nextBillingDate: futureDate.toISOString()
        }];

        checkAndSendNotifications(mockSubscriptions, mockProfile, mockNotification, mockStorage);
        expect(mockNotification).not.toHaveBeenCalled();
    });
});
