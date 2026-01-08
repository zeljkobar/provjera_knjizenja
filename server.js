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
                Apps.Id = Nalog.IdApp AND Nalog.IdVrstaNaloga = 200 AND Nalog.Datum >= '2025-01-01'
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
                Apps.Id = Nalog.IdApp AND Nalog.IdVrstaNaloga = 70 AND Nalog.Datum >= '2025-01-01'
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
            SELECT * from [CRM_SumSumarum].[dbo].[Apps] WHERE apps.godina = 2024) AS Apps
        LEFT JOIN 
            [CRM_SumSumarum].[dbo].[Nalog] AS Nalog
                ON 
            Apps.Id = Nalog.IdApp AND Nalog.IdVrstaNaloga = 400 AND Nalog.Datum >= '2024-01-01'
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
      WHERE Godina = 2025 AND IsActive = 1
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
      WHERE Apps.Godina = 2025 AND Apps.ApUser = @apUser
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
      WHERE a.ApUser = @apUser AND a.Godina = 2025
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
    const vrsteNaloga = await pool.request().query(
      "SELECT Id, UPPER(Oznaka) AS Oznaka FROM [CRM_SumSumarum].[dbo].[VrstaNaloga]"
    );

    const vrstaId = banka.id
      ? banka.id
      : vrsteNaloga.recordset.find(
          (v) => v.Oznaka && v.Oznaka.toUpperCase() === banka.oznaka
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
        groups.set(key, { apUser: row.ApUser || "(bez ApUser)", numbers: [], dates: [] });
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
      const maxDate = info.dates.find(d => d.rbr === maxRbr)?.datum || null;

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
