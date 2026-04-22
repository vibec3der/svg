"use strict";
const stockSW = "sw.js";
const CURSOR_STYLE_ID = "edulearn-global-cursor-style";

/**
 * List of hostnames that are allowed to run serviceworkers on http://
 */
const swAllowedHostnames = ["localhost", "127.0.0.1"];

/**
 * Global util
 * Used in 404.html and index.html
 */
async function registerSW() {
	if (!navigator.serviceWorker) {
		if (
			location.protocol !== "https:" &&
			!swAllowedHostnames.includes(location.hostname)
		)
			throw new Error("Service workers cannot be registered without https.");

		throw new Error("Your browser doesn't support service workers.");
	}

	// Calculate the correct path to sw.js relative to this script
	const scriptUrl = document.currentScript ? document.currentScript.src : window.location.href;
	const swUrl = new URL("sw.js", scriptUrl).href;

	await navigator.serviceWorker.register(swUrl);
}

function ensureGlobalCursorStyles() {
	if (document.getElementById(CURSOR_STYLE_ID)) return;

	const style = document.createElement("style");
	style.id = CURSOR_STYLE_ID;
	style.textContent = `
		:root {
			--cursor-dot-size: 10px;
			--cursor-ring-size: 34px;
			--cursor-dot-color: var(--text-main, #ffffff);
			--cursor-ring-color: var(--accent, #ffffff);
			--cursor-ring-bg: var(--accent-selected, rgba(255, 255, 255, 0.14));
			--cursor-shadow: rgba(255, 255, 255, 0.22);
		}

		.edulearn-cursor {
			position: fixed;
			top: 0;
			left: 0;
			pointer-events: none;
			opacity: 0;
			transform: translate3d(-100px, -100px, 0);
			transition: opacity 0.18s ease, width 0.18s ease, height 0.18s ease, background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
			z-index: 2147483647;
			mix-blend-mode: normal;
		}

		.edulearn-cursor-dot {
			width: var(--cursor-dot-size);
			height: var(--cursor-dot-size);
			margin-left: calc(var(--cursor-dot-size) * -0.5);
			margin-top: calc(var(--cursor-dot-size) * -0.5);
			border-radius: 999px;
			background: var(--cursor-dot-color);
			box-shadow: 0 0 10px var(--cursor-shadow);
		}

		.edulearn-cursor-ring {
			width: var(--cursor-ring-size);
			height: var(--cursor-ring-size);
			margin-left: calc(var(--cursor-ring-size) * -0.5);
			margin-top: calc(var(--cursor-ring-size) * -0.5);
			border-radius: 999px;
			border: 1.5px solid var(--cursor-ring-color);
			background: var(--cursor-ring-bg);
			backdrop-filter: blur(4px);
			box-shadow: 0 0 18px var(--cursor-shadow);
		}

		body.edulearn-custom-cursor-active,
		body.edulearn-custom-cursor-active * {
			cursor: none !important;
		}

		body.edulearn-custom-cursor-active .edulearn-cursor.visible {
			opacity: 1;
		}

		body.edulearn-custom-cursor-active .edulearn-cursor-ring.cursor-hover {
			width: calc(var(--cursor-ring-size) * 1.22);
			height: calc(var(--cursor-ring-size) * 1.22);
			margin-left: calc(var(--cursor-ring-size) * -0.61);
			margin-top: calc(var(--cursor-ring-size) * -0.61);
			background: color-mix(in srgb, var(--cursor-ring-color) 14%, transparent);
			box-shadow: 0 0 24px var(--cursor-shadow);
		}

		body.edulearn-custom-cursor-active .edulearn-cursor-dot.cursor-hover {
			transform: scale(1.18);
		}

		body.edulearn-custom-cursor-active .edulearn-cursor-ring.cursor-pressed {
			width: calc(var(--cursor-ring-size) * 0.92);
			height: calc(var(--cursor-ring-size) * 0.92);
			margin-left: calc(var(--cursor-ring-size) * -0.46);
			margin-top: calc(var(--cursor-ring-size) * -0.46);
		}

		body.edulearn-custom-cursor-active .edulearn-cursor-dot.cursor-pressed {
			transform: scale(0.82);
		}

		@media (pointer: coarse), (prefers-reduced-motion: reduce) {
			.edulearn-cursor {
				display: none !important;
			}

			body.edulearn-custom-cursor-active,
			body.edulearn-custom-cursor-active * {
				cursor: auto !important;
			}
		}
	`;

	document.head.appendChild(style);
}

function initGlobalCursor() {
	if (window.matchMedia("(pointer: coarse)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
	if (!document.body) {
		window.requestAnimationFrame(initGlobalCursor);
		return;
	}

	if (document.querySelector(".edulearn-cursor-dot")) {
		document.body.classList.add("edulearn-custom-cursor-active");
		return;
	}

	ensureGlobalCursorStyles();

	const body = document.body;
	if (!body) return;

	body.classList.add("edulearn-custom-cursor-active");

	const ring = document.createElement("div");
	ring.className = "edulearn-cursor edulearn-cursor-ring";

	const dot = document.createElement("div");
	dot.className = "edulearn-cursor edulearn-cursor-dot";

	body.appendChild(ring);
	body.appendChild(dot);

	const pointer = {
		x: window.innerWidth / 2,
		y: window.innerHeight / 2,
		ringX: window.innerWidth / 2,
		ringY: window.innerHeight / 2,
		dotX: window.innerWidth / 2,
		dotY: window.innerHeight / 2,
		visible: false,
		hovering: false,
		pressed: false
	};

	const interactiveSelector = "a, button, input, textarea, select, summary, label, [role='button'], [data-cursor='interactive']";

	function updateState() {
		ring.classList.toggle("visible", pointer.visible);
		dot.classList.toggle("visible", pointer.visible);
		ring.classList.toggle("cursor-hover", pointer.hovering);
		dot.classList.toggle("cursor-hover", pointer.hovering);
		ring.classList.toggle("cursor-pressed", pointer.pressed);
		dot.classList.toggle("cursor-pressed", pointer.pressed);
	}

	function showCursor() {
		pointer.visible = true;
		updateState();
	}

	function hideCursor() {
		pointer.visible = false;
		pointer.hovering = false;
		pointer.pressed = false;
		updateState();
	}

	function setHoverState(target) {
		pointer.hovering = Boolean(target?.closest(interactiveSelector));
		updateState();
	}

	function animate() {
		pointer.ringX += (pointer.x - pointer.ringX) * 1.0;
		pointer.ringY += (pointer.y - pointer.ringY) * 1.0;
		pointer.dotX += (pointer.x - pointer.dotX) * 1.0;
		pointer.dotY += (pointer.y - pointer.dotY) * 1.0;

		ring.style.transform = `translate3d(${pointer.ringX}px, ${pointer.ringY}px, 0)`;
		dot.style.transform = `translate3d(${pointer.dotX}px, ${pointer.dotY}px, 0)`;
		window.requestAnimationFrame(animate);
	}

	document.addEventListener("pointermove", (event) => {
		if (event.pointerType && event.pointerType !== "mouse") return;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
		showCursor();
		setHoverState(event.target);
	});

	document.addEventListener("pointerdown", () => {
		pointer.pressed = true;
		updateState();
	});

	document.addEventListener("pointerup", () => {
		pointer.pressed = false;
		updateState();
	});

	document.addEventListener("mouseover", (event) => setHoverState(event.target));
	document.addEventListener("mouseleave", hideCursor);
	window.addEventListener("blur", hideCursor);

	updateState();
	animate();
}

if (typeof window !== "undefined") {
	window.registerSW = registerSW;

	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", initGlobalCursor, { once: true });
	} else {
		initGlobalCursor();
	}

	window.addEventListener("load", initGlobalCursor, { once: true });

	if ("serviceWorker" in navigator) {
		window.addEventListener("load", () => {
			registerSW().catch((error) => {
				console.error("Service worker registration failed:", error);
			});
		}, { once: true });
	}
}