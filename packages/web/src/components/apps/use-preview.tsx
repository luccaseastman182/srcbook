import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

import { AppChannel } from '@/clients/websocket';
import { PreviewStatusPayloadType } from '@srcbook/shared';
import useEffectOnce from '@/components/use-effect-once';
import { usePackageJson } from './use-package-json';
import { useLogs } from './use-logs';

export type PreviewStatusType = 'booting' | 'connecting' | 'running' | 'stopped';

export interface PreviewContextValue {
  url: string | null;
  status: PreviewStatusType;
  stop: () => void;
  start: () => void;
  exitCode: number | null;
}

const PreviewContext = createContext<PreviewContextValue | undefined>(undefined);

type ProviderPropsType = {
  channel: AppChannel;
  children: React.ReactNode;
};

export function PreviewProvider({ channel, children }: ProviderPropsType) {
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<PreviewStatusType>('connecting');
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [backgroundProcessing, setBackgroundProcessing] = useState<boolean>(false);

  const { npmInstall, nodeModulesExists } = usePackageJson();
  const { addLog } = useLogs();

  useEffect(() => {
    function onStatusUpdate(payload: PreviewStatusPayloadType) {
      setUrl(payload.url);
      setStatus(payload.status);

      switch (payload.status) {
        case 'booting':
          addLog('info', 'srcbook', 'Dev server is booting...');
          setLoading(true);
          break;
        case 'running':
          addLog('info', 'srcbook', `Dev server is running at ${payload.url}`);
          setLoading(false);
          setBackgroundProcessing(false);
          break;
        case 'stopped':
          addLog('info', 'srcbook', `Dev server exited with status ${payload.code}`);
          setExitCode(payload.code);
          setLoading(false);
          setBackgroundProcessing(false);
          break;
      }
    }

    channel.on('preview:status', onStatusUpdate);

    return () => channel.off('preview:status', onStatusUpdate);
  }, [channel, addLog]);

  async function start() {
    if (nodeModulesExists === false) {
      await npmInstall();
    }
    setLoading(true);
    setBackgroundProcessing(true);
    channel.push('preview:start', {});
  }

  const stop = useCallback(() => {
    setLoading(false);
    setBackgroundProcessing(false);
    channel.push('preview:stop', {});
  }, [channel]);

  // If the node_modules directory gets deleted, then stop the preview server
  useEffect(() => {
    if (nodeModulesExists !== false) {
      return;
    }
    stop();
  }, [nodeModulesExists, stop]);

  // When the page initially loads, start the vite server
  useEffectOnce(() => {
    start();
  });

  return (
    <PreviewContext.Provider value={{ url, status, stop, start, exitCode }}>
      {children}
      {loading && <div>Loading...</div>}
      {backgroundProcessing && <div>Background processing...</div>}
    </PreviewContext.Provider>
  );
}

export function usePreview(): PreviewContextValue {
  return useContext(PreviewContext) as PreviewContextValue;
}
