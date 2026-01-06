const container = document.getElementById('network');
const statsEl = document.getElementById('stats');
const contextMenu = document.getElementById('context-menu');
const hideNodeBtn = document.getElementById('hideNodeBtn');
const deleteNodeBtn = document.getElementById('deleteNodeBtn');
const settingsBtn = document.getElementById('settingsBtn');

let network = null;
let allData = { nodes: new vis.DataSet(), edges: new vis.DataSet() };
let hiddenNodeIds = [];
let selectedNodeId = null;

const defaultSettings = {
    showMeNode: false
};
let currentSettings = { ...defaultSettings };

// データを読み込んで描画する関数
async function loadAndDraw() {
    // 設定を読み込む
    const settingsResult = await new Promise(resolve => chrome.storage.local.get(['settings'], resolve));
    currentSettings = { ...defaultSettings, ...(settingsResult.settings || {}) };

    // 非表示リストを読み込む
    let hiddenResult = await new Promise(resolve => chrome.storage.local.get(['hiddenNodes'], resolve));
    hiddenNodeIds = hiddenResult.hiddenNodes || [];

    // 'me' ノードの表示設定をチェック
    if (!currentSettings.showMeNode) {
        if (!hiddenNodeIds.includes('me')) {
            hiddenNodeIds.push('me');
        }
    } else {
        hiddenNodeIds = hiddenNodeIds.filter(id => id !== 'me');
    }
    
    // メッシュデータを読み込む
    const result = await new Promise(resolve => chrome.storage.local.get(['meshData'], resolve));
    console.log("[Viewer] Loaded data from storage:", result);
    const rawData = result.meshData || { nodes: [], edges: [] };

    // 非表示ノードを除外
    const visibleNodes = rawData.nodes.filter(n => !hiddenNodeIds.includes(n.id));
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = rawData.edges.filter(e => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to));
    
    let data = { nodes: visibleNodes, edges: visibleEdges };

    // Vis.jsのデータセットに変換
    const nodes = new vis.DataSet(data.nodes);
    const edges = new vis.DataSet(data.edges);

    // "me"ノードを全員につなぐ処理 (表示設定がオンの場合のみ) 
    if (currentSettings.showMeNode) {
        const meNode = nodes.get('me');
        if (meNode) {
            nodes.forEach(n => {
                if (n.id !== 'me') { //自分以外
                    const exists = edges.get({
                        filter: e => (e.from === 'me' && e.to === n.id) || (e.from === n.id && e.to === 'me')
                    }).length > 0;

                    if (!exists) {
                        edges.add({ from: 'me', to: n.id, color: { color: 'rgba(88, 101, 242, 0.3)' } });
                    }
                }
            });
        }
    }
    
    data = { nodes, edges };

    // 統計更新 (非表示も含む元の数)
    statsEl.innerText = `Nodes: ${data.nodes.length} (${rawData.nodes.length}) | Edges: ${data.edges.length} (${rawData.edges.length})`;

    if (data.nodes.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding-top: 50px; color: #999;">No data yet. Browse Discord profiles to build the network.</div>';
        if (network) {
            network.destroy();
            network = null;
        }
        return; 
    }

    // image が null.pngの場合、brokenImage に置き換える
    data.nodes.forEach(node => {
        if (node.image && node.image.endsWith('null.png')) {
            node.image = node.brokenImage;
        }
    });

    allData = { nodes: data.nodes, edges: data.edges };

    const graphData = { nodes: allData.nodes, edges: allData.edges };
    
    const options = {
        nodes: {
            borderWidth: 2,
            size: 30,
            color: { border: '#222428', background: '#5865F2' },
            font: { color: '#ffffff' }
        },
        edges: {
            color: { color: '#555', inherit: false },
            smooth: { type: 'continuous' }
        },
        physics: {
            stabilization: true,
            forceAtlas2Based: {
                gravitationalConstant: -50,
                centralGravity: 0.01,
                springLength: 100,
                springConstant: 0.08
            },
            solver: 'forceAtlas2Based'
        }
    };

    if (network) {
        network.setData(graphData);
    } else {
        network = new vis.Network(container, graphData, options);
        setupEventListeners();
    }
}

// 右クリックメニューと設定の処理
function setupEventListeners() {
    network.on("oncontext", (params) => {
        params.event.preventDefault();
        selectedNodeId = network.getNodeAt(params.pointer.DOM);

        if (selectedNodeId) {
            // 'me'ノードでは非表示・削除メニューを出さない
            if (selectedNodeId === 'me') {
                contextMenu.style.display = 'none';
                return;
            }
            contextMenu.style.left = `${params.event.pageX}px`;
            contextMenu.style.top = `${params.event.pageY}px`;
            contextMenu.style.display = 'block';
        } else {
            contextMenu.style.display = 'none';
        }
    });

    window.addEventListener('click', (e) => {
        // メニューの外側をクリックしたら閉じる
        if (!contextMenu.contains(e.target)) {
            contextMenu.style.display = 'none';
        }
    });

    hideNodeBtn.addEventListener('click', async () => {
        if (!selectedNodeId || selectedNodeId === 'me') return;

        // Note: `hiddenNodeIds` is the array from the start of loadAndDraw, not from storage.
        // We need to load from storage, modify, and save back.
        const hiddenResult = await new Promise(resolve => chrome.storage.local.get(['hiddenNodes'], resolve));
        const storedHiddenIds = hiddenResult.hiddenNodes || [];
        if (!storedHiddenIds.includes(selectedNodeId)) {
            storedHiddenIds.push(selectedNodeId);
            await new Promise(resolve => chrome.storage.local.set({ hiddenNodes: storedHiddenIds }, resolve));
        }
        
        contextMenu.style.display = 'none';
        selectedNodeId = null;
        alert('ノードを非表示にしました。');
        loadAndDraw();
    });

    deleteNodeBtn.addEventListener('click', async () => {
        if (!selectedNodeId || selectedNodeId === 'me' || !confirm('このノードと関連するエッジを完全に削除しますか？\nこの操作は元に戻せません。')) return;

        const result = await new Promise(resolve => chrome.storage.local.get(['meshData'], resolve));
        let rawData = result.meshData || { nodes: [], edges: [] };
        
        rawData.nodes = rawData.nodes.filter(n => n.id !== selectedNodeId);
        rawData.edges = rawData.edges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId);

        await new Promise(resolve => chrome.storage.local.set({ meshData: rawData }, resolve));
        
        contextMenu.style.display = 'none';
        selectedNodeId = null;
        alert('ノードを削除しました。');
        loadAndDraw();
    });
}


// ボタンイベント
document.getElementById('refreshBtn').addEventListener('click', loadAndDraw);

settingsBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: 'settings.html' });
});


// 初回実行
document.addEventListener('DOMContentLoaded', loadAndDraw);

const viewI18n = {
    en: {
        refresh: "Refresh",
        settings: "Settings",
        hide: "Hide",
        delete: "Delete",
        deleteConfirm: "Are you sure you want to permanently delete this node and its edges?",
        alertHidden: "Node hidden.",
        alertDeleted: "Node deleted."
    },
    ja: {
        refresh: "更新",
        settings: "設定",
        hide: "非表示",
        delete: "削除",
        deleteConfirm: "このノードと関連する線を完全に削除しますか？",
        alertHidden: "ノードを非表示にしました。",
        alertDeleted: "ノードを削除しました。"
    }
};

async function applyViewLanguage() {
    const res = await new Promise(r => chrome.storage.local.get(['settings'], r));
    const lang = res.settings?.language || (navigator.language.startsWith('ja') ? 'ja' : 'en');
    const t = viewI18n[lang];

    document.getElementById('refreshBtn').textContent = t.refresh;
    document.getElementById('settingsBtn').textContent = t.settings;
    document.getElementById('hideNodeBtn').textContent = t.hide;
    document.getElementById('deleteNodeBtn').textContent = t.delete;
    
    return t;
}

applyViewLanguage();