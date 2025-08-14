chrome.storage.local.get({hosts: []}, ({hosts}) => {
  if (hosts.some(host => host === document.location.host)) {
    chrome.runtime.sendMessage({type: "show_page_action"});
    init();
  }
});

function init() {
  // O restante do seu código de content.js permanece o mesmo.
  // ...
}
