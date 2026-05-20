import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';

/* ── CodeBlock ── */
const CodeBlock = ({ code, language = 'java' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ position: 'relative', margin: '2rem 0' }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ position: 'absolute', right: '1rem', top: '1rem', zIndex: 10 }}>
        <button onClick={handleCopy} style={{ padding: '0.5rem', borderRadius: '0.5rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}>
          {copied ? <Check size={16} color="#4ade80" /> : <Copy size={16} color="#9ca3af" />}
        </button>
      </div>
      <div style={{ position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, background: 'linear-gradient(to right,rgba(234,179,8,0.2),rgba(251,146,60,0.2))', borderRadius: '1rem', filter: 'blur(4px)', opacity: hovered ? 1 : 0, transition: 'opacity 500ms' }} />
      <pre style={{ position: 'relative', overflowX: 'auto', padding: '1.5rem', borderRadius: '0.75rem', backgroundColor: '#0d0d0f', border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.875rem', lineHeight: 1.625 }}>
        <code style={{ display: 'block', color: '#d1d5db' }}>{code}</code>
      </pre>
    </div>
  );
};

/* ── All annotation data (ported verbatim from docs/SDKGuide.jsx) ── */
const MAVEN_CODE = `<dependency>
    <groupId>com.notify.agent</groupId>
    <artifactId>vocabulary-agent-client</artifactId>
    <version>1.0.0</version>
</dependency>`;

const ANNOTATIONS = [
  {
    id: 'enable-notify', name: '@EnableNotify', target: 'Class', emoji: '⚡', tagline: 'Bootstrap the SDK', description: 'Place this on a Spring @Configuration class to activate the Notify.ai SDK. It scans the given base package and registers all annotation processors.',
    attributes: [{ name: 'basePackage', type: 'String', dflt: '""', desc: 'Root package to scan for Notify annotations.' }],
    code: `@Configuration\n@EnableNotify(basePackage = "com.notify.ecommerce")\npublic class NotifyConfig {\n    // No additional beans needed — the SDK auto-wires everything.\n}`
  },
  {
    id: 'event', name: '@Event', target: 'Method', emoji: '🎯', tagline: 'Declare an event', description: 'Intercepts a method and wraps its return value as a typed event payload. The SDK serialises it and pushes it asynchronously to the ACP server.',
    attributes: [
      { name: 'key', type: 'String', dflt: '', desc: 'Unique event identifier.' },
      { name: 'description', type: 'String', dflt: '""', desc: 'Human-readable description shown to agents.' },
      { name: 'eventType', type: 'String', dflt: '', desc: '"static" or "deferred".' },
      { name: 'scheduleIntent', type: 'String', dflt: '', desc: '"immediate" or "deferred".' },
      { name: 'preferredTimeWindow', type: 'String', dflt: '""', desc: 'Time window hint, e.g. "09:00-21:00".' },
      { name: 'priority', type: 'int', dflt: '', desc: 'Dispatch priority.' },
      { name: 'payload', type: 'Class<?>', dflt: 'Void.class', desc: 'Explicit payload type.' },
    ],
    code: `@Event(key="ORDER_PLACED", description="Customer placed an order",\n       eventType="static", scheduleIntent="immediate", priority=5,\n       payload=OrderPayload.class)\npublic OrderPayload placeOrder(OrderPayload payload) {\n    orders.save(payload);\n    return payload;\n}`
  },
  {
    id: 'subject-supplier', name: '@SubjectSupplier', target: 'Method', emoji: '👤', tagline: 'Resolve recipients', description: 'Marks a method that returns the List<Subject> for a specific event key.',
    attributes: [{ name: 'event', type: 'String', dflt: '', desc: 'Event key this supplier is bound to.' }, { name: 'description', type: 'String', dflt: '""', desc: 'Human-readable description.' }],
    code: `@SubjectSupplier(event="ORDER_PLACED", description="Resolves order customer to email recipients")\npublic List<Subject> getOrderSubjects(OrderPayload payload) {\n    Customer c = customers.get(payload.getCustomerId());\n    return List.of(new EmailSubject(c.getId(), c.getEmail(), null, null, null, Map.of("firstName", c.getName())));\n}`
  },
  {
    id: 'vocabulary-supplier', name: '@VocabularySupplier', target: 'Method', emoji: '📚', tagline: 'Enrich event context', description: 'Identifies a method that enriches the event payload before it is handed to the AI agents.',
    attributes: [{ name: 'event', type: 'String', dflt: '', desc: 'Event key this supplier enriches.' }, { name: 'description', type: 'String', dflt: '""', desc: 'Human-readable description.' }],
    code: `@VocabularySupplier(event="ORDER_PLACED", description="Enriches order with shipping address")\npublic OrderPayload orderVocabulary(OrderPayload payload) {\n    Customer c = customers.get(payload.getCustomerId());\n    if (c != null && payload.getShippingAddress() == null)\n        payload.setShippingAddress("Default address for " + c.getName());\n    return payload;\n}`
  },
  {
    id: 'rule', name: '@Rule', target: 'Method', emoji: '📏', tagline: 'Gate notifications', description: 'Marks a boolean-returning method as a business rule guard. Returning false suppresses the notification.',
    attributes: [{ name: 'name', type: 'String', dflt: '', desc: 'Unique rule identifier.' }, { name: 'description', type: 'String', dflt: '""', desc: 'Natural language description.' }, { name: 'event', type: 'String', dflt: '""', desc: 'Event key this rule guards.' }],
    code: `@Rule(name="fraud-check", event="ORDER_PLACED", description="Blocks orders over $1000")\npublic boolean fraudCheck(OrderPayload payload) {\n    return payload.getAmount() < 1000.0;\n}`
  },
  {
    id: 'callback', name: '@Callback', target: 'Method', emoji: '🔔', tagline: 'Hook into event lifecycle', description: 'Registers a method to run before or after an event is processed.',
    attributes: [{ name: 'event', type: 'String', dflt: '', desc: 'Event key to hook into.' }, { name: 'when', type: 'Callback.When', dflt: '', desc: 'BEFORE or AFTER.' }],
    code: `@Callback(event="ORDER_PLACED", when=Callback.When.BEFORE)\npublic void beforeOrderPlaced(OrderPayload payload) {\n    log.info("[BEFORE] ORDER_PLACED: {}", payload.getOrderId());\n}\n\n@Callback(event="ORDER_PLACED", when=Callback.When.AFTER)\npublic void afterOrderPlaced(OrderPayload payload) {\n    log.info("[AFTER] ORDER_PLACED complete: {}", payload.getOrderId());\n}`
  },
  {
    id: 'model', name: '@Model', target: 'Class', emoji: '🗂️', tagline: 'Describe a payload class', description: 'A class-level marker indicating that the class is a typed event payload.',
    attributes: [{ name: 'description', type: 'String', dflt: '""', desc: 'Description of the model purpose.' }],
    code: `@Model(description="Payload for order placement events")\npublic class OrderPayload {\n    @Vocabulary(name="orderId", description="Unique order identifier")\n    private String orderId;\n\n    @Vocabulary(name="amount", description="Total order amount in USD")\n    private double amount;\n\n    // standard getters/setters\n}`
  },
  {
    id: 'vocabulary', name: '@Vocabulary', target: 'Field', emoji: '🏷️', tagline: 'Annotate payload fields', description: 'Field-level annotation inside @Model classes. Name and description tell AI agents what each field means.',
    attributes: [{ name: 'name', type: 'String', dflt: '""', desc: 'Logical name used in templates.' }, { name: 'description', type: 'String', dflt: '""', desc: "Natural-language description of the field's meaning." }],
    code: `@Vocabulary(name="transactionId", description="Unique transaction identifier")\nprivate String transactionId;\n\n@Vocabulary(name="amount", description="Transfer amount")\nprivate double amount;\n\n@Vocabulary(name="currency", description="Currency code (e.g. USD, EUR)")\nprivate String currency;`
  },
  {
    id: 'notification-schedule', name: '@NotificationSchedule', target: 'Method / Class', emoji: '🕐', tagline: 'Configure dispatch timing', description: 'Declares the scheduling strategy. Supports immediate fire, fixed delay, or cron-like windowed repeat.',
    attributes: [
      { name: 'kind', type: 'Kind', dflt: '', desc: 'IMMEDIATE, DELAY, or CRON.' },
      { name: 'repeatCount', type: 'int', dflt: '-1', desc: 'Repetitions (-1 = indefinite).' },
      { name: 'repeatInterval', type: 'int', dflt: '1', desc: 'Interval between repetitions.' },
      { name: 'repeatIntervalUnit', type: 'String', dflt: '"MINUTE"', desc: 'MINUTE, HOUR, DAY, etc.' },
      { name: 'daysOfWeek', type: 'int[]', dflt: '{}', desc: '1=MON … 7=SUN.' },
      { name: 'startTimeOfDay', type: 'String', dflt: '""', desc: 'Earliest dispatch time (HH:mm).' },
      { name: 'endTimeOfDay', type: 'String', dflt: '""', desc: 'Latest dispatch time (HH:mm).' },
    ],
    code: `@NotificationSchedule(kind=NotificationSchedule.Kind.CRON, daysOfWeek={1,2,3,4,5},\n    startTimeOfDay="09:00", endTimeOfDay="18:00",\n    repeatInterval=1, repeatIntervalUnit="HOUR")\n@Event(key="DAILY_BALANCE_SUMMARY", eventType="deferred", scheduleIntent="deferred", priority=2, payload=BalanceSummaryPayload.class)\npublic BalanceSummaryPayload generateDailySummary(BalanceSummaryPayload payload) {\n    return payload;\n}`
  },
  {
    id: 'managed-configuration', name: '@ManagedConfiguration', target: 'Field', emoji: '⚙️', tagline: 'Hot-reload config values', description: 'Marks a field as dynamically reconfigurable at runtime via a DB config_entries table or Kubernetes ConfigMap.',
    attributes: [{ name: 'key', type: 'String', dflt: '', desc: 'Dot-notation config key.' }, { name: 'source', type: 'ConfigSource', dflt: 'DB', desc: 'DB or CONFIG_MAP.' }],
    code: `@ManagedConfiguration(key="agent.orchestrator.core-pool-size", source=ManagedConfiguration.ConfigSource.DB)\nprivate int corePoolSize = 4;\n\n@ManagedConfiguration(key="agent.max-retries", source=ManagedConfiguration.ConfigSource.CONFIG_MAP)\nprivate int maxRetries = 3;`
  },
];

const TAG_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  Method: { bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)', text: '#60a5fa' },
  Class: { bg: 'rgba(167,139,250,0.12)', border: 'rgba(167,139,250,0.3)', text: '#a78bfa' },
  Field: { bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)', text: '#4ade80' },
  'Method / Class': { bg: 'rgba(251,146,60,0.12)', border: 'rgba(251,146,60,0.3)', text: '#fb923c' },
};

const TargetTag = ({ target }: { target: string }) => {
  const c = TAG_COLORS[target] ?? TAG_COLORS.Method;
  return <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.text }}>@{target}</span>;
};

const AttrTable = ({ attrs }: { attrs: typeof ANNOTATIONS[0]['attributes'] }) => (
  <div style={{ overflowX: 'auto', marginBottom: '1.5rem' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
      <thead>
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          {['Attribute', 'Type', 'Default', 'Description'].map(h => <th key={h} style={{ padding: '0.6rem 1rem', textAlign: 'left', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {attrs.map((a, i) => (
          <tr key={a.name} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)' }}>
            <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', color: '#facc15', whiteSpace: 'nowrap' }}>{a.name}</td>
            <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', color: '#94a3b8', whiteSpace: 'nowrap' }}>{a.type}</td>
            <td style={{ padding: '0.6rem 1rem', fontFamily: 'monospace', color: '#4ade80', whiteSpace: 'nowrap' }}>{a.dflt || '—'}</td>
            <td style={{ padding: '0.6rem 1rem', color: '#94a3b8', lineHeight: 1.5 }}>{a.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const AnnotationSection = ({ ann, isFirst }: { ann: typeof ANNOTATIONS[0]; isFirst: boolean }) => (
  <motion.section id={ann.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.45 }}
    style={{ marginBottom: '5rem', paddingTop: isFirst ? 0 : '1rem', borderTop: isFirst ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '2rem', lineHeight: 1 }}>{ann.emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'monospace', color: '#f8fafc', margin: 0 }}>{ann.name}</h2>
          <TargetTag target={ann.target} />
        </div>
        <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0, fontStyle: 'italic' }}>{ann.tagline}</p>
      </div>
    </div>
    <p style={{ color: '#94a3b8', lineHeight: 1.8, marginBottom: '1.5rem' }}>{ann.description}</p>
    {ann.attributes.length > 0 && <>
      <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.75rem' }}>Attributes</h3>
      <AttrTable attrs={ann.attributes} />
    </>}
    <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#475569', marginBottom: '0.5rem' }}>Example</h3>
    <CodeBlock code={ann.code} />
  </motion.section>
);

const NavPill = ({ ann, active, onClick }: { ann: typeof ANNOTATIONS[0]; active: boolean; onClick: () => void }) => (
  <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.45rem 0.8rem', borderRadius: '0.5rem', width: '100%', textAlign: 'left', cursor: 'pointer', transition: 'all 200ms', backgroundColor: active ? 'rgba(234,179,8,0.12)' : 'transparent', border: `1px solid ${active ? 'rgba(234,179,8,0.35)' : 'transparent'}`, color: active ? '#facc15' : '#64748b', fontSize: '0.82rem', fontWeight: active ? 700 : 500, fontFamily: 'monospace' }}>
    <span style={{ fontSize: '0.9rem' }}>{ann.emoji}</span>{ann.name}
  </button>
);

export default function App() {
  const [activeId, setActiveId] = useState(ANNOTATIONS[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const els = ANNOTATIONS.map(a => document.getElementById(a.id)).filter(Boolean) as HTMLElement[];
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length > 0) {
        const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        setActiveId(top.target.id);
      }
    }, { rootMargin: '-20% 0px -60% 0px', threshold: 0 });
    els.forEach(el => observerRef.current!.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const HOME_URL = (import.meta as any).env?.VITE_HOME_URL ?? '/portals/home/';

  return (
    <div className="app-container">
      {/* Top nav */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(10,10,12,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', height: 60 }}>
        <a href={HOME_URL} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 800, fontSize: '1.05rem', textDecoration: 'none' }}>
          <span>⚡</span><span className="gradient-text">Notify.ai</span>
        </a>
        <span style={{ color: '#facc15', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em' }}>✦ SDK Reference</span>
      </nav>

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Sticky sidebar */}
        <aside style={{ width: 220, flexShrink: 0, position: 'sticky', top: 60, alignSelf: 'flex-start', height: 'calc(100vh - 60px)', overflowY: 'auto', padding: '2.5rem 1rem 2rem 1.5rem', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#334155', marginBottom: '0.75rem' }}>Annotations</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
            {ANNOTATIONS.map(a => <NavPill key={a.id} ann={a} active={activeId === a.id} onClick={() => scrollTo(a.id)} />)}
          </div>
        </aside>

        {/* Main content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4rem 3rem 10rem 3.5rem', maxWidth: 860 }}>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ marginBottom: '3.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.3rem 0.85rem', borderRadius: '999px', border: '1px solid rgba(234,179,8,0.25)', backgroundColor: 'rgba(234,179,8,0.08)', color: '#facc15', fontSize: '0.78rem', fontWeight: 700, marginBottom: '1.25rem', letterSpacing: '0.05em' }}>✦ CLIENT SDK</div>
            <h1 style={{ fontSize: 'clamp(2rem,4vw,3rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem', lineHeight: 1.1 }}>
              Annotation <span style={{ color: '#facc15' }}>Reference</span>
            </h1>
            <p style={{ fontSize: '1.1rem', color: '#9ca3af', lineHeight: 1.75, maxWidth: 560 }}>
              Notify.ai integrates into your Spring Boot service via a set of declarative annotations. Use this guide to understand what each annotation does and how to wire them together.
            </p>
          </motion.div>

          {/* Installation */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: '5rem', paddingBottom: '4rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', backgroundColor: 'rgba(234,179,8,0.2)', color: '#facc15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>1</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>Installation</h2>
            </div>
            <p style={{ color: '#9ca3af', marginBottom: '0.75rem' }}>Add the client SDK to your Maven project:</p>
            <CodeBlock code={MAVEN_CODE} language="xml" />
          </motion.section>

          {ANNOTATIONS.map((ann, i) => <AnnotationSection key={ann.id} ann={ann} isFirst={i === 0} />)}

          {/* Quick Start */}
          <div style={{ padding: '1.75rem 2rem', borderRadius: '1rem', backgroundColor: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.2)', marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#facc15', marginBottom: '0.75rem' }}>💡 Quick Start Checklist</h3>
            <ol style={{ color: '#d1d5db', lineHeight: 2, paddingLeft: '1.25rem', margin: 0 }}>
              <li>Add the Maven dependency.</li>
              <li>Create a <code>@Configuration</code> class and add <code>@EnableNotify(basePackage = "...")</code>.</li>
              <li>Mark your event-emitting service methods with <code>@Event</code>.</li>
              <li>Add <code>@Model</code> + <code>@Vocabulary</code> to your payload classes.</li>
              <li>Write a <code>@SubjectSupplier</code> method to resolve recipients.</li>
              <li>Optionally enrich context with <code>@VocabularySupplier</code>.</li>
              <li>Gate dispatch with <code>@Rule</code> methods and add lifecycle hooks via <code>@Callback</code>.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
