async function fetchData() {
  try {
    const response = await fetch("http://localhost:3000/sve_plate");
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
    const response = await fetch("http://localhost:3000/pdv_prijave");
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
    const response = await fetch("http://localhost:3000/pocetno_stanje");
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
    const response = await fetch("http://localhost:3000/firme");
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
          "\\'"
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
        </tr>
      </thead>
      <tbody>
        <tr>
          <td colspan="7" class="text-center">
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
      `http://localhost:3000/saldo_dobavljaca?firma=${encodeURIComponent(
        firma
      )}`
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
        '<tr><td colspan="7" class="text-center">Nema podataka za ovu firmu</td></tr>';
      return;
    }

    result.data.forEach((row) => {
      const saldoClass =
        row.Saldo > 0 ? "text-danger" : row.Saldo < 0 ? "text-success" : "";
      const newRow = `<tr>
        <td>${row.Firma}</td>
        <td>${row.Godina}</td>
        <td>${row.Dobavljac || "-"}</td>
        <td>${row.Grad || "-"}</td>
        <td>${row.SumaDuguje.toFixed(2)}</td>
        <td>${row.SumaPotrazuje.toFixed(2)}</td>
        <td class="${saldoClass}"><strong>${row.Saldo.toFixed(2)}</strong></td>
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
