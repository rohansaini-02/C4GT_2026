import { SyncQueue } from '../src/SyncQueue';
import { SyncManager } from '../src/SyncManager';

describe('Offline-First Sync Engine', () => {
  let queue: SyncQueue;
  let manager: SyncManager;

  beforeEach(() => {
    queue = new SyncQueue();
    manager = new SyncManager(queue);
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should enqueue mutations successfully', () => {
    queue.enqueue({
      url: '/api/resource/LMS Assignment Submission',
      method: 'POST',
      payload: { answer: 'A', assignment_id: '123' },
    });

    expect(queue.getLength()).toBe(1);
    expect(queue.peek()?.url).toBe('/api/resource/LMS Assignment Submission');
  });

  test('should not process queue when offline', async () => {
    queue.enqueue({ url: '/api/resource/Course', method: 'POST', payload: {} });
    
    manager.updateNetworkStatus(false);
    await manager.drainQueue();

    expect(queue.getLength()).toBe(1);
  });

  test('should drain queue when online', async () => {
    (manager as any).mockFrappeApiCall = jest.fn().mockResolvedValue(undefined);

    queue.enqueue({ url: '/api/resource/A', method: 'POST', payload: {} });
    queue.enqueue({ url: '/api/resource/B', method: 'POST', payload: {} });

    manager.updateNetworkStatus(true);
    
    await new Promise(process.nextTick);
    await new Promise(process.nextTick);

    expect(queue.getLength()).toBe(0);
  });

  test('should support and preserve typed payloads', () => {
    interface AssignmentPayload {
      answer: string;
      assignment_id: string;
    }
    const typedQueue = new SyncQueue<AssignmentPayload>();
    typedQueue.enqueue({
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
});
