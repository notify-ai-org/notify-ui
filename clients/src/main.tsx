import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { KeyRound, Plus, RefreshCw, X } from 'lucide-react';
import {
  ModalProvider,
  PaginationControls,
  PortalSidebar,
  ProfileMenu,
  createSharedStore,
  getPaginated,
  httpService,
  initApiConfig,
  registerErrorHandlerStore,
  registerHttpServiceStore,
} from '@notify-ui/shared';
import '../../events/src/styles/global.css';

type Client = {
  id: string;
  clientId: string;
  applicationName?: string;
  basePackage?: string;
  status?: string;
  expiresAt?: string;
  createdAt?: string;
};

type Credentials = {
  clientId: string;
  tenantId: string;
  apiKey: string;
  apiSecret: string;
  expiresAt: string;
};

initApiConfig({
  baseURL: '',
  getAccessToken: () => document.cookie.match(/notify_access_token=([^;]+)/)?.[1] ?? null,
});

const store = createSharedStore();
registerHttpServiceStore(store);
registerErrorHandlerStore(store);

function ClientsApp() {
  const [clients, setClients] = useState<Client[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [creating, setCreating] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  const load = async () => {
    const response = await getPaginated<Client>('/api/admin/clients', { page, ttlMs: 0 });
    setClients(response.content);
    setTotalPages(response.totalPages);
  };

  useEffect(() => {
    void load();
  }, [page]);

  const handleCreated = async (credential: Credentials) => {
    await load();
    setCreating(false);
    setCredentials(credential);
  };

  return (
    <div className="app-shell">
      <PortalSidebar />
      <header className="topbar">
        <div>
          <div className="topbar-title">Clients</div>
          <div className="topbar-subtitle">Applications registered for this tenant</div>
        </div>
        <ProfileMenu />
      </header>

      <main className="main-content">
        <section className="card">
          <div className="card-header">
            <span className="card-title">
              <KeyRound size={15} /> Clients
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-icon" title="Refresh clients" onClick={() => void load()}>
                <RefreshCw size={14} />
              </button>
              <button className="btn btn-primary" onClick={() => setCreating(true)}>
                <Plus size={14} /> Generate client
              </button>
            </div>
          </div>
          <ClientTable clients={clients} />
          <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
        </section>
      </main>

      {creating && (
        <GenerateClientDialog
          onClose={() => setCreating(false)}
          onCreated={handleCreated}
        />
      )}

      {credentials && (
        <CredentialsDialog
          credentials={credentials}
          onClose={() => setCredentials(null)}
        />
      )}
    </div>
  );
}

function ClientTable({ clients }: { clients: Client[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Application</th>
            <th>Client ID</th>
            <th>Base Package</th>
            <th>Status</th>
            <th>Expires</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.applicationName || '-'}</td>
              <td className="mono" style={{ color: '#fde047' }}>{client.clientId}</td>
              <td className="mono">{client.basePackage || '-'}</td>
              <td>{client.status || 'ACTIVE'}</td>
              <td>{client.expiresAt || 'Never'}</td>
              <td>{client.createdAt ? new Date(client.createdAt).toLocaleString() : '-'}</td>
            </tr>
          ))}

          {!clients.length && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#8d855f' }}>
                No clients registered for this tenant.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function GenerateClientDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (credentials: Credentials) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const result = await httpService.post<Credentials>('/api/admin/clients/generate', {
        successModal: null,
      });
      await onCreated(result.data);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Generate client</span>
          <button className="btn-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-body" style={{ color: '#d0c9a8', lineHeight: 1.6 }}>
          A new client ID and secret will be created. Application name and package are
          registered later by the client SDK during bootstrap.
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            {saving ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: Credentials;
  onClose: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <span className="modal-title">Client credentials</span>
          <button className="btn-icon" onClick={onClose}>
            <X size={15} />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gap: 12 }}>
          <p style={{ color: '#facc15', margin: 0 }}>
            Store the secret now. It is not shown in the client list.
          </p>
          <Credential label="Client ID" value={credentials.clientId} />
          <Credential label="API Key" value={credentials.apiKey} />
          <Credential label="API Secret" value={credentials.apiSecret} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}

function Credential({ label, value }: { label: string; value: string }) {
  return (
    <label className="form-group">
      <span className="form-label">{label}</span>
      <input className="form-input mono" value={value} readOnly />
    </label>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ModalProvider>
        <ClientsApp />
      </ModalProvider>
    </Provider>
  </React.StrictMode>,
);
