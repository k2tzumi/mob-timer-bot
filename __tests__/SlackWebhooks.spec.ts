import { SlackWebhooks } from "../src/SlackWebhooks";
import { NetworkAccessError } from "../src/NetworkAccessError";

console.warn = jest.fn();

const mockFetch = jest.fn();

UrlFetchApp.fetch = mockFetch;

const okIncomingWebhookResponse = {
    getResponseCode: jest.fn(function () {
        return 200;
    }),
    getContentText: jest.fn(function () {
        return 'ok';
    }),
};

const okInteractionsResponseUrlResponse = {
    getResponseCode: jest.fn(function () {
        return 200;
    }),
    getContentText: jest.fn(function () {
        return '{ "ok": true }';
    }),
};

const ngResponse = {
    getResponseCode: jest.fn(function () {
        return 500;
    }),
    getContentText: jest.fn(function () {
        return 'ng';
    }),
};

describe('SlackWebhooks', () => {
    describe('sendText', () => {
        it('ok', () => {
            const incomingWebhookUrl = 'dummy';
            const webhooks = new SlackWebhooks(incomingWebhookUrl);
            mockFetch.mockReturnValue(okIncomingWebhookResponse);
            const actual = webhooks.invoke('dummy');
            expect(mockFetch.mock.calls[0][0]).toBe(incomingWebhookUrl);
            expect(true).toStrictEqual(actual);
        });
        it('ng', () => {
            const incomingWebhookUrl = 'dummy';
            const webhooks = new SlackWebhooks(incomingWebhookUrl);
            mockFetch.mockReturnValue(ngResponse);
            expect(() => { webhooks.invoke('dummy') }).toThrowError(NetworkAccessError);
        });
    });

    describe('invoke', () => {
        it('ok', () => {
            const incomingWebhookUrl = 'dummy';
            const webhooks = new SlackWebhooks(incomingWebhookUrl);
            mockFetch.mockReturnValue(okInteractionsResponseUrlResponse);
            const payload = { delete_original: "true" };
            const actual = webhooks.invoke(payload);
            expect(mockFetch.mock.calls[2][0]).toBe(incomingWebhookUrl);
            expect(mockFetch.mock.calls[2][1]).toHaveProperty("payload", JSON.stringify(payload));
            expect(true).toStrictEqual(actual);
        });
    });
});
