import { SyncQueue, SyncJob } from './SyncQueue';

export interface SyncHandler<T = unknown> {
  handle(job: SyncJob<T>): Promise<void>;
}

export class SyncManager<T = unknown> {
  private queue: SyncQueue<T>;
  private handler: SyncHandler<T>;
  private isOnline: boolean = false;
  private isProcessing: boolean = false;

  constructor(queue: SyncQueue<T>, handler: SyncHandler<T>) {
    this.queue = queue;
    this.handler = handler;
  }

  public updateNetworkStatus(online: boolean) {
    console.log(`[Network] Status changed to ${online ? 'ONLINE' : 'OFFLINE'}`);
    this.isOnline = online;
    if (this.isOnline) {
      this.drainQueue();
    }
  }

  public getQueueLength(): number {
    return this.queue.getLength();
  }

  public async drainQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.queue.getLength() === 0) {
      return;
    }

    this.isProcessing = true;
    
    while (this.queue.getLength() > 0 && this.isOnline) {
      const job = this.queue.peek();
      if (!job) break;

      try {
        console.log(`[SyncManager] Attempting to sync job ${job.id} (${job.method} ${job.url})`);
        
        await this.handler.handle(job);
        
        console.log(`[SyncManager] Successfully synced job ${job.id}`);
        await this.queue.dequeue();
      } catch (error) {
        console.error(`[SyncManager] Sync failed for job ${job.id}`);
        
        if (!this.isOnline) {
          break;
        }

        if (job.retryCount >= 5) {
          console.error(`[SyncManager] Max retries reached for job ${job.id}. Dropping or moving to DLQ.`);
          await this.queue.dequeue();
        } else {
          await this.queue.requeue(job);
          const backoffTime = Math.pow(2, job.retryCount) * 1000;
          console.log(`[SyncManager] Backing off for ${backoffTime}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    this.isProcessing = false;
  }
}
