const welcomeTitle = document.getElementById("welcomeTitle");
const welcomeSubtitle = document.getElementById("welcomeSubtitle");
const userFirma = document.getElementById("userFirma");
const userPib = document.getElementById("userPib");
const bankInfoYearInput = document.getElementById("bankInfoYearInput");
const loadBankInfoBtn = document.getElementById("loadBankInfoBtn");
const bankInfoStatus = document.getElementById("bankInfoStatus");
const bankInfoTableBody = document.querySelector("#bankInfoTable tbody");
const latestInvoiceInfo = document.getElementById("latestInvoiceInfo");
const karticaPanel = document.getElementById("karticaPanel");
const karticaTitle = document.getElementById("karticaTitle");
const karticaSubtitle = document.getElementById("karticaSubtitle");
const karticaStatus = document.getElementById("karticaStatus");
const karticaTableBody = document.querySelector("#karticaTable tbody");
const closeKarticaBtn = document.getElementById("closeKarticaBtn");
const printKarticaBtn = document.getElementById("printKarticaBtn");
const loadPlateBtn = document.getElementById("loadPlateBtn");
const plateStatus = document.getElementById("plateStatus");
const plateFirmaCard = document.getElementById("plateFirmaCard");
const plateMonthsCard = document.getElementById("plateMonthsCard");
const plateDetailsCard = document.getElementById("plateDetailsCard");
const plateFirmaNaziv = document.getElementById("plateFirmaNaziv");
const plateFirmaPib = document.getElementById("plateFirmaPib");
const plateFirmaRadnici = document.getElementById("plateFirmaRadnici");
const plateFirmaAktivni = document.getElementById("plateFirmaAktivni");
const plateFirmaObracuni = document.getElementById("plateFirmaObracuni");
const plateMonthsTableBody = document.querySelector("#plateMonthsTable tbody");
const plateDetailsTableBody = document.querySelector("#plateDetailsTable tbody");
const plateDetailsTitle = document.getElementById("plateDetailsTitle");
const kalkulacijeYearInput = document.getElementById("kalkulacijeYearInput");
const kalkulacijeObjekatSelect = document.getElementById("kalkulacijeObjekatSelect");
const loadKalkulacijeBtn = document.getElementById("loadKalkulacijeBtn");
const kalkulacijeStatus = document.getElementById("kalkulacijeStatus");
const kalkulacijeSummary = document.getElementById("kalkulacijeSummary");
const kalkulacijeTableBody = document.querySelector("#kalkulacijeTable tbody");

const saldaConfig = {
  kupci: {
    tableId: "saldaTableKupci",
    statusId: "saldaStatusKupci",
    latestId: "latestInvoiceKupci",
  },
  "ino-kupci": {
    tableId: "saldaTableInoKupci",
    statusId: "saldaStatusInoKupci",
    latestId: "latestInvoiceInoKupci",
  },
  dobavljaci: {
    tableId: "saldaTableDobavljaci",
    statusId: "saldaStatusDobavljaci",
  },
  "ino-dobavljaci": {
    tableId: "saldaTableInoDobavljaci",
    statusId: "saldaStatusInoDobavljaci",
  },
};

const loadedSalda = new Set();
let currentKartica = null;
let plateLoaded = false;
let kalkulacijeLoaded = false;

async function loadUserHome() {
  try {
    const response = await fetch("/portal/me");
    const result = await response.json();

    if (!result.success) {
      window.location.href = "/index.html";
      return;
    }

    const displayName = result.user.DisplayName || result.user.Username;
    const firma = result.firma;

    welcomeTitle.textContent = `Dobrodosao, ${displayName}`;
    welcomeSubtitle.textContent = firma
      ? `Portal za firmu ${firma.NazivFirme || firma.ApUser}`
      : "Nije dodijeljena firma.";
    userFirma.textContent = firma?.NazivFirme || firma?.ApUser || "-";
    userPib.textContent = firma?.PIB || "-";
  } catch (error) {
    welcomeSubtitle.textContent = error.message;
  }
}

function initUserMenu() {
  const menuItems = document.querySelectorAll("[data-user-section]");
  const sections = document.querySelectorAll(".user-section");

  function showSection(sectionName) {
    const section = document.getElementById(`user-section-${sectionName}`);
    if (!section) return;

    menuItems.forEach((item) => {
      item.classList.toggle(
        "active",
        item.dataset.userSection === sectionName,
      );
    });
    sections.forEach((item) => item.classList.remove("active"));
    section.classList.add("active");
    karticaPanel.classList.add("d-none");

    if (sectionName === "info") {
      loadBankInfo();
      return;
    }

    if (sectionName === "plate") {
      loadPlatePregled();
      return;
    }

    if (sectionName === "kalkulacije") {
      loadKalkulacije();
      return;
    }

    if (!loadedSalda.has(sectionName)) {
      loadSalda(sectionName);
    }
  }

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      window.location.hash = item.dataset.userSection;
      showSection(item.dataset.userSection);
    });
  });

  if (window.location.hash) {
    showSection(window.location.hash.slice(1));
  } else {
    loadBankInfo();
  }
}

function setBankInfoStatus(message, variant = "info") {
  bankInfoStatus.textContent = message;
  bankInfoStatus.className = `alert alert-${variant}`;
  bankInfoStatus.classList.remove("d-none");
}

function clearBankInfoStatus() {
  bankInfoStatus.classList.add("d-none");
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString("sr-RS") : "-";
}

function latestInvoiceText(invoice) {
  if (!invoice) return "Posljednji knjizeni racun: -";

  const number = invoice.OpisRacuna || invoice.BrojRacuna || "-";
  return `Posljednji knjizeni racun je ${number} od ${formatDate(invoice.DatumRacuna)}`;
}

function renderBankInfo(rows) {
  if (!rows.length) {
    bankInfoTableBody.innerHTML =
      '<tr><td colspan="4" class="text-center">Nema izvoda za izabranu godinu</td></tr>';
    return;
  }

  bankInfoTableBody.innerHTML = "";
  rows.forEach((row) => {
    const missing = row.missing && row.missing.length;
    const missingText = missing
      ? row.missing.slice(0, 60).join(", ") +
        (row.missing.length > 60 ? " ..." : "")
      : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.bankaNaziv}</td>
      <td>${row.maxRbr || "-"}</td>
      <td>${formatDate(row.maxDate)}</td>
      <td class="${missing ? "text-danger fw-semibold" : ""}">${missingText}</td>
    `;
    bankInfoTableBody.appendChild(tr);
  });
}

async function loadBankInfo() {
  const year = parseInt(bankInfoYearInput.value, 10);
  if (!year || year < 2000) {
    setBankInfoStatus("Unesi ispravnu godinu.", "warning");
    return;
  }

  bankInfoTableBody.innerHTML =
    '<tr><td colspan="4" class="text-center">Ucitavam...</td></tr>';
  setBankInfoStatus("Ucitavam izvode...", "info");

  try {
    const response = await fetch(
      `/portal/banke-info?year=${encodeURIComponent(year)}`,
    );
    const result = await response.json();

    if (!result.success) {
      setBankInfoStatus(result.error || "Greska pri ucitavanju.", "danger");
      return;
    }

    renderBankInfo(result.data || []);
    if (latestInvoiceInfo) {
      latestInvoiceInfo.textContent = latestInvoiceText(result.zadnjiRacun);
    }
    clearBankInfoStatus();
  } catch (error) {
    setBankInfoStatus(error.message, "danger");
  }
}

function setSaldaStatus(tip, message, variant = "info") {
  const status = document.getElementById(saldaConfig[tip]?.statusId);
  if (!status) return;

  status.textContent = message;
  status.className = `alert alert-${variant}`;
  status.classList.remove("d-none");
}

function clearSaldaStatus(tip) {
  document.getElementById(saldaConfig[tip]?.statusId)?.classList.add("d-none");
}

function renderLatestInvoice(tip, invoice) {
  const latest = document.getElementById(saldaConfig[tip]?.latestId);
  if (!latest) return;

  if (!invoice) {
    latest.textContent = latestInvoiceText(null);
    return;
  }

  latest.textContent = latestInvoiceText(invoice);
}

function money(value) {
  return Number(value || 0).toLocaleString("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function decimal(value, digits = 4) {
  return Number(value || 0).toLocaleString("sr-RS", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function numberPlain(value, digits = 2) {
  return Number(value || 0).toLocaleString("sr-RS", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function setPlateStatus(message, variant = "info") {
  plateStatus.textContent = message;
  plateStatus.className = `alert alert-${variant}`;
  plateStatus.classList.remove("d-none");
}

function clearPlateStatus() {
  plateStatus.classList.add("d-none");
}

function setKalkulacijeStatus(message, variant = "info") {
  kalkulacijeStatus.textContent = message;
  kalkulacijeStatus.className = `alert alert-${variant}`;
  kalkulacijeStatus.classList.remove("d-none");
}

function clearKalkulacijeStatus() {
  kalkulacijeStatus.classList.add("d-none");
}

function renderKalkulacijeRadnje(radnje, selectedValue) {
  kalkulacijeObjekatSelect.innerHTML = '<option value="">Sve radnje</option>';

  radnje.forEach((radnja) => {
    const option = document.createElement("option");
    option.value = radnja.Id;
    option.textContent = `${radnja.Naziv || radnja.Oznaka || radnja.Id} (${
      radnja.BrojKalkulacija || 0
    })`;
    kalkulacijeObjekatSelect.appendChild(option);
  });

  if (selectedValue) {
    kalkulacijeObjekatSelect.value = selectedValue;
  }
}

function renderKalkulacije(rows) {
  kalkulacijeTableBody.innerHTML = "";

  if (!rows.length) {
    kalkulacijeTableBody.innerHTML =
      '<tr><td colspan="7" class="text-center">Nema kalkulacija.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.className = "clickable-row";
    tr.dataset.kalkulacijaId = row.Id;
    tr.innerHTML = `
      <td>${row.Rbr || "-"}</td>
      <td>${row.Oznaka || "-"}</td>
      <td>${formatDate(row.DatumKreiranja)}</td>
      <td>${row.Dobavljac || "-"}</td>
      <td>${row.BrojStavki || 0}</td>
      <td>${money(row.Ukupno)}</td>
      <td>${money(row.ProdajnaVrijednost)}</td>
    `;
    kalkulacijeTableBody.appendChild(tr);
  });
}

function nacinPlacanjaText(id) {
  const known = {
    3: "Virman",
  };
  return known[id] || "-";
}

function buildKalkulacijaHtml(data) {
  const dokument = data.dokument || {};
  const stavke = data.stavke || [];
  const rekapitulacija = data.rekapitulacija || [];
  const pdfUrl = `${window.location.origin}/portal/kalkulacije/${encodeURIComponent(
    dokument.Id,
  )}/pdf`;
  const ulazTotals = rekapitulacija.reduce(
    (sum, row) => ({
      bezPdv: sum.bezPdv + Number(row.UlazBezPdv || 0),
      pdv: sum.pdv + Number(row.UlazPdv || 0),
      iznos: sum.iznos + Number(row.UlazIznos || 0),
    }),
    { bezPdv: 0, pdv: 0, iznos: 0 },
  );
  const izlazTotals = rekapitulacija.reduce(
    (sum, row) => ({
      bezPdv: sum.bezPdv + Number(row.IzlazBezPdv || 0),
      pdv: sum.pdv + Number(row.IzlazPdv || 0),
      iznos: sum.iznos + Number(row.IzlazIznos || 0),
    }),
    { bezPdv: 0, pdv: 0, iznos: 0 },
  );
  const totals = stavke.reduce(
    (sum, row) => ({
      rabat: sum.rabat + Number(row.Rabat || 0),
      nabavna: sum.nabavna + Number(row.Ukupno || 0),
      bezPdv: sum.bezPdv + Number(row.NabavnaBezPdv || 0),
      ruc: sum.ruc + Number(row.Ruc || 0),
      prodajna: sum.prodajna + Number(row.ProdajnaVrijednost || 0),
    }),
    { rabat: 0, nabavna: 0, bezPdv: 0, ruc: 0, prodajna: 0 },
  );

  const rowsHtml = stavke
    .map(
      (row) => `
        <tr>
          <td class="num">${row.Rbr || ""}</td>
          <td>${escapeHtml([row.Sifra, row.Naziv].filter(Boolean).join(", "))}</td>
          <td>kom</td>
          <td class="num">${decimal(row.Kolicina, 3)}</td>
          <td class="num">${decimal(row.CijenaBezPDV, 4)}</td>
          <td class="num">${numberPlain(row.RabatProcenat, 2)}</td>
          <td class="num">${money(row.Rabat)}</td>
          <td class="num">${decimal(row.NetoCijena, 4)}</td>
          <td class="num">${numberPlain(row.Pdv, 0)}</td>
          <td class="num">${money(row.PdvIznos)}</td>
          <td class="num">${money(row.CijenaSaPdv)}</td>
          <td class="num">${money(row.Ukupno)}</td>
          <td class="num">${money(row.NabavnaBezPdv)}</td>
          <td class="num">${money(row.Ruc)}</td>
          <td>kom</td>
          <td class="num">${decimal(row.VPC, 4)}</td>
          <td class="num">${numberPlain(row.ProdajniPdv, 2)}</td>
          <td class="num">${decimal(row.PC, 4)}</td>
          <td class="num">${money(row.ProdajnaVrijednost)}</td>
          <td class="num">${numberPlain(row.Marza, 2)}</td>
        </tr>
      `,
    )
    .join("");

  const ulazRows = rekapitulacija
    .map(
      (row) => `
        <tr>
          <td>Stand. st. (${numberPlain(row.UlazStopa, 0)}%)</td>
          <td class="num">${money(row.UlazBezPdv)}</td>
          <td class="num">${money(row.UlazPdv)}</td>
          <td class="num">${money(row.UlazIznos)}</td>
        </tr>
      `,
    )
    .join("");

  const izlazRows = rekapitulacija
    .map(
      (row) => `
        <tr>
          <td>Stand. st. (${numberPlain(row.IzlazStopa, 0)}%)</td>
          <td class="num">${money(row.IzlazBezPdv)}</td>
          <td class="num">${money(row.IzlazPdv)}</td>
          <td class="num">${money(row.IzlazIznos)}</td>
        </tr>
      `,
    )
    .join("");

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Kalkulacija ${escapeHtml(dokument.Rbr || "")}</title>
    <style>
      @page { size: A4 landscape; margin: 9mm; }
      body { font-family: Arial, sans-serif; color: #111; font-size: 11px; margin: 0; }
      .sheet { max-width: 285mm; margin: 0 auto; padding: 10px 0 24px; }
      .print-bar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 12px; }
      .print-bar button, .print-bar a { padding: 7px 12px; cursor: pointer; font-size: 13px; border: 1px solid #999; background: #f5f5f5; color: #111; text-decoration: none; }
      .company { font-size: 14px; margin-bottom: 18px; }
      .rule { border-top: 2px solid #333; margin-bottom: 44px; }
      h1 { text-align: center; font-size: 28px; font-weight: 400; margin: 0 0 20px; }
      .top { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-bottom: 8px; }
      .label-row { display: grid; grid-template-columns: 150px 1fr; gap: 8px; line-height: 1.55; }
      .center-box { text-align: center; font-size: 16px; margin-bottom: 22px; }
      .supplier { width: 300px; margin: 0 auto; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #d9d9d9; border: 1px solid #333; padding: 4px 3px; font-weight: 600; }
      td { padding: 5px 3px; vertical-align: top; }
      .items td { border-bottom: 0; }
      .num { text-align: right; white-space: nowrap; }
      .strong-line td { border-top: 2px solid #333; font-weight: 700; }
      .section-title { font-size: 18px; margin: 16px 0 4px; border-bottom: 2px solid #333; }
      .recap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 70px; margin-top: 28px; }
      .recap-title { text-align: center; font-weight: 700; margin-bottom: 6px; }
      .recap th, .recap td { border: 1px solid #333; padding: 4px 6px; }
      .recap .total td { font-weight: 700; border-top: 2px solid #333; }
      @media print { .print-bar { display: none; } body { font-size: 10px; } }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="print-bar">
        <button onclick="window.print()">Stampa</button>
        <a href="${pdfUrl}">Download PDF</a>
        <button onclick="window.close()">Zatvori</button>
      </div>

      <div class="company">${escapeHtml(dokument.ApUser || "")}</div>
      <div class="rule"></div>

      <h1>Kalkulacija</h1>

      <div class="top">
        <div>
          <div class="label-row"><span>Broj dokumenta:</span><strong>${escapeHtml(`${dokument.Rbr || "-"}/${dokument.Godina || ""}`)}</strong></div>
          <div class="label-row"><span>Datum dokumenta:</span><strong>${formatDate(dokument.DatumKreiranja)}</strong></div>
          <div class="label-row"><span>Broj racuna dobavljaca:</span><strong>${escapeHtml(dokument.Oznaka || "-")}</strong></div>
          <div class="label-row"><span>Datum fakture dob.:</span><strong>${formatDate(dokument.DatumKreiranja)}</strong></div>
          <div class="label-row"><span>Datum valute:</span><strong>${formatDate(dokument.DatumValute)}</strong></div>
          <div class="label-row"><span>Nacin placanja:</span><strong>${escapeHtml(nacinPlacanjaText(dokument.IdNacinPlacanja))}</strong></div>
        </div>

        <div>
          <div class="center-box">Objekat: <strong>${escapeHtml(dokument.Objekat || "-")}</strong></div>
          <div class="supplier">
            <div class="label-row"><span>Dobavljac:</span><strong>${escapeHtml(dokument.Dobavljac || "-")}</strong></div>
            <div class="label-row"><span>PIB:</span><strong>${escapeHtml(dokument.Pib || "-")}</strong></div>
            <div class="label-row"><span>Reg.PDV:</span><strong>${escapeHtml(dokument.RegPdv || "-")}</strong></div>
            <div class="label-row"><span>Adresa:</span><strong>${escapeHtml(dokument.Adresa || "-")}</strong></div>
            <div class="label-row"><span>Tel/Fax</span><strong>${escapeHtml(dokument.TelFax || "-")}</strong></div>
          </div>
        </div>

        <div class="center-box">Otpremljeno u: <strong>${escapeHtml(dokument.OtpremljenoU || dokument.Objekat || "-")}</strong></div>
      </div>

      <table class="items">
        <thead>
          <tr>
            <th>R. br.</th>
            <th>Sifra i naziv artikla</th>
            <th>JM nabavke</th>
            <th>Fakt kol</th>
            <th>Cijena bez PDV</th>
            <th>Rabat %</th>
            <th>Iznos rabat</th>
            <th>Neto cijena</th>
            <th>PDV %</th>
            <th>PDV</th>
            <th>Cijena sa PDV</th>
            <th>Nab. vrijed.</th>
            <th>NV bez PDV sa zav. tr.</th>
            <th>RUC</th>
            <th>Jed. prodaje</th>
            <th>Pod. ci. bez PDV</th>
            <th>PDV</th>
            <th>Prod. ci sa PDV</th>
            <th>Prod. vrijed.</th>
            <th>Marza %</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
          <tr class="strong-line">
            <td colspan="6"></td>
            <td class="num">${money(totals.rabat)}</td>
            <td colspan="4"></td>
            <td class="num">${money(totals.nabavna)}</td>
            <td class="num">${money(totals.bezPdv)}</td>
            <td class="num">${money(totals.ruc)}</td>
            <td colspan="4"></td>
            <td class="num">${money(totals.prodajna)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">Rekapitulacija kalkulacije</div>
      <div class="recap-grid">
        <div>
          <div class="recap-title">ULAZ</div>
          <table class="recap">
            <thead><tr><th>Naziv stope</th><th>Iznos bez PDV</th><th>Iznos PDV</th><th>Iznos</th></tr></thead>
            <tbody>
              ${ulazRows}
              <tr class="total"><td>Ukupno</td><td class="num">${money(ulazTotals.bezPdv)}</td><td class="num">${money(ulazTotals.pdv)}</td><td class="num">${money(ulazTotals.iznos)}</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div class="recap-title">IZLAZ</div>
          <table class="recap">
            <thead><tr><th>Naziv stope</th><th>Iznos bez PDV</th><th>Iznos PDV</th><th>Iznos</th></tr></thead>
            <tbody>
              ${izlazRows}
              <tr class="total"><td>Ukupno</td><td class="num">${money(izlazTotals.bezPdv)}</td><td class="num">${money(izlazTotals.pdv)}</td><td class="num">${money(izlazTotals.iznos)}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

async function openKalkulacija(kalkulacijaId) {
  if (!kalkulacijaId) return;

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    setKalkulacijeStatus("Browser je blokirao novi prozor.", "warning");
    return;
  }

  printWindow.document.write("<p>Ucitavam kalkulaciju...</p>");

  try {
    const response = await fetch(
      `/portal/kalkulacije/${encodeURIComponent(kalkulacijaId)}`,
    );
    const result = await response.json();

    if (!result.success) {
      printWindow.document.body.innerHTML = `<p>${escapeHtml(
        result.error || "Greska pri ucitavanju kalkulacije.",
      )}</p>`;
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildKalkulacijaHtml(result));
    printWindow.document.close();
  } catch (error) {
    printWindow.document.body.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

async function loadKalkulacije(force = false) {
  if (kalkulacijeLoaded && !force) return;

  const year = parseInt(kalkulacijeYearInput.value, 10);
  if (!year || year < 2000) {
    setKalkulacijeStatus("Unesi ispravnu godinu.", "warning");
    return;
  }

  const selectedObjekat = kalkulacijeObjekatSelect.value;
  kalkulacijeTableBody.innerHTML =
    '<tr><td colspan="7" class="text-center">Ucitavam...</td></tr>';
  kalkulacijeSummary.textContent = "";
  setKalkulacijeStatus("Ucitavam kalkulacije...", "info");

  try {
    const params = new URLSearchParams({ year: String(year) });
    if (selectedObjekat) params.set("idObjekat", selectedObjekat);

    const response = await fetch(`/portal/kalkulacije?${params.toString()}`);
    const result = await response.json();

    if (!result.success) {
      setKalkulacijeStatus(
        result.error || "Greska pri ucitavanju kalkulacija.",
        "danger",
      );
      return;
    }

    renderKalkulacijeRadnje(result.radnje || [], selectedObjekat);
    renderKalkulacije(result.data || []);
    kalkulacijeSummary.textContent = `Kalkulacija: ${
      result.summary?.brojKalkulacija || 0
    } | Iznos racuna: ${money(
      result.summary?.ukupno,
    )} | Prodajna vrijednost: ${money(result.summary?.prodajnaVrijednost)}`;
    clearKalkulacijeStatus();
    kalkulacijeLoaded = true;
  } catch (error) {
    setKalkulacijeStatus(error.message, "danger");
  }
}

function renderPlateFirma(data) {
  plateFirmaNaziv.textContent = data.firma?.Naziv || "-";
  plateFirmaPib.textContent = data.firma?.PIB || "-";
  plateFirmaRadnici.textContent = data.counts?.Radnici || 0;
  plateFirmaAktivni.textContent = data.counts?.Aktivni || 0;
  plateFirmaObracuni.textContent = data.counts?.Obracuni || 0;
  plateFirmaCard.classList.remove("d-none");
}

function renderPlateMonths(rows) {
  plateMonthsTableBody.innerHTML = "";

  if (!rows.length) {
    plateMonthsTableBody.innerHTML =
      '<tr><td colspan="11" class="text-center">Nema obracuna.</td></tr>';
    plateMonthsCard.classList.remove("d-none");
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.GodObr}</td>
      <td>${row.MjesObr}</td>
      <td>${row.BrojObracuna}</td>
      <td>${row.BrojRadnika}</td>
      <td>${money(row.Neto)}</td>
      <td>${money(row.Bruto)}</td>
      <td>${money(row.Porez)}</td>
      <td>${money(row.Prirez)}</td>
      <td>${money(row.DoprinosiZaposleni)}</td>
      <td>${money(row.DoprinosiPoslodavac)}</td>
      <td>
        <button
          class="btn btn-sm btn-outline-primary"
          data-plate-godina="${row.GodObr}"
          data-plate-mjesec="${row.MjesObr}"
        >
          Detalji
        </button>
      </td>
    `;
    plateMonthsTableBody.appendChild(tr);
  });

  plateMonthsCard.classList.remove("d-none");
}

function renderPlateDetails(rows) {
  plateDetailsTableBody.innerHTML = "";

  if (!rows.length) {
    plateDetailsTableBody.innerHTML =
      '<tr><td colspan="10" class="text-center">Nema detalja.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.Prezime || ""} ${row.Ime || ""}</td>
      <td>${row.MaticniBroj || "-"}</td>
      <td>${row.OznakaObr || "-"}</td>
      <td>${money(row.Neto)}</td>
      <td>${money(row.Bruto)}</td>
      <td>${money(row.Porez)}</td>
      <td>${money(row.Prirez)}</td>
      <td>${money(row.DoprinosiZaposleni)}</td>
      <td>${money(row.DoprinosiPoslodavac)}</td>
      <td>
        <button
          class="btn btn-sm btn-outline-primary"
          data-payroll-slip="1"
          data-id-radnik="${row.IdRadnik}"
          data-id-obracun="${row.IdObracun}"
        >
          Platna lista
        </button>
      </td>
    `;
    plateDetailsTableBody.appendChild(tr);
  });
}

function sumRows(rows, field) {
  return rows.reduce((sum, row) => sum + Number(row[field] || 0), 0);
}

function firstNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (!Number.isNaN(number) && value !== null && value !== undefined) return number;
  }
  return 0;
}

function dateDayMonth(value) {
  if (!value) return "-";
  const date = new Date(value);
  return `${String(date.getDate()).padStart(2, "0")}.${String(
    date.getMonth() + 1,
  ).padStart(2, "0")}`;
}

function buildPayrollSlipHtml(data) {
  const firma = data.firma || {};
  const obracun = data.obracun || {};
  const radnik = data.radnik || {};
  const stavke = data.stavke || [];
  const fullName = `${radnik.Prezime || ""} ${radnik.Ime || ""}`.trim();
  const ukupnoNeto = sumRows(stavke, "Neto");
  const ukupnoBruto = sumRows(stavke, "Bruto");
  const ukupnoObracunatiBruto = sumRows(stavke, "ObracunatiBruto");
  const porez = sumRows(stavke, "Porez");
  const prirez = sumRows(stavke, "Prirez");
  const dzPio = sumRows(stavke, "DZPio");
  const dzZdravstvo = sumRows(stavke, "DZZdravstvo");
  const dzNezaposleni = sumRows(stavke, "DZNezaposleni");
  const dpPio = sumRows(stavke, "DPPio");
  const dpZdravstvo = sumRows(stavke, "DPZdravstvo");
  const dpNezaposleni = sumRows(stavke, "DPNezaposleni");
  const dpFondRada = sumRows(stavke, "DPFondRada");
  const dpSindikat = sumRows(stavke, "DPSindikat");
  const dpPrivKomora = sumRows(stavke, "DPPrivKomora");
  const doprinosiZaposleni = dzPio + dzZdravstvo + dzNezaposleni;
  const doprinosiINaknadePoslodavac =
    dpPio + dpZdravstvo + dpNezaposleni + dpFondRada + dpSindikat + dpPrivKomora;
  const bruto2 = ukupnoBruto + doprinosiINaknadePoslodavac + prirez;
  const osnovicaZaObracun = ukupnoBruto;
  const posebniDioZarade = firstNumber(stavke[0]?.StartniDioZarade);
  const obracunskaVrijednost = firstNumber(
    stavke[0]?.ObrVrKoeficijenta,
    obracun.ObrVrKoef,
    radnik.ObrVrKoeficijenta,
  );
  const koeficijentSlozenosti = firstNumber(
    radnik.KoeficijentSlozenosti,
    stavke[0]?.KoefSlozenosti,
  );
  const osnovnaZarada = obracunskaVrijednost * koeficijentSlozenosti;
  const minuliRadFaktor = firstNumber(
    stavke[0]?.KoefMinuliRad,
    radnik.KoeficijentMinuliRad,
  );
  const minuliRadKoef =
    minuliRadFaktor > 1 ? (minuliRadFaktor - 1) * 100 : minuliRadFaktor;
  const zaradaNaOsnovuMinulog = osnovnaZarada * (minuliRadKoef / 100);
  const prijavljenoRadnoVrijeme =
    radnik.FondSatiDan || radnik.BrojRadnihSatiVrste || "";
  const puniMjesecniFond = Number(obracun.FondSati || stavke[0]?.FondSati || 0);
  const brojSatiMjesec = prijavljenoRadnoVrijeme
    ? (puniMjesecniFond * Number(prijavljenoRadnoVrijeme)) / 8
    : puniMjesecniFond;

  const stavkeRows = stavke
    .map(
      (row) => `
        <tr>
          <td>${escapeHtml(row.SifraPrimanja || row.Sifra || "-")}</td>
          <td>${escapeHtml(row.Naziv || "Zarada")}</td>
          <td>${dateDayMonth(row.DatumOd)}</td>
          <td>${dateDayMonth(row.DatumDo)}</td>
          <td class="num">${money(row.IznosZaObracun || row.ObracunatiBruto || row.Bruto)}</td>
          <td class="num">${money(row.ProcenatOsnoviceSaUmanjenjem || 100)}</td>
          <td class="num">${row.UkupnoSati || row.FondSati || "-"}</td>
          <td class="num">${money(row.Bruto)}</td>
          <td class="num">${money(row.Neto)}</td>
        </tr>
      `,
    )
    .join("");

  const line = (label, value, bold = false) => `
    <div class="${bold ? "spec-row bold" : "spec-row"}">
      <span>${escapeHtml(label)}</span>
      <strong>${money(value)}</strong>
    </div>
  `;

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Platna lista - ${escapeHtml(fullName)}</title>
    <style>
      @page { size: A4 portrait; margin: 13mm; }
      body { font-family: "Times New Roman", serif; color: #111; font-size: 14px; }
      .sheet { max-width: 190mm; margin: 0 auto; border-left: 1px dashed #bbb; border-right: 1px dashed #bbb; padding: 0 12px 22px; min-height: 270mm; }
      .print-bar { display: flex; justify-content: flex-end; gap: 8px; margin: 0 0 12px; font-family: Arial, sans-serif; }
      .print-bar button { padding: 8px 14px; cursor: pointer; }
      .company { line-height: 1.35; font-weight: 700; }
      .title { text-align: center; margin: 52px 0 28px; }
      .title h1 { margin: 0 0 6px; font-size: 21px; }
      .title h2 { margin: 0; font-size: 18px; }
      .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; margin-bottom: 28px; }
      .info-row, .spec-row { display: grid; grid-template-columns: 150px 1fr; gap: 8px; line-height: 1.35; }
      .spec-row { grid-template-columns: 1fr 110px; }
      .spec-row strong { text-align: right; }
      .bold { font-weight: 700; border-bottom: 1px solid #555; padding-bottom: 2px; }
      table { width: 100%; border-collapse: collapse; margin: 12px 0 36px; }
      th { background: #e6e6e6; border: 1px solid #555; padding: 4px 5px; text-align: left; }
      td { border: 1px solid #555; padding: 4px 5px; }
      .num { text-align: right; white-space: nowrap; }
      .spec { width: 58%; margin-left: auto; }
      .section-gap { height: 22px; }
      .final { margin-top: 34px; }
      .signature { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 40px; margin-top: 96px; align-items: end; text-align: center; }
      .signature .line { border-bottom: 2px solid #777; height: 28px; margin-top: 36px; }
      @media print {
        .print-bar { display: none; }
        body { font-size: 13px; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="print-bar">
        <button onclick="window.print()">Stampa</button>
        <button onclick="window.close()">Zatvori</button>
      </div>
      <div class="company">
        <div>${escapeHtml(firma.Naziv || firma.PuniNaziv || "-")}</div>
        <div>${escapeHtml([firma.Grad, firma.Adresa].filter(Boolean).join(" ") || "-")}</div>
        <div>PIB: ${escapeHtml(firma.PIB || "-")}</div>
      </div>

      <div class="title">
        <h1>OBRACUN LICNIH PRIMANJA</h1>
        <h2>za mjesec ${obracun.MjesObr}/${obracun.GodObr}</h2>
      </div>

      <div class="top-grid">
        <div>
          <div class="info-row"><span>Prezime i ime:</span><strong>${escapeHtml(fullName)}</strong></div>
          <div class="info-row"><span>Maticni broj:</span><strong>${escapeHtml(radnik.MaticniBroj || "-")}</strong></div>
          <div class="info-row"><span>Radno mjesto:</span><span>${escapeHtml(radnik.RadnoMjestoOpis || "")}</span></div>
          <div class="info-row"><span>Tekuci racun:</span><span>${escapeHtml(radnik.BrojTekucegRacuna || "")}</span></div>
          <div class="info-row"><span>Telefon:</span><span>${escapeHtml(radnik.Telefon || "")}</span></div>
          <div class="info-row"><span>Email:</span><span>${escapeHtml(radnik.Email || "")}</span></div>
          <div class="info-row"><span>Br. sati mjesec:</span><strong>${brojSatiMjesec || "-"}</strong></div>
          <div class="info-row"><span>Prijav. rad. vr.:</span><strong>${prijavljenoRadnoVrijeme}</strong></div>
        </div>
        <div>
          <div class="spec-row"><span>Osnovica za obracun:</span><strong>${money(osnovicaZaObracun)}</strong></div>
          <div class="spec-row"><span>Posebni dio zarade:</span><strong>${money(posebniDioZarade)}</strong></div>
          <div class="spec-row"><span>Obracunska vrijednost:</span><strong>${money(obracunskaVrijednost)}</strong></div>
          <div class="spec-row"><span>Koeficijent slozenosti:</span><strong>${money(koeficijentSlozenosti)}</strong></div>
          <div class="spec-row"><span>Osnovna zarada:</span><strong>${money(osnovnaZarada)}</strong></div>
          <div class="spec-row"><span>Minuli rad (koef.):</span><strong>${money(minuliRadKoef)}%</strong></div>
          <div class="spec-row"><span>Zarada na osn. min.r.:</span><strong>${money(zaradaNaOsnovuMinulog)}</strong></div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Sifra</th>
            <th>Naziv</th>
            <th>Od</th>
            <th>Do</th>
            <th class="num">Bruto osn.</th>
            <th class="num">Procenat</th>
            <th class="num">Br. sati</th>
            <th class="num">Bruto</th>
            <th class="num">Neto</th>
          </tr>
        </thead>
        <tbody>${stavkeRows}</tbody>
      </table>

      <div class="spec">
        <h3>Specifikacija obracuna</h3>
        ${line("Ukupno zarada", bruto2, true)}
        ${line("Neto", ukupnoNeto)}
        ${line("Porez", porez)}
        ${line("Doprinosi na teret zaposlenog", doprinosiZaposleni)}
        ${line("Bruto I", ukupnoBruto)}
        ${line("Doprinosi i naknade na teret posl.", doprinosiINaknadePoslodavac + prirez)}
        ${line("Bruto II", bruto2)}

        <div class="section-gap"></div>
        ${line("Doprinosi na teret zaposlenog", doprinosiZaposleni, true)}
        ${line("PIO", dzPio)}
        ${line("Zdravstveno osiguranje", dzZdravstvo)}
        ${line("Osiguranje od nezaposlenosti", dzNezaposleni)}

        <div class="section-gap"></div>
        ${line("Doprinosi na teret poslodavca", dpPio + dpZdravstvo + dpNezaposleni, true)}
        ${line("PIO", dpPio)}
        ${line("Zdravstveno osiguranje", dpZdravstvo)}
        ${line("Osiguranje od nezaposlenosti", dpNezaposleni)}

        <div class="section-gap"></div>
        ${line("Ostale naknade na teret poslodavca", dpFondRada + dpSindikat + dpPrivKomora + prirez, true)}
        ${line("Za fond rada", dpFondRada)}
        ${line("Za sindikat", dpSindikat)}
        ${line("Za privrednu komoru", dpPrivKomora)}
        ${line("Prirez", prirez)}

        <div class="final">${line("Za isplatu NETO:", ukupnoNeto, true)}</div>
      </div>

      <div class="signature">
        <div>
          <div>${escapeHtml(fullName)}</div>
          <div class="line"></div>
        </div>
        <div>M.P.</div>
        <div>
          <div>Ovlašćeno lice</div>
          <div class="line"></div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

async function openPayrollSlip(idRadnik, idObracun, godina, mjesec) {
  setPlateStatus("Ucitavam platnu listu...", "info");

  try {
    const response = await fetch(
      `/portal/plate/platna-lista?godina=${encodeURIComponent(
        godina,
      )}&mjesec=${encodeURIComponent(mjesec)}&idRadnik=${encodeURIComponent(
        idRadnik,
      )}&idObracun=${encodeURIComponent(idObracun)}`,
    );
    const result = await response.json();

    if (!result.success) {
      setPlateStatus(result.error || "Greska pri ucitavanju platne liste.", "danger");
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setPlateStatus("Browser je blokirao otvaranje platne liste.", "warning");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(buildPayrollSlipHtml(result));
    printWindow.document.close();
    printWindow.focus();
    clearPlateStatus();
  } catch (error) {
    setPlateStatus(error.message, "danger");
  }
}

async function loadPlatePregled(force = false) {
  if (plateLoaded && !force) return;

  setPlateStatus("Ucitavam obracune zarada...", "info");
  plateFirmaCard.classList.add("d-none");
  plateMonthsCard.classList.add("d-none");
  plateDetailsCard.classList.add("d-none");
  plateMonthsTableBody.innerHTML = "";
  plateDetailsTableBody.innerHTML = "";

  try {
    const response = await fetch("/portal/plate/pregled");
    const result = await response.json();

    if (!result.success) {
      setPlateStatus(result.error || "Greska pri ucitavanju obracuna.", "danger");
      return;
    }

    renderPlateFirma(result);
    renderPlateMonths(result.months || []);
    clearPlateStatus();
    plateLoaded = true;
  } catch (error) {
    setPlateStatus(error.message, "danger");
  }
}

async function loadPlateDetalji(godina, mjesec) {
  plateDetailsCard.classList.remove("d-none");
  plateDetailsTitle.textContent = `Detalji za ${mjesec}/${godina}`;
  plateDetailsTableBody.dataset.godina = godina;
  plateDetailsTableBody.dataset.mjesec = mjesec;
  plateDetailsTableBody.innerHTML =
    '<tr><td colspan="10" class="text-center">Ucitavam...</td></tr>';
  setPlateStatus("Ucitavam detalje obracuna...", "info");

  try {
    const response = await fetch(
      `/portal/plate/detalji?godina=${encodeURIComponent(
        godina,
      )}&mjesec=${encodeURIComponent(mjesec)}`,
    );
    const result = await response.json();

    if (!result.success) {
      setPlateStatus(result.error || "Greska pri ucitavanju detalja.", "danger");
      return;
    }

    renderPlateDetails(result.data || []);
    clearPlateStatus();
    plateDetailsCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setPlateStatus(error.message, "danger");
  }
}

function renderSaldaTable(tip, rows) {
  const tbody = document.querySelector(`#${saldaConfig[tip].tableId} tbody`);
  if (!tbody) return;

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center">Nema podataka</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  rows.forEach((row) => {
    const saldo = Number(row.Saldo || 0);
    const saldoClass =
      saldo > 0 ? "text-danger" : saldo < 0 ? "text-success" : "";
    const tr = document.createElement("tr");
    tr.className = "clickable-row";
    tr.title = "Otvori analiticku karticu";
    tr.dataset.komitentId = row.IdKomitent;
    tr.dataset.komitentNaziv = row.Komitent || "-";
    tr.innerHTML = `
      <td><button class="btn btn-link p-0 text-start">${row.Komitent || "-"}</button></td>
      <td>${row.Grad || "-"}</td>
      <td>${money(row.SumaDuguje)}</td>
      <td>${money(row.SumaPotrazuje)}</td>
      <td class="${saldoClass}"><strong>${money(row.Saldo)}</strong></td>
    `;
    tr.addEventListener("click", () => {
      loadKartica(tip, row.IdKomitent, row.Komitent || "-");
    });
    tbody.appendChild(tr);
  });
}

function setKarticaStatus(message, variant = "info") {
  karticaStatus.textContent = message;
  karticaStatus.className = `alert alert-${variant}`;
  karticaStatus.classList.remove("d-none");
}

function clearKarticaStatus() {
  karticaStatus.classList.add("d-none");
}

function renderKarticaRows(rows) {
  if (!rows.length) {
    karticaTableBody.innerHTML =
      '<tr><td colspan="10" class="text-center">Nema prometa za izabranu karticu</td></tr>';
    return;
  }

  karticaTableBody.innerHTML = "";
  rows.forEach((row) => {
    const saldo = Number(row.Saldo || 0);
    const saldoClass =
      saldo > 0 ? "text-danger" : saldo < 0 ? "text-success" : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.VrstaNaloga || "-"}</td>
      <td>${row.Oznaka || "-"}</td>
      <td>${row.Rbr || "-"}</td>
      <td>${row.OznakaNaloga || row.BrojDok || "-"}</td>
      <td>${row.DodatniOpis || "-"}</td>
      <td>${formatDate(row.Datum)}</td>
      <td>${row.Opis || "-"}</td>
      <td>${money(row.Duguje)}</td>
      <td>${money(row.Potrazuje)}</td>
      <td class="${saldoClass}"><strong>${money(row.Saldo)}</strong></td>
    `;
    karticaTableBody.appendChild(tr);
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadKartica(tip, komitentId, komitentNaziv) {
  if (!komitentId) return;

  karticaPanel.classList.remove("d-none");
  karticaTitle.textContent = `Analiticka kartica - ${komitentNaziv}`;
  karticaSubtitle.textContent = "Ucitavam...";
  karticaTableBody.innerHTML =
    '<tr><td colspan="10" class="text-center">Ucitavam...</td></tr>';
  setKarticaStatus("Ucitavam analiticku karticu...", "info");

  try {
    const response = await fetch(
      `/portal/kartica?tip=${encodeURIComponent(tip)}&komitentId=${encodeURIComponent(
        komitentId,
      )}`,
    );
    const result = await response.json();

    if (!result.success) {
      setKarticaStatus(result.error || "Greska pri ucitavanju kartice.", "danger");
      return;
    }

    currentKartica = {
      tip,
      komitentId,
      konto: result.konto,
      firma: result.firma,
      komitent: result.komitent,
      rows: result.data || [],
    };
    karticaTitle.textContent = `Analiticka kartica - ${
      result.komitent?.Naziv || komitentNaziv
    }`;
    karticaSubtitle.textContent = `Konto ${result.konto} | Saldo: ${money(
      result.data.at(-1)?.Saldo || 0,
    )}`;
    renderKarticaRows(result.data || []);
    clearKarticaStatus();
    karticaPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    setKarticaStatus(error.message, "danger");
  }
}

function buildPrintKarticaHtml() {
  if (!currentKartica) return "";

  const rows = currentKartica.rows || [];
  const finalSaldo = Number(rows.at(-1)?.Saldo || 0);
  const ukupnoDuguje = rows.reduce((sum, row) => sum + Number(row.Duguje || 0), 0);
  const ukupnoPotrazuje = rows.reduce(
    (sum, row) => sum + Number(row.Potrazuje || 0),
    0,
  );
  const firmaNaziv =
    currentKartica.firma?.NazivFirme || currentKartica.firma?.ApUser || "-";
  const komitentNaziv = currentKartica.komitent?.Naziv || "-";
  const komitentPib = currentKartica.komitent?.Pib || "-";
  const komitentGrad = currentKartica.komitent?.Grad || "-";
  const today = new Date().toLocaleDateString("sr-RS");
  const pdfUrl = `${window.location.origin}/portal/kartica/pdf?tip=${encodeURIComponent(
    currentKartica.tip,
  )}&komitentId=${encodeURIComponent(currentKartica.komitentId)}`;

  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${formatDate(row.Datum)}</td>
          <td>${escapeHtml(row.VrstaNaloga || "-")}</td>
          <td class="num">${escapeHtml(row.Rbr || "-")}</td>
          <td>${escapeHtml(row.DodatniOpis || row.OznakaNaloga || row.BrojDok || "-")}</td>
          <td>${formatDate(row.DatumValute || row.Datum)}</td>
          <td class="num">${Number(row.Duguje || 0) ? money(row.Duguje) : "-"}</td>
          <td class="num">${Number(row.Potrazuje || 0) ? money(row.Potrazuje) : "-"}</td>
          <td class="num">${money(row.Saldo)}</td>
        </tr>
      `,
    )
    .join("");

  const totalRows = `
    <tr class="final-total">
      <td colspan="5">Grupa: ${rows.length}</td>
      <td class="num">${money(ukupnoDuguje)}</td>
      <td class="num">${money(ukupnoPotrazuje)}</td>
      <td class="num">${money(finalSaldo)}</td>
    </tr>
    <tr class="final-total">
      <td colspan="5">Ukupno: ${rows.length}</td>
      <td class="num">${money(ukupnoDuguje)}</td>
      <td class="num">${money(ukupnoPotrazuje)}</td>
      <td class="num">${money(finalSaldo)}</td>
    </tr>
  `;

  return `<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Analiticka kartica - ${escapeHtml(komitentNaziv)}</title>
    <style>
      @page { size: A4 portrait; margin: 14mm; }
      body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
      .sheet { max-width: 190mm; margin: 0 auto; }
      .company { margin-bottom: 28px; padding-bottom: 8px; border-bottom: 2px solid #222; }
      .title { text-align: center; margin: 24px 0 28px; }
      .title h1 { margin: 0 0 8px; font-size: 26px; font-weight: 500; }
      .meta { display: grid; grid-template-columns: 150px 1fr 90px 1fr; gap: 6px 10px; margin-bottom: 12px; }
      .konto { display: grid; grid-template-columns: 150px 1fr; gap: 10px; border-top: 2px solid #222; padding-top: 10px; margin-top: 8px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; }
      th { background: #e9e9e9; border: 1px solid #444; padding: 3px 4px; text-align: left; }
      td { padding: 3px 4px; vertical-align: top; }
      .num { text-align: right; white-space: nowrap; }
      .final-total td { border-top: 2px solid #222; font-weight: 700; }
      .final-total + .final-total td { border-top: 1px solid #222; }
      .footer-total { margin-top: 28px; font-size: 20px; }
      .print-bar { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 16px; }
      .print-bar button { padding: 8px 14px; cursor: pointer; }
      @media print {
        .print-bar { display: none; }
        body { font-size: 11px; }
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="print-bar">
        <button onclick="window.print()">Stampa</button>
        <button onclick="downloadPdf()">Download PDF</button>
        <button onclick="window.close()">Zatvori</button>
      </div>
      <div class="company">
        <div>${escapeHtml(firmaNaziv)}</div>
        <div>${escapeHtml(firmaNaziv)}</div>
      </div>
      <div class="title">
        <h1>Analiticka kartica partnera</h1>
        <div>Stanje na dan: <strong>${today}</strong></div>
      </div>
      <div class="meta">
        <div>Poslovni partner:</div>
        <strong>${escapeHtml(komitentNaziv)}</strong>
        <div>PIB:</div>
        <strong>${escapeHtml(komitentPib)}</strong>
        <div>Adresa:</div>
        <strong>${escapeHtml(komitentGrad)}</strong>
      </div>
      <div class="konto">
        <div>Konto: <strong>${escapeHtml(currentKartica.konto)}</strong></div>
        <strong>${escapeHtml(rows[0]?.NazivKonta || "")}</strong>
      </div>
      <table>
        <thead>
          <tr>
            <th>Dat. knj.</th>
            <th>Dokument</th>
            <th>Br. nal.</th>
            <th>Br. dokum. / Opis knjizenja</th>
            <th>Datum r.n.</th>
            <th class="num">Duguje</th>
            <th class="num">Potrazuje</th>
            <th class="num">Saldo</th>
          </tr>
        </thead>
        <tbody>${tableRows}${totalRows}</tbody>
      </table>
      <div class="footer-total">Vasa ukupna obaveza: <strong>${money(finalSaldo)}</strong></div>
    </div>
    <script>
      function downloadPdf() {
        window.location.href = ${JSON.stringify(pdfUrl)};
      }
    </script>
  </body>
</html>`;
}

function printKartica() {
  if (!currentKartica) {
    setKarticaStatus("Prvo otvorite analiticku karticu.", "warning");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    setKarticaStatus("Browser je blokirao otvaranje prozora za stampu.", "warning");
    return;
  }

  printWindow.document.open();
  printWindow.document.write(buildPrintKarticaHtml());
  printWindow.document.close();
  printWindow.focus();
}

async function loadSalda(tip, force = false) {
  const config = saldaConfig[tip];
  if (!config) return;

  if (loadedSalda.has(tip) && !force) return;

  const tbody = document.querySelector(`#${config.tableId} tbody`);
  if (tbody) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="text-center">Ucitavam...</td></tr>';
  }
  setSaldaStatus(tip, "Ucitavam salda...", "info");

  try {
    const response = await fetch(`/portal/salda?tip=${encodeURIComponent(tip)}`);
    const result = await response.json();

    if (!result.success) {
      setSaldaStatus(tip, result.error || "Greska pri ucitavanju.", "danger");
      return;
    }

    renderSaldaTable(tip, result.data || []);
    renderLatestInvoice(tip, result.zadnjiRacun);
    clearSaldaStatus(tip);
    loadedSalda.add(tip);
  } catch (error) {
    setSaldaStatus(tip, error.message, "danger");
  }
}

function initSaldaButtons() {
  document.querySelectorAll("[data-load-salda]").forEach((button) => {
    button.addEventListener("click", () => {
      loadSalda(button.dataset.loadSalda, true);
    });
  });

  loadPlateBtn?.addEventListener("click", () => {
    plateLoaded = false;
    loadPlatePregled(true);
  });

  loadKalkulacijeBtn?.addEventListener("click", () => {
    kalkulacijeLoaded = false;
    loadKalkulacije(true);
  });

  kalkulacijeObjekatSelect?.addEventListener("change", () => {
    kalkulacijeLoaded = false;
    loadKalkulacije(true);
  });

  kalkulacijeTableBody?.addEventListener("click", (event) => {
    const row = event.target.closest("[data-kalkulacija-id]");
    if (!row) return;
    openKalkulacija(row.dataset.kalkulacijaId);
  });

  plateMonthsTableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-plate-godina][data-plate-mjesec]");
    if (!button) return;
    loadPlateDetalji(button.dataset.plateGodina, button.dataset.plateMjesec);
  });

  plateDetailsTableBody?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-payroll-slip]");
    if (!button) return;
    openPayrollSlip(
      button.dataset.idRadnik,
      button.dataset.idObracun,
      plateDetailsTableBody.dataset.godina,
      plateDetailsTableBody.dataset.mjesec,
    );
  });

  closeKarticaBtn.addEventListener("click", () => {
    karticaPanel.classList.add("d-none");
  });
  printKarticaBtn.addEventListener("click", printKartica);
}

function initBankInfo() {
  bankInfoYearInput.value = new Date().getFullYear();
  kalkulacijeYearInput.value = new Date().getFullYear();
  loadBankInfoBtn.addEventListener("click", loadBankInfo);
}

initBankInfo();
initSaldaButtons();
initUserMenu();
loadUserHome();
