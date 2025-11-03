const URL = "/api/dict";
const dataContainer = document.getElementById('data-container');
const searchInput = document.getElementById('search');
const loadingOverlay = document.getElementById('loadingOverlay');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageNumbers = document.getElementById('page-numbers');
const pageInfo = document.getElementById('page-info');
const totalItems = document.getElementById('total-items');

const sortBy = document.getElementById('sortBy');
const pageSizeSelect = document.getElementById('pageSize');

const filterArticle = document.getElementById('filterArticle');
const filterGender  = document.getElementById('filterGender');
const clearAllBtn   = document.getElementById('clearAll');

const form = document.getElementById('form');

const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const editId = document.getElementById('edit-id');
const editGerman = document.getElementById('edit-german');
const editIndo = document.getElementById('edit-indonesian');
const editCategory = document.getElementById('edit-category');
const editArticle = document.getElementById('edit-article');
const editGender = document.getElementById('edit-gender');
const editExample = document.getElementById('edit-example');

const deleteModal = document.getElementById('deleteModal');
const deleteLabel = document.getElementById('deleteLabel');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');

const ttsText  = document.getElementById('ttsText');
const ttsVoice = document.getElementById('ttsVoice');
const ttsRate  = document.getElementById('ttsRate');
const ttsPitch = document.getElementById('ttsPitch');
const ttsPlay  = document.getElementById('ttsPlay');
const ttsPause = document.getElementById('ttsPause');
const ttsStop  = document.getElementById('ttsStop');
const ttsStatus= document.getElementById('ttsStatus');

let dataList = [];
let currentPage = 1;
let itemsPerPage = 5; // default 5
const maxPageButtons = 4;
let lastFilteredCount = 0;

let pendingDeleteId = null;

let selectedVoice = null;

const showLoading = () => loadingOverlay.classList.remove('hidden');
const hideLoading = () => loadingOverlay.classList.add('hidden');

const notify = (msg, type = 'ok') => {
    const el = document.createElement('div');
    el.className = `fixed bottom-4 right-4 z-[70] px-4 py-2 rounded-xl text-white text-sm shadow-lg animate-pop-in ${type==='ok' ? 'bg-brand-500' : 'bg-red-500'}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => { el.classList.add('opacity-0'); setTimeout(() => el.remove(), 300) }, 2500);
};

const byKey = (k) => (a,b) => (a[k]||'').localeCompare(b[k]||'', 'de', {sensitivity:'base'})

// ====== Theme Toggle (persist) ======
const themeToggle = document.getElementById('themeToggle');
const root = document.documentElement;
const setTheme = (mode) => {
    if (mode === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    localStorage.setItem('theme', mode);
};
setTheme(localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeToggle.addEventListener('click', () => setTheme(root.classList.contains('dark') ? 'light' : 'dark'));

async function fetchData(){
    try {
    showLoading();
    const res = await fetch(URL);
    dataList = await res.json();
    render();
    } catch(e){ console.error(e); notify('Gagal memuat data','err'); }
    finally { hideLoading(); }
}

function applyDropdownFilters(list) {
    const art = filterArticle.value;
    let filtered = list;
    if (art !== 'all') {
    if (art === 'none') filtered = filtered.filter(it => !(it.article || '').trim());
    else filtered = filtered.filter(it => (it.article || '').toLowerCase() === art);
    }
    const gen = filterGender.value;
    if (gen !== 'all') {
    if (gen === 'none') filtered = filtered.filter(it => !(it.gender || '').trim());
    else filtered = filtered.filter(it => (it.gender || '').toLowerCase() === gen.toLowerCase());
    }
    return filtered;
}

function getFilteredSorted(){
    const q = (searchInput.value || '').toLowerCase();
    let filtered = dataList.filter(it =>
    (it.german||'').toLowerCase().includes(q) ||
    (it.indonesian||'').toLowerCase().includes(q) ||
    (it.category||'').toLowerCase().includes(q) ||
    (it.article||'').toLowerCase().includes(q) ||
    (it.gender||'').toLowerCase().includes(q) ||
    (it.example||'').toLowerCase().includes(q)
    );

    filtered = applyDropdownFilters(filtered);

    const key = sortBy.value || 'german';
    filtered.sort(byKey(key));
    return filtered;
}

function render(){
    const filtered = getFilteredSorted();
    lastFilteredCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    currentPage = Math.min(currentPage, totalPages);

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const rows = filtered.slice(start, end);

    totalItems.textContent = filtered.length;
    pageInfo.textContent = filtered.length ? `${start+1}–${Math.min(end, filtered.length)}` : '0–0';

    dataContainer.innerHTML = '';

    if (!rows.length){
    dataContainer.innerHTML = `<div class="rounded-2xl border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-400 bg-white/60 dark:bg-slate-900/40">Tidak ada data. Coba ubah filter / kata kunci.</div>`;
    } else {
    rows.forEach(item => {
        const articleDisplay = item.article ? `<span class='px-2 py-0.5 rounded-md text-xs border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50 mr-2'>${item.article}</span>` : '';
        const speakWord = `${item.article? item.article+' ' : ''}${item.german||''}`.trim();

        const card = document.createElement('div');
        card.className = 'group rounded-2xl border border-white/60 dark:border-white/10 bg-white/70 dark:bg-slate-900/50 backdrop-blur p-5 shadow hover:shadow-xl transition';
        card.innerHTML = `
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
                ${articleDisplay}
                <h3 class="font-semibold text-slate-800 dark:text-slate-100 text-lg">${item.german||''}</h3>
                <button title="Dengar pengucapan" class="ml-1 text-slate-500 hover:text-brand-600 dark:hover:text-brand-400" data-say="${speakWord.replace(/'/g, "\\'")}">
                <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M19 7a9 9 0 0 1 0 10"/><path d="M15 9a5 5 0 0 1 0 6"/></svg>
                </button>
            </div>
            <p class="text-sm text-slate-600 dark:text-slate-300"><span class="font-medium">Terjemahan:</span> ${item.indonesian||'-'}</p>
            <div class="mt-2 flex flex-wrap gap-2 text-xs">
                <span class="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50">Artikel: ${item.article||'-'}</span>
                <span class="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50">Gender: ${item.gender||'-'}</span>
                <span class="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/50">Kategori: ${item.category||'-'}</span>
            </div>
            ${item.example ? `
                <div class="mt-2 flex items-start gap-2">
                <button title="Dengar contoh" class="text-slate-500 hover:text-brand-600 dark:hover:text-brand-400" data-say-ex="${(item.example||'').replace(/'/g, "\\'")}">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H3v6h3l5 4V5z"/><path d="M19 7a9 9 0 0 1 0 10"/><path d="M15 9a5 5 0 0 1 0 6"/></svg>
                </button>
                <p class="text-sm text-slate-600 dark:text-slate-300"><span class="font-medium">Contoh:</span> ${item.example}</p>
                </div>` : '<p class="mt-2 text-sm text-slate-500 dark:text-slate-400">Contoh: –</p>'}
            </div>
            <div class="flex gap-2">
            <button class="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800" data-edit='${JSON.stringify(item).replace(/'/g, "&apos;")}' >Edit</button>
            <button class="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700/50 dark:text-red-300 dark:hover:bg-red-900/20" data-del-id='${item.id}' data-del-label='${(item.article ? item.article+" " : "")+(item.german||"")}' >Hapus</button>
            </div>
        </div>`;
        dataContainer.appendChild(card);
    });
    }
    renderPagination(lastFilteredCount);
}

function renderPagination(total){
    const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
    pageNumbers.innerHTML = '';

    const makeBtn = (label, page, active=false) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.className = `px-3 py-2 rounded-lg border ${active ? 'bg-brand-500 text-white border-brand-500' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`;
    b.onclick = () => { currentPage = page; render(); };
    return b;
    };

    let start = Math.max(1, currentPage - Math.floor(maxPageButtons/2));
    let end = Math.min(totalPages, start + maxPageButtons - 1);
    if (end === totalPages) start = Math.max(1, end - maxPageButtons + 1);

    if (start > 1){ pageNumbers.appendChild(makeBtn(1,1,false)); if (start>2){ const span=document.createElement('span'); span.className='px-2'; span.textContent='…'; pageNumbers.appendChild(span); } }
    for(let i=start;i<=end;i++){ pageNumbers.appendChild(makeBtn(i,i,i===currentPage)); }
    if (end < totalPages){ if (end < totalPages-1){ const span=document.createElement('span'); span.className='px-2'; span.textContent='…'; pageNumbers.appendChild(span);} pageNumbers.appendChild(makeBtn(totalPages,totalPages,false)); }

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
}

let t;
searchInput.addEventListener('input', () => { clearTimeout(t); t=setTimeout(()=>{ currentPage=1; render(); }, 250); });
sortBy.addEventListener('change',   () => { currentPage=1; render(); });
pageSizeSelect.addEventListener('change', () => { itemsPerPage = parseInt(pageSizeSelect.value,10) || 5; currentPage=1; render(); });
filterArticle.addEventListener('change',  () => { currentPage=1; render(); });
filterGender.addEventListener('change',   () => { currentPage=1; render(); });

clearAllBtn.addEventListener('click', () => {
    filterArticle.value = 'all';
    filterGender.value  = 'all';
    sortBy.value        = 'german';
    pageSizeSelect.value= '5';
    itemsPerPage        = 5;
    searchInput.value   = '';
    currentPage = 1;
    render();
});

document.addEventListener('keydown', (e)=>{
    if(e.key==='/' && document.activeElement!==searchInput){ e.preventDefault(); searchInput.focus(); }
    if(e.key==='Escape'){
    if (!editModal.classList.contains('hidden')) closeModal();
    if (!deleteModal.classList.contains('hidden')) closeDeleteModal();
    }
});

prevPageBtn.addEventListener('click', ()=>{ if (currentPage>1){ currentPage--; render(); } });
nextPageBtn.addEventListener('click', ()=>{ const totalPages = Math.max(1, Math.ceil(lastFilteredCount/itemsPerPage)); if(currentPage<totalPages){ currentPage++; render(); } });

document.querySelectorAll('[data-chip]').forEach(btn=>{
    btn.classList.add('px-3','py-1.5','rounded-full','border','border-slate-200','dark:border-slate-700','bg-white/60','dark:bg-slate-900/50','text-slate-700','dark:text-slate-200','hover:bg-slate-50','dark:hover:bg-slate-800','text-xs');
    btn.addEventListener('click', ()=>{ const v = btn.getAttribute('data-chip'); searchInput.value = v; currentPage=1; render(); });
});

dataContainer.addEventListener('click', (e)=>{
    const sayBtn = e.target.closest('[data-say]');
    if (sayBtn){ speakWithSelection(sayBtn.getAttribute('data-say')); }
    const sayExBtn = e.target.closest('[data-say-ex]');
    if (sayExBtn){ speakWithSelection(sayExBtn.getAttribute('data-say-ex')); }
    const editBtn = e.target.closest('[data-edit]');
    if (editBtn){ const item = JSON.parse(editBtn.getAttribute('data-edit').replaceAll('&apos','\'')); openEditModal(item); }
    const delBtn = e.target.closest('[data-del-id]');
    if (delBtn){ openDeleteModal(delBtn.getAttribute('data-del-id'), delBtn.getAttribute('data-del-label')); }
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
    const res = await fetch(URL, { method:'POST', body: JSON.stringify(payload) });
    const result = await res.text();
    if (res.ok && result === 'Success'){ form.reset(); await fetchData(); notify('Kosakata ditambahkan'); }
    else throw new Error(result);
    } catch(err){ console.error(err); notify('Gagal menambah','err'); }
    finally { hideLoading(); }
});

function openEditModal(item){
    editId.value = item.id;
    editGerman.value = item.german || '';
    editIndo.value = item.indonesian || '';
    editCategory.value = item.category || '';
    editArticle.value = item.article || '';
    editGender.value = item.gender || '';
    editExample.value = item.example || '';
    editModal.classList.remove('hidden');
    editModal.classList.add('flex');
}
function closeModal(){ editModal.classList.add('hidden'); editModal.classList.remove('flex'); }
window.closeModal = closeModal;

function openDeleteModal(id, label){
    pendingDeleteId = id;
    deleteLabel.textContent = label || '(tanpa label)';
    deleteModal.classList.remove('hidden');
    deleteModal.classList.add('flex');
    setTimeout(()=> btnConfirmDelete.focus(), 0);
}
function closeDeleteModal(){
    pendingDeleteId = null;
    deleteModal.classList.add('hidden');
    deleteModal.classList.remove('flex');
}
btnCancelDelete.addEventListener('click', closeDeleteModal);
btnConfirmDelete.addEventListener('click', async ()=>{
    if (!pendingDeleteId) return;
    await performDelete(pendingDeleteId);
    closeDeleteModal();
});

async function performDelete(id){
    try{
    showLoading();
    const res = await fetch(URL, { method:'POST', body: JSON.stringify({ action:'delete', id }) });
    const result = await res.text();
    if (res.ok && result === 'Deleted'){ await fetchData(); notify('Kosakata terhapus'); }
    else throw new Error(result);
    } catch(err){ console.error(err); notify('Gagal menghapus','err'); }
    finally { hideLoading(); }
}

function populateVoices(){
    if (!('speechSynthesis' in window)) return;
    const all = speechSynthesis.getVoices();
    const voices = all.filter(v => v && (v.lang.startsWith('de') || v.lang.startsWith('id') || v.lang.startsWith('en')));
    if (!ttsVoice) return;
    ttsVoice.innerHTML = '';
    voices.forEach((v,i)=>{
    const opt = document.createElement('option');
    opt.value = i.toString();
    opt.textContent = `${v.name} (${v.lang})`;
    ttsVoice.appendChild(opt);
    });
    const idxDe = voices.findIndex(v => v.lang.toLowerCase().startsWith('de'));
    const idxId = voices.findIndex(v => v.lang.toLowerCase().startsWith('id'));
    ttsVoice.selectedIndex = Math.max(0, idxDe !== -1 ? idxDe : (idxId !== -1 ? idxId : 0));
    selectedVoice = voices[ttsVoice.selectedIndex] || null;
}

function speakWithSelection(text){
    if (!('speechSynthesis' in window)) return;
    if (!text) return;
    const u = new SpeechSynthesisUtterance(text);
    if (selectedVoice) u.voice = selectedVoice;
    u.lang = selectedVoice?.lang || 'de-DE';
    u.rate = parseFloat(ttsRate?.value || '1');
    u.pitch = parseFloat(ttsPitch?.value || '1');
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
}

if ('speechSynthesis' in window){
    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    ttsVoice?.addEventListener('change', ()=>{
    const all = speechSynthesis.getVoices().filter(v => v && (v.lang.startsWith('de') || v.lang.startsWith('id') || v.lang.startsWith('en')));
    selectedVoice = all[parseInt(ttsVoice.value||'0',10)] || null;
    });

    ttsPlay?.addEventListener('click', ()=>{
    const text = (ttsText?.value || '').trim();
    if (!text){ if(ttsStatus) ttsStatus.textContent = 'Isi teks terlebih dahulu.'; return; }
    const u = new SpeechSynthesisUtterance(text);
    if (selectedVoice) u.voice = selectedVoice;
    u.lang = selectedVoice?.lang || 'de-DE';
    u.rate = parseFloat(ttsRate.value);
    u.pitch = parseFloat(ttsPitch.value);
    u.onstart = ()=> ttsStatus && (ttsStatus.textContent = 'Membaca…');
    u.onend   = ()=> ttsStatus && (ttsStatus.textContent = 'Selesai.');
    u.onerror = ()=> ttsStatus && (ttsStatus.textContent = 'Terjadi kesalahan TTS.');
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    });

    ttsPause?.addEventListener('click', ()=>{
    if (speechSynthesis.speaking){
        if (speechSynthesis.paused){ speechSynthesis.resume(); ttsStatus && (ttsStatus.textContent = 'Lanjut…'); }
        else { speechSynthesis.pause(); ttsStatus && (ttsStatus.textContent = 'Jeda.'); }
    }
    });

    ttsStop?.addEventListener('click', ()=>{
    speechSynthesis.cancel();
    ttsStatus && (ttsStatus.textContent = 'Dihentikan.');
    });
} else {
    document.querySelectorAll('#ttsPlay,#ttsPause,#ttsStop').forEach(b => b?.setAttribute('disabled','disabled'));
    if (ttsStatus) ttsStatus.textContent = 'Browser tidak mendukung SpeechSynthesis.';
}

(function init(){
    itemsPerPage = parseInt(pageSizeSelect.value,10) || 5; // default 5
    fetchData();
})();