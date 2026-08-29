# WebUI Development Instructions

These instructions apply to the llama.cpp WebUI under `tools/ui`.

## Upstream compatibility

This repository is a fork of `ggml-org/llama.cpp`.

Keep changes under this directory minimal and easy to rebase onto upstream `master`.

Avoid unrelated refactoring, renaming, formatting changes, or dependency upgrades.

## AnyDoc Office document support

This branch adds client-side Office document parsing to the built-in llama.cpp WebUI using:

`@firecrawl/anydoc-wasm`

The primary architecture must remain:

```text
Office file
    ↓
browser-side AnyDoc WASM
    ↓
Markdown/text
    ↓
existing llama.cpp text attachment pipeline
```

Office documents must be parsed locally in the browser.

Do not use:

* Firecrawl hosted APIs
* external document parsing services
* external CDNs at runtime
* Python or Node parsing sidecars
* LibreOffice server processes

The feature must work on an isolated LAN without Internet access.

## Scope

Prefer WebUI-only changes.

Do not modify llama.cpp model loading, inference, sampling, or other unrelated C++ code.

Avoid modifying llama-server C++ unless it is genuinely necessary for serving the final WebUI/WASM assets.

If a C++ change appears necessary, first investigate whether the problem can be solved in the frontend or build pipeline.

## Attachment compatibility

Do not regress existing handling for:

* PDF
* plain text and Markdown
* source files
* images
* audio
* video
* multimodal attachments

In particular, preserve the existing PDF processing path rather than routing PDFs through AnyDoc.

## Office parsing

Office files should be converted into meaningful Markdown/text and then reuse the existing text attachment mechanism.

Do not fall back to treating an Office binary file as UTF-8 text when parsing fails.

Parsing failures should produce a clear user-visible error.

Preserve the original filename in attachment metadata.

Avoid parsing the same document multiple times if extracted text is already available.

## WASM

AnyDoc WASM should be initialized lazily and reused.

Pay special attention to the production build.

Do not assume that functionality under the Vite development server proves that the production llama-server WebUI works.

Verify that all required JavaScript and WASM assets are included and available when the WebUI is served by `llama-server`.

The final application must not require Internet access to load AnyDoc.

## Large documents

Avoid unnecessary copies of large document buffers.

Use transferable ArrayBuffers with a Web Worker if a worker is used.

Do not implement RAG, vector databases, embeddings, or document indexing as part of this feature.

This feature is limited to Office document extraction into the normal chat context.

## Testing

For WebUI changes, run the existing relevant:

* formatter
* type checks
* lint checks
* unit tests
* production WebUI build

Also verify representative uploads for:

* `.docx`
* `.pptx`
* `.xlsx`
* `.txt`
* `.pdf`
* an image

Verify that corrupted or unsupported Office documents fail gracefully.

Most importantly, verify the actual production WebUI path used by `llama-server`, including WASM loading.

## Maintainability

Keep AnyDoc-specific functionality isolated in small utility modules where practical.

Prefer small dispatch changes to rewriting the attachment subsystem.

The resulting patch should remain easy to rebase onto future llama.cpp releases.
