async function fetchData() {
  try {
    const response = await fetch("/sve_plate");
    const result = await response.json();

    if (result.success) {
      const table = document.getElementById("resultTable");
      table.innerHTML = `
                <thead class="table-dark">
                    <tr>
                        <th>ApUser</th>
                        <th>BrojNaloga</th>
                    </tr>
                </thead>
                <tbody>
            `;
      result.data.forEach((row) => {
        const newRow = `<tr><td>${row.ApUser}</td><td>${row.BrojNaloga}</td></tr>`;
        table.querySelector("tbody").innerHTML += newRow;
      });
      table.innerHTML += "</tbody>";
      table.classList.remove("d-none");
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function fetchPdvPrijave() {
  try {
    const response = await fetch("/pdv_prijave");
    const result = await response.json();

    if (result.success) {
      const table = document.getElementById("pdvPrijave");
      table.innerHTML = `
                <thead class="table-dark">
                    <tr>
                        <th>ApUser</th>
                        <th>BrojNaloga</th>
                    </tr>
                </thead>
                <tbody>
            `;
      result.data.forEach((row) => {
        const newRow = `<tr><td>${row.ApUser}</td><td>${row.BrojNaloga}</td></tr>`;
        table.querySelector("tbody").innerHTML += newRow;
      });
      table.innerHTML += "</tbody>";
      table.classList.remove("d-none");
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function fetchData1() {
  try {
    const response = await fetch("/pocetno_stanje");
    const result = await response.json();

    if (result.success) {
      const table = document.getElementById("pocetno");
      table.innerHTML = `
                <thead class="table-dark">
                    <tr>
                        <th>ime firme</th>
                        
                    </tr>
                </thead>
                <tbody>
            `;
      result.data.forEach((row) => {
        const newRow = `<tr><td>${row.ApUser}</td></tr>`;
        table.querySelector("tbody").innerHTML += newRow;
      });
      table.innerHTML += "</tbody>";
      table.classList.remove("d-none");
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function prikaziFirme() {
  try {
    const listaFirmi = document.getElementById("listaFirmi");
    const izabranaFirma = document.getElementById("izabranaFirma");
    const tabelaDobavljaca = document.getElementById("saldoDobavljaca");

    // Sakrij prethodne rezultate
    izabranaFirma.classList.add("d-none");
    tabelaDobavljaca.classList.add("d-none");

    // Prikaži loading
    listaFirmi.innerHTML =
      '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    listaFirmi.classList.remove("d-none");

    // Učitaj listu firmi
    const response = await fetch("/firme");
    const result = await response.json();

    if (!result.success) {
      alert("Greška pri učitavanju firmi: " + result.error);
      return;
    }

    // Prikaži firme kao dugmad
    listaFirmi.innerHTML = "";
    result.data.forEach((firma) => {
      const dugme = document.createElement("div");
      dugme.className = "col-md-3 col-sm-4 col-6";
      dugme.innerHTML = `
        <button class="btn btn-outline-primary w-100" onclick="ucitajDobavljace('${firma.ApUser.replace(
          /'/g,
          "\\'",
        )}')">
          ${firma.ApUser}
        </button>
      `;
      listaFirmi.appendChild(dugme);
    });
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function ucitajDobavljace(firma) {
  try {
    const izabranaFirma = document.getElementById("izabranaFirma");
    const table = document.getElementById("saldoDobavljaca");

    // Učitaj kontakte i mapiranje prvi put
    if (!window.kontakti) {
      const kontaktiResponse = await fetch("/kontakti");
      const kontaktiResult = await kontaktiResponse.json();
      if (kontaktiResult.success) {
        window.kontakti = kontaktiResult.data;
      } else {
        window.kontakti = [];
      }
    }

    if (!window.vendorMapping) {
      const mappingResponse = await fetch(
        "/vendor-mapping",
      );
      const mappingResult = await mappingResponse.json();
      if (mappingResult.success) {
        window.vendorMapping = mappingResult.data;
      } else {
        window.vendorMapping = {};
      }
    }

    // Prikaži koja firma je izabrana
    izabranaFirma.innerHTML = `<strong>Prikazujem dobavljače za firmu:</strong> ${firma}`;
    izabranaFirma.classList.remove("d-none");

    // Prikaži loading u tabeli
    table.innerHTML = `
      <thead class="table-dark">
        <tr>
          <th>Firma</th>
          <th>Godina</th>
          <th>Dobavljač</th>
          <th>Grad</th>
          <th>Duguje</th>
          <th>Potraživanje</th>
          <th>Saldo</th>
          <th>Akcija</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="8" class="text-center">
            <div class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            Učitavam podatke...
          </td>
        </tr>
      </tbody>
    `;
    table.classList.remove("d-none");

    // Učitaj dobavljače
    const response = await fetch(
      `/saldo_dobavljaca?firma=${encodeURIComponent(
        firma,
      )}`,
    );
    const result = await response.json();

    if (!result.success) {
      alert("Greška: " + result.error);
      return;
    }

    // Popuni tabelu
    table.querySelector("tbody").innerHTML = "";

    if (result.data.length === 0) {
      table.querySelector("tbody").innerHTML =
        '<tr><td colspan="8" class="text-center">Nema podataka za ovu firmu</td></tr>';
      return;
    }

    result.data.forEach((row) => {
      const saldoClass =
        row.Saldo > 0 ? "text-danger" : row.Saldo < 0 ? "text-success" : "";

      // Pretraži email iz mapiranja prvo
      let emailAdresa = "";
      const dobavljacNaziv = (row.Dobavljac || "").toLowerCase().trim();

      // Prvo proveri mapiranje dobavljača
      if (window.vendorMapping) {
        const mappingKey = Object.keys(window.vendorMapping).find(
          (key) => key.toLowerCase() === dobavljacNaziv,
        );
        if (mappingKey && window.vendorMapping[mappingKey]) {
          emailAdresa = window.vendorMapping[mappingKey];
        }
      }

      // Ako nema u mapiranju, pretraži u kontaktima - samo tačna poklapanja
      if (!emailAdresa && window.kontakti && dobavljacNaziv) {
        const kontakt = window.kontakti.find((k) => {
          const searchText = (k.searchText || "").toLowerCase().trim();
          // Samo ako se dobavljač tačno pojavljuje u searchText
          return (
            searchText.includes(dobavljacNaziv) && dobavljacNaziv.length > 2
          );
        });

        if (kontakt) {
          emailAdresa = kontakt.email;
        }
      }

      // Pripremi mailto link
      const subject = encodeURIComponent(
        `Zahtev za analitičku karticu - ${row.Firma}`,
      );
      const body = encodeURIComponent(
        `Poštovani,\n\n` +
          `Molim Vas da mi pošaljete analitičku karticu za 2026. godinu za firmu ${row.Firma}.` +
          (row.PIB ? `\nPIB: ${row.PIB}` : "") +
          `\n\nHvala unaprijed.\n\n` +
          `Srdačan pozdrav\n` +
          `Željko Đuranović\n` +
          `Knjigovodstvena Agencija "Summa Summarum"\n` +
          `Tel: 067/440-040`,
      );
      const mailtoLink = `mailto:${emailAdresa}?subject=${subject}&body=${body}`;

      const newRow = `<tr>
        <td>${row.Firma}</td>
        <td>${row.Godina}</td>
        <td>${row.Dobavljac || "-"}</td>
        <td>${row.Grad || "-"}</td>
        <td>${row.SumaDuguje.toFixed(2)}</td>
        <td>${row.SumaPotrazuje.toFixed(2)}</td>
        <td class="${saldoClass}"><strong>${row.Saldo.toFixed(2)}</strong></td>
        <td>
          <a href="${mailtoLink}" class="btn btn-sm btn-outline-primary" title="${
            emailAdresa || "Email nije pronađen"
          }">
            Traži karticu ${emailAdresa ? "✓" : ""}
          </a>
        </td>
      </tr>`;
      table.querySelector("tbody").innerHTML += newRow;
    });
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function fetchSaldoDobavljaca() {
  // Stara funkcija - sada poziva prikaziFirme
  prikaziFirme();
}

async function prikaziFirmeZaZakljucni() {
  try {
    const listaFirmi = document.getElementById("listaFirmiZakljucni");
    const izabranaFirma = document.getElementById("izabranaFirmaZakljucni");
    const tabela = document.getElementById("zakljucniList");

    // Sakrij prethodne rezultate
    izabranaFirma.classList.add("d-none");
    tabela.classList.add("d-none");

    // Prikaži loading
    listaFirmi.innerHTML =
      '<div class="col-12 text-center"><div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div></div>';
    listaFirmi.classList.remove("d-none");

    // Učitaj listu firmi
    const response = await fetch("/firme");
    const result = await response.json();

    if (!result.success) {
      alert("Greška pri učitavanju firmi: " + result.error);
      return;
    }

    // Prikaži firme kao dugmad
    listaFirmi.innerHTML = "";
    result.data.forEach((firma) => {
      const dugme = document.createElement("div");
      dugme.className = "col-md-3 col-sm-4 col-6";
      dugme.innerHTML = `
        <button class="btn btn-outline-success w-100" onclick="ucitajZakljucniList('${firma.ApUser.replace(
          /'/g,
          "\\'",
        )}')">
          ${firma.ApUser}
        </button>
      `;
      listaFirmi.appendChild(dugme);
    });
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function ucitajZakljucniList(firma) {
  try {
    const izabranaFirma = document.getElementById("izabranaFirmaZakljucni");
    const table = document.getElementById("zakljucniList");

    // Prikaži koja firma je izabrana
    izabranaFirma.innerHTML = `<strong>Zaključni list za firmu:</strong> ${firma}`;
    izabranaFirma.classList.remove("d-none");

    // Prikaži loading u tabeli
    table.innerHTML = `
      <thead class="table-dark">
        <tr>
          <th>Konto</th>
          <th>Naziv konta</th>
          <th>Promet Duguje</th>
          <th>Promet Potraživanje</th>
          <th>Saldo</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="5" class="text-center">
            <div class="spinner-border spinner-border-sm" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            Učitavam podatke...
          </td>
        </tr>
      </tbody>
    `;
    table.classList.remove("d-none");

    // Učitaj zaključni list
    const response = await fetch(
      `/zakljucni_list?firma=${encodeURIComponent(firma)}`,
    );
    const result = await response.json();

    if (!result.success) {
      alert("Greška: " + result.error);
      return;
    }

    // Popuni tabelu
    table.querySelector("tbody").innerHTML = "";

    if (result.data.length === 0) {
      table.querySelector("tbody").innerHTML =
        '<tr><td colspan="5" class="text-center">Nema podataka za ovu firmu</td></tr>';
      return;
    }

    let ukupnoDuguje = 0;
    let ukupnoPotrazuje = 0;
    let ukupnoSaldo = 0;

    result.data.forEach((row) => {
      ukupnoDuguje += row.PrometDuguje;
      ukupnoPotrazuje += row.PrometPotrazuje;
      ukupnoSaldo += row.Saldo;

      const saldoClass =
        row.Saldo > 0 ? "text-danger" : row.Saldo < 0 ? "text-success" : "";
      const newRow = `<tr>
        <td>${row.Konto || "-"}</td>
        <td>${row.NazivKonta || "-"}</td>
        <td>${row.PrometDuguje.toFixed(2)}</td>
        <td>${row.PrometPotrazuje.toFixed(2)}</td>
        <td class="${saldoClass}"><strong>${row.Saldo.toFixed(2)}</strong></td>
      </tr>`;
      table.querySelector("tbody").innerHTML += newRow;
    });

    // Dodaj red sa ukupnim iznosima
    const ukupnoRow = `<tr class="table-warning fw-bold">
      <td colspan="2">UKUPNO</td>
      <td>${ukupnoDuguje.toFixed(2)}</td>
      <td>${ukupnoPotrazuje.toFixed(2)}</td>
      <td class="${
        ukupnoSaldo > 0 ? "text-danger" : ukupnoSaldo < 0 ? "text-success" : ""
      }">${ukupnoSaldo.toFixed(2)}</td>
    </tr>`;
    table.querySelector("tbody").innerHTML += ukupnoRow;
  } catch (error) {
    alert("Error: " + error.message);
  }
}

async function fetchFirme2449() {
  try {
    const response = await fetch("/firme_2449");
    const result = await response.json();

    if (result.success) {
      const table = document.getElementById("firme2449");
      table.innerHTML = `
        <thead class="table-dark">
          <tr>
            <th>Firma</th>
            <th>Konto</th>
            <th>Naziv konta</th>
            <th>Duguje</th>
            <th>Potraživanje</th>
            <th>Saldo</th>
          </tr>
        </thead>
        <tbody>
      `;

      result.data.forEach((row) => {
        const saldoClass =
          row.Saldo > 0 ? "text-danger" : row.Saldo < 0 ? "text-success" : "";
        const newRow = `<tr>
          <td>${row.Firma}</td>
          <td>${row.Konto || "-"}</td>
          <td>${row.NazivKonta || "-"}</td>
          <td>${row.PrometDuguje.toFixed(2)}</td>
          <td>${row.PrometPotrazuje.toFixed(2)}</td>
          <td class="${saldoClass}"><strong>${row.Saldo.toFixed(2)}</strong></td>
        </tr>`;
        table.querySelector("tbody").innerHTML += newRow;
      });

      table.innerHTML += "</tbody>";
      table.classList.remove("d-none");
    } else {
      alert("Error: " + result.error);
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const menuItems = document.querySelectorAll("[data-admin-section]");
  const sections = document.querySelectorAll(".admin-section");

  function showAdminSection(sectionName) {
    const section = document.getElementById(`admin-section-${sectionName}`);
    if (!section) return;

    menuItems.forEach((menuItem) => {
      menuItem.classList.toggle(
        "active",
        menuItem.dataset.adminSection === sectionName,
      );
    });
    sections.forEach((item) => item.classList.remove("active"));
    section.classList.add("active");
  }

  menuItems.forEach((item) => {
    item.addEventListener("click", () => {
      const sectionName = item.dataset.adminSection;
      window.location.hash = sectionName;
      showAdminSection(sectionName);
    });
  });

  if (window.location.hash) {
    showAdminSection(window.location.hash.slice(1));
  }

  initPortalUsers();
});

function setPortalUserStatus(message, variant = "info") {
  const status = document.getElementById("portalUserStatus");
  if (!status) return;

  status.textContent = message;
  status.className = `alert alert-${variant}`;
  status.classList.remove("d-none");
}

function clearPortalUserStatus() {
  document.getElementById("portalUserStatus")?.classList.add("d-none");
}

async function loadPortalFirmOptions() {
  const select = document.getElementById("portalFirmaSelect");
  if (!select) return;

  select.innerHTML = '<option value="">Ucitavam firme...</option>';

  const response = await fetch("/portal/firme");
  const result = await response.json();

  if (!result.success) {
    select.innerHTML = '<option value="">Greska pri ucitavanju firmi</option>';
    setPortalUserStatus(result.error || "Greska pri ucitavanju firmi.", "danger");
    return;
  }

  select.innerHTML = '<option value="">Izaberi firmu</option>';
  result.data.forEach((firma) => {
    const option = document.createElement("option");
    option.value = firma.Id;
    option.textContent = `${firma.ApUser} (${firma.PIB || "bez PIB"})`;
    select.appendChild(option);
  });
}

async function loadPortalUsers() {
  const tbody = document.querySelector("#portalUsersTable tbody");
  if (!tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="6" class="text-center">Ucitavam...</td></tr>';

  const response = await fetch("/portal/users");
  const result = await response.json();

  if (!result.success) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">Greska pri ucitavanju</td></tr>';
    setPortalUserStatus(result.error || "Greska pri ucitavanju korisnika.", "danger");
    return;
  }

  if (!result.data.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="text-center">Nema korisnika</td></tr>';
    return;
  }

  tbody.innerHTML = "";
  result.data.forEach((user) => {
    const firme = user.Firme && user.Firme.length ? user.Firme : [{}];
    const firmaText = firme
      .map((firma) => firma.NazivFirme || firma.ApUser || "-")
      .join(", ");
    const pibText = firme.map((firma) => firma.PIB || "-").join(", ");
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${user.Username}</td>
      <td>${user.Role}</td>
      <td>${firmaText}</td>
      <td>${pibText}</td>
      <td>${user.IsActive ? "Aktivan" : "Neaktivan"}</td>
      <td>
        <div class="d-flex gap-2">
          <button
            class="btn btn-sm btn-outline-primary"
            type="button"
            data-reset-password-id="${user.Id}"
            data-reset-password-user="${user.Username}"
          >
            Promijeni lozinku
          </button>
          <button
            class="btn btn-sm btn-outline-danger"
            type="button"
            data-delete-user-id="${user.Id}"
            data-delete-user-name="${user.Username}"
          >
            Izbrisi
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(row);
  });

  tbody.querySelectorAll("[data-reset-password-id]").forEach((button) => {
    button.addEventListener("click", () => {
      resetPortalUserPassword(
        Number(button.dataset.resetPasswordId),
        button.dataset.resetPasswordUser,
      );
    });
  });

  tbody.querySelectorAll("[data-delete-user-id]").forEach((button) => {
    button.addEventListener("click", () => {
      deletePortalUser(
        Number(button.dataset.deleteUserId),
        button.dataset.deleteUserName,
      );
    });
  });
}

async function resetPortalUserPassword(userId, username) {
  const password = window.prompt(`Nova lozinka za korisnika ${username}:`);
  if (password === null) return;

  if (password.length < 6) {
    setPortalUserStatus("Lozinka mora imati najmanje 6 karaktera.", "warning");
    return;
  }

  try {
    const response = await fetch(`/portal/users/${userId}/password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = await response.json();

    if (!result.success) {
      setPortalUserStatus(result.error || "Lozinka nije promijenjena.", "danger");
      return;
    }

    setPortalUserStatus(`Lozinka za ${username} je promijenjena.`, "success");
  } catch (error) {
    setPortalUserStatus(error.message, "danger");
  }
}

async function deletePortalUser(userId, username) {
  const confirmed = window.confirm(
    `Da li zelis da izbrises korisnika ${username}?`,
  );
  if (!confirmed) return;

  try {
    const response = await fetch(`/portal/users/${userId}`, {
      method: "DELETE",
    });
    const result = await response.json();

    if (!result.success) {
      setPortalUserStatus(result.error || "Korisnik nije izbrisan.", "danger");
      return;
    }

    setPortalUserStatus(`Korisnik ${username} je izbrisan.`, "success");
    await loadPortalUsers();
  } catch (error) {
    setPortalUserStatus(error.message, "danger");
  }
}

async function createPortalUser(event) {
  event.preventDefault();
  clearPortalUserStatus();

  const createBtn = document.getElementById("portalCreateUserBtn");
  const usernameInput = document.getElementById("portalUsername");
  const passwordInput = document.getElementById("portalPassword");
  const firmaSelect = document.getElementById("portalFirmaSelect");

  const payload = {
    username: usernameInput.value.trim(),
    password: passwordInput.value,
    firmaId: Number(firmaSelect.value),
  };

  createBtn.disabled = true;

  try {
    const response = await fetch("/portal/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!result.success) {
      setPortalUserStatus(result.error || "Korisnik nije kreiran.", "danger");
      return;
    }

    setPortalUserStatus(
      result.reactivated
        ? "Korisnik je ponovo aktiviran i lozinka je promijenjena."
        : "Korisnik je kreiran.",
      "success",
    );
    usernameInput.value = "";
    passwordInput.value = "";
    firmaSelect.value = "";
    await loadPortalUsers();
  } catch (error) {
    setPortalUserStatus(error.message, "danger");
  } finally {
    createBtn.disabled = false;
  }
}

function initPortalUsers() {
  const form = document.getElementById("portalUserForm");
  if (!form) return;

  form.addEventListener("submit", createPortalUser);
  document
    .getElementById("portalRefreshUsersBtn")
    ?.addEventListener("click", loadPortalUsers);

  loadPortalFirmOptions();
  loadPortalUsers();
}
