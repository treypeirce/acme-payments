/**
 * Payment authorization signing.
 *
 * Every captured payment is bound to a cryptographic authorization token so
 * downstream settlement can verify the charge was minted by this service and
 * has not been tampered with. Tokens are RSA-signed over a canonical
 * representation of the payment.
 *
 * NOTE: this module lives on the settlement / money-movement path. Any change
 * here is treated as high-sensitivity by change control.
 */
import forge from "node-forge";

let keypair: forge.pki.rsa.KeyPair | null = null;

/** Lazily generate (and cache) the service signing key. */
function getKeyPair(): forge.pki.rsa.KeyPair {
  if (!keypair) {
    keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
  }
  return keypair;
}

/** Warm the signing key ahead of first traffic (used at bootstrap and in tests). */
export function warmSigningKey(): void {
  getKeyPair();
}

/** Canonical string that gets signed. Order matters and must be stable. */
export function canonicalize(input: {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
}): string {
  return [input.paymentId, input.orderId, input.amount, input.currency].join("|");
}

export function signPaymentAuthorization(canonical: string): string {
  const md = forge.md.sha256.create();
  md.update(canonical, "utf8");
  const signature = getKeyPair().privateKey.sign(md);
  return forge.util.encode64(signature);
}

export function verifyPaymentAuthorization(canonical: string, signatureB64: string): boolean {
  const md = forge.md.sha256.create();
  md.update(canonical, "utf8");
  const signature = forge.util.decode64(signatureB64);
  return getKeyPair().publicKey.verify(md.digest().bytes(), signature);
}
