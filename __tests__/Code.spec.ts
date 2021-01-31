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

import { executeSlashCommand, changeOrder, FormValue } from "../src/Code";
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
    describe('changeOrder', () => {
        describe('exists account', () => {
            it('times-0|navigator', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 0 } as FormValue;
                const actionUser = { id: 'b', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['b', 'a', 'c']);
            });
            it('times-0|observer', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 0 } as FormValue;
                const actionUser = { id: 'c', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['c', 'b', 'a']);
            });
            it('times-1|navigator', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 1 } as FormValue;
                const actionUser = { id: 'c', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['a', 'c', 'b']);
            });
            it('times-1|observer', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 1 } as FormValue;
                const actionUser = { id: 'a', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['b', 'a', 'c']);
            });
            it('times-2|navigtor', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 2 } as FormValue;
                const actionUser = { id: 'a', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['c', 'b', 'a']);
            });
            it('times-2|observer', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 2 } as FormValue;
                const actionUser = { id: 'b', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['a', 'c', 'b']);
            });
        });

        describe('new account', () => {
            it('times-0', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 0 } as FormValue;
                const actionUser = { id: 'd', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['d', 'a', 'b', 'c']);
            });
            it('times-1', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 1 } as FormValue;
                const actionUser = { id: 'd', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['a', 'd', 'b', 'c']);
            });
            it('times-2', () => {
                const form: FormValue = { users: ['a', 'b', 'c'], times: 2 } as FormValue;
                const actionUser = { id: 'd', name: 'dummy' };

                const actual = changeOrder(form, actionUser);

                expect(actual).toEqual(['a', 'b', 'd', 'c']);
            });
        });
    });
});
