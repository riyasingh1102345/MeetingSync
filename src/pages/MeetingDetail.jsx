import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Share, Download, Clock, MessageSquare, Sparkles, Send, ArrowLeft, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const C = {
  blue: '#2563EB',
  blueHover: '#1D4ED8',
  blueLight: '#EFF6FF',
  blueBorder: '#DBEAFE',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  border: '#E2E8F0',
  bg: '#FFFFFF',
  bgWarm: '#F8FAFC',
  
  // Dark mode specific
  darkBg: '#090E17',
  darkSurface: '#151D2C',
  darkBorder: '#1E293B',
  darkText: '#F8FAFC',
  darkTextSec: '#94A3B8',
  darkHover: '#1E293B',
};

const font = "'Plus Jakarta Sans', sans-serif";

const fallbackTranscript = [
  { time: '00:02', speaker: 'Speaker A', text: 'This meeting has not been processed by AI yet.' },
];

export default function MeetingDetail() {
  const { id } = useParams();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  
  const [tab, setTab] = useState('transcript');
  const [showRaw, setShowRaw] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Ask any question about this meeting and get a timestamp-grounded answer." }
  ]);

  useEffect(() => {
    async function fetchMeeting() {
      try {
        const docRef = doc(db, 'meetings', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMeeting(docSnap.data());
        } else {
          setMeeting({
            title: 'Q3 Marketing Strategy Sync',
            date: 'May 20, 2025',
            time: '10:00 AM',
            duration: '45 min',
            attendees: 7,
          });
        }
      } catch (e) {
        console.error("Error fetching meeting:", e);
      }
      setLoading(false);
    }
    fetchMeeting();
  }, [id]);

  const sendMessage = async (text) => {
    if (!text.trim() || isChatLoading) return;
    setMessages(prev => [
      ...prev,
      { role: 'user', text }
    ]);
    setAiInput('');
    setIsChatLoading(true);

    try {
      let contextStr = `Meeting Title: ${meeting?.title}\\nDate: ${meeting?.date}\\n\\nTranscript:\\n`;
      if (meeting?.transcript && Array.isArray(meeting.transcript)) {
        meeting.transcript.forEach(line => {
          contextStr += `[${line.time}] ${line.speaker}: ${line.text}\\n`;
        });
      } else {
        contextStr += meeting?.transcriptText || 'No transcript available for this meeting.';
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, context: contextStr })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      
      setMessages(prev => [...prev, { role: 'ai', text: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', text: "Sorry, I'm having trouble connecting to the server right now." }]);
    }
    
    setIsChatLoading(false);
  };

  const handleTimestampClick = (timeStr) => {
    if (!videoRef.current || !timeStr) return;
    const parts = timeStr.split(':');
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 3) {
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    }
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: C.darkBg, color: C.blue }}><Loader2 className="animate-spin" size={32} /></div>;
  }

  return (
    <div style={{ fontFamily: font, display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      
      {/* LEFT SIDE: DARK MODE ANALYTICS VIEW */}
      <div style={{ flex: 1, background: C.darkBg, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        
        {/* Dark Header */}
        <div style={{ padding: '20px 32px', borderBottom: `1px solid ${C.darkBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: '50%', background: C.darkSurface, color: C.darkTextSec, textDecoration: 'none', transition: 'all 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = C.darkTextSec}>
              <ArrowLeft size={16} />
            </Link>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: C.darkText, margin: 0, marginBottom: 4 }}>{meeting?.title}</h1>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: C.darkTextSec, fontWeight: 500 }}>
                <span>{meeting?.date} · {meeting?.time}</span>
                <span>⏱ {meeting?.duration}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Meeting link copied to clipboard!');
            }} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.darkBorder}`, background: 'transparent', fontSize: 13, fontWeight: 600, color: C.darkText, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = C.darkHover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Share size={14} /> Share
            </button>
            <button onClick={() => {
              const content = `Meeting: ${meeting?.title}\nDate: ${meeting?.date}\n\nSUMMARY:\n${meeting?.summary}\n\nACTION ITEMS:\n${meeting?.actionItems?.join('\n')}\n\nTRANSCRIPT:\n${meeting?.transcriptText || 'No transcript available.'}`;
              const blob = new Blob([content], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${meeting?.title || 'Meeting'}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: C.blue, fontSize: 13, fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = C.blueHover} onMouseLeave={e => e.currentTarget.style.background = C.blue}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          
          {/* Cinematic Video Player */}
          <div style={{ width: '100%', background: '#000', borderBottom: `1px solid ${C.darkBorder}`, display: 'flex', justifyContent: 'center', position: 'relative' }}>
            {meeting?.videoUrl ? (
              <video 
                ref={videoRef}
                src={meeting.videoUrl} 
                controls 
                style={{ width: '100%', maxHeight: '55vh', objectFit: 'contain', outline: 'none' }} 
              />
            ) : (
              <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.darkTextSec, fontSize: 14 }}>
                No video available for this meeting
              </div>
            )}
          </div>

          {/* Transcript & Summary Tabs */}
          <div style={{ flex: 1, padding: '32px 48px', maxWidth: 1000, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', gap: 32, borderBottom: `1px solid ${C.darkBorder}`, marginBottom: 24 }}>
              {['transcript', 'summary', 'action items'].map((t) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '0 0 16px 0', fontSize: 14.5, fontWeight: 600, border: 'none', background: 'none',
                  color: tab === t ? '#fff' : C.darkTextSec,
                  borderBottom: tab === t ? `2px solid ${C.blue}` : '2px solid transparent',
                  marginBottom: -1, transition: 'all 0.15s', cursor: 'pointer', textTransform: 'capitalize'
                }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div style={{ paddingBottom: 64 }}>
              {/* ── HIGHLIGHTS TAB (YouTube-style chapters) ── */}
              {tab === 'transcript' && (() => {
                const chapters = meeting?.chapters || [];
                const rawLines = meeting?.transcript || fallbackTranscript;

                if (chapters.length === 0 && rawLines.length <= 1) {
                  return (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: C.darkTextSec, fontSize: 15 }}>
                      No transcript available for this meeting.
                    </div>
                  );
                }

                return (
                  <div>
                    {/* Toggle: Highlights / Full Transcript */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                      <button onClick={() => setShowRaw(false)}
                        style={{ padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                          background: !showRaw ? C.blue : C.darkSurface, color: !showRaw ? '#fff' : C.darkTextSec }}>
                        ✦ Highlights
                      </button>
                      <button onClick={() => setShowRaw(true)}
                        style={{ padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                          background: showRaw ? C.blue : C.darkSurface, color: showRaw ? '#fff' : C.darkTextSec }}>
                        📄 Full Transcript
                      </button>
                    </div>

                    {/* ── HIGHLIGHTS (chapter cards) ── */}
                    {!showRaw && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {chapters.length > 0 ? chapters.map((chapter, i) => (
                          <div key={i} style={{ background: C.darkSurface, border: `1px solid ${C.darkBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: `1px solid ${C.darkBorder}` }}>
                              <button onClick={() => handleTimestampClick(chapter.time)}
                                style={{ fontSize: 13, fontWeight: 800, color: C.blue, background: 'rgba(37,99,235,0.15)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>
                                ▶ {chapter.time}
                              </button>
                              <span style={{ fontSize: 15, fontWeight: 700, color: C.darkText }}>{chapter.title}</span>
                            </div>
                            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {(chapter.bullets || []).map((bullet, j) => (
                                <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                  <span style={{ color: C.blue, fontWeight: 800, marginTop: 2, flexShrink: 0 }}>•</span>
                                  <span style={{ fontSize: 14.5, color: C.darkTextSec, lineHeight: 1.6 }}>{bullet}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )) : rawLines.map((line, i) => (
                          <div key={i} style={{ background: C.darkSurface, border: `1px solid ${C.darkBorder}`, borderRadius: 16, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: `1px solid ${C.darkBorder}` }}>
                              <button onClick={() => handleTimestampClick(line.time)}
                                style={{ fontSize: 13, fontWeight: 800, color: C.blue, background: 'rgba(37,99,235,0.15)', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer', flexShrink: 0 }}>
                                ▶ {line.time}
                              </button>
                              <span style={{ fontSize: 13, fontWeight: 700, color: C.darkText }}>{line.speaker}</span>
                            </div>
                            <div style={{ padding: '12px 20px', fontSize: 14.5, color: C.darkTextSec, lineHeight: 1.6 }}>{line.text}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ── FULL TRANSCRIPT (raw lines) ── */}
                    {showRaw && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {rawLines.map((line, i) => (
                          <div key={i} style={{ display: 'flex', gap: 20, padding: '14px 18px', borderRadius: 12, transition: 'background 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.background = C.darkSurface}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <button onClick={() => handleTimestampClick(line.time)}
                              style={{ fontSize: 13, color: C.blue, fontWeight: 700, minWidth: 48, paddingTop: 2, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', textDecoration: 'underline', flexShrink: 0 }}>
                              {line.time}
                            </button>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: C.darkText, marginBottom: 4 }}>{line.speaker}</div>
                              <div style={{ fontSize: 14.5, color: C.darkTextSec, lineHeight: 1.7 }}>{line.text}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
              {tab === 'summary' && (
                <div style={{ fontSize: 16, color: C.darkTextSec, lineHeight: 1.8, background: C.darkSurface, borderRadius: 16, padding: '24px 32px', border: `1px solid ${C.darkBorder}` }}>
                  {meeting?.summary || 'Summary not available for this meeting. Please re-upload using the new AI processing pipeline.'}
                </div>
              )}
              {tab === 'action items' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {meeting?.actionItems?.length > 0 ? meeting.actionItems.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '20px 24px', borderRadius: 16, background: C.darkSurface, border: `1px solid ${C.darkBorder}` }}>
                      <div style={{ width: 26, height: 26, borderRadius: 8, background: 'rgba(37,99,235,0.15)', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0, marginTop: 2 }}>{i + 1}</div>
                      <div style={{ fontSize: 15.5, color: C.darkText, lineHeight: 1.6 }}>{item}</div>
                    </div>
                  )) : (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: C.darkTextSec, fontSize: 15 }}>No action items found for this meeting.</div>
                  )}
                </div>
              )}
              {isChatLoading && (
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.blueLight, color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Sparkles size={16} />
                  </div>
                  <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 16, borderTopLeftRadius: 4, padding: '12px 16px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                    <Loader2 size={16} className="animate-spin" color={C.textMuted} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: BRIGHT AI ASSISTANT PANEL */}
      <div style={{ width: 380, flexShrink: 0, background: C.bg, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', zIndex: 10, boxShadow: '-4px 0 24px rgba(0,0,0,0.03)' }}>
        
        {/* Header */}
        <div style={{ padding: '24px', background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
              <Sparkles size={18} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: C.textPrimary, letterSpacing: '-0.01em' }}>Meeting Assistant</div>
              <div style={{ fontSize: 12.5, color: C.textSecondary, fontWeight: 500, marginTop: 2 }}>Timestamp-grounded answers</div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 12 }}>
              {msg.role === 'ai' && (
                <div style={{ width: 30, height: 30, borderRadius: 10, background: C.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, alignSelf: 'flex-end' }}>
                  <Sparkles size={14} color={C.blue} />
                </div>
              )}
              <div style={{
                maxWidth: '85%', padding: '14px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: msg.role === 'user' ? C.blue : C.bgWarm,
                color: msg.role === 'user' ? 'white' : C.textPrimary,
                fontSize: 14, lineHeight: 1.6,
                border: msg.role === 'ai' ? `1px solid ${C.border}` : 'none',
                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(37,99,235,0.15)' : 'none'
              }}>
                {msg.role === 'ai' && i > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 800, color: C.blue, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    <Clock size={12} strokeWidth={3} /> Grounded Answer
                  </div>
                )}
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggestions */}
        {messages.length < 2 && (
          <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {['What did we decide about budget?', 'List all action items'].map(s => (
              <button key={s} onClick={() => sendMessage(s)}
                style={{ textAlign: 'left', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`, background: 'white', fontSize: 13.5, fontWeight: 600, color: C.textSecondary, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}
                onMouseEnter={e => { e.currentTarget.style.background = C.blueLight; e.currentTarget.style.borderColor = C.blueBorder; e.currentTarget.style.color = C.blue; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textSecondary; e.currentTarget.style.transform = 'none'; }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: 20, borderTop: `1px solid ${C.border}`, background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: C.bgWarm, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '8px 8px 8px 16px', transition: 'border-color 0.2s' }}
            onFocusCapture={e => e.currentTarget.style.borderColor = C.blue}
            onBlurCapture={e => e.currentTarget.style.borderColor = C.border}>
            <input
              value={aiInput}
              onChange={e => setAiInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage(aiInput)}
              placeholder="Ask a question..."
              style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: 14, color: C.textPrimary, fontFamily: font }}
            />
            <button onClick={() => sendMessage(aiInput)} style={{ width: 36, height: 36, borderRadius: 10, background: C.blue, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background = C.blueHover} onMouseLeave={e => e.currentTarget.style.background = C.blue}>
              <Send size={16} color="white" style={{ marginLeft: -2 }} />
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 12, fontSize: 11.5, color: C.textMuted, fontWeight: 500 }}>
            AI can make mistakes. Consider verifying important information.
          </div>
        </div>
      </div>
      
    </div>
  );
}
