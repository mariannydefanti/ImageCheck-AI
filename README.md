# ImageCheck AI

Protótipo do projeto de prevenção e análise de imagens.

## Arquitetura

```text
Usuário
  ↓
GitHub Pages (frontend)
  ↓ HTTPS
Cloud Run (backend Node.js)
  ↓
Google Cloud Vision API
```

### Por que separar frontend e backend?

A chave/credencial do Google Cloud **não deve ficar no JavaScript publicado no GitHub Pages**. O frontend chama o backend; o backend usa a identidade do Google Cloud para chamar a Vision API.

## 1. Publicar o frontend no GitHub Pages

Crie um repositório e envie os arquivos da raiz.

O workflow `.github/workflows/pages.yml` publica o conteúdo automaticamente no GitHub Pages.

Depois que o backend estiver no ar, edite:

```js
// config.js
window.IMAGECHECK_API_URL = "https://SEU-SERVICO.run.app";
```

Faça commit novamente.

## 2. Rodar o backend localmente

Dentro de `server/`:

```bash
npm install
gcloud auth application-default login
npm start
```

O backend ficará em:

```text
http://localhost:8080
```

Para testar o frontend localmente, coloque em `config.js`:

```js
window.IMAGECHECK_API_URL = "http://localhost:8080";
```

## 3. Google Cloud

No projeto Google Cloud, habilite a Vision API e configure autenticação.

Para Cloud Run, prefira uma conta de serviço gerenciada pelo usuário como identidade do serviço. Não coloque arquivo de chave JSON no GitHub.

O backend usa:

```js
const client = new vision.ImageAnnotatorClient();
```

e chama:
- LABEL_DETECTION
- FACE_DETECTION
- SAFE_SEARCH_DETECTION
- IMAGE_PROPERTIES

## 4. Deploy do backend no Cloud Run

Entre na pasta:

```bash
cd server
```

Exemplo:

```bash
gcloud run deploy imagecheck-api \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Depois copie a URL `https://...run.app` para `config.js`.

Para produção, defina `FRONTEND_ORIGIN` com o endereço do seu GitHub Pages em vez de deixar CORS aberto.

## 5. Parte mais importante do projeto: detectar imagem gerada por IA

A Cloud Vision API é ótima como camada auxiliar, mas não deve ser apresentada como um detector de deepfake. Ela oferece, por exemplo, rótulos, rostos e SafeSearch.

O backend já deixa um ponto reservado:

```js
syntheticDetection
```

A próxima etapa pode conectar um modelo específico de detecção de imagens sintéticas/deepfake. Esse modelo deverá ser treinado/validado com uma base apropriada e retornar algo como:

```json
{
  "verdict": "possible_synthetic",
  "confidence": 0.87
}
```

O site então pode mostrar esse resultado junto dos sinais da Vision API.

## Privacidade

Para um projeto real, não armazene imagens por padrão. Defina limites de tamanho, tipos de arquivo, tempo de retenção e controles de acesso. Para imagens de pessoas, especialmente menores de idade, use apenas dados e testes autorizados e apropriados.

## Atenção

Um resultado automático nunca deve ser tratado isoladamente como prova de que uma imagem é verdadeira ou falsa. O objetivo do protótipo é apoiar uma verificação responsável.
