import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePageMeta } from "@/lib/seo";

export default function AdminLogin() {
  const { login, admin } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  usePageMeta({ title: "Staff Login | TrueCore Technologies", noindex: true });

  useEffect(() => {
    if (admin) navigate("/admin", { replace: true });
  }, [admin, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login(identifier.trim(), password);
    setLoading(false);
    if (result.ok) navigate("/admin", { replace: true });
    else setError(result.error);
  };

  return (
    <div className="tc-grid-bg flex min-h-screen items-center justify-center bg-white p-5">
      <div className="w-full max-w-md border border-[#8A8F96]/30 bg-white p-8 shadow-sm">
        <Link to="/" className="tc-eyebrow">← Back to website</Link>
        <p className="mt-6 text-[15px] font-extrabold tracking-tight text-[#003B7A]">
          TRUECORE<span className="text-[#10A6D8]">.</span> ADMIN
        </p>
        <h1 className="mt-4 text-2xl font-bold">Staff sign in</h1>
        <span className="tc-rule mt-4" />
        <p className="mt-5 text-[14px] text-[#3F434A]">
          Authorised personnel only. There is no public registration.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-5" data-testid="admin-login-form">
          {error && (
            <div className="flex items-start gap-3 border-l-2 border-[#DC2626] bg-[#DC2626]/5 p-3" role="alert" data-testid="login-error">
              <AlertCircle size={17} className="mt-0.5 text-[#DC2626]" aria-hidden="true" />
              <p className="text-[14px] text-[#3F434A]">{error}</p>
            </div>
          )}
          <div>
            <label htmlFor="login-identifier" className="tc-label">Username or email</label>
            <input id="login-identifier" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              className="tc-input" autoComplete="username" data-testid="login-identifier-input" />
          </div>
          <div>
            <label htmlFor="login-password" className="tc-label">Password</label>
            <input id="login-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              className="tc-input" autoComplete="current-password" data-testid="login-password-input" />
          </div>
          <button type="submit" className="tc-btn-primary w-full" disabled={loading} data-testid="login-submit-button">
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
            {loading ? "Signing in" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
