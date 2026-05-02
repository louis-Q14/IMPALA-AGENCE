const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const AUDIT_DIR = path.join(__dirname, "../../uploads/audit");
const AUDIT_FILE = path.join(AUDIT_DIR, "suivis-des-actions-executer.html");

function ensureAuditFile() {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
  if (!fs.existsSync(AUDIT_FILE)) {
    saveEntries([]);
  }
}

function safeJsonParse(input, fallback) {
  try {
    return JSON.parse(input);
  } catch {
    return fallback;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusColor(statusCode) {
  if (statusCode >= 200 && statusCode < 300) return "#166534";
  if (statusCode >= 400) return "#991b1b";
  return "#92400e";
}

function extractEntriesFromHtml(html) {
  const match = html.match(/<script id="audit-data" type="application\/json">([\s\S]*?)<\/script>/i);
  if (!match || !match[1]) return [];
  return safeJsonParse(match[1], []);
}

function readEntries() {
  ensureAuditFile();
  const html = fs.readFileSync(AUDIT_FILE, "utf8");
  const entries = extractEntriesFromHtml(html);
  return Array.isArray(entries) ? entries : [];
}

function renderHtml(entries) {
  const rows = entries
    .map((entry) => {
      const actor = entry.actor || {};
      const createdAt = new Date(entry.createdAt).toLocaleString("fr-FR");
      const requestDetails = escapeHtml(JSON.stringify(entry.requestBody || {}, null, 2));
      const responseDetails = escapeHtml(JSON.stringify(entry.responseBody || {}, null, 2));
      const extraDetails = escapeHtml(entry.details || "");
      return `
        <tr>
          <td>${escapeHtml(entry.id)}</td>
          <td>${createdAt}</td>
          <td>${escapeHtml(actor.full_name || actor.email || "Inconnu")}</td>
          <td>${escapeHtml(actor.role || "-")}</td>
          <td>${escapeHtml(entry.method || "-")}</td>
          <td>${escapeHtml(entry.path || "-")}</td>
          <td style="color:${statusColor(Number(entry.statusCode || 0))};font-weight:700;">${escapeHtml(entry.statusCode || "-")}</td>
          <td>${escapeHtml(entry.action || "Action exécutée")}</td>
          <td>
            <details>
              <summary>Voir</summary>
              <pre><strong>Détails:</strong> ${extraDetails || "-"}\n\n<strong>Request:</strong> ${requestDetails}\n\n<strong>Response:</strong> ${responseDetails}</pre>
            </details>
          </td>
        </tr>
      `;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Suivis des actions executer</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
    h1 { margin: 0 0 8px 0; font-size: 24px; }
    p { margin: 0 0 16px 0; color: #475569; }
    .table-wrap { overflow-x: auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border-bottom: 1px solid #e2e8f0; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    tr:hover td { background: #f8fafc; }
    pre { white-space: pre-wrap; margin: 8px 0 0; font-size: 12px; background: #f8fafc; padding: 8px; border-radius: 8px; }
    .meta { margin-bottom: 16px; }
  </style>
</head>
<body>
  <h1>Suivis des actions executer</h1>
  <p class="meta">Historique des actions faites par administrateurs système, agents support et agents finance.</p>
  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Date</th>
          <th>Acteur</th>
          <th>Rôle</th>
          <th>Méthode</th>
          <th>Chemin API</th>
          <th>Statut</th>
          <th>Action</th>
          <th>Détails</th>
        </tr>
      </thead>
      <tbody>
        ${rows || '<tr><td colspan="9">Aucune action enregistrée.</td></tr>'}
      </tbody>
    </table>
  </div>
  <script id="audit-data" type="application/json">${JSON.stringify(entries)}</script>
</body>
</html>`;
}

function saveEntries(entries) {
  if (!fs.existsSync(AUDIT_DIR)) {
    fs.mkdirSync(AUDIT_DIR, { recursive: true });
  }
  fs.writeFileSync(AUDIT_FILE, renderHtml(entries), "utf8");
}

function addEntry(entry) {
  const entries = readEntries();
  const newEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    action: "Action exécutée",
    details: "",
    ...entry,
  };
  entries.unshift(newEntry);
  saveEntries(entries);
  return newEntry;
}

function updateEntry(id, payload) {
  const entries = readEntries();
  const idx = entries.findIndex((entry) => entry.id === id);
  if (idx === -1) return null;

  entries[idx] = {
    ...entries[idx],
    ...payload,
    id: entries[idx].id,
    actor: entries[idx].actor,
    createdAt: entries[idx].createdAt,
  };

  saveEntries(entries);
  return entries[idx];
}

function deleteEntry(id) {
  const entries = readEntries();
  const next = entries.filter((entry) => entry.id !== id);
  if (next.length === entries.length) return false;
  saveEntries(next);
  return true;
}

function clearEntries() {
  saveEntries([]);
}

module.exports = {
  AUDIT_FILE,
  ensureAuditFile,
  readEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  clearEntries,
};
