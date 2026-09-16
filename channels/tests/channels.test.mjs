import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { configureStore } from '@reduxjs/toolkit';
import {
  httpService, getAxiosInstance, initApiConfig, resetAxiosInstance,
  registerHttpServiceStore, registerErrorHandlerStore, createSharedStore,
  setLogTransport, setLogLevel, setEntry,
} from '@notify-ui/shared';

const compiled = new URL('../node_modules/.cache/channels-tests/slice.mjs', import.meta.url);
await build({
  entryPoints: [fileURLToPath(new URL('../src/store/channelsSlice.ts', import.meta.url))],
  outfile: fileURLToPath(compiled), bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
const { default: reducer, channelsActions: a, loadChannels, loadDetails, mutateChannel } = await import(compiled.href);
const channel = id => ({ id, type: 'EMAIL', provider: 'SMTP', enabled: false, settings: {}, secretRef: null });
const response = (config, data) => ({ config, data, status: 200, statusText: 'OK', headers: {} });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
function setup(adapter) {
  initApiConfig({ baseURL: '', enableRequestLogging: true, getAccessToken: () => 'test-token' });
  resetAxiosInstance();
  const logs = []; setLogLevel('debug'); setLogTransport(entry => logs.push(entry));
  const store = createSharedStore({ channels: reducer });
  const actions = [];
  // Observe the same plain actions DevTools sees, after thunk middleware.
  const observed = configureStore({ reducer: { channels: reducer },
    middleware: getDefault => getDefault().concat(() => next => action => { actions.push(action); return next(action); }),
  });
  registerHttpServiceStore(store); registerErrorHandlerStore(store);
  getAxiosInstance().defaults.adapter = adapter;
  return { store: observed, shared: store, actions, logs };
}

test('latest channel list wins even when an older request finishes last', async () => {
  const first = deferred(), second = deferred(); let calls = 0;
  const { store } = setup(async config => response(config, await (++calls === 1 ? first.promise : second.promise)));
  const old = store.dispatch(loadChannels()), current = store.dispatch(loadChannels());
  await new Promise(resolve => setImmediate(resolve));
  second.resolve([channel('new')]); await current;
  first.resolve([channel('old')]); await old;
  assert.equal(store.getState().channels.selectedId, 'new');
});

test('switching channel invalidates in-flight metadata and metrics', async () => {
  const pending = deferred();
  const { store } = setup(async config => response(config, await pending.promise));
  store.dispatch(a.selectChannel('first'));
  const task = store.dispatch(loadDetails());
  store.dispatch(a.selectChannel('second'));
  pending.resolve({ configured: true, attempts: 99 }); await task;
  assert.equal(store.getState().channels.metadata, null);
  assert.equal(store.getState().channels.metrics, null);
});

test('credential requests use shared auth without exposing secrets to actions, state, cache, or logs', async () => {
  const secret = 'private-credential-test-value'; const requests = [];
  const { store, shared, actions, logs } = setup(async config => {
    requests.push(config);
    return response(config, config.method === 'get' ? [channel('mail')] : { echoed: secret });
  });
  assert.equal(await store.dispatch(mutateChannel({ kind: 'credentials', id: 'mail', replace: false,
    credentials: { password: secret } }, 'Saved')), true);
  assert.equal(requests[0].headers.get('Authorization'), 'Bearer test-token');
  assert.ok(requests[0].data.includes(secret));
  assert.equal(requests[0].sensitive, true);
  for (const value of [actions, store.getState(), shared.getState(), logs]) assert.ok(!JSON.stringify(value).includes(secret));
  assert.equal(store.getState().channels.notice, 'Saved');
  assert.equal(store.getState().channels.busy, false);
});

test('server errors that echo credentials are sanitized and rendered inline', async () => {
  const secret = 'private-failed-credential';
  const { store, shared, actions, logs } = setup(async config => {
    throw { isAxiosError: true, config, message: secret, response: { status: 400, data: { message: secret } } };
  });
  assert.equal(await store.dispatch(mutateChannel({ kind: 'credentials', id: 'mail', replace: true,
    credentials: { password: secret } }, 'Saved')), false);
  assert.match(store.getState().channels.error, /required fields/);
  assert.equal(store.getState().channels.busy, false);
  for (const value of [actions, store.getState(), shared.getState(), logs]) assert.ok(!JSON.stringify(value).includes(secret));
});

test('sensitive GET skips caching even when a TTL is explicitly requested', async () => {
  let calls = 0;
  const { shared, logs } = setup(async config => { calls++; return response(config, { password: 'sensitive-get-value' }); });
  await httpService.get('/secret', { sensitive: true, ttlMs: 10000 });
  await httpService.get('/secret', { sensitive: true, ttlMs: 10000 });
  assert.equal(calls, 2);
  assert.deepEqual(shared.getState().cache.entries, {});
  assert.ok(!JSON.stringify(logs).includes('sensitive-get-value'));
});

test('cancelled requests do not produce failure actions or global errors', async () => {
  const pending = deferred();
  const { store, actions, logs } = setup(async config => response(config, await pending.promise));
  const controller = new AbortController();
  const task = store.dispatch(loadChannels(controller.signal));
  controller.abort(); pending.resolve([]); await task;
  assert.equal(actions.some(action => action.type === a.listFailed.type), false);
  assert.equal(logs.some(log => log.level === 'error'), false);
});

test('regular shared requests retain caching and logging', async () => {
  let calls = 0;
  const { logs } = setup(async config => { calls++; return response(config, { ordinary: true }); });
  await httpService.get('/ordinary'); await httpService.get('/ordinary');
  assert.equal(calls, 1);
  assert.ok(logs.some(log => log.context?.data?.ordinary));
});


test('selecting the current channel preserves its loaded details', () => {
  const { store } = setup(async config => response(config, {}));
  store.dispatch(a.selectChannel('mail'));
  store.dispatch(a.detailsStarted('current'));
  store.dispatch(a.detailsLoaded({ requestId: 'current', metadata: { configured: true }, metrics: { attempts: 4 } }));
  store.dispatch(a.selectChannel('mail'));
  store.dispatch(a.setDays(7));
  assert.equal(store.getState().channels.metrics.attempts, 4);
  assert.equal(store.getState().channels.detailsLoading, false);
});

test('channel mutations route through shared HTTP and refresh the list', async () => {
  const requests = [];
  const { store } = setup(async config => {
    requests.push([config.method, config.url]);
    return response(config, config.method === 'get' ? [channel('mail')] : channel('mail'));
  });
  for (const [command, method, path] of [
    [{ kind: 'create', body: { type: 'EMAIL' } }, 'post', '/api/v1/channels'],
    [{ kind: 'settings', id: 'mail', body: { settings: { host: 'smtp.example' } } }, 'put', '/api/v1/channels/mail'],
    [{ kind: 'activation', id: 'mail', enabled: true }, 'patch', '/api/v1/channels/mail/activation'],
    [{ kind: 'rotate', id: 'mail' }, 'post', '/api/v1/channels/mail/credentials/rotate'],
    [{ kind: 'revoke', id: 'mail' }, 'delete', '/api/v1/channels/mail/credentials'],
  ]) {
    requests.length = 0;
    assert.equal(await store.dispatch(mutateChannel(command, 'Saved')), true);
    assert.deepEqual(requests, [[method, path], ['get', '/api/v1/channels']]);
  }
});


test('local mutation errors still roll back their optimistic cache update', async () => {
  const { shared } = setup(async config => {
    throw { isAxiosError: true, config, response: { status: 500, data: {} } };
  });
  shared.dispatch(setEntry({ key: '/settings', data: { enabled: false }, ttlMs: 10000 }));
  const modal = shared.getState().modal;
  await assert.rejects(httpService.patch('/settings', {
    errorHandling: 'local', invalidateKey: '/settings', data: { enabled: true },
    optimisticUpdate: store => store.dispatch(setEntry({ key: '/settings', data: { enabled: true }, ttlMs: 10000 })),
  }));
  assert.equal(shared.getState().cache.entries['/settings'].data.enabled, false);
  assert.deepEqual(shared.getState().cache.rollbacks, {});
  assert.deepEqual(shared.getState().modal, modal);
});
