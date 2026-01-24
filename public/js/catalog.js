(function(){
  function qs(s, el){ return (el||document).querySelector(s); }
  function qsp(name){ const u = new URL(window.location.href); return u.searchParams.get(name); }
  function escapeHtml(str){ return String(str||'').replace(/[&<>"]|'/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c])); }

  async function loadItem(){
    const id = qsp('id');
    const container = qs('#item');
    if (!id){ container.innerHTML = '<div class="text-gray-600">Missing id parameter.</div>'; return; }
    try {
      const res = await fetch(`/api/catalog/${encodeURIComponent(id)}`);
      const data = await res.json();
      if (!data.success){ throw new Error(data.error || 'Failed to load'); }
      const f = data.file;
      container.innerHTML = `
        <h1 class="text-2xl font-semibold text-slate-900">${escapeHtml(f.title)}</h1>
        <p class="mt-2 text-slate-700">${escapeHtml(f.description||'')}</p>
        <dl class="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-600">
          <div><dt class="font-medium">Price</dt><dd>${Number(f.price||0).toLocaleString()} KES</dd></div>
          <div><dt class="font-medium">Size</dt><dd>${(f.size||0)} bytes</dd></div>
        </dl>
        <div class="mt-6 flex items-center gap-3">
          <input id="email" type="email" placeholder="you@example.com" class="border rounded px-3 py-2 w-64" />
          <button id="btnDownload" class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded">Download (Premium)</button>
          <span id="status" class="text-sm text-slate-600"></span>
        </div>
      `;
      qs('#btnDownload').addEventListener('click', () => requestDownload(id));
    } catch (e){
      container.innerHTML = `<div class="text-red-600">${escapeHtml(e.message)}</div>`;
    }
  }

  async function requestDownload(fileId){
    const email = qs('#email').value.trim().toLowerCase();
    const status = qs('#status');
    if (!email){ status.textContent = 'Enter your account email.'; return; }
    status.textContent = 'Requesting download…';
    try {
      const res = await fetch('/api/download/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId, email }) });
      const data = await res.json();
      if (!res.ok || !data.success){ throw new Error(data.error || 'Failed'); }
      status.innerHTML = `<a class="text-blue-600 underline" href="${data.url}">Click here if download does not start</a>`;
      // Kick off download
      window.location.href = data.url;
    } catch (e){ status.textContent = `Denied: ${e.message}`; }
  }

  document.addEventListener('DOMContentLoaded', loadItem);
})();
