import { Slack } from "../src/slack/types/index.d";
type Commands = Slack.SlashCommand.Commands;

const properites = {
    getProperty: jest.fn(function () {
        return 'dummy';
    }),
    deleteAllProperties: jest.fn(),
    deleteProperty: jest.fn(),
    getKeys: jest.fn(),
    getProperties: jest.fn(),
    setProperties: jest.fn(),
    setProperty: jest.fn()
};

PropertiesService['getScriptProperties'] = jest.fn(() => properites)
PropertiesService['getUserProperties'] = jest.fn(() => properites)

import { executeSlashCommand } from "../src/Code";
describe('Code', () => {
    describe('executeSlashCommand', () => {
        it('/', () => {
            const commands: Commands = {} as Commands;

            commands.text = '';
            commands.user_id = 'user_id';
            const actual = executeSlashCommand(commands);

            expect(actual).toHaveProperty('response_type', 'in_channel');
            expect(actual).toHaveProperty('blocks');
            expect(actual['blocks'][1]).toHaveProperty('type', 'actions');
        });
        it('direct', () => {
            const commands: Commands = {} as Commands;

            commands.text = '10 @user1 @user2';
            commands.user_id = 'user_id';
            const actual = executeSlashCommand(commands);

            expect(actual).toHaveProperty('response_type', 'in_channel');
            expect(actual['blocks'][1]).toHaveProperty('type', 'actions');
        });
        it('help', () => {
            const commands: Commands = {} as Commands;

            commands.text = 'help';
            const actual = executeSlashCommand(commands);

            expect(actual).toHaveProperty('response_type', 'ephemeral');
            expect(actual).toHaveProperty('text');
        });
    });
});
