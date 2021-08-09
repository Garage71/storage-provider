type TPromiseLike<T> = (value: T | PromiseLike<T>) => void;

export class DeferredPromise<T> {
  private _promise: Promise<T>;
  private _resolve!: (value: T | PromiseLike<T>) => void;
  private _reject!: (value: T | PromiseLike<T>) => void;
  constructor() {
    this._promise = new Promise<T>((resolve, reject) => {
      this._resolve = resolve;
      this._reject = reject;
    });
  }
  public resole = (): TPromiseLike<T> => {
    return this._resolve;
  };
  public reject = (): TPromiseLike<T> => {
    return this._reject;
  };
  public promise = (): Promise<T> => {
    return this._promise;
  };
}
