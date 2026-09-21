const API_URL = (window.IMAGECHECK_API_URL || "").replace(/\/$/, "");
const fileInput = document.getElementById("fileInput");
const chooseBtn = document.getElementById("chooseBtn");
const dropZone = document.getElementById("dropZone");
const fileName = document.getElementById("fileName");
const loading = document.getElementById("loading");
const preview = document.getElementById("preview");
const resultTitle = document.getElementById("resultTitle");
const statusPill = document.getElementById("statusPill");
const visionStatus = document.getElementById("visionStatus");
const visionMessage = document.getElementById("visionMessage");
const chips = document.getElementById("chips");
const signals = document.getElementById("signals");

chooseBtn.addEventListener("click", e => { e.stopPropagation(); fileInput.click(); });
dropZone.addEventListener("click", () => fileInput.click());
["dragenter","dragover"].forEach(t => dropZone.addEventListener(t, e => { e.preventDefault(); dropZone.classList.add("drag"); }));
["dragleave","drop"].forEach(t => dropZone.addEventListener(t, e => { e.preventDefault(); dropZone.classList.remove("drag"); }));
dropZone.addEventListener("drop", e => { const f=e.dataTransfer.files[0]; if(f) analyze(f); });
fileInput.addEventListener("change", e => { const f=e.target.files[0]; if(f) analyze(f); });

function setSignals(items) {
  signals.innerHTML = items.map(x => `
    <div class="signal">
      <div class="signal-icon">${x.icon}</div>
      <div><b>${escapeHtml(x.title)}</b><p>${escapeHtml(x.text)}</p></div>
    </div>`).join("");
}

async function analyze(file) {
  if (!file.type.startsWith("image/")) return;
  fileName.textContent = `Arquivo: ${file.name}`;
  preview.innerHTML = "";
  const img = document.createElement("img");
  img.src = URL.createObjectURL(file);
  img.alt = "Imagem selecionada";
  preview.appendChild(img);

  resultTitle.textContent = "Analisando imagem...";
  statusPill.textContent = "Processando";
  visionStatus.textContent = API_URL ? "Conectado" : "Não conectado";
  chips.innerHTML = "";
  loading.classList.remove("hidden");

  if (!API_URL) {
    loading.classList.add("hidden");
    statusPill.textContent = "Modo demonstração";
    resultTitle.textContent = "Imagem carregada";
    visionMessage.textContent = "O frontend está pronto. Falta apenas colocar a URL do backend Cloud Run em config.js.";
    setSignals([
      {icon:"⌁",title:"Textura e detalhes",text:"Pronto para receber resultados do seu modelo de análise."},
      {icon:"◉",title:"Rosto e elementos",text:"A Cloud Vision poderá retornar informações sobre rostos e objetos."},
      {icon:"⌘",title:"Conteúdo",text:"O SafeSearch poderá sinalizar categorias de conteúdo potencialmente sensível."}
    ]);
    return;
  }

  const form = new FormData();
  form.append("image", file);

  try {
    const response = await fetch(`${API_URL}/api/analyze`, { method:"POST", body:form });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Falha na análise");

    statusPill.textContent = "Analisado";
    resultTitle.textContent = "Análise concluída";
    visionStatus.textContent = "Cloud Vision OK";
    visionMessage.textContent = "Resultados retornados pelo backend. Eles são sinais auxiliares e não comprovam, sozinhos, que uma imagem seja real ou gerada por IA.";

    chips.innerHTML = (data.labels || []).map(l => `<span class="chip">${escapeHtml(l.description)} · ${Math.round((l.score||0)*100)}%</span>`).join("");

    const faceText = `${data.faces ?? 0} rosto(s) detectado(s)`;
    const adult = data.safeSearch?.adult || "UNKNOWN";
    const violence = data.safeSearch?.violence || "UNKNOWN";
    setSignals([
      {icon:"⌁",title:"Rótulos visuais",text:(data.labels||[]).slice(0,4).map(x=>x.description).join(", ") || "Nenhum rótulo relevante retornado."},
      {icon:"◉",title:"Detecção de rostos",text:faceText},
      {icon:"⌘",title:"SafeSearch",text:`Adulto: ${adult} · Violência: ${violence}`}
    ]);
  } catch (err) {
    statusPill.textContent = "Erro";
    resultTitle.textContent = "Não foi possível concluir a análise";
    visionStatus.textContent = "Falha";
    visionMessage.textContent = err.message;
  } finally {
    loading.classList.add("hidden");
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
