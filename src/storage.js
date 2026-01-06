console.log("[DiscordFriendNetwork] storage loaded.");

// hook.ts から受け取るメッセージ
window.addEventListener("message", (e) => {
    if (e.source !== window || !e.data || !e.data.type?.startsWith("DISCORD_FRIEND_NETWORK_")) return;

    if (e.data.type === "DISCORD_FRIEND_NETWORK_PROFILE_DATA") {
        // console.log("[DiscordFriendNetwork] Received mutuals data from hook:", e.data);
        if (!user || !mutuals) return;

        processAndSaveData({ user, mutuals });
        return;
    }
    
    if (e.data.type === "DISCORD_FRIEND_NETWORK_RELATIONSHIPS_DATA") {
        // console.log("[DiscordFriendNetwork] Received relationships data from hook:", e.data);
        const { userId, relationships } = e.data.detail;
        if (!userId || !relationships) return;
        
        processAndSaveData({ userId, relationships });
        return;
    }
});


function processAndSaveData({ user, mutuals, userId, relationships }) {
    chrome.storage.local.get(['meshData'], (res) => {
        let data = res.meshData || { nodes: [], edges: [] };

        const addNode = (u) => {
            if (!data.nodes.find(n => n.id === u.id)) {
                data.nodes.push({
                    id: u.id,
                    label: u.global_name || u.username,
                    shape: 'circularImage',
                    image: `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png`,
                    brokenImage: 'https://cdn.discordapp.com/embed/avatars/0.png',
                    size: 20
                });
            }
        };

        const addEdge = (fromId, toId) => {
            if (fromId === toId) return;
            const exists = data.edges.some(e => 
                (e.from === fromId && e.to === toId) || (e.from === toId && e.to === fromId)
            );
            if (!exists) {
                data.edges.push({ from: fromId, to: toId });
            }
        };
        
        // 自分のアバタを探す
        const myAvatarImg = document.querySelector('img[aria-hidden="true"][class*="avatar"]');
        let myAvatarUrl = myAvatarImg ? myAvatarImg.src.split('?')[0] : 'https://cdn.discordapp.com/embed/avatars/0.png';

        const meNode = data.nodes.find(n => n.id === 'me');
        if (meNode) {
            meNode.image = myAvatarUrl;
        } else {
            data.nodes.push({ id: 'me', label: 'You', shape: 'circularImage', image: myAvatarUrl, brokenImage: 'https://cdn.discordapp.com/embed/avatars/0.png', size: 30 });
        }

        if (user && mutuals) {
            addNode(user);

            mutuals.forEach(friend => {
                addNode(friend);
                addEdge(user.id, friend.id);
            });
        }

        if (userId && relationships) {
            relationships.forEach(friend => {
                addNode(friend);
                addEdge(userId, friend.id);
            });
        }

        chrome.storage.local.set({ meshData: data }, () => {
            console.log(`[DiscordFriendNetwork] Saved, nodes: ${data.nodes.length}, edges: ${data.edges.length}`);
        });
    });
}

// 検出をするかどうかの設定の反映 (enableDetection)
function broadcastSettings() {
    chrome.storage.local.get(['settings'], (res) => {
        window.postMessage({
            type: "DISCORD_FRIEND_NETWORK_SETTINGS_UPDATE",
            settings: res.settings || { enableDetection: true }
        }, "*");
    });
}

broadcastSettings();
chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
        broadcastSettings();
    }
});
