import {
  isJsonString,
  defineConfig,
  isAsyncFunction,
  isFunction,
} from "../internal";

export class Storage {
  public key: StorageKey;
  public ready: boolean = false;
  public methods: StorageMethodsInterface;
  public config: StorageConfigInterface;

  /**
   * @public
   * Storage - Interface for storing Items permanently
   * @param config - Config
   */
  constructor(config: CreateStorageConfigInterface) {
    config = defineConfig(config, {
      prefix: "agile",
      async: false,
    });
    this.key = config.key;
    this.methods = config.methods;
    this.config = {
      prefix: config.prefix,
      async: config.async,
    };
    this.ready = this.validate();
  }

  //=========================================================================================================
  // Validate
  //=========================================================================================================
  /**
   * @public
   * Validates the Storage
   */
  public validate(): boolean {
    // Validate Functions
    if (!isFunction(this.methods?.get)) {
      console.error("Agile: Your GET StorageMethod isn't valid!");
      return false;
    }
    if (!isFunction(this.methods?.set)) {
      console.error("Agile: Your SET StorageMethod isn't valid!");
      return false;
    }
    if (!isFunction(this.methods?.remove)) {
      console.error("Agile: Your REMOVE StorageMethod isn't valid!");
      return false;
    }

    // Check if Storage is async
    if (
      isAsyncFunction(this.methods.get) ||
      isAsyncFunction(this.methods.set) ||
      isAsyncFunction(this.methods.remove)
    )
      this.config.async = true;

    return true;
  }

  //=========================================================================================================
  // Get
  //=========================================================================================================
  /**
   * @public
   * Gets value at provided Key
   * @param key - Key of Storage property
   */
  public get<GetType = any>(
    key: StorageItemKey
  ): GetType | Promise<GetType> | undefined {
    if (!this.ready || !this.methods.get) return;

    // Async Get
    if (this.config.async) return this.asyncGet<GetType>(key);

    // Normal Get
    const res = this.methods.get(this.getStorageKey(key));
    if (isJsonString(res)) return JSON.parse(res);
    return res;
  }

  //=========================================================================================================
  // Async Get
  //=========================================================================================================
  /**
   * @internal
   * Gets value at provided Key (async)
   * @param key - Key of Storage property
   */
  private asyncGet<GetTpe = any>(key: StorageItemKey): Promise<GetTpe> {
    return new Promise((resolve, reject) => {
      this.methods
        ?.get(this.getStorageKey(key))
        .then((res: any) => {
          if (isJsonString(res)) return resolve(JSON.parse(res));
          resolve(res);
        })
        .catch(reject);
    });
  }

  //=========================================================================================================
  // Set
  //=========================================================================================================
  /**
   * @public
   * Saves/Updates value at provided Key
   * @param key - Key of Storage property
   * @param value - new Value that gets set
   */
  public set(key: StorageItemKey, value: any): void {
    if (!this.ready || !this.methods.set) return;
    this.methods.set(this.getStorageKey(key), JSON.stringify(value));
  }

  //=========================================================================================================
  // Remove
  //=========================================================================================================
  /**
   * @public
   * Removes value at provided Key
   * @param key - Key of Storage property
   */
  public remove(key: StorageItemKey): void {
    if (!this.ready || !this.methods.remove) return;
    this.methods.remove(this.getStorageKey(key));
  }

  //=========================================================================================================
  // Get Storage Key
  //=========================================================================================================
  /**
   * @internal
   * Creates Storage Key from provided key
   * @param key - Key that gets converted into a Storage Key
   */
  private getStorageKey(key: StorageItemKey): string {
    return `_${this.config.prefix}_${key}`;
  }
}

export type StorageKey = string | number;
export type StorageItemKey = string | number;

/**
 * @param key - Key/Name of Storage
 * @param methods - Storage methods like (get, set, remove)
 */
export interface CreateStorageConfigInterface extends StorageConfigInterface {
  key: string;
  methods: StorageMethodsInterface;
}

/**
 * @param get - Get Method of Storage (gets items from storage)
 * @param set - Set Method of Storage (saves/updates items in storage)
 * @param remove - Remove Methods of Storage (removes items from storage)
 */
export interface StorageMethodsInterface {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  remove: (key: string) => void;
}

/**
 * @param async - If its an async storage
 * @param prefix - Prefix of Storage Property
 */
export interface StorageConfigInterface {
  async?: boolean;
  prefix?: string;
}
