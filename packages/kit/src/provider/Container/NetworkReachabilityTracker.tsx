import { useEffect, useState } from 'react';

import { configureNetInfo, refreshNetInfo } from '@onekeyhq/components';
import { useDevSettingsPersistAtom } from '@onekeyhq/kit-bg/src/states/jotai/atoms/devSettings';
import { ONEKEY_HEALTH_CHECK_URL } from '@onekeyhq/shared/src/config/appConfig';
import {
  getEndpointByServiceName,
  getEndpointsMapByDevSettings,
} from '@onekeyhq/shared/src/config/endpointsMap';
import {
  EAppEventBusNames,
  appEventBus,
} from '@onekeyhq/shared/src/eventBus/appEventBus';
import platformEnv from '@onekeyhq/shared/src/platformEnv';
import { EServiceEndpointEnum } from '@onekeyhq/shared/types/endpoint';

const REACHABILITY_LONG_TIMEOUT = 60 * 1000;
const REACHABILITY_SHORT_TIMEOUT = 5 * 1000;
const REACHABILITY_REQUEST_TIMEOUT = 10 * 1000;

/**
 * Build the health-check URL to use for connectivity polling.
 *
 * On web we use the *current page origin* so the check works in any
 * environment (Replit dev, localhost, production) without depending on
 * OneKey's own backend being reachable.  The dev server exposes the same
 * `/wallet/v1/health` path and returns 200.  On native/desktop we keep the
 * original behaviour of prepending the resolved backend endpoint.
 */
const buildReachabilityUrl = (endpoint: string): string => {
  if (platformEnv.isWeb && typeof window !== 'undefined') {
    return `${window.location.origin}${ONEKEY_HEALTH_CHECK_URL}`;
  }
  return `${endpoint}${ONEKEY_HEALTH_CHECK_URL}`;
};

const checkNetInfo = async (endpoint: string) => {
  configureNetInfo({
    reachabilityUrl: buildReachabilityUrl(endpoint),
    reachabilityLongTimeout: REACHABILITY_LONG_TIMEOUT,
    reachabilityShortTimeout: REACHABILITY_SHORT_TIMEOUT,
    reachabilityRequestTimeout: REACHABILITY_REQUEST_TIMEOUT,
  });
};

const useNetInfo = () => {
  const [devSettings] = useDevSettingsPersistAtom();
  const [walletEndpoint, setWalletEndpoint] = useState<string>('');

  useEffect(() => {
    let isCancelled = false;

    const fetchEndpoint = async () => {
      try {
        const endpoint = await getEndpointByServiceName(
          EServiceEndpointEnum.Wallet,
        );
        if (!isCancelled) {
          setWalletEndpoint(endpoint);
        }
      } catch (_error) {
        // Fallback to static endpoint on error
        if (!isCancelled) {
          const fallbackEndpoint =
            getEndpointsMapByDevSettings(devSettings).wallet;
          setWalletEndpoint(fallbackEndpoint);
        }
      }
    };

    void fetchEndpoint();

    return () => {
      isCancelled = true;
    };
  }, [devSettings]);

  useEffect(() => {
    if (!walletEndpoint) {
      return;
    }
    void checkNetInfo(walletEndpoint);
    const callback = () => {
      refreshNetInfo();
    };
    appEventBus.on(EAppEventBusNames.RefreshNetInfo, callback);
    return () => {
      appEventBus.off(EAppEventBusNames.RefreshNetInfo, callback);
    };
  }, [walletEndpoint]);
};

export function NetworkReachabilityTracker() {
  useNetInfo();
  return null;
}
