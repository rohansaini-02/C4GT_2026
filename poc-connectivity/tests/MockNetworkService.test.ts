import { MockNetworkService } from '../src/MockNetworkService';

describe('MockNetworkService', () => {
  let networkService: MockNetworkService;

  beforeEach(() => {
    networkService = new MockNetworkService();
  });

  test('should initialize with default online state', () => {
    expect(networkService.isOnline()).toBe(true);
    expect(networkService.getNetworkState().isConnected).toBe(true);
  });

  test('should reflect offline state when simulated', () => {
    networkService.simulateOffline();
    expect(networkService.isOnline()).toBe(false);
    expect(networkService.getNetworkState().isConnected).toBe(false);
  });

  test('should notify listeners on state change', () => {
    const listener = jest.fn();
    networkService.subscribe(listener);

    expect(listener).toHaveBeenCalledTimes(1);

    networkService.simulateOffline();
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isConnected: false }));

    networkService.simulateOnline('cellular');
    expect(listener).toHaveBeenCalledTimes(3);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isConnected: true, type: 'cellular' }));

    networkService.simulateOnline();
    expect(listener).toHaveBeenCalledTimes(4);
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({ isConnected: true, type: 'wifi' }));
  });

  test('should stop notifying after unsubscribe', () => {
    const listener = jest.fn();
    const unsubscribe = networkService.subscribe(listener);
    
    unsubscribe();
    networkService.simulateOffline();
    
    expect(listener).toHaveBeenCalledTimes(1);
  });

  test('should allow custom initial state', () => {
    const customService = new MockNetworkService({ isConnected: false, type: 'none' });
    expect(customService.isOnline()).toBe(false);
  });
});
