// src/server.ts
import express from "express";
import { PrismaClient } from "@prisma/client";
import {
  submitForReview,
  recordReviewDecision,
  publishContent,
} from "./workflows/engine";
import { createIncident, updateIncidentStatus } from "./incidents/service";
import { checkEntitlementAndLog } from "./licensing/entitlements";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

// Simple auth placeholder: expects x-user-id header
app.use(async (req, _res, next) => {
  const userId = req.header("x-user-id");
  (req as any).userId = userId || null;
  next();
});

function requireUser(req: any) {
  if (!req.userId) {
    const err = new Error("Unauthorized: missing x-user-id");
    (err as any).statusCode = 401;
    throw err;
  }
  return req.userId as string;
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
