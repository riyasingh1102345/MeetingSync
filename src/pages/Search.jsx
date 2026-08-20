import { useState } from 'react';
import { Search as SearchIcon, Clock, FileText } from 'lucide-react';

const results = [
  { meeting: 'Q3 Marketing Strategy Sync', date: 'May 20, 2025', time: '14:52', text: 'We decided to increase the Q3 marketing budget by 20% and allocate more toward paid ads.', tags: ['Budget', 'Marketing'] },
  { meeting: 'Budget Planning FY24', date: 'Mar 15, 2025', time: '32:15', text: 'The board approved an additional allocation for digital marketing channels this quarter.', tags: ['Budget'] },
];

export default function Search() {
  const [query, setQuery] = useState('What did we decide about the Q3 marketing budget?');
  const [searched, setSearched] = useState(true);

  return (
    <div className="dash-page">
      <div style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '6px' }}>Search Across Meetings</div>
      <div style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '28px' }}>Find answers, decisions and topics across all your past meetings.</div>

      <form onSubmit={(e) => { e.preventDefault(); setSearched(true); }} className="search-bar-wrapper" style={{ marginTop: '20px' }}>
        <SearchIcon size={18} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
        <input
          className="search-bar-input"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="What did we decide about..."
        />
        <button type="submit" className="search-bar-btn">Search</button>
      </form>

      {searched && (
        <>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{results.length} results</strong> found across all meetings
          </div>

          {/* AI Answer card */}
          <div className="result-card" style={{ borderLeft: '3px solid var(--brand)', marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              🤖 AI-Generated Answer
            </div>
            <div style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--text-primary)', marginBottom: '14px' }}>
              We decided to <strong>increase the Q3 marketing budget by 20%</strong> and allocate more toward paid ads, especially Google and Meta channels.
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '8px' }}>Sources</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-subtle)', padding: '8px 12px', borderRadius: '7px' }}>
                  <FileText size={14} style={{ color: 'var(--brand)', flexShrink: 0 }} />
                  <div style={{ flex: 1, fontSize: '12.5px' }}>
                    <span style={{ fontWeight: 600 }}>{r.meeting}</span>
                    <span style={{ color: 'var(--text-light)', marginLeft: '8px' }}>{r.date}</span>
                  </div>
                  <div className="timestamp-badge"><Clock size={10} /> {r.time}</div>
                </div>
              ))}
            </div>
          </div>

          {results.map((r, i) => (
            <div className="result-card" key={i}>
              <div className="result-meta">
                <span>{r.meeting}</span>
                <span>·</span>
                <span>{r.date}</span>
              </div>
              <div className="result-text" dangerouslySetInnerHTML={{ __html: r.text.replace(/Q3 marketing budget by 20%/g, '<mark>Q3 marketing budget by 20%</mark>') }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="timestamp-badge"><Clock size={10} /> Jump to {r.time}</div>
                {r.tags.map(t => <span key={t} style={{ fontSize: '11px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '2px 9px', borderRadius: '999px', color: 'var(--text-secondary)' }}>{t}</span>)}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
