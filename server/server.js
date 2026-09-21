const express = require("express");
const cors = require("cors");
const multer = require("multer");
const vision = require("@google-cloud/vision");

const app = express();
const port = process.env.PORT || 8080;

const allowedOrigin = process.env.FRONTEND_ORIGIN || "*";
app.use(cors({ origin: allowedOrigin }));
app.get("/health", (_req,res) => res.json({ok:true, service:"imagecheck-ai"}));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!/^image\\/(png|jpe?g|webp)$/i.test(file.mimetype)) {
      return cb(new Error("Formato não suportado. Use PNG, JPG ou WEBP."));
    }
    cb(null, true);
  }
});

const client = new vision.ImageAnnotatorClient();

app.post("/api/analyze", upload.single("image"), async (req,res) => {
  try {
    if (!req.file) return res.status(400).json({error:"Nenhuma imagem enviada."});

    const request = {
      requests: [{
        image: { content: req.file.buffer },
        features: [
          { type: "LABEL_DETECTION", maxResults: 8 },
          { type: "FACE_DETECTION", maxResults: 20 },
          { type: "SAFE_SEARCH_DETECTION" },
          { type: "IMAGE_PROPERTIES" }
        ]
      }]
    };

    const [result] = await client.annotateImage(request);
    const error = result.error;
    if (error && error.message) throw new Error(error.message);

    const labels = (result.labelAnnotations || []).map(x => ({
      description: x.description,
      score: x.score
    }));

    const faces = (result.faceAnnotations || []).length;
    const safe = result.safeSearchAnnotation || {};

    // IMPORTANTE:
    // Cloud Vision não é tratado aqui como um detector de "imagem gerada por IA".
    // Este campo fica reservado para um modelo de detecção sintética/deepfake
    // que poderá ser conectado futuramente.
    const syntheticDetection = {
      configured: false,
      verdict: null,
      confidence: null
    };

    res.json({
      labels,
      faces,
      safeSearch: {
        adult: safe.adult ? safe.adult.toString() : "UNKNOWN",
        spoof: safe.spoof ? safe.spoof.toString() : "UNKNOWN",
        medical: safe.medical ? safe.medical.toString() : "UNKNOWN",
        violence: safe.violence ? safe.violence.toString() : "UNKNOWN",
        racy: safe.racy ? safe.racy.toString() : "UNKNOWN"
      },
      syntheticDetection
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({error: err.message || "Erro interno na análise."});
  }
});

app.use((err,_req,res,_next) => {
  res.status(400).json({error: err.message || "Requisição inválida."});
});

app.listen(port, () => console.log(`ImageCheck API rodando na porta ${port}`));
