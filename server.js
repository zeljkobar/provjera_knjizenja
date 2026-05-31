const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.static(__dirname)); // Servira statičke fajlove iz root direktorijuma

// Konfiguracija baze podataka
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  port: parseInt(process.env.DB_PORT) || 1433,
};

const plateDbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: "LP_SumaSumarumm",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  port: parseInt(process.env.DB_PORT) || 1433,
};

const PLATE_ID_APP = 29;
let platePoolPromise = null;

function getPlatePool() {
  if (!platePoolPromise) {
    platePoolPromise = new sql.ConnectionPool(plateDbConfig).connect();
  }
  return platePoolPromise;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatXmlNumber(value) {
  return Number(value || 0).toFixed(2);
}

function formatIoppdDate(year, month, day) {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}T00:00:00+01:00`;
}

function sanitizeFileName(value) {
  return String(value || "firma").replace(/[<>:"/\\|?*]/g, "_").trim();
}

function asciiFileName(value) {
  return sanitizeFileName(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "_");
}

// Funkcija za izvršavanje upita
async function sve_plate() {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
            SELECT  
                Apps.ApUser, 
                COUNT(Nalog.id) AS BrojNaloga
            FROM 
                [CRM_SumSumarum].[dbo].[Apps] AS Apps
            LEFT JOIN 
                [CRM_SumSumarum].[dbo].[Nalog] AS Nalog
            ON 
                Apps.Id = Nalog.IdApp AND Nalog.IdVrstaNaloga = 200 AND Nalog.Datum >= '2026-01-01'
            GROUP BY 
                Apps.ApUser
           -- HAVING count(Nalog.id) = 0
            ORDER BY 
                BrojNaloga ASC;
        `);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

// Funkcija za PDV prijave
async function pdv_prijave() {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
            SELECT  
                Apps.ApUser, 
                COUNT(Nalog.id) AS BrojNaloga
            FROM 
                [CRM_SumSumarum].[dbo].[Apps] AS Apps
            LEFT JOIN 
                [CRM_SumSumarum].[dbo].[Nalog] AS Nalog
            ON 
                Apps.Id = Nalog.IdApp AND Nalog.IdVrstaNaloga = 70 AND Nalog.Datum >= '2026-01-01'
            GROUP BY 
                Apps.ApUser
            ORDER BY 
                BrojNaloga ASC;
        `);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

async function pocetno_stanje() {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
        SELECT  
            Apps.ApUser, 
            COUNT(Nalog.id) AS BrojNaloga
        FROM (
            SELECT * from [CRM_SumSumarum].[dbo].[Apps] WHERE apps.godina = 2026) AS Apps
        LEFT JOIN 
            [CRM_SumSumarum].[dbo].[Nalog] AS Nalog
                ON 
            Apps.Id = Nalog.IdApp AND Nalog.IdVrstaNaloga = 400 AND Nalog.Datum >= '2026-01-01'
        GROUP BY 
                Apps.ApUser
        HAVING count(Nalog.id) = 0
        ORDER BY 
                BrojNaloga ASC;
        `);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

// API ruta za izvršavanje upita
app.get("/sve_plate", async (req, res) => {
  try {
    const data = await sve_plate();
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/pocetno_stanje", async (req, res) => {
  try {
    const data = await pocetno_stanje();
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/pdv_prijave", async (req, res) => {
  try {
    const data = await pdv_prijave();
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Pokretanje servera
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Endpoint za dobijanje liste firmi
async function lista_firmi() {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT DISTINCT ApUser, Id
      FROM [CRM_SumSumarum].[dbo].[Apps]
      WHERE Godina = 2026 AND IsActive = 1
      ORDER BY ApUser
    `);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

app.get("/firme", async (req, res) => {
  try {
    const data = await lista_firmi();
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Funkcija za saldo dobavljača (konto 4330)
async function saldo_dobavljaca(apUser) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input("apUser", sql.NVarChar, apUser)
      .query(`
      SELECT 
        Apps.ApUser AS Firma,
        Apps.Godina,
        Apps.VATnumber AS PIB,
        k.Naziv AS Dobavljac,
        k.Grad,
        agg.SumaDuguje,
        agg.SumaPotrazuje,
        agg.Saldo
      FROM [CRM_SumSumarum].[dbo].[Komitent] k
      JOIN (
        SELECT 
          ns.IdKomitent,
          n.IdApp,
          SUM(ns.Duguje) AS SumaDuguje,
          SUM(ns.Potrazuje) AS SumaPotrazuje,
          SUM(ns.Duguje) - SUM(ns.Potrazuje) AS Saldo
        FROM [CRM_SumSumarum].[dbo].[NalogStavke] ns
        INNER JOIN [CRM_SumSumarum].[dbo].[Nalog] n ON ns.IdNalog = n.Id
        WHERE ns.OznakaKonta = '4330'
        GROUP BY ns.IdKomitent, n.IdApp
      ) agg ON k.Id = agg.IdKomitent
      INNER JOIN [CRM_SumSumarum].[dbo].[Apps] Apps ON agg.IdApp = Apps.Id
      WHERE Apps.Godina = 2026 AND Apps.ApUser = @apUser
      ORDER BY agg.Saldo DESC;
    `);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

app.get("/saldo_dobavljaca", async (req, res) => {
  try {
    const firma = req.query.firma;
    const data = await saldo_dobavljaca(firma);
    res.json({ success: true, data, firma });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Funkcija za zaključni list
async function zakljucni_list(apUser) {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().input("apUser", sql.NVarChar, apUser)
      .query(`
      SELECT 
        k.Oznaka AS Konto,
        k.Naziv AS NazivKonta,
        SUM(ns.Duguje) AS PrometDuguje,
        SUM(ns.Potrazuje) AS PrometPotrazuje,
        SUM(ns.Duguje) - SUM(ns.Potrazuje) AS Saldo
      FROM [CRM_SumSumarum].[dbo].[NalogStavke] ns
      INNER JOIN [CRM_SumSumarum].[dbo].[Nalog] n ON ns.IdNalog = n.Id
      INNER JOIN [CRM_SumSumarum].[dbo].[Apps] a ON n.IdApp = a.Id
      LEFT JOIN [CRM_SumSumarum].[dbo].[Konto] k ON ns.IdKonto = k.Id
      WHERE a.ApUser = @apUser AND a.Godina = 2026
      GROUP BY k.Oznaka, k.Naziv, ns.OznakaKonta
      HAVING SUM(ns.Duguje) <> 0 OR SUM(ns.Potrazuje) <> 0
      ORDER BY k.Oznaka;
    `);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

app.get("/zakljucni_list", async (req, res) => {
  try {
    const firma = req.query.firma;
    const data = await zakljucni_list(firma);
    res.json({ success: true, data, firma });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Konfiguracija vrsta naloga za izvode banaka
const bankeVrste = [
  { code: "lovb", naziv: "Lovćen banka", oznaka: "LOVB" },
  { code: "ckb", naziv: "CKB", oznaka: "CKB" },
  { code: "hipo", naziv: "Hipotekarna banka", oznaka: "HIPO" },
  { code: "erste", naziv: "Erste banka", id: 47 },
  { code: "nlb", naziv: "NLB banka", oznaka: "NLB" },
  { code: "prvb", naziv: "Prva banka", oznaka: "PRVB" },
  { code: "addiko", naziv: "Addiko banka", id: 42 },
  { code: "ab", naziv: "Adriatic banka", oznaka: "AB" },
  { code: "zirb", naziv: "Zirrat banka", oznaka: "ZIRB" },
  { code: "unv", naziv: "Universal Capital banka", oznaka: "UNV" },
];

// Endpoint za pregled nedostajućih izvoda po banci
app.get("/banke-izvodi", async (req, res) => {
  const bankParam = (req.query.bank || "lovb").toString().toLowerCase();
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();

  const banka = bankeVrste.find((b) => b.code === bankParam);
  if (!banka) {
    return res.json({ success: false, error: "Nepoznata banka" });
  }

  try {
    const pool = await sql.connect(dbConfig);

    // Učitaj sve vrste naloga pa upari po oznaci
    const vrsteNaloga = await pool
      .request()
      .query(
        "SELECT Id, UPPER(Oznaka) AS Oznaka FROM [CRM_SumSumarum].[dbo].[VrstaNaloga]",
      );

    const vrstaId = banka.id
      ? banka.id
      : vrsteNaloga.recordset.find(
          (v) => v.Oznaka && v.Oznaka.toUpperCase() === banka.oznaka,
        )?.Id;

    if (!vrstaId) {
      return res.json({
        success: false,
        error: `Nije pronađena vrsta naloga za banku ${banka.naziv}`,
      });
    }

    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00Z`);

    const query = `
      SELECT n.IdApp, a.ApUser, n.Rbr, n.Datum
      FROM [CRM_SumSumarum].[dbo].[Nalog] n
      LEFT JOIN [CRM_SumSumarum].[dbo].[Apps] a ON n.IdApp = a.Id
      WHERE n.IdVrstaNaloga = @vrstaId
        AND n.Rbr IS NOT NULL
        AND n.Datum >= @startDate
        AND n.Datum < @endDate
      ORDER BY n.IdApp, n.Rbr;
    `;

    const result = await pool
      .request()
      .input("vrstaId", sql.Int, vrstaId)
      .input("startDate", sql.Date, startDate)
      .input("endDate", sql.Date, endDate)
      .query(query);

    const groups = new Map();

    for (const row of result.recordset) {
      const key = row.IdApp;
      if (!groups.has(key)) {
        groups.set(key, {
          apUser: row.ApUser || "(bez ApUser)",
          numbers: [],
          dates: [],
        });
      }
      const num = Number(row.Rbr);
      if (!Number.isNaN(num)) {
        groups.get(key).numbers.push(num);
        groups.get(key).dates.push({ rbr: num, datum: row.Datum });
      }
    }

    const report = [];
    let globalMax = 0;

    for (const [idApp, info] of groups.entries()) {
      const nums = Array.from(new Set(info.numbers)).sort((a, b) => a - b);
      const numSet = new Set(nums);
      const maxRbr = nums.length ? nums[nums.length - 1] : 0;
      if (maxRbr > globalMax) globalMax = maxRbr;

      const missing = [];
      for (let i = 1; i <= maxRbr; i++) {
        if (!numSet.has(i)) missing.push(i);
      }

      // Pronađi datum za zadnji izvod
      const maxDate = info.dates.find((d) => d.rbr === maxRbr)?.datum || null;

      report.push({ idApp, apUser: info.apUser, maxRbr, maxDate, missing });
    }

    const withGaps = report.filter((r) => r.missing.length > 0).length;
    const withoutGaps = report.length - withGaps;

    res.json({
      success: true,
      banka: banka.code,
      bankaNaziv: banka.naziv,
      year,
      globalMax,
      withGaps,
      withoutGaps,
      data: report,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Endpoint za učitavanje kontakata iz JSON
app.get("/kontakti", async (req, res) => {
  try {
    const jsonPath = path.join(__dirname, "kontakti.json");
    const jsonData = fs.readFileSync(jsonPath, "utf-8");
    const kontakti = JSON.parse(jsonData);

    res.json({ success: true, data: kontakti });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
// Endpoint za dobijanje mapiranja dobavljača
app.get("/vendor-mapping", async (req, res) => {
  try {
    const mappingPath = path.join(__dirname, "vendor-mapping.json");
    const mappingData = fs.readFileSync(mappingPath, "utf-8");
    const mapping = JSON.parse(mappingData);

    res.json({ success: true, data: mapping });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Endpoint za dobijanje svih jedinstvenih dobavljača
app.get("/svi-dobavljaci", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT DISTINCT Dobavljac
      FROM [CRM_SumSumarum].[dbo].[SaldoDobavljaca]
      WHERE Dobavljac IS NOT NULL AND Dobavljac != ''
      ORDER BY Dobavljac
    `);
    res.json({ success: true, data: result.recordset.map((r) => r.Dobavljac) });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Funkcija za firme sa saldom na kontu 2449
async function firme_sa_2449() {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT 
        a.ApUser AS Firma,
        k.Oznaka AS Konto,
        k.Naziv AS NazivKonta,
        SUM(ns.Duguje) AS PrometDuguje,
        SUM(ns.Potrazuje) AS PrometPotrazuje,
        SUM(ns.Duguje) - SUM(ns.Potrazuje) AS Saldo
      FROM [CRM_SumSumarum].[dbo].[NalogStavke] ns
      INNER JOIN [CRM_SumSumarum].[dbo].[Nalog] n ON ns.IdNalog = n.Id
      INNER JOIN [CRM_SumSumarum].[dbo].[Apps] a ON n.IdApp = a.Id
      LEFT JOIN [CRM_SumSumarum].[dbo].[Konto] k ON ns.IdKonto = k.Id
      WHERE a.Godina = 2026 AND (k.Oznaka = '2449' OR ns.OznakaKonta = '2449')
      GROUP BY a.ApUser, k.Oznaka, k.Naziv, ns.OznakaKonta
      HAVING SUM(ns.Duguje) - SUM(ns.Potrazuje) <> 0
      ORDER BY a.ApUser;
    `);
    return result.recordset;
  } catch (err) {
    throw err;
  }
}

app.get("/firme_2449", async (req, res) => {
  try {
    const data = await firme_sa_2449();
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/plate/firme", async (req, res) => {
  try {
    const pool = await getPlatePool();
    const result = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .query(`
        SELECT Id, Naziv, PuniNaziv, PIB, Grad, Email
        FROM dbo.Firma
        WHERE IdApp = @idApp
        ORDER BY Naziv;
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/plate/pregled", async (req, res) => {
  const idFirma = parseInt(req.query.idFirma, 10);

  if (!idFirma) {
    return res.json({ success: false, error: "Nedostaje firma." });
  }

  try {
    const pool = await getPlatePool();
    const request = pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("idFirma", sql.Int, idFirma);

    const firmaResult = await request.query(`
      SELECT Id, Naziv, PuniNaziv, PIB, Grad, Adresa, Email, ZiroRacun
      FROM dbo.Firma
      WHERE Id = @idFirma AND IdApp = @idApp;
    `);

    if (!firmaResult.recordset.length) {
      return res.json({ success: false, error: "Firma nije pronadjena." });
    }

    const countsResult = await pool
      .request()
      .input("idFirma", sql.Int, idFirma)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.Radnik WHERE IdFirma = @idFirma) AS Radnici,
          (SELECT COUNT(*) FROM dbo.Radnik WHERE IdFirma = @idFirma AND Aktivan = 1) AS Aktivni,
          (SELECT COUNT(*) FROM dbo.Radnik WHERE IdFirma = @idFirma AND Zaposlen = 1) AS Zaposleni,
          (SELECT COUNT(*) FROM dbo.Obracun WHERE IdFirma = @idFirma) AS Obracuni;
      `);

    const monthsResult = await pool
      .request()
      .input("idFirma", sql.Int, idFirma)
      .query(`
        SELECT
          o.GodObr,
          o.MjesObr,
          COUNT(DISTINCT o.Id) AS BrojObracuna,
          COUNT(DISTINCT ou.IdRadnik) AS BrojRadnika,
          SUM(ou.Neto) AS Neto,
          SUM(ou.Bruto) AS Bruto,
          SUM(ou.ObracunatiBruto) AS ObracunatiBruto,
          SUM(ou.Porez) AS Porez,
          SUM(ou.Prirez) AS Prirez,
          SUM(ou.DZPio + ou.DZZdravstvo + ou.DZNezaposleni) AS DoprinosiZaposleni,
          SUM(
            ou.DPPio + ou.DPZdravstvo + ou.DPNezaposleni +
            ou.DPFondRada + ou.DPSindikat + ou.DPPrivKomora
          ) AS DoprinosiPoslodavac
        FROM dbo.Obracun o
        LEFT JOIN dbo.Obracun_Uslovi ou ON ou.IdObracun = o.Id
        WHERE o.IdFirma = @idFirma
        GROUP BY o.GodObr, o.MjesObr
        ORDER BY o.GodObr DESC, o.MjesObr DESC;
      `);

    res.json({
      success: true,
      firma: firmaResult.recordset[0],
      counts: countsResult.recordset[0],
      months: monthsResult.recordset,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/plate/detalji", async (req, res) => {
  const idFirma = parseInt(req.query.idFirma, 10);
  const godina = parseInt(req.query.godina, 10);
  const mjesec = parseInt(req.query.mjesec, 10);

  if (!idFirma || !godina || !mjesec) {
    return res.json({ success: false, error: "Nedostaju parametri." });
  }

  try {
    const pool = await getPlatePool();
    const result = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("idFirma", sql.Int, idFirma)
      .input("godina", sql.Int, godina)
      .input("mjesec", sql.Int, mjesec)
      .query(`
        SELECT
          r.Id AS IdRadnik,
          r.Prezime,
          r.Ime,
          r.MaticniBroj,
          r.Aktivan,
          r.Zaposlen,
          r.BrojTekucegRacuna,
          o.Id AS IdObracun,
          o.OznakaObr,
          o.DatumObracuna,
          SUM(ou.Neto) AS Neto,
          SUM(ou.Bruto) AS Bruto,
          SUM(ou.ObracunatiBruto) AS ObracunatiBruto,
          SUM(ou.Porez) AS Porez,
          SUM(ou.Prirez) AS Prirez,
          SUM(ou.DZPio + ou.DZZdravstvo + ou.DZNezaposleni) AS DoprinosiZaposleni,
          SUM(
            ou.DPPio + ou.DPZdravstvo + ou.DPNezaposleni +
            ou.DPFondRada + ou.DPSindikat + ou.DPPrivKomora
          ) AS DoprinosiPoslodavac
        FROM dbo.Firma f
        INNER JOIN dbo.Obracun o ON o.IdFirma = f.Id
        INNER JOIN dbo.Obracun_Uslovi ou ON ou.IdObracun = o.Id
        INNER JOIN dbo.Radnik r ON r.Id = ou.IdRadnik
        WHERE f.Id = @idFirma
          AND f.IdApp = @idApp
          AND o.GodObr = @godina
          AND o.MjesObr = @mjesec
        GROUP BY
          r.Id, r.Prezime, r.Ime, r.MaticniBroj, r.Aktivan, r.Zaposlen,
          r.BrojTekucegRacuna, o.Id, o.OznakaObr, o.DatumObracuna
        ORDER BY r.Prezime, r.Ime, o.DatumObracuna;
      `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/plate/firme-bez-obracuna", async (req, res) => {
  const godina = parseInt(req.query.godina, 10);
  const mjesec = parseInt(req.query.mjesec, 10);

  if (!godina || !mjesec || mjesec < 1 || mjesec > 12) {
    return res.json({ success: false, error: "Unesi ispravnu godinu i mjesec." });
  }

  try {
    const pool = await getPlatePool();
    const result = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("godina", sql.Int, godina)
      .input("mjesec", sql.Int, mjesec)
      .query(`
        SELECT
          f.Id,
          f.Naziv,
          f.PIB,
          f.Grad,
          COUNT(r.Id) AS Radnici,
          SUM(CASE WHEN r.Aktivan = 1 THEN 1 ELSE 0 END) AS AktivniRadnici
        FROM dbo.Firma f
        LEFT JOIN dbo.Radnik r ON r.IdFirma = f.Id
        WHERE f.IdApp = @idApp
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.Obracun o
            WHERE o.IdFirma = f.Id
              AND o.GodObr = @godina
              AND o.MjesObr = @mjesec
          )
        GROUP BY f.Id, f.Naziv, f.PIB, f.Grad
        ORDER BY f.Naziv;
      `);

    const totalResult = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("godina", sql.Int, godina)
      .input("mjesec", sql.Int, mjesec)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.Firma WHERE IdApp = @idApp) AS UkupnoFirmi,
          COUNT(DISTINCT o.IdFirma) AS ImaObracun
        FROM dbo.Firma f
        LEFT JOIN dbo.Obracun o
          ON o.IdFirma = f.Id
          AND o.GodObr = @godina
          AND o.MjesObr = @mjesec
        WHERE f.IdApp = @idApp;
      `);

    res.json({
      success: true,
      godina,
      mjesec,
      summary: {
        ukupnoFirmi: totalResult.recordset[0].UkupnoFirmi || 0,
        imaObracun: totalResult.recordset[0].ImaObracun || 0,
        nemaObracun: result.recordset.length,
      },
      data: result.recordset,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/plate/firme-sa-obracunom", async (req, res) => {
  const godina = parseInt(req.query.godina, 10);
  const mjesec = parseInt(req.query.mjesec, 10);

  if (!godina || !mjesec || mjesec < 1 || mjesec > 12) {
    return res.json({ success: false, error: "Unesi ispravnu godinu i mjesec." });
  }

  try {
    const pool = await getPlatePool();
    const result = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("godina", sql.Int, godina)
      .input("mjesec", sql.Int, mjesec)
      .query(`
        SELECT
          f.Id,
          f.Naziv,
          f.PIB,
          f.Grad,
          COUNT(DISTINCT o.Id) AS BrojObracuna,
          COUNT(DISTINCT ou.IdRadnik) AS BrojRadnika,
          COUNT(ou.Id) AS BrojStavki,
          SUM(ou.Bruto) AS Bruto,
          SUM(ou.Neto) AS Neto
        FROM dbo.Firma f
        INNER JOIN dbo.Obracun o
          ON o.IdFirma = f.Id
          AND o.GodObr = @godina
          AND o.MjesObr = @mjesec
        LEFT JOIN dbo.Obracun_Uslovi ou ON ou.IdObracun = o.Id
        WHERE f.IdApp = @idApp
        GROUP BY f.Id, f.Naziv, f.PIB, f.Grad
        ORDER BY f.Naziv;
      `);

    const totalResult = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("godina", sql.Int, godina)
      .input("mjesec", sql.Int, mjesec)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.Firma WHERE IdApp = @idApp) AS UkupnoFirmi,
          COUNT(DISTINCT o.IdFirma) AS ImaObracun
        FROM dbo.Firma f
        LEFT JOIN dbo.Obracun o
          ON o.IdFirma = f.Id
          AND o.GodObr = @godina
          AND o.MjesObr = @mjesec
        WHERE f.IdApp = @idApp;
      `);

    res.json({
      success: true,
      godina,
      mjesec,
      summary: {
        ukupnoFirmi: totalResult.recordset[0].UkupnoFirmi || 0,
        imaObracun: totalResult.recordset[0].ImaObracun || 0,
        nemaObracun:
          (totalResult.recordset[0].UkupnoFirmi || 0) -
          (totalResult.recordset[0].ImaObracun || 0),
      },
      data: result.recordset,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/plate/ioppd", async (req, res) => {
  const idFirma = parseInt(req.query.idFirma, 10);
  const godina = parseInt(req.query.godina, 10);
  const mjesec = parseInt(req.query.mjesec, 10);

  if (!idFirma || !godina || !mjesec || mjesec < 1 || mjesec > 12) {
    return res.status(400).send("Nedostaju parametri.");
  }

  try {
    const pool = await getPlatePool();
    const firmaResult = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("idFirma", sql.Int, idFirma)
      .query(`
        SELECT Id, Naziv, PIB
        FROM dbo.Firma
        WHERE Id = @idFirma AND IdApp = @idApp;
      `);

    if (!firmaResult.recordset.length) {
      return res.status(404).send("Firma nije pronadjena.");
    }

    const rowsResult = await pool
      .request()
      .input("idFirma", sql.Int, idFirma)
      .input("godina", sql.Int, godina)
      .input("mjesec", sql.Int, mjesec)
      .query(`
        SELECT
          r.MaticniBroj,
          r.Prezime,
          r.Ime,
          ou.DatumOd,
          ou.DatumDo,
          ou.Bruto,
          ou.OporeziviBruto,
          ou.Porez,
          ou.DZPio,
          ou.DZZdravstvo,
          ou.DZNezaposleni,
          ou.DPPio,
          ou.DPZdravstvo,
          ou.DPNezaposleni,
          ou.DPFondRada,
          sp.IdSifarnikPID,
          sp.Naziv AS Osnov
        FROM dbo.Obracun o
        INNER JOIN dbo.Obracun_Uslovi ou ON ou.IdObracun = o.Id
        INNER JOIN dbo.Radnik r ON r.Id = ou.IdRadnik
        LEFT JOIN dbo.SifarnikPrimanja sp ON sp.Id = ou.IdSfarnikPrimanja
        WHERE o.IdFirma = @idFirma
          AND o.GodObr = @godina
          AND o.MjesObr = @mjesec
          AND (sp.PrikaziNaIOPPD = 1 OR sp.PrikaziNaIOPPD IS NULL)
        ORDER BY r.Prezime, r.Ime, ou.Rbr;
      `);

    const rows = rowsResult.recordset;
    if (!rows.length) {
      return res.status(404).send("Nema podataka za IOPPD.");
    }

    const lastDay = new Date(godina, mjesec, 0).getDate();
    const periodOd = formatIoppdDate(godina, mjesec, 1);
    const periodDo = formatIoppdDate(godina, mjesec, lastDay);
    const porezPeriod = formatIoppdDate(godina, mjesec, lastDay);
    const distinctPeople = new Set(
      rows
        .filter((row) => Number(row.IdSifarnikPID || 1) === 1)
        .map((row) => row.MaticniBroj),
    ).size;
    const ioppdRows = [];

    for (const row of rows) {
      if (Number(row.IdSifarnikPID) === 65) {
        ioppdRows.push({
          row,
          osnovId: 65,
          osnov: row.Osnov || "Zarada",
          periodOd: porezPeriod,
          periodDo: porezPeriod,
          bruto: row.OporeziviBruto,
          porez: row.Porez,
          dzPio: 0,
          dzZdravstvo: 0,
          dzNezaposleni: 0,
          dpPio: 0,
          dpZdravstvo: 0,
          dpNezaposleni: 0,
          dpFondRada: 0,
        });
        continue;
      }

      ioppdRows.push({
        row,
        osnovId: row.IdSifarnikPID || 1,
        osnov: row.Osnov || "Zarada",
        periodOd,
        periodDo,
        bruto: row.Bruto,
        porez: 0,
        dzPio: row.DZPio,
        dzZdravstvo: row.DZZdravstvo,
        dzNezaposleni: row.DZNezaposleni,
        dpPio: row.DPPio,
        dpZdravstvo: row.DPZdravstvo,
        dpNezaposleni: row.DPNezaposleni,
        dpFondRada: row.DPFondRada,
      });

      if (Number(row.Porez || 0) > 0) {
        ioppdRows.push({
          row,
          osnovId: 97,
          osnov: row.Osnov || "Zarada",
          periodOd: porezPeriod,
          periodDo: porezPeriod,
          bruto: row.Bruto,
          porez: row.Porez,
          dzPio: 0,
          dzZdravstvo: 0,
          dzNezaposleni: 0,
          dpPio: 0,
          dpZdravstvo: 0,
          dpNezaposleni: 0,
          dpFondRada: 0,
        });
      }
    }

    const total = ioppdRows.reduce(
      (acc, item) => {
        acc.bruto += Number(item.bruto || 0);
        acc.porez += Number(item.porez || 0);
        acc.dzPio += Number(item.dzPio || 0);
        acc.dzZdravstvo += Number(item.dzZdravstvo || 0);
        acc.dzNezaposleni += Number(item.dzNezaposleni || 0);
        acc.dpPio += Number(item.dpPio || 0);
        acc.dpZdravstvo += Number(item.dpZdravstvo || 0);
        acc.dpNezaposleni += Number(item.dpNezaposleni || 0);
        acc.dpFondRada += Number(item.dpFondRada || 0);
        return acc;
      },
      {
        bruto: 0,
        porez: 0,
        dzPio: 0,
        dzZdravstvo: 0,
        dzNezaposleni: 0,
        dpPio: 0,
        dpZdravstvo: 0,
        dpNezaposleni: 0,
        dpFondRada: 0,
      },
    );

    const unosXml = ioppdRows
      .map((item, index) => {
        const row = item.row;
        const punoIme = `${row.Prezime || ""} ${row.Ime || ""}`.trim();
        return `    <Unos>
      <Unos-PIB>${xmlEscape(row.MaticniBroj)}</Unos-PIB>
      <Unos-PrezimeIIme>${xmlEscape(punoIme)}</Unos-PrezimeIIme>
      <Unos-OsnovID>${xmlEscape(item.osnovId)}</Unos-OsnovID>
      <Index>${index + 1}</Index>
      <Unos-Osnov>${xmlEscape(item.osnov)}</Unos-Osnov>
      <Unos-PeriodOd>${item.periodOd}</Unos-PeriodOd>
      <Unos-PeriodDo>${item.periodDo}</Unos-PeriodDo>
      <Unos-BrutoOsnov>${formatXmlNumber(item.bruto)}</Unos-BrutoOsnov>
      <Unos-TeretOsiguranikaPorez>${formatXmlNumber(item.porez)}</Unos-TeretOsiguranikaPorez>
      <Unos-TeretOsiguranikaPIO>${formatXmlNumber(item.dzPio)}</Unos-TeretOsiguranikaPIO>
      <Unos-TeretOsiguranikaRFZO>${formatXmlNumber(item.dzZdravstvo)}</Unos-TeretOsiguranikaRFZO>
      <Unos-TeretOsiguranikaZZZ>${formatXmlNumber(item.dzNezaposleni)}</Unos-TeretOsiguranikaZZZ>
      <Unos-TeretIsplatiocaPIO>${formatXmlNumber(item.dpPio)}</Unos-TeretIsplatiocaPIO>
      <Unos-TeretIsplatiocaRFZO>${formatXmlNumber(item.dpZdravstvo)}</Unos-TeretIsplatiocaRFZO>
      <Unos-TeretIsplatiocaZZZ>${formatXmlNumber(item.dpNezaposleni)}</Unos-TeretIsplatiocaZZZ>
      <Unos-TeretIsplatiocaFondRada>${formatXmlNumber(item.dpFondRada)}</Unos-TeretIsplatiocaFondRada>
    </Unos>`;
      })
      .join("\n");

    const xml = `<?xml version="1.0"?>
<Izvjestaj xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns="urn:IOPD_V1_0.xsd">
  <Ukupno>
    <Ukupno-BrojLica>${distinctPeople}</Ukupno-BrojLica>
    <Ukupno-BrutoIznos>${formatXmlNumber(total.bruto)}</Ukupno-BrutoIznos>
    <TeretOsiguraonika>
      <TeretOsiguraonika-Porez>${formatXmlNumber(total.porez)}</TeretOsiguraonika-Porez>
      <TeretOsiguraonika-PIO>${formatXmlNumber(total.dzPio)}</TeretOsiguraonika-PIO>
      <TeretOsiguraonika-RFZO>${formatXmlNumber(total.dzZdravstvo)}</TeretOsiguraonika-RFZO>
      <TeretOsiguraonika-ZZZ>${formatXmlNumber(total.dzNezaposleni)}</TeretOsiguraonika-ZZZ>
    </TeretOsiguraonika>
    <TeretIsplatioca>
      <TeretIsplatioca-PIO>${formatXmlNumber(total.dpPio)}</TeretIsplatioca-PIO>
      <TeretIsplatioca-RFZO>${formatXmlNumber(total.dpZdravstvo)}</TeretIsplatioca-RFZO>
      <TeretIsplatioca-ZZZ>${formatXmlNumber(total.dpNezaposleni)}</TeretIsplatioca-ZZZ>
      <TeretIsplatioca-FondRada>${formatXmlNumber(total.dpFondRada)}</TeretIsplatioca-FondRada>
    </TeretIsplatioca>
  </Ukupno>
  <PojedinacniObracun>
${unosXml}
  </PojedinacniObracun>
  <DoprinosZbogNezaposljavanjaInvalida>
    <UkupanBrojZaposlenih>${distinctPeople}</UkupanBrojZaposlenih>
    <BrojZaposlenihInvalida>0</BrojZaposlenihInvalida>
    <Osnovica>0.00</Osnovica>
    <Stopa>0.00</Stopa>
    <Iznos>0.00</Iznos>
  </DoprinosZbogNezaposljavanjaInvalida>
</Izvjestaj>
`;

    const firma = firmaResult.recordset[0];
    const fileName = sanitizeFileName(
      `IOPPD_${String(godina).slice(-2)}_${mjesec}_${firma.Naziv}.xml`,
    );
    const fallbackFileName = asciiFileName(fileName);

    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fallbackFileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.send(xml);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

async function provjeriKopiranjeObracuna({
  idsFirmi,
  sourceYear,
  sourceMonth,
  targetYear,
  targetMonth,
}) {
  const pool = await getPlatePool();
  const results = [];

  for (const idFirma of idsFirmi) {
    const firmaResult = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("idFirma", sql.Int, idFirma)
      .query(`
        SELECT Id, Naziv, PIB
        FROM dbo.Firma
        WHERE Id = @idFirma AND IdApp = @idApp;
      `);

    if (!firmaResult.recordset.length) {
      results.push({
        idFirma,
        naziv: "",
        status: "error",
        message: "Firma nije pronadjena za IdApp 29.",
      });
      continue;
    }

    const firma = firmaResult.recordset[0];
    const sourceResult = await pool
      .request()
      .input("idFirma", sql.Int, idFirma)
      .input("sourceYear", sql.Int, sourceYear)
      .input("sourceMonth", sql.Int, sourceMonth)
      .query(`
        SELECT Id, BrojObr, OznakaObr, DatumObracuna
        FROM dbo.Obracun
        WHERE IdFirma = @idFirma
          AND GodObr = @sourceYear
          AND MjesObr = @sourceMonth
        ORDER BY BrojObr;
      `);

    const targetResult = await pool
      .request()
      .input("idFirma", sql.Int, idFirma)
      .input("targetYear", sql.Int, targetYear)
      .input("targetMonth", sql.Int, targetMonth)
      .query(`
        SELECT Id, BrojObr, OznakaObr, DatumObracuna
        FROM dbo.Obracun
        WHERE IdFirma = @idFirma
          AND GodObr = @targetYear
          AND MjesObr = @targetMonth
        ORDER BY BrojObr;
      `);

    const sourceIds = sourceResult.recordset.map((row) => row.Id);
    let sourceWorkers = 0;
    let sourceRows = 0;

    if (sourceIds.length) {
      const statsResult = await pool
        .request()
        .input("idFirma", sql.Int, idFirma)
        .input("sourceYear", sql.Int, sourceYear)
        .input("sourceMonth", sql.Int, sourceMonth)
        .query(`
          SELECT
            COUNT(DISTINCT ou.IdRadnik) AS BrojRadnika,
            COUNT(ou.Id) AS BrojStavki
          FROM dbo.Obracun o
          LEFT JOIN dbo.Obracun_Uslovi ou ON ou.IdObracun = o.Id
          WHERE o.IdFirma = @idFirma
            AND o.GodObr = @sourceYear
            AND o.MjesObr = @sourceMonth;
        `);

      sourceWorkers = statsResult.recordset[0].BrojRadnika || 0;
      sourceRows = statsResult.recordset[0].BrojStavki || 0;
    }

    let status = "ready";
    let message = "Spremno za kopiranje.";

    if (!sourceResult.recordset.length) {
      status = "error";
      message = "Nema obracuna u mjesecu uzoru.";
    } else if (targetResult.recordset.length) {
      status = "skip";
      message = "Novi mjesec vec ima obracun.";
    }

    results.push({
      idFirma: firma.Id,
      naziv: firma.Naziv,
      pib: firma.PIB,
      sourceCount: sourceResult.recordset.length,
      targetCount: targetResult.recordset.length,
      sourceWorkers,
      sourceRows,
      sourceObracuni: sourceResult.recordset,
      targetObracuni: targetResult.recordset,
      status,
      message,
    });
  }

  return results;
}

app.post("/plate/kopiranje/provjeri", express.json(), async (req, res) => {
  const idsFirmi = Array.isArray(req.body.idsFirmi)
    ? req.body.idsFirmi.map((id) => parseInt(id, 10)).filter(Boolean)
    : [];
  const sourceYear = parseInt(req.body.sourceYear, 10);
  const sourceMonth = parseInt(req.body.sourceMonth, 10);
  const targetYear = parseInt(req.body.targetYear, 10);
  const targetMonth = parseInt(req.body.targetMonth, 10);

  if (!idsFirmi.length || !sourceYear || !sourceMonth || !targetYear || !targetMonth) {
    return res.json({ success: false, error: "Nedostaju parametri." });
  }

  try {
    const data = await provjeriKopiranjeObracuna({
      idsFirmi,
      sourceYear,
      sourceMonth,
      targetYear,
      targetMonth,
    });

    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post("/plate/kopiranje/napravi", express.json(), async (req, res) => {
  const idsFirmi = Array.isArray(req.body.idsFirmi)
    ? req.body.idsFirmi.map((id) => parseInt(id, 10)).filter(Boolean)
    : [];
  const sourceYear = parseInt(req.body.sourceYear, 10);
  const sourceMonth = parseInt(req.body.sourceMonth, 10);
  const targetYear = parseInt(req.body.targetYear, 10);
  const targetMonth = parseInt(req.body.targetMonth, 10);

  if (!idsFirmi.length || !sourceYear || !sourceMonth || !targetYear || !targetMonth) {
    return res.json({ success: false, error: "Nedostaju parametri." });
  }

  const targetLastDay = new Date(targetYear, targetMonth, 0).getDate();
  const results = [];

  try {
    const pool = await getPlatePool();
    const check = await provjeriKopiranjeObracuna({
      idsFirmi,
      sourceYear,
      sourceMonth,
      targetYear,
      targetMonth,
    });

    for (const item of check) {
      if (item.status !== "ready") {
        results.push({
          ...item,
          copied: false,
        });
        continue;
      }

      const transaction = new sql.Transaction(pool);

      try {
        await transaction.begin();

        const sourceObracuni = item.sourceObracuni;
        const copiedIds = [];

        for (const sourceObracun of sourceObracuni) {
          const request = new sql.Request(transaction);
          request
            .input("sourceId", sql.UniqueIdentifier, sourceObracun.Id)
            .input("idFirma", sql.Int, item.idFirma)
            .input("targetYear", sql.Int, targetYear)
            .input("targetMonth", sql.Int, targetMonth)
            .input("targetLastDay", sql.Int, targetLastDay)
            .input("sourceMonth", sql.Int, sourceMonth);

          const result = await request.query(`
            DECLARE @newObracunId uniqueidentifier = NEWID();

            INSERT INTO dbo.Obracun (
              Id, IdFirma, IdKatgorijaObracuna, DatumObracuna, DatumValute,
              GodObr, MjesObr, BrojObr, OznakaObr, FondSati, ObrVrKoef, SaMinulimRadom
            )
            SELECT
              @newObracunId,
              IdFirma,
              IdKatgorijaObracuna,
              DATEFROMPARTS(@targetYear, @targetMonth, @targetLastDay),
              DatumValute,
              @targetYear,
              @targetMonth,
              BrojObr + (@targetMonth - @sourceMonth),
              OznakaObr,
              FondSati,
              ObrVrKoef,
              SaMinulimRadom
            FROM dbo.Obracun
            WHERE Id = @sourceId AND IdFirma = @idFirma;

            IF @@ROWCOUNT <> 1
            BEGIN
              THROW 50010, 'Izvorni obracun nije pronadjen.', 1;
            END;

            INSERT INTO dbo.Obracun_Radnici (
              Id, IdObracun, IdRadnik, MinuliRadGodina, EmailSent
            )
            SELECT
              NEWID(), @newObracunId, IdRadnik, MinuliRadGodina, EmailSent
            FROM dbo.Obracun_Radnici
            WHERE IdObracun = @sourceId;

            INSERT INTO dbo.Obracun_Uslovi (
              Id, IdObracun, IdRadnik, Rbr, IdSfarnikPrimanja, IdVrstaObracuna,
              SifraPrimanja, DatumOd, DatumDo, Neto, Bruto, ProcenatOsnoviceSaUmanjenjem,
              FondSati, UkupnoSati, IznosZaObracun, OporeziviBruto, Porez, Prirez,
              DZPio, DZZdravstvo, DZNezaposleni, DPPio, DPZdravstvo, DPNezaposleni,
              DPFondRada, DPSindikat, DPPrivKomora, ObrVrKoeficijenta, DatumKreiranja,
              StopaPrireza, StartniDioZarade, KoefSlozenosti, KoefMinuliRad,
              PrethodniBruto, ObracunatiBruto
            )
            SELECT
              NEWID(),
              @newObracunId,
              IdRadnik,
              Rbr,
              IdSfarnikPrimanja,
              IdVrstaObracuna,
              SifraPrimanja,
              DATEFROMPARTS(@targetYear, @targetMonth, 1),
              DATEFROMPARTS(@targetYear, @targetMonth, @targetLastDay),
              Neto,
              Bruto,
              ProcenatOsnoviceSaUmanjenjem,
              FondSati,
              UkupnoSati,
              IznosZaObracun,
              OporeziviBruto,
              Porez,
              Prirez,
              DZPio,
              DZZdravstvo,
              DZNezaposleni,
              DPPio,
              DPZdravstvo,
              DPNezaposleni,
              DPFondRada,
              DPSindikat,
              DPPrivKomora,
              ObrVrKoeficijenta,
              DatumKreiranja,
              StopaPrireza,
              StartniDioZarade,
              KoefSlozenosti,
              KoefMinuliRad,
              PrethodniBruto,
              ObracunatiBruto
            FROM dbo.Obracun_Uslovi
            WHERE IdObracun = @sourceId;

            INSERT INTO dbo.Obracun_Obustave (
              Id, IdFirma, IdObracun, IdRadnik, Iznos, Opis, ZiroRacun, IdObustava
            )
            SELECT
              NEWID(), IdFirma, @newObracunId, IdRadnik, Iznos, Opis, ZiroRacun, IdObustava
            FROM dbo.Obracun_Obustave
            WHERE IdObracun = @sourceId;

            SELECT @newObracunId AS NewObracunId;
          `);

          copiedIds.push(result.recordset[0].NewObracunId);
        }

        await transaction.commit();

        results.push({
          ...item,
          copied: true,
          newObracunIds: copiedIds,
          message: `Kopirano ${copiedIds.length} obracuna.`,
        });
      } catch (error) {
        try {
          await transaction.rollback();
        } catch (_) {}

        results.push({
          ...item,
          status: "error",
          copied: false,
          message: error.message,
        });
      }
    }

    res.json({ success: true, data: results });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
