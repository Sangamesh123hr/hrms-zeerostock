'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, KeyRound, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRequestOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()

      if (!response.ok) {
        toast.error('Invalid credentials. Check your email and password.')
        return
      }

      toast.success(data.message || 'Verification code sent. Check your inbox or terminal.')
      setStep(2)
    } catch {
      toast.error('Unable to request a verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await signIn('credentials', {
        email,
        otp,
        redirect: false,
      })

      if (response?.error) {
        toast.error(response.error === 'CredentialsSignin' ? 'Invalid or expired OTP.' : response.error)
        return
      }

      toast.success('Successfully logged in!')

      const sessionResponse = await fetch('/api/auth/session')
      const session = await sessionResponse.json()

      if (session?.user?.role === 'HR') {
        router.push('/hr/dashboard')
      } else {
        router.push('/employee/dashboard')
      }
    } catch {
      toast.error('Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemoUser = (role: 'HR' | 'EMPLOYEE') => {
    if (role === 'HR') {
      setEmail('hr@zeerostock.com')
    } else {
      setEmail('employee@zeerostock.com')
    }
    setPassword('Password123!')
  }

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="relative z-10 flex w-full flex-col justify-between p-8 sm:p-12 lg:w-1/2 lg:p-16">
        <div className="flex items-center space-x-3">
          <div className="rounded-2xl bg-blue-600 p-2.5 text-white shadow-lg shadow-blue-500/20 ring-1 ring-blue-400/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-wide text-white">Zeerostock</span>
        </div>

        <div className="mx-auto my-auto w-full max-w-md py-8">
          <div className="mb-8 space-y-2">
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-400"><Sparkles className="h-3.5 w-3.5" /> Welcome back</p>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Sign In to HRMS</h1>
            <p className="text-sm text-slate-400">{step === 1 ? 'Enter your credentials to receive a verification code.' : 'Enter the six-digit code sent to your email.'}</p>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-6 space-y-2.5 rounded-2xl border border-slate-800 bg-slate-900/90 p-3.5 shadow-inner">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Quick Fill Demo Accounts:</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => fillDemoUser('HR')} className="flex-1 rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 transition hover:bg-purple-500/20">HR Admin</button>
                  <button type="button" onClick={() => fillDemoUser('EMPLOYEE')} className="flex-1 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20">Employee</button>
                </div>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-medium text-slate-300">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input id="email" type="email" required placeholder="name@zeerostock.com" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-xs font-medium text-slate-300">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <input id="password" type={showPassword ? 'text' : 'password'} required placeholder="Password123!" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                    <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:opacity-50">
                  <span>{loading ? 'Sending OTP...' : 'Continue with OTP'}</span>
                  {!loading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="otp" className="text-xs font-medium text-slate-300">Verification Code (OTP)</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                  <input id="otp" type="text" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-3 pl-11 pr-4 text-sm font-mono tracking-[0.35em] text-white outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="123456" />
                </div>
              </div>

              <button type="submit" disabled={loading} className="flex w-full items-center justify-center space-x-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500 disabled:opacity-50">
                <span>{loading ? 'Verifying...' : 'Verify OTP & Log In'}</span>
                {!loading && <CheckCircle2 className="h-4 w-4" />}
              </button>

              <button type="button" onClick={() => { setStep(1); setOtp('') }} className="w-full text-center text-xs text-slate-400 transition hover:text-white">
                Back to password
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 lg:text-left">Copyright 2026 Zeerostock Inc. All rights reserved.</p>
      </div>

      <div className="hidden w-1/2 p-6 lg:flex">
        <div className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900 p-12 text-white shadow-2xl">
          <div className="pointer-events-none absolute -right-20 top-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl" />
          <div className="relative z-10"><span className="rounded-full border border-slate-700/50 bg-slate-800/80 px-3.5 py-1.5 text-xs font-semibold tracking-wider text-slate-300">ENTERPRISE HR SUITE</span></div>
          <div className="relative z-10 max-w-lg space-y-4">
            <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-white">Automated Attendance &amp; Leave Workflows.</h2>
            <p className="text-sm font-normal leading-relaxed text-slate-400">Real-time check-in logs, instant status approvals, and department CSV exports built into one central workspace.</p>
          </div>
        </div>
      </div>
    </div>
  )
}