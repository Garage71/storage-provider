import { ArbitraryStorage } from "./lib";
import { Priority } from "./lib/arbitrary-storage/arbitrary-storage";

const ips = ["127.0.0.2", "127.0.0.3", "127.0.0.4", "127.0.0.5", "127.0.0.6"];

const storage = new ArbitraryStorage(ips);

(async () => {
  setInterval(async () => {
    try {
      let priority: Priority = Priority.Default;
      const rndPriority = Math.floor(Math.random() * 4);
      const rndWeight = Math.floor(Math.random() * 4);
      switch (rndPriority) {
        case 0:
          priority = Priority.Critical;
          break;
        case 1:
          priority = Priority.High;
          break;
        case 2:
          priority = Priority.Medium;
          break;
        case 3:
          priority = Priority.Default;
      }
      const result = await storage.getIp(rndWeight, priority);
      console.log(result);
    } catch (ex) {
      console.log(ex);
    }
  }, 50);
})();
