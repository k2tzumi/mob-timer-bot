declare namespace Slack {
  namespace Tools {
    /**
     * @see https://api.slack.com/reference/manifests#fields
     */
    interface AppsManifest {
      _metadata?: {
        major_version?: number;
        minor_version?: number;
      };
      display_information: {
        name: string;
        description?: string;
        long_description?: string;
        background_color?: string;
      };
      settings?: {
        allowed_ip_address_ranges?: string;
        event_subscriptions?: {
          request_url?: string;
          bot_events?: string[];
          user_events?: string[];
        };
        interactivity?: {
          is_enabled: boolean;
          request_url?: string;
          message_menu_options_url?: string;
        };
        org_deploy_enabled?: boolean;
        socket_mode_enabled?: boolean;
      };
      features?: {
        app_home?: {
          home_tab_enabled?: boolean;
          messages_tab_enabled?: boolean;
          messages_tab_read_only_enabled?: boolean;
        };
        bot_user?: {
          display_name: string;
          always_online?: boolean;
        };
        shortcuts?: {
          name: string;
          callback_id: string;
          description: string;
          type: string;
        }[];
        slash_commands?: {
          command: string;
          description: string;
          should_escape?: boolean;
          url?: string;
          usage_hint?: string;
        }[];
        unfurl_domains?: string;
        workflow_steps?: {
          name: string;
          callback_id: string;
        }[];
      };
      oauth_config?: {
        redirect_urls?: string[];
        scopes?: {
          bot?: string[];
          user?: string[];
        };
      };
    }

    interface Credentials {
      client_id: string;
      client_secret: string;
      verification_token: string;
      signing_secret: string;
    }
  }
}
