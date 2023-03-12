import { SlackHandler } from "./SlackHandler";
import { DuplicateEventError } from "./CallbackEventHandler";
import { OAuth2Handler } from "./OAuth2Handler";
import { Slack } from "./slack/types/index.d";
import { SlackWebhooks } from "./SlackWebhooks";
import { SlackApiClient } from "./SlackApiClient";
import { SlashCommandFunctionResponse } from "./SlashCommandHandler";
import "apps-script-jobqueue";
import { SlackCredentialStore } from "./SlackCredentialStore";
import { SlackConfigurator } from "./SlackConfigurator";

type TextOutput = GoogleAppsScript.Content.TextOutput;
type HtmlOutput = GoogleAppsScript.HTML.HtmlOutput;
type DoPost = GoogleAppsScript.Events.DoPost;
type DoGet = GoogleAppsScript.Events.DoGet;
type Commands = Slack.SlashCommand.Commands;
type MultiUsersSelectAction = Slack.Interactivity.MultiUsersSelectAction;
type BlockActions = Slack.Interactivity.BlockActions;
type StaticSelectAction = Slack.Interactivity.StaticSelectAction;
type ButtonAction = Slack.Interactivity.ButtonAction;
type InteractionResponse = Slack.Interactivity.InteractionResponse;
type AppsManifest = Slack.Tools.AppsManifest;
type Parameter = AppsScriptJobqueue.Parameter;
type TimeBasedEvent = AppsScriptJobqueue.TimeBasedEvent;

const properties = PropertiesService.getScriptProperties();

let handler: OAuth2Handler;

const handleCallback = (request): HtmlOutput => {
  initializeOAuth2Handler();
  return handler.authCallback(request);
};

function jobEventHandler(event: TimeBasedEvent): void {
  JobBroker.consumeJob(event, globalThis);
}

function initializeOAuth2Handler(): void {
  const properties = PropertiesService.getScriptProperties();
  const slackCredentialStore = new SlackCredentialStore(properties);
  const credential = slackCredentialStore.getCredential();

  handler = new OAuth2Handler(
    credential,
    PropertiesService.getUserProperties(),
    handleCallback.name
  );
}

/**
 * Authorizes and makes a request to the Slack API.
 */
function doGet(request: DoGet): HtmlOutput {
  initializeOAuth2Handler();

  // Clear authentication by accessing with the get parameter `?logout=true`
  if (request.parameter.hasOwnProperty("logout")) {
    handler.clearService();
    const properties = PropertiesService.getScriptProperties();
    const slackCredentialStore = new SlackCredentialStore(properties);
    slackCredentialStore.removeCredential();
    const slackConfigurator = new SlackConfigurator();
    slackConfigurator.deleteApps();

    const template = HtmlService.createTemplate(
      'Logout<br /><a href="<?= requestUrl ?>" target="_parent">refresh</a>.'
    );
    template.requestUrl = ScriptApp.getService().getUrl();
    return HtmlService.createHtmlOutput(template.evaluate());
  }
  // Reinstall the Slack app by accessing it with the get parameter `?reinstall=true`
  if (request.parameter.hasOwnProperty("reinstall")) {
    const slackConfigurator = new SlackConfigurator();
    const permissionsUpdated = slackConfigurator.updateApps(
      createAppsManifest([handler.callbackURL], handler.requestURL)
    );

    let template: HtmlTemplate;
    if (permissionsUpdated) {
      template = HtmlService.createTemplate(
        `You’ve changed the permission scopes your app uses. Please <a href="<?= reInstallUrl ?>" target="_parent">reinstall your app</a> for these changes to take effect.`
      );
      template.reInstallUrl = handler.reInstallUrl;
    } else {
      template = HtmlService.createTemplate(
        `Reinstallation is complete.<br /><a href="<?= requestUrl ?>" target="_parent">refresh</a>.`
      );
      template.requestUrl = ScriptApp.getService().getUrl();
    }
    return HtmlService.createHtmlOutput(template.evaluate()).setTitle("");
  }

  if (handler.verifyAccessToken()) {
    const template = HtmlService.createTemplate(
      "OK!<br />" +
        '<a href="<?!= reInstallUrl ?>" target="_parent" style="align-items:center;color:#000;background-color:#fff;border:1px solid #ddd;border-radius:4px;display:inline-flex;font-family:Lato, sans-serif;font-size:16px;font-weight:600;height:48px;justify-content:center;text-decoration:none;width:236px"><svg xmlns="http://www.w3.org/2000/svg" style="height:20px;width:20px;margin-right:12px" viewBox="0 0 122.8 122.8"><path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"></path><path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"></path><path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"></path><path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"></path></svg>Reinstall to Slack</a>'
    );
    template.reInstallUrl = handler.requestURL + "?reinstall=true";
    return HtmlService.createHtmlOutput(template.evaluate()).setTitle(
      "Installation on Slack is complete"
    );
  }
  if (request.parameter.hasOwnProperty("token")) {
    return configuration(request.parameter);
  } else {
    const template = HtmlService.createTemplate(
      '<a href="https://api.slack.com/authentication/config-tokens#creating" target="_blank">Create configuration token</a><br />' +
        '<form action="<?!= requestURL ?>" method="get" target="_parent"><p>Configuration Tokens(Refresh Token):<input type="password" name="token" value="<?!= refreshToken ?>"></p><input type="submit" name="" value="Create App"></form>'
    );
    template.requestURL = handler.requestURL;
    template.refreshToken = new SlackConfigurator().refresh_token;
    return HtmlService.createHtmlOutput(template.evaluate()).setTitle(
      "Start Slack application configuration."
    );
  }
}

function configuration(data: { [key: string]: string }): HtmlOutput {
  const slackConfigurator = new SlackConfigurator(data.token);
  const credentail = slackConfigurator.createApps(createAppsManifest());
  const properties = PropertiesService.getScriptProperties();
  const slackCredentialStore = new SlackCredentialStore(properties);

  slackCredentialStore.setCredential(credentail);

  const oAuth2Handler = new OAuth2Handler(
    credentail,
    PropertiesService.getUserProperties(),
    handleCallback.name
  );

  slackConfigurator.updateApps(
    createAppsManifest([oAuth2Handler.callbackURL], oAuth2Handler.requestURL)
  );

  const template = HtmlService.createTemplate(
    '<a href="<?!= installUrl ?>" target="_parent" style="align-items:center;color:#000;background-color:#fff;border:1px solid #ddd;border-radius:4px;display:inline-flex;font-family:Lato, sans-serif;font-size:16px;font-weight:600;height:48px;justify-content:center;text-decoration:none;width:236px"><svg xmlns="http://www.w3.org/2000/svg" style="height:20px;width:20px;margin-right:12px" viewBox="0 0 122.8 122.8"><path d="M25.8 77.6c0 7.1-5.8 12.9-12.9 12.9S0 84.7 0 77.6s5.8-12.9 12.9-12.9h12.9v12.9zm6.5 0c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9v32.3c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V77.6z" fill="#e01e5a"></path><path d="M45.2 25.8c-7.1 0-12.9-5.8-12.9-12.9S38.1 0 45.2 0s12.9 5.8 12.9 12.9v12.9H45.2zm0 6.5c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H12.9C5.8 58.1 0 52.3 0 45.2s5.8-12.9 12.9-12.9h32.3z" fill="#36c5f0"></path><path d="M97 45.2c0-7.1 5.8-12.9 12.9-12.9s12.9 5.8 12.9 12.9-5.8 12.9-12.9 12.9H97V45.2zm-6.5 0c0 7.1-5.8 12.9-12.9 12.9s-12.9-5.8-12.9-12.9V12.9C64.7 5.8 70.5 0 77.6 0s12.9 5.8 12.9 12.9v32.3z" fill="#2eb67d"></path><path d="M77.6 97c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9-12.9-5.8-12.9-12.9V97h12.9zm0-6.5c-7.1 0-12.9-5.8-12.9-12.9s5.8-12.9 12.9-12.9h32.3c7.1 0 12.9 5.8 12.9 12.9s-5.8 12.9-12.9 12.9H77.6z" fill="#ecb22e"></path></svg>Add to Slack</a>'
  );
  template.installUrl = oAuth2Handler.installUrl;

  return HtmlService.createHtmlOutput(template.evaluate()).setTitle(
    "Slack application configuration is complete."
  );
}

function createAppsManifest(
  redirectUrls: string[] = [],
  requestUrl = ""
): AppsManifest {
  const appsManifest = {
    display_information: {
      name: "mob-timer-bot",
    },
  } as AppsManifest;

  if (redirectUrls.length !== 0 && requestUrl !== "") {
    appsManifest.features = {
      bot_user: {
        display_name: "mobtimerbot",
        always_online: false,
      },
      slash_commands: [
        {
          command: "/mob",
          url: requestUrl,
          description: "Mob programming timer",
          usage_hint: "[n minitues][@user1 @user2]",
          should_escape: false,
        },
      ],
    };

    appsManifest.oauth_config = {
      redirect_urls: redirectUrls,
      scopes: {
        bot: OAuth2Handler.SCOPE.split(","),
      },
    };

    appsManifest.settings = {
      interactivity: {
        is_enabled: true,
        request_url: requestUrl,
      },
    };
  }

  return appsManifest;
}

function asyncLogging(parameter: Parameter): boolean {
  console.info(JSON.stringify(parameter));
  return true;
}

function doPost(e: DoPost): TextOutput {
  initializeOAuth2Handler();
  const properties = PropertiesService.getScriptProperties();
  const slackCredentialStore = new SlackCredentialStore(properties);
  const credentail = slackCredentialStore.getCredential();
  const slackHandler = new SlackHandler(credentail.verification_token);

  slackHandler.addCommandListener(
    e.parameter.command ?? "command",
    executeSlashCommand
  );
  slackHandler.addInteractivityListener(
    "multi_users_select",
    executeMultiUserSelect
  );
  slackHandler.addInteractivityListener("static_select", executeStaticSelect);
  slackHandler.addInteractivityListener("button", executeButton);

  try {
    const process = slackHandler.handle(e);

    if (process.performed) {
      return process.output;
    }
  } catch (exception) {
    if (exception instanceof DuplicateEventError) {
      return ContentService.createTextOutput();
    } else {
      JobBroker.enqueueAsyncJob<Parameter>(asyncLogging, {
        message: exception.message,
        stack: exception.stack,
      });
      throw exception;
    }
  }

  throw new Error(`No performed handler, request: ${JSON.stringify(e)}`);
}

const executeSlashCommand = (
  commands: Commands
): SlashCommandFunctionResponse | null => {
  const response: SlashCommandFunctionResponse =
    {} as SlashCommandFunctionResponse;

  if (commands.text) {
    const parameters = commands.text.split(" ");

    const form: FormValue = {
      time: parseInt(parameters.shift(), 10),
      users: parameters
        .filter((user) => user.match(/^@(.*)$/))
        .map((user) => user.replace(/^@(.*)$/, "$1")),
    };

    if (
      commands.text === "help" ||
      isNaN(form.time) ||
      !form.users ||
      !Object.keys(form.users).length
    ) {
      response.response_type = "ephemeral";
      response.text = `*Usage*\n* ${commands.command}\n* ${commands.command} [n minitues][@user1 @user2]\n* ${commands.command} help`;
    } else {
      response.response_type = "in_channel";
      response.blocks = createConfirmBlocks(form);
    }
  } else {
    response.response_type = "in_channel";
    response.blocks = createSelectUserBlocks(commands.user_id);
  }

  return response;
};

function createSelectUserBlocks(user_id: string): object {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":one: Pick users from the list.",
      },
      accessory: {
        action_id: "members",
        type: "multi_users_select",
        placeholder: {
          type: "plain_text",
          text: "Select users",
        },
        initial_users: [user_id],
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel",
          },
          value: '{ "cancel": true }',
          action_id: "cancel",
        },
      ],
    },
  ];
}

const executeMultiUserSelect = (
  blockActions: BlockActions
): Record<never, never> => {
  const action = blockActions.actions[0] as MultiUsersSelectAction;

  const webhook = new SlackWebhooks(blockActions.response_url);
  const response: InteractionResponse = {
    replace_original: "true",
    blocks: createSelectTimerBlocks(action.selected_users),
  };
  if (!webhook.invoke(response)) {
    throw new Error(
      `executeMultiUserSelect faild. event: ${JSON.stringify(blockActions)}`
    );
  }

  return {};
};

function createSelectTimerBlocks(selected_users: string[]): object {
  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:one: Pick users from the list. :white_check_mark:\n${createSelectUserList(
            selected_users
          )}\nselected.`,
        },
      ],
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:two: Select an time.`,
      },
      accessory: {
        action_id: "time",
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select an time",
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "10 minutes",
            },
            value: createFormValue(selected_users, 10),
          },
          {
            text: {
              type: "plain_text",
              text: "15 minutes",
            },
            value: createFormValue(selected_users, 15),
          },
          {
            text: {
              type: "plain_text",
              text: "20 minutes",
            },
            value: createFormValue(selected_users, 20),
          },
          {
            text: {
              type: "plain_text",
              text: "25 minutes",
            },
            value: createFormValue(selected_users, 25),
          },
          {
            text: {
              type: "plain_text",
              text: "30 minutes",
            },
            value: createFormValue(selected_users, 30),
          },
        ],
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel",
          },
          value: '{ "cancel": true }',
          action_id: "cancel",
        },
      ],
    },
  ];
}

function createSelectUserList(selected_users: string[]): string {
  return selected_users.map<string>((user) => `<@${user}>`).join(", ");
}

interface FormValue {
  users: string[];
  time?: number;
  scheduled_message_id?: string;
  times?: number;
  finish_at?: number;
  remaining_time?: number;
  start_time?: number;
}

function createFormValue(
  users: string[],
  time: number,
  scheduled_message_id: string = null,
  times: number = null,
  finish_at: number = null,
  remaining_time: number = null,
  start_time: number = null
): string {
  let form: FormValue = {
    users,
    time,
  };
  if (scheduled_message_id) {
    form = { ...form, scheduled_message_id };
  }
  if (times) {
    form = { ...form, times };
  }
  if (finish_at) {
    form = { ...form, finish_at };
  }
  if (remaining_time) {
    form = { ...form, remaining_time };
  }
  if (start_time) {
    form = { ...form, start_time };
  }

  return JSON.stringify(form);
}

const executeStaticSelect = (
  blockActions: BlockActions
): Record<never, never> => {
  const action = blockActions.actions[0] as StaticSelectAction;

  const webhook = new SlackWebhooks(blockActions.response_url);
  const response: InteractionResponse = {
    replace_original: "true",
    blocks: createConfirmBlocks(JSON.parse(action.selected_option.value)),
  };

  if (!webhook.invoke(response)) {
    throw new Error(
      `executeStaticSelect faild. event: ${JSON.stringify(blockActions)}`
    );
  }

  return {};
};

function createConfirmBlocks(form: FormValue): object {
  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:one: Pick users from the list. :white_check_mark:\n${createSelectUserList(
            form.users
          )}\nselected.\n:two: Select an time :white_check_mark:.\n${
            form.time
          } minutes selected.`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Shuffle Start :game_die:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            null,
            null,
            null,
            form.start_time
          ),
          style: "primary",
          action_id: "shuffle",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Nomal Start :motorway:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            0,
            null,
            null,
            form.start_time
          ),
          style: "primary",
          action_id: "start",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel",
          },
          value: '{ "cancel": true }',
          action_id: "cancel",
        },
      ],
    },
  ];
}

// min 1 minutes(Accept suspend time), max 360 minutes(Maximum cache retention time)
const COUNT_DOWN_NOTIFICATION_TIME: number = parseInt(
  properties.getProperty("COUNT_DOWN_NOTIFICATION_TIME") || "5",
  10
);
const executeButton = (blockActions: BlockActions): Record<never, never> => {
  const action = blockActions.actions[0] as ButtonAction;
  const response: InteractionResponse = {};

  const webhook = new SlackWebhooks(blockActions.response_url);
  const client = new SlackApiClient(handler.token);
  const blocks = blockActions.message.blocks;
  blocks.pop();
  const form: FormValue = JSON.parse(action.value);
  const channel: string = blockActions.channel.id;

  switch (action.action_id) {
    case "cancel":
      response.delete_original = "true";
      break;
    case "shuffle": {
      webhook.invoke({ replace_original: "true", blocks });

      client.chatPostMessage(
        channel,
        null,
        null,
        null,
        createStartBlocks(form)
      );
      return {};
    }
    case "reshuffle":
      webhook.invoke({
        replace_original: "true",
        blocks: createStartBlocks(form),
      });
      return {};
    case "continue": {
      const currentUser = form.users[form.times % form.users.length];
      // other user takes an action
      if (
        !(
          currentUser === blockActions.user.id ||
          currentUser === blockActions.user.name
        )
      ) {
        client.chatPostMessage(
          channel,
          null,
          null,
          null,
          createConfirmChangeBlocks(form, blockActions.user)
        );

        return {};
      }
      blocks.pop();
    }
    case "resume":
    case "recontinue":
    case "change":
    case "start":
    case "restart": {
      webhook.invoke({ replace_original: "true", blocks });
      const endTime = new Date();
      // Set end time
      if (form.remaining_time) {
        endTime.setTime(endTime.getTime() + form.remaining_time);
      } else {
        endTime.setMinutes(endTime.getMinutes() + form.time);
        form.remaining_time = form.time * 1000 * 60;
      }
      form.finish_at = endTime.getTime();
      // Set start time
      if (form.start_time == null) {
        form.start_time = new Date().getTime();
      }

      form.scheduled_message_id = client.chatScheduleMessage(
        channel,
        endTime,
        null,
        shouldTakeBreak(form, form.finish_at)
          ? createBreakBlocks(form)
          : createMobedBlocks(form)
      );

      const ts = client.chatPostMessage(
        channel,
        null,
        null,
        null,
        createMobbingBlocks(form)
      );

      // Create count down job
      const countDownTime = new Date(endTime);
      // Set end time
      countDownTime.setMinutes(
        countDownTime.getMinutes() - COUNT_DOWN_NOTIFICATION_TIME
      );
      if (countDownTime.getTime() > Date.now()) {
        JobBroker.createDelaydJob<{
          channel: string;
          ts: string;
          form: FormValue;
        }>(countDownTime).performLater(countDown, {
          channel,
          ts,
          form,
        });
      }

      return {};
    }
    case "turn_end": {
      webhook.invoke({ replace_original: "true", blocks });
      if (
        !client.chatDeleteScheduleMessage(channel, form.scheduled_message_id)
      ) {
        if (form.finish_at > Date.now()) {
          client.chatPostMessage(
            channel,
            "Please wait for a moment to finish."
          );
        }
        return {};
      }

      client.chatPostMessage(
        channel,
        null,
        null,
        null,
        shouldTakeBreak(form)
          ? createBreakBlocks(form)
          : createMobedBlocks(form)
      );

      return {};
    }
    case "rested": {
      webhook.invoke({ replace_original: "true", blocks });

      // Set start time
      form.start_time = new Date().getTime();

      client.chatPostMessage(
        channel,
        null,
        null,
        null,
        createRestartBlocks(form)
      );

      return {};
    }
    case "break": {
      webhook.invoke({ replace_original: "true", blocks });
      if (
        !client.chatDeleteScheduleMessage(channel, form.scheduled_message_id)
      ) {
        if (form.finish_at > Date.now()) {
          client.chatPostMessage(
            channel,
            "Please wait for a moment to finish."
          );
        }
        return {};
      }
      form.remaining_time = form.finish_at - Date.now();
      form.scheduled_message_id = null;
      client.chatPostMessage(channel, null, null, null, createRestBlocks(form));

      return {};
    }
    case "finish":
      webhook.invoke({ replace_original: "true", blocks });

      client.chatPostMessage(channel, createFinishMessage(form));

      return {};
  }

  if (!webhook.invoke(response)) {
    throw new Error(
      `executeButton faild. event: ${JSON.stringify(blockActions)}`
    );
  }

  return {};
};

function shouldTakeBreak(form: FormValue, now: number = null): boolean {
  const workTime = form.start_time - now ?? new Date().getTime();

  // Over 75 min
  return Math.abs(workTime) / (60 * 1000) > 75;
}

function createStartBlocks(form: FormValue): object {
  const users = shuffle(form.users);
  const userOrder = users
    .map<string>((user, index) => `${index + 1}. <@${user}>`)
    .join(", ");

  form.users = users;

  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:dart: Order\n${userOrder}\n:timer_clock: ${form.time} minutes`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Start Mobbing :motorway:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            0,
            null,
            null,
            form.start_time
          ),
          style: "primary",
          action_id: "start",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "One more :game_die:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            null,
            null,
            null,
            form.start_time
          ),
          action_id: "reshuffle",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel",
          },
          value: '{ "cancel": true }',
          action_id: "cancel",
        },
      ],
    },
  ];
}

function createMobbingBlocks(form: FormValue): object {
  const times = form.times ?? 0;

  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${convertTimes(
            times
          )} mob. :man-woman-boy:\n:oncoming_automobile: Driver(${pickUser(
            form.users,
            times
          )}), :world_map: Navigater(${pickUser(form.users, times + 1)})`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:clock9: *${Utilities.formatDate(
            new Date(form.finish_at),
            "JST",
            "HH:mm:ss"
          )}* (_${convertRemingTime(form.remaining_time)} later_)`,
        },
      ],
    },
    createTurnEndActionBlock(form),
  ];
}

function createTurnEndActionBlock(form: FormValue): object {
  const blocks: { type: string; elements: object[] } = {
    type: "actions",
    elements: [
      {
        type: "button",
        text: {
          type: "plain_text",
          text: "Turn End :black_joker:",
        },
        value: createFormValue(
          form.users,
          form.time,
          form.scheduled_message_id,
          form.times,
          form.finish_at,
          form.start_time
        ),
        style: "primary",
        action_id: "turn_end",
      },
    ],
  };

  if (form.finish_at > Date.now()) {
    blocks.elements.push({
      type: "button",
      text: {
        type: "plain_text",
        text: "Take a break :coffee:",
      },
      value: createFormValue(
        form.users,
        form.time,
        form.scheduled_message_id,
        form.times,
        form.finish_at,
        form.start_time
      ),
      action_id: "break",
    });
  }

  return blocks;
}

function convertTimes(times?: number): string {
  switch (times) {
    case 0:
      return "1st";
    case 1:
      return "2nd";
    case 2:
      return "3rd";
    default:
      return `${times + 1}th`;
  }
}

function createMobedBlocks(form: FormValue): object {
  let times = form.times ?? 0;
  // next times
  times++;
  const emoji = times % 2 === 0 ? ":+1:" : ":clap:";

  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:alarm_clock: Thank you ${pickUser(
            form.users,
            times - 1
          )}${emoji}`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${convertTimes(
            times
          )} mob. :man-woman-boy:\n:oncoming_automobile: Driver(${pickUser(
            form.users,
            times
          )}), :world_map: Navigator(${pickUser(form.users, times + 1)})`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Continue :raised_hands:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            times,
            null,
            null,
            form.start_time
          ),
          style: "primary",
          action_id: "continue",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Finish :checkered_flag:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            times,
            null,
            null,
            form.start_time
          ),
          style: "danger",
          confirm: {
            title: {
              type: "plain_text",
              text: "Are you sure?",
            },
            text: {
              type: "mrkdwn",
              text: "Do you want to exit mob?",
            },
            confirm: {
              type: "plain_text",
              text: "Do Finish",
            },
            deny: {
              type: "plain_text",
              text: "Go back to mob",
            },
          },
          action_id: "finish",
        },
      ],
    },
  ];
}

function createBreakBlocks(form: FormValue): object {
  const times = form.times ?? 0;
  const emoji = times % 2 === 0 ? ":+1:" : ":clap:";

  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:alarm_clock: Thank you ${pickUser(
            form.users,
            times
          )}${emoji}`,
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `Why don't we take a break? :coffee:`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Rested enough :relaxed:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            times,
            null,
            null,
            null
          ),
          style: "primary",
          action_id: "rested",
        },
      ],
    },
  ];
}

function createRestBlocks(form: FormValue): object {
  const times = form.times ?? 0;

  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: "Let's make a pit stop! :fuelpump:",
        },
      ],
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${convertTimes(
            times
          )} mob breaking. :man-woman-boy:\n:oncoming_automobile: Driver(${pickUser(
            form.users,
            times
          )}), :world_map: Navigator(${pickUser(
            form.users,
            times + 1
          )})\nActive time remaining is ${convertRemingTime(
            form.remaining_time
          )}`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Get back to drive :racing_car:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            times,
            form.finish_at,
            form.remaining_time,
            // reset
            null
          ),
          style: "primary",
          action_id: "resume",
        },
      ],
    },
  ];
}

function convertRemingTime(remaining_time: number): string {
  const seconds = Math.floor(remaining_time / 1000);
  const minutes = Math.floor(seconds / 60);
  if (seconds - minutes * 60 === 0) {
    return `${minutes} minutes`;
  } else {
    return `${minutes} minutes, ${seconds - minutes * 60} seconds`;
  }
}

function createFinishMessage(form: FormValue): string {
  let message = "";
  if (form.times) {
    message = `:trophy: ${form.times} mobs completed.\n`;
  }

  return `${message}Thank you for everything. ${createSelectUserList(
    form.users
  )} :confetti_ball:`;
}

function countDown(parameter: {
  channel: string;
  ts: string;
  form: FormValue;
}): boolean {
  initializeOAuth2Handler();
  const { channel, ts, form } = parameter;

  const client = new SlackApiClient(handler.token);

  const messages = client.conversationsHistory(channel, ts, 1, ts);

  const blocks = messages[0].blocks;
  const block = blocks.pop();

  // Exists action button
  if (block.type === "actions") {
    client.chatUpdate(channel, ts, null, blocks);
    client.chatPostMessage(
      channel,
      null,
      null,
      null,
      createCountDownBlocks(form)
    );
  }

  return true;
}

function createCountDownBlocks(form: FormValue): object {
  const times = form.times ?? 0;

  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:hourglass_flowing_sand: Hey, ${pickUser(
            form.users,
            times
          )}. ${convertTimes(
            times
          )} mob will finish in ${COUNT_DOWN_NOTIFICATION_TIME} minutes.`,
        },
      ],
    },
    createTurnEndActionBlock(form),
  ];
}

function createConfirmChangeBlocks(
  form: FormValue,
  actionUser: { id: string; name: string }
): object {
  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `The next driver is ${pickUser(
            form.users,
            form.times
          )}.\n Do you want <@${actionUser.id}> to take over?`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Take over",
          },
          value: createFormValue(
            changeOrder(form, actionUser),
            form.time,
            null,
            form.times,
            null,
            null,
            form.start_time
          ),
          style: "primary",
          action_id: "change",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "In order",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            form.times,
            null,
            null,
            form.start_time
          ),
          action_id: "recontinue",
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel",
          },
          value: '{ "cancel": true }',
          action_id: "cancel",
        },
      ],
    },
  ];
}

function createRestartBlocks(form: FormValue): object {
  let times = form.times ?? 0;
  // next times
  times++;

  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `The next time.. ${convertTimes(
            times
          )} mob. :man-woman-boy:\n pair :oncoming_automobile: Driver(${pickUser(
            form.users,
            times
          )}), :world_map: Navigater(${pickUser(
            form.users,
            times + 1
          )}).\nReady to go?`,
        },
      ],
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "I'm all set :ok_hand:",
          },
          value: createFormValue(
            form.users,
            form.time,
            null,
            times,
            null,
            null,
            null
          ),
          style: "primary",
          action_id: "restart",
        },
      ],
    },
  ];
}

function changeOrder(
  form: FormValue,
  actionUser: { id: string; name: string }
): string[] {
  const users = [...form.users];
  const swapIndex = getUserIndex(form, actionUser);

  const currentIndex = form.times % users.length;
  const currentUser = users[currentIndex];

  if (swapIndex === -1) {
    users.splice(currentIndex, 0, actionUser.id);
  } else {
    users[currentIndex] = users[swapIndex];
    users[swapIndex] = currentUser;
  }

  return users;
}

function getUserIndex(
  form: FormValue,
  actionUser: { id: string; name: string }
): number {
  const users = [...form.users];
  const swapIndex = users.indexOf(actionUser.id);

  if (swapIndex === -1) {
    return users.indexOf(actionUser.name);
  }

  return swapIndex;
}

const shuffle = ([...array]) => {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

function pickUser(users: string[], times: number) {
  const user = users[times % users.length];
  return `<@${user}>`;
}

export {
  executeSlashCommand,
  changeOrder,
  FormValue,
  doGet,
  doPost,
  jobEventHandler,
};
