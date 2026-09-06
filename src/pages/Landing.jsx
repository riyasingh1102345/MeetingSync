import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Video, Check, ArrowRight, Clock, Sparkles, MessageSquare, 
  TrendingUp, Users, Activity, Target, Zap, Shield
} from 'lucide-react';

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
  bgWarm: '#FAFAFA',
  success: '#10B981',
  successLight: '#ECFDF5',
  successDark: '#047857',
  purple: '#8B5CF6',
  purpleLight: '#F5F3FF',
  purpleDark: '#6D28D9',
  orange: '#F97316',
  orangeLight: '#FFF7ED',
  pink: '#EC4899',
  pinkLight: '#FDF2F8',
  cyan: '#06B6D4',
  cyanLight: '#ECFEFF',
};

const fontBody = "'Plus Jakarta Sans', sans-serif";

export default function Landing() {
  const [hoveredNav, setHoveredNav] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);
  const [heroBtnHover, setHeroBtnHover] = useState(false);
  const [demoBtnHover, setDemoBtnHover] = useState(false);
  const [ctaBtnHover, setCtaBtnHover] = useState(false);

  return (
    <div style={{ fontFamily: fontBody, background: C.bg, color: C.textPrimary, minHeight: '100vh', overflowX: 'hidden' }}>

      {/*  NAVBAR */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`, padding: '0 64px'
      }}>
        <div style={{ maxWidth: 1536, margin: '0 auto', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Video size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 20, color: C.textPrimary, letterSpacing: '-0.02em' }}>MeetLens AI</span>
          </div>

          <div style={{ display: 'flex', gap: 32 }}>
            {['Features', 'How it Works', 'Pricing'].map((item, idx) => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                style={{ fontSize: 14.5, fontWeight: 600, color: hoveredNav === idx ? C.blue : C.textSecondary, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={() => setHoveredNav(idx)} onMouseLeave={() => setHoveredNav(null)}>
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link to="/signin" style={{ fontSize: 14.5, fontWeight: 600, color: C.textSecondary, textDecoration: 'none', padding: '8px 16px' }}>Sign In</Link>
            <Link to="/signin" state={{ isSignUp: true }} style={{ background: C.blue, color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 14.5, fontWeight: 600, textDecoration: 'none', boxShadow: '0 4px 12px rgba(37,99,235,0.15)' }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─────────────────────────────── */}
      <section style={{ padding: '80px 64px 60px' }}>
        <div style={{ maxWidth: 1536, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 64, alignItems: 'center' }}>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.blueLight, border: `1px solid ${C.blueBorder}`, borderRadius: 99, padding: '6px 16px', color: C.blue, fontSize: 13.5, fontWeight: 600, marginBottom: 24 }}>
              <Activity size={14} /> AI-Powered Meeting Intelligence
            </div>

            <h1 style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em', color: C.textPrimary, marginBottom: 24 }}>
              Never Miss a Meeting<br />
              <span style={{ background: 'linear-gradient(135deg, #2563EB 0%, #8B5CF6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Moment Again</span>
            </h1>

            <p style={{ fontSize: 17, lineHeight: 1.6, color: C.textSecondary, marginBottom: 40, maxWidth: 520 }}>
              Transform your meeting recordings into searchable, timestamped insights. Get AI-generated summaries, conclusions, and instant answers to catch up on what you missed.
            </p>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 56 }}>
              <Link to="/signin" state={{ isSignUp: true }}
                style={{ background: heroBtnHover ? C.blueHover : C.blue, color: 'white', padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 14px rgba(37,99,235,0.3)', transition: 'all 0.2s' }}
                onMouseEnter={() => setHeroBtnHover(true)} onMouseLeave={() => setHeroBtnHover(false)}>
                Get Started <ArrowRight size={16} />
              </Link>
              <button
                style={{ border: `1px solid ${C.border}`, padding: '14px 28px', borderRadius: 8, fontSize: 15, fontWeight: 600, color: C.textPrimary, display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: demoBtnHover ? C.bgWarm : 'white', transition: 'all 0.2s' }}
                onMouseEnter={() => setDemoBtnHover(true)} onMouseLeave={() => setDemoBtnHover(false)}>
                Watch Demo <Video size={16} color={C.textPrimary} />
              </button>
            </div>

            {/* Stat Cards */}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ background: '#F8FAFC', border: `1px solid ${C.blueBorder}`, borderRadius: 16, padding: '20px 24px', flex: 1, textAlign: 'center' }}>
                <Users size={20} color={C.blue} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary }}>10k+</div>
                <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>Active Users</div>
              </div>
              <div style={{ background: '#FDFCFE', border: '1px solid #EDE9FE', borderRadius: 16, padding: '20px 24px', flex: 1, textAlign: 'center' }}>
                <Target size={20} color={C.purple} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary }}>50k+</div>
                <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>Meetings Analyzed</div>
              </div>
              <div style={{ background: '#F8FAF9', border: '1px solid #D1FAE5', borderRadius: 16, padding: '20px 24px', flex: 1, textAlign: 'center' }}>
                <Zap size={20} color={C.success} style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary }}>98%</div>
                <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 500 }}>Accuracy</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div style={{ position: 'relative' }}>
            <div className="image-zoom-container" style={{ width: '100%', aspectRatio: '16/10', borderRadius: 24 }}>
              <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80" alt="Meeting" className="image-zoom-img" />
            </div>
            <div className="float-badge" style={{ top: 30, right: -20, padding: '12px 20px', borderRadius: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Clock size={20} /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>23 Timestamps</div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>Generated</div>
              </div>
            </div>
            <div className="float-badge" style={{ bottom: 30, left: -20, padding: '12px 20px', borderRadius: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.success, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}><Check size={20} strokeWidth={3} /></div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>AI Summary Ready</div>
                <div style={{ fontSize: 12, color: C.textSecondary, marginTop: 2 }}>2 mins ago</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── TRUSTED BY ──────────────────────────────── */}
      <section style={{ padding: '60px 0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.textSecondary, letterSpacing: '0.1em', marginBottom: 24 }}>TRUSTED BY TEAMS AT</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 48, alignItems: 'center', flexWrap: 'wrap', opacity: 0.5 }}>
          {['Microsoft', 'Google', 'Amazon', 'Meta', 'Apple'].map(c => (
            <span key={c} style={{ fontSize: 24, fontWeight: 800, color: C.textPrimary }}>{c}</span>
          ))}
        </div>
      </section>

      {/* ─── FEATURES SECTION ───────────────────────── */}
      <section id="features" style={{ padding: '100px 64px 60px' }}>
        <div style={{ maxWidth: 1536, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', background: C.blueLight, color: C.blue, fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20, marginBottom: 16 }}>Features</div>
            <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', color: C.textPrimary, marginBottom: 16 }}>Everything You Need to Stay Informed</h2>
            <p style={{ fontSize: 16, color: C.textSecondary, maxWidth: 540, margin: '0 auto', lineHeight: 1.6 }}>Powerful features to help you catch up on any meeting instantly</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: <Clock size={24} />, bg: C.blue, borderColor: '#BFDBFE', hoverBg: '#F8FAFC', title: 'AI Timestamps', desc: 'Automatically generated timestamps for every key discussion point and topic change' },
              { icon: <Sparkles size={24} />, bg: C.success, borderColor: '#A7F3D0', hoverBg: '#F6FDF9', title: 'Smart Summaries', desc: 'Get concise AI-generated summaries of entire meetings or specific sections' },
              { icon: <MessageSquare size={24} />, bg: C.purple, borderColor: '#DDD6FE', hoverBg: '#FAF9FF', title: 'AI Chatbot Assistant', desc: 'Ask questions and get instant answers about any meeting content' },
              { icon: <TrendingUp size={24} />, bg: C.orange, borderColor: '#FED7AA', hoverBg: '#FFFDF9', title: 'Key Conclusions', desc: 'Automatically extract action items, decisions, and key takeaways' },
              { icon: <Users size={24} />, bg: C.pink, borderColor: '#FBCFE8', hoverBg: '#FFF9FC', title: 'Speaker Tracking', desc: 'Identify who said what with intelligent speaker recognition' },
              { icon: <Video size={24} />, bg: C.cyan, borderColor: '#A5F3FC', hoverBg: '#F9FEFF', title: 'Video Playback', desc: 'Jump to any moment in the recording with timestamp navigation' },
            ].map((f, idx) => (
              <div key={f.title} onMouseEnter={() => setHoveredFeature(idx)} onMouseLeave={() => setHoveredFeature(null)}
                style={{ borderRadius: 20, padding: 32, background: hoveredFeature === idx ? f.hoverBg : 'white', border: `1px solid ${hoveredFeature === idx ? f.borderColor : C.border}`, transition: 'all 0.3s ease', cursor: 'default' }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: f.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>{f.icon}</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 14.5, color: C.textSecondary, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VIDEO CALLS SECTION ────────────────────── */}
      <section style={{ padding: '80px 64px' }}>
        <div style={{ maxWidth: 1536, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 64, alignItems: 'center' }}>
          <div>
            <div style={{ borderLeft: `4px solid ${C.purple}`, paddingLeft: 20, marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.purpleLight, color: C.purple, fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                <Shield size={14} /> Smart Video Conference Integration
              </div>
              <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', color: C.textPrimary, margin: 0 }}>Seamlessly Connect Your Video Calls</h2>
            </div>
            <p style={{ fontSize: 16, color: C.textSecondary, lineHeight: 1.7, marginBottom: 32 }}>
              Integrate with all major video conferencing platforms. Automatically capture and analyze your meetings without any extra effort.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Works with Zoom, Teams, Google Meet, and more', 'Automatic recording and transcription', 'Real-time AI processing'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.success, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} strokeWidth={3} /></div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div className="image-zoom-container" style={{ aspectRatio: '16/10', borderRadius: 24 }}>
              <img src="https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=1200&q=80" alt="Video Conference" className="image-zoom-img" />
            </div>
            <div className="float-badge" style={{ bottom: 20, right: -20, padding: '12px 20px', borderRadius: 99 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: C.success, boxShadow: `0 0 0 4px ${C.successLight}` }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>Live Processing</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TEAM COLLABORATION SECTION ─────────────── */}
      <section style={{ padding: '80px 64px 40px' }}>
        <div style={{ maxWidth: 1536, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 64, alignItems: 'center' }}>

          <div style={{ position: 'relative' }}>
            <div className="image-zoom-container" style={{ aspectRatio: '16/10', borderRadius: 24 }}>
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" alt="Team Collaboration" className="image-zoom-img" />
            </div>
            <div className="float-badge" style={{ top: 20, left: -20, padding: '12px 20px', borderRadius: 99 }}>
              <Sparkles size={18} color={C.blue} />
              <span style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary }}>AI Powered</span>
            </div>
          </div>

          <div>
            <div style={{ borderLeft: `4px solid ${C.success}`, paddingLeft: 20, marginBottom: 24 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: C.successLight, color: C.success, fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20, marginBottom: 12 }}>
                <Users size={14} /> Team Collaboration
              </div>
              <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.02em', color: C.textPrimary, margin: 0 }}>Keep Your Entire Team in Sync</h2>
            </div>
            <p style={{ fontSize: 16, color: C.textSecondary, lineHeight: 1.7, marginBottom: 32 }}>
              Share meeting insights with your team instantly. Everyone stays informed, even if they missed the meeting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {['Share summaries and timestamps with teammates', 'Collaborative annotations and comments', 'Team-wide searchable meeting library'].map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.success, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} strokeWidth={3} /></div>
                  <span style={{ fontSize: 15, fontWeight: 500, color: C.textPrimary }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────── */}
      <section id="how-it-works" style={{ background: C.bgWarm, padding: '100px 64px', position: 'relative', overflow: 'hidden', borderTop: `1px solid ${C.border}` }}>

        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: 80 }}>
            <div style={{ display: 'inline-flex', background: C.blueLight, border: `1px solid ${C.blueBorder}`, color: C.blue, fontSize: 12, fontWeight: 700, padding: '6px 16px', borderRadius: 20, marginBottom: 20, letterSpacing: '0.05em' }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.02em', color: C.textPrimary, marginBottom: 16 }}>Get Started in Three Simple Steps</h2>
            <p style={{ fontSize: 17, color: C.textSecondary, lineHeight: 1.6 }}>From recording to insights in minutes</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, alignItems: 'stretch' }}>
            {[
              { step: '01', icon: <Video size={28} />, gradFrom: '#2563EB', gradTo: '#1D4ED8', glow: 'rgba(37,99,235,0.08)', border: '#BFDBFE', hoverBorder: '#2563EB', title: 'Upload Your Recording', desc: 'Simply upload your meeting recording or connect your video conferencing tool for automatic capture.', tag: 'Any format supported', tagColor: C.blue, tagBg: C.blueLight },
              { step: '02', icon: <Sparkles size={28} />, gradFrom: '#8B5CF6', gradTo: '#6D28D9', glow: 'rgba(139,92,246,0.08)', border: '#DDD6FE', hoverBorder: '#8B5CF6', title: 'AI Processes Content', desc: 'Our AI analyzes the meeting, creates timestamps, and generates comprehensive summaries automatically.', tag: 'Powered by GPT-4', tagColor: C.purple, tagBg: C.purpleLight },
              { step: '03', icon: <MessageSquare size={28} />, gradFrom: '#10B981', gradTo: '#047857', glow: 'rgba(16,185,129,0.08)', border: '#A7F3D0', hoverBorder: '#10B981', title: 'Explore & Ask Questions', desc: 'Navigate timestamps, read summaries, or chat with AI to get specific answers instantly.', tag: 'Instant answers', tagColor: C.success, tagBg: C.successLight },
            ].map((s, idx) => (
              <div key={s.step} style={{ background: 'white', border: `1px solid ${s.border}`, borderRadius: 24, padding: 36, position: 'relative', overflow: 'hidden', boxShadow: `0 4px 24px ${s.glow}`, display: 'flex', flexDirection: 'column', gap: 20, transition: 'box-shadow 0.3s, border-color 0.3s' }}>
                {/* Top accent line */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${s.gradFrom}, transparent)` }} />
                {/* Ghost step number */}
                <div style={{ position: 'absolute', top: 20, right: 24, fontSize: 64, fontWeight: 900, color: 'rgba(0,0,0,0.04)', letterSpacing: '-0.04em', lineHeight: 1, userSelect: 'none' }}>{s.step}</div>
                {/* Icon */}
                <div style={{ width: 60, height: 60, borderRadius: 18, background: `linear-gradient(135deg, ${s.gradFrom}, ${s.gradTo})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: `0 8px 20px ${s.glow}`, flexShrink: 0 }}>{s.icon}</div>
                {/* Tag */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.tagBg, color: s.tagColor, fontSize: 11.5, fontWeight: 600, padding: '4px 12px', borderRadius: 99, width: 'fit-content' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.gradFrom }} />{s.tag}
                </div>
                {/* Text */}
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 10, letterSpacing: '-0.01em' }}>{s.title}</h3>
                  <p style={{ fontSize: 14.5, color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
                </div>
                {/* Arrow connector */}
                {idx < 2 && (
                  <div style={{ position: 'absolute', top: '50%', right: -18, transform: 'translateY(-50%)', zIndex: 10, color: C.border, fontSize: 22, fontWeight: 700 }}>›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA SECTION ────────────────────────────── */}
      <section style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)', padding: '100px 64px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 42, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', marginBottom: 20 }}>Ready to Never Miss Another Meeting?</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.9)', marginBottom: 40, lineHeight: 1.6 }}>Join thousands of professionals who stay informed with AI-powered meeting intelligence</p>
          <Link to="/signin" state={{ isSignUp: true }}
            style={{ background: 'white', color: C.blueDark, padding: '16px 32px', borderRadius: 8, fontSize: 16, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', transform: ctaBtnHover ? 'translateY(-2px)' : 'none', boxShadow: ctaBtnHover ? '0 12px 24px rgba(0,0,0,0.2)' : '0 4px 12px rgba(0,0,0,0.1)' }}
            onMouseEnter={() => setCtaBtnHover(true)} onMouseLeave={() => setCtaBtnHover(false)}>
            Get Started <ArrowRight size={18} />
          </Link>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 24 }}>100% Free • Unlimited meeting transcriptions • AI-powered action items</div>
        </div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────── */}
      <footer style={{ background: '#0B0F19', padding: '80px 64px 32px' }}>
        <div style={{ maxWidth: 1536, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 30, height: 30, borderRadius: 6, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Video size={16} color="white" /></div>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'white', letterSpacing: '-0.02em' }}>MeetLens AI</span>
              </div>
              <p style={{ fontSize: 13.5, color: '#94A3B8', lineHeight: 1.7, maxWidth: 260 }}>AI-powered meeting intelligence for the modern workplace.</p>
            </div>

            {[
              { heading: 'Product', links: ['Features', 'Pricing', 'Integrations'] },
              { heading: 'Company', links: ['About', 'Blog', 'Careers'] },
              { heading: 'Support', links: ['Help Center', 'Contact', 'Privacy'] },
            ].map(col => (
              <div key={col.heading}>
                <h4 style={{ color: 'white', fontSize: 13.5, fontWeight: 700, marginBottom: 20 }}>{col.heading}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(l => (
                    <a key={l} href="#" style={{ color: '#94A3B8', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#94A3B8'}>{l}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 32 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>© 2026 MeetLens AI. All rights reserved.</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
