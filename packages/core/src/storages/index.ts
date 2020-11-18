import {
  Agile,
  Storage,
  isAsyncFunction,
  defineConfig,
  Persistent,
  StorageKey,
  StorageItemKey,
} from "../internal";

export class Storages {
  public agileInstance: () => Agile;

  public defaultStorage?: Storage;
  public storages: { [key: string]: Storage } = {}; // All registered Storages
  public persistentInstances: Set<Persistent> = new Set();

  constructor(agileInstance: Agile, config: StoragesConfigInterface = {}) {
    config = defineConfig(config, {
      localStorage: true,
    });
    this.agileInstance = () => agileInstance;
    if (config.localStorage) this.instantiateLocalStorage();
  }

  //=========================================================================================================
  // Instantiate Local Storage
  //=========================================================================================================
  /**
   * @internal
   * Instantiates Local Storage
   */
  private instantiateLocalStorage() {
    // Check if Local Storage is Available
    if (!Storages.localStorageAvailable()) {
      console.warn(
        "Agile: Local Storage is here not available, to use Storage functionalities like persist please provide a custom Storage!"
      );
      return;
    }

    // Create and register Local Storage
    const _localStorage = new Storage({
      key: "localStorage",
      async: false,
      methods: {
        get: localStorage.getItem.bind(localStorage),
        set: localStorage.setItem.bind(localStorage),
        remove: localStorage.removeItem.bind(localStorage),
      },
    });
    this.register(_localStorage, { default: true });
  }

  //=========================================================================================================
  // Register
  //=========================================================================================================
  /**
   * @internal
   * Register new Storage as Agile Storage
   * @param storage - new Storage
   * @param config - Config
   */
  public register(
    storage: Storage,
    config: RegisterConfigInterface = {}
  ): boolean {
    config = defineConfig(config, {
      default: false,
    });

    // Check if Storage is async
    if (
      isAsyncFunction(storage.methods.get) ||
      isAsyncFunction(storage.methods.set) ||
      isAsyncFunction(storage.methods.remove)
    )
      storage.config.async = true;

    // Check if Storage already exists
    if (this.storages.hasOwnProperty(storage.key)) {
      console.error(`Agile: Storage `);
      return false;
    }

    // Register Storage
    this.storages[storage.key] = storage;
    storage.ready = true;
    if (config.default) this.defaultStorage = storage;

    // Transfer already saved Items into new Storage
    this.persistentInstances.forEach((persistent) => {
      if (persistent.storageKeys.includes(storage.key))
        persistent.initialLoading(persistent.key);
    });

    return true;
  }

  //=========================================================================================================
  // Get Storage
  //=========================================================================================================
  /**
   * @public
   * Get Storage at Key/Name
   * @param key - Key/Name of Storage
   */
  public getStorage(key: StorageKey): Storage | undefined {
    const storage = this.storages[key];

    // Check if Storage exists
    if (!storage) {
      console.error(`Agile: Storage with the key/name '${key}' doesn't exist`);
      return undefined;
    }

    // Check if Storage is ready
    if (!storage.ready) {
      console.error(`Agile: Storage with the key/name '${key}' isn't ready`);
      return undefined;
    }

    return storage;
  }

  //=========================================================================================================
  // Get
  //=========================================================================================================
  /**
   * @public
   * Gets value at provided Key
   * @param key - Key of Storage property
   * @param storageKey - Key/Name of Storage from which the Item is fetched (if not provided default Storage will be used)
   */
  public get<GetType = any>(
    key: StorageItemKey,
    storageKey: StorageKey
  ): GetType | Promise<GetType> | undefined {
    if (storageKey) {
      const storage = this.getStorage(key);
      return storage?.get(key);
    }
    return this.defaultStorage?.get(key);
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * @public
   * Saves/Updates value at provided Key
   * @param key - Key of Storage property
   * @param value - new Value that gets set
   * @param storageKeys - Key/Name of Storages where the Value gets set (if not provided default Storage will be used)
   */
  public set(
    key: StorageItemKey,
    value: any,
    storageKeys?: StorageKey[]
  ): void {
    if (storageKeys) {
      for (let storageKey in storageKeys) {
        this.getStorage(key)?.set(key, value);
      }
      return;
    }
    this.defaultStorage?.set(key, value);
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @public
   * Removes value at provided Key
   * @param key - Key of Storage property
   * @param storageKeys - Key/Name of Storages where the Value gets removed (if not provided default Storage will be used)
   */
  public remove(key: StorageItemKey, storageKeys?: StorageKey[]): void {
    if (storageKeys) {
      for (let storageKey in storageKeys) {
        this.getStorage(key)?.remove(key);
      }
      return;
    }
    this.defaultStorage?.remove(key);
  }

  //=========================================================================================================
  // Local Storage Available
  //=========================================================================================================
  /**
   * @internal
   * Checks if localStorage is available in this Environment
   */
  static localStorageAvailable(): boolean {
    try {
      localStorage.setItem("_myDummyKey_", "myDummyValue");
      localStorage.removeItem("_myDummyKey_");
      return true;
    } catch (e) {
      return false;
    }
  }
}

/**
 * @param localStorage - If Local Storage should be instantiated
 */
export interface StoragesConfigInterface {
  localStorage?: boolean;
}

/**
 * @param default - If the registered Storage gets the default Storage
 */
export interface RegisterConfigInterface {
  default?: boolean;
}
