import { BoundariesConfigSettings } from "../configs/EslintPluginConfig";

class Cache {
  cache: Record<string, any>;

  constructor(private name: string, public readonly settings: BoundariesConfigSettings) {
    this.cache = {};
  }

  save(key, value) {
    this.cache[key] = value;
  }

  load(key) {
    if (this.cache[key]) {
      return this.cache[key];
    }

    return null;
  }
}

class CachesManager {
  private caches: Cache[];

  constructor(private name: string) {
    this.caches = [];
  }

  findCacheForSettings(settings: BoundariesConfigSettings) {
    let cache = this.caches.find((cacheCandidate) => {
      return cacheCandidate.settings === settings;
    });
    if (!cache) {
      cache = new Cache(this.name, settings);
      this.caches.push(cache);
    }
    return cache;
  }

  save(key: string, value, settings: BoundariesConfigSettings) {
    const cache = this.findCacheForSettings(settings);
    cache.save(key, value);
  }

  load(key: string, settings: BoundariesConfigSettings) {
    const cache = this.findCacheForSettings(settings);
    return cache.load(key);
  }
}

const filesCache = new CachesManager("file");
const importsCache = new CachesManager("import");
const elementsCache = new CachesManager("element");

export { filesCache, importsCache, elementsCache };
