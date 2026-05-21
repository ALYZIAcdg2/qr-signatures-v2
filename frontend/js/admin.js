/* =========================================================
   ADMIN.JS — DASHBOARD SUPABASE CORRIGÉ
========================================================= */
let currentAgentStatusFilter = null;
let currentAgentCompanyFilter = null;
let lastSelectedAgent = null;
let currentAgentAllowedCompanies = null;


/* =========================================================
   LOGOS COMPAGNIES
========================================================= */

const DASHBOARD_LOGOS = {
  AI: "logos/AI.png",
  AT: "logos/AT.png",
  AV: "logos/AV.png",
  BJ: "logos/BJ.png",
  FI: "logos/FI.png",
  HF: "logos/HF.png",
  JU: "logos/JU.png",
  LA: "logos/LA.png",
  LO: "logos/LO.png",
  LY: "logos/LY.png",
  MH: "logos/MH.png",
  S4: "logos/S4.png",
  SB: "logos/SB.png",
  SK: "logos/SK.png",
  SQ: "logos/SQ.png",
  TK: "logos/TK.png",
  TS: "logos/TS.png",
  VF: "logos/VF.png",
  HM: "logos/HM.png"
};

/* =========================================================
   HELPERS
========================================================= */

function normalizeAdmin(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function setKpiValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function isActiveAgent(agent) {
  return normalizeAdmin(agent.status) === "ACTIVE";
}

function isInactiveAgent(agent) {
  return normalizeAdmin(agent.status) === "INACTIVE";
}

function isBloqueAgent(agent) {
  const status = normalizeAdmin(agent.status);

  return (
    status === "BLOQUE" ||
    status === "BLOQUEE" ||
    status === "BLOCKED"
  );
}

function isCarenceAgent(agent) {
  const carence = agent.carence;

  if (carence === true) return true;

  const value = normalizeAdmin(carence);

  return (
    value === "OUI" ||
    value === "YES" ||
    value === "TRUE" ||
    value === "1"
  );
}

/* =========================================================
   DASHBOARD
========================================================= */

async function loadDashboard() {
  try {
    console.log("Dashboard Supabase depuis admin.js");

    const tbody = document.getElementById("dashboard-tbody");

    if (!tbody) {
      console.error("dashboard-tbody introuvable");
      return;
    }

    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="padding:12px;color:#6b7280;">
          Chargement...
        </td>
      </tr>
    `;

    setKpiValue("kpi-active", "—");
    setKpiValue("kpi-inactive", "—");
    setKpiValue("kpi-bloque", "—");
    setKpiValue("kpi-carence", "—");

    if (typeof supabaseClient === "undefined") {
      throw new Error("supabaseClient introuvable. Vérifie que config.js est chargé avant admin.js.");
    }

    // =====================================
    // GET AGENTS
    // =====================================

    const { data: agents, error: agentsError } = await supabaseClient
      .from("agents")
      .select("*");

    if (agentsError) {
      throw agentsError;
    }

    const rows = Array.isArray(agents) ? agents : [];

    // =====================================
    // GET COMPANIES
    // =====================================

    const { data: companiesData, error: companiesError } = await supabaseClient
      .from("companies")
      .select("*");

    if (companiesError) {
      throw companiesError;
    }

    const companies = Array.isArray(companiesData) ? companiesData : [];

    // =====================================
    // COMPAGNIES VISIBLES DASHBOARD
    // =====================================

    const visibleCompanies = companies.filter(c => {
      return c.show_dashboard === true;
    });

    const companyCodes = Array.from(new Set(
      visibleCompanies
        .map(c => normalizeAdmin(c.code || c.compagnie))
        .filter(Boolean)
    )).sort((a, b) => a.localeCompare(b));

    // ICI seulement on crée dashboardRows
    const dashboardRows = rows.filter(agent => {
      return companyCodes.includes(
        normalizeAdmin(agent.compagnie)
      );
    });
window.__DASHBOARD_ROWS__ = dashboardRows;
window.__DASHBOARD_CODES__ = companyCodes;

console.log("CACHE DASHBOARD ROWS:",
  window.__DASHBOARD_ROWS__.map(a => ({
    cie: a.compagnie,
    sign: a.sign,
    nom: a.nom,
    status: a.status
  }))
);
    // =====================================
    // KPI GLOBAL — uniquement compagnies visibles
    // =====================================

    const active = dashboardRows.filter(isActiveAgent).length;
    const inactive = dashboardRows.filter(isInactiveAgent).length;
    const bloque = dashboardRows.filter(isBloqueAgent).length;
    console.log(
  "BLOQUES DASHBOARD:",
  dashboardRows
    .filter(isBloqueAgent)
    .map(a => ({
      cie: a.compagnie,
      sign: a.sign,
      nom: a.nom,
      status: a.status
    }))
);
    const carence = dashboardRows.filter(isCarenceAgent).length;

    setKpiValue("kpi-active", active);
    setKpiValue("kpi-inactive", inactive);
    setKpiValue("kpi-bloque", bloque);
    setKpiValue("kpi-carence", carence);

    // =====================================
    // SI AUCUNE COMPAGNIE ACTIVE DASHBOARD
    // =====================================

    if (!companyCodes.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="padding:12px;color:#6b7280;">
            Aucune compagnie activée pour le dashboard.
          </td>
        </tr>
      `;
      return;
    }

    // =====================================
    // BUILD TABLE
    // =====================================

    tbody.innerHTML = "";

    companyCodes.forEach(code => {
      const companyAgents = dashboardRows.filter(agent =>
        normalizeAdmin(agent.compagnie) === code
      );

      const activeCount = companyAgents.filter(isActiveAgent).length;
      const inactiveCount = companyAgents.filter(isInactiveAgent).length;
      const bloqueCount = companyAgents.filter(isBloqueAgent).length;
      const carenceCount = companyAgents.filter(isCarenceAgent).length;
      const total = companyAgents.length;

      let statusClass = "status-ok";
      let statusText = "OK";

      if (bloqueCount > 0) {
        statusClass = "status-critical";
        statusText = "critique";
      } else if (inactiveCount > 0 || carenceCount > 0) {
        statusClass = "status-watch";
        statusText = "Surveillance";
      }

      const logo = DASHBOARD_LOGOS[code] || `logos/${code}.png`;

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <div
  class="company-logo"
  onclick="filterByCompany('${code}')"
  title="Voir les agents ${code}"
  style="cursor:pointer;"
>
  <img
    src="${logo}"
    alt="${code}"
    class="logo-${code}"
    onerror="this.style.display='none';"
  >
</div>

<span
  class="company-code"
  onclick="filterByCompany('${code}')"
  title="Voir les agents ${code}"
  style="cursor:pointer;"
>
  ${code}
</span>
          </div>
        </td>

        <td class="text-right num-active">
  <span
    class="dashboard-count-link"
    onclick="openDashboardAgentsModal('${code}', 'ACTIVE')"
  >
    ${activeCount}
  </span>
</td>

<td class="text-right num-inactive">
  <span
    class="dashboard-count-link"
    onclick="openDashboardAgentsModal('${code}', 'INACTIVE')"
  >
    ${inactiveCount}
  </span>
</td>

<td class="text-right num-bloque">
  <span
    class="dashboard-count-link"
    onclick="openDashboardAgentsModal('${code}', 'BLOQUE')"
  >
    ${bloqueCount}
  </span>
</td>

<td class="text-right num-carence">
  <span
    class="dashboard-count-link"
    onclick="openDashboardAgentsModal('${code}', 'CARENCE')"
  >
    ${carenceCount}
  </span>
</td>

<td class="text-right num-total">
  ${total}
</td>

        <td>
          <span class="status-badge ${statusClass}">
            ${statusText}
          </span>
        </td>
      `;

      tbody.appendChild(tr);
    });

    const title = document.getElementById("dashboard-title");

    if (title) {
      title.textContent =
        "Vue d’ensemble – TOTAL COMPAGNIES : " + companyCodes.length;
    }

    if (typeof updateClock === "function") {
      updateClock();
    }

    console.log("Dashboard chargé avec compagnies visibles uniquement");

  } catch (err) {
    console.error("Erreur loadDashboard:", err);

    const tbody = document.getElementById("dashboard-tbody");

    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="padding:12px;color:#dc2626;font-weight:700;">
            Erreur dashboard : ${err.message || err}
          </td>
        </tr>
      `;
    }
  }
}

/* =========================================================
   ALIAS POUR LE BOUTON "ACTUALISER"
========================================================= */

function refreshDashboard() {
  return loadDashboard();
}

/* =========================================================
   CLIC COMPAGNIE -> ONGLET RECHERCHE
========================================================= */

async function filterByCompany(code) {
  const cleanCode = normalizeAdmin(code);

  currentAgentCompanyFilter = cleanCode;
  currentAgentAllowedCompanies = null;
  currentAgentStatusFilter = null;
  lastSelectedAgent = null;

  showTab("search");

  await loadCompanyOptions(cleanCode);

  const select = document.getElementById("search-company");
  if (select) select.value = cleanCode;

  setTimeout(() => {
    runAgentSearch();
  }, 50);
}

/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  loadCompanyOptions();
  bindSearchCompanyFilter();
  loadDashboard();
  loadCompanyParams();
  loadSyncLogAndRender();

  const alertCompanySelect = document.getElementById("alert-company-filter");

  if (alertCompanySelect) {
    alertCompanySelect.addEventListener("change", async function () {
      try {
        await loadAlertAgentsByCompany(this.value);
      } catch (err) {
        console.error("Erreur filtre agents alerte:", err);
        showToast("Erreur chargement agents", "error");
      }
    });
  }
});

async function loadCompanyOptions(selectedCode = "") {
  const select = document.getElementById("search-company");
  if (!select) return;

  const currentValue = selectedCode || select.value || "";

  try {
    const { data: companies, error } = await supabaseClient
      .from("companies")
      .select("*");

    if (error) throw error;

    const codes = Array.from(new Set(
      (companies || [])
        .map(c => normalizeAdmin(c.code || c.compagnie))
        .filter(Boolean)
    )).sort();

    select.innerHTML = `<option value="">Toutes compagnies</option>`;

    codes.forEach(code => {
      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code;
      select.appendChild(opt);
    });

    if (currentValue) {
      let exists = Array.from(select.options).some(o => o.value === currentValue);

      if (!exists) {
        const opt = document.createElement("option");
        opt.value = currentValue;
        opt.textContent = currentValue;
        select.appendChild(opt);
      }

      select.value = currentValue;
    }

  } catch (err) {
    console.error("Erreur loadCompanyOptions:", err);
  }
}
function bindSearchCompanyFilter() {
  const select = document.getElementById("search-company");

  if (!select) return;

  select.onchange = function () {
    const value = normalizeAdmin(this.value);

    currentAgentCompanyFilter = value || null;

    lastSelectedAgent = null;

    runAgentSearch();
  };
}
function openPortail() {
  window.open("./Portail.html", "_blank");
}

window.openPortail = openPortail;

let currentPreviewMail = null;

async function openMailPreview() {

  try {

    showGlobalSpinnerWithText(
      "Préparation aperçu mail..."
    );

    // =====================================
    // PRENDRE UN AGENT EXEMPLE
    // =====================================

    const { data, error } = await supabaseClient
      .from("agents")
      .select("*")
      .limit(1);

    if (error) throw error;

    const agent =
      Array.isArray(data) && data.length
        ? data[0]
        : null;

    if (!agent) {
      throw new Error(
        "Aucun agent trouvé"
      );
    }

    // =====================================
    // VARIABLES
    // =====================================

    const nom =
      `${agent.nom || ""} ${agent.prenom || ""}`
        .trim();

    const compagnie =
      agent.compagnie || "";

    const status =
      agent.status || "";

    // =====================================
    // TEMPLATE HTML
    // =====================================

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">

<style>

body{
  margin:0;
  padding:0;
  background:#eef2f7;
  font-family:Inter,Arial,sans-serif;
}

.wrapper{
  width:100%;
  padding:40px 0;
}

.mail-card{
  width:700px;
  margin:auto;
  background:#ffffff;
  border-radius:24px;
  overflow:hidden;
  box-shadow:0 20px 60px rgba(0,0,0,.12);
}

.mail-header{
  background:linear-gradient(
    135deg,
    #f97316,
    #ea580c
  );
  padding:35px 40px;
  color:white;
}

.mail-title{
  font-size:34px;
  font-weight:800;
  margin-bottom:8px;
}

.mail-sub{
  font-size:16px;
  opacity:.92;
}

.mail-body{
  padding:45px 45px 35px;
}

.logo-box{
  text-align:center;
  margin-bottom:25px;
}

.logo-box img{
  height:65px;
  object-fit:contain;
}

.hello{
  font-size:34px;
  font-weight:800;
  color:#111827;
  margin-bottom:20px;
}

.text{
  font-size:17px;
  line-height:1.8;
  color:#374151;
}

.info-box{
  margin:35px 0;
  background:#f8fafc;
  border:1px solid #e5e7eb;
  border-radius:20px;
  padding:28px;
}

.info-row{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:16px;
  font-size:16px;
}

.info-row:last-child{
  margin-bottom:0;
}

.info-label{
  color:#6b7280;
  font-weight:600;
}

.info-value{
  color:#111827;
  font-weight:700;
}

.status{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:8px 16px;
  border-radius:999px;
  font-size:14px;
  font-weight:800;
}

.status-active{
  background:#dcfce7;
  color:#166534;
}

.status-inactive{
  background:#fef3c7;
  color:#92400e;
}

.status-bloque{
  background:#fee2e2;
  color:#b91c1c;
}

.mail-button-wrap{
  text-align:center;
  margin-top:40px;
}

.mail-btn{
  display:inline-block;
  background:#f97316;
  color:white !important;
  text-decoration:none;
  padding:16px 28px;
  border-radius:14px;
  font-size:16px;
  font-weight:700;
  box-shadow:0 8px 20px rgba(249,115,22,.35);
}

.footer{
  margin-top:45px;
  padding-top:25px;
  border-top:1px solid #e5e7eb;
  font-size:13px;
  color:#9ca3af;
  line-height:1.7;
  text-align:center;
}

</style>
</head>

<body>

<div class="wrapper">

  <div class="mail-card">

    <div class="mail-header">

      <div class="mail-title">
        Alyzia Signatures
      </div>

      <div class="mail-sub">
        Notification automatique DCS
      </div>

    </div>

    <div class="mail-body">

      <div class="logo-box">

        <img
          src="logos/${compagnie}.png"

          onerror="
            this.style.display='none';
          "
        >

      </div>

      <div class="hello">
        Bonjour ${nom}
      </div>

      <div class="text">

        Votre accès DCS nécessite une vérification.

        <br><br>

        Certaines informations liées à votre signature
        nécessitent une mise à jour ou une validation.

      </div>

      <div class="info-box">

        <div class="info-row">

          <div class="info-label">
            Compagnie
          </div>

          <div class="info-value">
            ${compagnie}
          </div>

        </div>

        <div class="info-row">

          <div class="info-label">
            Statut
          </div>

          <div class="info-value">

            <span class="
              status
              ${
                status === "ACTIVE"
                  ? "status-active"
                  : status === "INACTIVE"
                  ? "status-inactive"
                  : "status-bloque"
              }
            ">

              ${status}

            </span>

          </div>

        </div>

        <div class="info-row">

          <div class="info-label">
            Date
          </div>

          <div class="info-value">

            ${new Date().toLocaleString("fr-FR")}

          </div>

        </div>

      </div>

      <div class="text">

        Merci de contacter votre superviseur
        ou le support Alyzia Signatures
        si une correction est nécessaire.

      </div>

      <div class="mail-button-wrap">

        <a class="mail-btn">

          Accéder au portail

        </a>

      </div>

      <div class="footer">

        Alyzia Signatures DCS
        <br>

        Notification automatique — ne pas répondre.

        <br><br>

        © Alyzia Airport Services

      </div>

    </div>

  </div>

</div>

</body>
</html>
`;

    // =====================================
    // STOCKAGE PREVIEW
    // =====================================

    currentPreviewMail = {

      to:
        agent.email ||
        "test@alyzia.com",

      subject:
        "Alyzia Signatures — Notification",

      html

    };

    // =====================================
    // IFRAME
    // =====================================

        const iframe =
      document.getElementById(
        "mailPreviewFrame"
      );

    if (iframe) {
      iframe.srcdoc = html;
    }

    const target =
      document.getElementById(
        "previewMailTarget"
      );

    if (target) {
      target.textContent =
        currentPreviewMail.to;
    }

    const modal =
      document.getElementById(
        "mailPreviewModal"
      );

    if (modal) {
      modal.style.display = "flex";
    }

    hideGlobalSpinner();

  } catch(err) {

    hideGlobalSpinner();

    console.error(err);

    showToast(
      "Erreur aperçu mail",
      "error"
    );
  }
}

// =====================================
// CLOSE PREVIEW
// =====================================

function closeMailPreviewModal() {

  const modal =
    document.getElementById(
      "mailPreviewModal"
    );

  if (modal) {
    modal.style.display = "none";
  }

  const iframe =
    document.getElementById(
      "mailPreviewFrame"
    );

  if (iframe) {
    iframe.srcdoc = "";
  }

  currentPreviewMail = null;
}

// Alias sécurité
function closeModalPreview() {
  closeMailPreviewModal();
}

window.closeMailPreviewModal =
  closeMailPreviewModal;

window.closeModalPreview =
  closeModalPreview;

async function sendPreviewTestMail() {

  try {

    if (!currentPreviewMail) {
      return;
    }

    showGlobalSpinnerWithText(
      "Envoi mail test..."
    );

    await sendMailViaSupabaseFunction({
      to: currentPreviewMail.to,
      subject: currentPreviewMail.subject,
      html: currentPreviewMail.html,
      text: "Mail test Alyzia"
    });

    hideGlobalSpinner();

    showToast(
      "✅ Mail test envoyé",
      "success"
    );

  } catch(err) {

    hideGlobalSpinner();

    console.error(err);

    showToast(
      "Erreur mail test",
      "error"
    );
  }
}
async function sendPreviewTestMail() {
  try {
    if (!currentPreviewMail) {
      showToast("Aucun mail chargé", "error");
      return;
    }

    showGlobalSpinnerWithText("Envoi mail test.");

    await sendMailViaSupabaseFunction({
      to: currentPreviewMail.to,
      subject: currentPreviewMail.subject,
      html: currentPreviewMail.html,
      text: "Mail test Alyzia"
    });

    hideGlobalSpinner();

    showToast("✅ Mail test envoyé", "success");

  } catch(err) {
    hideGlobalSpinner();
    console.error(err);
    showToast("Erreur envoi test", "error");
  }
}

window.sendPreviewTestMail = sendPreviewTestMail;

async function getVisibleDashboardCompanyCodes() {
  const { data, error } = await supabaseClient
    .from("companies")
    .select("code, show_dashboard")
    .eq("show_dashboard", true);

  if (error) throw error;

  return (data || [])
    .map(c => normalizeAdmin(c.code))
    .filter(Boolean);
}
function resetAgentSearch() {
  currentAgentStatusFilter = null;
  currentAgentCompanyFilter = null;
  currentAgentAllowedCompanies = null;
  lastSelectedAgent = null;

  const queryInput = document.getElementById("search-query");
  if (queryInput) queryInput.value = "";

  const companySelect = document.getElementById("search-company");
  if (companySelect) companySelect.value = "";

  const detailDiv = document.getElementById("agent-detail");
  if (detailDiv) {
    detailDiv.innerHTML = `
      <div style="font-size:12px;color:#6b7280;">
        Sélectionne un agent à gauche pour afficher la fiche.
      </div>
    `;
  }

  runAgentSearch();
}

window.resetAgentSearch = resetAgentSearch;
function isBloqueAgent(agent) {
  const status = normalizeAdmin(agent.status);

  return (
    status === "BLOQUE" ||
    status === "BLOQUEE" ||
    status === "BLOQUER" ||
    status === "BLOCKED" ||
    status.includes("BLOQUE")
  );
}
async function loadAgentHistory(comp, sign) {
  const box = document.getElementById("agent-history-box");

  if (!box) return;

  const compagnie = normalizeAdmin(comp);
  const agentSign = String(sign || "").trim();

  if (!compagnie || !agentSign) {
    box.innerHTML = "Historique indisponible.";
    return;
  }

  box.innerHTML = `
    <div style="color:#6b7280;">
      Chargement historique...
    </div>
  `;

  try {
    const events = [];

    // =====================================
    // 1. LOGS SYNCHRO
    // =====================================

    try {
      const { data: syncLogs, error: syncError } = await supabaseClient
        .from("sync_logs")
        .select("*")
        .eq("compagnie", compagnie)
        .eq("sign", agentSign)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!syncError && Array.isArray(syncLogs)) {
        syncLogs.forEach(log => {
          events.push({
            date: log.created_at,
            type: "SYNC",
            title: "Synchronisation contact",
            detail: [
              log.email_sync ? "Email : " + log.email_sync : "",
              log.phone_sync ? "Téléphone : " + log.phone_sync : "",
              log.action ? "Action : " + log.action : ""
            ].filter(Boolean).join("<br>")
          });
        });
      }
    } catch (e) {
      console.warn("Historique sync_logs indisponible", e);
    }

    // =====================================
    // 2. LOGS ALERTES
    // =====================================

    try {
      const { data: alertLogs, error: alertError } = await supabaseClient
        .from("alert_logs")
        .select("*")
        .eq("compagnie", compagnie)
        .eq("sign", agentSign)
        .order("created_at", { ascending: false })
        .limit(20);

      if (!alertError && Array.isArray(alertLogs)) {
        alertLogs.forEach(log => {
          events.push({
            date: log.created_at,
            type: "ALERTE",
            title:
              log.alert_type === "BLOQUE"
                ? "Alerte agent bloqué"
                : "Alerte inactivité",
            detail: [
              log.recipient_type ? "Destinataire : " + log.recipient_type : "",
              log.action ? "Action : " + log.action : "",
              log.email ? "Email : " + log.email : "",
              log.error ? "Erreur : " + log.error : ""
            ].filter(Boolean).join("<br>")
          });
        });
      }
    } catch (e) {
      console.warn("Historique alert_logs indisponible", e);
    }

    // =====================================
    // 3. DONNÉES AGENT ACTUELLES
    // =====================================

    try {
      const { data: agent, error: agentError } = await supabaseClient
        .from("agents")
        .select("*")
        .eq("compagnie", compagnie)
        .eq("sign", agentSign)
        .maybeSingle();

      if (!agentError && agent) {
        if (agent.created_at) {
          events.push({
            date: agent.created_at,
            type: "AGENT",
            title: "Création fiche agent",
            detail: "Agent créé dans la base."
          });
        }

        if (agent.updated_at) {
          events.push({
            date: agent.updated_at,
            type: "AGENT",
            title: "Dernière mise à jour",
            detail: "Fiche agent modifiée."
          });
        }

        if (agent.mail_inactif_envoye) {
          events.push({
            date: agent.mail_inactif_envoye,
            type: "MAIL",
            title: "Mail inactivité envoyé",
            detail: "Date enregistrée sur la fiche agent."
          });
        }

        if (agent.mail_bloque_envoye) {
          events.push({
            date: agent.mail_bloque_envoye,
            type: "MAIL",
            title: "Mail blocage envoyé",
            detail: "Date enregistrée sur la fiche agent."
          });
        }
      }
    } catch (e) {
      console.warn("Historique agent indisponible", e);
    }

    // =====================================
    // TRI DATE DESC
    // =====================================

    events.sort((a, b) => {
      const da = new Date(a.date || 0).getTime();
      const db = new Date(b.date || 0).getTime();

      return db - da;
    });

    if (!events.length) {
      box.innerHTML = `
        <div style="color:#6b7280;">
          Aucun historique trouvé.
        </div>
      `;
      return;
    }

    // =====================================
    // RENDER
    // =====================================

    box.innerHTML = events.slice(0, 30).map(event => {
      const date = event.date
        ? new Date(event.date).toLocaleString("fr-FR")
        : "—";

      const badgeStyle =
        event.type === "SYNC"
          ? "background:#dbeafe;color:#1d4ed8;"
          : event.type === "ALERTE"
          ? "background:#ffedd5;color:#c2410c;"
          : event.type === "MAIL"
          ? "background:#dcfce7;color:#166534;"
          : "background:#f3f4f6;color:#374151;";

      return `
        <div style="
          padding:6px 0;
          border-bottom:1px dashed #e5e7eb;
        ">
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            gap:8px;
          ">
            <span style="
              ${badgeStyle}
              padding:2px 7px;
              border-radius:999px;
              font-size:10px;
              font-weight:800;
            ">
              ${event.type}
            </span>

            <span style="
              font-size:10px;
              color:#6b7280;
              white-space:nowrap;
            ">
              ${date}
            </span>
          </div>

          <div style="
            margin-top:4px;
            font-weight:700;
            color:#111827;
          ">
            ${event.title}
          </div>

          ${
            event.detail
              ? `<div style="
                  margin-top:2px;
                  font-size:11px;
                  color:#6b7280;
                  line-height:1.4;
                ">
                  ${event.detail}
                </div>`
              : ""
          }
        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("Erreur loadAgentHistory:", err);

    box.innerHTML = `
      <div style="color:#dc2626;font-weight:700;">
        Erreur historique.
      </div>
    `;
  }
}
async function upsertSupabaseInChunks(table, rows, chunkSize = 100) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const { error } = await supabaseClient
      .from(table)
      .upsert(chunk, {
        onConflict: "compagnie,sign"
      });

    if (error) throw error;
  }
}

async function insertSupabaseInChunks(table, rows, chunkSize = 100) {
  console.log(
    "Logs désactivés pour accélérer :",
    table,
    rows?.length || 0
  );

  return;
}

async function checkAndUpdateInactivityStatusLight(event) {
  const btn = event?.currentTarget || null;

  if (btn) btn.disabled = true;

  try {
    showToast("Contrôle inactivité lancé...", "info", 2000);

    const today = new Date();

    // =====================================
    // 1. CHARGER PARAMÈTRES COMPAGNIES
    // =====================================

    const { data: companiesData, error: companiesError } =
      await supabaseClient
        .from("companies")
        .select("code,inactivite_jours,delai_alerte_jours");

    if (companiesError) throw companiesError;

    const companyMap = {};

    (companiesData || []).forEach(c => {
      const code = normalizeAdmin(c.code);

      if (code) {
        companyMap[code] = c;
      }
    });

    // =====================================
    // 2. CHARGER AGENTS ACTIVE SEULEMENT
    // VERSION LÉGÈRE : PAS DE select("*")
    // =====================================

    const { data: agentsData, error: agentsError } =
      await supabaseClient
        .from("agents")
        .select(`
          compagnie,
          sign,
          nom,
          prenom,
          status,
          carence,
          date_heure,
          mail_alerte_inactivite_envoye,
          mail_inactif_envoye
        `)
        .eq("status", "ACTIVE");

    if (agentsError) throw agentsError;

    const agents = Array.isArray(agentsData)
      ? agentsData
      : [];

    let soonCount = 0;
    let expiredCount = 0;
    let ignoredCount = 0;

    const soonAgents = [];
    const expiredAgents = [];
    const ignoredAgents = [];

    // Petite fonction interne pour éviter de répéter le même bloc
    function pushIgnored(agent, reason, inactiveDate = "—") {
      const compagnie = normalizeAdmin(agent?.compagnie);
      const sign = String(agent?.sign || "").trim();

      ignoredCount++;

      ignoredAgents.push({
        compagnie: compagnie || "—",
        sign: sign || "—",
        nom: `${agent?.nom || ""} ${agent?.prenom || ""}`.trim() || "—",
        inactiveDate,
        reason
      });
    }

    // =====================================
    // 3. CALCUL LOCAL UNIQUEMENT
    // PAS DE MODIFICATION SUPABASE
    // =====================================

    for (const agent of agents) {
      const compagnie = normalizeAdmin(agent.compagnie);
      const sign = String(agent.sign || "").trim();

      const nom =
        `${agent.nom || ""} ${agent.prenom || ""}`.trim();

      // =====================================
      // CONTRÔLES DE BASE
      // =====================================

      if (!compagnie || !sign) {
        pushIgnored(
          agent,
          "Compagnie ou SIGN manquant"
        );
        continue;
      }

      if (isBloqueAgent(agent)) {
        pushIgnored(
          agent,
          "Agent bloqué"
        );
        continue;
      }

      if (isCarenceAgent(agent)) {
        pushIgnored(
          agent,
          "Agent en carence"
        );
        continue;
      }

      const company = companyMap[compagnie];

      if (!company) {
        pushIgnored(
          agent,
          "Paramètres compagnie absents"
        );
        continue;
      }

      const inactiviteJours =
        Number(company.inactivite_jours || 0);

      const alerteJours =
        Number(company.delai_alerte_jours || 0);

      if (!inactiviteJours) {
        pushIgnored(
          agent,
          "Délai inactivité absent"
        );
        continue;
      }

      const lastDate = getAgentLastSignatureDate(agent);

      if (!lastDate) {
        pushIgnored(
          agent,
          "Date dernière signature absente"
        );
        continue;
      }

      const inactiveDate =
        addDaysToDate(lastDate, inactiviteJours);

      const alertDate =
        addDaysToDate(
          inactiveDate,
          -Math.abs(alerteJours)
        );

      const inactiveDateFR =
        inactiveDate.toLocaleDateString("fr-FR");

      const lastDateFR =
        lastDate.toLocaleDateString("fr-FR");

      // =====================================
      // CAS 1 : BIENTÔT INACTIVE
      // =====================================

      if (
        today >= alertDate &&
        today < inactiveDate
      ) {
        soonCount++;

        soonAgents.push({
          compagnie,
          sign,
          nom,
          inactiveDate: inactiveDateFR,
          lastDate: lastDateFR,
          reason: "Bientôt inactive"
        });

        continue;
      }

      // =====================================
      // CAS 2 : DÉPASSÉ
      // =====================================

      if (today >= inactiveDate) {
        expiredCount++;

        expiredAgents.push({
          compagnie,
          sign,
          nom,
          inactiveDate: inactiveDateFR,
          lastDate: lastDateFR,
          reason: "Date limite dépassée"
        });

        continue;
      }
    }

    // =====================================
    // 4. RÉSULTAT
    // =====================================

    showToast(
      "✅ Contrôle inactivité terminé",
      "success",
      2500
    );

    console.log("AGENTS BIENTÔT INACTIFS :", soonAgents);
    console.log("AGENTS DÉPASSÉS :", expiredAgents);
    console.log("AGENTS IGNORÉS :", ignoredAgents);

    // Si la modale existe, on l'ouvre
    if (typeof openInactivityResultModal === "function") {
      openInactivityResultModal({
        soon: soonAgents,
        expired: expiredAgents,
        ignored: ignoredAgents
      });
    } else {
      // Sécurité si la modale n'est pas encore ajoutée
      showToast(
        `Résultat : ${soonCount} bientôt inactive(s), ${expiredCount} dépassée(s), ${ignoredCount} ignorée(s). Aucun statut modifié.`,
        "success",
        7000
      );
    }

  } catch (e) {
    console.error("Erreur contrôle inactivité light:", e);

    showToast(
      "Erreur contrôle inactivité : " + (e.message || e),
      "error",
      6000
    );

  } finally {
    if (btn) btn.disabled = false;
  }
}

window.checkAndUpdateInactivityStatusLight =
  checkAndUpdateInactivityStatusLight;

  let INACTIVITY_RESULT_CACHE = {
  soon: [],
  expired: [],
  ignored: []
};

function closeInactivityResultModal() {
  const modal = document.getElementById("inactivity-result-modal");
  if (modal) modal.style.display = "none";
}

function openInactivityResultModal(result) {
  INACTIVITY_RESULT_CACHE = result || {
    soon: [],
    expired: [],
    ignored: []
  };

  const modal = document.getElementById("inactivity-result-modal");
  const summary = document.getElementById("inactivity-result-summary");

  if (!modal || !summary) return;

  const soonCount = INACTIVITY_RESULT_CACHE.soon.length;
  const expiredCount = INACTIVITY_RESULT_CACHE.expired.length;
  const ignoredCount = INACTIVITY_RESULT_CACHE.ignored.length;

  summary.innerHTML = `
    <div style="
      display:grid;
      grid-template-columns:repeat(4, minmax(0, 1fr));
      gap:10px;
    ">
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#854d0e;font-weight:800;">BIENTÔT INACTIFS</div>
        <div style="font-size:24px;font-weight:900;color:#854d0e;">${soonCount}</div>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#b91c1c;font-weight:800;">DÉPASSÉS</div>
        <div style="font-size:24px;font-weight:900;color:#b91c1c;">${expiredCount}</div>
      </div>

      <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#4b5563;font-weight:800;">IGNORÉS</div>
        <div style="font-size:24px;font-weight:900;color:#4b5563;">${ignoredCount}</div>
      </div>

      <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#166534;font-weight:800;">STATUT MODIFIÉ</div>
        <div style="font-size:24px;font-weight:900;color:#166534;">0</div>
      </div>
    </div>

    <div style="margin-top:12px;font-size:13px;color:#6b7280;line-height:1.5;">
      Ce contrôle est actuellement en mode <b>lecture seule</b> :
      il analyse les dates mais ne modifie aucun statut dans Supabase.
      La vraie mise à jour des statuts vient encore de la synchronisation Google Sheet.
    </div>
  `;

  modal.style.display = "flex";

  if (expiredCount > 0) {
    showInactivityResultTab("expired");
  } else if (soonCount > 0) {
    showInactivityResultTab("soon");
  } else {
    showInactivityResultTab("ignored");
  }
}

let INACTIVITY_RESULT_SORT = {
  tab: "expired",
  key: "compagnie",
  direction: "asc"
};

function showInactivityResultTab(type) {
  const content = document.getElementById("inactivity-result-content");
  if (!content) return;

  if (INACTIVITY_RESULT_SORT.tab !== type) {
    INACTIVITY_RESULT_SORT = {
      tab: type,
      key: "compagnie",
      direction: "asc"
    };
  }

  let rows = [...(INACTIVITY_RESULT_CACHE[type] || [])];

  let title = "Résultat";
  let pillClass = "inactivity-pill-ignored";

  if (type === "soon") {
    title = "Bientôt inactive";
    pillClass = "inactivity-pill-soon";
  }

  if (type === "expired") {
    title = "Date dépassée";
    pillClass = "inactivity-pill-expired";
  }

  if (type === "ignored") {
    title = "Ignoré";
    pillClass = "inactivity-pill-ignored";
  }

  rows.sort((a, b) => {
    let av = a[INACTIVITY_RESULT_SORT.key] || "";
    let bv = b[INACTIVITY_RESULT_SORT.key] || "";

    if (INACTIVITY_RESULT_SORT.key === "inactiveDate") {
      av = parseFrenchDateForSort(av);
      bv = parseFrenchDateForSort(bv);

      const result = av - bv;

      return INACTIVITY_RESULT_SORT.direction === "asc"
        ? result
        : -result;
    }

    av = String(av).toUpperCase();
    bv = String(bv).toUpperCase();

    const result = av.localeCompare(bv, "fr", {
      sensitivity: "base",
      numeric: true
    });

    return INACTIVITY_RESULT_SORT.direction === "asc"
      ? result
      : -result;
  });

  function sortHeader(label, key) {
    const arrow =
      INACTIVITY_RESULT_SORT.key === key
        ? INACTIVITY_RESULT_SORT.direction === "asc"
          ? " ▲"
          : " ▼"
        : "";

    return `
      <div
        style="cursor:pointer;user-select:none;"
        onclick="sortInactivityResultColumn('${type}', '${key}')"
      >
        ${label}${arrow}
      </div>
    `;
  }

  if (!rows.length) {
    content.innerHTML = `
      <div style="padding:24px;text-align:center;color:#6b7280;">
        Aucun agent dans cette catégorie.
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="inactivity-result-row inactivity-result-head">
      ${sortHeader("CIE", "compagnie")}
      ${sortHeader("SIGN", "sign")}
      ${sortHeader("Agent", "nom")}
      ${sortHeader("Date limite", "inactiveDate")}
      ${sortHeader("Résultat", "reason")}
    </div>

    ${rows.map(r => `
      <div class="inactivity-result-row">
        <div><b>${escapeHtml(r.compagnie || "")}</b></div>
        <div><code>${escapeHtml(r.sign || "")}</code></div>
        <div>${escapeHtml(r.nom || "")}</div>
        <div>${escapeHtml(r.inactiveDate || "—")}</div>
        <div>
          <span class="${pillClass}">
            ${escapeHtml(r.reason || title)}
          </span>
        </div>
      </div>
    `).join("")}
  `;
}

function sortInactivityResultColumn(tab, key) {
  if (
    INACTIVITY_RESULT_SORT.tab === tab &&
    INACTIVITY_RESULT_SORT.key === key
  ) {
    INACTIVITY_RESULT_SORT.direction =
      INACTIVITY_RESULT_SORT.direction === "asc"
        ? "desc"
        : "asc";
  } else {
    INACTIVITY_RESULT_SORT = {
      tab,
      key,
      direction: key === "inactiveDate" ? "asc" : "asc"
    };
  }

  showInactivityResultTab(tab);
}

function parseFrenchDateForSort(value) {
  if (!value || value === "—") return 0;

  const parts = String(value).split("/");

  if (parts.length !== 3) return 0;

  const day = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const year = Number(parts[2]);

  const date = new Date(year, month, day);

  if (isNaN(date.getTime())) return 0;

  return date.getTime();
}

window.showInactivityResultTab = showInactivityResultTab;
window.sortInactivityResultColumn = sortInactivityResultColumn;

let MAJ_RESULT_CACHE = {
  updated: [],
  skipped: [],
  errors: [],
  totalSheet: 0,
  logsInserted: 0
};

function closeMajResultModal() {
  const modal = document.getElementById("maj-result-modal");
  if (modal) modal.style.display = "none";
}

function openMajResultModal(result) {
  MAJ_RESULT_CACHE = result || {
    updated: [],
    skipped: [],
    errors: [],
    totalSheet: 0,
    logsInserted: 0
  };

  const modal = document.getElementById("maj-result-modal");
  const summary = document.getElementById("maj-result-summary");

  if (!modal || !summary) return;

  const updatedCount = MAJ_RESULT_CACHE.updated.length;
  const skippedCount = MAJ_RESULT_CACHE.skipped.length;
  const errorCount = MAJ_RESULT_CACHE.errors.length;
  const totalSheet = MAJ_RESULT_CACHE.totalSheet || 0;
  const logsInserted = MAJ_RESULT_CACHE.logsInserted || 0;

  summary.innerHTML = `
    <div style="
      display:grid;
      grid-template-columns:repeat(5, minmax(0, 1fr));
      gap:10px;
    ">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#1d4ed8;font-weight:800;">LIGNES SHEET</div>
        <div style="font-size:24px;font-weight:900;color:#1d4ed8;">${totalSheet}</div>
      </div>

      <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#166534;font-weight:800;">MIS À JOUR</div>
        <div style="font-size:24px;font-weight:900;color:#166534;">${updatedCount}</div>
      </div>

      <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#4b5563;font-weight:800;">IGNORÉS</div>
        <div style="font-size:24px;font-weight:900;color:#4b5563;">${skippedCount}</div>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#b91c1c;font-weight:800;">ERREURS</div>
        <div style="font-size:24px;font-weight:900;color:#b91c1c;">${errorCount}</div>
      </div>

      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#c2410c;font-weight:800;">LOGS</div>
        <div style="font-size:24px;font-weight:900;color:#c2410c;">${logsInserted}</div>
      </div>
    </div>

    <div style="margin-top:12px;font-size:13px;color:#6b7280;line-height:1.5;">
      Cette MAJ lit temporairement Google Sheet puis met à jour Supabase.
      Les doublons sont évités grâce à la clé <b>compagnie + sign</b>.
    </div>
  `;

  modal.style.display = "flex";

  if (errorCount > 0) {
    showMajResultTab("errors");
  } else if (skippedCount > 0) {
    showMajResultTab("skipped");
  } else {
    showMajResultTab("updated");
  }
}

function showMajResultTab(type) {
  const content = document.getElementById("maj-result-content");
  if (!content) return;

  if (MAJ_RESULT_SORT.tab !== type) {
    MAJ_RESULT_SORT = {
      tab: type,
      key: "compagnie",
      direction: "asc"
    };
  }

  let rows = [...(MAJ_RESULT_CACHE[type] || [])];

  let title = "Résultat";
  let pillClass = "maj-pill-updated";

  if (type === "updated") {
    title = "Mis à jour";
    pillClass = "maj-pill-updated";
  }

  if (type === "skipped") {
    title = "Ignoré";
    pillClass = "maj-pill-skipped";
  }

  if (type === "errors") {
    title = "Erreur";
    pillClass = "maj-pill-error";
  }

  rows.sort((a, b) => {
    const av = String(a[MAJ_RESULT_SORT.key] || "").toUpperCase();
    const bv = String(b[MAJ_RESULT_SORT.key] || "").toUpperCase();

    const result = av.localeCompare(bv, "fr", {
      sensitivity: "base",
      numeric: true
    });

    return MAJ_RESULT_SORT.direction === "asc"
      ? result
      : -result;
  });

  function sortHeader(label, key) {
    const arrow =
      MAJ_RESULT_SORT.key === key
        ? MAJ_RESULT_SORT.direction === "asc"
          ? " ▲"
          : " ▼"
        : "";

    return `
      <div
        style="cursor:pointer;user-select:none;"
        onclick="sortMajResultColumn('${type}', '${key}')"
      >
        ${label}${arrow}
      </div>
    `;
  }

  if (!rows.length) {
    content.innerHTML = `
      <div style="padding:24px;text-align:center;color:#6b7280;">
        Aucun élément dans cette catégorie.
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="maj-result-row maj-result-head">
      ${sortHeader("CIE", "compagnie")}
      ${sortHeader("SIGN", "sign")}
      ${sortHeader("Agent", "nom")}
      ${sortHeader("Résultat", "reason")}
    </div>

    ${rows.map(r => `
      <div class="maj-result-row">
        <div><b>${escapeHtml(r.compagnie || "")}</b></div>
        <div><code>${escapeHtml(r.sign || "")}</code></div>
        <div>${escapeHtml(r.nom || "")}</div>
        <div>
          <span class="${pillClass}">
            ${escapeHtml(r.reason || title)}
          </span>
        </div>
      </div>
    `).join("")}
  `;
}

let MAJ_RESULT_SORT = {
  tab: "updated",
  key: "compagnie",
  direction: "asc"
};

function sortMajResultColumn(tab, key) {
  if (MAJ_RESULT_SORT.tab === tab && MAJ_RESULT_SORT.key === key) {
    MAJ_RESULT_SORT.direction =
      MAJ_RESULT_SORT.direction === "asc"
        ? "desc"
        : "asc";
  } else {
    MAJ_RESULT_SORT = {
      tab,
      key,
      direction: "asc"
    };
  }

  showMajResultTab(tab);
}

window.sortMajResultColumn = sortMajResultColumn;

function updateTopClockLive() {
  const el = document.getElementById("topClock");
  if (!el) return;

  const now = new Date();

  const time = now.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const date = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  el.textContent = `${time} — ${date}`;
}

function startTopClockLive() {
  updateTopClockLive();

  if (window.__topClockTimer) {
    clearInterval(window.__topClockTimer);
  }

  window.__topClockTimer = setInterval(updateTopClockLive, 1000);
}

let MAIL_ALERT_RESULT_CACHE = {
  sent: [],
  skipped: [],
  errors: [],
  all: [],
  summary: {}
};

let MAIL_ALERT_RESULT_SORT = {
  tab: "all",
  key: "compagnie",
  direction: "asc"
};

function closeMailAlertResultModal() {
  const modal = document.getElementById("mail-alert-result-modal");
  if (modal) modal.style.display = "none";
}

function openMailAlertResultModal(result) {
  MAIL_ALERT_RESULT_CACHE = result || {
    sent: [],
    skipped: [],
    errors: [],
    all: [],
    summary: {}
  };

  const modal = document.getElementById("mail-alert-result-modal");
  const summary = document.getElementById("mail-alert-result-summary");

  if (!modal || !summary) return;

  const s = MAIL_ALERT_RESULT_CACHE.summary || {};

  summary.innerHTML = `
    <div style="
      display:grid;
      grid-template-columns:repeat(6, minmax(0, 1fr));
      gap:10px;
    ">
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#1d4ed8;font-weight:800;">AGENTS FILTRÉS</div>
        <div style="font-size:24px;font-weight:900;color:#1d4ed8;">${s.agentsFiltres || 0}</div>
      </div>

      <div style="background:#dcfce7;border:1px solid #bbf7d0;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#166534;font-weight:800;">ENVOYÉS</div>
        <div style="font-size:24px;font-weight:900;color:#166534;">${s.totalSent || 0}</div>
      </div>

      <div style="background:#f3f4f6;border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#4b5563;font-weight:800;">IGNORÉS</div>
        <div style="font-size:24px;font-weight:900;color:#4b5563;">${s.totalSkipped || 0}</div>
      </div>

      <div style="background:#fee2e2;border:1px solid #fecaca;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#b91c1c;font-weight:800;">ERREURS</div>
        <div style="font-size:24px;font-weight:900;color:#b91c1c;">${s.totalErrors || 0}</div>
      </div>

      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#854d0e;font-weight:800;">LIMITE</div>
        <div style="font-size:24px;font-weight:900;color:#854d0e;">${s.mailLimitReached ? "OUI" : "NON"}</div>
      </div>

      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:12px;">
        <div style="font-size:12px;color:#c2410c;font-weight:800;">LOGS</div>
        <div style="font-size:24px;font-weight:900;color:#c2410c;">${s.logs || 0}</div>
      </div>
    </div>

    <div style="margin-top:12px;font-size:13px;color:#6b7280;line-height:1.5;">
      Résumé : ${s.sentAgentCount || 0} mail(s) agent,
      ${s.sentCompanyCount || 0} mail(s) compagnie,
      ${s.skippedAgentNoEmail || 0} agent(s) sans email,
      ${s.skippedCompanyNoEmail || 0} compagnie(s) sans email.
    </div>
  `;

  modal.style.display = "flex";

  if ((MAIL_ALERT_RESULT_CACHE.errors || []).length) {
    showMailAlertResultTab("errors");
  } else if ((MAIL_ALERT_RESULT_CACHE.skipped || []).length) {
    showMailAlertResultTab("skipped");
  } else {
    showMailAlertResultTab("sent");
  }
}

function showMailAlertResultTab(type) {
  const content = document.getElementById("mail-alert-result-content");
  if (!content) return;

  if (MAIL_ALERT_RESULT_SORT.tab !== type) {
    MAIL_ALERT_RESULT_SORT = {
      tab: type,
      key: "compagnie",
      direction: "asc"
    };
  }

  let rows = [...(MAIL_ALERT_RESULT_CACHE[type] || [])];

  rows.sort((a, b) => {
    let av = String(a[MAIL_ALERT_RESULT_SORT.key] || "").toUpperCase();
    let bv = String(b[MAIL_ALERT_RESULT_SORT.key] || "").toUpperCase();

    const result = av.localeCompare(bv, "fr", {
      sensitivity: "base",
      numeric: true
    });

    return MAIL_ALERT_RESULT_SORT.direction === "asc" ? result : -result;
  });

  function sortHeader(label, key) {
    const arrow =
      MAIL_ALERT_RESULT_SORT.key === key
        ? MAIL_ALERT_RESULT_SORT.direction === "asc"
          ? " ▲"
          : " ▼"
        : "";

    return `
      <div
        style="cursor:pointer;user-select:none;"
        onclick="sortMailAlertResultColumn('${type}', '${key}')"
      >
        ${label}${arrow}
      </div>
    `;
  }

  if (!rows.length) {
    content.innerHTML = `
      <div style="padding:24px;text-align:center;color:#6b7280;">
        Aucun élément dans cette catégorie.
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="mail-alert-result-row mail-alert-result-head">
      ${sortHeader("CIE", "compagnie")}
      ${sortHeader("SIGN", "sign")}
      ${sortHeader("Agent", "nom")}
      ${sortHeader("Dest.", "recipient_type")}
      ${sortHeader("Type", "alert_type")}
      ${sortHeader("Action", "action")}
      ${sortHeader("Résultat", "result")}
    </div>

    ${rows.map(r => {
      let pillClass = "mail-pill-skipped";

      if (r.level === "sent") pillClass = "mail-pill-sent";
      if (r.level === "error") pillClass = "mail-pill-error";
      if (r.level === "limit") pillClass = "mail-pill-limit";

      return `
        <div class="mail-alert-result-row">
          <div><b>${escapeHtml(r.compagnie || "")}</b></div>
          <div><code>${escapeHtml(r.sign || "")}</code></div>
          <div>${escapeHtml(r.nom || "")}</div>
          <div>${escapeHtml(r.recipient_type || "")}</div>
          <div>${escapeHtml(r.alert_type || "")}</div>
          <div>${escapeHtml(r.action || "")}</div>
          <div>
            <span class="${pillClass}">
              ${escapeHtml(r.result || "")}
            </span>
          </div>
        </div>
      `;
    }).join("")}
  `;
}

function sortMailAlertResultColumn(tab, key) {
  if (
    MAIL_ALERT_RESULT_SORT.tab === tab &&
    MAIL_ALERT_RESULT_SORT.key === key
  ) {
    MAIL_ALERT_RESULT_SORT.direction =
      MAIL_ALERT_RESULT_SORT.direction === "asc" ? "desc" : "asc";
  } else {
    MAIL_ALERT_RESULT_SORT = {
      tab,
      key,
      direction: "asc"
    };
  }

  showMailAlertResultTab(tab);
}

window.closeMailAlertResultModal = closeMailAlertResultModal;
window.openMailAlertResultModal = openMailAlertResultModal;
window.showMailAlertResultTab = showMailAlertResultTab;
window.sortMailAlertResultColumn = sortMailAlertResultColumn;

let HISTORY_ROWS_CACHE = [];
let HISTORY_SORT_STATE = {
  key: "created_at",
  direction: "desc"
};

function setHistoryType(type) {
  const select = document.getElementById("history-type");
  if (select) select.value = type;

  loadHistoryDashboard();
}

async function loadHistoryCompanyOptions() {
  const select = document.getElementById("history-company");
  if (!select) return;

  const currentValue = select.value || "";

  try {
    const { data, error } = await supabaseClient
      .from("companies")
      .select("code")
      .order("code", { ascending: true });

    if (error) throw error;

    select.innerHTML = `<option value="">Toutes compagnies</option>`;

    (data || []).forEach(c => {
      const code = normalizeAdmin(c.code);
      if (!code) return;

      const opt = document.createElement("option");
      opt.value = code;
      opt.textContent = code;
      select.appendChild(opt);
    });

    if (currentValue) {
      select.value = currentValue;
    }

  } catch (err) {
    console.error("Erreur loadHistoryCompanyOptions:", err);
  }
}

async function loadHistoryDashboard() {
  const tbody = document.getElementById("history-tbody");
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="9" style="padding:12px;color:#6b7280;">
        Chargement historique...
      </td>
    </tr>
  `;

  const type =
    document.getElementById("history-type")?.value || "alerts";

  const compagnie =
    normalizeAdmin(document.getElementById("history-company")?.value || "");

  const limit =
    Number(document.getElementById("history-limit")?.value || 100);

  try {
    let rows = [];

    if (type === "alerts" || type === "all") {
      const alertRows = await loadHistoryAlertLogs(compagnie, limit);
      rows = rows.concat(alertRows);
    }

    if (type === "sync" || type === "all") {
      const syncRows = await loadHistorySyncLogs(compagnie, limit);
      rows = rows.concat(syncRows);
    }

    if (type === "admin" || type === "all") {
      const adminRows = await loadHistoryAdminLogs(compagnie, limit);
      rows = rows.concat(adminRows);
    }

    rows.sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });

    HISTORY_ROWS_CACHE = rows.slice(0, limit);

    renderHistoryRows(HISTORY_ROWS_CACHE);

  } catch (err) {
    console.error("Erreur loadHistoryDashboard:", err);

    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="padding:12px;color:#dc2626;font-weight:700;">
          Erreur historique : ${escapeHtml(err.message || err)}
        </td>
      </tr>
    `;
  }
}

async function loadHistoryAlertLogs(compagnie, limit) {
  let query = supabaseClient
    .from("alert_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (compagnie) {
    query = query.eq("compagnie", compagnie);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("alert_logs indisponible:", error);
    return [];
  }

  return (data || []).map(r => ({
    created_at: r.created_at,
    source: "ALERTES",
    action: r.action || r.alert_type || "ALERTE",
    compagnie: r.compagnie,
    sign: r.sign,
    nom: r.nom,
    recipient: r.recipient_type || "",
    result: r.error ? "ERREUR" : "OK",
    detail: r.error || r.subject || "",
    raw: r
  }));
}

async function loadHistorySyncLogs(compagnie, limit) {
  let query = supabaseClient
    .from("sync_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (compagnie) {
    query = query.eq("compagnie", compagnie);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("sync_logs indisponible:", error);
    return [];
  }

  return (data || []).map(r => ({
    created_at: r.created_at,
    source: "SYNCHRO",
    action: r.action || "SYNC",
    compagnie: r.compagnie,
    sign: r.sign,
    nom: r.nom,
    recipient: "",
    result: r.error ? "ERREUR" : "OK",
    detail: r.error || r.source || "",
    raw: r
  }));
}

async function loadHistoryAdminLogs(compagnie, limit) {
  let query = supabaseClient
    .from("admin_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (compagnie) {
    query = query.eq("compagnie", compagnie);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("admin_logs indisponible:", error);
    return [];
  }

  return (data || []).map(r => ({
    created_at: r.created_at,
    source: r.source || "ADMIN",
    action: r.action || "",
    compagnie: r.compagnie,
    sign: r.sign,
    nom: r.nom,
    recipient: r.actor || "",
    result: r.result || (r.error ? "ERREUR" : "OK"),
    detail: r.error || r.target_type || "",
    raw: r
  }));
}

let AGENT_HISTORY_ACTIVE_TAB = "all";
let AGENT_HISTORY_SORT = {
  key: "created_at",
  direction: "desc"
};

function sortAgentHistoryRows(rows) {
  const key = AGENT_HISTORY_SORT.key;
  const direction = AGENT_HISTORY_SORT.direction === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    let va = a[key] || "";
    let vb = b[key] || "";

    if (key === "created_at") {
      va = new Date(va || 0).getTime();
      vb = new Date(vb || 0).getTime();
      return (va - vb) * direction;
    }

    return String(va).localeCompare(String(vb), "fr", {
      sensitivity: "base",
      numeric: true
    }) * direction;
  });
}

function setAgentHistorySort(key) {
  if (AGENT_HISTORY_SORT.key === key) {
    AGENT_HISTORY_SORT.direction =
      AGENT_HISTORY_SORT.direction === "asc" ? "desc" : "asc";
  } else {
    AGENT_HISTORY_SORT.key = key;
    AGENT_HISTORY_SORT.direction = key === "created_at" ? "desc" : "asc";
  }

  showAgentHistoryModalTab(AGENT_HISTORY_ACTIVE_TAB);
}

function agentHistorySortIcon(key) {
  if (AGENT_HISTORY_SORT.key !== key) return "↕";
  return AGENT_HISTORY_SORT.direction === "asc" ? "↑" : "↓";
}

window.setAgentHistorySort = setAgentHistorySort;



let HISTORY_CURRENT_ROWS = [];
let HISTORY_SORT_KEY = "created_at";
let HISTORY_SORT_DIRECTION = "desc";

function setHistorySort(key) {
  if (HISTORY_SORT_KEY === key) {
    HISTORY_SORT_DIRECTION =
      HISTORY_SORT_DIRECTION === "asc" ? "desc" : "asc";
  } else {
    HISTORY_SORT_KEY = key;
    HISTORY_SORT_DIRECTION = key === "created_at" ? "desc" : "asc";
  }

  renderHistoryRows(HISTORY_CURRENT_ROWS);
}

function getHistorySortIcon(key) {
  if (HISTORY_SORT_KEY !== key) return "";
  return HISTORY_SORT_DIRECTION === "asc" ? "↑" : "↓";
}

function updateHistorySortIcons() {
  const keys = [
    "created_at",
    "source",
    "action",
    "compagnie",
    "sign",
    "nom",
    "recipient",
    "result",
    "detail"
  ];

  keys.forEach(key => {
    const el = document.getElementById("sort-" + key);
    if (el) {
      el.textContent = getHistorySortIcon(key);
    }
  });
}

function sortHistoryRows(rows) {
  const direction =
    HISTORY_SORT_DIRECTION === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    let va = a[HISTORY_SORT_KEY] ?? "";
    let vb = b[HISTORY_SORT_KEY] ?? "";

    if (HISTORY_SORT_KEY === "created_at") {
      va = new Date(va || 0).getTime();
      vb = new Date(vb || 0).getTime();
      return (va - vb) * direction;
    }

    return String(va).localeCompare(String(vb), "fr", {
      sensitivity: "base",
      numeric: true
    }) * direction;
  });
}

window.setHistorySort = setHistorySort;

function renderHistoryRows(rows) {
  const tbody = document.getElementById("history-tbody");
  if (!tbody) return;

  HISTORY_CURRENT_ROWS = Array.isArray(rows) ? rows : [];

  const sortedRows = sortHistoryRows(HISTORY_CURRENT_ROWS);

  updateHistorySortIcons();

  if (!sortedRows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="padding:12px;color:#6b7280;">
          Aucun historique trouvé.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = sortedRows.map(r => {
    const resultColor =
      normalizeAdmin(r.result).includes("ERREUR")
        ? "#dc2626"
        : "#16a34a";

    return `
      <tr class="history-row">
        <td>${escapeHtml(formatDateTimeHistory(r.created_at))}</td>
        <td><b>${escapeHtml(r.source || "")}</b></td>
        <td>${escapeHtml(r.action || "")}</td>
        <td>${escapeHtml(r.compagnie || "")}</td>
        <td><code>${escapeHtml(r.sign || "")}</code></td>
        <td>${escapeHtml(r.nom || "")}</td>
        <td>${escapeHtml(r.recipient || "")}</td>
        <td style="font-weight:800;color:${resultColor};">
          ${escapeHtml(r.result || "")}
        </td>
        <td>${escapeHtml(r.detail || "")}</td>
      </tr>
    `;
  }).join("");
}

function filterHistoryRows() {
  const input = document.getElementById("history-search");
  const filter = normalizeAdmin(input?.value || "");

  if (!filter) {
    renderHistoryRows(HISTORY_ROWS_CACHE);
    return;
  }

  const rows = HISTORY_ROWS_CACHE.filter(r => {
    const haystack = normalizeAdmin([
      r.source,
      r.action,
      r.compagnie,
      r.sign,
      r.nom,
      r.recipient,
      r.result,
      r.detail
    ].join(" "));

    return haystack.includes(filter);
  });

  renderHistoryRows(rows);
}

function formatDateTimeHistory(value) {
  if (!value) return "";

  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);

  return d.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

window.setHistoryType = setHistoryType;
window.loadHistoryDashboard = loadHistoryDashboard;
window.loadHistoryCompanyOptions = loadHistoryCompanyOptions;
window.filterHistoryRows = filterHistoryRows;

async function logAdminAction({
  action,
  compagnie = null,
  sign = null,
  nom = null,
  target_type = null,
  target_id = null,
  before_data = null,
  after_data = null,
  result = "OK",
  error = null
}) {
  try {
    await supabaseClient
      .from("admin_logs")
      .insert([{
        actor: "ADMIN_GITHUB",
        source: "ADMIN",
        action,
        compagnie,
        sign,
        nom,
        target_type,
        target_id,
        before_data,
        after_data,
        result,
        error
      }]);
  } catch (err) {
    console.warn("Erreur logAdminAction:", err);
  }
}

window.logAdminAction = logAdminAction;

let AGENT_HISTORY_MODAL_CACHE = {
  all: [],
  alerts: [],
  sync: [],
  admin: []
};

function closeAgentHistoryModal() {
  const modal = document.getElementById("agent-history-modal-backdrop");
  if (modal) modal.style.display = "none";
}

async function openAgentHistoryModalFromCurrentAgent() {
  if (!lastSelectedAgent) {
    showToast("Aucun agent sélectionné", "error");
    return;
  }

  const comp = normalizeAdmin(lastSelectedAgent.compagnie);
  const sign = String(lastSelectedAgent.sign || "").trim();

  if (!comp || !sign) {
    showToast("Agent incomplet", "error");
    return;
  }

  await openAgentHistoryModal(comp, sign, lastSelectedAgent);
}

async function openAgentHistoryModal(comp, sign, agentData = null) {
  const modal = document.getElementById("agent-history-modal-backdrop");
  const summary = document.getElementById("agent-history-modal-summary");
  const content = document.getElementById("agent-history-modal-content");

  if (!modal || !summary || !content) return;

  modal.style.display = "flex";

  summary.innerHTML = "Chargement historique agent...";
  content.innerHTML = "";

  const compagnie = normalizeAdmin(comp);
  const cleanSign = String(sign || "").trim();

  try {
    let agent = agentData;

    if (!agent) {
      const { data, error } = await supabaseClient
        .from("agents")
        .select("*")
        .eq("compagnie", compagnie)
        .eq("sign", cleanSign)
        .limit(1);

      if (error) throw error;

      agent = data && data.length ? data[0] : null;
    }

    const nomComplet = agent
      ? `${agent.nom || ""} ${agent.prenom || ""}`.trim()
      : "";

    const alertRows = await getAgentAlertHistory(compagnie, cleanSign);
    const syncRows = await getAgentSyncHistory(compagnie, cleanSign);
    const adminRows = await getAgentAdminHistory(compagnie, cleanSign);

    const allRows = [
      ...alertRows,
      ...syncRows,
      ...adminRows
    ].sort((a, b) => {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return db - da;
    });

    AGENT_HISTORY_MODAL_CACHE = {
      all: allRows,
      alerts: alertRows,
      sync: syncRows,
      admin: adminRows
    };

    const inactiveInfo = await computeAgentInactivityInfo(agent);

    summary.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;">
        <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:14px;padding:12px;">
          <div style="font-size:12px;color:#c2410c;font-weight:800;">COMPAGNIE</div>
          <div style="font-size:22px;font-weight:900;color:#c2410c;">${escapeHtml(compagnie)}</div>
        </div>

        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:12px;">
          <div style="font-size:12px;color:#1d4ed8;font-weight:800;">SIGN</div>
          <div style="font-size:22px;font-weight:900;color:#1d4ed8;">${escapeHtml(cleanSign)}</div>
        </div>

        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:14px;padding:12px;">
          <div style="font-size:12px;color:#374151;font-weight:800;">AGENT</div>
          <div style="font-size:16px;font-weight:900;color:#111827;">${escapeHtml(nomComplet || "—")}</div>
        </div>

        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:14px;padding:12px;">
          <div style="font-size:12px;color:#854d0e;font-weight:800;">ALERTE INACTIVITÉ</div>
          <div style="font-size:16px;font-weight:900;color:#854d0e;">${escapeHtml(inactiveInfo.alertDateText || "—")}</div>
        </div>

        <div style="background:#fee2e2;border:1px solid #fecaca;border-radius:14px;padding:12px;">
          <div style="font-size:12px;color:#b91c1c;font-weight:800;">DATE INACTIVE</div>
          <div style="font-size:16px;font-weight:900;color:#b91c1c;">${escapeHtml(inactiveInfo.inactiveDateText || "—")}</div>
        </div>
      </div>

      <div style="margin-top:10px;color:#6b7280;font-size:13px;">
        ${allRows.length} événement(s) trouvé(s) :
        ${alertRows.length} alerte(s),
        ${syncRows.length} synchro(s) / MAJ,
        ${adminRows.length} action(s) admin.
      </div>
    `;

    showAgentHistoryModalTab("all");

  } catch (err) {
    console.error("Erreur openAgentHistoryModal:", err);

    summary.innerHTML = `
      <div style="color:#dc2626;font-weight:800;">
        Erreur chargement historique agent : ${escapeHtml(err.message || err)}
      </div>
    `;
  }
}

async function getAgentAlertHistory(compagnie, sign) {
  const { data, error } = await supabaseClient
    .from("alert_logs")
    .select("*")
    .eq("compagnie", compagnie)
    .eq("sign", sign)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("Erreur alert_logs agent:", error);
    return [];
  }

  return (data || []).map(r => ({
    created_at: r.created_at,
    type: "alerts",
    source: "ALERTE",
    action: r.action || r.alert_type || "ALERTE",
    compagnie: r.compagnie,
    sign: r.sign,
    nom: r.nom,
    recipient: r.recipient_type || "",
    result: r.error ? "ERREUR" : "OK",
    detail: r.error || r.subject || "",
    raw: r
  }));
}

async function getAgentSyncHistory(compagnie, sign) {
  const { data, error } = await supabaseClient
    .from("sync_logs")
    .select("*")
    .eq("compagnie", compagnie)
    .eq("sign", sign)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("Erreur sync_logs agent:", error);
    return [];
  }

  return (data || []).map(r => ({
    created_at: r.created_at,
    type: "sync",
    source: "SYNC / MAJ",
    action: r.action || "SYNC",
    compagnie: r.compagnie,
    sign: r.sign,
    nom: r.nom,
    recipient: "",
    result: r.error ? "ERREUR" : "OK",
    detail: r.error || r.source || "",
    raw: r
  }));
}

async function getAgentAdminHistory(compagnie, sign) {
  const { data, error } = await supabaseClient
    .from("admin_logs")
    .select("*")
    .eq("compagnie", compagnie)
    .eq("sign", sign)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.warn("Erreur admin_logs agent:", error);
    return [];
  }

  return (data || []).map(r => ({
    created_at: r.created_at,
    type: "admin",
    source: "ADMIN",
    action: r.action || "",
    compagnie: r.compagnie,
    sign: r.sign,
    nom: r.nom,
    recipient: r.actor || "",
    result: r.result || (r.error ? "ERREUR" : "OK"),
    detail: r.error || r.target_type || "",
    raw: r
  }));
}

function showAgentHistoryModalTab(type) {
  AGENT_HISTORY_ACTIVE_TAB = type;

  const content = document.getElementById("agent-history-modal-content");
  if (!content) return;

  const rawRows = AGENT_HISTORY_MODAL_CACHE[type] || [];
  const rows = sortAgentHistoryRows(rawRows);

  if (!rows.length) {
    content.innerHTML = `
      <div style="padding:24px;text-align:center;color:#6b7280;font-size:22px;">
        Aucun événement dans cette catégorie.
      </div>
    `;
    return;
  }

  content.innerHTML = `
    <div class="agent-history-modal-row agent-history-modal-head">
      <div onclick="setAgentHistorySort('created_at')" style="cursor:pointer;">
        Date ${agentHistorySortIcon("created_at")}
      </div>
      <div onclick="setAgentHistorySort('source')" style="cursor:pointer;">
        Source ${agentHistorySortIcon("source")}
      </div>
      <div onclick="setAgentHistorySort('action')" style="cursor:pointer;">
        Action ${agentHistorySortIcon("action")}
      </div>
      <div onclick="setAgentHistorySort('compagnie')" style="cursor:pointer;">
        Cie ${agentHistorySortIcon("compagnie")}
      </div>
      <div onclick="setAgentHistorySort('sign')" style="cursor:pointer;">
        SIGN ${agentHistorySortIcon("sign")}
      </div>
      <div onclick="setAgentHistorySort('detail')" style="cursor:pointer;">
        Détail ${agentHistorySortIcon("detail")}
      </div>
    </div>

    ${rows.map(r => {
      let pill = "history-pill-admin";

      if (r.type === "alerts") {
        pill = r.result === "ERREUR"
          ? "history-pill-error"
          : "history-pill-alert";
      }

      if (r.type === "sync") {
        pill = r.result === "ERREUR"
          ? "history-pill-error"
          : "history-pill-sync";
      }

      if (r.type === "admin") {
        pill = r.result === "ERREUR"
          ? "history-pill-error"
          : "history-pill-admin";
      }

      return `
        <div class="agent-history-modal-row">
          <div>${escapeHtml(formatDateTimeHistory(r.created_at))}</div>

          <div>
            <span class="${pill}">
              ${escapeHtml(r.source || "")}
            </span>
          </div>

          <div>${escapeHtml(r.action || "")}</div>
          <div><b>${escapeHtml(r.compagnie || "")}</b></div>
          <div><code>${escapeHtml(r.sign || "")}</code></div>

          <div>
            <div style="font-weight:700;color:${r.result === "ERREUR" ? "#dc2626" : "#111827"};">
              ${escapeHtml(r.result || "")}
            </div>

            <div style="font-size:12px;color:#6b7280;margin-top:2px;">
              ${escapeHtml(r.detail || "")}
            </div>
          </div>
        </div>
      `;
    }).join("")}
  `;
}

window.showAgentHistoryModalTab = showAgentHistoryModalTab;

async function openHistoryAgentSearchModal() {
  const modal = document.getElementById("history-agent-search-modal");
  if (modal) modal.style.display = "flex";

  await loadHistoryAgentCompanyOptions();
  await loadHistoryAgentSearchResults();
}

function closeHistoryAgentSearchModal() {
  const modal = document.getElementById("history-agent-search-modal");
  if (modal) modal.style.display = "none";
}

async function loadHistoryAgentCompanyOptions() {
  const select = document.getElementById("history-agent-company");
  if (!select) return;

  const current = select.value || "";

  const { data, error } = await supabaseClient
    .from("companies")
    .select("code")
    .order("code", { ascending: true });

  if (error) {
    console.error(error);
    return;
  }

  select.innerHTML = `<option value="">Toutes compagnies</option>`;

  (data || []).forEach(c => {
    const code = normalizeAdmin(c.code);
    if (!code) return;

    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = code;
    select.appendChild(opt);
  });

  if (current) select.value = current;

  select.onchange = loadHistoryAgentSearchResults;
}

async function loadHistoryAgentSearchResults() {
  const box = document.getElementById("history-agent-search-results");
  if (!box) return;

  const comp = normalizeAdmin(
    document.getElementById("history-agent-company")?.value || ""
  );

  const rawSearch =
    document.getElementById("history-agent-search-input")?.value || "";

  const search = normalizeAdmin(rawSearch);

  box.innerHTML = `
    <div style="padding:12px;color:#6b7280;">
      Chargement...
    </div>
  `;

  try {
    let query = supabaseClient
      .from("agents")
      .select("compagnie,sign,nom,prenom,status,email,phone,date_heure")
      .order("nom", { ascending: true })
      .order("prenom", { ascending: true })
      .limit(300);

    if (comp) {
      query = query.eq("compagnie", comp);
    }

    const { data, error } = await query;

    if (error) throw error;

    let rows = Array.isArray(data) ? data : [];

    if (search) {
      rows = rows.filter(a => {
        const nom = normalizeAdmin(a.nom || "");
        const prenom = normalizeAdmin(a.prenom || "");
        const sign = normalizeAdmin(a.sign || "");
        const compagnie = normalizeAdmin(a.compagnie || "");
        const status = normalizeAdmin(a.status || "");
        const email = normalizeAdmin(a.email || "");

        const full1 = `${nom} ${prenom}`;
        const full2 = `${prenom} ${nom}`;
        const full3 = `${sign} ${nom} ${prenom}`;
        const full4 = `${compagnie} ${sign} ${nom} ${prenom} ${status} ${email}`;

        return (
          nom.includes(search) ||
          prenom.includes(search) ||
          sign.includes(search) ||
          compagnie.includes(search) ||
          status.includes(search) ||
          email.includes(search) ||
          full1.includes(search) ||
          full2.includes(search) ||
          full3.includes(search) ||
          full4.includes(search)
        );
      });
    }

    rows.sort((a, b) => {
      const nomA = normalizeAdmin(`${a.nom || ""} ${a.prenom || ""}`);
      const nomB = normalizeAdmin(`${b.nom || ""} ${b.prenom || ""}`);

      if (nomA !== nomB) {
        return nomA.localeCompare(nomB, "fr", {
          sensitivity: "base",
          numeric: true
        });
      }

      return String(a.sign || "").localeCompare(String(b.sign || ""), "fr", {
        numeric: true
      });
    });

    if (!rows.length) {
      box.innerHTML = `
        <div style="padding:12px;color:#6b7280;">
          Aucun agent trouvé.
        </div>
      `;
      return;
    }

    box.innerHTML = rows.map(a => {
      const compagnie = normalizeAdmin(a.compagnie);
      const sign = String(a.sign || "").trim();
      const nom = `${a.nom || ""} ${a.prenom || ""}`.trim();
      const status = normalizeAdmin(a.status || "");

      const statusClass =
  status.includes("BLOQUE")
    ? "bloque"
    : status.includes("INACTIVE")
      ? "inactive"
      : "active";

return `
  <div
    class="history-agent-search-item"
    onclick="closeHistoryAgentSearchModal(); openAgentHistoryModal('${compagnie}', '${escapeJs(sign)}');"
  >
    <div class="history-agent-search-name">
      ${escapeHtml(nom || "—")}
    </div>

    <div class="history-agent-search-meta">
      ${escapeHtml(compagnie)} / ${escapeHtml(sign)}
      <span class="history-agent-search-status ${statusClass}">
        ${escapeHtml(status || "ACTIVE")}
      </span>
    </div>
  </div>
`;
      
    }).join("");

  } catch (err) {
    console.error("Erreur loadHistoryAgentSearchResults:", err);

    box.innerHTML = `
      <div style="padding:12px;color:#dc2626;font-weight:700;">
        Erreur recherche agent : ${escapeHtml(err.message || err)}
      </div>
    `;
  }
}

window.loadHistoryAgentSearchResults = loadHistoryAgentSearchResults;

function escapeJs(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'");
}

window.openHistoryAgentSearchModal = openHistoryAgentSearchModal;
window.closeHistoryAgentSearchModal = closeHistoryAgentSearchModal;
window.loadHistoryAgentSearchResults = loadHistoryAgentSearchResults;

async function computeAgentInactivityInfo(agent) {
  if (!agent) {
    return {
      lastDateText: "—",
      inactiveDateText: "—",
      alertDateText: "—"
    };
  }

  const compagnie = normalizeAdmin(agent.compagnie);

  const lastDate = getAgentLastSignatureDateAdmin(agent);

  if (!lastDate) {
    return {
      lastDateText: "—",
      inactiveDateText: "—",
      alertDateText: "—"
    };
  }

  try {
    const { data, error } = await supabaseClient
      .from("companies")
      .select("inactivite_jours,delai_alerte_jours")
      .eq("code", compagnie)
      .limit(1);

    if (error) throw error;

    const company = data && data.length ? data[0] : null;

    const inactiviteJours = Number(company?.inactivite_jours || 0);
    const alerteJours = Number(company?.delai_alerte_jours || 0);

    if (!inactiviteJours) {
      return {
        lastDateText: formatDateFRAdmin(lastDate),
        inactiveDateText: "—",
        alertDateText: "—"
      };
    }

    const inactiveDate = addDaysAdmin(lastDate, inactiviteJours);
    const alertDate = addDaysAdmin(inactiveDate, -Math.abs(alerteJours));

    return {
      lastDateText: formatDateFRAdmin(lastDate),
      inactiveDateText: formatDateFRAdmin(inactiveDate),
      alertDateText: formatDateFRAdmin(alertDate)
    };

  } catch (err) {
    console.warn("Erreur computeAgentInactivityInfo:", err);

    return {
      lastDateText: formatDateFRAdmin(lastDate),
      inactiveDateText: "—",
      alertDateText: "—"
    };
  }
}

function getAgentLastSignatureDateAdmin(agent) {
  return (
    parseDateAdmin(agent.date_heure) ||
    parseDateAdmin(agent.derniere_utilisation) ||
    parseDateAdmin(agent.last_use) ||
    parseDateAdmin(agent.updated_at) ||
    parseDateAdmin(agent.created_at)
  );
}

function parseDateAdmin(value) {
  if (!value) return null;

  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  const str = String(value).trim();
  if (!str) return null;

  const iso = new Date(str);
  if (!isNaN(iso.getTime())) return iso;

  const fr = str.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (fr) {
    const dd = Number(fr[1]);
    const mm = Number(fr[2]) - 1;
    let yyyy = Number(fr[3]);

    if (yyyy < 100) yyyy += 2000;

    const hh = Number(fr[4] || 0);
    const mi = Number(fr[5] || 0);
    const ss = Number(fr[6] || 0);

    const d = new Date(yyyy, mm, dd, hh, mi, ss);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function addDaysAdmin(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

function formatDateFRAdmin(value) {
  const d = value instanceof Date ? value : parseDateAdmin(value);

  if (!d || isNaN(d.getTime())) return "—";

  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}