export type NetworkState = {
  isConnected: boolean;
  type: 'wifi' | 'cellular' | 'none' | 'unknown';
  isInternetReachable: boolean | null;
};

export type NetworkChangeListener = (state: NetworkState) => void;

export interface INetworkService {
  getNetworkState(): NetworkState;

  isOnline(): boolean;

  subscribe(listener: NetworkChangeListener): () => void;
}
