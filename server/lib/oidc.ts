import { Issuer, generators } from "openid-client";

let _client: any = null;

// OIDC 客户端（懒加载）
export async function getClient() {
  if (_client) return _client;

  const issuer = await Issuer.discover(process.env.MAXKEY_ISSUER!);
  _client = new issuer.Client({
    client_id: process.env.MAXKEY_CLIENT_ID!,
    client_secret: process.env.MAXKEY_CLIENT_SECRET!,
    redirect_uris: [process.env.MAXKEY_REDIRECT_URI!],
    response_types: ["code"],
  });

  return _client;
}

// 生成 MaxKey 登录 URL
export async function buildLoginUrl() {
  const client = await getClient();
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  const state = generators.state();
  const nonce = generators.nonce();

  const url = client.authorizationUrl({
    scope: "openid profile email",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state,
    nonce,
  });

  return { url, codeVerifier, state, nonce };
}

// 用授权码换 token，并验证 id_token
export async function handleCallback(
  code: string,
  codeVerifier: string,
  nonce: string,
) {
  const client = await getClient();
  const params = client.callbackParams(`?code=${code}`);
  const tokenSet = await client.callback(
    process.env.MAXKEY_REDIRECT_URI!,
    params,
    { code_verifier: codeVerifier, nonce },
  );

  const userInfo = await client.userinfo(tokenSet.access_token!);
  return {
    externalId: userInfo.sub as string,
    name: (userInfo.name as string) ?? (userInfo.preferred_username as string) ?? "未知用户",
    email: (userInfo.email as string) ?? "",
    department: (userInfo.department as string) ?? null,
  };
}
