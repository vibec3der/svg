// Edulearn Utils & Navbar Script

const EDULEARN_WISP_KEY = 'wispUrl';
const EDULEARN_AI_NAVBAR_WELCOME_FLAG = 'edulearn_ai_navbar_welcome_pending_v1';
const EDULEARN_CURSOR_STYLE_ID = 'edulearn-global-cursor-style';
if (!localStorage.getItem(EDULEARN_WISP_KEY)) {
	localStorage.setItem(EDULEARN_WISP_KEY, "wss://wisp-js-0nma.onrender.com/");
}

const DEFAULT_FAVICON_URL = "https://edulearnschool.vercel.app/edu.ico";

function enforceDefaultFavicon(doc = document) {
	if (!doc?.head) return;
	let iconLink = doc.querySelector("link[rel='icon']");
	if (!iconLink) {
		iconLink = doc.createElement("link");
		iconLink.rel = "icon";
		doc.head.appendChild(iconLink);
	}
	if (iconLink.href !== DEFAULT_FAVICON_URL) {
		iconLink.href = DEFAULT_FAVICON_URL;
	}
}

function enforceFaviconInAccessibleIframes() {
	document.querySelectorAll("iframe").forEach((frame) => {
		try {
			enforceDefaultFavicon(frame.contentDocument);
		} catch (error) {
			// Ignore cross-origin iframes.
		}
	});
}

enforceDefaultFavicon(document);
if (document.head) {
	const iconObserver = new MutationObserver(() => enforceDefaultFavicon(document));
	iconObserver.observe(document.head, {
		childList: true,
		subtree: true,
		attributes: true,
		attributeFilter: ["href", "rel"],
	});
}
setInterval(() => {
	enforceDefaultFavicon(document);
	enforceFaviconInAccessibleIframes();
}, 2000);

function ensureGlobalCursorStyles() {
	if (document.getElementById(EDULEARN_CURSOR_STYLE_ID)) return;

	const style = document.createElement('style');
	style.id = EDULEARN_CURSOR_STYLE_ID;
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

(function globalEduCursor() {
	if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	if (!document.body) {
		window.requestAnimationFrame(globalEduCursor);
		return;
	}

	if (document.querySelector('.edulearn-cursor-dot')) {
		document.body.classList.add('edulearn-custom-cursor-active');
		return;
	}

	ensureGlobalCursorStyles();

	const body = document.body;
	if (!body) return;

	body.classList.add('edulearn-custom-cursor-active');

	const ring = document.createElement('div');
	ring.className = 'edulearn-cursor edulearn-cursor-ring';

	const dot = document.createElement('div');
	dot.className = 'edulearn-cursor edulearn-cursor-dot';

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
		pressed: false,
	};

	const interactiveSelector = 'a, button, input, textarea, select, summary, label, [role="button"], [data-cursor="interactive"]';

	function updateState() {
		ring.classList.toggle('visible', pointer.visible);
		dot.classList.toggle('visible', pointer.visible);
		ring.classList.toggle('cursor-hover', pointer.hovering);
		dot.classList.toggle('cursor-hover', pointer.hovering);
		ring.classList.toggle('cursor-pressed', pointer.pressed);
		dot.classList.toggle('cursor-pressed', pointer.pressed);
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

	document.addEventListener('pointermove', (event) => {
		if (event.pointerType && event.pointerType !== 'mouse') return;
		pointer.x = event.clientX;
		pointer.y = event.clientY;
		showCursor();
		setHoverState(event.target);
	});

	document.addEventListener('pointerdown', () => {
		pointer.pressed = true;
		updateState();
	});

	document.addEventListener('pointerup', () => {
		pointer.pressed = false;
		updateState();
	});

	document.addEventListener('mouseover', (event) => setHoverState(event.target));
	document.addEventListener('mouseleave', hideCursor);
	window.addEventListener('blur', hideCursor);

	updateState();
	animate();
})();

(function globalEduNav() {
	const path = window.location.pathname.toLowerCase();
	if (path === '/' || path === '/index.html' || path.includes('/login') || path.endsWith('login.html')) return;
	if (document.querySelector('#edulearn-global-navbar')) return;

	const GLOBAL_THEMES = {
		default: {
			bg: '#1e1e2e',
			bgAlt: '#181825',
			panel: 'rgba(30, 30, 46, 0.92)',
			text: '#cdd6f4',
			muted: '#a6adc8',
			accent: '#89b4fa',
			border: 'rgba(137, 180, 250, 0.25)',
			borderLight: '#45475a',
			surface: '#181825',
			surfaceHover: '#313244',
			inputBg: '#11111b',
			shadow: 'rgba(17, 17, 27, 0.38)',
		},
		macchiato: {
			bg: '#24273a',
			bgAlt: '#1f2233',
			panel: 'rgba(36, 39, 58, 0.92)',
			text: '#cad3f5',
			muted: '#a5adce',
			accent: '#8aadf4',
			border: 'rgba(138, 173, 244, 0.25)',
			borderLight: '#5b6078',
			surface: '#1f2233',
			surfaceHover: '#363a4f',
			inputBg: '#181926',
			shadow: 'rgba(24, 25, 38, 0.38)',
		},
		latte: {
			bg: '#eff1f5',
			bgAlt: '#e6e9ef',
			panel: 'rgba(230, 233, 239, 0.94)',
			text: '#4c4f69',
			muted: '#6c6f85',
			accent: '#1e66f5',
			border: 'rgba(30, 102, 245, 0.2)',
			borderLight: '#bcc0cc',
			surface: '#e6e9ef',
			surfaceHover: '#dce0e8',
			inputBg: '#ffffff',
			shadow: 'rgba(76, 79, 105, 0.2)',
		},
		cosmos: {
			bg: '#120936',
			bgAlt: '#1d1d3c',
			panel: 'rgba(34, 21, 54, 0.9)',
			text: '#f7f2ff',
			muted: '#c8b8e8',
			accent: '#b488ff',
			border: 'rgba(140, 97, 229, 0.25)',
			borderLight: '#6a4da1',
			surface: '#1d1d3c',
			surfaceHover: '#2a2551',
			inputBg: '#191530',
			shadow: 'rgba(19, 7, 49, 0.6)',
		},
		forest: {
			bg: '#0a1410',
			bgAlt: '#152e22',
			panel: 'rgba(10, 26, 16, 0.88)',
			text: '#e6f7e8',
			muted: '#a5c9af',
			accent: '#7ad29e',
			border: 'rgba(90, 188, 135, 0.28)',
			borderLight: '#2f5f48',
			surface: '#152e22',
			surfaceHover: '#1f3a2d',
			inputBg: '#0e1d16',
			shadow: 'rgba(2, 13, 8, 0.4)',
		},
		sakura: {
			bg: '#feeaf1',
			bgAlt: '#fddde6',
			panel: 'rgba(253, 221, 230, 0.92)',
			text: '#d84b7a',
			muted: '#e889a6',
			accent: '#ff8fab',
			border: 'rgba(255, 143, 171, 0.25)',
			borderLight: '#ffb3c1',
			surface: '#fddde6',
			surfaceHover: '#ffe5ec',
			inputBg: '#ffffff',
			shadow: 'rgba(216, 75, 122, 0.15)',
		},
		pink: {
			bg: '#1a0b16',
			bgAlt: '#2d132c',
			panel: 'rgba(45, 19, 44, 0.92)',
			text: '#ffc2d1',
			muted: '#fb6f92',
			accent: '#ff5d8f',
			border: 'rgba(255, 93, 143, 0.3)',
			borderLight: '#80205a',
			surface: '#2d132c',
			surfaceHover: '#4e214d',
			inputBg: '#11060e',
			shadow: 'rgba(0, 0, 0, 0.5)',
		},
		ocean: {
			bg: '#0b132b',
			bgAlt: '#1c2541',
			panel: 'rgba(28, 37, 65, 0.92)',
			text: '#edeff2',
			muted: '#8e9aaf',
			accent: '#5bc0be',
			border: 'rgba(91, 192, 190, 0.3)',
			borderLight: '#3a506b',
			surface: '#1c2541',
			surfaceHover: '#3a506b',
			inputBg: '#0b132b',
			shadow: 'rgba(0, 0, 0, 0.5)',
		},
		midnight: {
			bg: '#050505',
			bgAlt: '#121212',
			panel: 'rgba(18, 18, 18, 0.92)',
			text: '#ffffff',
			muted: '#888888',
			accent: '#ffffff',
			border: 'rgba(255, 255, 255, 0.2)',
			borderLight: '#333333',
			surface: '#121212',
			surfaceHover: '#1f1f1f',
			inputBg: '#000000',
			shadow: 'rgba(0, 0, 0, 0.8)',
		},
		nord: {
			bg: '#2e3440',
			bgAlt: '#3b4252',
			panel: 'rgba(59, 66, 82, 0.92)',
			text: '#eceff4',
			muted: '#d8dee9',
			accent: '#88c0d0',
			border: 'rgba(136, 192, 208, 0.25)',
			borderLight: '#4c566a',
			surface: '#3b4252',
			surfaceHover: '#434c5e',
			inputBg: '#2e3440',
			shadow: 'rgba(0, 0, 0, 0.4)',
		},
		gruvbox: {
			bg: '#282828',
			bgAlt: '#3c3836',
			panel: 'rgba(60, 56, 54, 0.92)',
			text: '#ebdbb2',
			muted: '#a89984',
			accent: '#fe8019',
			border: 'rgba(254, 128, 25, 0.25)',
			borderLight: '#504945',
			surface: '#3c3836',
			surfaceHover: '#504945',
			inputBg: '#1d2021',
			shadow: 'rgba(0, 0, 0, 0.5)',
		},
		dracula: {
			bg: '#282a36',
			bgAlt: '#44475a',
			panel: 'rgba(68, 71, 90, 0.92)',
			text: '#f8f8f2',
			muted: '#6272a4',
			accent: '#bd93f9',
			border: 'rgba(189, 147, 249, 0.3)',
			borderLight: '#6272a4',
			surface: '#44475a',
			surfaceHover: '#6272a4',
			inputBg: '#282a36',
			shadow: 'rgba(0, 0, 0, 0.5)',
		},
		cyberpunk: {
			bg: '#000000',
			bgAlt: '#1a1a1a',
			panel: 'rgba(26, 26, 26, 0.95)',
			text: '#00ff00',
			muted: '#008000',
			accent: '#fdee00',
			border: 'rgba(253, 238, 0, 0.4)',
			borderLight: '#333333',
			surface: '#1a1a1a',
			surfaceHover: '#2a2a2a',
			inputBg: '#000000',
			shadow: 'rgba(253, 238, 0, 0.1)',
		},
		monokai: {
			bg: '#272822',
			bgAlt: '#3e3d32',
			panel: 'rgba(62, 61, 50, 0.92)',
			text: '#f8f8f2',
			muted: '#75715e',
			accent: '#a6e22e',
			border: 'rgba(166, 226, 46, 0.3)',
			borderLight: '#75715e',
			surface: '#3e3d32',
			surfaceHover: '#49483e',
			inputBg: '#272822',
			shadow: 'rgba(0, 0, 0, 0.5)',
		},
		aura: {
			bg: '#15141b',
			bgAlt: '#1b1a23',
			panel: 'rgba(27, 26, 35, 0.92)',
			text: '#edecee',
			muted: '#6d6d6d',
			accent: '#a277ff',
			border: 'rgba(162, 119, 255, 0.3)',
			borderLight: '#3d375e',
			surface: '#1b1a23',
			surfaceHover: '#2d2b3d',
			inputBg: '#15141b',
			shadow: 'rgba(0, 0, 0, 0.6)',
		},
		solarized: {
			bg: '#002b36',
			bgAlt: '#073642',
			panel: 'rgba(7, 54, 66, 0.92)',
			text: '#839496',
			muted: '#586e75',
			accent: '#268bd2',
			border: 'rgba(38, 139, 210, 0.3)',
			borderLight: '#586e75',
			surface: '#073642',
			surfaceHover: '#586e75',
			inputBg: '#002b36',
			shadow: 'rgba(0, 0, 0, 0.6)',
		},
		crimson: {
			bg: '#1a0000',
			bgAlt: '#330000',
			panel: 'rgba(51, 0, 0, 0.92)',
			text: '#ffcccc',
			muted: '#993333',
			accent: '#ff0000',
			border: 'rgba(255, 0, 0, 0.3)',
			borderLight: '#660000',
			surface: '#330000',
			surfaceHover: '#4d0000',
			inputBg: '#1a0000',
			shadow: 'rgba(0, 0, 0, 0.8)',
		},
		gold: {
			bg: '#0a0a0a',
			bgAlt: '#1a1a1a',
			panel: 'rgba(26, 26, 26, 0.92)',
			text: '#f3e5ab',
			muted: '#c5b358',
			accent: '#ffd700',
			border: 'rgba(255, 215, 0, 0.3)',
			borderLight: '#3d3d3d',
			surface: '#1a1a1a',
			surfaceHover: '#2a2a2a',
			inputBg: '#000000',
			shadow: 'rgba(255, 215, 0, 0.1)',
		},
	};



	function resolveTheme(settings) {
		const selectedTheme = settings?.theme || 'default';
		if (selectedTheme === 'custom') {
			const custom = settings?.customTheme || {};
			const accent = custom.accent || '#89b4fa';
			const bg = custom.bg || '#1e1e2e';
			const bgAlt = custom.bgAlt || '#181825';
			const text = custom.text || '#cdd6f4';
			return {
				bg,
				bgAlt,
				panel: hexToRgba(bgAlt, 0.92),
				text,
				muted: hexToRgba(text, 0.72),
				accent,
				border: hexToRgba(accent, 0.25),
				borderLight: hexToRgba(accent, 0.35),
				surface: bgAlt,
				surfaceHover: hexToRgba(accent, 0.14),
				inputBg: bg,
				shadow: 'rgba(17, 17, 27, 0.38)',
			};
		}
		return GLOBAL_THEMES[selectedTheme] || GLOBAL_THEMES.default;
	}

	function applyGlobalTheme(settings) {
		const theme = resolveTheme(settings || {});
		const root = document.documentElement;

		// Homepage variables
		root.style.setProperty('--bg', theme.bg);
		root.style.setProperty('--bg-alt', theme.bgAlt);
		root.style.setProperty('--panel', theme.panel);
		root.style.setProperty('--text-main', theme.text);
		root.style.setProperty('--text-muted', theme.muted);
		root.style.setProperty('--accent', theme.accent);
		root.style.setProperty('--border', theme.border);
		root.style.setProperty('--shadow', theme.shadow);
		root.style.setProperty('--bubble-highlight', hexToRgba(theme.accent, 0.35));

		// Shared styles.css variables used on other pages
		root.style.setProperty('--bg-dark', theme.bg);
		root.style.setProperty('--sidebar-bg', theme.panel);
		root.style.setProperty('--surface', theme.surface);
		root.style.setProperty('--surface-hover', theme.surfaceHover);
		root.style.setProperty('--border-light', theme.borderLight);
		root.style.setProperty('--input-bg', theme.inputBg);
		root.style.setProperty('--accent-selected', hexToRgba(theme.accent, 0.16));
		root.style.setProperty('--accent-glow', hexToRgba(theme.accent, 0.24));
		root.style.setProperty('--modal-overlay', hexToRgba(theme.bg, 0.78));
		root.style.setProperty('--cursor-dot-color', theme.text);
		root.style.setProperty('--cursor-ring-color', theme.accent);
		root.style.setProperty('--cursor-ring-bg', hexToRgba(theme.accent, 0.12));
		root.style.setProperty('--cursor-shadow', hexToRgba(theme.accent, 0.32));

		const metaTheme = document.querySelector('meta[name="theme-color"]');
		if (metaTheme) metaTheme.setAttribute('content', theme.bg);
	}

	let currentSettings = JSON.parse(localStorage.getItem('edulearn_settings') || '{}');
	if (!currentSettings.theme) {
		currentSettings.theme = 'midnight';
	}
	applyGlobalTheme(currentSettings);

	// For pages that have their own topbar/toolbar home/settings buttons, hide those duplicates
	// so Home + Settings are always consolidated into the generated global navbar.
	// Note: Keep navigation buttons (back, forward, reload) visible

	function ensureFontAwesome() {
		if (document.querySelector('link[href*="font-awesome"]')) return;
		const fa = document.createElement('link');
		fa.rel = 'stylesheet';
		fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css';
		document.head.appendChild(fa);
	}

	ensureFontAwesome();

	const nav = document.createElement('nav');
	nav.id = 'edulearn-global-navbar';
	nav.className = 'edulearn-global-navbar';
	nav.innerHTML = `
		<div class="nav-ring">
			<a class="nav-item" href="/h/" title="Home"><i class="fa-solid fa-house"></i><span>Home</span></a>
			<a class="nav-item" href="/g/" title="Games"><i class="fa-solid fa-gamepad"></i><span>Games</span></a>
			<a class="nav-item" href="/algebra.html" title="Tabs"><i class="fa-solid fa-globe"></i><span>Browser</span></a>
			<a class="nav-item" href="/a/" title="AI"><i class="fa-solid fa-robot"></i><span>AI</span></a>
			<a class="nav-item" href="/e/" title="Extras"><i class="fa-solid fa-shapes"></i><span>Extras</span></a>
		</div>
	`;

	const buttonDiv = document.createElement('div');
	buttonDiv.id = 'button-centerer'
	const toggleButton = document.createElement('button');
	toggleButton.id = 'edulearn-navbar-toggle-button';
	toggleButton.innerHTML = `<i class="fa-solid fa-bars"></i>`;
	buttonDiv.appendChild(toggleButton);

	document.body.insertBefore(buttonDiv, document.body.firstChild);
	document.body.insertBefore(nav, document.body.firstChild);

	function showNav() {
		nav.classList.remove('collapsed');
		toggleButton.classList.remove('button-collapsed');
		toggleButton.innerHTML = `<i class="fa-solid fa-angle-up"></i>`;
	}

	function hideNav() {
		nav.classList.add('collapsed');
		toggleButton.classList.add('button-collapsed');
		toggleButton.innerHTML = `<i class="fa-solid fa-angle-down"></i>`;
	}
	toggleButton.onclick = () => {
		if (nav.classList.contains("collapsed")) {
			showNav();
		}else {
			hideNav();
		}
	}

	const currentPath = window.location.pathname;
	nav.querySelectorAll('.nav-item[href]').forEach(link => {
		if (currentPath.startsWith(link.getAttribute('href'))) {
			link.classList.add('active');
		}

		if (link.getAttribute('href') === '/a/') {
			link.addEventListener('click', () => {
				try {
					sessionStorage.setItem(EDULEARN_AI_NAVBAR_WELCOME_FLAG, '1');
				} catch (error) {
					// Ignore storage failures and continue navigation.
				}
			});
		}
	});

	const settingsButton = document.createElement('a');
	settingsButton.className = 'nav-item';
	settingsButton.href = '#';
	settingsButton.id = 'edulearn-settings-link';
	settingsButton.title = 'Settings';
	settingsButton.innerHTML = '<i class="fa-solid fa-gear"></i><span>Settings</span>';
	settingsButton.addEventListener('click', (e) => {
		e.preventDefault();
		if (typeof openModal === 'function' && window.location.pathname.includes('algebra.html')) {
			openModal('settings-modal');
		} else if (typeof openModal === 'function') {
			openModal('settings-modal');
		} else {
			const modal = document.getElementById('settings-modal');
			if (modal) {
				if (modal.classList.contains('modal-overlay')) {
					modal.classList.add('active');
				} else {
					modal.classList.toggle('hidden');
					modal.style.display = modal.classList.contains('hidden') ? 'none' : 'flex';
				}
			} else {
				window.location.href = '/h/';
			}
		}
	});
	nav.querySelector('.nav-ring').appendChild(settingsButton);

	showNav();

	const style = document.createElement('style');
	style.textContent = `
		#edulearn-global-navbar {
			position: fixed;
			top: 10px;
			left: 50%;
			transform: translateX(-50%);
			max-width: min(100%, 840px);
			width: auto;
			padding: 10px 12px;
			background: var(--panel);
			border: 1px solid var(--border);
			backdrop-filter: blur(12px);
			border-radius: 999px;
			display: flex;
			justify-content: center;
			align-items: center;
			gap: 6px;
			z-index: 10000;
			box-shadow: 0 8px 18px var(--shadow);
			transition: transform 0.25s ease, opacity 0.25s ease;
		}

		#edulearn-global-navbar.collapsed {
			transform: translate(-50%, -120%);
			opacity: 0;
			pointer-events: none;
		}

		#edulearn-global-navbar .nav-ring {
			display: inline-flex;
			align-items: center;
			gap: 8px;
			padding: 0;
			border: none;
			background: transparent;
			border-radius: 999px;
			width: 100%;
			height: 100%;
			justify-content: center;
		}
		#edulearn-global-navbar .nav-item {
			display: inline-flex;
			align-items: center;
			gap: 6px;
			padding: 8px 12px;
			border-radius: 999px;
			border: 1px solid transparent;
			background: transparent;
			color: #f5f7ff;
			text-decoration: none;
			font-size: 13px;
			font-weight: 600;
			cursor: pointer;
			transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease;
		}

		#edulearn-global-navbar .nav-item i {
			font-size: 15px;
			color: #ffffff;
		}

		#edulearn-global-navbar .nav-item span {
			white-space: nowrap;
		}

		#edulearn-global-navbar .nav-item:hover,
		#edulearn-global-navbar .nav-item.active {
			background: var(--surface-hover);
			border-color: var(--border-light);
			color: #ffffff !important;
		}

		@media (max-width: 840px) {
			#edulearn-global-navbar {
				max-width: calc(100% - 16px);
				padding: 8px 9px;
			}

			#edulearn-global-navbar .nav-item span {
				display: none;
			}
		}

		#edulearn-navbar-toggle-button {
    display: inline-flex;
    justify-content: center;
    align-items: center;

    padding: 8px 50px;
    height: auto;
    width: auto;

    border-radius: 999px;
    border: 1px solid var(--border);

    background: var(--panel);
    color: var(--text-main);

    backdrop-filter: blur(10px);
    box-shadow: 0 6px 16px var(--shadow);

    font-size: 13px;
    font-weight: 600;

    cursor: pointer;
    position: fixed;
    top: 69px;
    z-index: 9999;

    transition: all 0.2s ease;
}

		#edulearn-navbar-toggle-button:hover {
    background: var(--accent);
    color: var(--bg);
    border-color: var(--accent);
}

		.button-collapsed {
			transform: translate(0%, -200%);
		}

		#button-centerer {
			position:fixed;
			z-index:9999;
			width:100%;
			height:auto;
			display: flex;
			justify-content: center;
			align-items: center;
		}
	`;
	document.head.appendChild(style);
		function hexToRgba(hex, alpha) {
		if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return `rgba(137, 180, 250, ${alpha})`;
		const value = hex.replace('#', '');
		const normalized = value.length === 3
			? value.split('').map((char) => char + char).join('')
			: value;
		const int = Number.parseInt(normalized, 16);
		const r = (int >> 16) & 255;
		const g = (int >> 8) & 255;
		const b = int & 255;
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}
})();