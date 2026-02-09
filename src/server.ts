// src/server.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {
  submitForReview,
  recordReviewDecision,
  publishContent,
} from "./workflows/engine";
import { createIncident, updateIncidentStatus } from "./incidents/service";
import { checkEntitlementAndLog } from "./licensing/entitlements";

const prisma = new PrismaClient();
const app = express();
app.set("trust proxy", 1);

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("CORS not allowed"), false);
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  })
);

app.use(express.json());
app.use(cookieParser());

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn("⚠️  JWT_SECRET not set in .env — using insecure fallback");
  return "INSECURE-DEV-SECRET-CHANGE-ME";
})();

interface JWTPayload {
  userId: string;
  email: string;
  admin?: boolean;
}

function verifyTokenFromReq(req: express.Request): JWTPayload | null {
  const auth = (req.headers.authorization || "").toString();
  let token: string | null = null;
  if (auth && auth.startsWith("Bearer ")) token = auth.split(" ")[1];
  if (!token && (req as any).cookies?.si_token) token = (req as any).cookies.si_token;
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (e) {
    return null;
  }
}

app.use(async (req, _res, next) => {
  const payload = verifyTokenFromReq(req);
  (req as any).userId = payload?.userId || null;
  (req as any).userEmail = payload?.email || null;
  (req as any).isAdmin = payload?.admin || false;
  next();
});

function requireUser(req: any) {
  if (!req.userId) {
    const err = new Error("Unauthorized: missing or invalid auth token");
    (err as any).statusCode = 401;
    throw err;
  }
  return req.userId as string;
}

function requireAdmin(req: any) {
  if (!req.isAdmin) {
    const err = new Error("Unauthorized: admin access required");
    (err as any).statusCode = 401;
    throw err;
  }
}

// ---- Workflow endpoints ----
app.post("/api/workflows/submit", async (req, res) => {
  try {
    const actorId = requireUser(req);
    const { contentId } = req.body;
    const out = await submitForReview({ contentId, actorId });
    res.json(out);
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

app.post("/api/workflows/decision", async (req, res) => {
  try {
    const actorId = requireUser(req);
    const { workflowId, decision, notes } = req.body;
    const out = await recordReviewDecision({
      workflowId,
      actorId,
      decision,
      notes,
    });
    res.json(out);
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

app.post("/api/workflows/publish", async (req, res) => {
  try {
    const actorId = requireUser(req);
    const { contentId } = req.body;
    const out = await publishContent({ contentId, actorId });
    res.json(out);
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

// ---- Incident endpoints ----
app.post("/api/incidents", async (req, res) => {
  try {
    const reporterId = requireUser(req);
    const { title, summary, severity, runbookKey } = req.body;
    const out = await createIncident({ reporterId, title, summary, severity, runbookKey });
    res.json(out);
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

app.post("/api/incidents/:id/status", async (req, res) => {
  try {
    const actorId = requireUser(req);
    const incidentId = req.params.id;
    const { status, publicNote, internalNote } = req.body;
    const out = await updateIncidentStatus({ actorId, incidentId, status, publicNote, internalNote });
    res.json(out);
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

// ---- Diplomacy portal endpoints ----
app.get("/api/diplomacy/missions", async (_req, res) => {
  const missions = await prisma.diplomacyMission.findMany({ orderBy: { name: "asc" } });
  res.json({ success: true, missions });
});

app.get("/api/diplomacy/missions/:id", async (req, res) => {
  const mission = await prisma.diplomacyMission.findUnique({ where: { id: req.params.id } });
  if (!mission) return res.status(404).json({ error: "Mission not found" });
  res.json({ success: true, mission });
});

app.post("/api/diplomacy/missions", async (req, res) => {
  try {
    requireAdmin(req);
    const { name, country, city, region, type, status, contactEmail, contactPhone, focusArea } = req.body || {};
    if (!name || !country || !city || !type) return res.status(400).json({ error: "Missing required fields" });
    const mission = await prisma.diplomacyMission.create({
      data: { name, country, city, region, type, status, contactEmail, contactPhone, focusArea },
    });
    res.json({ success: true, mission });
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

app.get("/api/diplomacy/treaties", async (_req, res) => {
  const treaties = await prisma.diplomacyTreaty.findMany({ orderBy: { updatedAt: "desc" } });
  res.json({ success: true, treaties });
});

app.get("/api/diplomacy/treaties/:id", async (req, res) => {
  const treaty = await prisma.diplomacyTreaty.findUnique({ where: { id: req.params.id } });
  if (!treaty) return res.status(404).json({ error: "Treaty not found" });
  res.json({ success: true, treaty });
});

app.post("/api/diplomacy/treaties", async (req, res) => {
  try {
    requireAdmin(req);
    const { title, partner, sector, status, signedAt, nextMilestone, summary } = req.body || {};
    if (!title || !partner || !sector) return res.status(400).json({ error: "Missing required fields" });
    const treaty = await prisma.diplomacyTreaty.create({
      data: { title, partner, sector, status, signedAt, nextMilestone, summary },
    });
    res.json({ success: true, treaty });
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

app.get("/api/diplomacy/delegations", async (_req, res) => {
  const delegations = await prisma.diplomacyDelegation.findMany({ orderBy: { startDate: "asc" } });
  res.json({ success: true, delegations });
});

app.get("/api/diplomacy/delegations/:id", async (req, res) => {
  const delegation = await prisma.diplomacyDelegation.findUnique({ where: { id: req.params.id } });
  if (!delegation) return res.status(404).json({ error: "Delegation not found" });
  res.json({ success: true, delegation });
});

app.post("/api/diplomacy/delegations", async (req, res) => {
  try {
    requireAdmin(req);
    const { name, focus, hostCity, hostCountry, leadMinistry, status, startDate, endDate, objectives } = req.body || {};
    if (!name || !focus || !hostCity || !hostCountry || !leadMinistry || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const delegation = await prisma.diplomacyDelegation.create({
      data: {
        name,
        focus,
        hostCity,
        hostCountry,
        leadMinistry,
        status,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        objectives,
      },
    });
    res.json({ success: true, delegation });
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

app.get("/api/diplomacy/documents", async (_req, res) => {
  const documents = await prisma.diplomacyDocument.findMany({ orderBy: { updatedAt: "desc" } });
  res.json({ success: true, documents });
});

app.get("/api/diplomacy/documents/:id", async (req, res) => {
  const document = await prisma.diplomacyDocument.findUnique({ where: { id: req.params.id } });
  if (!document) return res.status(404).json({ error: "Document not found" });
  res.json({ success: true, document });
});

app.post("/api/diplomacy/documents", async (req, res) => {
  try {
    requireAdmin(req);
    const { title, category, classification, ownerDept, summary, linkUrl } = req.body || {};
    if (!title || !category || !ownerDept) return res.status(400).json({ error: "Missing required fields" });
    const document = await prisma.diplomacyDocument.create({
      data: { title, category, classification, ownerDept, summary, linkUrl },
    });
    res.json({ success: true, document });
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

// ---- Licensing check endpoint (example: market data request) ----
app.post("/api/data/request", async (req, res) => {
  try {
    const actorId = (req as any).userId || null;
    const { datasetKey, purpose, requestMeta } = req.body;

    const entitlement = await checkEntitlementAndLog({
      datasetKey,
      purpose,
      actorUserId: actorId,
      ip: req.ip,
      userAgent: req.get("user-agent") || undefined,
      requestMeta,
    });

    if (!entitlement.allowed) return res.status(403).json(entitlement);
    res.json({ ok: true, entitlement });
  } catch (e: any) {
    res.status(e.statusCode || 400).json({ error: e.message });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Server on :${port}`));
