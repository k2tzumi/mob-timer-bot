declare namespace Slack {
  namespace CallbackEvent {
    interface EventBase {
      type: string;
      event_ts: string;
      user: string;
      ts: string;
      item: string;
    }
    interface EmojiChangedEvent extends EventBase {
      subtype: string;
      names?: string[];
      name?: string;
      value: string;
    }
    interface AppMentionEvent extends EventBase {
      text: string;
      channel: string;
    }
    interface MessageEvent extends EventBase {
      channel: string;
      text?: string;
      subtype?: string;
      thread_ts?: string;
      bot_id?: string;
    }
    interface MessageRepliedEvent extends MessageEvent {
      message?: {
        type: string;
        user: string;
        text: string;
        thread_ts: string;
        reply_count: number;
        replies: {
          user: string;
          ts: string;
        }[];
        ts: string;
      };
      subtype: string;
      hidden: boolean;
    }
  }
}
