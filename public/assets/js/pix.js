document.getElementById('formCheckout').addEventListener('submit', async e=>{
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.target));
  const r = await fetch('/api/create-pix', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body)});
  const {qr,copia} = await db.json();
  document.getElementById('areaPix').classList.remove('hidden');
  QRCode.toCanvas(document.getElementById('qr'), qr, {width:220});
  document.getElementById('copia').textContent = copia;
});
function copiar(){ navigator.clipboard.writeText(document.getElementById('copia').textContent); alert('Copiado!'); }