# Choosing an interpretation model

Open a chart's **Interpretation** tab and use **Ollama model for chart readings**.
The menu lists installed models from the server and labels its configured default.
The choice is saved in the browser and applies to full chart readings and individual
section regeneration. Other AI features continue using the server default.
**Last response used** shows the model reported by the latest generation in the
current chart view; it does not identify the model behind previously saved readings.

## Deployment

Deploy the accompanying `api-chatterbox` changes before the astrology frontend.
The frontend continues using `VITE_API_BASE_URL` and `VITE_PUBLIC_API_KEY`.
The backend uses `OLLAMA_URL` (default `http://localhost:11434`) and
`OLLAMA_MODEL` (default `llama3.2:3b`). The server environment may override these defaults.

The updated backend provides authenticated `GET /public/models` and accepts an
optional `model` on `POST /public/chat`. It validates explicit choices against
Ollama's installed model list and returns the model used alongside the content.
Requests without a model retain the existing default behavior. Ollama itself does
not need to be exposed directly to browsers.

If the menu cannot load, use **Refresh models**. A missing backend update is shown
explicitly; **Server default** remains available. If a saved model has been removed,
select another installed model or the server default.

Validation commands:

- Astrology frontend: `node scripts/test-llm.mjs` and `npm run build`
- Chatterbox backend: `node scripts/test-public-chat.cjs` and `npx tsc --noEmit`

Protocol references: [Ollama model listing](https://docs.ollama.com/api/tags) and
[chat generation](https://docs.ollama.com/api/chat).
