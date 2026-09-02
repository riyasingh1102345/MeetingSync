import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import {
  UploadCloud, Sparkles, CheckCircle2, Bot, Video, History as HistoryIcon,
  MessageSquare, Send, Loader2
} from 'lucide-react';

const font = "'Plus Jakarta Sans', sans-serif";

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  
  // Load chat history from localStorage safely
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('dashboard_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse chat history');
    }
    return [
      { role: 'assistant', text: "Welcome to MeetLens AI! I'm your personal meeting assistant. How can I help you today?" }
    ];
  });

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dashboard_chat_history', JSON.stringify(messages));
  }, [messages]);

  const name = currentUser?.displayName?.split(' ')[0] || currentUser?.email?.split('@')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const handleSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;
    const userText = chatInput;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setChatInput('');
    setIsChatLoading(true);
    
    try {
      // 1. Fetch recent meetings for context (client-side sort to avoid index requirements)
      const q = query(
        collection(db, 'meetings'),
        where('userId', '==', currentUser.uid)
      );
      const snap = await getDocs(q);
      
      let contextStr = "User's Recent Meetings:\\n\\n";
      if (snap.empty) {
        contextStr = "The user has no recorded meetings yet. Tell them they can ask you questions once they upload some meetings.";
      } else {
        // Sort by createdAt desc and take top 5
        const recentMeetings = snap.docs
          .map(doc => doc.data())
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .slice(0, 5);

        recentMeetings.forEach(d => {
          contextStr += `Meeting Title: ${d.title}\\nDate: ${d.date}\\nSummary: ${d.summary}\\nAction Items: ${(d.actionItems || []).join(', ')}\\n\\n`;
        });
      }

      // 2. Call backend chat API
      const apiUrl = import.meta.env.VITE_API_URL || 'https://meetingsync-server.onrender.com';
      const res = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userText, context: contextStr })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');
      
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I'm having trouble connecting to the server right now." }]);
    }
    
    setIsChatLoading(false);
  };

  return (
    <div style={{ fontFamily: font, height: '100%', width: '100%', background: '#FFFFFF', display: 'flex' }}>
      
      {/* ─── LEFT SIDE (Greeting & How to use) ────────────────── */}
      <div style={{ flex: 1, padding: '48px 56px', overflowY: 'auto' }}>
        
        <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              {greeting}, {name} 👋
            </h1>
            <p style={{ fontSize: 16, color: '#64748B', fontWeight: 500 }}>
              Welcome back! Here's an overview of your latest meeting activities.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 24 }}>Quick Actions</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
              
              {/* Card 1: Live Meeting */}
              <div style={{
                background: 'linear-gradient(180deg, #E0F2FE 0%, #FFFFFF 100%)',
                border: '1px solid #BAE6FD',
                borderRadius: 20,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <Video size={28} color="#0284C7" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Start Live Meeting</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 32, flex: 1 }}>
                  Host a meeting right here. Our AI will automatically transcribe and summarize the conversation in real-time.
                </p>
                <Link to="/live" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
                  color: '#FFFFFF', padding: '12px', borderRadius: 100,
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
                }}>
                  Start Meeting <span style={{ fontSize: 16 }}>›</span>
                </Link>
              </div>

              {/* Card 2: Upload */}
              <div style={{
                background: 'linear-gradient(180deg, #FAE8FF 0%, #FFFFFF 100%)',
                border: '1px solid #F5D0FE',
                borderRadius: 20,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(217,70,239,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <UploadCloud size={28} color="#A21CAF" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Upload Recording</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 32, flex: 1 }}>
                  Have an existing video or audio file from Zoom or Meet? Upload it for instant AI insights.
                </p>
                <Link to="/upload" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'linear-gradient(90deg, #D946EF, #E879F9)',
                  color: '#FFFFFF', padding: '12px', borderRadius: 100,
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(217,70,239,0.3)'
                }}>
                  Upload Now <span style={{ fontSize: 16 }}>›</span>
                </Link>
              </div>

              {/* Card 3: History */}
              <div style={{
                background: 'linear-gradient(180deg, #D1FAE5 0%, #FFFFFF 100%)',
                border: '1px solid #A7F3D0',
                borderRadius: 20,
                padding: '32px 24px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
              }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <HistoryIcon size={28} color="#059669" />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>View Past Meetings</h3>
                <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.6, marginBottom: 32, flex: 1 }}>
                  Easily review full transcriptions, search for keywords, and view action items from past meetings.
                </p>
                <Link to="/history" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'linear-gradient(90deg, #10B981, #34D399)',
                  color: '#FFFFFF', padding: '12px', borderRadius: 100,
                  fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                }}>
                  Go to History <span style={{ fontSize: 16 }}>›</span>
                </Link>
              </div>

            </div>
          </div>

          {/* ─── PRO TIPS SECTION (Fills empty space) ─── */}
          <div style={{ marginTop: 48, background: 'linear-gradient(90deg, #F8FAFC, #FFFFFF)', border: '1px solid #E2E8F0', borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              💡 Pro Tips for MeetLens AI
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>1</div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Use the Global Chatbot</h4>
                  <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5 }}>The chatbot on the right knows everything about your last 5 meetings. Ask it "What tasks were assigned to me this week?".</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#ECFDF5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800 }}>2</div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>Click Timestamps</h4>
                  <p style={{ fontSize: 13.5, color: '#64748B', lineHeight: 1.5 }}>In any meeting transcript, clicking the blue timestamp will instantly jump the video to that exact second.</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ─── RIGHT SIDE (Chatbot) ─────────────────────────────────── */}
        <div style={{ width: 380, background: '#F8FAFC', borderLeft: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', padding: 24 }}>
          
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF 0%, #F5F3FF 100%)',
            borderRadius: 24, border: '1px solid #E2E8F0',
            flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden'
          }}>
            
            {/* Chat Header */}
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF' }}>
                <Bot size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>MeetLens AI</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#10B981', fontWeight: 700 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }} /> Online
                </div>
              </div>
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '14px 18px',
                    borderRadius: 18,
                    background: m.role === 'user' ? 'linear-gradient(135deg, #2563EB, #3B82F6)' : '#FFFFFF',
                    color: m.role === 'user' ? '#FFFFFF' : '#334155',
                    fontSize: 14, lineHeight: 1.5,
                    borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                    borderBottomLeftRadius: m.role === 'assistant' ? 4 : 18,
                    boxShadow: m.role === 'assistant' ? '0 4px 12px rgba(0,0,0,0.03)' : '0 4px 12px rgba(37,99,235,0.2)'
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <div style={{ padding: '14px 18px', borderRadius: 18, background: '#FFFFFF', color: '#334155', borderBottomLeftRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                    <Loader2 size={16} className="animate-spin" color="#94A3B8" />
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div style={{ padding: '20px' }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: 10, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Ask me anything..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 48px 14px 20px',
                    borderRadius: 100, border: 'none', outline: 'none',
                    fontSize: 14, background: '#FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                  }}
                />
                <button type="submit" style={{
                  position: 'absolute', right: 6, top: 6,
                  width: 34, height: 34, borderRadius: '50%', background: '#2563EB', color: '#FFF',
                  border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                }}>
                  <Send size={16} style={{ marginLeft: -2 }} />
                </button>
              </form>
            </div>
            
          </div>
        </div>

    </div>
  );
}
