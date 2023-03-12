import { NetworkAccessError } from "./NetworkAccessError";

type URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;
type HttpMethod = GoogleAppsScript.URL_Fetch.HttpMethod;
type HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;
type AppsManifest = Slack.Tools.AppsManifest;
type Credentials = Slack.Tools.Credentials;

interface Response {
  ok: boolean;
  error?: string;
}

interface Message {
  type: string;
  ts: string;
  user: string;
  team: string;
  blocks?: Block[];
}

interface TextCompositionObject {
  type: string;
  text: string;
  emoji?: boolean;
  verbatim?: boolean;
}

interface Block {
  type: string;
  block_id?: string;
}

// type=divider
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type DividerBlock = Block;

interface ContextBlock extends Block {
  // type=context
  elements: (TextCompositionObject | Record<never, never>)[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ActionsBlock extends Block {
  // type=actions
  elements: Record<never, never>[];
}

interface HeaderBlock extends Block {
  // type=header
  text: TextCompositionObject;
}

interface SectionBlock extends Block {
  // type=section
  text: TextCompositionObject;
  fields: Record<never, never>[];
  accessory: Record<never, never>;
}

interface ChatScheduleMessageResponse extends Response {
  channel: string;
  scheduled_message_id: string;
  post_at: string;
  message: Message;
}

interface ChatPostMessageResponse extends Response {
  channel: string;
  ts: string;
  message: Message;
}

interface ConversationsHistoryResponse extends Response {
  messages: Message[];
  has_more: boolean;
  pin_count: number;
  response_metadata: { next_cursor: string };
}

interface CreateAppsManifestResponse extends Response {
  app_id: string;
  credentials: Credentials;
  oauth_authorize_url: string;
}

interface UpdateManifestResponse extends Response {
  app_id: string;
  permissions_updated: boolean;
}

interface RotateTokensResponse extends Response {
  token: string;
  refresh_token: string;
  team_id: string;
  user_id: string;
  iat: number;
  exp: number;
}

interface ConversationsRepliesResponse extends Response {
  messages: {
    type: string;
    user?: string;
    bot_id?: string;
    text: string;
    thread_ts: string;
    parent_user_id?: string;
    reply_count?: number;
    subscribed?: boolean;
    last_read?: string;
    unread_count?: number;
    ts: string;
  }[];
  has_more: boolean;
  response_metadata: {
    next_cursor: string;
  };
}

interface BotsInfoResponse extends Response {
  bot: {
    id: string;
    deleted: boolean;
    name: string;
    updated: number;
    app_id: string;
    user_id: string;
    icons: {
      image_36: string;
      image_48: string;
      image_72: string;
    };
  };
}

class SlackApiClient {
  static readonly BASE_PATH = "https://slack.com/api/";

  public constructor(private token: string) {}

  public oepnDialog(dialog: Record<never, never>, trigger_id: string): void {
    const endPoint = SlackApiClient.BASE_PATH + "dialog.open";
    const payload: Record<never, never> = {
      dialog,
      trigger_id,
    };

    const response: Response = this.invokeAPI(endPoint, payload);

    if (!response.ok) {
      throw new Error(
        `open dialog faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }
  }

  public openViews(views: Record<never, never>, trigger_id: string): void {
    const endPoint = SlackApiClient.BASE_PATH + "views.open";
    const payload: Record<never, never> = {
      view: views,
      trigger_id,
    };

    const response: Response = this.invokeAPI(endPoint, payload);

    if (!response.ok) {
      throw new Error(
        `open views faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }
  }

  public updateViews(
    views: Record<never, never>,
    hash: string,
    view_id: string
  ): void {
    const endPoint = SlackApiClient.BASE_PATH + "views.update";
    const payload: Record<never, never> = {
      view: views,
      hash,
      view_id,
    };

    const response: Response = this.invokeAPI(endPoint, payload);

    if (!response.ok) {
      throw new Error(
        `update views faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }
  }

  public addReactions(
    channel: string,
    name: string,
    timestamp: string
  ): boolean {
    const endPoint = SlackApiClient.BASE_PATH + "reactions.add";
    const payload: Record<never, never> = {
      channel,
      name,
      timestamp,
    };

    const response: Response = this.invokeAPI(endPoint, payload);

    if (!response.ok) {
      if (response.error === "already_reacted") {
        return false;
      }

      throw new Error(
        `add reactions faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return true;
  }

  public postEphemeral(
    channel: string,
    text: string,
    user: string,
    blocks: (Block | Record<never, never>)[] | null = null
  ): void {
    const endPoint = SlackApiClient.BASE_PATH + "chat.postEphemeral";
    let payload: Record<never, never> = {
      channel,
      text,
      user,
    };
    if (blocks) {
      if (!text) {
        text = this.convertBlock2Text(blocks);
      }
      payload = { ...payload, blocks };
    }

    const response: Response = this.invokeAPI(endPoint, payload);

    if (!response.ok) {
      throw new Error(
        `post ephemeral faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }
  }

  public chatPostMessage(
    channel: string,
    text: string,
    thread_ts: string | null = null,
    attachments: Record<never, never>[] | null = null,
    blocks: (Block | Record<never, never>)[] | null = null
  ): string {
    const endPoint = SlackApiClient.BASE_PATH + "chat.postMessage";
    let payload: Record<never, never> = {
      channel,
    };
    if (thread_ts) {
      payload = { ...payload, thread_ts };
    }
    if (attachments) {
      payload = { ...payload, attachments };
    }
    if (blocks) {
      if (!text) {
        text = this.convertBlock2Text(blocks);
      }
      payload = { ...payload, blocks };
    }
    payload = { ...payload, text };

    const response = this.invokeAPI(
      endPoint,
      payload
    ) as ChatPostMessageResponse;

    if (!response.ok) {
      console.info(`post message faild. response: ${JSON.stringify(response)}`);
      throw new Error(
        `post message faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response.ts;
  }

  public chatScheduleMessage(
    channel: string,
    post_at: Date,
    text?: string,
    blocks?: (Block | Record<never, never>)[]
  ): string {
    const endPoint = SlackApiClient.BASE_PATH + "chat.scheduleMessage";
    let payload: Record<never, never> = {
      channel,
      post_at: Math.ceil(post_at.getTime() / 1000),
    };
    if (blocks) {
      if (!text) {
        text = this.convertBlock2Text(blocks);
      }
      payload = { ...payload, blocks, text };
    }
    payload = { ...payload, text };

    const response = this.invokeAPI(
      endPoint,
      payload
    ) as ChatScheduleMessageResponse;

    if (!response.ok) {
      throw new Error(
        `chat schedule message faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response.scheduled_message_id;
  }

  public chatDeleteScheduleMessage(
    channel: string,
    scheduled_message_id: string
  ): boolean {
    const endPoint = SlackApiClient.BASE_PATH + "chat.deleteScheduledMessage";
    const payload: Record<never, never> = {
      channel,
      scheduled_message_id,
    };

    const response = this.invokeAPI(endPoint, payload);

    if (!response.ok) {
      if (response.error !== "invalid_scheduled_message_id") {
        throw new Error(
          `chat delete schedule message faild. response: ${JSON.stringify(
            response
          )}, payload: ${JSON.stringify(payload)}`
        );
      } else {
        return false;
      }
    }

    return true;
  }

  public conversationsHistory(
    channel: string,
    latest?: string,
    limit?: number,
    oldest?: string
  ): Message[] {
    const endPoint = SlackApiClient.BASE_PATH + "conversations.history";
    let payload: Record<never, never> = {
      channel,
      inclusive: true,
    };
    if (latest) {
      payload = { ...payload, latest };
    }
    if (limit) {
      payload = { ...payload, limit };
    }
    if (oldest) {
      payload = { ...payload, oldest };
    }

    const response = this.invokeAPI(
      endPoint,
      payload
    ) as ConversationsHistoryResponse;

    if (!response.ok) {
      throw new Error(
        `conversations history faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response.messages;
  }

  public chatUpdate(
    channel: string,
    ts: string,
    text?: string,
    blocks?: (Block | Record<never, never>)[]
  ): void {
    const endPoint = SlackApiClient.BASE_PATH + "chat.update";
    let payload: Record<never, never> = {
      channel,
      ts,
    };
    if (blocks) {
      if (!text) {
        text = this.convertBlock2Text(blocks);
      }
      payload = { ...payload, blocks };
    }
    payload = { ...payload, text };

    const response = this.invokeAPI(endPoint, payload) as Response;

    if (!response.ok) {
      throw new Error(
        `chat update faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }
  }

  public createAppsManifest(
    appsManifest: AppsManifest
  ): CreateAppsManifestResponse {
    const endPoint = SlackApiClient.BASE_PATH + "apps.manifest.create";
    const manifest = JSON.stringify(appsManifest);
    let payload: Record<never, never> = {};
    payload = { ...payload, manifest };

    const response = this.invokeAPI(
      endPoint,
      payload
    ) as CreateAppsManifestResponse;

    if (!response.ok) {
      throw new Error(
        `create apps manifest faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response;
  }

  public updateAppsManifest(
    app_id: string,
    appsManifest: AppsManifest
  ): UpdateManifestResponse {
    const endPoint = SlackApiClient.BASE_PATH + "apps.manifest.update";
    const manifest = JSON.stringify(appsManifest);
    let payload: Record<never, never> = {
      app_id,
    };
    payload = { ...payload, manifest };

    const response = this.invokeAPI(
      endPoint,
      payload
    ) as UpdateManifestResponse;

    if (!response.ok) {
      throw new Error(
        `update apps manifest faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response;
  }

  public deleteAppsManifest(app_id: string): Response {
    const endPoint = SlackApiClient.BASE_PATH + "apps.manifest.delete";
    const payload: Record<never, never> = {
      app_id,
    };

    const response = this.invokeAPI(endPoint, payload) as Response;

    if (!response.ok) {
      throw new Error(
        `delete apps manifest faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response;
  }

  public rotateTokens(refresh_token: string): RotateTokensResponse {
    const endPoint = SlackApiClient.BASE_PATH + "tooling.tokens.rotate";
    const payload: Record<never, never> = {
      refresh_token,
    };

    const response = this.invokeAPI(endPoint, payload) as RotateTokensResponse;

    if (!response.ok) {
      throw new Error(
        `roteate tokens faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response;
  }

  /**
   * @see https://api.slack.com/methods/conversations.replies
   */
  public conversationsReplies(
    channel: string,
    ts: string
  ): ConversationsRepliesResponse {
    const endPoint = SlackApiClient.BASE_PATH + "conversations.replies";
    const payload: Record<never, never> = {
      channel,
      ts,
    };

    const response = this.invokeAPI(
      endPoint,
      payload
    ) as ConversationsRepliesResponse;

    if (!response.ok) {
      throw new Error(
        `conversations replies faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response;
  }

  /**
   * @see https://api.slack.com/methods/bots.info
   */
  public infoBots(bot: string): BotsInfoResponse {
    const endPoint = SlackApiClient.BASE_PATH + "bots.info";
    const payload: Record<never, never> = {
      bot,
    };

    const response = this.invokeAPI(endPoint, payload) as BotsInfoResponse;

    if (!response.ok) {
      throw new Error(
        `bots info faild. response: ${JSON.stringify(
          response
        )}, payload: ${JSON.stringify(payload)}`
      );
    }

    return response;
  }

  private convertBlock2Text(blocks: (Block | Record<never, never>)[]): string {
    const textArray: string[] = [];
    blocks.forEach((block) => {
      if (block.hasOwnProperty("type")) {
        const obj = block as Block;
        switch (obj.type) {
          case "context": {
            if (block.hasOwnProperty("elements")) {
              const contextBlock = block as ContextBlock;
              contextBlock.elements.forEach((element) => {
                if (element.hasOwnProperty("text")) {
                  const textCompositionObject =
                    element as TextCompositionObject;

                  textArray.push(textCompositionObject.text);
                }
              });
            }
            break;
          }
          case "header": {
            const headerBlock = block as HeaderBlock;
            textArray.push(headerBlock.text.text);
            break;
          }
          case "section": {
            const sectionBlock = block as SectionBlock;
            textArray.push(sectionBlock.text.text);
            break;
          }
        }
      }
    });
    return textArray.join("\n");
  }

  private postRequestHeader() {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "content-type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${this.token}`,
    };
  }

  private getRequestHeader() {
    return {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${this.token}`,
    };
  }

  private postRequestOptions(
    payload: string | Record<never, never>
  ): URLFetchRequestOptions {
    const options: URLFetchRequestOptions = {
      method: "post",
      headers: this.postRequestHeader(),
      muteHttpExceptions: true,
      payload: payload instanceof String ? payload : JSON.stringify(payload),
    };

    return options;
  }

  private getRequestOptions(): URLFetchRequestOptions {
    const options: URLFetchRequestOptions = {
      method: "get",
      headers: this.getRequestHeader(),
      muteHttpExceptions: true,
    };

    return options;
  }

  /**
   * @param endPoint Slack API endpoint
   * @param options
   * @throws NetworkAccessError
   */
  private invokeAPI(endPoint: string, payload: Record<never, never>): Response {
    let response: HTTPResponse;

    try {
      switch (this.preferredHttpMethod(endPoint)) {
        case "post":
          response = UrlFetchApp.fetch(
            endPoint,
            this.postRequestOptions(payload)
          );
          break;
        case "get":
          response = UrlFetchApp.fetch(
            this.formUrlEncoded(endPoint, payload),
            this.getRequestOptions()
          );
          break;
        default:
          throw new Error("Unknown method.");
      }
    } catch (e) {
      console.warn(`DNS error, etc. ${e.message}`);
      throw new NetworkAccessError(500, e.message);
    }

    switch (response.getResponseCode()) {
      case 200:
        return JSON.parse(response.getContentText());
      default:
        console.warn(
          `Slack API error. endpoint: ${endPoint}, status: ${response.getResponseCode()}, content: ${response.getContentText()}`
        );
        throw new NetworkAccessError(
          response.getResponseCode(),
          response.getContentText()
        );
    }
  }

  private preferredHttpMethod(endPoint: string): HttpMethod {
    switch (true) {
      case /(.)*conversations\.history$/.test(endPoint):
      case /(.)*tooling\.tokens\.rotate$/.test(endPoint):
      case /(.)*conversations\.replies$/.test(endPoint):
      case /(.)*bots\.info$/.test(endPoint):
        return "get";
      default:
        return "post";
    }
  }

  private formUrlEncoded(
    endPoint: string,
    payload: Record<never, never>
  ): string {
    const query = Object.entries<string>(payload)
      .map(([key, value]) => `${key}=${encodeURI(value)}`)
      .join("&");

    return `${endPoint}?${query}`;
  }
}

export { SlackApiClient, ConversationsRepliesResponse };
