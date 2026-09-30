const LOG_LINE_LIMIT = 2048;

function createDiagnosticRedactor() {
  const secrets = new Set();
  return {
    registerEnvironment(environment) {
      for (const [name, value] of Object.entries(environment)) {
        if (/secret|password|token|api.?key|authorization|cookie|private.?key/i.test(name) && typeof value === "string" && value.length >= 4) {
          secrets.add(value);
          for (const line of value.split(/\r?\n/)) {
            if (line.length >= 12) secrets.add(line);
          }
        }
      }
    },
    redact(value) {
      let text = String(value ?? "");
      for (const secret of secrets) text = text.split(secret).join("[redacted]");
      text = text
        .replace(/-----BEGIN[\s\S]*?PRIVATE KEY-----[\s\S]*?-----END[\s\S]*?PRIVATE KEY-----/g, "[redacted private key]")
        .replace(/\bBearer\s+[^\s,;"']+/gi, "Bearer [redacted]")
        .replace(/\b((?:set-)?cookie|authorization)\s*:\s*[^\r\n]+/gi, "$1: [redacted]")
        .replace(/(["']?[\w-]*(?:secret|password|token|api[_-]?key|client[_-]?secret)[\w-]*["']?\s*[:=]\s*)[^\s,;&]+/gi, "$1[redacted]")
        .replace(/(https?:\/\/)[^\s/@]+:[^\s/@]+@/gi, "$1[redacted]@")
        .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted token]")
        .replace(/\b(?:sk|pk)_(?:live|test)_[A-Za-z0-9]+\b/g, "[redacted key]")
        .replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, "[redacted key]");
      return text.slice(0, LOG_LINE_LIMIT);
    },
  };
}

module.exports = { LOG_LINE_LIMIT, createDiagnosticRedactor };
