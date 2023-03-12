type Properties = GoogleAppsScript.Properties.Properties;

type Credentials = Slack.Tools.Credentials;

const SLACK_CREDENTIAL_KEY = "SLACK_CREDENTIAL";

class SlackCredentialStore {
  public constructor(private propertyStore: Properties) {}

  public getCredential(): Credentials | null {
    const slackCredential =
      this.propertyStore.getProperty(SLACK_CREDENTIAL_KEY);

    if (slackCredential) {
      try {
        const credentail: Credentials = JSON.parse(slackCredential);

        return credentail;
      } catch (e) {
        console.warn(`Credential parse faild. message: ${e.message}`);
        this.removeCredential();
      }
    }

    return null;
  }

  public setCredential(credentail: Credentials): void {
    this.propertyStore.setProperty(
      SLACK_CREDENTIAL_KEY,
      JSON.stringify(credentail)
    );
  }

  public removeCredential(): void {
    this.propertyStore.deleteProperty(SLACK_CREDENTIAL_KEY);
  }
}

export { SlackCredentialStore };
