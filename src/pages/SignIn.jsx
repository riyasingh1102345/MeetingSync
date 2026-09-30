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

const getFriendlyErrorMessage = (err) => {
  const code = err.code || err.message || '';
  if (code.includes('This email is already registered')) return err.message;
  if (code.includes('auth/email-already-in-use')) return 'An account with this email already exists. Please log in instead.';
  if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) return 'Invalid email or password.';
  if (code.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('auth/too-many-requests')) return 'Too many failed attempts. Please try again later.';
  if (code.includes('auth/popup-closed-by-user')) return 'Google sign-in was cancelled.';
  if (code.includes('auth/invalid-email')) return 'Please enter a valid email address.';
  return 'Failed to authenticate. Please try again.';
};

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
  const { login, signup, loginWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleResetPassword(e) {
    e.preventDefault();
    if (!email) {
      return setError('Please enter your email address first to reset password.');
    }
    
    try {
      setMessage('');
      setError('');
      setLoading(true);
      await resetPassword(email);
      setMessage('Check your inbox for further instructions.');
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    }
    setLoading(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        try {
          await signup(email, password);
        } catch (signupErr) {
          if (signupErr.code === 'auth/email-already-in-use') {
            try {
              // Try to seamlessly log them in if they already have an account
              await login(email, password);
            } catch (loginErr) {
              if (loginErr.code === 'auth/wrong-password' || loginErr.code === 'auth/invalid-credential') {
                throw new Error('This email is already registered. If you used Google to sign in before, please click "Continue with Google", or click "Sign In" to enter your password.');
              }
              throw loginErr;
            }
          } else {
            throw signupErr;
          }
        }
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
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
      setError(getFriendlyErrorMessage(err));
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
    <div style={{ fontFamily: font, display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden' }}>

      {/* ─── LEFT PANEL ─────────────────────────────── */}
      <div style={{
        width: '48%',
        background: 'linear-gradient(145deg, #0F172A 0%, #1E3A8A 60%, #1D4ED8 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 40,
        padding: '40px 56px',
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
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 40px', background: C.bg, overflow: 'hidden' }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>

          {/* Heading */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.02em', marginBottom: 8 }}>
              Welcome to MeetLens AI
            </h1>
            <p style={{ fontSize: 14.5, color: C.textSecondary, lineHeight: 1.6 }}>
              Sign in with your Google account to get started for free.
            </p>
          </div>

          {error && <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '10px 14px', borderRadius: 8, fontSize: 13.5, marginBottom: 20, fontWeight: 500, textAlign: 'left' }}>{error}</div>}

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            onMouseEnter={() => setGoogleHover(true)}
            onMouseLeave={() => setGoogleHover(false)}
            style={{
              width: '100%', padding: '14px 20px', borderRadius: 12, border: `1.5px solid ${googleHover ? '#CBD5E1' : C.border}`,
              background: googleHover ? C.bgWarm : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 12, fontSize: 15, fontWeight: 700, color: C.textPrimary, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 28,
              transition: 'all 0.2s', fontFamily: font, boxShadow: googleHover ? '0 4px 12px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
              opacity: loading ? 0.6 : 1
            }}
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" width={20} height={20} alt="Google" />
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* Trust badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
            {['100% Free to use', 'Unlimited AI meeting summaries', 'Instant transcriptions', 'No credit card required'].map(t => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 18, height: 18, borderRadius: '50%', background: C.successLight, color: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={11} strokeWidth={3} />
                </div>
                <span style={{ fontSize: 13.5, color: C.textSecondary, fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{ marginTop: 28, fontSize: 12, color: '#94A3B8', lineHeight: 1.6 }}>
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
