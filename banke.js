const bankSelect = document.getElementById("bankSelect");
const yearInput = document.getElementById("yearInput");
const runBtn = document.getElementById("runBtn");
const statusBox = document.getElementById("statusBox");
const summaryCard = document.getElementById("summaryCard");
const tableCard = document.getElementById("tableCard");
const gapsTableBody = document.querySelector("#gapsTable tbody");
const summaryBank = document.getElementById("summaryBank");
const summaryMax = document.getElementById("summaryMax");
const summaryBez = document.getElementById("summaryBez");
const summarySa = document.getElementById("summarySa");

function setStatus(msg, variant = "info") {
  statusBox.textContent = msg;
  statusBox.className = `alert alert-${variant}`;
  statusBox.classList.remove("d-none");
}

function clearStatus() {
  statusBox.classList.add("d-none");
}

function renderTable(rows) {
  gapsTableBody.innerHTML = "";
  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="4" class="text-center">Nema podataka</td>';
    gapsTableBody.appendChild(tr);
    return;
  }

  // Sortiraj - prvo firme sa rupama, zatim bez rupa
  const sorted = rows.sort((a, b) => {
    const aHasGaps = a.missing && a.missing.length > 0 ? 1 : 0;
    const bHasGaps = b.missing && b.missing.length > 0 ? 1 : 0;
    return bHasGaps - aHasGaps; // Prvo sa rupama (1), zatim bez (0)
  });

  sorted.forEach((row) => {
    const missing = row.missing && row.missing.length > 0;
    const preview = missing 
      ? row.missing.slice(0, 40).join(", ") + (row.missing.length > 40 ? " ..." : "")
      : "-";
    
    const datumStr = row.maxDate ? new Date(row.maxDate).toLocaleDateString("sr-RS") : "-";
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${row.apUser}</td>
      <td>${preview}</td>
      <td>${row.maxRbr}</td>
      <td>${datumStr}</td>
    `;
    gapsTableBody.appendChild(tr);
  });
}

async function loadReport() {
  clearStatus();
  summaryCard.classList.add("d-none");
  tableCard.classList.add("d-none");
  gapsTableBody.innerHTML = "";

  const bank = bankSelect.value;
  const year = parseInt(yearInput.value, 10);
  if (!year || year < 2000) {
    setStatus("Unesi ispravnu godinu.", "warning");
    return;
  }

  setStatus("Učitavam...", "info");

  try {
    const resp = await fetch(
      `/banke-izvodi?bank=${encodeURIComponent(bank)}&year=${encodeURIComponent(year)}`
    );
    const data = await resp.json();

    if (!data.success) {
      setStatus(data.error || "Greška pri učitavanju.", "danger");
      return;
    }

    summaryBank.textContent = data.bankaNaziv;
    summaryMax.textContent = data.globalMax;
    summaryBez.textContent = data.withoutGaps;
    summarySa.textContent = data.withGaps;
    summaryCard.classList.remove("d-none");

    renderTable(data.data || []);
    tableCard.classList.remove("d-none");
    clearStatus();
  } catch (err) {
    setStatus(err.message, "danger");
  }
}

function initDefaults() {
  const nowYear = new Date().getFullYear();
  yearInput.value = nowYear - 1; // Prethodna godina
}

runBtn.addEventListener("click", loadReport);
window.addEventListener("DOMContentLoaded", initDefaults);
