import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);

  const navigate = useNavigate();

  function isValidEmail(value: string) {
    return /.+@.+\..+/.test(value);
  }

  function validateName(value: string) {
    if (!value) return "Name is required";
    if (value.length < 2) return "Name is too short";
    return null;
  }

  function validateEmail(value: string) {
    if (!value) return "Email is required";
    if (!isValidEmail(value)) return "Enter a valid email";
    return null;
  }

  function validatePassword(value: string) {
    if (!value) return "Password is required";
    if (value.length < 8) return "Minimum 8 characters";
    return null;
  }

  function validateConfirmPassword(value: string) {
    if (!value) return "Confirm your password";
    if (value !== password) return "Passwords do not match";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const nErr = validateName(name);
    const eErr = validateEmail(email);
    const pErr = validatePassword(password);
    const cpErr = validateConfirmPassword(confirmPassword);

    setNameError(nErr);
    setEmailError(eErr);
    setPasswordError(pErr);
    setConfirmPasswordError(cpErr);

    if (nErr || eErr || pErr || cpErr) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    // After signup, navigate to user info page
    navigate("/user-info", { state: { userId: email } });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <h1 className="text-2xl font-bold text-center mb-4">Sign Up</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
            }}
            onBlur={() => setNameError(validateName(name))}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              nameError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            required
          />
          {nameError && (
            <p className="text-red-500 text-xs mt-1">{nameError}</p>
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError(null);
            }}
            onBlur={() => setEmailError(validateEmail(email))}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              emailError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            required
          />
          {emailError && (
            <p className="text-red-500 text-xs mt-1">{emailError}</p>
          )}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError(null);
              }}
              onBlur={() => setPasswordError(validatePassword(password))}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                passwordError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300"
              }`}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
            {passwordError && (
              <p className="text-red-500 text-xs mt-1">{passwordError}</p>
            )}
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmPasswordError) setConfirmPasswordError(null);
            }}
            onBlur={() =>
              setConfirmPasswordError(validateConfirmPassword(confirmPassword))
            }
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              confirmPasswordError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300"
            }`}
            required
          />
          {confirmPasswordError && (
            <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Signing up…" : "Sign Up"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-300">
          Already have an account?{" "}
          <Link to="/" className="text-indigo-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
