/**
 * Gera um UUID v4 (RFC 4122) compatível com o Zod .uuid().
 *
 * No React Native / Hermes (especialmente no Expo Go), o objeto global `crypto`
 * (Web Crypto API / crypto.randomUUID) não existe nativamente no runtime.
 * Esta função gera o UUID v4 matematicamente sem depender de crypto nativo.
 */
export function gerarUuidV4(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

