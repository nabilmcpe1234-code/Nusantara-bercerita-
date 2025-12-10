/* app.js - simple client app using localStorage
   Admin password default: admin123 (please change if used publicly) */

const STORAGE_KEY = 'tkb_stories_v1';
const ADMIN_PASS = 'admin123'; // change before deploying

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const uid = () => 's' + Date.now() + Math.floor(Math.random()*900);

function loadStories(){
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ console.error(e); return [];}
}
function saveStories(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

let stories = loadStories();

if(stories.length === 0){
  stories = [
    {
      id: uid(),
      title: "Batik: Warisan yang Hidup",
      author: "Siti",
      category: "Budaya",
      content: "Batik telah hidup selama berabad-abad dan menjadi bahasa visual budaya Indonesia...",
      imageDataUrl: "",
      likes: 6,
      comments: [{by:'Amin', text:'Menginspirasi!'}],
      published: true,
      createdAt: Date.now() - 1000*60*60*24*5
    },
    {
      id: uid(),
      title: "Jejak Langkah di Tanah Lombok",
      author: "Adi",
      category: "Perjalanan",
      content: "Pemandangan yang menenangkan dan keramahan penduduk membuatku betah...",
      imageDataUrl: "",
      likes: 4,
      comments: [],
      published: true,
      createdAt: Date.now() - 1000*60*60*24*2
    }
  ];
  saveStories(stories);
}

const storiesList = $('#storiesList');
const modalForm = $('#modalForm');
const storyForm = $('#storyForm');
const btnOpen = $('#btn-open-form');
const btnOpenHero = $('#btn-open-form-hero');
const closeForm = $('#closeForm');
const imageInput = $('#imageInput');
const searchInput = $('#searchInput');
const btnAdmin = $('#btn-admin');
const modalAdmin = $('#modalAdmin');
const closeAdmin = $('#closeAdmin');
const btnAdminLogin = $('#btnAdminLogin');
const adminPass = $('#adminPass');
const adminPanel = $('#adminPanel');
const adminLogin = $('#adminLogin');
const queueList = $('#queueList');
const manageList = $('#manageList');
const btnLogout = $('#btnLogout');
const popularList = $('#popularList');
const btnViewGallery = $('#btn-view-gallery');
const btnClear = $('#btnClear');

function renderStories(filter=''){
  storiesList.innerHTML = '';
  const published = stories.filter(s => s.published);
  const q = filter.trim().toLowerCase();
  const filtered = published.filter(s => {
    if(!q) return true;
    return (s.title+s.author+s.content+s.category).toLowerCase().includes(q);
  }).sort((a,b)=> b.createdAt - a.createdAt);

  if(filtered.length === 0){
    storiesList.innerHTML = '<div class="card"><h3>Tidak ada cerita</h3><p>Coba tambahkan cerita atau periksa antrian.</p></div>';
    return;
  }

  filtered.forEach(s => {
    const el = document.createElement('article'); el.className='card';
    let imgHtml = s.imageDataUrl ? `<img src="${s.imageDataUrl}" alt="gambar">` : '';
    el.innerHTML = `
      ${imgHtml}
      <h3>${escapeHtml(s.title)}</h3>
      <p class="meta">Oleh <strong>${escapeHtml(s.author)}</strong> • ${new Date(s.createdAt).toLocaleDateString()}</p>
      <p>${escapeHtml(truncate(s.content,220))}</p>
      <div class="meta">
        <span>🏷️ ${escapeHtml(s.category)}</span>
        <div class="actions">
          <button class="btn like" data-id="${s.id}">❤️ ${s.likes||0}</button>
          <button class="btn view" data-id="${s.id}">Baca</button>
        </div>
      </div>
    `;
    storiesList.appendChild(el);
  });
  attachCardHandlers();
  renderPopular();
}

function renderPopular(){
  popularList.innerHTML = '';
  const top = stories.filter(s=>s.published).sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,5);
  top.forEach(s => {
    const li = document.createElement('li');
    li.textContent = `${s.title} — ${s.author} (${s.likes||0} likes)`;
    popularList.appendChild(li);
  });
}

function renderQueue(){
  queueList.innerHTML = '';
  const q = stories.filter(s => !s.published);
  if(q.length===0) queueList.innerHTML = '<p class="muted small">Tidak ada kiriman di antrian.</p>';
  q.forEach(s=>{
    const div = document.createElement('div'); div.className='card';
    div.innerHTML = `<h4>${escapeHtml(s.title)}</h4><p>${escapeHtml(truncate(s.content,200))}</p>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn approve" data-id="${s.id}">Setujui</button>
        <button class="btn muted reject" data-id="${s.id}">Hapus</button>
      </div>`;
    queueList.appendChild(div);
  });
  $$('.approve').forEach(b => b.onclick = () => { togglePublish(b.dataset.id, true); });
  $$('.reject').forEach(b => b.onclick = () => { deleteStory(b.dataset.id); });
}

function renderManage(){
  manageList.innerHTML = '';
  const pub = stories.filter(s=>s.published).sort((a,b)=>b.createdAt-a.createdAt);
  pub.forEach(s=>{
    const div = document.createElement('div'); div.className='card';
    div.innerHTML = `<h4>${escapeHtml(s.title)}</h4><p>oleh ${escapeHtml(s.author)} • ${new Date(s.createdAt).toLocaleString()}</p>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn unpublish" data-id="${s.id}">Unpublish</button>
        <button class="btn muted del" data-id="${s.id}">Delete</button>
      </div>`;
    manageList.appendChild(div);
  });
  $$('.unpublish').forEach(b=>b.onclick=()=>togglePublish(b.dataset.id,false));
  $$('.del').forEach(b=>b.onclick=()=>deleteStory(b.dataset.id));
}

function attachCardHandlers(){
  $$('.btn.like').forEach(b=>{
    b.onclick = () => {
      const id = b.dataset.id;
      const s = stories.find(x=>x.id===id);
      if(!s) return;
      s.likes = (s.likes||0)+1;
      saveStories(stories); renderStories(searchInput.value);
    };
  });
  $$('.btn.view').forEach(b=>{
    b.onclick = () => {
      const id = b.dataset.id;
      const s = stories.find(x=>x.id===id);
      if(!s) return;
      openReadModal(s);
    };
  });
}

function openReadModal(s){
  const modal = document.createElement('div'); modal.className='modal';
  const card = document.createElement('div'); card.className='modal-card';
  card.style.maxWidth='720px';
  card.innerHTML = `<button class="close" id="tmpClose">&times;</button>
    ${s.imageDataUrl? `<img src="${s.imageDataUrl}" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:8px">` : ''}
    <h2>${escapeHtml(s.title)}</h2>
    <p class="muted small">Oleh ${escapeHtml(s.author)} • ${new Date(s.createdAt).toLocaleString()}</p>
    <div style="margin-top:10px">${nl2br(escapeHtml(s.content))}</div>
    <div style="margin-top:14px;display:flex;gap:8px;justify-content:flex-end">
      <button class="btn" id="tmpClose2">Tutup</button>
    </div>`;
  modal.appendChild(card);
  document.body.appendChild(modal);
  $('#tmpClose').onclick = $('#tmpClose2').onclick = ()=> modal.remove();
}

function togglePublish(id, value){
  const s = stories.find(x=>x.id===id);
  if(!s) return;
  s.published = !!value;
  saveStories(stories);
  renderQueue(); renderManage(); renderStories(searchInput.value);
}

function deleteStory(id){
  if(!confirm('Hapus cerita ini?')) return;
  stories = stories.filter(s=>s.id!==id);
  saveStories(stories);
  renderQueue(); renderManage(); renderStories(searchInput.value);
}

function truncate(str, n){ return str.length>n ? str.slice(0,n-1)+'…' : str; }
function escapeHtml(str){ if(!str) return ''; return str.replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function nl2br(s){ return s.replace(/\n/g,'<br>'); }

function openModal(){
  modalForm.classList.remove('hidden');
}
function closeModal(){
  modalForm.classList.add('hidden');
  storyForm.reset();
}

btnOpen.addEventListener('click', openModal);
btnOpenHero.addEventListener('click', openModal);
closeForm.addEventListener('click', closeModal);
btnClear.addEventListener('click', ()=>storyForm.reset());

storyForm.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const author = $('#author').value.trim();
  const title = $('#title').value.trim();
  const category = $('#category').value;
  const content = $('#content').value.trim();
  const file = $('#imageInput').files[0];
  let imageDataUrl = '';
  if(file){
    imageDataUrl = await fileToDataUrl(file);
  }
  const newStory = {
    id: uid(),
    title, author, category, content, imageDataUrl,
    likes:0, comments:[], published:false, createdAt: Date.now()
  };
  stories.push(newStory);
  saveStories(stories);
  alert('Terima kasih! Cerita Anda masuk ke antrian moderator.');
  closeModal();
  renderQueue();
});

function fileToDataUrl(file){
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload = ()=> res(r.result);
    r.onerror = ()=> rej(r.error);
    r.readAsDataURL(file);
  });
}

searchInput.addEventListener('input', ()=> {
  renderStories(searchInput.value);
});

btnAdmin.addEventListener('click', ()=> modalAdmin.classList.remove('hidden'));
closeAdmin.addEventListener('click', ()=> modalAdmin.classList.add('hidden'));

btnAdminLogin.addEventListener('click', ()=>{
  const pass = adminPass.value;
  if(pass === ADMIN_PASS){
    adminLogin.classList.add('hidden'); adminPanel.classList.remove('hidden');
    renderQueue(); renderManage();
  } else {
    alert('Password salah.');
  }
});
btnLogout.addEventListener('click', ()=>{
  adminLogin.classList.remove('hidden'); adminPanel.classList.add('hidden');
  adminPass.value = '';
  modalAdmin.classList.add('hidden');
});

btnViewGallery.addEventListener('click', ()=> {
  const imgs = stories.filter(s=>s.imageDataUrl && s.published).map(s=>({src:s.imageDataUrl, title:s.title}));
  if(imgs.length===0){ alert('Belum ada gambar yang dipublikasikan.'); return; }
  const modal = document.createElement('div'); modal.className='modal';
  const card = document.createElement('div'); card.className='modal-card';
  card.style.maxWidth='880px';
  let body = `<button class="close" id="gClose">&times;</button><h3>Galeri Karya</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-top:12px">`;
  imgs.forEach(i=> body += `<div style="border-radius:8px;overflow:hidden"><img src="${i.src}" style="width:100%;height:150px;object-fit:cover"><div style="padding:6px;font-size:13px">${escapeHtml(i.title)}</div></div>`);
  body += `</div><div style="margin-top:12px;display:flex;justify-content:flex-end"><button class="btn" id="gClose2">Tutup</button></div>`;
  card.innerHTML = body;
  modal.appendChild(card); document.body.appendChild(modal);
  $('#gClose').onclick = $('#gClose2').onclick = ()=> modal.remove();
});

document.getElementById('year').textContent = new Date().getFullYear();
renderStories();
renderPopular();
