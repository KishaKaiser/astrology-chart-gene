# Ollama on the astrology home server

The browser calls `/api/ollama/models` and `/api/ollama/chat` on the astrology
site. Its Node server connects directly to the configured Ollama instance using
[the installed models API](https://docs.ollama.com/api/tags) and
[the chat API](https://docs.ollama.com/api/chat).

## LinkHosting setup

Set these **runtime environment variables on `site-astrology`** and redeploy it:

```
OLLAMA_BASE_URL=http://192.168.4.32:11434
OLLAMA_MODEL=gemma3:1b
```

Use the address reachable from the astrology container. A loopback address in
that container refers to the container itself. `OLLAMA_URL` is also accepted
when `OLLAMA_BASE_URL` is unset. For a local Node server on the same machine as
Ollama, the default Ollama address is `http://127.0.0.1:11434`.

`OLLAMA_MODEL` selects the default for requests without an explicit model. Set
it to an installed tag, for example `qwen2.5:7b` to use that model by default.
The fallback is `gemma3:1b`. On features with the model selector, an explicit
browser choice overrides the default. The last-used label reports the actual
model returned by Ollama. Outputs that hit the generation limit retry once and
unfinished text is rejected.

After redeploying, open **Interpretation → Refresh models**. To check the direct
connection from the running container:

```
sudo docker exec site-astrology node -e 'fetch("http://127.0.0.1:4173/api/ollama/models").then(async r => console.log(r.status, await r.text()))'
```

The astrology AI routes require no Chatterbox API key. Development uses the
same Node server with the Vite proxy. Run `npm run dev:library` alongside Vite.
