export default defineBackground(() => {
  const sidePanelApi = (
    browser as unknown as {
      sidePanel?: {
        setPanelBehavior?: (opts: {
          openPanelOnActionClick: boolean;
        }) => Promise<void>;
      };
    }
  ).sidePanel;

  if (sidePanelApi?.setPanelBehavior) {
    void sidePanelApi
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch(() => {
        // Side Panel behavior API unavailable in older Chromium runtimes
      });
  }

  const notifySidePanelActiveTab = async () => {
    if (!browser.tabs?.query || !browser.runtime?.sendMessage) return;
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const url = tabs[0]?.url ?? null;
      await browser.runtime.sendMessage({
        type: 'VS_ACTIVE_TAB_SYNC',
        url,
      });
    } catch {
      // Safe noop when Side Panel is closed or activeTab URL is not yet accessible
    }
  };

  browser.tabs?.onActivated?.addListener(() => {
    void notifySidePanelActiveTab();
  });

  browser.tabs?.onUpdated?.addListener((_tabId, changeInfo, tab) => {
    if (tab?.active && (changeInfo.url || changeInfo.status === 'complete')) {
      void notifySidePanelActiveTab();
    }
  });

  browser.windows?.onFocusChanged?.addListener(() => {
    void notifySidePanelActiveTab();
  });
});
