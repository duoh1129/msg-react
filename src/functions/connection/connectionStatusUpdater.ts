import { Network } from '@capacitor/network';
import { stat } from 'fs';
import store from 'src/services/redux/store';

export const startNetworkStatusListener = async () => {
  // when we open the app
  Network.getStatus().then((status) => {
    store.dispatch({ type: 'setConnectedStatus', value: status.connected });
  });

  // listener
  Network.addListener('networkStatusChange', (status) => {
    store.dispatch({ type: 'setConnectedStatus', value: status.connected });
  });
};

export const stopNetworkStatusListener = async () => {
  Network.removeAllListeners();
};
