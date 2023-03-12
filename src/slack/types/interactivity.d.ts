declare namespace Slack {
  namespace Interactivity {
    interface Interaction {
      type: string;
      team: { id: string; domain: string };
      user: { id: string; name: string };
      channel?: { id: string; name: string };
      api_app_id: string;
      token: string;
      hash?: string;
      trigger_id?: string;
    }
    interface ActionBase {
      type: string;
      action_id: string;
      block_id: string;
      action_ts: string;
    }
    interface ButtonAction extends ActionBase {
      text: { type: string; text: string; emoji: string };
      value: string;
      style: string;
    }
    interface MultiUsersSelectAction extends ActionBase {
      selected_users: string[];
      initial_users: string[];
    }
    interface StaticSelectAction extends ActionBase {
      selected_option: { value: string };
      placeholder: object;
    }
    interface BlockActions extends Interaction {
      container: {
        type: string;
        view_id?: string;
        message_ts?: string;
        channel_id?: string;
        is_ephemeral?: boolean;
      };
      message?: {
        type: string;
        subtype: string;
        text: string;
        bot_id: string;
        blocks: object[];
        edited: { user: string; ts: string };
        ts: string;
      };
      view?: { id: string; hash: string };
      state?: {
        values: any;
      };
      response_url?: string;
      actions: [
        ButtonAction | MultiUsersSelectAction | StaticSelectAction | ActionBase
      ];
    }
    interface ViewSubmission extends Interaction {
      view: {
        id: string;
        type: string;
        title: { type: string; text: string };
        submit: { type: string; text: string };
        blocks: any;
        private_metadata: string;
        callback_id: string;
        state: {
          values: any;
        };
      };
      response_urls: string[];
    }
    interface DialogSubmission extends Interaction {
      submission: { [key: string]: string };
      callback_id: string;
      state: string;
      action_ts: string;
      response_url: string;
    }
    interface InteractionResponse {
      replace_original?: string;
      delete_original?: string;
      blocks?: object;
      text?: string;
      response_type?: string;
    }
  }
}
