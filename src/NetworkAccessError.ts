import { BaseError } from "./BaseError";

class NetworkAccessError extends BaseError {
  constructor(public statusCode: number, e?: string) {
    super(e);
  }
}

export { NetworkAccessError };
