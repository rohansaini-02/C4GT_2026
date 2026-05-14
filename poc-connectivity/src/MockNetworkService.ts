import { INetworkService, NetworkState, NetworkChangeListener } from './INetworkService';

export class MockNetworkService implements INetworkService {
  private state: NetworkState;
  private listeners: Set<NetworkChangeListener> = new Set();

  constructor(initialState?: Partial<NetworkState>) {
    this.state = {
      isConnected: true,
      type: 'wifi',
      isInternetReachable: true,
      ...initialState,
    };
  }

  getNetworkState(): NetworkState {
    return { ...this.state };
  }

  isOnline(): boolean {
    return this.state.isConnected && this.state.isInternetReachable !== false;
  }

  subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getNetworkState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  setNetworkState(newState: Partial<NetworkState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  simulateOffline(): void {
    this.setNetworkState({
      isConnected: false,
      type: 'none',
      isInternetReachable: false,
    });
  }

  simulateOnline(type: 'wifi' | 'cellular' = 'wifi'): void {
    this.setNetworkState({
      isConnected: true,
      type,
      isInternetReachable: true,
    });
  }

  private notifyListeners(): void {
    const currentState = this.getNetworkState();
    this.listeners.forEach((listener) => listener(currentState));
  }
}
