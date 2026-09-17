export type Field = { key: string; label: string; required?: boolean; type?: 'number' | 'boolean' | 'textarea'; initial?: string; hint?: string; min?: number; max?: number };
export type Provider = { type: string; provider: string; label: string; vendor: string; description: string; fields: Field[]; secrets: Field[] };
const field = (key: string, label: string, required = false): Field => ({ key, label, required });
export const providers: Provider[] = [
  { type: 'EMAIL', provider: 'SMTP', label: 'Email', vendor: 'SMTP', description: 'Transactional email through your mail server.', fields: [
    field('host','SMTP host',true), { ...field('port','Port'), type:'number',initial:'587',min:1,max:65535 }, field('from','Sender email',true), field('fromName','Sender name'),
    { ...field('auth','Authentication'),type:'boolean',initial:'true' }, { ...field('startTls','Require STARTTLS'),type:'boolean',initial:'true' }, { ...field('ssl','Use SSL'),type:'boolean',initial:'false' },
    ...['connectionTimeoutMs','timeoutMs','writeTimeoutMs'].map((key,i) => ({ key,label:['Connection timeout (ms)','Read timeout (ms)','Write timeout (ms)'][i],type:'number' as const,initial:'10000',min:1 })),
    { ...field('defaultHtml','HTML by default'),type:'boolean',initial:'true' }, field('subjectPrefix','Subject prefix'), { ...field('callbackAllowedIps','Callback IP allowlist'),hint:'Comma-separated IP addresses or CIDRs. Leave empty to allow any source with a valid signature.' },
  ], secrets:[field('username','SMTP username',true),field('password','SMTP password',true),field('callbackSecret','Callback signing secret')] },
  { type:'SMS',provider:'TWILIO',label:'SMS',vendor:'Twilio',description:'SMS delivery with signed status callbacks.',fields:[{ ...field('fromNumber','Sender phone number',true),hint:'International format, for example +14155552671.' },field('callbackUrl','Callback URL'),field('callbackAllowedIps','Callback IP allowlist')],secrets:[field('accountSid','Account SID',true),field('authToken','Auth token',true)] },
  { type:'WHATSAPP',provider:'META_WHATSAPP',label:'WhatsApp',vendor:'Meta',description:'Messages through the WhatsApp Cloud API.',fields:[field('phoneNumberId','Phone number ID',true),{ ...field('apiVersion','API version',true),hint:'Use the version configured for your Meta app, for example v25.0.' }],secrets:[field('accessToken','Access token',true),field('appSecret','App secret'),field('verifyToken','Verification token')] },
  { type:'PUSH',provider:'FCM',label:'Push',vendor:'Firebase',description:'Push notifications to your apps and devices.',fields:[field('projectId','Firebase project ID',true)],secrets:[{ ...field('serviceAccountJson','Service account JSON',true),type:'textarea' },field('callbackSecret','Callback signing secret')] },
  { type:'WEBHOOK',provider:'WEBHOOK',label:'Webhook',vendor:'HTTP',description:'Signed notifications delivered to your endpoint.',fields:[{ ...field('endpoint','Endpoint URL',true),hint:'HTTPS URL without credentials, query parameters, or a fragment.' },field('callbackAllowedIps','Callback IP allowlist')],secrets:[field('signingSecret','Signing secret',true),field('authorization','Authorization header')] },
  { type:'IN_APP',provider:'WEBHOOK',label:'In-app',vendor:'Webhook',description:'Recipient-aware events for your application.',fields:[field('endpoint','Endpoint URL',true),field('callbackAllowedIps','Callback IP allowlist')],secrets:[field('signingSecret','Signing secret',true),field('authorization','Authorization header')] },
];
export const availableProviders = (channels: ReadonlyArray<{ type: string }>): Provider[] =>
  providers.filter(provider => !channels.some(channel => channel.type.toUpperCase() === provider.type));

export const runtime: Field[] = [
  { key:'instances',label:'Connector instances',type:'number',initial:'1',min:1,max:100 },
  { key:'delay',label:'Retry delay (ms)',type:'number',initial:'0',min:0 },
  { key:'maxAttempts',label:'Maximum attempts',type:'number',initial:'1',min:1,max:100 },
  { key:'backOffMultiplier',label:'Backoff multiplier',type:'number',initial:'2',min:1,max:100 },
];
