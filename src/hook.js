try {
    // hookによる汚染防止のため即時関数にする
    (() => {
        // 設定とか
        let isDetectionEnabled = true;

        window.addEventListener("message", (e) => {
            if (e.data && e.data.type === "DISCORD_FRIEND_NETWORK_SETTINGS_UPDATE") {
                isDetectionEnabled = e.data.settings.enableDetection;
            }
        });
        // ----

        const fetch = window.fetch;
        const xhrOpen = XMLHttpRequest.prototype.open;
        const xhrSend = XMLHttpRequest.prototype.send;

        const processResponse = (url, resClone) => {
            if (!isDetectionEnabled) return; // 検出設定がオフなら検出を中断

            if (url.includes('/api/') && url.includes('/users/') && url.includes('with_mutual_friends=true')) {
                console.log(`[DiscordFriendNetwork] Matched Profile URL, processing: ${url}`);
                resClone.json().then(data => {
                    if (data.mutual_friends && Array.isArray(data.mutual_friends)) {
                        const match = url.match(/users\/(\d+)/);
                        const userId = match ? match[1] : null;

                        if (userId && data.user) {
                            window.postMessage({
                                type: "DISCORD_FRIEND_NETWORK_PROFILE_DATA",
                                detail: {
                                    user: data.user,
                                    mutuals: data.mutual_friends
                                }
                            }, window.location.origin);
                        }
                    }
                }).catch(err => {
                    console.warn(`[DiscordFriendNetwork] Could not parse for matched Profile URL: ${url}`, err);
                });

                return;
            } 

            if (url.includes('/api/') && url.includes('/users/') && url.includes('/relationships')) {
                console.log(`[DiscordFriendNetwork] Matched Relationships URL, processing: ${url}`);
                resClone.json().then(relationships => {
                if (Array.isArray(relationships)) {
                    const match = url.match(/users\/(\d+)/);
                    const userId = match ? match[1] : null;

                    if (userId) {
                        window.postMessage({
                            type: "DISCORD_FRIEND_NETWORK_RELATIONSHIPS_DATA",
                            detail: {
                                userId: userId,
                                relationships: relationships
                            }
                        }, window.location.origin);
                    }
                }
                }).catch(err => {
                    console.warn(`[DiscordFriendNetwork] Could not parse for matched Relationships URL: ${url}`, err);
                });

                return;
            }
        };

        // Hook fetch
        if (fetch) {
            console.log("[DiscordFriendNetwork] hook.js found original fetch, attempting to patch.");
            window.fetch = async (...args) => {
                const res = await fetch.apply(this, args);
                
                try {
                    const url = args[0] instanceof Request ? args[0].url : args[0];
                    processResponse(url, res.clone());
                } catch (e) {
                    console.error("[DiscordFriendNetwork] Error processing fetch response:", e);
                }
                return res;
            };
            console.log("[DiscordFriendNetwork] Fetch has been patched successfully.");
        } else {
            console.error("[DiscordFriendNetwork] FATAL: window.fetch is not available to be patched.");
        }

        // Hook xhr
        if (xhrOpen && xhrSend) {
            console.log("[DiscordFriendNetwork] hook.js found original xhr, attempting to patch.");
            XMLHttpRequest.prototype.open = function(_method, url) {
                this._url = url;
                xhrOpen.apply(this, arguments);
            };

            XMLHttpRequest.prototype.send = function() {
                if (this._url) {
                    this.addEventListener('load', () => {
                        if (this.status >= 200 && this.status < 300) { // success
                            try {
                                const jsonRes = JSON.parse(this.responseText);
                                const fakeRes = {
                                    json: async () => jsonRes,
                                    clone: () => ({ json: async () => jsonRes })
                                };
                                processResponse(this._url, fakeRes);
                            } catch (e) {
                                console.warn(`[DiscordFriendNetwork] XHR response for ${this._url} was not valid JSON or could not be processed.`, e);
                            }
                        }
                    });
                }
                xhrSend.apply(this, arguments);
            };
            console.log("[DiscordFriendNetwork] XHR has been patched successfully.");
        } else {
            console.error("[DiscordFriendNetwork] FATAL: XHR is not available to be patched.");
        }
        console.log("[DiscordFriendNetwork] Interceptor finished initialization.");
    })();
} catch (e) {
    console.error("[DiscordFriendNetwork] FATAL: An error occurred during interceptor initialization.", e);
}