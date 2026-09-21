const API_URL = "";

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

chooseBtn.addEventListener("click", e => {
  e.stopPropagation();
  fileInput.click();
});

dropZone.addEventListener("click", () => fileInput.click());

["dragenter", "dragover"].forEach(type => {
  dropZone.addEventListener(type, e => {
    e.preventDefault();
    dropZone.classList.add("drag");
  });
});

["dragleave", "drop"].forEach(type => {
  dropZone.addEventListener(type, e => {
    e.preventDefault();
    dropZone.classList.remove("drag");
  });
});

dropZone.addEventListener("drop", e => {
  const file = e.dataTransfer.files[0];
  if (file) analyze(file);
});

fileInput.addEventListener("change", e => {
  const file = e.target.files[0];
  if (file) analyze(file);
});

function setSignals(items) {
  signals.innerHTML = items.map(item => `
    <div class="signal">
      <div class="signal-icon">${item.icon}</div>
      <div>
        <b>${escapeHtml(item.title)}</b>
        <p>${escapeHtml(item.text)}</p>
      </div>
    </div>
  `).join("");
}

async function analyze(file) {
  if (!file.type.startsWith("image/")) return;

  fileName.textContent = `Arquivo: ${file.name}`;
  preview.innerHTML = "";

  const imageUrl = URL.createObjectURL(file);
  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "Imagem selecionada";
  preview.appendChild(img);

  resultTitle.textContent = "Analisando imagem...";
  statusPill.textContent = "Processando";
  visionStatus.textContent = "Análise local";
  visionMessage.textContent =
    "Analisando informações técnicas da imagem diretamente no navegador.";
  chips.innerHTML = "";
  loading.classList.remove("hidden");

  try {
    const probe = new Image();

    await new Promise((resolve, reject) => {
      probe.onload = resolve;
      probe.onerror = reject;
      probe.src = imageUrl;
    });

    const width = probe.naturalWidth;
    const height = probe.naturalHeight;
    const megapixels = ((width * height) / 1000000).toFixed(2);
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);

    const signalsFound = [];

    if (width === height) {
      signalsFound.push("formato quadrado");
    }

    if (file.size > 8 * 1024 * 1024) {
      signalsFound.push("arquivo grande");
    }

    if (width >= 3000 || height >= 3000) {
      signalsFound.push("alta resolução");
    }

    statusPill.textContent = "Análise concluída";
    resultTitle.textContent = "Imagem analisada";
    visionStatus.textContent = "Modo gratuito";

    visionMessage.textContent =
      "O protótipo apresenta sinais técnicos da imagem. Esses sinais não comprovam, sozinhos, que uma imagem foi gerada por IA.";

    chips.innerHTML = `
      <span class="chip">${escapeHtml(file.type || "Formato desconhecido")}</span>
      <span class="chip">${width} × ${height}px</span>
      <span class="chip">${megapixels} MP</span>
      <span class="chip">${sizeMB} MB</span>
    `;

    setSignals([
      {
        icon: "⌁",
        title: "Formato e tamanho",
        text: `${file.type || "Desconhecido"} · ${sizeMB} MB`
      },
      {
        icon: "◉",
        title: "Dimensões",
        text: `${width} × ${height}px · ${megapixels} MP`
      },
      {
        icon: "⌘",
        title: "Sinais técnicos",
        text: signalsFound.length
          ? `Foram encontrados: ${signalsFound.join(", ")}. Isso não comprova uso de IA.`
          : "Nenhum sinal técnico básico foi destacado. Isso também não comprova que a imagem seja real."
      }
    ]);

  } catch (error) {
    statusPill.textContent = "Erro";
    resultTitle.textContent = "Não foi possível analisar a imagem";
    visionStatus.textContent = "Falha";
    visionMessage.textContent =
      "Tente selecionar uma imagem JPG, PNG ou WebP.";
  } finally {
    loading.classList.add("hidden");
    URL.revokeObjectURL(imageUrl);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[character]));
}
