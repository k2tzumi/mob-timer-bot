import { NetworkAccessError } from "./NetworkAccessError";

type URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;
type HttpMethod = GoogleAppsScript.URL_Fetch.HttpMethod;
type HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;

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
type DividerBlock = Block;

interface ContextBlock extends Block {
  // type=context
  elements: (TextCompositionObject | {})[];
}

interface ActionsBlock extends Block {
  // type=actions
  elements: {}[];
}

interface HeaderBlock extends Block {
  // type=header
  text: TextCompositionObject;
}

interface SectionBlock extends Block {
  // type=section
  text: TextCompositionObject;
  fields: {}[];
  accessory: {};
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

class SlackApiClient {
  static readonly BASE_PATH = "https://slack.com/api/";

  public constructor(private token: string) {}

  public oepnDialog(dialog: {}, trigger_id: string): void {
    const endPoint = SlackApiClient.BASE_PATH + "dialog.open";
    const payload: {} = {
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

  public openViews(views: {}, trigger_id: string): void {
    const endPoint = SlackApiClient.BASE_PATH + "views.open";
    const payload: {} = {
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

  public updateViews(views: {}, hash: string, view_id: string): void {
    const endPoint = SlackApiClient.BASE_PATH + "views.update";
    const payload: {} = {
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
    const payload: {} = {
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

  public postEphemeral(channel: string, text: string, user: string): void {
    const endPoint = SlackApiClient.BASE_PATH + "chat.postEphemeral";
    const payload: {} = {
      channel,
      text,
      user,
    };

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
    thread_ts: string = null,
    attachments: {}[] = null,
    blocks: (Block | {})[] = null
  ): string {
    const endPoint = SlackApiClient.BASE_PATH + "chat.postMessage";
    let payload: {} = {
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
    blocks?: (Block | {})[]
  ): string {
    const endPoint = SlackApiClient.BASE_PATH + "chat.scheduleMessage";
    let payload: {} = {
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
    const payload: {} = {
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
    let payload: {} = {
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
    blocks?: (Block | {})[]
  ): void {
    const endPoint = SlackApiClient.BASE_PATH + "chat.update";
    let payload: {} = {
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

  private convertBlock2Text(blocks: (Block | {})[]): string {
    const textArray = [];
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
      "content-type": "application/json; charset=UTF-8",
      Authorization: `Bearer ${this.token}`,
    };
  }

  private getRequestHeader() {
    return {
      "content-type": "application/x-www-form-urlencoded",
      Authorization: `Bearer ${this.token}`,
    };
  }

  private postRequestOptions(payload: string | {}): URLFetchRequestOptions {
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
  private invokeAPI(endPoint: string, payload: {}): Response {
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
        return "get";
      default:
        return "post";
    }
  }

  private formUrlEncoded(endPoint: string, payload: {}): string {
    const query = Object.entries<string>(payload)
      .map(([key, value]) => `${key}=${encodeURI(value)}`)
      .join("&");

    return `${endPoint}?${query}`;
  }
}

export { SlackApiClient };
