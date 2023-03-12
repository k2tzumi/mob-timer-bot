import { BaseError } from "./BaseError";

class NetworkAccessError extends BaseError {
  constructor(public statusCode: number, public e?: string) {
    super(e);
  }
}

export { NetworkAccessError };
