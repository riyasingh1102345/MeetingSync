import { Search, Bell, User } from 'lucide-react';

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="flex gap-4">
        {/* Breadcrumb or simple nav links */}
        <span className="font-semibold" style={{ color: 'var(--primary-color)' }}>Home</span>
        <span className="text-muted">Meetings</span>
        <span className="text-muted">Search</span>
        <span className="text-muted">Ask</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="btn btn-primary" style={{ borderRadius: 'var(--radius-sm)', padding: '0.4rem 1rem' }}>
          + Upload
        </button>
        <button className="btn-ghost" style={{ padding: '0.5rem', borderRadius: '50%' }}>
          <Bell size={20} />
        </button>
        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={18} className="text-primary" />
        </div>
      </div>
    </header>
  );
}
