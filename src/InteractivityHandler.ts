import { SlackBaseHandler } from "./SlackBaseHandler";
import { Slack } from "./slack/types/index.d";

type TextOutput = GoogleAppsScript.Content.TextOutput;
type Interaction = Slack.Interactivity.Interaction;
type BlockActions = Slack.Interactivity.BlockActions;
type InteractivityFunction = (interaction: Interaction) => {};

class InteractivityHandler extends SlackBaseHandler<InteractivityFunction> {
  public handle(e): { performed: boolean; output: TextOutput | null } {
    const { payload } = e.parameter;

    if (payload) {
      const request = JSON.parse(payload);
      return {
        performed: true,
        output: this.convertJSONOutput(this.bindInteractivity(request))
      };
    }

    return { performed: false, output: null };
  }

  private bindInteractivity(interaction: Interaction): {} {
    const { type, trigger_id, hash, token } = interaction;
    this.validateVerificationToken(token);

    switch (type) {
      case "block_actions":
      case "message_actions":
        if (this.isHandleProceeded(trigger_id)) {
          throw new Error(
            `Interaction payloads duplicate called. type: ${type}, trigger_id: ${trigger_id}`
          );
        }
        break;
      case "view_submission":
        if (this.isHandleProceeded(hash)) {
          throw new Error(
            `Interaction payloads duplicate called. type: ${type}, hash: ${hash}`
          );
        }
        break;
      case "view_closed":
        break;
      default:
        throw new Error(`Unknow interaction. type: ${type}`);
    }

    // Prefer subtype listeners for block actions
    if (type === "block_actions") {
      const blockActions = interaction as BlockActions;

      const blockActionListener = this.getListener(
        blockActions.actions[0].type
      );

      if (blockActionListener) {
        return blockActionListener(blockActions);
      }
    }

    const interactivityListner = this.getListener(type);

    if (interactivityListner) {
      return interactivityListner(interaction);
    }

    throw new Error(
      `Undifine interaction listner. payload: ${JSON.stringify(interaction)}`
    );
  }
}

export { InteractivityHandler, InteractivityFunction };
