const firmaSelect = document.getElementById("firmaSelect");
const loadBtn = document.getElementById("loadBtn");
const statusBox = document.getElementById("statusBox");
const firmaCard = document.getElementById("firmaCard");
const monthsCard = document.getElementById("monthsCard");
const detailsCard = document.getElementById("detailsCard");
const monthsTableBody = document.querySelector("#monthsTable tbody");
const detailsTableBody = document.querySelector("#detailsTable tbody");
const detailsTitle = document.getElementById("detailsTitle");

const firmaNaziv = document.getElementById("firmaNaziv");
const firmaPib = document.getElementById("firmaPib");
const firmaRadnici = document.getElementById("firmaRadnici");
const firmaAktivni = document.getElementById("firmaAktivni");
const firmaObracuni = document.getElementById("firmaObracuni");
const missingYearInput = document.getElementById("missingYearInput");
const missingMonthInput = document.getElementById("missingMonthInput");
const checkMissingBtn = document.getElementById("checkMissingBtn");
const missingCard = document.getElementById("missingCard");
const missingTitle = document.getElementById("missingTitle");
const missingSummary = document.getElementById("missingSummary");
const missingTableBody = document.querySelector("#missingTable tbody");
const ioppdYearInput = document.getElementById("ioppdYearInput");
const ioppdMonthInput = document.getElementById("ioppdMonthInput");
const loadIoppdBtn = document.getElementById("loadIoppdBtn");
const downloadAllIoppdBtn = document.getElementById("downloadAllIoppdBtn");
const ioppdCard = document.getElementById("ioppdCard");
const ioppdTitle = document.getElementById("ioppdTitle");
const ioppdSummary = document.getElementById("ioppdSummary");
const ioppdTableBody = document.querySelector("#ioppdTable tbody");
const toggleCopySectionBtn = document.getElementById("toggleCopySectionBtn");
const copySection = document.getElementById("copySection");
const copyFirmList = document.getElementById("copyFirmList");
const selectAllCopyBtn = document.getElementById("selectAllCopyBtn");
const clearCopyBtn = document.getElementById("clearCopyBtn");
const sourceYearInput = document.getElementById("sourceYearInput");
const sourceMonthInput = document.getElementById("sourceMonthInput");
const targetYearInput = document.getElementById("targetYearInput");
const targetMonthInput = document.getElementById("targetMonthInput");
const checkCopyBtn = document.getElementById("checkCopyBtn");
const runCopyBtn = document.getElementById("runCopyBtn");
const copyResultCard = document.getElementById("copyResultCard");
const copyResultTableBody = document.querySelector("#copyResultTable tbody");

let plateFirme = [];
let lastCopyCheck = [];
let currentIoppdFirme = [];

function setStatus(message, variant = "info") {
  statusBox.textContent = message;
  statusBox.className = `alert alert-${variant}`;
  statusBox.classList.remove("d-none");
}

function clearStatus() {
  statusBox.classList.add("d-none");
}

function money(value) {
  const number = Number(value || 0);
  return number.toLocaleString("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function setLoading(isLoading) {
  loadBtn.disabled = isLoading;
  firmaSelect.disabled = isLoading;
}

async function loadFirme() {
  setStatus("Ucitavam firme...", "info");

  try {
    const response = await fetch("/plate/firme");
    const result = await response.json();

    if (!result.success) {
      setStatus(result.error || "Greska pri ucitavanju firmi.", "danger");
      return;
    }

    firmaSelect.innerHTML = '<option value="">Izaberi firmu</option>';
    plateFirme = result.data || [];

    plateFirme.forEach((firma) => {
      const option = document.createElement("option");
      option.value = firma.Id;
      option.textContent = `${firma.Naziv} (${firma.PIB || "bez PIB"})`;
      firmaSelect.appendChild(option);
    });

    renderCopyFirmList(plateFirme);

    const inovator = plateFirme.find((firma) => firma.Id === 427);
    if (inovator) {
      firmaSelect.value = inovator.Id;
    }

    clearStatus();
  } catch (error) {
    setStatus(error.message, "danger");
  }
}

function renderCopyFirmList(firme) {
  copyFirmList.innerHTML = "";

  firme.forEach((firma) => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-check";
    wrapper.innerHTML = `
      <input
        class="form-check-input copy-firma-check"
        type="checkbox"
        value="${firma.Id}"
        id="copyFirma${firma.Id}"
      />
      <label class="form-check-label" for="copyFirma${firma.Id}">
        ${firma.Naziv} (${firma.PIB || "bez PIB"})
      </label>
    `;
    copyFirmList.appendChild(wrapper);
  });
}

function renderFirma(data) {
  firmaNaziv.textContent = data.firma.Naziv || "-";
  firmaPib.textContent = data.firma.PIB || "-";
  firmaRadnici.textContent = data.counts.Radnici || 0;
  firmaAktivni.textContent = data.counts.Aktivni || 0;
  firmaObracuni.textContent = data.counts.Obracuni || 0;
  firmaCard.classList.remove("d-none");
}

function renderMonths(rows) {
  monthsTableBody.innerHTML = "";

  if (!rows.length) {
    monthsTableBody.innerHTML =
      '<tr><td colspan="12" class="text-center">Nema obracuna.</td></tr>';
    monthsCard.classList.remove("d-none");
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
          data-godina="${row.GodObr}"
          data-mjesec="${row.MjesObr}"
        >
          Detalji
        </button>
      </td>
      <td>
        <button
          class="btn btn-sm btn-outline-success"
          data-ioppd-godina="${row.GodObr}"
          data-ioppd-mjesec="${row.MjesObr}"
        >
          IOPPD XML
        </button>
      </td>
    `;
    monthsTableBody.appendChild(tr);
  });

  monthsCard.classList.remove("d-none");
}

function getSelectedCopyFirmIds() {
  return Array.from(document.querySelectorAll(".copy-firma-check:checked")).map(
    (input) => parseInt(input.value, 10),
  );
}

function getCopyPayload() {
  return {
    idsFirmi: getSelectedCopyFirmIds(),
    sourceYear: parseInt(sourceYearInput.value, 10),
    sourceMonth: parseInt(sourceMonthInput.value, 10),
    targetYear: parseInt(targetYearInput.value, 10),
    targetMonth: parseInt(targetMonthInput.value, 10),
  };
}

function validateCopyPayload(payload) {
  if (!payload.idsFirmi.length) return "Izaberi bar jednu firmu.";
  if (!payload.sourceYear || !payload.sourceMonth) return "Unesi mjesec uzor.";
  if (!payload.targetYear || !payload.targetMonth) return "Unesi novi mjesec.";
  if (payload.sourceMonth < 1 || payload.sourceMonth > 12) return "Mjesec uzor nije ispravan.";
  if (payload.targetMonth < 1 || payload.targetMonth > 12) return "Novi mjesec nije ispravan.";
  if (
    payload.sourceYear === payload.targetYear &&
    payload.sourceMonth === payload.targetMonth
  ) {
    return "Mjesec uzor i novi mjesec ne mogu biti isti.";
  }
  return "";
}

function statusBadge(row) {
  if (row.copied) return '<span class="badge text-bg-success">Kopirano</span>';
  if (row.status === "ready") return '<span class="badge text-bg-success">Spremno</span>';
  if (row.status === "skip") return '<span class="badge text-bg-warning">Preskoci</span>';
  return '<span class="badge text-bg-danger">Greska</span>';
}

function renderCopyResults(rows) {
  copyResultTableBody.innerHTML = "";

  if (!rows.length) {
    copyResultTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center">Nema rezultata.</td></tr>';
  }

  rows.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.naziv || row.idFirma}</td>
      <td>${row.sourceCount || 0} obr.</td>
      <td>${row.targetCount || 0} obr.</td>
      <td>${row.sourceWorkers || 0}</td>
      <td>${row.sourceRows || 0}</td>
      <td>${statusBadge(row)} <span class="ms-2">${row.message || ""}</span></td>
    `;
    copyResultTableBody.appendChild(tr);
  });

  copyResultCard.classList.remove("d-none");
}

async function checkCopy() {
  const payload = getCopyPayload();
  const validation = validateCopyPayload(payload);
  runCopyBtn.classList.add("d-none");
  lastCopyCheck = [];

  if (validation) {
    setStatus(validation, "warning");
    return;
  }

  setStatus("Provjeravam kopiranje...", "info");
  checkCopyBtn.disabled = true;

  try {
    const response = await fetch("/plate/kopiranje/provjeri", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!result.success) {
      setStatus(result.error || "Greska pri provjeri.", "danger");
      return;
    }

    lastCopyCheck = result.data || [];
    renderCopyResults(lastCopyCheck);

    if (lastCopyCheck.some((row) => row.status === "ready")) {
      runCopyBtn.classList.remove("d-none");
      clearStatus();
    } else {
      setStatus("Nema firmi spremnih za kopiranje.", "warning");
    }
  } catch (error) {
    setStatus(error.message, "danger");
  } finally {
    checkCopyBtn.disabled = false;
  }
}

async function runCopy() {
  const payload = getCopyPayload();
  const validation = validateCopyPayload(payload);

  if (validation) {
    setStatus(validation, "warning");
    return;
  }

  if (!lastCopyCheck.some((row) => row.status === "ready")) {
    setStatus("Prvo uradi provjeru.", "warning");
    return;
  }

  setStatus("Upisujem kopije...", "info");
  runCopyBtn.disabled = true;
  checkCopyBtn.disabled = true;

  try {
    const response = await fetch("/plate/kopiranje/napravi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!result.success) {
      setStatus(result.error || "Greska pri kopiranju.", "danger");
      return;
    }

    renderCopyResults(result.data || []);
    runCopyBtn.classList.add("d-none");
    setStatus("Kopiranje zavrseno.", "success");
  } catch (error) {
    setStatus(error.message, "danger");
  } finally {
    runCopyBtn.disabled = false;
    checkCopyBtn.disabled = false;
  }
}

async function loadPregled() {
  const idFirma = parseInt(firmaSelect.value, 10);
  if (!idFirma) {
    setStatus("Izaberi firmu.", "warning");
    return;
  }

  clearStatus();
  setLoading(true);
  firmaCard.classList.add("d-none");
  monthsCard.classList.add("d-none");
  detailsCard.classList.add("d-none");
  monthsTableBody.innerHTML = "";
  detailsTableBody.innerHTML = "";

  try {
    const response = await fetch(`/plate/pregled?idFirma=${idFirma}`);
    const result = await response.json();

    if (!result.success) {
      setStatus(result.error || "Greska pri ucitavanju obracuna.", "danger");
      return;
    }

    renderFirma(result);
    renderMonths(result.months || []);
  } catch (error) {
    setStatus(error.message, "danger");
  } finally {
    setLoading(false);
  }
}

async function loadDetalji(godina, mjesec) {
  const idFirma = parseInt(firmaSelect.value, 10);
  detailsCard.classList.add("d-none");
  detailsTableBody.innerHTML = "";
  detailsTitle.textContent = `Detalji za ${mjesec}/${godina}`;

  try {
    const response = await fetch(
      `/plate/detalji?idFirma=${idFirma}&godina=${godina}&mjesec=${mjesec}`,
    );
    const result = await response.json();

    if (!result.success) {
      setStatus(result.error || "Greska pri ucitavanju detalja.", "danger");
      return;
    }

    if (!result.data.length) {
      detailsTableBody.innerHTML =
        '<tr><td colspan="11" class="text-center">Nema detalja.</td></tr>';
    } else {
      result.data.forEach((row) => {
        const status = row.Aktivan && row.Zaposlen ? "Aktivan" : "Neaktivan";
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${row.Prezime || ""} ${row.Ime || ""}</td>
          <td>${row.MaticniBroj || "-"}</td>
          <td>${status}</td>
          <td>${row.BrojTekucegRacuna || "-"}</td>
          <td>${row.OznakaObr || "-"}</td>
          <td>${money(row.Neto)}</td>
          <td>${money(row.Bruto)}</td>
          <td>${money(row.Porez)}</td>
          <td>${money(row.Prirez)}</td>
          <td>${money(row.DoprinosiZaposleni)}</td>
          <td>${money(row.DoprinosiPoslodavac)}</td>
        `;
        detailsTableBody.appendChild(tr);
      });
    }

    clearStatus();
    detailsCard.classList.remove("d-none");
  } catch (error) {
    setStatus(error.message, "danger");
  }
}

async function checkMissingPayrolls() {
  const godina = parseInt(missingYearInput.value, 10);
  const mjesec = parseInt(missingMonthInput.value, 10);

  if (!godina || !mjesec || mjesec < 1 || mjesec > 12) {
    setStatus("Unesi ispravnu godinu i mjesec.", "warning");
    return;
  }

  setStatus("Provjeravam firme bez obracuna...", "info");
  checkMissingBtn.disabled = true;
  missingCard.classList.add("d-none");
  missingTableBody.innerHTML = "";

  try {
    const response = await fetch(
      `/plate/firme-bez-obracuna?godina=${godina}&mjesec=${mjesec}`,
    );
    const result = await response.json();

    if (!result.success) {
      setStatus(result.error || "Greska pri provjeri.", "danger");
      return;
    }

    missingTitle.textContent = `Firme bez obracuna za ${mjesec}/${godina}`;
    missingSummary.textContent = `Ima obracun: ${result.summary.imaObracun} / Nema: ${result.summary.nemaObracun}`;
    missingTableBody.innerHTML = "";

    if (!result.data.length) {
      missingTableBody.innerHTML =
        '<tr><td colspan="5" class="text-center">Sve firme imaju obracun.</td></tr>';
    } else {
      result.data.forEach((firma) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${firma.Naziv || "-"}</td>
          <td>${firma.PIB || "-"}</td>
          <td>${firma.Grad || "-"}</td>
          <td>${firma.Radnici || 0}</td>
          <td>${firma.AktivniRadnici || 0}</td>
        `;
        missingTableBody.appendChild(tr);
      });
    }

    missingCard.classList.remove("d-none");
    clearStatus();
  } catch (error) {
    setStatus(error.message, "danger");
  } finally {
    checkMissingBtn.disabled = false;
  }
}

function ioppdUrl(idFirma, godina, mjesec) {
  return `/plate/ioppd?idFirma=${idFirma}&godina=${godina}&mjesec=${mjesec}`;
}

async function loadIoppdFirme() {
  const godina = parseInt(ioppdYearInput.value, 10);
  const mjesec = parseInt(ioppdMonthInput.value, 10);

  if (!godina || !mjesec || mjesec < 1 || mjesec > 12) {
    setStatus("Unesi ispravnu godinu i mjesec za IOPPD.", "warning");
    return;
  }

  setStatus("Ucitavam firme za IOPPD...", "info");
  loadIoppdBtn.disabled = true;
  downloadAllIoppdBtn.classList.add("d-none");
  ioppdCard.classList.add("d-none");
  ioppdTableBody.innerHTML = "";
  currentIoppdFirme = [];

  try {
    const response = await fetch(
      `/plate/firme-sa-obracunom?godina=${godina}&mjesec=${mjesec}`,
    );
    const result = await response.json();

    if (!result.success) {
      setStatus(result.error || "Greska pri ucitavanju firmi za IOPPD.", "danger");
      return;
    }

    currentIoppdFirme = result.data || [];
    ioppdTitle.textContent = `Firme sa obracunom za ${mjesec}/${godina}`;
    ioppdSummary.textContent = `Ima obracun: ${result.summary.imaObracun} / Nema: ${result.summary.nemaObracun}`;
    ioppdTableBody.innerHTML = "";

    if (!currentIoppdFirme.length) {
      ioppdTableBody.innerHTML =
        '<tr><td colspan="7" class="text-center">Nema firmi sa obracunom.</td></tr>';
    } else {
      currentIoppdFirme.forEach((firma) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${firma.Naziv || "-"}</td>
          <td>${firma.PIB || "-"}</td>
          <td>${firma.BrojRadnika || 0}</td>
          <td>${firma.BrojStavki || 0}</td>
          <td>${money(firma.Bruto)}</td>
          <td>${money(firma.Neto)}</td>
          <td>
            <a
              class="btn btn-sm btn-outline-success"
              href="${ioppdUrl(firma.Id, godina, mjesec)}"
            >
              Download XML
            </a>
          </td>
        `;
        ioppdTableBody.appendChild(tr);
      });

      downloadAllIoppdBtn.classList.remove("d-none");
    }

    ioppdCard.classList.remove("d-none");
    clearStatus();
  } catch (error) {
    setStatus(error.message, "danger");
  } finally {
    loadIoppdBtn.disabled = false;
  }
}

function downloadAllIoppd() {
  const godina = parseInt(ioppdYearInput.value, 10);
  const mjesec = parseInt(ioppdMonthInput.value, 10);

  if (!currentIoppdFirme.length) {
    setStatus("Prvo prikazi firme za IOPPD.", "warning");
    return;
  }

  setStatus(`Pokrecem download za ${currentIoppdFirme.length} XML fajlova...`, "info");

  currentIoppdFirme.forEach((firma, index) => {
    window.setTimeout(() => {
      const link = document.createElement("a");
      link.href = ioppdUrl(firma.Id, godina, mjesec);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      link.remove();

      if (index === currentIoppdFirme.length - 1) {
        setStatus("Download je pokrenut.", "success");
      }
    }, index * 250);
  });
}

monthsTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-godina][data-mjesec]");
  if (!button) return;
  loadDetalji(button.dataset.godina, button.dataset.mjesec);
});

monthsTableBody.addEventListener("click", (event) => {
  const button = event.target.closest(
    "button[data-ioppd-godina][data-ioppd-mjesec]",
  );
  if (!button) return;

  const idFirma = parseInt(firmaSelect.value, 10);
  const godina = button.dataset.ioppdGodina;
  const mjesec = button.dataset.ioppdMjesec;

  if (!idFirma) {
    setStatus("Izaberi firmu.", "warning");
    return;
  }

  window.location.href = `/plate/ioppd?idFirma=${idFirma}&godina=${godina}&mjesec=${mjesec}`;
});

loadBtn.addEventListener("click", loadPregled);
checkMissingBtn.addEventListener("click", checkMissingPayrolls);
loadIoppdBtn.addEventListener("click", loadIoppdFirme);
downloadAllIoppdBtn.addEventListener("click", downloadAllIoppd);
toggleCopySectionBtn.addEventListener("click", () => {
  const isHidden = copySection.classList.toggle("d-none");
  toggleCopySectionBtn.textContent = isHidden
    ? "Kopija obracuna"
    : "Sakrij kopiju obracuna";

  if (isHidden) {
    copyResultCard.classList.add("d-none");
    runCopyBtn.classList.add("d-none");
    lastCopyCheck = [];
  }
});
selectAllCopyBtn.addEventListener("click", () => {
  document
    .querySelectorAll(".copy-firma-check")
    .forEach((input) => (input.checked = true));
});
clearCopyBtn.addEventListener("click", () => {
  document
    .querySelectorAll(".copy-firma-check")
    .forEach((input) => (input.checked = false));
});
checkCopyBtn.addEventListener("click", checkCopy);
runCopyBtn.addEventListener("click", runCopy);
window.addEventListener("DOMContentLoaded", () => {
  const now = new Date();
  missingYearInput.value = now.getFullYear();
  missingMonthInput.value = now.getMonth() + 1;
  ioppdYearInput.value = now.getFullYear();
  ioppdMonthInput.value = now.getMonth() + 1;
  sourceYearInput.value = now.getFullYear();
  sourceMonthInput.value = Math.max(1, now.getMonth()).toString();
  targetYearInput.value = now.getFullYear();
  targetMonthInput.value = (now.getMonth() + 1).toString();
  loadFirme();
});
