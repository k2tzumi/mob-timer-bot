import { SlackBaseHandler } from "./SlackBaseHandler";
import { Slack } from "./slack/types/index.d";

type TextOutput = GoogleAppsScript.Content.TextOutput;
type Interaction = Slack.Interactivity.Interaction;
type BlockActions = Slack.Interactivity.BlockActions;
type InteractivityFunction = (interaction: Interaction) => {} | void;

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

  private bindInteractivity(interaction: Interaction): {} | void {
    const { type, token } = interaction;
    this.validateVerificationToken(token);

    switch (true) {
      case interaction.hasOwnProperty("trigger_id"):
        if (this.isHandleProceeded(interaction.trigger_id)) {
          throw new Error(
            `Interaction payloads duplicate called. request: ${JSON.stringify(
              interaction
            )}`
          );
        }
        break;
      case interaction.hasOwnProperty("hash"):
        if (this.isHandleProceeded(interaction.hash)) {
          throw new Error(
            `Interaction payloads duplicate called. request: ${JSON.stringify(
              interaction
            )}`
          );
        }
        break;
      default:
        throw new Error(
          `Unknow interaction payloads. request: ${JSON.stringify(interaction)}`
        );
    }

    // Prefer subtype listeners for block actions
    if (type === "block_actions") {
      const blockActions = interaction as BlockActions;

      const blockActionListener = this.getListener(
        blockActions.actions[0].type
      );

      if (blockActionListener) {
        blockActionListener(blockActions);
        return;
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
