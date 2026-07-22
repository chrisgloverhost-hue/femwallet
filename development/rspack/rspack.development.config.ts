import { rspack } from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';

import { webPort } from './constant';

import type { RspackOptions, RspackPluginInstance } from '@rspack/core';

interface IDevConfigOptions {
  basePath: string;
}

export function createDevelopmentConfig({
  basePath: _basePath,
}: IDevConfigOptions): RspackOptions {
  return {
    mode: 'development',
    devtool: 'cheap-module-source-map',
    plugins: [
      new rspack.HotModuleReplacementPlugin(),
      new ReactRefreshPlugin({
        overlay: false,
      }) as unknown as RspackPluginInstance,
      new rspack.DefinePlugin({
        __CURRENT_FILE_PATH__: JSON.stringify(
          '__CURRENT_FILE_PATH__--rspack-dev',
        ),
      }),
    ],
    devServer: {
      open: true,
      hot: true,
      historyApiFallback: true,
      port: parseInt(webPort, 10),
      allowedHosts: 'all',
      compress: true,
      client: {
        overlay: false,
      },
      setupMiddlewares: (
        middlewares: any[],
        devServer: { app?: { get: (path: string, handler: any) => void } },
      ) => {
        // Health-check endpoint — NetworkReachabilityTracker polls this on
        // web so the "You are offline" banner does not appear in dev/Replit.
        devServer.app?.get('/wallet/v1/health', (_req: any, res: any) => {
          res.status(200).json({ ok: true, env: 'dev' });
        });
        return middlewares;
      },
    } as RspackOptions['devServer'],
    cache: true,
  };
}
