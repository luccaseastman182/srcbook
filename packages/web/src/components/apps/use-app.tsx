import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { AppType } from '@srcbook/shared';
import { updateApp as doUpdateApp } from '@/clients/http/apps';
import { AppChannel } from '@/clients/websocket';

export interface AppContextValue {
  app: AppType;
  channel: AppChannel;
  updateApp: (attrs: { name: string }) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

type ProviderPropsType = {
  app: AppType;
  children: React.ReactNode;
};

export function AppProvider({ app: initialApp, children }: ProviderPropsType) {
  const [app, setApp] = useState(initialApp);

  const channelRef = useRef(AppChannel.create(app.id));

  useEffect(() => {
    // If the app ID has changed, create a new channel for the new app.
    if (channelRef.current.appId !== app.id) {
      channelRef.current.unsubscribe();
      channelRef.current = AppChannel.create(app.id);
    }

    // Subscribe to the channel
    channelRef.current.subscribe();

    // Unsubscribe when the component is unmounted
    return () => channelRef.current.unsubscribe();
  }, [app.id]);

  async function updateApp(attrs: { name: string }) {
    try {
      const { data: updatedApp } = await doUpdateApp(app.id, attrs);
      setApp(updatedApp);
    } catch (error) {
      console.error('Failed to update app:', error);
      // Implement state recovery mechanism here
    }
  }

  return (
    <AppContext.Provider value={{ app, updateApp, channel: channelRef.current }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
