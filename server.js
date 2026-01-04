const express = require("express");
const sql = require("mssql");
const cors = require("cors");
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
    const result = await pool.request()
      .input("apUser", sql.NVarChar, apUser)
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
