import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function LoginPage() {
  const navigate = useNavigate(); // ✅ Add navigate
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  function isValidEmail(value: string) {
    return /.+@.+\..+/.test(value);
  }

  function validateEmail(value: string) {
    if (!value) return "Email is required";
    if (!isValidEmail(value)) return "Enter a valid email address";
    return null;
  }

  function validatePassword(value: string) {
    if (!value) return "Password is required";
    if (value.length < 8) return "Minimum 8 characters";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    setEmailError(eErr);
    setPasswordError(pErr);
    if (eErr || pErr) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // Simulate login
    setLoading(false);

    // ✅ After successful login, navigate to /app
    navigate("/app");
  }

  return (
    <div className="min-h-full grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 text-white grid place-items-center text-xl font-bold shadow-lg">
              U
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                onBlur={() => setEmailError(validateEmail(email))}
                className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${
                  emailError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
                placeholder="you@example.com"
                required
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="password"
              >
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                onBlur={() => setPasswordError(validatePassword(password))}
                className={`w-full rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${
                  passwordError
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300"
                }`}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-sm text-gray-500 mt-1"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
              {passwordError && (
                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 text-white py-2.5 font-medium hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            <div className="flex items-center justify-between text-sm">
              <Link to="/signup" className="text-indigo-600 hover:underline">
                Create an account
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
