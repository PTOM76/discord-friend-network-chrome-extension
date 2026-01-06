const showMeCheckbox = document.getElementById('showMeCheckbox');
const enableDetectionCheckbox = document.getElementById('enableDetectionCheckbox');
const languageSelect = document.getElementById('languageSelect');
const importBtn = document.getElementById('importBtn');
const exportBtn = document.getElementById('exportBtn');
const resetBtn = document.getElementById('resetBtn');
const hiddenNodesList = document.getElementById('hidden-nodes-list');

const defaultSettings = {
    showMeNode: false, // 自分ノードの表示
    enableDetection: true, // 検出の有効 (Hookする)
    language: navigator.language.startsWith('ja') ? 'ja' : 'en' // ブラウザ設定をデフォルトに
};
let currentSettings = { ...defaultSettings };

async function renderHiddenList() {
    const data = await new Promise(resolve => chrome.storage.local.get(['meshData', 'hiddenNodes'], resolve));
    const allNodes = data.meshData?.nodes || [];
    const hiddenIds = data.hiddenNodes || [];

    hiddenNodesList.innerHTML = '';

    if (hiddenIds.length === 0 || hiddenIds.every(id => id === 'me')) {
        hiddenNodesList.innerHTML = '<p class="empty-list-message">' + i18n[currentSettings.language].emptyList + '</p>';
        return;
    }

    const nodeMap = new Map(allNodes.map(node => [node.id, node]));

    hiddenIds.forEach(id => {
        const node = nodeMap.get(id);

        if (node && node.id !== 'me') {
            const item = document.createElement('div');
            item.className = 'hidden-node-item';
            item.innerHTML = `
                <span>${node.label || node.id}</span>
                <button class="btn-show" data-node-id="${id}">${i18n[currentSettings.language].unhide}</button>
            `;
            hiddenNodesList.appendChild(item);
        }
    });
}

async function unhideNode(nodeId) {
    const data = await new Promise(resolve => chrome.storage.local.get(['hiddenNodes'], resolve));
    let hiddenIds = data.hiddenNodes || [];
    
    hiddenIds = hiddenIds.filter(id => id !== nodeId);

    await new Promise(resolve => chrome.storage.local.set({ hiddenNodes: hiddenIds }, resolve));
    
    await renderHiddenList();
}

document.addEventListener('DOMContentLoaded', async () => {
    const data = await new Promise(resolve => chrome.storage.local.get(['settings'], resolve));
    currentSettings = { ...defaultSettings, ...(data.settings || {}) };
    showMeCheckbox.checked = currentSettings.showMeNode;
    enableDetectionCheckbox.checked = currentSettings.enableDetection;
    languageSelect.value = currentSettings.language;

    await renderHiddenList();
    applyLanguage(currentSettings.language);

    showMeCheckbox.addEventListener('change', async (e) => {
        currentSettings.showMeNode = e.target.checked;
        await new Promise(resolve => chrome.storage.local.set({ settings: currentSettings }, resolve));
    });

    enableDetectionCheckbox.addEventListener('change', async (e) => {
        currentSettings.enableDetection = e.target.checked;
        await new Promise(resolve => chrome.storage.local.set({ settings: currentSettings }, resolve));
    });

    languageSelect.addEventListener('change', async (e) => {
        currentSettings.language = e.target.value;
        applyLanguage(currentSettings.language);
        await new Promise(resolve => chrome.storage.local.set({ settings: currentSettings }, resolve));
    });
    
    // hidden node list btn
    hiddenNodesList.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('btn-show')) {
            const nodeId = e.target.getAttribute('data-node-id');
            if (nodeId)
                await unhideNode(nodeId);
        }
    });

    // Import Btn
    importBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const imported = JSON.parse(event.target.result);
                    const meshData = imported.meshData || imported;
                    const hiddenNodes = imported.hiddenNodes || [];
                    const settings = imported.settings || defaultSettings;
                    
                    chrome.storage.local.set({ meshData, hiddenNodes, settings }, async () => {
                        alert('Import successful');

                        // Update UI state after import
                        showMeCheckbox.checked = settings.showMeNode;
                        enableDetectionCheckbox.checked = settings.enableDetection;
                        await renderHiddenList(); 
                    });
                } catch (err) {
                    alert('Failed to import data: ' + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    });

    // Export Btn
    exportBtn.addEventListener('click', () => {
        chrome.storage.local.get(['meshData', 'hiddenNodes', 'settings'], (result) => {
            const exportData = {
                meshData: result.meshData || { nodes: [], edges: [] },
                hiddenNodes: result.hiddenNodes || [],
                settings: result.settings || defaultSettings
            };
            const dataStr = JSON.stringify(exportData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'discord_friend_network_backup.json';
            a.click();
            URL.revokeObjectURL(url);
        });
    });

    // Reset Btn
    resetBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all network data, hidden nodes, and settings? This cannot be undone.')) {
            chrome.storage.local.remove(['meshData', 'hiddenNodes', 'settings'], async () => {
                showMeCheckbox.checked = defaultSettings.showMeNode;
                enableDetectionCheckbox.checked = defaultSettings.enableDetection;

                await renderHiddenList();
            });
        }
    });
});

// 言語関連
const i18n = {
    en: {
        title: "Settings",
        showMe: "Show \"me\" node",
        enableDet: "Enable Detection (Hook)",
        hideList: "Hide List",
        emptyList: "No nodes are hidden.",
        import: "Import",
        export: "Export",
        reset: "Reset",
        resetConfirm: "Are you sure you want to delete all data?",
        importSuccess: "Import successful",
        unhide: "Show"
    },
    ja: {
        title: "設定",
        showMe: "自分のノードを表示する",
        enableDet: "自動検出(フック)を有効にする",
        hideList: "非表示リスト",
        emptyList: "非表示にしたノードはありません。",
        import: "インポート",
        export: "エクスポート",
        reset: "リセット",
        resetConfirm: "すべてのデータを削除してもよろしいですか？",
        importSuccess: "インポートが完了しました",
        unhide: "表示"
    }
};

function applyLanguage(lang) {
    const t = i18n[lang] || i18n.en;
    document.querySelector('.settings-header h2').textContent = t.title;
    document.getElementById('showMeLabel').textContent = t.showMe;
    document.getElementById('enableDetectionLabel').textContent = t.enableDet;
    document.querySelector('.setting-section h3').textContent = t.hideList;
    document.getElementById('importBtn').textContent = t.import;
    document.getElementById('exportBtn').textContent = t.export;
    document.getElementById('resetBtn').textContent = t.reset;
}
