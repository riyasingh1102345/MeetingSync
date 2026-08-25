import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, Video, ArrowRight, Check, Sparkles, Clock, Users } from 'lucide-react';

const C = {
  blue: '#2563EB',
  blueHover: '#1D4ED8',
  blueLight: '#EFF6FF',
  blueBorder: '#DBEAFE',
  blueDark: '#1E40AF',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  border: '#E2E8F0',
  bg: '#FFFFFF',
  bgWarm: '#F8FAFC',
  success: '#10B981',
  successLight: '#ECFDF5',
  purple: '#8B5CF6',
  purpleLight: '#F5F3FF',
};

const font = "'Plus Jakarta Sans', sans-serif";

const features = [
  { icon: <Clock size={16} />, color: C.blue, bg: C.blueLight, text: 'AI-generated timestamps for every key moment' },
  { icon: <Sparkles size={16} />, color: C.success, bg: C.successLight, text: 'Smart summaries delivered in seconds' },
  { icon: <Users size={16} />, color: C.purple, bg: C.purpleLight, text: 'Share insights with your entire team instantly' },
];

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPw, setShowPw] = useState(false);
  const [isSignUp, setIsSignUp] = useState(location.state?.isSignUp || false);
  const [emailFocus, setEmailFocus] = useState(false);
  const [pwFocus, setPwFocus] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);
  const [btnHover, setBtnHover] = useState(false);
  const [googleHover, setGoogleHover] = useState(false);

  // Auth specific state
  const { login, signup, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        await signup(email, password);
        // Note: we could update the user's display name here, but keeping it simple for now
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to authenticate');
    }
    setLoading(false);
  }

  async function handleGoogleLogin() {
    try {
      setError('');
      setLoading(true);
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to authenticate with Google');
    }
    setLoading(false);
  }

  const inputStyle = (focused) => ({
    width: '100%',
    padding: '12px 16px 12px 44px',
    fontSize: 14.5,
    fontFamily: font,
    color: C.textPrimary,
    background: focused ? '#fff' : C.bgWarm,
    border: `1.5px solid ${focused ? C.blue : C.border}`,
    borderRadius: 10,
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box',
    boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
  });

  return (
    <div style={{ fontFamily: font, display: 'flex', minHeight: '100vh', background: C.bg }}>

      {/* ─── LEFT PANEL ─────────────────────────────── */}
      <div style={{
        width: '48%',
        background: 'linear-gradient(145deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '48px 56px',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
      }}>
        {/* Background glow blobs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={20} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, color: 'white', letterSpacing: '-0.02em' }}>MeetLens AI</span>
        </div>

        {/* Main content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 99, padding: '5px 14px', marginBottom: 28 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34D399' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>10,000+ professionals onboard</span>
          </div>

          <h2 style={{ fontSize: 38, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 20 }}>
            Never miss a<br />meeting detail<br />
            <span style={{ background: 'linear-gradient(90deg, #60A5FA, #A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>again.</span>
          </h2>

          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 36, maxWidth: 340 }}>
            MeetLens AI transforms your meeting recordings into searchable, AI-powered insights.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                  {f.icon}
                </div>
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500 }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── RIGHT PANEL ─────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', background: C.bg, overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          {/* Top link */}
          <div style={{ textAlign: 'right', marginBottom: 32 }}>
            <span style={{ fontSize: 13.5, color: C.textSecondary }}>
              {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
              <button onClick={() => setIsSignUp(!isSignUp)} style={{ color: C.blue, fontWeight: 700, fontSize: 13.5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </span>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.02em', marginBottom: 8 }}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p style={{ fontSize: 14.5, color: C.textSecondary, lineHeight: 1.5 }}>
              {isSignUp ? 'Start your 14-day free trial, no credit card required.' : 'Sign in to continue to your MeetLens AI account.'}
            </p>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            onMouseEnter={() => setGoogleHover(true)}
            onMouseLeave={() => setGoogleHover(false)}
            style={{
              width: '100%', padding: '12px 20px', borderRadius: 10, border: `1.5px solid ${googleHover ? '#CBD5E1' : C.border}`,
              background: googleHover ? C.bgWarm : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, fontSize: 14.5, fontWeight: 600, color: C.textPrimary, cursor: 'pointer', marginBottom: 20,
              transition: 'all 0.2s', fontFamily: font, boxShadow: googleHover ? '0 2px 8px rgba(0,0,0,0.06)' : 'none'
            }}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width={18} height={18} alt="Google" />
            Continue with Google
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: C.border }} />
            <span style={{ fontSize: 12.5, color: '#94A3B8', fontWeight: 500 }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: C.border }} />
          </div>

          {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13.5, marginBottom: 20, fontWeight: 500 }}>{error}</div>}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Name field (sign up only) */}
              {isSignUp && (
                <div>
                  <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: nameFocus ? C.blue : '#94A3B8', transition: 'color 0.2s' }} />
                    <input
                      type="text"
                      placeholder="John Smith"
                      required={isSignUp}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={inputStyle(nameFocus)}
                      onFocus={() => setNameFocus(true)}
                      onBlur={() => setNameFocus(false)}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: 13.5, fontWeight: 600, color: C.textPrimary, marginBottom: 6 }}>Email address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: emailFocus ? C.blue : '#94A3B8', transition: 'color 0.2s' }} />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={inputStyle(emailFocus)}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: 13.5, fontWeight: 600, color: C.textPrimary }}>Password</label>
                  {!isSignUp && <a href="#" style={{ fontSize: 12.5, color: C.blue, fontWeight: 600, textDecoration: 'none' }}>Forgot password?</a>}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: pwFocus ? C.blue : '#94A3B8', transition: 'color 0.2s' }} />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{ ...inputStyle(pwFocus), paddingRight: 44 }}
                    onFocus={() => setPwFocus(true)}
                    onBlur={() => setPwFocus(false)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                onMouseEnter={() => setBtnHover(true)}
                onMouseLeave={() => setBtnHover(false)}
                style={{
                  width: '100%', padding: '13px 24px', borderRadius: 10, border: 'none',
                  background: btnHover ? C.blueHover : C.blue,
                  color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  fontFamily: font, transition: 'all 0.2s',
                  boxShadow: btnHover ? '0 6px 20px rgba(37,99,235,0.4)' : '0 4px 12px rgba(37,99,235,0.25)',
                  transform: btnHover ? 'translateY(-1px)' : 'none',
                  marginTop: 4
                }}
              >
                {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={16} />
              </button>
            </div>
          </form>

          {/* Trust badges */}
          {isSignUp && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['No credit card required', 'Free 14-day trial', 'Cancel anytime'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.successLight, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Check size={11} strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: 13, color: C.textSecondary, fontWeight: 500 }}>{t}</span>
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <p style={{ marginTop: 32, fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 1.6 }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: C.textSecondary, textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
            {' '}and{' '}
            <a href="#" style={{ color: C.textSecondary, textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
          </p>
        </div>
      </div>

    </div>
  );
}
