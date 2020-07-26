import { BaseError } from "./BaseError";
import { Slack } from "./slack/types/index.d";
import { SlackBaseHandler } from "./SlackBaseHandler";

type TextOutput = GoogleAppsScript.Content.TextOutput;
type CallbackEvent = Slack.CallbackEvent.EventBase;
type CallbackEventFunction = (event: CallbackEvent) => {} | null | void;

interface OuterEvent {
  token: string;
  team_id: string;
  api_app_id: string;
  event: CallbackEvent;
  type: string;
  authed_users: string[];
  event_id: string;
  event_time: number;
}

class DuplicateEventError extends BaseError {
  constructor(outerEvent: OuterEvent) {
    const { event, event_id, event_time } = outerEvent;
    super(
      `event duplicate called. type: ${event.type}, event_id: ${event_id}, event_time: ${event_time}, event_ts: ${event.event_ts}`
    );
  }
}

class CallbackEventHandler extends SlackBaseHandler<CallbackEventFunction> {
  public handle(e): { performed: boolean; output: TextOutput | null } {
    if (e.postData) {
      const postData = JSON.parse(e.postData.getDataAsString());

      switch (postData.type) {
        case "url_verification":
          return {
            output: this.convertJSONOutput({ challenge: postData.challenge }),
            performed: true
          };
        case "event_callback":
          console.log({ message: "event_callback called.", data: postData });
          return {
            output: this.convertJSONOutput(this.bindEvent(postData)),
            performed: true
          };
        default:
          break;
      }
    }

    return { performed: false, output: null };
  }

  private bindEvent(outerEvent: OuterEvent): {} {
    const { token, event_id, event_time, event } = outerEvent;

    this.validateVerificationToken(token);

    if (this.isHandleProceeded(event_id + event_time)) {
      throw new DuplicateEventError(outerEvent);
    }

    const listner = this.getListener(event.type);

    if (listner) {
      return {
        output: this.convertJSONOutput(listner(event)),
        performed: true
      };
    }

    throw new Error(
      `Undifine event type listner. event: ${JSON.stringify(outerEvent)}`
    );
  }
}

export { CallbackEventHandler, CallbackEventFunction, DuplicateEventError };
