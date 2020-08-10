import { InteractivityHandler } from "../src/InteractivityHandler";

type Interaction = Slack.Interactivity.Interaction;

const scriptCache = {
    get: jest.fn(function () {
        return null;
    }),
    put: jest.fn(),
    getAll: jest.fn(),
    putAll: jest.fn(),
    remove: jest.fn(),
    removeAll: jest.fn()
};

CacheService['getScriptCache'] = jest.fn(() => scriptCache);
ContentService['createTextOutput'] = jest.fn();

describe('InteractivityHandler', () => {
    describe('handle', () => {
        it('block_actions', () => {
            const handler = new InteractivityHandler('token');
            const payload = {
                type: "block_actions",
                token: "token",
                hash: "hash",
                actions: [
                    {
                        type: "multi_users_select",
                        action_id: "action_id",
                        block_id: "block_id",
                        selected_users: [
                            "UH5FQ4JMD"
                        ],
                        initial_users: [
                            "UH5FQ4JMD"
                        ],
                        action_ts: "1595050566.800301"
                    }
                ]
            }
            const e = {
                parameter: {
                    payload: JSON.stringify(payload)
                }
            };

            const listner = jest.fn();

            handler.addListener("multi_users_select", listner)
            handler.handle(e);

            expect(listner.mock.calls.length).toBe(1);
            expect(listner.mock.calls[0][0]).toEqual(payload);
        });
    });
    describe('addListener', () => {
        it('success', () => {
            const handler = new InteractivityHandler('token');

            handler.addListener('type', (interaction: Interaction): { trigger_id: "dummy" } => { return {} });
        });
    });
});
