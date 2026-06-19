import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── 使用 vi.hoisted 确保 mock 对象在 vi.mock 提升时已可用 ──
const {
  mockAuthorizationUrl,
  mockCallbackParams,
  mockClientCallback,
  mockUserinfo,
} = vi.hoisted(() => ({
  mockAuthorizationUrl: vi.fn(),
  mockCallbackParams: vi.fn(),
  mockClientCallback: vi.fn(),
  mockUserinfo: vi.fn(),
}));

vi.mock("openid-client", () => {
  // 构造一个可被 new 调用的 mock 构造函数
  const MockClient = function (this: any) {
    this.authorizationUrl = mockAuthorizationUrl;
    this.callbackParams = mockCallbackParams;
    this.callback = mockClientCallback;
    this.userinfo = mockUserinfo;
  } as any;

  return {
    Issuer: {
      discover: vi.fn().mockResolvedValue({ Client: MockClient }),
    },
    generators: {
      codeVerifier: vi.fn(() => "mock-code-verifier"),
      codeChallenge: vi.fn(() => "mock-code-challenge"),
      state: vi.fn(() => "mock-state"),
      nonce: vi.fn(() => "mock-nonce"),
    },
  };
});

// ── 设置环境变量 ──
beforeEach(() => {
  process.env.MAXKEY_ISSUER = "https://maxkey.example.com";
  process.env.MAXKEY_CLIENT_ID = "test-client";
  process.env.MAXKEY_CLIENT_SECRET = "test-secret";
  process.env.MAXKEY_REDIRECT_URI = "http://localhost:3002/api/auth/callback";

  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// 动态导入被测模块（必须在 mock 之后导入）
import { getClient, buildLoginUrl, handleCallback } from "../lib/oidc";

// ============================================================================
// getClient
// ============================================================================

describe("oidc: getClient", () => {
  it("returns a client object on first call", async () => {
    const client = await getClient();
    expect(client).toBeDefined();
    expect(client).toHaveProperty("authorizationUrl");
  });

  it("caches the client and returns the same instance on second call", async () => {
    const client1 = await getClient();
    const client2 = await getClient();
    expect(client1).toBe(client2);
  });
});

// ============================================================================
// buildLoginUrl
// ============================================================================

describe("oidc: buildLoginUrl", () => {
  it("generates a login URL with PKCE parameters", async () => {
    mockAuthorizationUrl.mockReturnValue("https://maxkey.example.com/auth?code_challenge=mock-code-challenge");

    const result = await buildLoginUrl();

    expect(result.url).toContain("maxkey.example.com");
    expect(result.codeVerifier).toBe("mock-code-verifier");
    expect(result.state).toBe("mock-state");
    expect(result.nonce).toBe("mock-nonce");
  });

  it("calls authorizationUrl with correct scope", async () => {
    await buildLoginUrl();

    expect(mockAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({ scope: "openid profile email" })
    );
  });

  it("includes code_challenge and code_challenge_method", async () => {
    await buildLoginUrl();

    expect(mockAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        code_challenge: "mock-code-challenge",
        code_challenge_method: "S256",
      })
    );
  });

  it("includes state and nonce", async () => {
    await buildLoginUrl();

    expect(mockAuthorizationUrl).toHaveBeenCalledWith(
      expect.objectContaining({ state: "mock-state", nonce: "mock-nonce" })
    );
  });

  it("returns all PKCE artifacts", async () => {
    const result = await buildLoginUrl();
    expect(result).toHaveProperty("url");
    expect(result).toHaveProperty("codeVerifier");
    expect(result).toHaveProperty("state");
    expect(result).toHaveProperty("nonce");
  });
});

// ============================================================================
// handleCallback
// ============================================================================

describe("oidc: handleCallback", () => {
  beforeEach(() => {
    mockCallbackParams.mockReturnValue({ code: "auth-code" });
    mockClientCallback.mockResolvedValue({ access_token: "access-token-xyz" });
  });

  it("calls callbackParams with the authorization code", async () => {
    mockUserinfo.mockResolvedValue({
      sub: "user-sub-123", name: "张三", email: "zhangsan@example.com", department: "技术部",
    });

    await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(mockCallbackParams).toHaveBeenCalledWith("?code=auth-code");
  });

  it("exchanges code for tokens using code_verifier and nonce", async () => {
    mockUserinfo.mockResolvedValue({ sub: "user-sub-123", name: "张三", email: "zs@x.com" });

    await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(mockClientCallback).toHaveBeenCalledWith(
      "http://localhost:3002/api/auth/callback",
      { code: "auth-code" },
      { code_verifier: "mock-code-verifier", nonce: "mock-nonce" }
    );
  });

  it("fetches userinfo with the access token", async () => {
    mockUserinfo.mockResolvedValue({ sub: "user-sub-123", name: "张三", email: "zs@x.com" });

    await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(mockUserinfo).toHaveBeenCalledWith("access-token-xyz");
  });

  it("maps userinfo.sub to externalId", async () => {
    mockUserinfo.mockResolvedValue({ sub: "maxkey-user-456", name: "李四", email: "lisi@x.com" });

    const result = await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(result.externalId).toBe("maxkey-user-456");
  });

  it("maps userinfo.name to name", async () => {
    mockUserinfo.mockResolvedValue({ sub: "u1", name: "王五", email: "ww@x.com" });

    const result = await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(result.name).toBe("王五");
  });

  it("maps userinfo.email to email", async () => {
    mockUserinfo.mockResolvedValue({ sub: "u1", name: "赵六", email: "zl@x.com" });

    const result = await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(result.email).toBe("zl@x.com");
  });

  it("falls back to preferred_username when name is missing", async () => {
    mockUserinfo.mockResolvedValue({ sub: "u1", preferred_username: "user_one", email: "u1@x.com" });

    const result = await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(result.name).toBe("user_one");
  });

  it("falls back to '未知用户' when both name and preferred_username are missing", async () => {
    mockUserinfo.mockResolvedValue({ sub: "u1", email: "u1@x.com" });

    const result = await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(result.name).toBe("未知用户");
  });

  it("returns empty string email when userinfo has no email", async () => {
    mockUserinfo.mockResolvedValue({ sub: "u1", name: "测试用户" });

    const result = await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(result.email).toBe("");
  });

  it("maps userinfo.department to department field", async () => {
    mockUserinfo.mockResolvedValue({ sub: "u1", name: "钱七", email: "qq@x.com", department: "财务部" });

    const result = await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(result.department).toBe("财务部");
  });

  it("returns null department when userinfo has no department", async () => {
    mockUserinfo.mockResolvedValue({ sub: "u1", name: "孙八", email: "sb@x.com" });

    const result = await handleCallback("auth-code", "mock-code-verifier", "mock-nonce");
    expect(result.department).toBeNull();
  });
});
