/* =========================================================
   SIGNATURE.JS
========================================================= */

/* =========================================================
   LOGOS
========================================================= */

const COMPANY_LOGOS = {

  AT: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Logo_Royal_Air_Maroc.svg/1280px-Logo_Royal_Air_Maroc.svg.png",

  SQ: "https://upload.wikimedia.org/wikipedia/fr/thumb/3/3f/Logo_Singapore_Airlines.svg/1280px-Logo_Singapore_Airlines_logo.svg.png",

  AI: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Air_India_2023.svg/1280px-Air_India_2023.svg.png",

  S4: "https://upload.wikimedia.org/wikipedia/de/thumb/7/78/SATA_Air_Acores_Logo.svg/1280px-SATA_Air_Acores_Logo.svg.png",

  VF: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/AJet_logo.svg/1280px-AJet_logo.svg.png",

  FI: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Icelandairlogo.svg/1280px-Icelandairlogo.svg.png",

  SK: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Scandinavian_Airlines_logo.svg/1280px-Scandinavian_Airlines_logo.svg.png",

  OZ: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Asiana_Airlines-Logo_New.svg/1280px-Asiana_Airlines-Logo_New.svg.png",

  LO: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/LOT_wordmark.svg/1280px-LOT_wordmark.svg.png",

  LY: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Logo_of_El_Al_Israel_Airlines.svg/1280px-Logo_of_El_Al_Israel_Airlines.svg.png",

  TK: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Turkish_Airlines_logo_2019_compact.svg/1280px-Turkish_Airlines_logo_2019_compact.svg.png",

  HF: "https://upload.wikimedia.org/wikipedia/commons/5/57/Air_C%C3%B4te_d%27Ivoire_logo.png",

  JU: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Air_Serbia_logo.svg/1280px-Air_Serbia_logo.svg.png",

  AV: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Avianca.svg/1280px-Avianca.svg.png",

  HU: "https://upload.wikimedia.org/wikipedia/ru/thumb/c/cd/Hainan_Airlines_Logo.svg/1280px-Hainan_Airlines_Logo.svg.png",

  LA: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Latam-logo_-v_%28Indigo%29.svg/1280px-Latam-logo_-v_%28Indigo%29.svg.png",

  DE: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Condor_logo_2022.svg/1280px-Condor_logo_2022.svg.png",

  TS: "https://upload.wikimedia.org/wikipedia/fr/thumb/6/64/Air_Transat_%28logo%2C_2017%29.svg/1280px-Air_Transat_%28logo%2C_2017%29.svg.png",

  BJ: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Nouvelair_Logo.svg/1280px-Nouvelair_Logo.svg.png",

  SB: "https://upload.wikimedia.org/wikipedia/fr/thumb/c/cc/Logo_Aircalin.svg/1280px-Logo_Aircalin.svg.png",

  MH: "https://upload.wikimedia.org/wikipedia/fr/thumb/5/50/Logo_Malaysia_Airlines_2021.svg/1280px-Logo_Malaysia_Airlines_2021.svg.png",

  EI: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/93/Aer_Lingus_2022_logo.svg/1280px-Aer_Lingus_2022_logo.svg.png",

  FB: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Bulgaria_Air_logo.svg/1280px-Bulgaria_Air_logo.svg.png",

  WB: "https://upload.wikimedia.org/wikipedia/commons/5/50/RwandAir_Logotype.png",

  TW: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/T%27way_Air_logo.svg/1280px-T%27way_Air_logo.svg.png",

  IZ: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Arkia_Israeli_logo.svg/1280px-Arkia_Israeli_logo.svg.png",

  "3O": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Air_Arabia_Logo.svg/1280px-Air_Arabia_Logo.svg.png",

  HM: "https://upload.wikimedia.org/wikipedia/fr/thumb/1/13/Logo_Air_Seychelles.png/1280px-Logo_Air_Seychelles.png"

};


/* =========================================================
   GLOBALS
========================================================= */

let CURRENT_COMPAGNIE = null;
let CURRENT_AGENT = null;
let CURRENT_STATUS = "ACTIVE";


/* =========================================================
   GET COMPAGNIE FROM URL
========================================================= */

function getCompagnieFromURL() {

  const params =
    new URLSearchParams(window.location.search);

  return params.get("compagnie");

}


/* =========================================================
   INIT PAGE
========================================================= */

document.addEventListener("DOMContentLoaded", async function () {

  CURRENT_COMPAGNIE =
    getCompagnieFromURL();

  console.log(
    "COMPAGNIE :",
    CURRENT_COMPAGNIE
  );

  if (!CURRENT_COMPAGNIE) {

    alert(
      "Aucune compagnie détectée."
    );

    return;

  }

  initCompany();

  await loadAgents();

  initStatusButtons();

  initValidation();

});


/* =========================================================
   INIT COMPANY
========================================================= */

function initCompany() {

  const companyName =
    document.getElementById("companyName");

  if (companyName) {

    companyName.textContent =
      CURRENT_COMPAGNIE;

  }

  const companyLogo =
    document.getElementById("companyLogo");

  if (
    companyLogo &&
    COMPANY_LOGOS[CURRENT_COMPAGNIE]
  ) {

    companyLogo.src =
      COMPANY_LOGOS[CURRENT_COMPAGNIE];

  }

}


/* =========================================================
   LOAD AGENTS
========================================================= */

async function loadAgents() {

  const select =
    document.getElementById("agentSelect");

  if (!select) return;

  select.innerHTML =
    '<option value="">Sélectionnez un agent</option>';

  try {

    const agents =
      await getAgents(CURRENT_COMPAGNIE);

    console.log(
      "AGENTS :",
      agents
    );

    if (!agents || agents.length === 0) {

      const option =
        document.createElement("option");

      option.textContent =
        "Aucun agent";

      select.appendChild(option);

      return;

    }

    agents.sort(function (a, b) {
  const nomA = String(a.nom || "").trim().toUpperCase();
  const nomB = String(b.nom || "").trim().toUpperCase();

  if (nomA !== nomB) {
    return nomA.localeCompare(nomB, "fr", {
      sensitivity: "base",
      numeric: true
    });
  }

  const prenomA = String(a.prenom || "").trim().toUpperCase();
  const prenomB = String(b.prenom || "").trim().toUpperCase();

  if (prenomA !== prenomB) {
    return prenomA.localeCompare(prenomB, "fr", {
      sensitivity: "base",
      numeric: true
    });
  }

  return String(a.sign || "").localeCompare(String(b.sign || ""), "fr", {
    numeric: true
  });
});

    agents.forEach(function (agent) {

      const option =
        document.createElement("option");

      option.dataset.email =
  agent.email || "";

option.dataset.phone =
  agent.phone || "";

option.dataset.last =
  agent.last_activity || "—";

      option.value =
        agent.sign || "";

      option.dataset.status =
        agent.status || "ACTIVE";

      option.dataset.nom =
        agent.nom || "";

      option.dataset.prenom =
        agent.prenom || "";

      option.textContent =
        `${agent.sign || ""} - ${agent.nom || ""} ${agent.prenom || ""}`;

      select.appendChild(option);

    });

    select.addEventListener(
      "change",
      onAgentChange
    );

  } catch (error) {

    console.error(
      "Erreur chargement agents :",
      error
    );

  }

}

/* =========================================================
   LOAD LAST ACTIVITY
========================================================= */

async function loadLastActivity(sign) {

  try {

    const {
      data,
      error
    } = await supabaseClient
      .from("signatures")
      .select("created_at")
      .eq("sign", sign)
      .eq("compagnie", CURRENT_COMPAGNIE)
      .order("created_at", {
        ascending: false
      })
      .limit(1);

    if (error) {

      console.error(error);

      return "—";

    }

    if (!data || data.length === 0) {

      return "—";

    }

    const date =
      new Date(data[0].created_at);

    return date.toLocaleString(
      "fr-FR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  } catch (err) {

    console.error(err);

    return "—";

  }

}
/* =========================================================
   AGENT CHANGE
========================================================= */

function onAgentChange(event) {

  const option =
    event.target.selectedOptions[0];

  if (!option) return;

  CURRENT_AGENT = {

    email:
  option.dataset.email,

phone:
  option.dataset.phone,

last_activity:
  option.dataset.last,

    sign:
      option.value,

    nom:
      option.dataset.nom,

    prenom:
      option.dataset.prenom,

    status:
      option.dataset.status

  };
loadRealAgentInfos();
  console.log(
    "CURRENT_AGENT :",
    CURRENT_AGENT
  );

}

/* =========================================================
   LOAD REAL INFOS
========================================================= */

async function loadRealAgentInfos() {

  if (!CURRENT_AGENT)
    return;

  CURRENT_AGENT.last_activity =
    await loadLastActivity(
      CURRENT_AGENT.sign
    );

  updateAgentInfos();

}

/* =========================================================
   STATUS BUTTONS
========================================================= */

function initStatusButtons() {

  const buttons =
    document.querySelectorAll(".status-btn");

  buttons.forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        buttons.forEach(function (btn) {

          btn.classList.remove("active");

        });

        button.classList.add("active");

        CURRENT_STATUS =
          button.textContent.trim();

        console.log(
          "STATUS :",
          CURRENT_STATUS
        );

      }
    );

  });

}


/* =========================================================
   VALIDATION
========================================================= */

function initValidation() {

  const button =
    document.querySelector(".submit-btn");

  if (!button) return;

  button.addEventListener(
    "click",
    submitSignature
  );

}


/* =========================================================
   SUBMIT
========================================================= */

/* =========================================================
   SUBMIT SIGNATURE
========================================================= */

async function submitSignature() {

  if (!CURRENT_AGENT) {
    alert("Merci de sélectionner un agent.");
    return;
  }

  const submitBtn =
    document.querySelector(".submit-btn");

  submitBtn.disabled = true;

  submitBtn.innerHTML = `
    <span class="material-icons">
      hourglass_top
    </span>
    Enregistrement.
  `;

  try {

    const cleanStatus =
      String(CURRENT_STATUS || "")
        .trim()
        .toUpperCase()
        .replace("BLOQUÉE", "BLOQUE")
        .replace("BLOQUEE", "BLOQUE");

    const nowIso =
      new Date().toISOString();

    const beforeAgentData = {
      status: CURRENT_AGENT.status || null,
      carence: CURRENT_AGENT.carence || null,
      email: CURRENT_AGENT.email || null,
      phone: CURRENT_AGENT.phone || null
    };

    const payload = {
      compagnie: CURRENT_COMPAGNIE,
      sign: CURRENT_AGENT.sign,
      nom: CURRENT_AGENT.nom,
      prenom: CURRENT_AGENT.prenom,
      status: cleanStatus,
      created_at: nowIso
    };

    console.log("PAYLOAD:", payload);

    /* =========================================
       1. INSERT HISTORIQUE SIGNATURE
    ========================================= */

    const { error } = await supabaseClient
      .from("signatures")
      .insert([payload]);

    if (error) {
      console.error(error);
      throw error;
    }

    /* =========================================
       2. UPDATE TABLE AGENTS POUR ADMIN / KPI
    ========================================= */

    const { error: updateAgentError } = await supabaseClient
      .from("agents")
      .update({
        status: cleanStatus,
        date_heure: nowIso,
        source: "SIGNATURE_PORTAIL"
      })
      .eq("compagnie", CURRENT_COMPAGNIE)
      .eq("sign", CURRENT_AGENT.sign);

    if (updateAgentError) {
      console.error("Erreur update agent:", updateAgentError);
      throw updateAgentError;
    }

    /* =========================================
       3. LOG HISTORIQUE ACTION AGENT
    ========================================= */

    const afterAgentData = {
      status: cleanStatus,
      carence: CURRENT_AGENT.carence || null,
      email: CURRENT_AGENT.email || null,
      phone: CURRENT_AGENT.phone || null,
      date_heure: nowIso
    };

    await logAgentPortalAction({
      action:
        normalizeStatusForHistory(beforeAgentData.status) !== normalizeStatusForHistory(cleanStatus)
          ? "AGENT_STATUS_CHANGED_BY_AGENT"
          : "AGENT_SIGNATURE_VALIDATED",
      before_data: beforeAgentData,
      after_data: afterAgentData,
      result: "OK",
      error: null
    });

    CURRENT_AGENT.status = cleanStatus;
    CURRENT_AGENT.last_activity = nowIso;
    CURRENT_STATUS = cleanStatus;

    /* =========================================
       4. SUCCESS MODAL
    ========================================= */

    const now =
      new Date();

    const heure =
      now.toLocaleTimeString(
        "fr-FR",
        {
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    const content =
      document.getElementById("successContent");

    content.innerHTML = `
      <div>
        <strong>Compagnie :</strong>
        ${CURRENT_COMPAGNIE}
      </div>

      <div>
        <strong>Agent :</strong>
        ${CURRENT_AGENT.sign}
        -
        ${CURRENT_AGENT.nom}
        ${CURRENT_AGENT.prenom}
      </div>

      <div>
        <strong>Statut :</strong>
        ${cleanStatus}
      </div>

      <div>
        <strong>Heure :</strong>
        ${heure}
      </div>
    `;

    document
      .getElementById("successModal")
      .classList.add("show");

    try {
      updateAgentInfos();
    } catch (e) {}

  } catch (error) {

    console.error(error);

    try {
      await logAgentPortalAction({
        action: "AGENT_SIGNATURE_ERROR",
        before_data: CURRENT_AGENT || null,
        after_data: null,
        result: "ERROR",
        error: error.message || String(error)
      });
    } catch (e) {}

    alert("Erreur critique");

  }

  submitBtn.disabled = false;

  submitBtn.innerHTML = `
    <span class="material-icons">
      lock
    </span>
    Valider la signature
  `;

}

/* =========================================================
   CLOSE MODAL
========================================================= */

document
  .getElementById("closeModalBtn")
  ?.addEventListener(
    "click",
    function () {

      document
        .getElementById(
          "successModal"
        )
        .classList.remove("show");

    }
  );
  /* =========================================================
   EMAIL / PHONE MODALS
========================================================= */

const mailModal =
  document.getElementById(
    "mailModal"
  );

const phoneModal =
  document.getElementById(
    "phoneModal"
  );

const editMailBtn =
  document.getElementById(
    "editMailBtn"
  );

const editPhoneBtn =
  document.getElementById(
    "editPhoneBtn"
  );

const saveMailBtn =
  document.getElementById(
    "saveMailBtn"
  );

const savePhoneBtn =
  document.getElementById(
    "savePhoneBtn"
  );


/* =========================================================
   OPEN EMAIL
========================================================= */

if (editMailBtn) {

  editMailBtn.addEventListener(
    "click",
    function () {

      if (!CURRENT_AGENT) {

        alert(
          "Sélectionnez un agent."
        );

        return;

      }

      mailModal.classList.add(
        "show"
      );

    }
  );

}


/* =========================================================
   OPEN PHONE
========================================================= */

if (editPhoneBtn) {

  editPhoneBtn.addEventListener(
    "click",
    function () {

      if (!CURRENT_AGENT) {

        alert(
          "Sélectionnez un agent."
        );

        return;

      }

      phoneModal.classList.add(
        "show"
      );

    }
  );

}


/* =========================================================
   CLOSE MODAL CLICK OUTSIDE
========================================================= */

window.addEventListener(
  "click",
  function (e) {

    if (e.target === mailModal) {

      mailModal.classList.remove(
        "show"
      );

    }

    if (e.target === phoneModal) {

      phoneModal.classList.remove(
        "show"
      );

    }

  }
);


/* =========================================================
   SAVE EMAIL
========================================================= */

if (saveMailBtn) {

  saveMailBtn.addEventListener(
    "click",
    async function () {

      const input =
        document.getElementById(
          "mailInput"
        );

      const email =
        input.value.trim();

      if (!email) {

        alert(
          "Email invalide."
        );

        return;

      }

      try {

        const {
          error
        } = await supabaseClient
          .from("agents")
          .update({
            email: email
          })
          .eq("compagnie", CURRENT_COMPAGNIE)
.eq("sign", CURRENT_AGENT.sign);

        if (error) {

          console.error(error);

          alert(
            "Erreur email"
          );

          return;

        }

        mailModal.classList.remove(
          "show"
        );

        CURRENT_AGENT.email = email;

updateContactBadgesFromAgent(CURRENT_AGENT);

input.value = "";

alert(
  "Email modifié."
);

      } catch (err) {

        console.error(err);

      }

    }
  );

}


/* =========================================================
   SAVE PHONE
========================================================= */

if (savePhoneBtn) {

  savePhoneBtn.addEventListener(
    "click",
    async function () {

      const input =
        document.getElementById(
          "phoneInput"
        );

      const phone =
        input.value.trim();

      if (!phone) {

        alert(
          "Téléphone invalide."
        );

        return;

      }

      try {

        const {
          error
        } = await supabaseClient
          .from("agents")
          .update({
            phone: phone
          })
          .eq("compagnie", CURRENT_COMPAGNIE)
.eq("sign", CURRENT_AGENT.sign);

        if (error) {

          console.error(error);

          alert(
            "Erreur téléphone"
          );

          return;

        }

        phoneModal.classList.remove(
          "show"
        );

        input.value = "";

        alert(
          "Téléphone modifié."
        );

      } catch (err) {

        console.error(err);

      }

    }
  );

}
/* =========================================================
   ADD AGENT MODAL
========================================================= */

const addAgentModal =
  document.getElementById(
    "addAgentModal"
  );

const openAddAgentModalBtn =
  document.getElementById(
    "openAddAgentModal"
  );

const saveNewAgentBtn =
  document.getElementById(
    "saveNewAgentBtn"
  );


/* =========================================================
   OPEN MODAL
========================================================= */

if (openAddAgentModalBtn) {

  openAddAgentModalBtn
    .addEventListener(
      "click",
      function () {

        addAgentModal
          .classList
          .add("show");

      }
    );

}


/* =========================================================
   CLOSE OUTSIDE
========================================================= */

window.addEventListener(
  "click",
  function (e) {

    if (e.target === addAgentModal) {

      addAgentModal
        .classList
        .remove("show");

    }

  }
);


/* =========================================================
   SAVE NEW AGENT
========================================================= */

if (saveNewAgentBtn) {

  saveNewAgentBtn
    .addEventListener(
      "click",
      async function () {

        const sign =
          document
            .getElementById(
              "newAgentSign"
            )
            .value
            .trim()
            .toUpperCase();

        const nom =
          document
            .getElementById(
              "newAgentNom"
            )
            .value
            .trim();

        const prenom =
          document
            .getElementById(
              "newAgentPrenom"
            )
            .value
            .trim();

        const email =
          document
            .getElementById(
              "newAgentMail"
            )
            .value
            .trim();

        const phone =
          document
            .getElementById(
              "newAgentPhone"
            )
            .value
            .trim();

        const status =
          document
            .getElementById(
              "newAgentStatus"
            )
            .value;

        if (
          !sign ||
          !nom ||
          !prenom
        ) {

          alert(
            "Merci de remplir les champs obligatoires."
          );

          return;

        }

        saveNewAgentBtn.disabled = true;

        saveNewAgentBtn.innerHTML =
          "Création...";

        try {

          const payload = {

            compagnie:
              CURRENT_COMPAGNIE,

            sign:
              sign,

            nom:
              nom,

            prenom:
              prenom,

            email:
              email,

            phone:
              phone,

            status:
              status

          };

          console.log(
            "NEW AGENT:",
            payload
          );

          /* =====================================
   CHECK DOUBLON SIGN
===================================== */

const {
  data: existingAgent,
  error: checkError
} = await supabaseClient
  .from("agents")
  .select("sign")
  .eq("sign", sign)
  .single();

if (checkError && checkError.code !== "PGRST116") {

  console.error(checkError);

  alert(
    "Erreur vérification SIGN."
  );

  return;

}

if (existingAgent) {

  alert(
    "Ce SIGN existe déjà."
  );

  saveNewAgentBtn.disabled = false;

  saveNewAgentBtn.innerHTML =
    "Créer l'agent";

  return;

}

/* =====================================
   INSERT AGENT
===================================== */

const {
  error
} = await supabaseClient
  .from("agents")
  .insert([payload]);

          if (error) {

            console.error(error);

            alert(
              "Erreur création agent."
            );

            return;

          }

          /* =====================================
             RESET
          ===================================== */

          document
            .getElementById(
              "newAgentSign"
            )
            .value = "";

          document
            .getElementById(
              "newAgentNom"
            )
            .value = "";

          document
            .getElementById(
              "newAgentPrenom"
            )
            .value = "";

          document
            .getElementById(
              "newAgentMail"
            )
            .value = "";

          document
            .getElementById(
              "newAgentPhone"
            )
            .value = "";

          document
            .getElementById(
              "newAgentStatus"
            )
            .value = "ACTIVE";

          addAgentModal
            .classList
            .remove("show");

          alert(
            "Agent créé."
          );

          /* =====================================
             RELOAD AGENTS
          ===================================== */

          await loadAgents();
          /* =====================================
   AUTO SELECT NEW AGENT
===================================== */

const select =
  document.getElementById(
    "agentSelect"
  );

if (select) {

  select.value = sign;

  const event =
    new Event("change");

  select.dispatchEvent(event);

}

        } catch (err) {

          console.error(err);

          alert(
            "Erreur serveur."
          );

        }

        saveNewAgentBtn.disabled = false;

        saveNewAgentBtn.innerHTML =
          "Créer l'agent";

      }
    );

}
/* =========================================================
   SEARCH AGENT
========================================================= */
function updateContactBadgesFromAgent(agent) {
  const emailBadge = document.getElementById("emailBadge");
  const phoneBadge = document.getElementById("phoneBadge");

  const emailValue = String(
    agent?.email ||
    agent?.adresse_mail ||
    agent?.adresseMail ||
    agent?.mail ||
    agent?.MAIL ||
    ""
  ).trim();

  const phoneValue = String(
    agent?.phone ||
    agent?.telephone ||
    agent?.tel ||
    agent?.mobile ||
    agent?.whatsapp ||
    ""
  ).trim();

  if (emailBadge) {
    if (emailValue) {
      emailBadge.textContent = "OK";
      emailBadge.className = "badge-ok";
    } else {
      emailBadge.textContent = "NOK";
      emailBadge.className = "badge-nok";
    }
  }

  if (phoneBadge) {
    if (phoneValue) {
      phoneBadge.textContent = "OK";
      phoneBadge.className = "badge-ok";
    } else {
      phoneBadge.textContent = "NOK";
      phoneBadge.className = "badge-nok";
    }
  }
}


/* =========================================================
   UPDATE INFOS
========================================================= */

function updateAgentInfos() {

  if (!CURRENT_AGENT)
    return;

  const badge =
    document.getElementById(
      "agentStatusBadge"
    );

  const email =
  document.getElementById("agentEmail");

const phone =
  document.getElementById("agentPhone");

if (email) {
  email.textContent =
    CURRENT_AGENT?.email || ""
}

if (phone) {
  phone.textContent =
    CURRENT_AGENT?.phone || ""
}

  const last =
    document.getElementById(
      "lastActivity"
    );

  last.textContent =
    CURRENT_AGENT.last_activity || "—";

  badge.className = "";

  if (
    CURRENT_AGENT.status ===
    "ACTIVE"
  ) {

    badge.classList.add(
      "badge-active"
    );

  } else if (
    CURRENT_AGENT.status ===
    "INACTIVE"
  ) {

    badge.classList.add(
      "badge-inactive"
    );

  } else {

    badge.classList.add(
      "badge-blocked"
    );

  }

  badge.textContent =
    CURRENT_AGENT.status;

updateContactBadgesFromAgent(CURRENT_AGENT);
}
/* =========================================================
   CARENCE
========================================================= */

let CURRENT_CARENCE = false;

const carenceNonBtn =
  document.getElementById(
    "carenceNonBtn"
  );

const carenceOuiBtn =
  document.getElementById(
    "carenceOuiBtn"
  );

const carenceDates =
  document.getElementById(
    "carenceDates"
  );

if (
  carenceNonBtn &&
  carenceOuiBtn
){

  carenceNonBtn.addEventListener(
    "click",
    function(){

      CURRENT_CARENCE = false;

      carenceNonBtn.classList.add(
        "active"
      );

      carenceOuiBtn.classList.remove(
        "active"
      );

      carenceDates.style.display =
        "none";

    }
  );

  carenceOuiBtn.addEventListener(
    "click",
    function(){

      CURRENT_CARENCE = true;

      carenceOuiBtn.classList.add(
        "active"
      );

      carenceNonBtn.classList.remove(
        "active"
      );

      carenceDates.style.display =
        "block";

    }
  );

}
  /* =========================================
     EMAIL BADGE
  ========================================= */

  const emailBadge =
    document.getElementById(
      "emailBadge"
    );

  if (emailBadge) {

    if (
      CURRENT_AGENT.email &&
      CURRENT_AGENT.email.trim() !== ""
    ) {

      emailBadge.textContent =
        "OK";

      emailBadge.className =
        "badge-ok";

    } else {

      emailBadge.textContent =
        "NOK";

      emailBadge.className =
        "badge-nok";

    }

  }

  /* =========================================
     PHONE BADGE
  ========================================= */

  const phoneBadge =
    document.getElementById(
      "phoneBadge"
    );

  if (phoneBadge) {

    if (
      CURRENT_AGENT.phone &&
      CURRENT_AGENT.phone.trim() !== ""
    ) {

      phoneBadge.textContent =
        "OK";

      phoneBadge.className =
        "badge-ok";

    } else {

      phoneBadge.textContent =
        "NOK";

      phoneBadge.className =
        "badge-nok";

    }

  }

  async function logAgentPortalAction({
  action,
  before_data = null,
  after_data = null,
  result = "OK",
  error = null
}) {
  try {
    if (!CURRENT_AGENT || !CURRENT_COMPAGNIE) return;

    await supabaseClient
      .from("admin_logs")
      .insert([{
        actor: "AGENT_PORTAIL",
        source: "SIGNATURE_PAGE",
        action,
        compagnie: CURRENT_COMPAGNIE,
        sign: CURRENT_AGENT.sign || null,
        nom: `${CURRENT_AGENT.nom || ""} ${CURRENT_AGENT.prenom || ""}`.trim(),
        target_type: "AGENT",
        target_id: `${CURRENT_COMPAGNIE}/${CURRENT_AGENT.sign || ""}`,
        before_data,
        after_data,
        result,
        error
      }]);

  } catch (err) {
    console.warn("Erreur logAgentPortalAction:", err);
  }
}

function normalizeStatusForHistory(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace("BLOQUÉE", "BLOQUE")
    .replace("BLOQUEE", "BLOQUE");
}

async function logAgentPortalAction({
  action,
  before_data = null,
  after_data = null,
  result = "OK",
  error = null
}) {
  try {
    if (!CURRENT_AGENT || !CURRENT_COMPAGNIE) return;

    await supabaseClient
      .from("admin_logs")
      .insert([{
        actor: "AGENT_PORTAIL",
        source: "SIGNATURE_PAGE",
        action: action,
        compagnie: CURRENT_COMPAGNIE,
        sign: CURRENT_AGENT.sign || null,
        nom: `${CURRENT_AGENT.nom || ""} ${CURRENT_AGENT.prenom || ""}`.trim(),
        target_type: "AGENT",
        target_id: `${CURRENT_COMPAGNIE}/${CURRENT_AGENT.sign || ""}`,
        before_data: before_data,
        after_data: after_data,
        result: result,
        error: error
      }]);

  } catch (err) {
    console.warn("Erreur logAgentPortalAction:", err);
  }
}