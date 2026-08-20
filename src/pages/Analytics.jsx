import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  Loader2, Clock, Calendar as CalendarIcon, Users, User,
  ChevronRight, Lightbulb, Video, CheckCircle2, ArrowUpRight
} from 'lucide-react';

const font = "'Plus Jakarta Sans', sans-serif";

const AVATAR_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#10B981',
  '#F59E0B', '#EF4444', '#06B6D4', '#6366F1'
];

function Avatar({ name, size = 40, index = 0 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: AVATAR_COLORS[index % AVATAR_COLORS.length],
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 800, color: '#FFF', flexShrink: 0
    }}>
      {initials}
    </div>
  );
}

function MeetingInsightCard({ meeting }) {
  const {
    id, title, name, host, attendees = 0, duration,
    date, time, summary, actionItems = [], transcript
  } = meeting;

  const displayTitle = title || name || 'Untitled Meeting';
  const displayDate = date || (meeting.createdAt ? new Date(meeting.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A');
  const displayTime = time || '';

  // Generate mock attendee list based on count
  const attendeeList = Array.from({ length: Math.min(attendees, 8) }, (_, i) => {
    const names = ['Michael Chen', 'Emma Williams', 'Priya Sharma', 'David Kim', 'Alex Rodriguez', 'Lisa Brown', 'Tom Wilson', 'Nina Patel'];
    const roles = ['Engineering Lead', 'Senior Developer', 'UX Designer', 'QA Lead', 'Marketing Manager', 'Data Analyst', 'Product Owner', 'DevOps Engineer'];
    return { name: names[i] || `Attendee ${i + 1}`, role: roles[i] || 'Member' };
  });

  // Parse summary / action items
  const summaryPoints = actionItems?.length > 0
    ? actionItems.slice(0, 3)
    : summary
      ? summary.split(/[.!?]+/).filter(s => s.trim().length > 10).slice(0, 3)
      : ['Meeting was processed. View the full transcript for details.'];

  return (
    <div style={{
      background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0',
      overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.07)'; }}
    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.03)'; }}>

      {/* Card Header */}
      <div style={{ padding: '28px 32px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', marginBottom: 10, letterSpacing: '-0.02em' }}>
              {displayTitle}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13, color: '#64748B', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <CalendarIcon size={14} color="#3B82F6" /> {displayDate}
              </div>
              {displayTime && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} color="#3B82F6" /> {displayTime}
                </div>
              )}
            </div>
          </div>
          <Link to={`/meeting/${id}`} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
            background: '#EFF6FF', color: '#2563EB', borderRadius: 10, border: '1px solid #BFDBFE',
            fontSize: 13, fontWeight: 700, textDecoration: 'none'
          }}>
            <Video size={14} /> View Recording
          </Link>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 0 }}>

        {/* Left Column: Host + Duration */}
        <div style={{ padding: '28px 32px', borderRight: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* Host */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Host</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar name={host || 'Unknown'} size={48} index={0} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>{host || 'Unknown'}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Meeting Host</div>
              </div>
              <div style={{ marginLeft: 'auto' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 0 3px rgba(16,185,129,0.15)' }} />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>Meeting Duration</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Clock size={22} color="#3B82F6" />
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
                {duration || 'N/A'}
              </div>
            </div>
          </div>

          {/* Attendee Count Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={18} color="#3B82F6" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#64748B' }}>Total Attendees</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>{attendees || attendeeList.length}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Participants + Key Takeaways */}
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
          
          {/* Participants */}
          {attendeeList.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Participants ({attendees || attendeeList.length})
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {attendeeList.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={a.name} size={32} index={i + 1} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{a.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Takeaways */}
          {summaryPoints.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
                Key Takeaways
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {summaryPoints.map((point, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, fontSize: 13, color: '#334155', lineHeight: 1.5, fontWeight: 500 }}>
                    <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{typeof point === 'string' ? point.trim() : point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { currentUser } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeetings() {
      if (!currentUser) return;
      try {
        const q = query(collection(db, 'meetings'), where('userId', '==', currentUser.uid));
        const snap = await getDocs(q);
        const fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMeetings(fetched);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    fetchMeetings();
  }, [currentUser]);

  return (
    <div style={{ fontFamily: font, height: '100%', width: '100%', background: '#F8FAFC', overflowY: 'auto' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '48px 32px' }}>

        {/* Page Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#EFF6FF', borderRadius: 20, border: '1px solid #BFDBFE', color: '#2563EB', fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
            <Lightbulb size={14} /> Meeting Insights
          </div>
          <h1 style={{ fontSize: 34, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 10 }}>
            Your Meeting Breakdown
          </h1>
          <p style={{ fontSize: 15, color: '#64748B', fontWeight: 500 }}>
            A detailed look at every meeting — host, attendees, duration and key takeaways, all in one place.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
            <Loader2 size={36} color="#3B82F6" className="animate-spin" />
          </div>
        ) : meetings.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 40px', background: '#FFFFFF',
            borderRadius: 20, border: '1px solid #E2E8F0', boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            <div style={{ width: 72, height: 72, borderRadius: 20, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Video size={36} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>No meetings yet</h3>
            <p style={{ fontSize: 14, color: '#64748B', marginBottom: 24 }}>
              Upload a meeting recording and we'll extract all the insights for you automatically.
            </p>
            <Link to="/upload" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
              background: '#2563EB', color: '#FFF', borderRadius: 12, fontWeight: 700,
              fontSize: 14, textDecoration: 'none'
            }}>
              Upload a Recording <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {meetings.map((m) => (
              <MeetingInsightCard key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
