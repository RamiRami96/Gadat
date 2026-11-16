// The toolbar button opens the app in its own tab (a popup would close during the fingerprint prompt).
chrome.action.onClicked.addListener(async () => {
  const url = chrome.runtime.getURL('index.html');
  const [existing] = await chrome.tabs.query({ url });
  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url });
  }
});
