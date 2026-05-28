import { SyncQueue, SyncJob } from './SyncQueue';

export class SyncManager<T = unknown> {
  private queue: SyncQueue<T>;
  private isOnline: boolean = false;
  private isProcessing: boolean = false;

  constructor(queue: SyncQueue<T>) {
    this.queue = queue;
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
        
        await this.mockFrappeApiCall(job);
        
        console.log(`[SyncManager] Successfully synced job ${job.id}`);
        this.queue.dequeue();
      } catch (error) {
        console.error(`[SyncManager] Sync failed for job ${job.id}`);
        
        if (!this.isOnline) {
          break;
        }

        if (job.retryCount >= 5) {
          console.error(`[SyncManager] Max retries reached for job ${job.id}. Dropping or moving to DLQ.`);
          this.queue.dequeue();
        } else {
          this.queue.requeue(job);
          const backoffTime = Math.pow(2, job.retryCount) * 1000;
          console.log(`[SyncManager] Backing off for ${backoffTime}ms before next attempt`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    this.isProcessing = false;
  }

  private async mockFrappeApiCall(job: SyncJob<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.7) {
          reject(new Error('Network Timeout'));
        } else {
          resolve();
        }
      }, 200);
    });
  }
}
