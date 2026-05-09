export interface SyncJob {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  timestamp: number;
  retryCount: number;
}

export class SyncQueue {
  private queue: SyncJob[] = [];

  constructor() {
    this.loadFromStorage();
  }

  public enqueue(job: Omit<SyncJob, 'id' | 'timestamp' | 'retryCount'>): void {
    const newJob: SyncJob = {
      ...job,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      retryCount: 0,
    };
    this.queue.push(newJob);
    this.persistToStorage();
  }

  public peek(): SyncJob | undefined {
    return this.queue[0];
  }

  public dequeue(): SyncJob | undefined {
    const job = this.queue.shift();
    this.persistToStorage();
    return job;
  }

  public requeue(job: SyncJob): void {
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
