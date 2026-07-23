import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Save, Search, ToggleLeft, ToggleRight, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useDispatch, useSelector } from 'react-redux';
import { PortalSidebar, ProfileMenu, httpService } from '@notify-ui/shared';
import type { AppDispatch, RootState } from './store';
import { deleteRule, fetchRules, saveRule } from './store/slices/vocabSlice';
import type { VocabRule } from './types';

const useD = () => useDispatch<AppDispatch>();
const useS = <T,>(selector: (state: RootState) => T) => useSelector<RootState, T>(selector);

const ACCENT = '#facc15';
const PRIORITY_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#facc15',
  4: '#22c55e',
  5: '#94a3b8',
};

const configuredBase = import.meta.env.VITE_PORTAL_BASE;
const defaultBase =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/portals/vocab-rules')
    ? '/portals/vocab-rules/'
    : '/';
const BASE =
  typeof window !== 'undefined' && window.location.protocol === 'file:'
    ? undefined
    : configuredBase ?? defaultBase;

type VocabularyNode = {
  id: number;
  term: string;
  description?: string;
  type?: string;
  children: VocabularyNode[];
};

export default function App() {
  return (
    <BrowserRouter basename={BASE}>
      <div className="app-shell">
        <PortalSidebar />
        <header className="topbar">
          <div>
            <div className="topbar-title">Vocab Rules</div>
            <div className="topbar-subtitle">Manage vocabulary-based matching rules</div>
          </div>
          <ProfileMenu />
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RuleList />} />
            <Route path="/new" element={<RuleEditor isNew />} />
            <Route path="/edit/:id" element={<RuleEditor />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function VocabularyTree() {
  const [items, setItems] = useState<VocabularyNode[]>([]);
  const [open, setOpen] = useState<Set<number>>(new Set());

  useEffect(() => {
    void httpService.get<VocabularyNode[]>('/api/admin/vocabulary', { ttlMs: 0 }).then(setItems);
  }, []);

  const toggle = (id: number) => {
    setOpen(current => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <BookOpen size={15} /> Vocabulary
        </span>
      </div>
      <div className="card-body">
        {items.map(node => (
          <VocabularyTreeNode key={node.id} node={node} depth={0} open={open} onToggle={toggle} />
        ))}
        {!items.length && <span style={{ color: '#8d855f' }}>No vocabulary terms found.</span>}
      </div>
    </div>
  );
}

function VocabularyTreeNode({
  node,
  depth,
  open,
  onToggle,
}: {
  node: VocabularyNode;
  depth: number;
  open: Set<number>;
  onToggle: (id: number) => void;
}) {
  const expanded = open.has(node.id);

  return (
    <div style={{ marginLeft: depth * 18 }}>
      <button
        className="btn btn-ghost"
        style={{ padding: '4px 0', border: 0, color: '#fde047' }}
        onClick={() => onToggle(node.id)}
      >
        {node.children.length ? (expanded ? 'v' : '>') : '-'} {node.term}
      </button>
      {node.description && (
        <span style={{ marginLeft: 8, color: '#8d855f', fontSize: 12 }}>
          {node.description}
        </span>
      )}
      {expanded && node.children.map(child => (
        <VocabularyTreeNode
          key={child.id}
          node={child}
          depth={depth + 1}
          open={open}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

function RuleList() {
  const dispatch = useD();
  const { items, loading } = useS(state => state.vocab) as {
    items: VocabRule[];
    loading: boolean;
  };
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchRules());
  }, [dispatch]);

  const filtered = useMemo(() => filterRules(items, search), [items, search]);

  return (
    <>
      <VocabularyTree />
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <BookOpen size={15} /> Vocabulary Rules
          </span>
          <button className="btn btn-primary" onClick={() => navigate('/new')}>
            <Plus size={13} /> New Rule
          </button>
        </div>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="search-input">
            <Search size={14} />
            <input
              placeholder="Search by name or event..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          {loading ? (
            <SkeletonRows />
          ) : (
            <RulesTable
              rules={filtered}
              onEdit={rule => navigate(`/edit/${rule.id}`)}
              onDelete={id => {
                if (confirm('Delete this rule?')) dispatch(deleteRule(id));
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}

function SkeletonRows() {
  return (
    <div style={{ padding: 24 }}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="skeleton" style={{ height: 40, marginBottom: 8, borderRadius: 6 }} />
      ))}
    </div>
  );
}

function RulesTable({
  rules,
  onEdit,
  onDelete,
}: {
  rules: VocabRule[];
  onEdit: (rule: VocabRule) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Event</th>
          <th>Priority</th>
          <th>Action</th>
          <th>Hits</th>
          <th>Last Hit</th>
          <th>Status</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {rules.map(rule => (
          <RuleRow key={rule.id} rule={rule} onEdit={onEdit} onDelete={onDelete} />
        ))}

        {!rules.length && (
          <tr>
            <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: '#475569' }}>
              No vocab rules found
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function RuleRow({
  rule,
  onEdit,
  onDelete,
}: {
  rule: VocabRule;
  onEdit: (rule: VocabRule) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <tr style={{ cursor: 'pointer' }} onClick={() => onEdit(rule)}>
      <td style={{ fontWeight: 500, color: '#f1f5f9' }}>{rule.name}</td>
      <td>
        <span className="mono" style={{ color: '#94a3b8', fontSize: 11 }}>{rule.eventKey}</span>
      </td>
      <td>
        <span style={{ color: PRIORITY_COLORS[rule.priority] ?? '#94a3b8', fontWeight: 600 }}>
          P{rule.priority}
        </span>
      </td>
      <td style={{ color: '#64748b', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {rule.action}
      </td>
      <td style={{ textAlign: 'center', color: rule.hitCount > 0 ? ACCENT : '#334155' }}>
        {rule.hitCount.toLocaleString()}
      </td>
      <td style={{ color: '#475569' }}>
        {rule.lastHitAt ? format(parseISO(rule.lastHitAt), 'MMM d HH:mm') : '-'}
      </td>
      <td>
        <span className={rule.active ? 'badge badge-active' : 'badge badge-inactive'}>
          {rule.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button
          className="btn-icon"
          style={{ color: '#ef4444' }}
          onClick={event => {
            event.stopPropagation();
            onDelete(rule.id);
          }}
        >
          <Trash2 size={13} />
        </button>
      </td>
    </tr>
  );
}

function RuleEditor({ isNew }: { isNew?: boolean }) {
  const navigate = useNavigate();
  const dispatch = useD();
  const { saving } = useS(state => state.vocab) as { saving: boolean };
  const [form, setForm] = useState<Partial<VocabRule>>({
    name: '',
    eventKey: '',
    description: '',
    condition: '',
    action: '',
    priority: 3,
    active: true,
  });

  const set = (key: keyof VocabRule, value: unknown) => {
    setForm(previous => ({ ...previous, [key]: value }));
  };

  const save = async () => {
    await dispatch(saveRule({ id: null, data: form }));
    navigate('/');
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{isNew ? 'New Vocab Rule' : 'Edit Rule'}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/')}>
            <X size={13} /> Cancel
          </button>
          <button className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            <Save size={13} />{saving ? 'Saving...' : 'Save Rule'}
          </button>
        </div>
      </div>
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Field label="Rule Name">
          <input
            className="form-input"
            value={form.name ?? ''}
            onChange={event => set('name', event.target.value)}
            placeholder="qualify-premium-order"
          />
        </Field>
        <Field label="Event Key">
          <input
            className="form-input"
            value={form.eventKey ?? ''}
            onChange={event => set('eventKey', event.target.value)}
            placeholder="order.placed"
          />
        </Field>
        <Field label="Priority (1=highest)">
          <select
            className="form-input"
            value={form.priority}
            onChange={event => set('priority', Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map(priority => (
              <option key={priority} value={priority}>P{priority}</option>
            ))}
          </select>
        </Field>
        <Field label="Active">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
            <button className="btn-icon" onClick={() => set('active', !form.active)}>
              {form.active ? (
                <ToggleRight size={24} style={{ color: '#22c55e' }} />
              ) : (
                <ToggleLeft size={24} style={{ color: '#475569' }} />
              )}
            </button>
            <span style={{ color: form.active ? '#22c55e' : '#475569', fontSize: 13 }}>
              {form.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </Field>
        <div style={{ gridColumn: '1 / -1' }}>
          <Field label="Description">
            <input
              className="form-input"
              value={form.description ?? ''}
              onChange={event => set('description', event.target.value)}
              placeholder="Describe what this rule does"
            />
          </Field>
        </div>
        <Field label="Condition (SpEL expression)">
          <textarea
            className="form-input"
            rows={4}
            style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
            value={form.condition ?? ''}
            onChange={event => set('condition', event.target.value)}
            placeholder="#payload.amount > 500 and #payload.tier == 'PREMIUM'"
          />
        </Field>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {children}
    </div>
  );
}

function filterRules(rules: VocabRule[], search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return rules;

  return rules.filter(rule => {
    return rule.name.toLowerCase().includes(term)
      || rule.eventKey.toLowerCase().includes(term);
  });
}
