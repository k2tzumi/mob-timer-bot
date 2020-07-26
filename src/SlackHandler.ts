import {
  SlashCommandHandler,
  SlashCommandFunction
} from "./SlashCommandHandler";
import {
  InteractivityHandler,
  InteractivityFunction
} from "./InteractivityHandler";
import {
  CallbackEventHandler,
  CallbackEventFunction
} from "./CallbackEventHandler";

type TextOutput = GoogleAppsScript.Content.TextOutput;

class SlackHandler {
  private command: SlashCommandHandler;
  private interactivity: InteractivityHandler;
  private event: CallbackEventHandler;

  public constructor(private verificationToken: string) {
    this.command = new SlashCommandHandler(verificationToken);
    this.interactivity = new InteractivityHandler(verificationToken);
    this.event = new CallbackEventHandler(verificationToken);
  }

  public handle(e): { performed: boolean; output: TextOutput | null } {
    const commandHandle = this.command.handle(e);

    if (commandHandle.performed) {
      return commandHandle;
    }

    const interactivityHandle = this.interactivity.handle(e);

    if (interactivityHandle.performed) {
      return interactivityHandle;
    }

    const eventHandle = this.event.handle(e);

    if (eventHandle.performed) {
      return eventHandle;
    }

    return { performed: false, output: null };
  }

  public addCommandListener(type: string, handler: SlashCommandFunction): void {
    this.command.addListener(type, handler);
  }

  public addInteractivityListener(
    type: string,
    handler: InteractivityFunction
  ): void {
    this.interactivity.addListener(type, handler);
  }

  public addCallbackEventListener(
    type: string,
    handler: CallbackEventFunction
  ): void {
    this.event.addListener(type, handler);
  }
}

export { SlackHandler };
