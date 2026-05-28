export interface SyncJob<T = unknown> {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: T;
  timestamp: number;
  retryCount: number;
}

export class SyncQueue<T = unknown> {
  private queue: SyncJob<T>[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public enqueue(job: Omit<SyncJob<T>, 'id' | 'timestamp' | 'retryCount'>): void {
    const newJob: SyncJob<T> = {
      ...job,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.queue.push(newJob);
    this.persistToStorage();
  }

  public peek(): SyncJob<T> | undefined {
    return this.queue[0];
  }

  public dequeue(): SyncJob<T> | undefined {
    const job = this.queue.shift();
    this.persistToStorage();
    return job;
  }

  public requeue(job: SyncJob<T>): void {
    job.retryCount += 1;
    this.persistToStorage();
  }

  public getLength(): number {
    return this.queue.length;
  }

  private persistToStorage() {
  }

  private loadFromStorage() {
    this.queue = [];
  }
}
