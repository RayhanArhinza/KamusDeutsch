const URL = "/api/dict";

const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const THEME_KEY = 'nb-theme';

function applyTheme(theme){
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    themeIcon.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
}

(function initTheme(){
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
    } else {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
    }
})();

themeToggleBtn.addEventListener('click', ()=>{
    const nowDark = !document.documentElement.classList.contains('dark');
    applyTheme(nowDark ? 'dark' : 'light');
});

const dataContainer = document.getElementById('data-container');
const searchInput = document.getElementById('search');
const clearSearch = document.getElementById('clearSearch');
const fArticle = document.getElementById('fArticle');
const fGender = document.getElementById('fGender');
const sortBy = document.getElementById('sortBy');
const perPageSel = document.getElementById('perPage');
const pageInfo = document.getElementById('page-info');
const totalItems = document.getElementById('total-items');
const paginationNav = document.getElementById('pagination');
const loadingOverlay = document.getElementById('loadingOverlay');

const openDrawer = document.getElementById('openDrawer');
const drawer = document.getElementById('drawer');
const closeDrawer = document.getElementById('closeDrawer');

const form = document.getElementById('form');
const editModal = document.getElementById('editModal');
const cancelEdit = document.getElementById('cancelEdit');
const editForm = document.getElementById('editForm');

const editId = document.getElementById('edit-id');
const editGerman = document.getElementById('edit-german');
const editIndo = document.getElementById('edit-indonesian');
const editCategory = document.getElementById('edit-category');
const editArticle = document.getElementById('edit-article');
const editGender = document.getElementById('edit-gender');
const editExample = document.getElementById('edit-example');

const deleteModal = document.getElementById('deleteModal');
const cancelDelete = document.getElementById('cancelDelete');
const confirmDelete = document.getElementById('confirmDelete');
let deleteTargetId = null;

const ttsText = document.getElementById('ttsText');
const ttsVoice = document.getElementById('ttsVoice');
const ttsRate = document.getElementById('ttsRate');
const ttsPitch = document.getElementById('ttsPitch');
const ttsPlay = document.getElementById('ttsPlay');
const ttsPause = document.getElementById('ttsPause');
const ttsStop = document.getElementById('ttsStop');
const ttsStatus = document.getElementById('ttsStatus');

let dataList = [];
let currentPage = 1;
let perPage = 5; // default 5

// ===== UTILS =====
let selectedVoice = null;

const say = (t) => {
    if (!t) return;
    const u = new SpeechSynthesisUtterance(t);
    if (selectedVoice) u.voice = selectedVoice;
    u.lang = selectedVoice?.lang || 'de-DE';
    u.rate = parseFloat(ttsRate?.value || '1');
    u.pitch = parseFloat(ttsPitch?.value || '1');
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
};

const showLoading = () => loadingOverlay.classList.remove('hidden');
const hideLoading = () => loadingOverlay.classList.add('hidden');
const by = (k) => (a,b) => (a[k]||'').toString().localeCompare((b[k]||'').toString(),'de',{sensitivity:'base'});


async function fetchData(){
    try {
    showLoading();
    const r = await fetch(URL);
    dataList = await r.json();
    currentPage = 1;
    render(true);
    } catch(e){ console.error(e); alert('Gagal memuat data'); }
    finally { hideLoading(); }
}


function filtered(){
    const q = (searchInput.value||'').toLowerCase();
    const a = (fArticle.value||'').toLowerCase();
    const g = (fGender.value||'').toLowerCase();
    return dataList
    .filter(it => {
        const okQ =
        (it.german||'').toLowerCase().includes(q) ||
        (it.indonesian||'').toLowerCase().includes(q) ||
        (it.category||'').toLowerCase().includes(q) ||
        (it.article||'').toLowerCase().includes(q) ||
        (it.gender||'').toLowerCase().includes(q) ||
        (it.example||'').toLowerCase().includes(q);
        const okA = !a || (it.article||'').toLowerCase()===a;
        const okG = !g || (it.gender||'').toLowerCase()===g;
        return okQ && okA && okG;
    })
    .sort(by(sortBy.value||'german'));
}

function render(reset=false){
    const arr = filtered();
    const total = arr.length;
    totalItems.textContent = total;

    const isAll = perPage === 'all';
    const totalPages = isAll ? 1 : Math.max(1, Math.ceil(total / perPage));

    if (reset) currentPage = 1;
    if (!isAll) currentPage = Math.min(currentPage, totalPages);

    let startIndex = 0, endIndex = total;
    if (!isAll) {
    startIndex = (currentPage - 1) * perPage;
    endIndex = Math.min(startIndex + perPage, total);
    }

    const startShow = total ? (startIndex + 1) : 0;
    const endShow = total ? endIndex : 0;
    pageInfo.textContent = `${startShow}–${endShow}`;

    // cards
    dataContainer.innerHTML = '';
    const slice = arr.slice(startIndex, endIndex);
    slice.forEach(item=>{
    const speakWord = `${item.article? item.article+' ' : ''}${item.german||''}`.trim();
    const card = document.createElement('article');
    card.className = 'nb-card p-4 animate-up';
    card.innerHTML = `
        <div class="flex items-start justify-between gap-3">
        <div>
            <div class="flex items-center gap-2">
            ${item.article? `<span class='px-2 py-0.5 border-2' style='border-color: var(--ink)'>${item.article}</span>`:''}
            <h3 class="font-semibold text-lg">${item.german||''}</h3>
            <button title="Dengar kata" data-say='${speakWord.replace(/'/g,"&apos;")}' class="underline">🔊</button>
            </div>
            <p class="text-sm mt-1"><span class="font-semibold">Terjemahan:</span> ${item.indonesian||'-'}</p>
            <div class="flex flex-wrap gap-2 mt-2 text-xs">
            <span class="nb-tag px-2 py-1">Artikel: ${item.article||'-'}</span>
            <span class="nb-tag px-2 py-1">Gender: ${item.gender||'-'}</span>
            <span class="nb-tag px-2 py-1">Kategori: ${item.category||'-'}</span>
            </div>
            ${item.example
            ? `<p class='mt-2 text-sm flex items-start gap-2'>
                    <span><span class='font-semibold'>Contoh:</span> ${item.example}</span>
                    <button title="Dengar contoh" data-say='${(item.example||'').replace(/'/g,"&apos;")}' class="underline">🔊</button>
                </p>`
            : ''
            }
        </div>
        <div class="flex flex-col gap-2">
            <button class="nb-btn px-3 py-1 text-sm" data-edit='${JSON.stringify(item).replace(/'/g,"&apos;")}' >Edit</button>
            <button class="nb-btn px-3 py-1 text-sm bg-red-200" data-del='${item.id}'>Hapus</button>
        </div>
        </div>`;
    dataContainer.appendChild(card);
    });

    renderPagination(isAll ? 1 : totalPages);
    paginationNav.parentElement.style.display = isAll ? 'none' : 'flex';
}

function renderPagination(totalPages){
    paginationNav.innerHTML = '';
    if (totalPages <= 1) return;

    const btn = (label, page, disabled=false, active=false) => {
    const el = document.createElement('button');
    el.textContent = label;
    el.className = [
        'nb-btn px-3 py-1 text-sm',
        active ? 'bg-accent-200' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
    ].join(' ').trim();
    if (!disabled) {
        el.addEventListener('click', ()=>{ currentPage = page; render(); });
    }
    return el;
    };

    paginationNav.appendChild(btn('Prev', Math.max(1, currentPage-1), currentPage===1));

    const windowSize = 5;
    let start = Math.max(1, currentPage - Math.floor(windowSize/2));
    let end = Math.min(totalPages, start + windowSize - 1);
    if (end - start + 1 < windowSize) start = Math.max(1, end - windowSize + 1);

    if (start > 1) {
    paginationNav.appendChild(btn('1', 1, false, currentPage===1));
    if (start > 2) {
        const dots = document.createElement('span');
        dots.textContent = '…';
        dots.className = 'px-1';
        paginationNav.appendChild(dots);
    }
    }

    for (let p = start; p <= end; p++) {
    paginationNav.appendChild(btn(String(p), p, false, currentPage===p));
    }

    if (end < totalPages) {
    if (end < totalPages - 1) {
        const dots = document.createElement('span');
        dots.textContent = '…';
        dots.className = 'px-1';
        paginationNav.appendChild(dots);
    }
    paginationNav.appendChild(btn(String(totalPages), totalPages, false, currentPage===totalPages));
    }

    paginationNav.appendChild(btn('Next', Math.min(totalPages, currentPage+1), currentPage===totalPages));
}

searchInput.addEventListener('input', ()=> render(true));
clearSearch.addEventListener('click', ()=> { searchInput.value=''; render(true); });
fArticle.addEventListener('change', ()=> render(true));
fGender.addEventListener('change', ()=> render(true));
sortBy.addEventListener('change', ()=> render(true));

perPageSel.addEventListener('change', ()=>{
    const val = perPageSel.value;
    perPage = (val === 'all') ? 'all' : parseInt(val, 10);
    currentPage = 1;
    render(true);
});


openDrawer.addEventListener('click', (e)=>{ e.preventDefault(); drawer.style.transform='translateX(0)'; });
closeDrawer.addEventListener('click', ()=> drawer.style.transform='translateX(100%)');

dataContainer.addEventListener('click', (e)=>{
    const sayBtn = e.target.closest('[data-say]');
    if (sayBtn) say(sayBtn.getAttribute('data-say').replaceAll('&apos;',"'"));

    const editBtn = e.target.closest('[data-edit]');
    if (editBtn){ const item = JSON.parse(editBtn.getAttribute('data-edit').replaceAll('&apos;',"'")); openEdit(item); }

    const delBtn = e.target.closest('[data-del]');
    if (delBtn){ delEntry(delBtn.getAttribute('data-del')); }
});

form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
    action: 'create',
    german: document.getElementById('german').value,
    indonesian: document.getElementById('indonesian').value,
    category: document.getElementById('category').value,
    article: document.getElementById('article').value,
    gender: document.getElementById('gender').value,
    example: document.getElementById('example').value
    };
    try{
    showLoading();
    const r = await fetch(URL,{method:'POST', body: JSON.stringify(payload)});
    const t = await r.text();
    if (r.ok && t==='Success'){ form.reset(); drawer.style.transform='translateX(100%)'; await fetchData(); }
    else throw new Error(t);
    }catch(err){ alert('Gagal menambah'); console.error(err);} finally { hideLoading(); }
});

function openEdit(item){
    editId.value = item.id;
    editGerman.value = item.german||'';
    editIndo.value = item.indonesian||'';
    editCategory.value = item.category||'';
    editArticle.value = item.article||'';
    editGender.value = item.gender||'';
    editExample.value = item.example||'';
    editModal.classList.remove('hidden');
}
cancelEdit.addEventListener('click', ()=> editModal.classList.add('hidden'));

editForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const payload = {
    action:'update',
    id: editId.value,
    german: editGerman.value,
    indonesian: editIndo.value,
    category: editCategory.value,
    article: editArticle.value,
    gender: editGender.value,
    example: editExample.value
    };
    try{
    showLoading();
    const r = await fetch(URL,{method:'POST', body: JSON.stringify(payload)});
    const t = await r.text();
    if (r.ok && t==='Updated'){ editModal.classList.add('hidden'); await fetchData(); }
    else throw new Error(t);
    }catch(err){ alert('Gagal memperbarui'); console.error(err);} finally { hideLoading(); }
});

function delEntry(id){
    deleteTargetId = id;
    deleteModal.classList.remove('hidden');
}

cancelDelete.addEventListener('click', () => {
    deleteTargetId = null;
    deleteModal.classList.add('hidden');
});

confirmDelete.addEventListener('click', async () => {
    if(!deleteTargetId) return;
    deleteModal.classList.add('hidden');
    try{
    showLoading();
    const r = await fetch(URL,{method:'POST', body: JSON.stringify({action:'delete', id: deleteTargetId})});
    const t = await r.text();
    if (r.ok && t==='Deleted'){ await fetchData(); }
    else throw new Error(t);
    }catch(err){ alert('Gagal menghapus'); console.error(err);}
    finally{
    deleteTargetId = null;
    hideLoading();
    }
});

function populateVoices() {
    const voices = speechSynthesis.getVoices()
    .filter(v => v && (v.lang.startsWith('de') || v.lang.startsWith('id') || v.lang.startsWith('en')));
    ttsVoice.innerHTML = '';
    voices.forEach((v, i) => {
    const opt = document.createElement('option');
    opt.value = i.toString();
    opt.textContent = `${v.name} (${v.lang})`;
    ttsVoice.appendChild(opt);
    });
    const idxDe = voices.findIndex(v => v.lang.toLowerCase().startsWith('de'));
    const idxId = voices.findIndex(v => v.lang.toLowerCase().startsWith('id'));
    const chosenIndex = (idxDe !== -1 ? idxDe : (idxId !== -1 ? idxId : 0));
    ttsVoice.selectedIndex = Math.max(0, chosenIndex);
    selectedVoice = voices[ttsVoice.selectedIndex] || null;
}

if ('speechSynthesis' in window) {
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    ttsVoice?.addEventListener('change', () => {
    const voices = speechSynthesis.getVoices()
        .filter(v => v && (v.lang.startsWith('de') || v.lang.startsWith('id') || v.lang.startsWith('en')));
    selectedVoice = voices[parseInt(ttsVoice.value || '0', 10)] || null;
    });

    ttsPlay?.addEventListener('click', () => {
    const text = (ttsText?.value || '').trim();
    if (!text) {
        ttsStatus.textContent = 'Isi teks terlebih dahulu.';
        return;
    }
    const u = new SpeechSynthesisUtterance(text);
    if (selectedVoice) u.voice = selectedVoice;
    u.lang = selectedVoice?.lang || 'de-DE';
    u.rate = parseFloat(ttsRate.value);
    u.pitch = parseFloat(ttsPitch.value);
    u.onstart = () => ttsStatus.textContent = 'Membaca…';
    u.onend = () => ttsStatus.textContent = 'Selesai.';
    u.onerror = () => ttsStatus.textContent = 'Terjadi kesalahan TTS.';
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    });

    ttsPause?.addEventListener('click', () => {
    if (speechSynthesis.speaking) {
        if (speechSynthesis.paused) {
        speechSynthesis.resume();
        ttsStatus.textContent = 'Lanjut…';
        } else {
        speechSynthesis.pause();
        ttsStatus.textContent = 'Jeda.';
        }
    }
    });

    ttsStop?.addEventListener('click', () => {
    speechSynthesis.cancel();
    ttsStatus.textContent = 'Dihentikan.';
    });
} else {
    document.querySelectorAll('#ttsPlay,#ttsPause,#ttsStop').forEach(b => b?.setAttribute('disabled','disabled'));
    ttsStatus.textContent = 'Browser tidak mendukung SpeechSynthesis.';
}

fetchData();
