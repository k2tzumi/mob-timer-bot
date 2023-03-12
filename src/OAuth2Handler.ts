type OAuth2Service = GoogleAppsScriptOAuth2.OAuth2Service;
type Properties = GoogleAppsScript.Properties.Properties;
type HtmlOutput = GoogleAppsScript.HTML.HtmlOutput;
type URLFetchRequestOptions = GoogleAppsScript.URL_Fetch.URLFetchRequestOptions;

interface OauthAccess {
  ok: boolean;
  error?: string;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: Team;
  enterprise: Enterprise;
  authed_user: AuthedUser;
  incoming_webhook: IncomingWebhook;
}

interface Team {
  name: string;
  id: string;
}

interface Enterprise {
  name: string;
  id: string;
}

interface AuthedUser {
  id: string;
  scope: string;
  access_token: string;
  token_type: string;
}

interface IncomingWebhook {
  channel: string;
  channel_id: string;
  configuration_url: string;
  url: string;
}

type TokenPayload = GoogleAppsScriptOAuth2.TokenPayload;
type Credentials = Slack.Tools.Credentials;

class OAuth2Handler {
  public get token(): string | null {
    const ACCESS_TOKEN = this.propertyStore.getProperty("ACCESS_TOKEN");

    if (ACCESS_TOKEN !== null) {
      return ACCESS_TOKEN;
    } else {
      const token: string = this.service.getAccessToken();

      if (token !== null) {
        // Save access token.
        this.propertyStore.setProperty("ACCESS_TOKEN", token);

        return token;
      }
    }

    return null;
  }

  public get authorizationUrl(): string {
    return this.service.getAuthorizationUrl();
  }

  public get callbackURL(): string {
    const scriptId = ScriptApp.getScriptId();
    return `https://script.google.com/macros/d/${scriptId}/usercallback`;
  }

  public get redirectUri(): string {
    return this.service.getRedirectUri();
  }

  public get requestURL() {
    const serviceURL = ScriptApp.getService().getUrl();
    return serviceURL.replace("/dev", "/exec");
  }

  public get channelName(): string | null {
    return this.propertyStore.getProperty("CHANNEL_NAME");
  }

  public get botUserId(): string | null {
    return this.propertyStore.getProperty("BOT_USER_ID");
  }

  public get incomingWebhookUrl(): string | null {
    return this.propertyStore.getProperty("INCOMING_WEBHOOKS_URL");
  }

  public get installUrl(): string {
    return `https://slack.com/oauth/v2/authorize?scope=${encodeURI(
      OAuth2Handler.SCOPE
    )}&client_id=${this.credentials.client_id}&redirect_uri=${
      this.authorizationUrl
    }`;
  }

  public get reInstallUrl(): string {
    return `https://slack.com/oauth/v2/authorize?client_id=${
      this.credentials.client_id
    }&install_redirect=general&scope=${encodeURI(OAuth2Handler.SCOPE)}`;
  }

  public static readonly SCOPE =
    "channels:history,commands,chat:write,groups:history,mpim:history,im:history";

  private service: OAuth2Service;

  private oAuthAccess: OauthAccess;

  public constructor(
    private credentials: Credentials,
    private propertyStore: Properties,
    private callbackFunctionName: string
  ) {
    this.service = OAuth2.createService("slack")
      .setAuthorizationBaseUrl("https://slack.com/oauth/v2/authorize")
      .setTokenUrl("https://slack.com/api/oauth.v2.access")
      .setTokenFormat("application/x-www-form-urlencoded")
      // .setTokenFormat(GoogleAppsScriptOAuth2.TokenFormat.FORM_URL_ENCODED)
      .setCallbackFunction(this.callbackFunctionName)
      .setPropertyStore(this.propertyStore)
      .setScope(OAuth2Handler.SCOPE)
      .setTokenPayloadHandler(this.tokenPayloadHandler);

    if (credentials !== null) {
      this.service.setClientId(credentials.client_id);
      this.service.setClientSecret(credentials.client_secret);
    }
  }

  /**
   * Handles the OAuth callback.
   */
  public authCallback(request): HtmlOutput {
    const authorized = this.service.handleCallback(request);
    if (authorized) {
      if (this.getOauthAccess(request.parameter.code)) {
        return this.createAuthenSuccessHtml();
      }
    }

    return HtmlService.createHtmlOutput(
      "Denied. You can close this tab."
    ).setTitle("OAuth failed.");
  }

  /**
   * Reset the authorization state, so that it can be re-tested.
   */
  public clearService() {
    this.service.reset();
  }

  public verifyAccessToken(): boolean {
    return this.service.hasAccess();
  }

  private getOauthAccess(code: string): OauthAccess | null {
    const formData = {
      client_id: this.credentials.client_id,
      client_secret: this.credentials.client_secret,
      code,
    };

    const options: URLFetchRequestOptions = {
      contentType: "application/x-www-form-urlencoded",
      method: "post",
      muteHttpExceptions: true,
      payload: formData,
    };
    this.oAuthAccess = JSON.parse(
      UrlFetchApp.fetch(
        "https://slack.com/api/oauth.v2.access",
        options
      ).getContentText()
    );

    if (this.oAuthAccess.ok) {
      this.initializeProperty();

      return this.oAuthAccess;
    } else {
      console.warn(
        `OAuth2 access error. response: ${JSON.stringify(this.oAuthAccess)}`
      );
      return null;
    }
  }

  private initializeProperty() {
    const { access_token, bot_user_id, incoming_webhook } = this.oAuthAccess;
    // Save access token.
    this.propertyStore.setProperty("ACCESS_TOKEN", access_token);
    // Save bot user id.
    this.propertyStore.setProperty("BOT_USER_ID", bot_user_id);
    if (incoming_webhook) {
      // Save channel name.
      this.propertyStore.setProperty("CHANNEL_NAME", incoming_webhook.channel);
      // Save incoming webhooks.
      this.propertyStore.setProperty(
        "INCOMING_WEBHOOKS_URL",
        incoming_webhook.url
      );
    }
  }

  private tokenPayloadHandler = (tokenPayload: TokenPayload): TokenPayload => {
    delete tokenPayload.client_id;

    return tokenPayload;
  };

  private createAuthenSuccessHtml(): HtmlOutput {
    return HtmlService.createHtmlOutput("Success!<br />").setTitle(
      "OAuth is now complete."
    );
  }
}

export { OAuth2Handler };
