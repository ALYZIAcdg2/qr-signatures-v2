/* =========================================================
   PORTAIL.JS
========================================================= */

/* =========================================================
   HORLOGE
========================================================= */

function updateClock() {

  const d = new Date();

  const pad = (n) =>
    n.toString().padStart(2, "0");

  const clock =
    document.getElementById("clock");

  if (!clock) return;

  clock.textContent =
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds()) +
    " — " +
    pad(d.getDate()) +
    "/" +
    pad(d.getMonth() + 1) +
    "/" +
    d.getFullYear();

}

setInterval(updateClock, 1000);

updateClock();


/* =========================================================
   LOGOS
========================================================= */

const COMPANY_META = {

  AT: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Logo_Royal_Air_Maroc.svg/1280px-Logo_Royal_Air_Maroc.svg.png",

  SQ: "https://upload.wikimedia.org/wikipedia/fr/thumb/3/3f/Logo_Singapore_Airlines.svg/1280px-Logo_Singapore_Airlines.svg.png",

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

  DE: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Rgb_condor_logo_black.png/1280px-Rgb_condor_logo_black.png",

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
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  console.log("PORTAIL INIT");

  const grid = document.getElementById("company-grid");

  if (!grid) {
    console.error("company-grid introuvable");
    return;
  }

  grid.innerHTML = `
    <div style="padding:20px;color:#6b7280;">
      Chargement...
    </div>
  `;

  try {
    const { data, error } = await supabaseClient
      .from("companies")
      .select("code, show_portail")
      .eq("show_portail", true)
      .order("code", { ascending: true });

    if (error) throw error;

    const companies = Array.isArray(data) ? data : [];

    console.log("COMPAGNIES PORTAIL:", companies);

    grid.innerHTML = "";

    if (!companies.length) {
      grid.innerHTML = `
        <div style="padding:20px;color:#6b7280;">
          Aucune compagnie activée sur le portail.
        </div>
      `;
      return;
    }

    companies.forEach(company => {
      const code = String(company.code || "").trim().toUpperCase();

      if (!code) return;

      const card = document.createElement("a");

      card.className = "company-card";

      card.href = `./Index.html?compagnie=${code}`;

      const logo = COMPANY_META[code] || "";

      card.innerHTML = `
        <div class="company-code">
          ${code}
        </div>

        <div class="company-logo">
          <img
            src="${logo}"
            alt="${code}"
            onerror="this.style.display='none';"
          >
        </div>
      `;

      grid.appendChild(card);
    });

  } catch (error) {
    console.error("Erreur portail:", error);

    grid.innerHTML = `
      <div style="padding:20px;color:#dc2626;font-weight:700;">
        Erreur chargement portail.
      </div>
    `;
  }
});