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
});
