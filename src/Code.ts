import { SlackHandler } from "./SlackHandler";
import { DuplicateEventError } from "./CallbackEventHandler";
import { JobBroker } from "./JobBroker";
import { OAuth2Handler } from "./OAuth2Handler";
import { Slack } from "./slack/types/index.d";
import { SlackWebhooks } from "./SlackWebhooks";
import { SlackApiClient } from "./SlackApiClient";
import { SlashCommandFunctionResponse } from "./SlashCommandHandler";
import { DelayedJobBroker } from "./DelayedJobBroker";

type TextOutput = GoogleAppsScript.Content.TextOutput;
type HtmlOutput = GoogleAppsScript.HTML.HtmlOutput;
type Commands = Slack.SlashCommand.Commands;
type MultiUsersSelectAction = Slack.Interactivity.MultiUsersSelectAction;
type BlockActions = Slack.Interactivity.BlockActions;
type StaticSelectAction = Slack.Interactivity.StaticSelectAction;
type ButtonAction = Slack.Interactivity.ButtonAction;
type InteractionResponse = Slack.Interactivity.InteractionResponse;

const properties = PropertiesService.getScriptProperties();

const CLIENT_ID: string = properties.getProperty("CLIENT_ID");
const CLIENT_SECRET: string = properties.getProperty("CLIENT_SECRET");
let handler: OAuth2Handler;

const handleCallback = (request): HtmlOutput => {
  initializeOAuth2Handler();
  return handler.authCallback(request);
};

function initializeOAuth2Handler(): void {
  handler = new OAuth2Handler(
    CLIENT_ID,
    CLIENT_SECRET,
    PropertiesService.getUserProperties(),
    handleCallback.name
  );
}

/**
 * Authorizes and makes a request to the Slack API.
 */
function doGet(request): HtmlOutput {
  initializeOAuth2Handler();

  // Clear authentication by accessing with the get parameter `?logout=true`
  if (request.parameter.logout) {
    handler.clearService();
    const template = HtmlService.createTemplate(
      'Logout<br /><a href="<?= requestUrl ?>" target="_blank">refresh</a>.'
    );
    template.requestUrl = handler.requestURL;
    return HtmlService.createHtmlOutput(template.evaluate());
  }

  if (handler.verifyAccessToken()) {
    return HtmlService.createHtmlOutput("OK");
  } else {
    const template = HtmlService.createTemplate(
      'RedirectUri:<?= redirectUrl ?> <br /><a href="<?= authorizationUrl ?>" target="_blank">Authorize</a>.'
    );
    template.authorizationUrl = handler.authorizationUrl;
    template.redirectUrl = handler.redirectUri;
    return HtmlService.createHtmlOutput(template.evaluate());
  }
}

const asyncLogging = (): void => {
  const jobBroker: JobBroker = new JobBroker();
  jobBroker.consumeJob((parameter: {}) => {
    console.info(JSON.stringify(parameter));
  });
};

const VERIFICATION_TOKEN: string = properties.getProperty("VERIFICATION_TOKEN");
const COMMAND = "/mob";

function doPost(e): TextOutput {
  initializeOAuth2Handler();

  const slackHandler = new SlackHandler(VERIFICATION_TOKEN);

  slackHandler.addCommandListener(COMMAND, executeSlashCommand);
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
      new JobBroker().enqueue(asyncLogging, {
        message: exception.message,
        stack: exception.stack
      });
      throw exception;
    }
  }

  throw new Error(`No performed handler, request: ${JSON.stringify(e)}`);
}

const executeSlashCommand = (
  commands: Commands
): SlashCommandFunctionResponse | null => {
  const response: SlashCommandFunctionResponse = {} as SlashCommandFunctionResponse;

  if (commands.text) {
    const parameters = commands.text.split(" ");

    const form: FormValue = {
      time: parseInt(parameters.shift(), 10),
      users: parameters
        .filter(user => user.match(/^@(.*)$/))
        .map(user => user.replace(/^@(.*)$/, "$1"))
    };

    if (
      commands.text === "help" ||
      isNaN(form.time) ||
      !form.users ||
      !Object.keys(form.users).length
    ) {
      response.response_type = "ephemeral";
      response.text = `*Usage*\n* ${COMMAND}\n* ${COMMAND} [n minitues][@user1 @user2]\n* ${COMMAND} help`;
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

function createSelectUserBlocks(user_id: string): {}[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: ":one: Pick users from the list."
      },
      accessory: {
        action_id: "members",
        type: "multi_users_select",
        placeholder: {
          type: "plain_text",
          text: "Select users"
        },
        initial_users: [user_id]
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel"
          },
          value: '{ "cancel": true }',
          action_id: "cancel"
        }
      ]
    }
  ];
}

const executeMultiUserSelect = (blockActions: BlockActions): {} => {
  const action = blockActions.actions[0] as MultiUsersSelectAction;

  const webhook = new SlackWebhooks(blockActions.response_url);
  const response: InteractionResponse = {
    replace_original: "true",
    blocks: createSelectTimerBlocks(action.selected_users)
  };
  if (!webhook.invoke(response)) {
    throw new Error(
      `executeMultiUserSelect faild. event: ${JSON.stringify(blockActions)}`
    );
  }

  return {};
};

function createSelectTimerBlocks(selected_users: string[]): {}[] {
  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:one: Pick users from the list. :white_check_mark:\n${createSelectUserList(
            selected_users
          )}\nselected.`
        }
      ]
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:two: Select an time.`
      },
      accessory: {
        action_id: "time",
        type: "static_select",
        placeholder: {
          type: "plain_text",
          text: "Select an time"
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "10 minutes"
            },
            value: createFormValue(selected_users, 10)
          },
          {
            text: {
              type: "plain_text",
              text: "15 minutes"
            },
            value: createFormValue(selected_users, 15)
          },
          {
            text: {
              type: "plain_text",
              text: "20 minutes"
            },
            value: createFormValue(selected_users, 20)
          },
          {
            text: {
              type: "plain_text",
              text: "25 minutes"
            },
            value: createFormValue(selected_users, 25)
          },
          {
            text: {
              type: "plain_text",
              text: "30 minutes"
            },
            value: createFormValue(selected_users, 30)
          }
        ]
      }
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel"
          },
          value: '{ "cancel": true }',
          action_id: "cancel"
        }
      ]
    }
  ];
}

function createSelectUserList(selected_users: string[]): string {
  return selected_users.map<string>(user => `<@${user}>`).join(", ");
}

interface FormValue {
  users: string[];
  time?: number;
  scheduled_message_id?: string;
  times?: number;
}

function createFormValue(
  users: string[],
  time: number,
  scheduled_message_id: string = null,
  times: number = null
): string {
  let form: FormValue = {
    users,
    time
  };
  if (scheduled_message_id) {
    form = { ...form, scheduled_message_id };
  }
  if (times) {
    form = { ...form, times };
  }

  return JSON.stringify(form);
}

const executeStaticSelect = (blockActions: BlockActions): {} => {
  const action = blockActions.actions[0] as StaticSelectAction;

  const webhook = new SlackWebhooks(blockActions.response_url);
  const response: InteractionResponse = {
    replace_original: "true",
    blocks: createConfirmBlocks(JSON.parse(action.selected_option.value))
  };

  if (!webhook.invoke(response)) {
    throw new Error(
      `executeStaticSelect faild. event: ${JSON.stringify(blockActions)}`
    );
  }

  return {};
};

function createConfirmBlocks(form: FormValue): {}[] {
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
          } minutes selected.`
        }
      ]
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Shuffle Start :twisted_rightwards_arrows:"
          },
          value: createFormValue(form.users, form.time),
          style: "primary",
          action_id: "shuffle"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Nomal Start :motorway:"
          },
          value: createFormValue(form.users, form.time),
          style: "primary",
          action_id: "start"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel"
          },
          value: '{ "cancel": true }',
          action_id: "cancel"
        }
      ]
    }
  ];
}

// min 1 minutes(Accept suspend time), max 360 minutes(Maximum cache retention time)
const COUNT_DOWN_NOTIFICATION_TIME: number = parseInt(
  properties.getProperty("COUNT_DOWN_NOTIFICATION_TIME") || "5",
  10
);
const executeButton = (blockActions: BlockActions): {} => {
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
    case "shuffle":
      webhook.invoke({ replace_original: "true", blocks });

      client.chatPostMessage(channel, "", null, null, createStartBlocks(form));
      return {};
    case "reshuffle":
      webhook.invoke({
        replace_original: "true",
        blocks: createStartBlocks(form)
      });
      return {};
    case "continue":
      blocks.pop();
    case "start":
      webhook.invoke({ replace_original: "true", blocks });
      const endTime = new Date();
      // Set end time
      endTime.setMinutes(endTime.getMinutes() + form.time);
      if (form.times) {
        form.times++;
      } else {
        form.times = 1;
      }
      form.scheduled_message_id = client.chatScheduleMessage(
        channel,
        endTime,
        null,
        createMobedBlocks(form)
      );

      form.times--;

      const ts = client.chatPostMessage(
        channel,
        "",
        null,
        null,
        createMobbingBlocks(form, endTime)
      );

      // Create count down job
      if (form.time > COUNT_DOWN_NOTIFICATION_TIME) {
        const countDownTime = new Date(endTime);
        // Set end time
        countDownTime.setMinutes(
          countDownTime.getMinutes() - COUNT_DOWN_NOTIFICATION_TIME
        );

        DelayedJobBroker.createJob(countDownTime).performLater(countDown, {
          channel,
          ts,
          form
        });
      }

      return {};
    case "turn_end":
      client.chatDeleteScheduleMessage(channel, form.scheduled_message_id);
      blocks.pop();
      webhook.invoke({ replace_original: "true", blocks });
      if (form.times) {
        form.times++;
      } else {
        form.times = 1;
      }
      client.chatPostMessage(channel, "", null, null, createMobedBlocks(form));
      break;
    case "exit":
      client.chatDeleteScheduleMessage(channel, form.scheduled_message_id);
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

function createStartBlocks(form: FormValue): {}[] {
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
          text: `:dart: Order\n${userOrder}\n:timer_clock: ${form.time} minutes`
        }
      ]
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Start Mobbing :motorway:"
          },
          value: createFormValue(form.users, form.time),
          style: "primary",
          action_id: "start"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "One more :twisted_rightwards_arrows:"
          },
          value: createFormValue(form.users, form.time),
          action_id: "reshuffle"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Cancel"
          },
          value: '{ "cancel": true }',
          action_id: "cancel"
        }
      ]
    }
  ];
}

function createMobbingBlocks(form: FormValue, endTime: Date): {}[] {
  const blocks = [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${convertTimes(
            form.times
          )} mob. :man-woman-boy:\n:oncoming_automobile: Driver(${pickUser(
            form.users,
            form.times
          )}), :world_map: Navigater(${pickUser(form.users, form.times + 1)})`
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:clock9: *${Utilities.formatDate(
            endTime,
            "JST",
            "HH:mm:ss"
          )}* (_${form.time} minutes later_)`
        }
      ]
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Turn end :black_joker:"
          },
          value: createFormValue(
            form.users,
            form.time,
            form.scheduled_message_id,
            form.times
          ),
          style: "primary",
          action_id: "turn_end"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Exit :door:"
          },
          value: createFormValue(
            form.users,
            form.time,
            form.scheduled_message_id,
            form.times
          ),
          confirm: {
            title: {
              type: "plain_text",
              text: "Are you sure?"
            },
            text: {
              type: "mrkdwn",
              text: "Do you want to exit mob?"
            },
            confirm: {
              type: "plain_text",
              text: "Do Finish"
            },
            deny: {
              type: "plain_text",
              text: "Go back to mob"
            }
          },
          action_id: "exit"
        }
      ]
    }
  ];

  // hidden exit button
  if (form.time <= COUNT_DOWN_NOTIFICATION_TIME) {
    blocks[blocks.length - 1].elements.pop();
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

function createMobedBlocks(form: FormValue): {}[] {
  const emoji = form.times % 2 === 0 ? ":+1:" : ":clap:";

  return [
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `:alarm_clock: Thank you ${pickUser(
            form.users,
            form.times - 1
          )}${emoji}`
        }
      ]
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `${convertTimes(
            form.times
          )} mob. :man-woman-boy:\n:oncoming_automobile: Driver(${pickUser(
            form.users,
            form.times
          )}), :world_map: Navigator(${pickUser(form.users, form.times + 1)})`
        }
      ]
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Continue :raised_hands:"
          },
          value: createFormValue(form.users, form.time, null, form.times),
          style: "primary",
          action_id: "continue"
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Finish :checkered_flag:"
          },
          value: createFormValue(form.users, form.time, null, form.times),
          style: "danger",
          confirm: {
            title: {
              type: "plain_text",
              text: "Are you sure?"
            },
            text: {
              type: "mrkdwn",
              text: "Do you want to exit mob?"
            },
            confirm: {
              type: "plain_text",
              text: "Do Finish"
            },
            deny: {
              type: "plain_text",
              text: "Go back to mob"
            }
          },
          action_id: "finish"
        }
      ]
    }
  ];
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

const countDown = (): void => {
  initializeOAuth2Handler();
  DelayedJobBroker.perform(
    (parameter: { channel: string; ts: string; form: FormValue }) => {
      const { channel, ts, form } = parameter;

      const client = new SlackApiClient(handler.token);

      const messages = client.conversationsHistory(channel, ts, 1, ts);

      const blocks = messages[0].blocks;

      if (blocks[blocks.length - 1].type === "actions") {
        if (blocks[blocks.length - 1].elements.length === 2) {
          blocks[blocks.length - 1].elements.pop();
        } else {
          blocks.pop();
        }
        // Exists exit button
        client.chatUpdate(channel, ts, null, blocks);
        client.chatPostMessage(channel, createCountDownMessage(form));
      }
    }
  );
};

function createCountDownMessage(form: FormValue): string {
  return `:hourglass_flowing_sand: Hey, ${pickUser(
    form.users,
    form.times
  )}. ${convertTimes(
    form.times
  )} mob will finish in ${COUNT_DOWN_NOTIFICATION_TIME} minutes.`;
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

export { executeSlashCommand };
