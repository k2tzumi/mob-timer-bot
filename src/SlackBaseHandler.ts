type Cache = GoogleAppsScript.Cache.Cache;
type TextOutput = GoogleAppsScript.Content.TextOutput;

abstract class SlackBaseHandler<T> {
  protected cache: Cache;
  protected listners: Map<string, T>;

  public constructor(private verificationToken: string) {
    this.cache = CacheService.getScriptCache();
    this.listners = new Map<string, T>();
  }

  public abstract handle(e): { performed: boolean; output: TextOutput | null };

  public addListener(type: string, handler: T): void {
    this.listners.set(type, handler);
  }

  protected getListener(type: string): T | null {
    return this.listners.get(type);
  }

  protected validateVerificationToken(token: string | null): void {
    if (token !== this.verificationToken) {
      throw new Error(`Invalid verification token. token: ${token}`);
    }
  }

  protected isHandleProceeded(id: string): boolean {
    const key: string = `${this.constructor.name}#${id}`;

    if (this.cache.get(key)) {
      return true;
    } else {
      this.cache.put(key, "proceeded", 60);
      return false;
    }
  }

  protected convertJSONOutput(response: {} | null | void): TextOutput {
    if (response) {
      return ContentService.createTextOutput(
        JSON.stringify(response)
      ).setMimeType(ContentService.MimeType.JSON);
    } else {
      return ContentService.createTextOutput();
    }
  }
}

export { SlackBaseHandler };
