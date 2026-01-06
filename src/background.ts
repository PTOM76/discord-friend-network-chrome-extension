// 拡張機能のボタンをクリックするとview.htmlを開く
chrome.action.onClicked.addListener((_t) => {
    chrome.tabs.create({
        url: 'view.html'
    });
});
