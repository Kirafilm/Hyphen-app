import { createRemoteJWKSet, jwtVerify } from "jose";

type SupabaseUser = {
  id: string;
  email: string | null;
  name: string | null;
  loginMethod: "email";
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let issuer: string | null = null;

export async function verifySupabaseAccessToken(
  token: string,
  opts: { supabaseUrl: string },
): Promise<SupabaseUser> {
  const base = opts.supabaseUrl.replace(/\/+$/, "");
  const nextIssuer = `${base}/auth/v1`;

  if (!jwks || issuer !== nextIssuer) {
    jwks = createRemoteJWKSet(new URL(`${nextIssuer}/.well-known/jwks.json`));
    issuer = nextIssuer;
  }

  const { payload } = await jwtVerify(token, jwks, {
    issuer: nextIssuer,
    audience: "authenticated",
  });

  const sub = typeof payload.sub === "string" ? payload.sub : null;
  if (!sub) throw new Error("Supabase token missing sub");

  const email = typeof (payload as any).email === "string" ? ((payload as any).email as string) : null;
  const userMetadata = (payload as any).user_metadata as any;
  const name =
    userMetadata && typeof userMetadata.name === "string"
      ? (userMetadata.name as string)
      : email
        ? email.split("@")[0]
        : null;

  return { id: sub, email, name, loginMethod: "email" };
}
