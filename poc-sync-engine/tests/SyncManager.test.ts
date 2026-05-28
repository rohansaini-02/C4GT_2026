import { SyncQueue, IStorageProvider } from '../src/SyncQueue';
import { SyncManager, SyncHandler } from '../src/SyncManager';

class SyncMockStorage implements IStorageProvider {
  public store: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

class AsyncMockStorage implements IStorageProvider {
  public store: { [key: string]: string } = {};

  async getItem(key: string): Promise<string | null> {
    return this.store[key] || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.store[key] = value;
  }
}

describe('Offline-First Sync Engine', () => {
  let queue: SyncQueue;
  let manager: SyncManager;
  let mockHandler: jest.Mocked<SyncHandler>;
  let storage: SyncMockStorage;

  beforeEach(async () => {
    storage = new SyncMockStorage();
    queue = new SyncQueue(storage);
    await queue.initialize();
    mockHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    manager = new SyncManager(queue, mockHandler);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should enqueue mutations successfully', async () => {
    await queue.enqueue({
      url: '/api/resource/LMS Assignment Submission',
      method: 'POST',
      payload: { answer: 'A', assignment_id: '123' },
    });

    expect(queue.getLength()).toBe(1);
    expect(queue.peek()?.url).toBe('/api/resource/LMS Assignment Submission');
    
    const stored = JSON.parse(storage.store['sync_queue'] || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].url).toBe('/api/resource/LMS Assignment Submission');
  });

  test('should not process queue when offline', async () => {
    await queue.enqueue({ url: '/api/resource/Course', method: 'POST', payload: {} });
    
    manager.updateNetworkStatus(false);
    await manager.drainQueue();

    expect(queue.getLength()).toBe(1);
    expect(mockHandler.handle).not.toHaveBeenCalled();
  });

  test('should drain queue when online', async () => {
    mockHandler.handle.mockResolvedValue(undefined);

    await queue.enqueue({ url: '/api/resource/A', method: 'POST', payload: {} });
    await queue.enqueue({ url: '/api/resource/B', method: 'POST', payload: {} });

    manager.updateNetworkStatus(true);
    
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(queue.getLength()).toBe(0);
    expect(mockHandler.handle).toHaveBeenCalledTimes(2);
  });

  test('should support and preserve typed payloads', async () => {
    interface AssignmentPayload {
      answer: string;
      assignment_id: string;
    }
    const typedQueue = new SyncQueue<AssignmentPayload>(storage);
    await typedQueue.initialize();
    await typedQueue.enqueue({
      url: '/api/resource/LMS Assignment Submission',
      method: 'POST',
      payload: { answer: 'B', assignment_id: '456' },
    });

    const job = typedQueue.peek();
    expect(job).toBeDefined();
    if (job) {
      const payload: AssignmentPayload = job.payload;
      expect(payload.answer).toBe('B');
      expect(payload.assignment_id).toBe('456');
    }
  });

  test('should retry on handler failure', async () => {
    jest.useFakeTimers();
    mockHandler.handle
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue(undefined);

    await queue.enqueue({ url: '/api/resource/A', method: 'POST', payload: {} });

    manager.updateNetworkStatus(true);

    await Promise.resolve(); // trigger initial attempt and failure
    await jest.advanceTimersByTimeAsync(2000); // trigger retry attempt

    expect(queue.getLength()).toBe(0);
    expect(mockHandler.handle).toHaveBeenCalledTimes(2);
    jest.useRealTimers();
  });

  test('should hydrate queue from storage correctly', async () => {
    const freshStorage = new SyncMockStorage();
    freshStorage.setItem('sync_queue', JSON.stringify([
      { id: '1', url: '/api/resource/A', method: 'POST', payload: {}, timestamp: Date.now(), retryCount: 0 }
    ]));
    
    const freshQueue = new SyncQueue(freshStorage);
    await freshQueue.initialize();
    expect(freshQueue.getLength()).toBe(1);
    expect(freshQueue.peek()?.id).toBe('1');
  });

  test('should handle corrupted JSON data gracefully on initialize', async () => {
    const freshStorage = new SyncMockStorage();
    freshStorage.setItem('sync_queue', '{invalid_json}');
    
    const freshQueue = new SyncQueue(freshStorage);
    await freshQueue.initialize();
    expect(freshQueue.getLength()).toBe(0);
  });

  test('should prevent write race conditions under concurrent mutations', async () => {
    const asyncStorage = new AsyncMockStorage();
    const freshQueue = new SyncQueue(asyncStorage);
    await freshQueue.initialize();

    const p1 = freshQueue.enqueue({ url: '/api/A', method: 'POST', payload: {} });
    const p2 = freshQueue.enqueue({ url: '/api/B', method: 'POST', payload: {} });
    
    await Promise.all([p1, p2]);

    expect(freshQueue.getLength()).toBe(2);
    const stored = JSON.parse(await asyncStorage.getItem('sync_queue') || '[]');
    expect(stored.length).toBe(2);
    expect(stored[0].url).toBe('/api/A');
    expect(stored[1].url).toBe('/api/B');
  });
});
