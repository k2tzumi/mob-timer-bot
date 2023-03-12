import { SlackApiClient } from "../src/SlackApiClient";

console.warn = jest.fn();

const mockFetch = jest.fn();
let response: {};

UrlFetchApp.fetch = mockFetch;

const responseMock = {
    getResponseCode: jest.fn(function () {
        return 200;
    }),
    getContentText: jest.fn(function () {
        return JSON.stringify(response);
    }),
};
mockFetch.mockReturnValue(responseMock);

describe('SlackApiClient', () => {
    describe('chatScheduleMessage', () => {
        it('success', () => {
            const client = new SlackApiClient('token');
            response = { ok: true, scheduled_message_id: 1 };
            const actual = client.chatScheduleMessage(
                'channel',
                new Date("Mon, 06 Mar 2017 21:22:23 +0000"),
                null,
                [
                    {
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: "header"
                        }
                    },
                    { type: "divider" },
                    {
                        type: "context",
                        elements: [
                            { type: "plain_text", text: "context" }
                        ]
                    }
                ]
            );
            expect(mockFetch.mock.calls[0][0]).toContain('chat.scheduleMessage');
            expect(mockFetch.mock.calls[0][1]).toHaveProperty("payload", "{\"channel\":\"channel\",\"post_at\":1488835343,\"blocks\":[{\"type\":\"header\",\"text\":{\"type\":\"plain_text\",\"text\":\"header\"}},{\"type\":\"divider\"},{\"type\":\"context\",\"elements\":[{\"type\":\"plain_text\",\"text\":\"context\"}]}],\"text\":\"header\\ncontext\"}");
            expect(actual).toBe(1);
        });
    });
    describe('conversationsHistory', () => {
        it('success', () => {
            const client = new SlackApiClient('token');
            response = { ok: true, messages: { test: true } };
            const actual = client.conversationsHistory('channel', 'latest', null, 'oldest');
            expect(mockFetch.mock.calls[1][0]).toContain('conversations.history?channel=channel&inclusive=true&latest=latest&oldest=oldest');
            expect(actual).toHaveProperty('test', true);
        });
    });
});