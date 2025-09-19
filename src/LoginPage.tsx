import { useState } from 'react'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function isValidEmail(value: string) {
    return /.+@.+\..+/.test(value)
  }

  function validateEmail(value: string) {
    if (!value) return 'Email is required'
    if (!isValidEmail(value)) return 'Enter a valid email address'
    return null
  }

  function validatePassword(value: string) {
    if (!value) return 'Password is required'
    if (value.length < 8) return 'Minimum 8 characters'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const eErr = validateEmail(email)
    const pErr = validatePassword(password)
    setEmailError(eErr)
    setPasswordError(pErr)
    if (eErr || pErr) return
    setLoading(true)
    // Simulate login
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    alert('Logged in!')
  }

  return (
    <div className="min-h-full grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" />
      <div className="flex items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-xl bg-indigo-600 text-white grid place-items-center text-xl font-bold shadow-lg">U</div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M1.5 8.67v6.58A3.75 3.75 0 0 0 5.25 19h13.5A3.75 3.75 0 0 0 22.5 15.25V8.67l-8.84 5.03a3.75 3.75 0 0 1-3.32 0L1.5 8.67Z"/><path d="M22.5 6.75v-.5A3.75 3.75 0 0 0 18.75 2.5H5.25A3.75 3.75 0 0 0 1.5 6.25v.5l9.18 5.22a2.25 2.25 0 0 0 2.04 0L22.5 6.75Z"/></svg>
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (emailError) setEmailError(null)
                  }}
                  onBlur={() => setEmailError(validateEmail(email))}
                  className={`w-full rounded-lg border bg-white dark:bg-gray-900 pl-10 pr-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  required
                />
              </div>
              {emailError && (
                <p id="email-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{emailError}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 grid w-10 place-items-center text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5"><path d="M16.5 10.5V7.875a4.875 4.875 0 1 0-9.75 0V10.5"/><path d="M5.25 10.5A2.25 2.25 0 0 0 3 12.75v6A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75v-6a2.25 2.25 0 0 0-2.25-2.25H5.25Z"/></svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (passwordError) setPasswordError(null)
                  }}
                  onBlur={() => setPasswordError(validatePassword(password))}
                  className={`w-full rounded-lg border bg-white dark:bg-gray-900 pl-10 pr-10 py-2 outline-none focus:ring-2 focus:ring-indigo-500 ${passwordError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-700'}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  aria-invalid={passwordError ? 'true' : 'false'}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute inset-y-0 right-0 px-3 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="mt-1 text-xs text-red-600 dark:text-red-400">{passwordError}</p>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 text-white py-2.5 font-medium hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed shadow"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="flex items-center justify-between text-sm">
              <a href="#" className="text-indigo-600 hover:underline">Forgot password?</a>
              <span className="text-gray-500 dark:text-gray-400">
                No account?{' '}
                <a href="#" className="text-indigo-600 hover:underline">Create one</a>
              </span>
            </div>

            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              By continuing you agree to our <a href="#" className="text-indigo-600 hover:underline">Terms</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy</a>.
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}


