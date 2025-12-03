
const THEMES = {
    aurora: 'tema-aurora.html',      // tempel kode #1 ke file ini
    neobrutal: 'tema-neobrutal.html' // tempel kode #2 ke file ini
};

const $sel = document.getElementById('theme');
const $frame = document.getElementById('view');
const $btnOpen = document.getElementById('openStandalone');

// Baca preferensi dari query (?theme=aurora|neobrutal) lalu fallback ke localStorage
const url = new URL(location.href);
const qTheme = url.searchParams.get('theme');
const stored = localStorage.getItem('kamus_theme');
const initial = (qTheme && THEMES[qTheme]) ? qTheme : (stored && THEMES[stored]) ? stored : 'aurora';

function setTheme(key, pushState = true){
    if(!THEMES[key]) return;
    $sel.value = key;
    localStorage.setItem('kamus_theme', key);

    // Update URL agar bisa dibookmark / dibagikan
    if (pushState) {
    const u = new URL(location.href);
    u.searchParams.set('theme', key);
    history.replaceState(null, '', u);
    }

    // Ganti src iframe
    $frame.classList.remove('ready');
    $frame.src = THEMES[key];
}

// Ketika iframe selesai load, tampilkan dengan animasi halus
$frame.addEventListener('load', () => {
    requestAnimationFrame(() => $frame.classList.add('ready'));
});

$sel.addEventListener('change', () => setTheme($sel.value));
$btnOpen.addEventListener('click', () => {
    const key = $sel.value;
    const href = THEMES[key];
    window.open(href, '_blank', 'noopener,noreferrer');
});

// Shortcut keyboard: 1 = aurora, 2 = neo
window.addEventListener('keydown', (e) => {
    if (e.target.tagName.match(/INPUT|TEXTAREA|SELECT/)) return;
    if (e.key === '1') setTheme('aurora');
    if (e.key === '2') setTheme('neobrutal');
});

// Inisialisasi
setTheme(initial, false);
