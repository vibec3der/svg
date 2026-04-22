"use strict";
const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const searchEngine = document.getElementById("sj-search-engine");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const frameHost = document.getElementById("frame-host");
const tabStrip = document.getElementById("tab-strip");
const newTabButton = document.getElementById("new-tab-button");
const bookmarkList = document.getElementById("bookmark-list");
const addBookmarkButton = document.getElementById("add-bookmark-button");

const { ScramjetController } = $scramjetLoadController();
const scramjet = new ScramjetController({
	files: {
		wasm: "/scram/scramjet.wasm.wasm",
		all: "/scram/scramjet.all.js",
		sync: "/scram/scramjet.sync.js",
	},
});

const connection = new BareMux.BareMuxConnection("/baremux/worker.js");
const BOOKMARKS_KEY = "edulearn_bookmarks_v1";
let tabs = [];
let activeTabId = null;
let nextTabId = 1;

function getActiveTab() {
	return tabs.find((tab) => tab.id === activeTabId) || null;
}

function updateHomeVisibility() {
	const welcome = document.getElementById("welcome-container");
	const active = getActiveTab();
	const showHome = !active || !active.url;
	if (welcome) {
		welcome.classList.toggle("hidden", !showHome);
	}
	if (frameHost) {
		frameHost.classList.toggle("hidden", showHome);
	}
	if (showHome) {
		address.value = "";
	}
}

function syncActiveFrameId() {
	for (const tab of tabs) {
		tab.frame.frame.id = tab.id === activeTabId ? "sj-frame" : "";
	}
}

function sanitizeTitle(url) {
	try {
		return new URL(url).hostname;
	} catch {
		return "New Tab";
	}
}

function createTab(initialUrl = "") {
	const frame = scramjet.createFrame();
	frame.frame.classList.add("browser-frame", "hidden");
	frameHost.appendChild(frame.frame);

	const tab = {
		id: nextTabId++,
		title: "New Tab",
		url: "",
		frame,
	};

	frame.addEventListener("urlchange", (evt) => {
		tab.url = evt.url;
		tab.title = sanitizeTitle(evt.url);
		if (tab.id === activeTabId) {
			address.value = tab.url;
		}
		renderTabs();
		updateHomeVisibility();
	});

	frame.frame.addEventListener("load", () => {
		if (typeof window.enforceIframeFavicon === "function") {
			window.enforceIframeFavicon(frame.frame);
		}
		if (tab.id === activeTabId) {
			const loadingScreen = document.getElementById("loading-screen");
			if (loadingScreen) loadingScreen.classList.add("hidden");
		}
	});

	tabs.push(tab);
	switchTab(tab.id);
	if (initialUrl) {
		navigateActiveTab(initialUrl, true);
	}
}

function switchTab(tabId) {
	activeTabId = tabId;
	for (const tab of tabs) {
		tab.frame.frame.classList.toggle("hidden", tab.id !== tabId);
	}
	syncActiveFrameId();
	const active = getActiveTab();
	if (active) {
		address.value = active.url || "";
	}
	renderTabs();
	updateHomeVisibility();
}

function closeTab(tabId) {
	const index = tabs.findIndex((tab) => tab.id === tabId);
	if (index === -1) return;
	const [tab] = tabs.splice(index, 1);
	tab.frame.frame.remove();

	if (tabs.length === 0) {
		createTab();
		return;
	}
	if (activeTabId === tabId) {
		const next = tabs[Math.max(0, index - 1)] || tabs[0];
		switchTab(next.id);
	} else {
		renderTabs();
	}
}

function renderTabs() {
	tabStrip.innerHTML = "";
	for (const tab of tabs) {
		const tabEl = document.createElement("div");
		tabEl.className = "tab-pill" + (tab.id === activeTabId ? " active" : "");
		tabEl.innerHTML = `<span class="tab-label">${tab.title}</span><button type="button" class="tab-close">&times;</button>`;
		tabEl.addEventListener("click", () => switchTab(tab.id));
		tabEl.querySelector(".tab-close").addEventListener("click", (evt) => {
			evt.stopPropagation();
			closeTab(tab.id);
		});
		tabStrip.appendChild(tabEl);
	}
	updateHomeVisibility();
}

async function ensureTransportReady() {
	let wispUrl = localStorage.getItem("wispUrl") || "wss://wisp-js-0nma.onrender.com/";
	const torEnabled = localStorage.getItem("tor_enabled") === "true";
	
	if (torEnabled) {
		// Use a Tor-compatible wisp server or specifically configured tor wisp
		// Many public wisp servers support tor/onion via their backend
		// For this implementation, we'll assume the wisp server handle tor routing if enabled
		// or we might want to switch to a specific one.
		// For now, we add a header or use a specific wisp if provided.
		const torWisp = localStorage.getItem("torWispUrl") || "wss://wisp-js-0nma.onrender.com/"; 
		wispUrl = torWisp;
	}

	let transportType = localStorage.getItem("transport");
	if (transportType !== "epoxy" && transportType !== "libcurl") {
		transportType = "libcurl";
		localStorage.setItem("transport", transportType);
	}
	const transportPath = transportType === "epoxy" ? "/epoxy/index.mjs" : "/libcurl/index.mjs";
	const transportConfig =
		transportType === "epoxy" ? [{ wisp: wispUrl }] : [{ websocket: wispUrl }];
	if ((await connection.getTransport()) !== transportPath) {
		await connection.setTransport(transportPath, transportConfig);
	}
}

async function navigateActiveTab(rawInput, skipSearch = false) {
	const activeTab = getActiveTab();
	if (!activeTab) return;
	const input = (rawInput || "").trim();
	if (!input) return;

	try {
		await registerSW();
		await ensureTransportReady();
	} catch (err) {
		error.textContent = "Failed to initialize proxy.";
		errorCode.textContent = err.toString();
		return;
	}

	const resolvedUrl = skipSearch ? input : search(input, searchEngine.value);
	activeTab.url = resolvedUrl;
	address.value = resolvedUrl;
	activeTab.title = sanitizeTitle(resolvedUrl);
	renderTabs();
	activeTab.frame.go(resolvedUrl);
	updateHomeVisibility();
}

function getBookmarks() {
	try {
		return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]");
	} catch {
		return [];
	}
}

function saveBookmarks(bookmarks) {
	localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
}

function renderBookmarks() {
	const bookmarks = getBookmarks();
	bookmarkList.innerHTML = "";
	for (const bookmark of bookmarks) {
		const item = document.createElement("div");
		item.className = "bookmark-item";
		item.innerHTML = `<button type="button" class="bookmark-open">${bookmark.name}</button><button type="button" class="bookmark-delete" title="Delete">&times;</button>`;
		item.querySelector(".bookmark-open").addEventListener("click", () => {
			address.value = bookmark.url;
			navigateActiveTab(bookmark.url, true);
		});
		item.querySelector(".bookmark-delete").addEventListener("click", () => {
			const updated = getBookmarks().filter((entry) => entry.url !== bookmark.url);
			saveBookmarks(updated);
			renderBookmarks();
		});
		bookmarkList.appendChild(item);
	}
}

form.addEventListener("submit", async (event) => {
	event.preventDefault();
	await navigateActiveTab(address.value, false);
});

newTabButton.addEventListener("click", () => createTab());
addBookmarkButton.addEventListener("click", () => {
	const active = getActiveTab();
	const defaultUrl = active?.url || address.value || "https://duckduckgo.com";
	const bookmarkUrl = prompt("Bookmark URL:", defaultUrl);
	if (!bookmarkUrl) return;
	const bookmarkName = prompt("Bookmark name:", sanitizeTitle(bookmarkUrl)) || "Bookmark";
	const bookmarks = getBookmarks();
	bookmarks.push({ name: bookmarkName, url: bookmarkUrl });
	saveBookmarks(bookmarks);
	renderBookmarks();
});

window.addEventListener("DOMContentLoaded", async () => {
	await scramjet.init();
	createTab();
	renderBookmarks();
	updateHomeVisibility();

	const params = new URLSearchParams(window.location.search);
	const incomingQuery = params.get("q");
	const incomingEngine = params.get("engine");
	if (!incomingQuery) return;
	address.value = incomingQuery;
	if (incomingEngine) {
		searchEngine.value = incomingEngine;
	}
	form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
});

window.getActiveScramjetFrame = function getActiveScramjetFrame() {
	return getActiveTab()?.frame?.frame || null;
};

window.getActiveScramjetTab = function getActiveScramjetTab() {
	return getActiveTab();
};