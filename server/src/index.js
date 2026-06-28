'use strict';

/**
 * 29projects Lab — Request Board / "Pitch a build" backend.
 *
 * Endpoints:
 *   GET  /health        — liveness probe (used by Railway healthcheck)
 *   POST /api/briefs    — public; stores a submitted brief in Postgres
 *   GET  /api/briefs    — admin (Bearer ADMIN_TOKEN); lists recent briefs
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

// Railway terminates TLS at a proxy; trust it so rate-limit sees real client IPs.
app.set('trust proxy', 1);
app.use(express.json({ limit: '64kb' }));

const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';
const DOMAINS = ['AI', 'Crypto', 'IoT', 'Hardware', 'Solar', 'Defense'];

const DEFAULT_ORIGINS = [
  'https://29projectslab.com',
  'https://www.29projectslab.com',
  'https://29projects-ui-sand.vercel.app'
];
const configuredOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((s) => s.trim()).filter(Boolean);
const ORIGINS = configuredOrigins.length ? configuredOrigins : DEFAULT_ORIGINS;

app.use(cors({
  origin: function (origin, cb) {
    if (!origin) return cb(null, true); // curl / same-origin / server-to-server
    if (ORIGINS.indexOf(origin) !== -1) return cb(null, true);
    if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return cb(null, true); // local dev
    return cb(null, false);
  },
  methods: ['GET', 'POST', 'OPTIONS']
}));

const postLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many submissions — please try again later.' }
});

function str(v, max) {
  if (typeof v !== 'string') return '';
  return v.trim().slice(0, max);
}

app.get('/health', (req, res) => res.json({ ok: true, service: '29projects-api' }));
app.get('/', (req, res) => res.json({ ok: true, service: '29projects-api' }));

app.post('/api/briefs', postLimiter, async (req, res) => {
  try {
    const body = req.body || {};
    const contact = str(body.contact, 200);
    const build = str(body.build, 4000);
    if (!build) return res.status(400).json({ ok: false, error: 'build is required' });
    if (!contact) return res.status(400).json({ ok: false, error: 'contact is required' });

    let domains = Array.isArray(body.domains) ? body.domains : [];
    domains = Array.from(new Set(domains.filter((d) => DOMAINS.indexOf(d) !== -1)));

    const brief = await prisma.brief.create({
      data: {
        handle: str(body.handle, 120) || null,
        contact,
        build,
        why: str(body.why, 4000) || null,
        domains,
        source: str(body.source, 60) || 'request-board',
        userAgent: str(req.get('user-agent') || '', 400) || null
      }
    });
    return res.status(201).json({ ok: true, id: brief.id });
  } catch (err) {
    console.error('POST /api/briefs failed:', err && err.message);
    return res.status(500).json({ ok: false, error: 'internal error' });
  }
});

function requireAdmin(req, res, next) {
  if (!ADMIN_TOKEN) return res.status(503).json({ ok: false, error: 'admin endpoint not configured' });
  const auth = req.get('authorization') || '';
  const token = (auth.indexOf('Bearer ') === 0 ? auth.slice(7) : '') || req.query.token || '';
  if (token !== ADMIN_TOKEN) return res.status(401).json({ ok: false, error: 'unauthorized' });
  return next();
}

app.get('/api/briefs', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const briefs = await prisma.brief.findMany({ orderBy: { createdAt: 'desc' }, take: limit });
    return res.json({ ok: true, count: briefs.length, briefs });
  } catch (err) {
    console.error('GET /api/briefs failed:', err && err.message);
    return res.status(500).json({ ok: false, error: 'internal error' });
  }
});

const server = app.listen(PORT, () => console.log('29projects-api listening on :' + PORT));
process.on('SIGTERM', () => server.close(() => prisma.$disconnect()));
