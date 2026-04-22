importScripts("scram/scramjet.all.js");

const { ScramjetServiceWorker } = $scramjetLoadWorker();
const scramjet = new ScramjetServiceWorker();

const STATIC_CACHE = "edulearn-static-v1";
const RUNTIME_CACHE = "edulearn-runtime-v1";
const OFFLINE_URL = "./offline.html";
const APP_SHELL = [
	"./",
	"./h/",
	"./a/",
	"./e/",
	"./g/",
	"./404.html",
	OFFLINE_URL,
	"./styles.css",
	"./script.js",
	"./register-sw.js",
	"./manifest.json",
	"./particles.js",
	"./search.js",
	"./edu.ico",
	"./favicon.ico",
	"./favicon.webp",
	"./edufull.png",
	"./logo.svg"
];

const ADBLOCK_PATTERNS = [
	"googleads",
	"googlesyndication",
	"doubleclick",
	"adnxs",
	"adform",
	"pubmatic",
	"amazon-adsystem",
	"scorecardresearch",
	"taboola",
	"outbrain",
	"adskeeper",
	"popads",
	"onclickads",
	"propellerads"
];

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil((async () => {
		const keys = await caches.keys();
		await Promise.all(
			keys
				.filter((key) => ![STATIC_CACHE, RUNTIME_CACHE].includes(key))
				.map((key) => caches.delete(key))
		);
		await self.clients.claim();
	})());
});

async function fromCache(request) {
	const cached = await caches.match(request);
	if (cached) return cached;
	return null;
}

async function cacheRuntime(request, response) {
	if (!response || response.status !== 200 || request.method !== "GET") return response;
	const cache = await caches.open(RUNTIME_CACHE);
	cache.put(request, response.clone());
	return response;
}

async function handleNavigation(request) {
	try {
		const response = await fetch(request);
		return cacheRuntime(request, response);
	} catch (error) {
		return (await fromCache(request)) || (await caches.match(OFFLINE_URL));
	}
}

async function handleAsset(request) {
	const cached = await fromCache(request);
	if (cached) {
		fetch(request).then((response) => cacheRuntime(request, response)).catch(() => {});
		return cached;
	}

	try {
		const response = await fetch(request);
		return cacheRuntime(request, response);
	} catch (error) {
		return (await fromCache(request)) || Response.error();
	}
}

async function handleScramjetRequest(event) {
	await scramjet.loadConfig();

	const isAdblockEnabled =
		event.request.headers.get("Cookie")?.includes("adblock_enabled=true") ||
		(await self.clients.matchAll()).some((client) => client.url.includes("adblock_enabled=true"));

	if (isAdblockEnabled && ADBLOCK_PATTERNS.some((pattern) => event.request.url.includes(pattern))) {
		return new Response(null, { status: 204 });
	}

	return scramjet.fetch(event);
}

async function handleRequest(event) {
	const { request } = event;

	if (request.method !== "GET") {
		return fetch(request);
	}

	await scramjet.loadConfig();
	if (scramjet.route(event)) {
		return handleScramjetRequest(event);
	}

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) {
		return fetch(request);
	}

	if (request.mode === "navigate") {
		return handleNavigation(request);
	}

	return handleAsset(request);
}

self.addEventListener("fetch", (event) => {
	event.respondWith(handleRequest(event));
});
