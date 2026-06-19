import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAuthContext } from "../providers/AuthProvider";

export default function Login() {
  const { isAuthenticated, isLoading, login, loginError, isLoggingIn } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLocal, setShowLocal] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page-bg">
        <div className="animate-spin h-8 w-8 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login({ email, password });
  }

  return (
    <div className="min-h-screen bg-page-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card-bg border border-border rounded-lg shadow-sm p-8">
          <h1 className="font-serif text-xl font-bold text-text mb-1">知识平台</h1>
          <p className="text-sm text-text-muted mb-6">企业知识共享中心</p>

          {!showLocal ? (
            <div className="text-center">
              <a href="/api/auth/login" className="btn btn-primary w-full justify-center py-3 text-base">
                统一身份认证登录
              </a>
              <p className="text-xs text-text-muted mt-4">使用企业统一账号登录</p>
              <button
                type="button"
                onClick={() => setShowLocal(true)}
                className="text-xs text-accent hover:underline mt-3"
              >
                使用本地账号登录
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">邮箱</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg outline-none focus:border-accent"
                    placeholder="admin@company.com" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">密码</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-page-bg outline-none focus:border-accent"
                    placeholder="********" required />
                </div>
                {loginError && (
                  <p className="text-sm text-danger bg-danger-light px-3 py-2 rounded-md">{loginError}</p>
                )}
                <button type="submit" disabled={isLoggingIn}
                  className="w-full py-2.5 bg-accent text-white rounded-lg font-medium text-sm hover:bg-accent-hover disabled:opacity-50">
                  {isLoggingIn ? "登录中…" : "登录"}
                </button>
              </form>
              <button type="button" onClick={() => setShowLocal(false)}
                className="text-xs text-accent hover:underline mt-3 block text-center w-full">
                返回统一登录
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
