import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Download, Eye, FileText, Globe, LoaderCircle, Pencil, Plus, RefreshCw, Trash2, Upload, Wand2, X } from 'lucide-react';
import { PaginationControls, PortalSidebar, ProfileMenu, getAxiosInstance, getPaginated, httpService } from '@notify-ui/shared';

const VALUE_TYPES = ['TEXT', 'IMAGE', 'FILE', 'NUMBER', 'DATE', 'RANGE'] as const;

type ValueType = typeof VALUE_TYPES[number];

type DomainContent = {
  id: string;
  keyName?: string;
  description?: string;
  content?: string;
  type?: string;
  valueType?: ValueType;
  clientId?: string;
  version?: number;
};

type Artifact = {
  id: string;
  name: string;
  mediaType: string;
  sizeBytes: number;
  storageStatus: string;
  indexStatus: string;
  version: number;
  createdAt: string;
};

export default function App() {
  const [items, setItems] = useState<DomainContent[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editorValue, setEditorValue] = useState<DomainContent | null>(null);
  const [creating, setCreating] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [generating, setGenerating] = useState(false);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const result = await getPaginated<DomainContent>('/api/admin/data/domain-content', {
      page,
      ttlMs: 0,
    });
    setItems(result.content);
    setTotalPages(result.totalPages);
  };

  useEffect(() => {
    void load();
  }, [page]);

  const loadArtifacts = async () => {
    const result = await httpService.get<Artifact[]>('/api/artifacts', {
      params: { limit: 100 },
      ttlMs: 0,
    });
    setArtifacts(result);
  };

  useEffect(() => {
    void loadArtifacts();
  }, []);

  const uploadArtifact = async () => {
    if (!selectedFile) return;
    const form = new FormData();
    form.append('file', selectedFile);
    setUploading(true);
    try {
      await httpService.post<Artifact>('/api/artifacts/ingest', {
        data: form,
        headers: { 'Content-Type': 'multipart/form-data' },
        successModal: {
          title: 'File uploaded',
          message: `${selectedFile.name} was accepted for processing.`,
          variant: 'success',
          autoCloseMs: 2200,
        },
        timeoutMs: 120_000,
      });
      setSelectedFile(null);
      await loadArtifacts();
    } finally {
      setUploading(false);
    }
  };

  const openArtifact = async (artifact: Artifact, download: boolean) => {
    const axios = getAxiosInstance();
    const endpoint = download ? 'fetch' : 'view';
    const response = await axios.get<Blob>(
      `/api/artifacts/${endpoint}/${encodeURIComponent(artifact.id)}`,
      { responseType: 'blob' },
    );
    const url = URL.createObjectURL(response.data);
    if (download) {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = artifact.name;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  };

  const deleteContent = async (id: string) => {
    if (!window.confirm('Delete this domain content entry?')) return;

    await httpService.delete(`/api/admin/data/domain-content/${id}`, { successModal: null });
    await load();
  };

  const closeEditor = () => {
    setEditorValue(null);
    setCreating(false);
  };

  const generateDomainContent = async () => {
    setGenerating(true);
    try {
      await httpService.post<DomainContent[]>('/api/admin/data/ingest-website', {
        data: {
          businessName,
          websiteUrl,
        },
        successModal: {
          title: 'Domain content generated',
          message: 'Business content keys have been saved.',
          variant: 'success',
          autoCloseMs: 2200,
        },
        timeoutMs: 90_000,
      });
      await load();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <BrowserRouter>
      <div className="app-shell">
        <PortalSidebar />
        <header className="topbar">
          <div>
            <div className="topbar-title">Domain Context</div>
            <div className="topbar-subtitle">Manage context related to your business</div>
          </div>
          <ProfileMenu />
        </header>

        <main className="main-content">
          <div className="content-source-grid">
            <section className="card">
              <div className="card-header">
                <span className="card-title">
                  <Wand2 size={15} /> Generate content
                </span>
              </div>
              <div className="card-body generation-form">
                <TextField
                  label="Business name"
                  value={businessName}
                  disabled={generating}
                  onChange={setBusinessName}
                />
                <TextField
                  label="Website link"
                  value={websiteUrl}
                  disabled={generating}
                  onChange={setWebsiteUrl}
                />
                <button
                  className="btn btn-primary generation-action"
                  aria-busy={generating}
                  disabled={generating || !businessName.trim() || !websiteUrl.trim()}
                  onClick={() => void generateDomainContent()}
                >
                  {generating ? <LoaderCircle className="spin-icon" size={14} /> : <Wand2 size={14} />}
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </section>

            <section className="card">
              <div className="card-header">
                <span className="card-title">
                  <Upload size={15} /> Upload file
                </span>
              </div>
              <div className="card-body artifact-upload">
                <label className="artifact-picker">
                  <FileText size={22} />
                  <span>
                    <strong>{selectedFile?.name || 'Choose a file'}</strong>
                    <small>
                      {selectedFile
                        ? `${formatBytes(selectedFile.size)} · ${selectedFile.type || 'Unknown type'}`
                        : 'The file will be stored and indexed as an artifact.'}
                    </small>
                  </span>
                  <input
                    type="file"
                    disabled={uploading}
                    onChange={event => setSelectedFile(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  className="btn btn-primary artifact-upload-action"
                  disabled={!selectedFile || uploading}
                  onClick={() => void uploadArtifact()}
                >
                  {uploading ? <LoaderCircle className="spin-icon" size={14} /> : <Upload size={14} />}
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </section>
          </div>

          <section className="card">
            <div className="card-header">
              <span className="card-title">
                <FileText size={15} /> Files
              </span>
              <button className="btn-icon" title="Refresh files" onClick={() => void loadArtifacts()}>
                <RefreshCw size={14} />
              </button>
            </div>
            <ArtifactTable artifacts={artifacts} onOpen={openArtifact} />
          </section>

          <section className="card">
            <div className="card-header">
              <span className="card-title">
                <Globe size={15} /> Content entries
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-icon" title="Refresh content" onClick={() => void load()}>
                  <RefreshCw size={14} />
                </button>
                <button className="btn btn-primary" onClick={() => setCreating(true)}>
                  <Plus size={14} /> New entry
                </button>
              </div>
            </div>
            <ContentTable items={items} onEdit={setEditorValue} onDelete={deleteContent} />
            <PaginationControls
              page={page}
              totalPages={totalPages}
              onChange={setPage}
              alwaysVisible
            />
          </section>
        </main>

        {(creating || editorValue) && (
          <ContentEditor initialValue={editorValue} onClose={closeEditor} onSaved={load} />
        )}
      </div>
    </BrowserRouter>
  );
}

function ArtifactTable({
  artifacts,
  onOpen,
}: {
  artifacts: Artifact[];
  onOpen: (artifact: Artifact, download: boolean) => Promise<void>;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Size</th>
            <th>Storage</th>
            <th>Index</th>
            <th>Uploaded</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {artifacts.map(artifact => (
            <tr key={artifact.id}>
              <td>
                <span className="artifact-name"><FileText size={14} /> {artifact.name}</span>
              </td>
              <td className="mono">{artifact.mediaType}</td>
              <td>{formatBytes(artifact.sizeBytes)}</td>
              <td><StatusBadge value={artifact.storageStatus} /></td>
              <td><StatusBadge value={artifact.indexStatus} /></td>
              <td>{formatDate(artifact.createdAt)}</td>
              <td>
                <div className="artifact-actions">
                  <button className="btn-icon" title="View file" onClick={() => void onOpen(artifact, false)}>
                    <Eye size={14} />
                  </button>
                  <button className="btn-icon" title="Download file" onClick={() => void onOpen(artifact, true)}>
                    <Download size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {!artifacts.length && (
            <tr>
              <td colSpan={7} className="empty-table">No uploaded files found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.toLowerCase();
  const style = ['stored', 'ready', 'indexed', 'complete'].includes(normalized)
    ? 'badge-success'
    : ['failed', 'error'].includes(normalized) ? 'badge-failed' : 'badge-pending';
  return <span className={`badge ${style}`}>{value}</span>;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function ContentTable({
  items,
  onEdit,
  onDelete,
}: {
  items: DomainContent[];
  onEdit: (item: DomainContent) => void;
  onDelete: (id: string) => Promise<void>;
}) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Domain Key</th>
            <th>Description</th>
            <th>Value</th>
            <th>Value Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td className="mono" style={{ color: '#fde047' }}>{item.keyName || '-'}</td>
              <td>{item.description || '-'}</td>
              <td style={{ maxWidth: 380, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.content || '-'}
              </td>
              <td>{item.valueType || 'TEXT'}</td>
              <td>
                <div style={{ display: 'flex', gap: 5 }}>
                  <button className="btn-icon" title="Edit content" onClick={() => onEdit(item)}>
                    <Pencil size={14} />
                  </button>
                  <button
                    className="btn-icon"
                    title="Delete content"
                    style={{ color: '#ef4444' }}
                    onClick={() => void onDelete(item.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}

          {!items.length && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#8d855f' }}>
                No domain content entries found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ContentEditor({
  initialValue,
  onClose,
  onSaved,
}: {
  initialValue: DomainContent | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState<DomainContent>(
    initialValue ?? { id: '', keyName: '', description: '', content: '', type: 'FULL', valueType: 'TEXT' },
  );

  const save = async () => {
    const body = {
      ...value,
      type: value.type || 'FULL',
      valueType: value.valueType || 'TEXT',
    };

    if (initialValue) {
      await httpService.put(`/api/admin/data/domain-content/${initialValue.id}`, {
        data: body,
        successModal: null,
      });
    } else {
      await httpService.post('/api/admin/data/domain-content', {
        data: body,
        successModal: null,
      });
    }

    await onSaved();
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">
            {initialValue ? 'Edit domain content' : 'New domain content'}
          </span>
          <button className="btn-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
          <TextField
            label="Domain key"
            value={value.keyName ?? ''}
            onChange={keyName => setValue({ ...value, keyName })}
          />
          <TextField
            label="Description"
            value={value.description ?? ''}
            onChange={description => setValue({ ...value, description })}
          />
          <label className="form-group">
            <span className="form-label">Value type</span>
            <select
              className="form-input"
              value={value.valueType || 'TEXT'}
              onChange={event => setValue({ ...value, valueType: event.target.value as ValueType })}
            >
              {VALUE_TYPES.map(type => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="form-group">
            <span className="form-label">Value</span>
            <textarea
              className="form-input"
              rows={6}
              value={value.content ?? ''}
              onChange={event => setValue({ ...value, content: event.target.value })}
            />
          </label>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => void save()}>Save</button>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="form-group">
      <span className="form-label">{label}</span>
      <input
        className="form-input"
        value={value}
        disabled={disabled}
        onChange={event => onChange(event.target.value)}
      />
    </label>
  );
}
