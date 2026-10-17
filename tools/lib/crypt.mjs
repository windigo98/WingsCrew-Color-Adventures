/** Light obfuscation for paid pack files. This is not a secret and not real DRM. */

export function obfuscate(text, key) {
  const data = Buffer.from(text, "utf8");
  const k = Buffer.from(key, "utf8");
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ k[i % k.length] ^ ((i * 13 + 7) & 255);
  return out.toString("base64");
}

export function deobfuscate(b64, key) {
  const data = Buffer.from(b64, "base64");
  const k = Buffer.from(key, "utf8");
  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i++) out[i] = data[i] ^ k[i % k.length] ^ ((i * 13 + 7) & 255);
  return out.toString("utf8");
}
