import { SlackApiClient } from "./SlackApiClient";
type AppsManifest = Slack.Tools.AppsManifest;
type Credentials = Slack.Tools.Credentials;

const SLACK_REFRESH_TOKEN_KEY = "SLACK_REFRESH_TOKEN";
const SLACK_APP_ID_KEY = "SLACK_APP_ID";

class SlackConfigurator {
  private property: GoogleAppsScript.Properties.Properties;

  public constructor(public refresh_token: string = null) {
    this.property = PropertiesService.getScriptProperties();
    if (refresh_token == null) {
      this.refresh_token = this.property.getProperty(SLACK_REFRESH_TOKEN_KEY);
    } else {
      this.property.setProperty(SLACK_REFRESH_TOKEN_KEY, refresh_token);
    }
  }

  private getToken(): string {
    const client = new SlackApiClient("");
    const rotateTokensResponse = client.rotateTokens(this.refresh_token);

    this.property.setProperty(
      SLACK_REFRESH_TOKEN_KEY,
      rotateTokensResponse.refresh_token
    );

    return rotateTokensResponse.token;
  }

  public set app_id(app_id: string) {
    if (app_id !== null) {
      this.property.setProperty(SLACK_APP_ID_KEY, app_id);
    } else {
      this.property.deleteProperty(SLACK_APP_ID_KEY);
    }
  }

  public get app_id(): string | null {
    return this.property.getProperty(SLACK_APP_ID_KEY);
  }

  public createApps(appsManifest: AppsManifest): Credentials {
    const client = new SlackApiClient(this.getToken());

    const createResponse = client.createAppsManifest(appsManifest);

    this.app_id = createResponse.app_id;

    return createResponse.credentials;
  }

  public updateApps(appsManifest: AppsManifest): boolean {
    const client = new SlackApiClient(this.getToken());

    const updateResponse = client.updateAppsManifest(this.app_id, appsManifest);

    return updateResponse.permissions_updated;
  }

  public deleteApps(): boolean {
    const client = new SlackApiClient(this.getToken());

    const deleteResponse = client.deleteAppsManifest(this.app_id);

    if (deleteResponse.ok) {
      this.app_id = null;
    }

    return deleteResponse.ok;
  }
}

export { SlackConfigurator };
