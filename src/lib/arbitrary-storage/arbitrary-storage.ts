import { DeferredPromise } from "../";
export enum Priority {
  Critical,
  High,
  Medium,
  Default,
}

type QueueMember<T> = { weight: number; promise: DeferredPromise<T> };

const WAITQUEUETHRESHOLD = 100;

export class ArbitraryStorage<T = string> {
  private availableQueue!: Array<T>;
  private weightMap!: Map<T, number>;
  private waitQueue!: Map<number, Array<QueueMember<T>>>;

  private waitQueueLength = 0;

  constructor(ips: Array<T>) {
    this.availableQueue = [...ips];
    this.weightMap = new Map<T, number>();
    this.availableQueue.forEach((ip: T) => {
      this.weightMap.set(ip, 1);
    });
    this.waitQueue = new Map<number, Array<QueueMember<T>>>();
    for (const priority in Priority) {
      const value = Number(priority);
      if (!isNaN(value)) {
        this.waitQueue.set(value, []);
      }
    }
  }

  private processQueue = (ip: T) => {
    let weight = 1;
    for (const priority in Priority) {
      const value = Number(priority);
      if (!isNaN(value)) {
        const waitQueue = this.waitQueue.get(value);
        if (waitQueue?.length === 0) {
          continue;
        }
        let enqueued = waitQueue?.shift();
        this.waitQueueLength--;
        weight = enqueued?.weight as number;
        this.reserveIp(ip, weight);
        enqueued?.promise.resole()(ip);
        if (weight === 1) {
          return;
        } else {
          if (waitQueue && weight > 1) {
            while (waitQueue?.length > 0) {
              weight--;
              enqueued = waitQueue?.shift();
              enqueued?.promise.resole()(ip);
            }
          } else {
            continue;
          }
        }
      }
    }
  };

  private releaseIp: TimerHandler = (ip: T) => {
    if (this.waitQueueLength === 0) {
      if (this.availableQueue.length > 0) {
        if (this.availableQueue[0] === ip) {
          this.availableQueue.shift();
        }
        if (this.availableQueue[this.availableQueue.length - 1] !== ip) {
          this.availableQueue.push(ip);
        }
      }
    } else {
      this.processQueue(ip);
    }
  };

  private reserveIp = (ip: T, weight: number) => {
    this.weightMap.set(ip, weight);
    setTimeout(this.releaseIp, 1000, ip);
  };

  private enqueueRequest = (
    priority: Priority,
    weight: number
  ): QueueMember<T> => {
    const queue = this.waitQueue.get(priority);
    const queueMember: QueueMember<T> = {
      weight,
      promise: new DeferredPromise<T>(),
    };
    this.waitQueueLength++;
    queue?.push(queueMember);
    return queueMember;
  };

  public getIp = async (
    weight = 1,
    priority = Priority.Default
  ): Promise<T> => {
    if (this.availableQueue.length > 0) {
      const ip = this.availableQueue[0];
      let currentWeight = this.weightMap.get(ip);
      if (currentWeight !== 1) {
        currentWeight = currentWeight ? currentWeight - 1 : 1;
        this.weightMap.set(ip, currentWeight);
        if (currentWeight === 1) {
          this.availableQueue.shift();
        }
      } else {
        this.reserveIp(ip, weight);
        if (weight === 1) {
          this.availableQueue.shift();
        }
      }
      return Promise.resolve(ip);
    } else {
      if (this.waitQueueLength >= WAITQUEUETHRESHOLD) {
        return Promise.reject("Wait queue exceeds threshold. Come back later");
      } else {
        const queueObject = this.enqueueRequest(priority, weight);
        const result = await queueObject.promise.promise();
        return result;
      }
    }
  };
}
