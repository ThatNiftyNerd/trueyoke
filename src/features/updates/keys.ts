/**
 * PUBLIC verification key — NOT a secret.
 *
 * This is the public half of the release-manifest signing pair. It is safe to
 * ship in the client bundle by definition: it can only VERIFY signatures, never
 * produce them. The matching PRIVATE key exists only as the backend secret
 * `RELEASE_SIGNING_PRIVATE_KEY_B64`, readable solely by the
 * `publish-release-manifest` edge function. Never place a private key here.
 */
export const RELEASE_SIGNING_PUBKEY_ID = "trueyoke-release-v1";

/** SPKI (PEM) RSA-2048 public key, used with RSA-PSS / SHA-256, saltLength 32. */
export const RELEASE_SIGNING_PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAoFtGgJ73JA/O0yVRK8iZ
LzCy2BavVbCe7opFNu6nYsx4/1f0S4x4yDZUTbmp1+2RH8V8NO8K6TvZeJUQu1EU
MXeIjXvoWpKM4XUofCQhzMxBzdH8XN5R991evDiDpwAvk51RD55w8w5zhv047DDY
OAH44Yibnq17v1q2bltLIxtRZ3KxYAfktgAIrkmrol0AYWKLm8xMB+FrO3OOMtyH
ChggB0jeWtrvx7Zj4xhjxP+yNtKHUCga5xqLut0OoCWTJYEE4U8Rc+VzhzJmClGV
qwMlPUWKp21WpHLUvTh6Pww8hIBsxYGwmWHNwfYCzNjz7Gtd1Mv8ZSzl+OeCpneL
nwIDAQAB
-----END PUBLIC KEY-----`;

/** Where a stale build is told to go. Metadata link only — no code fetching. */
export const RELEASE_DOWNLOAD_URL = "https://trueyoke.app/download";
