import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { configureStore } from '@reduxjs/toolkit';
import {
  getAxiosInstance, initApiConfig, resetAxiosInstance,
  registerHttpServiceStore, registerErrorHandlerStore, createSharedStore, setLogTransport,
} from '@notify-ui/shared';

const compiled = new URL('../node_modules/.cache/preferences-tests/slice.mjs', import.meta.url);
await build({
  entryPoints: [fileURLToPath(new URL('../src/store/preferencesSlice.ts', import.meta.url))],
  outfile: fileURLToPath(compiled), bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
const { default: reducer, preferencesActions: a, loadPreferences, mutatePreference } = await import(compiled.href);

const record = (subjectId, extra = {}) => ({ subjectId, optedOut: false, optedOutChannels: [], preferredChannel: null,
  quietHoursStart: null, quietHoursEnd: null, timeZone: null, language: null, updatedAt: null, ...extra });
const page = (content, totalPages = 1) => ({ content, number: 0, size: 5, totalElements: content.length, totalPages, first: true, last: true });
const response = (config, data, status = 200) => ({ config, data, status, statusText: 'OK', headers: {} });
function setup(adapter) {
  initApiConfig({ baseURL: '', getAccessToken: () => 'test-token' });
  resetAxiosInstance(); setLogTransport(() => {});
  const shared = createSharedStore({ preferences: reducer });
  registerHttpServiceStore(shared); registerErrorHandlerStore(shared);
  getAxiosInstance().defaults.adapter = adapter;
  return configureStore({ reducer: { preferences: reducer } });
}
const rejection = (config, status, message) => Promise.reject(Object.assign(new Error(message), {
  isAxiosError: true, config, response: { status, data: { message }, config, headers: {} },
}));

test('loading sends the search query and selects the first recipient', async () => {
  const requests = [];
  const store = setup(async config => { requests.push(config); return response(config, page([record('customer-42'), record('customer-7')])); });
  store.dispatch(a.setQuery('customer'));
  await store.dispatch(loadPreferences());
  assert.equal(requests[0].url, '/api/admin/recipient-preferences');
  assert.equal(requests[0].params.q, 'customer');
  const state = store.getState().preferences;
  assert.equal(state.loading, false);
  assert.equal(state.selected.subjectId, 'customer-42');
});

test('creating a recipient keeps it open even when the reloaded page does not contain it', async () => {
  const saved = record('new recipient', { optedOutChannels: ['SMS'] });
  const requests = [];
  const store = setup(async config => {
    requests.push(`${config.method} ${config.url}`);
    return config.method === 'put' ? response(config, saved) : response(config, page([record('a'), record('b')], 2));
  });
  const ok = await store.dispatch(mutatePreference({ kind: 'save', subjectId: 'new recipient', created: true,
    body: { optedOut: false, optedOutChannels: ['SMS'], preferredChannel: null, quietHoursStart: null, quietHoursEnd: null, timeZone: null, language: 'hi' } }));
  assert.equal(ok, true);
  assert.deepEqual(requests, ['put /api/admin/recipient-preferences/new%20recipient', 'get /api/admin/recipient-preferences']);
  const state = store.getState().preferences;
  assert.equal(state.selected.subjectId, 'new recipient');
  assert.equal(state.notice, 'Recipient added.');
  assert.equal(state.busy, false);
});

test('validation errors surface the server message and leave the list unchanged', async () => {
  const store = setup(config => rejection(config, 400, 'Quiet hours need both a start and an end'));
  store.dispatch(a.listLoaded({ requestId: '', records: [record('customer-42')], totalPages: 1, totalElements: 1 }));
  const ok = await store.dispatch(mutatePreference({ kind: 'save', subjectId: 'customer-42', created: false, body: {} }));
  assert.equal(ok, false);
  assert.equal(store.getState().preferences.error, 'Quiet hours need both a start and an end');
  assert.equal(store.getState().preferences.revision, 0);
});

test('removing the open recipient selects the next one', async () => {
  const store = setup(async config => response(config, '', 204));
  store.dispatch(a.listLoaded({ requestId: '', records: [record('customer-42'), record('customer-7')], totalPages: 1, totalElements: 2 }));
  assert.equal(await store.dispatch(mutatePreference({ kind: 'delete', subjectId: 'customer-42' })), true);
  const state = store.getState().preferences;
  assert.deepEqual(state.records.map(r => r.subjectId), ['customer-7']);
  assert.equal(state.selected.subjectId, 'customer-7');
});
