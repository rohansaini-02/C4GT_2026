export interface SyncJob<T = unknown> {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  timestamp: number;
  retryCount: number;
}

export interface IStorageProvider {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
}

export class SyncQueue<T = unknown> {
  private queue: SyncJob<T>[] = [];
  private storage: IStorageProvider;
  private readonly storageKey: string;
  private writePromise: Promise<void> = Promise.resolve();

  constructor(storage: IStorageProvider, storageKey: string = 'sync_queue') {
    this.storage = storage;
    this.storageKey = storageKey;
  }

  public async initialize(): Promise<void> {
    await this.loadFromStorage();
  }

  public async enqueue(job: Omit<SyncJob<T>, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const newJob: SyncJob<T> = {
      ...job,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.queue.push(newJob);
    await this.persistToStorage();
  }

  public peek(): SyncJob<T> | undefined {
    return this.queue[0];
  }

  public async dequeue(): Promise<SyncJob<T> | undefined> {
    const job = this.queue.shift();
    await this.persistToStorage();
    return job;
  }

  public async requeue(job: SyncJob<T>): Promise<void> {
    job.retryCount += 1;
    await this.persistToStorage();
  }

  public getLength(): number {
    return this.queue.length;
  }

  private async persistToStorage(): Promise<void> {
    this.writePromise = this.writePromise.then(async () => {
      try {
        const data = JSON.stringify(this.queue);
        await this.storage.setItem(this.storageKey, data);
      } catch (error) {
        console.error('[SyncQueue] Failed to persist queue:', error);
      }
    });
    return this.writePromise;
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = await this.storage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.queue = parsed;
          return;
        }
      }
    } catch (error) {
      console.error('[SyncQueue] Failed to load queue or data was corrupted:', error);
    }
    this.queue = [];
  }
}
