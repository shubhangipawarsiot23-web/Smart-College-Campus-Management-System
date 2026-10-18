import { useEffect, useState } from 'react';
import {
  LayoutDashboard, GraduationCap, Users, CalendarCheck, MessageSquareWarning,
  Megaphone, Search, Bell, Menu, X, ArrowUpRight, Clock3, CheckCircle2,
  CircleHelp, BookOpen, Building2, ChevronRight, Plus, RefreshCw
} from 'lucide-react';
import { getApi, postApi } from './api.js';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Students', icon: GraduationCap },
  { label: 'Faculty', icon: Users },
  { label: 'Attendance', icon: CalendarCheck },
  { label: 'Complaints', icon: MessageSquareWarning },
  { label: 'Notices', icon: Megaphone }
];

const fallback = {
  dashboard: { students: 1248, faculty: 86, openComplaints: 2, notices: 4 },
  students: [
    { id: 1, full_name: 'Aarav Sharma', email: 'aarav.sharma@campus.edu', department: 'Computer Engineering', year_of_study: 3, status: 'Active' },
    { id: 2, full_name: 'Priya Patil', email: 'priya.patil@campus.edu', department: 'Information Technology', year_of_study: 2, status: 'Active' },
    { id: 3, full_name: 'Rahul Deshmukh', email: 'rahul.deshmukh@campus.edu', department: 'Mechanical Engineering', year_of_study: 4, status: 'Active' }
  ],
  faculty: [
    { id: 1, full_name: 'Dr. Meera Joshi', email: 'meera.joshi@campus.edu', department: 'Computer Engineering', designation: 'HOD', status: 'Active' },
    { id: 2, full_name: 'Prof. Amit Kulkarni', email: 'amit.kulkarni@campus.edu', department: 'Information Technology', designation: 'Assistant Professor', status: 'Active' }
  ],
  attendance: [{ id: 1, student_id: 1, attendance_date: new Date().toISOString().slice(0,10), status: 'Present' }],
  complaints: [
    { id: 1, student_name: 'Priya Patil', category: 'Infrastructure', description: 'Projector in Room 204 is not working.', status: 'Open' },
    { id: 2, student_name: 'Aarav Sharma', category: 'Cleanliness', description: 'Please arrange an additional cleaning round.', status: 'In Progress' }
  ],
  notices: [
    { id: 1, title: 'Welcome to Smart Campus', body: 'Check this portal for campus updates and announcements.', audience: 'All Students', published_at: new Date().toISOString() },
    { id: 2, title: 'Project Review Schedule', body: 'Department project reviews begin next Monday.', audience: 'Final Year Students', published_at: new Date().toISOString() }
  ]
};

const keys = {
  Students: ['full_name', 'email', 'department', 'year_of_study', 'status'],
  Faculty: ['full_name', 'email', 'department', 'designation', 'status'],
  Attendance: ['student_id', 'attendance_date', 'status'],
  Complaints: ['student_name', 'category', 'description', 'status'],
  Notices: ['title', 'body', 'audience', 'published_at']
};
const labels = { full_name: 'Name', email: 'Email', department: 'Department', year_of_study: 'Year', status: 'Status', designation: 'Designation', student_id: 'Student ID', attendance_date: 'Date', student_name: 'Submitted by', category: 'Category', description: 'Description', title: 'Title', body: 'Details', audience: 'Audience', published_at: 'Published' };
const formFields = {
  Students: [
    { name: 'full_name', label: 'Full name', required: true },
    { name: 'email', label: 'Email address', type: 'email', required: true },
    { name: 'department', label: 'Department', required: true },
    { name: 'year_of_study', label: 'Year of study', type: 'number', min: 1, max: 6, required: true }
  ],
  Faculty: [
    { name: 'full_name', label: 'Full name', required: true },
    { name: 'email', label: 'Email address', type: 'email', required: true },
    { name: 'department', label: 'Department', required: true },
    { name: 'designation', label: 'Designation', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['Active', 'Inactive'], defaultValue: 'Active' }
  ],
  Attendance: [
    { name: 'student_id', label: 'Student', type: 'select', required: true, options: 'students' },
    { name: 'attendance_date', label: 'Date', type: 'date', required: true, defaultValue: new Date().toISOString().slice(0, 10) },
    { name: 'status', label: 'Attendance status', type: 'select', required: true, options: ['Present', 'Absent', 'Late'], defaultValue: 'Present' }
  ],
  Complaints: [
    { name: 'student_name', label: 'Submitted by', required: true },
    { name: 'category', label: 'Category', required: true },
    { name: 'description', label: 'Description', type: 'textarea', required: true },
    { name: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved'], defaultValue: 'Open' }
  ],
  Notices: [
    { name: 'title', label: 'Notice title', required: true },
    { name: 'body', label: 'Details', type: 'textarea', required: true },
    { name: 'audience', label: 'Audience', required: true, defaultValue: 'All Students' }
  ]
};

function pretty(value) {
  if (value == null) return '—';
  if (typeof value === 'string' && value.includes('T') && !Number.isNaN(Date.parse(value))) return new Date(value).toLocaleDateString();
  return String(value);
}

export default function App() {
  const [active, setActive] = useState('Dashboard');
  const [data, setData] = useState(fallback);
  const [apiState, setApiState] = useState('Connecting to database…');
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  async function loadData() {
    setRefreshing(true);
    try {
      const [dashboard, students, faculty, attendance, complaints, notices] = await Promise.all([
        getApi('/dashboard'), getApi('/students'), getApi('/faculty'),
        getApi('/attendance'), getApi('/complaints'), getApi('/notices')
      ]);
      setData({ dashboard, students, faculty, attendance, complaints, notices });
      setApiState('PostgreSQL connected');
    } catch {
      setApiState('Demo mode · start backend to load database');
    } finally { setRefreshing(false); }
  }
  useEffect(() => { loadData(); }, []);

  function openCreateForm() {
    setFormValues({});
    setFormError('');
    setFormOpen(true);
  }

  async function createRecord(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const path = active.toLowerCase();
    const payload = { ...formValues };
    if (active === 'Students') payload.year_of_study = Number(payload.year_of_study);
    if (active === 'Attendance') payload.student_id = Number(payload.student_id);

    try {
      const created = await postApi(`/${path}`, payload);
      setData(current => ({
        ...current,
        [path]: [created, ...current[path]],
        dashboard: {
          ...current.dashboard,
          ...(active === 'Students' ? { students: current.dashboard.students + 1 } : {}),
          ...(active === 'Faculty' ? { faculty: current.dashboard.faculty + 1 } : {}),
          ...(active === 'Notices' ? { notices: current.dashboard.notices + 1 } : {}),
          ...(active === 'Complaints' && created.status !== 'Resolved'
            ? { openComplaints: current.dashboard.openComplaints + 1 }
            : {})
        }
      }));
      setApiState('PostgreSQL connected');
      setFormOpen(false);
      setFormValues({});
    } catch (error) {
      setFormError(error.message || 'Could not save this record. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const statCards = [
    { label: 'Total Students', value: data.dashboard.students, icon: GraduationCap, tone: 'violet', note: 'Registered learners' },
    { label: 'Faculty Members', value: data.dashboard.faculty, icon: Users, tone: 'blue', note: 'Teaching & staff' },
    { label: 'Open Complaints', value: data.dashboard.openComplaints, icon: MessageSquareWarning, tone: 'orange', note: 'Needs attention' },
    { label: 'Active Notices', value: data.dashboard.notices, icon: Megaphone, tone: 'green', note: 'Campus announcements' }
  ];
  const records = active === 'Dashboard' ? [] : (data[active.toLowerCase()] || []);
  const filtered = records.filter(row => Object.values(row).join(' ').toLowerCase().includes(search.toLowerCase()));

  return <div className="app-shell">
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Building2 size={23}/></div><div><strong>Campus<span>OS</span></strong><small>SMART MANAGEMENT</small></div><button className="mobile-close" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={19}/></button></div>
      <div className="campus-switch"><div className="campus-avatar">ICE</div><div><strong>Indala College of Engineering</strong><small>Bapsai</small></div><ChevronRight size={16}/></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav>{navItems.map(item => { const Icon = item.icon; return <button key={item.label} className={`nav-item ${active === item.label ? 'active' : ''}`} onClick={() => { setActive(item.label); setSearch(''); setMobileOpen(false); }}><Icon size={18}/><span>{item.label}</span></button>; })}</nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={18}/></div><strong>Need a hand?</strong><p>Find help using your campus portal.</p><button onClick={() => setShowHelp(value => !value)}>Visit help centre <ArrowUpRight size={14}/></button>{showHelp && <p className="help-message">Please contact your college administrator for portal support.</p>}</div><div className="profile"><div className="profile-avatar">SP</div><div className="profile-text"><strong>Shubhangi Pawar</strong><small>Campus Administrator</small></div><span className="profile-dots">•••</span></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="topbar-left"><button className="menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu"><Menu size={21}/></button><div className="breadcrumb">Workspace <ChevronRight size={14}/> <strong>{active}</strong></div></div><div className="topbar-right"><div className="global-search"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search this page..." /></div><button className="icon-btn notification" aria-label="Notifications" onClick={() => setActive('Notices')}><Bell size={19}/><i/></button><div className="top-avatar">SP</div></div></header>
      <div className="page-content">
        {active === 'Dashboard' ? <Dashboard data={data} statCards={statCards} apiState={apiState} refreshing={refreshing} onRefresh={loadData} setActive={setActive}/> : <section className="module-page">
          <div className="page-heading"><div><div className="eyebrow">CAMPUS WORKSPACE</div><h1>{active}</h1><p>Manage and review your college {active.toLowerCase()} information.</p></div><button className="primary-btn" onClick={openCreateForm}><Plus size={17}/> Add {active === 'Notices' ? 'Notice' : active === 'Complaints' ? 'Complaint' : active.slice(0,-1)}</button></div>
          <div className="table-card"><div className="table-toolbar"><div><h3>{active} Directory</h3><p>{filtered.length} record{filtered.length === 1 ? '' : 's'} found</p></div><button className="secondary-btn" onClick={loadData}><RefreshCw size={15}/> Refresh</button></div>
          {filtered.length ? <div className="table-scroll"><table><thead><tr>{(keys[active] || []).map(k => <th key={k}>{labels[k] || k}</th>)}</tr></thead><tbody>{filtered.map((row,i) => <tr key={row.id || i}>{(keys[active] || []).map(k => <td key={k}>{k === 'status' ? <span className={`status-pill ${String(row[k]).toLowerCase().replace(' ','-')}`}>{pretty(row[k])}</span> : pretty(row[k])}</td>)}</tr>)}</tbody></table></div> : <div className="empty-state"><BookOpen size={30}/><strong>No records found</strong><span>Try a different search term or refresh the list.</span></div>}
          </div>
        </section>}
        <footer className="footer"><span>© 2026 CampusOS · Indala College of Engineering, Bapsai</span><span className="api-status"><i className={apiState === 'PostgreSQL connected' ? 'online' : ''}/>{apiState}</span></footer>
      </div>
    </main>
    {mobileOpen && <button className="mobile-scrim" aria-label="Close menu" onClick={() => setMobileOpen(false)}/>}
    {formOpen && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !saving) setFormOpen(false); }}>
      <section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <div className="modal-heading">
          <div><span className="eyebrow">CAMPUS WORKSPACE</span><h2 id="create-title">Add {active === 'Notices' ? 'Notice' : active === 'Complaints' ? 'Complaint' : active.slice(0, -1)}</h2><p>Enter the information below to add a new record.</p></div>
          <button type="button" className="modal-close" onClick={() => setFormOpen(false)} disabled={saving} aria-label="Close form"><X size={19}/></button>
        </div>
        <form className="create-form" onSubmit={createRecord}>
          <div className="form-fields">
            {formFields[active].map(field => (
              <label className={`form-field ${field.type === 'textarea' ? 'wide' : ''}`} key={field.name}>
                <span>{field.label}{field.required && <i> *</i>}</span>
                {field.type === 'textarea' ? (
                  <textarea required={field.required} value={formValues[field.name] ?? field.defaultValue ?? ''} onChange={event => setFormValues(current => ({ ...current, [field.name]: event.target.value }))} rows={4}/>
                ) : field.type === 'select' ? (
                  <select required={field.required} value={formValues[field.name] ?? field.defaultValue ?? ''} onChange={event => setFormValues(current => ({ ...current, [field.name]: event.target.value }))}>
                    <option value="" disabled>Select {field.label.toLowerCase()}</option>
                    {field.options === 'students'
                      ? data.students.map(student => <option key={student.id} value={student.id}>{student.full_name} (#{student.id})</option>)
                      : field.options.map(option => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input type={field.type || 'text'} min={field.min} max={field.max} required={field.required} value={formValues[field.name] ?? field.defaultValue ?? ''} onChange={event => setFormValues(current => ({ ...current, [field.name]: event.target.value }))}/>
                )}
              </label>
            ))}
          </div>
          {formError && <div className="form-error" role="alert">{formError}</div>}
          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={() => setFormOpen(false)} disabled={saving}>Cancel</button>
            <button type="submit" className="primary-btn" disabled={saving}><Plus size={16}/>{saving ? 'Saving…' : 'Save record'}</button>
          </div>
        </form>
      </section>
    </div>}
  </div>;
}

function Dashboard({ data, statCards, apiState, refreshing, onRefresh, setActive }) {
  const recentComplaints = data.complaints.slice(0, 3);
  const recentNotices = data.notices.slice(0, 3);

  const quickActions = [
    { label: 'Mark attendance', icon: CalendarCheck, tone: 'violet', action: () => setActive('Attendance') },
    { label: 'Review complaints', icon: MessageSquareWarning, tone: 'orange', action: () => setActive('Complaints') },
    { label: 'Publish notice', icon: Megaphone, tone: 'green', action: () => setActive('Notices') }
  ];

  const campusPulse = [
    { label: 'Attendance Today', value: '91.4%', detail: '+4.2% vs last week', tone: 'violet' },
    { label: 'Faculty on duty', value: '26', detail: 'Across 6 departments', tone: 'blue' },
    { label: 'Pending tasks', value: '09', detail: 'Needs action today', tone: 'orange' }
  ];

  return (
    <div className="dashboard">
      <section className="welcome-banner">
        <div className="welcome-copy">
          <div className="eyebrow light">SUNDAY, OCTOBER 18, 2026</div>
          <h1>Your campus,<br /><span>all in one place.</span></h1>
          <p>Here&apos;s what&apos;s happening across your college today.</p>
          <div className="banner-actions">
            <button className="primary-glow" onClick={() => setActive('Students')}>Explore campus <ArrowUpRight size={16} /></button>
            <button className="ghost-btn" onClick={onRefresh}>Refresh</button>
          </div>
        </div>

        <div className="welcome-art">
          <div className="art-orbit orbit-one" />
          <div className="art-orbit orbit-two" />
          <div className="art-building"><Building2 size={76} strokeWidth={1.2} /></div>
          <div className="art-float float-top"><GraduationCap size={20} /><span>Learn</span></div>
          <div className="art-float float-bottom"><CalendarCheck size={20} /><span>Organise</span></div>
          <div className="art-dot dot-one" />
          <div className="art-dot dot-two" />
        </div>

        <div className="banner-decoration">CAMPUS<br />CONNECTED</div>
      </section>

      <section className="top-metrics">
        {campusPulse.map((item) => (
          <div className={`pulse-card ${item.tone}`} key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </div>
        ))}
      </section>

      <div className="section-title-row">
        <div>
          <h2>Campus overview</h2>
          <p>A quick snapshot of your institution</p>
        </div>
        <button className="refresh-btn" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw size={15} className={refreshing ? 'spin' : ''} />
          {refreshing ? 'Refreshing' : 'Refresh data'}
        </button>
      </div>

      <section className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="stat-card" key={card.label}>
              <div className={`stat-icon ${card.tone}`}><Icon size={21} /></div>
              <div className="stat-top-label">{card.label}</div>
              <div className="stat-value">{Number(card.value).toLocaleString()}</div>
              <div className="stat-note"><span className={`mini-dot ${card.tone}`} />{card.note}</div>
              <div className={`stat-watermark ${card.tone}`}><Icon size={66} /></div>
            </article>
          );
        })}
      </section>

      <div className="dashboard-grid">
        <div className="panel-stack">
          <section className="panel complaints-panel">
            <div className="panel-heading">
              <div>
                <h3>Recent complaints</h3>
                <p>Keep track of campus requests</p>
              </div>
              <button className="text-link" onClick={() => setActive('Complaints')}>View all <ArrowUpRight size={14} /></button>
            </div>

            {recentComplaints.length ? recentComplaints.map((c) => (
              <div className="complaint-row" key={c.id}>
                <div className="complaint-icon"><MessageSquareWarning size={17} /></div>
                <div className="complaint-info">
                  <strong>{c.category}</strong>
                  <p>{c.description}</p>
                  <small>{c.student_name}</small>
                </div>
                <span className={`status-pill ${String(c.status).toLowerCase().replace(' ', '-')}`}>{c.status}</span>
              </div>
            )) : <div className="empty-inline">No complaints to show.</div>}
          </section>

          <section className="panel notices-panel">
            <div className="panel-heading">
              <div>
                <h3>Campus notices</h3>
                <p>Latest announcements</p>
              </div>
              <button className="text-link" onClick={() => setActive('Notices')}>All notices <ArrowUpRight size={14} /></button>
            </div>

            {recentNotices.length ? recentNotices.map((n) => (
              <div className="notice-row" key={n.id}>
                <div className="notice-icon"><Megaphone size={17} /></div>
                <div className="notice-info">
                  <strong>{n.title}</strong>
                  <p>{n.audience}</p>
                  <small><Clock3 size={12} /> {new Date(n.published_at).toLocaleDateString()}</small>
                </div>
                <ChevronRight size={17} className="notice-chevron" />
              </div>
            )) : <div className="empty-inline">No notices published.</div>}

            <button className="notice-action" onClick={() => setActive('Notices')}>
              <CheckCircle2 size={16} /> Keep your campus informed <ArrowUpRight size={14} />
            </button>
          </section>
        </div>

        <aside className="side-stack">
          <section className="panel mini-panel">
            <div className="panel-heading compact">
              <div>
                <h3>Quick actions</h3>
              </div>
            </div>
            <div className="quick-actions">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} className={`action-btn ${item.tone}`} onClick={item.action}>
                    <span className="action-icon"><Icon size={16} /></span>
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="panel mini-panel">
            <div className="panel-heading compact">
              <div>
                <h3>System status</h3>
              </div>
            </div>
            <div className="connection-card">
              <div className={`connection-icon ${apiState === 'PostgreSQL connected' ? 'connected' : ''}`}>
                <CheckCircle2 size={20} />
              </div>
              <div>
                <strong>Campus database</strong>
                <p>{apiState}</p>
              </div>
              <span className={`connection-dot ${apiState === 'PostgreSQL connected' ? 'connected' : ''}`} />
            </div>
          </section>

          <section className="panel mini-panel">
            <div className="panel-heading compact">
              <div>
                <h3>Campus tip</h3>
              </div>
            </div>
            <div className="tip-card">
              <div className="tip-icon"><BookOpen size={19} /></div>
              <div>
                <strong>Tip of the day</strong>
                <p>Keep student information updated to make attendance and academic reporting more accurate.</p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
