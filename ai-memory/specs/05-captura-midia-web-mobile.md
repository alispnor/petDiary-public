# Spec 05 — Captura de Mídia (Web + Mobile)

> Spec original do Ali (2026-05-01). Salva para rodar em fase futura.
> **Depende de:** Fase 7 (uploads/storage abstrato) e Spec 04 (S3 + processamento IA)

---

## Pedido do Ali

> "ainda upload media nao esta pronto no web pode colocar opção arrast ou tirar foto pelo webcam também e no mobile pode usar anexar arquivo ou foto e gravar audio e video ou tirar foto"

---

## Escopo

Cobrir **todos os modos de captura** que cada plataforma oferece:

### Web (browser)
1. **Anexar arquivo** — `<input type="file" multiple accept="...">`
2. **Drag-and-drop** — arrastar arquivos pra zona delimitada
3. **Tirar foto pela webcam** — `getUserMedia({video: true})` + canvas snapshot
4. **Anexar PDF/documentos** — mesmo input file com extensões expandidas

### Mobile (Expo / React Native)
1. **Anexar arquivo** — `expo-document-picker`
2. **Tirar foto pela câmera** — `expo-camera` ou `expo-image-picker.launchCameraAsync`
3. **Escolher da galeria** — `expo-image-picker.launchImageLibraryAsync`
4. **Gravar áudio** — `expo-av.Audio.Recording`
5. **Gravar vídeo** — `expo-camera.Camera` em modo video ou `expo-image-picker` com `mediaTypes: Videos`

---

## Plano de fases sugerido (a confirmar quando rodar)

### Fase Y.1 — Web: componente `<MediaUploader>`
- Path: `src/components/MediaUploader.tsx`
- Props: `accept` (extensões), `multiple`, `maxSize`, `onUpload(File[])`, `mode: "all" | "image-only" | "doc-only"`
- 3 abas / botões dentro: "📁 Arquivo" / "📷 Webcam" / drag-drop overlay sempre visível
- Drag-drop com estado visual (dashed border + texto "Solte aqui")
- File preview thumbnails antes de enviar (imagem com blob URL, PDF com ícone)
- Validação de tamanho e extensão antes do upload
- Indicador de progresso por arquivo (XHR onUploadProgress)

### Fase Y.2 — Web: componente `<WebcamCapture>`
- Modal full-screen com `<video>` ao vivo
- `navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })` (preferir câmera traseira em mobile-web)
- Botão "📸 Capturar" desenha o frame em `<canvas>` e gera Blob via `canvas.toBlob('image/jpeg', 0.85)`
- Preview do snapshot antes de confirmar (botões "Refazer" / "Usar foto")
- Tratar permissão negada com fallback amigável
- Cleanup: `track.stop()` ao fechar para liberar a webcam

### Fase Y.3 — Web: integração na ClinicalView
- Botão "📎 Anexar" ao lado de cada record da timeline
- Abre `<MediaUploader>` em modal
- Após upload, `<FileAttachment>` (Spec uploads) lista o anexo

### Fase Y.4 — Mobile: serviço `mediaPicker.ts`
- Path: `src/services/mediaPicker.ts`
- Funções:
  - `pickPhoto(): Promise<MediaAsset>` — galeria
  - `takePhoto(): Promise<MediaAsset>` — câmera
  - `pickDocument(): Promise<MediaAsset>` — `expo-document-picker`
  - `recordAudio(): Promise<MediaAsset>` — pipeline de gravação
  - `recordVideo(): Promise<MediaAsset>` — câmera modo video
- Cada função pede permissão antes (`requestPermissionsAsync`)
- Fallback amigável se negado
- Tipo unificado `MediaAsset { uri, type, fileName, fileSize, durationMs? }`

### Fase Y.5 — Mobile: componente `<AttachmentPicker>`
- Path: `src/components/AttachmentPicker.tsx`
- Bottom sheet com 5 opções em grid:
  - 📷 Câmera
  - 🖼 Galeria
  - 📄 Documento
  - 🎤 Áudio
  - 🎥 Vídeo
- Cada opção chama o método correspondente do `mediaPicker`
- Após captura, mostra preview e form (nome do arquivo + descrição opcional)

### Fase Y.6 — Mobile: gravador de áudio com timer
- Componente `<AudioRecorder>`:
  - Botão grande pulsante "Gravar"
  - Timer (00:00) atualiza durante gravação
  - Botão "Parar" → preview com `expo-av.Audio.Sound` (botão play/pause)
  - "Usar áudio" / "Refazer"
- Usar para o caso "diário falado de sintomas" (pré-Fase 04 de IA)

### Fase Y.7 — Mobile: gravador de vídeo
- Componente `<VideoRecorder>`:
  - Camera UI ao vivo com botão de gravação
  - Limite default 60s para não inflar storage
  - Preview no `<Video>` antes de enviar

### Fase Y.8 — Pipeline de upload comum
- Após captura (web ou mobile):
  1. Mostrar preview e form (file_name editável + descrição opcional)
  2. Solicitar URL pré-assinada ao backend (`POST /pets/<id>/health-records/upload-url/`)
  3. PUT direto pro S3 com `onUploadProgress` mostrando barra
  4. Notificar backend (`POST /pets/<id>/health-records/`) com a key salva
  5. Toast de sucesso + refetch da lista de records

---

## Permissões

### Web
- Webcam: prompt nativo do browser, sem persistência (pede toda visita)
- File API: sem prompt (só após interação do usuário)

### Mobile
- Camera: `Camera.requestCameraPermissionsAsync()`
- Microfone: `Audio.requestPermissionsAsync()`
- Galeria: `MediaLibrary.requestPermissionsAsync()`
- Documento: sem permissão extra (sandboxed)
- Configurar em `app.json`:
  ```json
  "ios": {
    "infoPlist": {
      "NSCameraUsageDescription": "PetDiary precisa da câmera para fotografar receitas e exames",
      "NSMicrophoneUsageDescription": "PetDiary precisa do microfone para gravar diário falado",
      "NSPhotoLibraryUsageDescription": "Acesso à galeria para anexar fotos existentes"
    }
  },
  "android": {
    "permissions": ["CAMERA", "RECORD_AUDIO", "READ_EXTERNAL_STORAGE"]
  }
  ```

---

## Limites e restrições sugeridos

| Tipo | Tamanho máx | Duração máx | Extensões |
|---|---|---|---|
| Foto | 10 MB | — | jpg, jpeg, png, webp, heic |
| Vídeo | 100 MB | 60s | mp4, mov, webm |
| Áudio | 25 MB | 5 min | mp3, m4a, ogg, wav |
| Documento | 25 MB | — | pdf, doc, docx, xls, xlsx |

Validar no client antes de subir (economiza banda) e revalidar no backend.

---

## Decisões pendentes

- [ ] Comprimir imagens automaticamente no client antes do upload? (recomendo sim — `expo-image-manipulator` no mobile, `canvas` no web)
- [ ] HEIC suporte? (iOS gera HEIC por default — converter pra JPEG no client)
- [ ] Vídeo: limitar duração no front ou só validar tamanho no back?
- [ ] Câmera traseira ou frontal por default no mobile? (recomendo traseira para receitas)
- [ ] Áudio: gravar em formato bruto (M4A) ou comprimir (OGG)?

---

## Encaixe no roadmap

- Vem **junto com a Fase 7** (uploads/download/print) — esta spec detalha o LADO da captura, complementa a infra de upload
- Pode ser que faça sentido fundir as duas em uma feature só "Mídia" e implementar de uma vez
- Antes da Spec 04 (OpenAI/S3) — captura → upload → backend salva → Spec 04 chama IA

## Tarefas relacionadas (ai-memory)

- Spec 04 — `04-integracoes-openai-aws-s3.md`
- Tasks #17 (backend Attachment), #18 (web upload UI), #19 (memória uploads)
