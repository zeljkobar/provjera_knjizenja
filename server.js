const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

const portalDbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: "Portal",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  port: parseInt(process.env.DB_PORT) || 1433,
};

const PLATE_ID_APP = 29;
let platePoolPromise = null;
let portalPoolPromise = null;

function getPlatePool() {
  if (!platePoolPromise) {
    platePoolPromise = new sql.ConnectionPool(plateDbConfig).connect();
  }
  return platePoolPromise;
}

function getPortalPool() {
  if (!portalPoolPromise) {
    portalPoolPromise = new sql.ConnectionPool(portalDbConfig).connect();
  }
  return portalPoolPromise;
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  const cookies = {};

  header
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const index = part.indexOf("=");
      if (index === -1) return;
      cookies[decodeURIComponent(part.slice(0, index))] = decodeURIComponent(
        part.slice(index + 1),
      );
    });

  return cookies;
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function scryptHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, storedHash) {
  const [kind, salt, hash] = String(storedHash || "").split("$");
  if (kind !== "scrypt" || !salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    expected.length === candidate.length &&
    crypto.timingSafeEqual(expected, candidate)
  );
}

function sendRootFile(res, fileName) {
  res.sendFile(path.join(__dirname, fileName));
}

async function getPortalUserFromRequest(req) {
  const token = parseCookies(req).admin_session;
  if (!token) return null;

  const pool = await getPortalPool();
  const result = await pool
    .request()
    .input("tokenHash", sql.NVarChar, hashToken(token))
    .query(`
      SELECT TOP 1 u.Id, u.Username, u.DisplayName, u.Role
      FROM dbo.ClientSessions s
      INNER JOIN dbo.ClientUsers u ON u.Id = s.ClientUserId
      WHERE s.SessionTokenHash = @tokenHash
        AND s.RevokedAt IS NULL
        AND s.ExpiresAt > SYSUTCDATETIME()
        AND u.IsActive = 1;
    `);

  return result.recordset[0] || null;
}

async function getAdminUserFromRequest(req) {
  const user = await getPortalUserFromRequest(req);
  return user && user.Role === "admin" ? user : null;
}

async function requireAdmin(req, res, next) {
  try {
    const user = await getAdminUserFromRequest(req);
    if (!user) {
      const wantsPage =
        req.method === "GET" && (req.path === "/" || req.path.endsWith(".html"));
      if (wantsPage) {
        return res.redirect("/index.html");
      }

      return res.status(401).json({ success: false, error: "Niste prijavljeni." });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function requirePortalUser(req, res, next) {
  try {
    const user = await getPortalUserFromRequest(req);
    if (!user) {
      const wantsPage =
        req.method === "GET" && (req.path === "/" || req.path.endsWith(".html"));
      if (wantsPage) {
        return res.redirect("/index.html");
      }

      return res.status(401).json({ success: false, error: "Niste prijavljeni." });
    }

    req.portalUser = user;
    next();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
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

function formatPdfMoney(value) {
  return Number(value || 0).toLocaleString("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPdfDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("sr-RS");
}

function getPdfFontPath() {
  const candidates = [
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\calibri.ttf",
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function isGuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || "").trim(),
  );
}

function nacinPlacanjaLabel(id) {
  const known = {
    3: "Virman",
  };
  return known[id] || "-";
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
app.get(["/", "/index.html"], async (req, res) => {
  try {
    const user = await getPortalUserFromRequest(req);
    if (user?.Role === "admin") return res.redirect("/admin.html");
    if (user?.Role === "user") return res.redirect("/user.html");
    return sendRootFile(res, "index.html");
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

app.get("/style.css", (req, res) => sendRootFile(res, "style.css"));
app.get("/login.js", (req, res) => sendRootFile(res, "login.js"));

app.post("/auth/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Unesite korisnika i lozinku." });
    }

    const pool = await getPortalPool();
    const result = await pool
      .request()
      .input("username", sql.NVarChar, username)
      .query(`
        SELECT TOP 1 Id, Username, DisplayName, PasswordHash, Role, IsActive
        FROM dbo.ClientUsers
        WHERE Username = @username;
      `);

    const user = result.recordset[0];
    if (
      !user ||
      !user.IsActive ||
      !["admin", "user"].includes(user.Role) ||
      !verifyPassword(password, user.PasswordHash)
    ) {
      return res
        .status(401)
        .json({ success: false, error: "Pogresan korisnik ili lozinka." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await pool
      .request()
      .input("clientUserId", sql.Int, user.Id)
      .input("tokenHash", sql.NVarChar, tokenHash)
      .input("expiresAt", sql.DateTime2, expiresAt)
      .query(`
        INSERT INTO dbo.ClientSessions (ClientUserId, SessionTokenHash, ExpiresAt)
        VALUES (@clientUserId, @tokenHash, @expiresAt);

        UPDATE dbo.ClientUsers
        SET LastLoginAt = SYSUTCDATETIME()
        WHERE Id = @clientUserId;
      `);

    res.cookie("admin_session", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      success: true,
      redirect: user.Role === "admin" ? "/admin.html" : "/user.html",
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/auth/me", requireAdmin, (req, res) => {
  res.json({ success: true, user: req.adminUser });
});

app.get("/portal/me", requirePortalUser, async (req, res) => {
  try {
    const pool = await getPortalPool();
    const result = await pool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1
          FirmaId,
          IdApp,
          ApUser,
          NazivFirme,
          PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id;
      `);

    res.json({
      success: true,
      user: req.portalUser,
      firma: result.recordset[0] || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/salda", requirePortalUser, async (req, res) => {
  try {
    const kontoByTip = {
      kupci: "2020",
      "ino-kupci": "2030",
      dobavljaci: "4330",
      "ino-dobavljaci": "4340",
    };
    const tip = String(req.query.tip || "");
    const konto = kontoByTip[tip];

    if (!konto) {
      return res
        .status(400)
        .json({ success: false, error: "Nepoznat tip salda." });
    }

    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const firma = firmaResult.recordset[0];
    if (!firma) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("apUser", sql.NVarChar, firma.ApUser)
      .input("konto", sql.NVarChar, konto)
      .query(`
        SELECT
          Apps.ApUser AS Firma,
          Apps.Godina,
          Apps.VATnumber AS PIB,
          k.Id AS IdKomitent,
          k.Pib AS KomitentPIB,
          k.Naziv AS Komitent,
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
          WHERE ns.OznakaKonta = @konto
          GROUP BY ns.IdKomitent, n.IdApp
        ) agg ON k.Id = agg.IdKomitent
        INNER JOIN [CRM_SumSumarum].[dbo].[Apps] Apps ON agg.IdApp = Apps.Id
        WHERE Apps.Godina = 2026 AND Apps.ApUser = @apUser
        ORDER BY ABS(agg.Saldo) DESC, k.Naziv;
      `);

    let zadnjiRacun = null;
    if (tip === "kupci" || tip === "ino-kupci") {
      const zadnjiRacunResult = await pool
        .request()
        .input("apUser", sql.NVarChar, firma.ApUser)
        .query(`
          SELECT TOP 1
            COALESCE(ns.Datum, n.DatumFakture, n.Datum) AS DatumRacuna,
            COALESCE(ns.Referenca, n.Referenca, n.BrojDok) AS OpisRacuna,
            CASE
              WHEN ISNUMERIC(LEFT(
                COALESCE(ns.Referenca, n.Referenca, n.BrojDok, ''),
                CHARINDEX('/', COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') + '/') - 1
              )) = 1
              THEN CONVERT(int, LEFT(
                COALESCE(ns.Referenca, n.Referenca, n.BrojDok, ''),
                CHARINDEX('/', COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') + '/') - 1
              ))
              ELSE NULL
            END AS BrojRacuna,
            k.Naziv AS Komitent,
            ns.Duguje AS Iznos
          FROM [CRM_SumSumarum].[dbo].[NalogStavke] ns
          INNER JOIN [CRM_SumSumarum].[dbo].[Nalog] n ON ns.IdNalog = n.Id
          INNER JOIN [CRM_SumSumarum].[dbo].[Apps] Apps ON n.IdApp = Apps.Id
          LEFT JOIN [CRM_SumSumarum].[dbo].[Komitent] k ON ns.IdKomitent = k.Id
          WHERE Apps.Godina = 2026
            AND Apps.ApUser = @apUser
            AND ns.OznakaKonta IN ('2020', '2030')
            AND ns.Duguje > 0
            AND COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') LIKE '%/%'
          ORDER BY
            COALESCE(ns.Datum, n.DatumFakture, n.Datum) DESC,
            CASE
              WHEN ISNUMERIC(LEFT(
                COALESCE(ns.Referenca, n.Referenca, n.BrojDok, ''),
                CHARINDEX('/', COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') + '/') - 1
              )) = 1
              THEN CONVERT(int, LEFT(
                COALESCE(ns.Referenca, n.Referenca, n.BrojDok, ''),
                CHARINDEX('/', COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') + '/') - 1
              ))
              ELSE 0
            END DESC,
            COALESCE(ns.Referenca, n.Referenca, n.BrojDok) DESC;
        `);
      zadnjiRacun = zadnjiRacunResult.recordset[0] || null;
    }

    res.json({
      success: true,
      tip,
      konto,
      firma,
      zadnjiRacun,
      data: result.recordset,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/kartica", requirePortalUser, async (req, res) => {
  try {
    const kontoByTip = {
      kupci: "2020",
      "ino-kupci": "2030",
      dobavljaci: "4330",
      "ino-dobavljaci": "4340",
    };
    const tip = String(req.query.tip || "");
    const konto = kontoByTip[tip];
    const komitentId = String(req.query.komitentId || "").trim();

    if (!konto || !komitentId) {
      return res
        .status(400)
        .json({ success: false, error: "Nedostaju parametri kartice." });
    }

    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const firma = firmaResult.recordset[0];
    if (!firma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("apUser", sql.NVarChar, firma.ApUser)
      .input("komitentId", sql.UniqueIdentifier, komitentId)
      .input("konto", sql.NVarChar, konto)
      .query(`
        WITH Kartica AS (
          SELECT
            vn.Naziv AS VrstaNaloga,
            vn.Oznaka,
            n.Rbr,
            n.BrojDok,
            n.Referenca AS OznakaNaloga,
            COALESCE(ns.Datum, n.DatumFakture, n.Datum) AS Datum,
            ns.OznakaKonta AS Konto,
            knt.Naziv AS NazivKonta,
            COALESCE(ns.Opis, n.Opis) AS Opis,
            ns.Duguje,
            ns.Potrazuje,
            ns.Referenca AS DodatniOpis,
            COALESCE(n.DatumValute, ns.Datum, n.DatumFakture, n.Datum) AS DatumValute,
            ns.Rbr AS RbrStavke
          FROM [CRM_SumSumarum].[dbo].[NalogStavke] ns
          INNER JOIN [CRM_SumSumarum].[dbo].[Nalog] n ON ns.IdNalog = n.Id
          INNER JOIN [CRM_SumSumarum].[dbo].[Apps] a ON n.IdApp = a.Id
          LEFT JOIN [CRM_SumSumarum].[dbo].[VrstaNaloga] vn ON n.IdVrstaNaloga = vn.Id
          LEFT JOIN [CRM_SumSumarum].[dbo].[Konto] knt ON ns.IdKonto = knt.Id
          WHERE a.Godina = 2026
            AND a.ApUser = @apUser
            AND ns.IdKomitent = @komitentId
            AND ns.OznakaKonta = @konto
        )
        SELECT
          VrstaNaloga,
          Oznaka,
          Rbr,
          BrojDok,
          OznakaNaloga,
          Datum,
          Konto,
          NazivKonta,
          Opis,
          Duguje,
          Potrazuje,
          SUM(Duguje - Potrazuje) OVER (
            ORDER BY Datum, Rbr, RbrStavke
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS Saldo,
          DodatniOpis,
          DatumValute
        FROM Kartica
        ORDER BY Datum, Rbr, RbrStavke;

        SELECT TOP 1 Id, Naziv, Pib, Grad
        FROM [CRM_SumSumarum].[dbo].[Komitent]
        WHERE Id = @komitentId;
      `);

    res.json({
      success: true,
      firma,
      konto,
      komitent: result.recordsets[1][0] || null,
      data: result.recordsets[0],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/kartica/pdf", requirePortalUser, async (req, res) => {
  try {
    const kontoByTip = {
      kupci: "2020",
      "ino-kupci": "2030",
      dobavljaci: "4330",
      "ino-dobavljaci": "4340",
    };
    const tip = String(req.query.tip || "");
    const konto = kontoByTip[tip];
    const komitentId = String(req.query.komitentId || "").trim();

    if (!konto || !komitentId) {
      return res
        .status(400)
        .json({ success: false, error: "Nedostaju parametri kartice." });
    }

    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const firma = firmaResult.recordset[0];
    if (!firma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("apUser", sql.NVarChar, firma.ApUser)
      .input("komitentId", sql.UniqueIdentifier, komitentId)
      .input("konto", sql.NVarChar, konto)
      .query(`
        WITH Kartica AS (
          SELECT
            vn.Naziv AS VrstaNaloga,
            vn.Oznaka,
            n.Rbr,
            n.BrojDok,
            n.Referenca AS OznakaNaloga,
            COALESCE(ns.Datum, n.DatumFakture, n.Datum) AS Datum,
            ns.OznakaKonta AS Konto,
            knt.Naziv AS NazivKonta,
            COALESCE(ns.Opis, n.Opis) AS Opis,
            ns.Duguje,
            ns.Potrazuje,
            ns.Referenca AS DodatniOpis,
            COALESCE(n.DatumValute, ns.Datum, n.DatumFakture, n.Datum) AS DatumValute,
            ns.Rbr AS RbrStavke
          FROM [CRM_SumSumarum].[dbo].[NalogStavke] ns
          INNER JOIN [CRM_SumSumarum].[dbo].[Nalog] n ON ns.IdNalog = n.Id
          INNER JOIN [CRM_SumSumarum].[dbo].[Apps] a ON n.IdApp = a.Id
          LEFT JOIN [CRM_SumSumarum].[dbo].[VrstaNaloga] vn ON n.IdVrstaNaloga = vn.Id
          LEFT JOIN [CRM_SumSumarum].[dbo].[Konto] knt ON ns.IdKonto = knt.Id
          WHERE a.Godina = 2026
            AND a.ApUser = @apUser
            AND ns.IdKomitent = @komitentId
            AND ns.OznakaKonta = @konto
        )
        SELECT
          VrstaNaloga,
          Oznaka,
          Rbr,
          BrojDok,
          OznakaNaloga,
          Datum,
          Konto,
          NazivKonta,
          Opis,
          Duguje,
          Potrazuje,
          SUM(Duguje - Potrazuje) OVER (
            ORDER BY Datum, Rbr, RbrStavke
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS Saldo,
          DodatniOpis,
          DatumValute
        FROM Kartica
        ORDER BY Datum, Rbr, RbrStavke;

        SELECT TOP 1 Id, Naziv, Pib, Grad, Adresa
        FROM [CRM_SumSumarum].[dbo].[Komitent]
        WHERE Id = @komitentId;
      `);

    const rows = result.recordsets[0];
    const komitent = result.recordsets[1][0] || {};
    const finalSaldo = Number(rows.at(-1)?.Saldo || 0);
    const ukupnoDuguje = rows.reduce((sum, row) => sum + Number(row.Duguje || 0), 0);
    const ukupnoPotrazuje = rows.reduce(
      (sum, row) => sum + Number(row.Potrazuje || 0),
      0,
    );
    const firmaNaziv = firma.NazivFirme || firma.ApUser || "-";
    const komitentNaziv = komitent.Naziv || "kartica";
    const fileName = `Analiticka kartica - ${asciiFileName(komitentNaziv)}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );

    const doc = new PDFDocument({
      size: "A4",
      margin: 36,
      bufferPages: true,
    });
    doc.pipe(res);

    const fontPath = getPdfFontPath();
    if (fontPath) {
      doc.registerFont("Regular", fontPath);
      doc.registerFont("Bold", fontPath);
      doc.font("Regular");
    }

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const rightX = doc.page.width - doc.page.margins.right;

    function checkPage(height = 18) {
      if (doc.y + height > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    }

    function textRight(text, x, y, width) {
      doc.text(String(text ?? ""), x, y, { width, align: "right" });
    }

    doc.fontSize(11).text(firmaNaziv).text(firmaNaziv);
    doc.moveDown(0.8);
    doc.moveTo(doc.page.margins.left, doc.y)
      .lineTo(rightX, doc.y)
      .stroke();
    doc.moveDown(1.6);

    doc.fontSize(22).text("Analiticka kartica partnera", {
      align: "center",
    });
    doc.fontSize(11).text(`Stanje na dan: ${formatPdfDate(new Date())}`, {
      align: "center",
    });
    doc.moveDown(1.6);

    const metaY = doc.y;
    doc.fontSize(11).text("Poslovni partner:", doc.page.margins.left, metaY);
    doc.font("Bold").text(komitentNaziv, doc.page.margins.left + 115, metaY);
    doc.font("Regular").text("PIB:", doc.page.margins.left + 360, metaY);
    doc.font("Bold").text(komitent.Pib || "-", doc.page.margins.left + 405, metaY);
    doc.font("Regular").text("Adresa:", doc.page.margins.left, metaY + 18);
    doc.font("Bold").text(komitent.Adresa || komitent.Grad || "-", doc.page.margins.left + 115, metaY + 18);
    doc.font("Regular");
    doc.y = metaY + 42;
    doc.moveTo(doc.page.margins.left, doc.y)
      .lineTo(rightX, doc.y)
      .stroke();
    doc.moveDown(0.8);
    doc.text(`Konto: ${konto}    ${rows[0]?.NazivKonta || ""}`);
    doc.moveDown(0.5);

    const columns = [
      { label: "Dat. knj.", width: 50 },
      { label: "Dokument", width: 70 },
      { label: "Br.", width: 25, align: "right" },
      { label: "Br. dokum. / Opis", width: 135 },
      { label: "Datum r.n.", width: 55 },
      { label: "Duguje", width: 62, align: "right" },
      { label: "Potrazuje", width: 62, align: "right" },
      { label: "Saldo", width: 62, align: "right" },
    ];
    const tableX = doc.page.margins.left;

    function drawHeader() {
      let x = tableX;
      const y = doc.y;
      doc.font("Bold").fontSize(8);
      columns.forEach((col) => {
        doc.rect(x, y, col.width, 16).fillAndStroke("#e9e9e9", "#555");
        doc.fillColor("#111").text(col.label, x + 2, y + 4, {
          width: col.width - 4,
          align: col.align || "left",
        });
        x += col.width;
      });
      doc.font("Regular").fillColor("#111");
      doc.y = y + 18;
    }

    drawHeader();
    doc.fontSize(7);

    rows.forEach((row) => {
      checkPage(18);
      if (doc.y < 60) drawHeader();

      const y = doc.y;
      const values = [
        formatPdfDate(row.Datum),
        row.VrstaNaloga || "-",
        row.Rbr || "-",
        row.DodatniOpis || row.OznakaNaloga || row.BrojDok || "-",
        formatPdfDate(row.DatumValute || row.Datum),
        Number(row.Duguje || 0) ? formatPdfMoney(row.Duguje) : "-",
        Number(row.Potrazuje || 0) ? formatPdfMoney(row.Potrazuje) : "-",
        formatPdfMoney(row.Saldo),
      ];
      let x = tableX;
      let rowHeight = 14;
      values.forEach((value, index) => {
        rowHeight = Math.max(
          rowHeight,
          doc.heightOfString(String(value), {
            width: columns[index].width - 4,
          }) + 4,
        );
      });
      values.forEach((value, index) => {
        doc.text(String(value), x + 2, y + 2, {
          width: columns[index].width - 4,
          align: columns[index].align || "left",
        });
        x += columns[index].width;
      });
      doc.y = y + rowHeight;
    });

    checkPage(60);
    doc.moveTo(tableX, doc.y).lineTo(tableX + pageWidth, doc.y).stroke();
    doc.moveDown(0.4);
    doc.font("Bold").fontSize(9);
    textRight(formatPdfMoney(ukupnoDuguje), tableX + 335, doc.y, 62);
    textRight(formatPdfMoney(ukupnoPotrazuje), tableX + 397, doc.y, 62);
    textRight(formatPdfMoney(finalSaldo), tableX + 459, doc.y, 62);
    doc.text(`Ukupno: ${rows.length}`, tableX, doc.y - 10);
    doc.moveDown(2);
    doc.fontSize(16).text(
      `Vasa ukupna obaveza: ${formatPdfMoney(finalSaldo)}`,
      tableX,
      doc.y,
    );

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/banke-info", requirePortalUser, async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();

  try {
    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 IdApp, ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const firma = firmaResult.recordset[0];
    if (!firma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await sql.connect(dbConfig);
    const vrsteNaloga = await pool
      .request()
      .query(
        "SELECT Id, UPPER(Oznaka) AS Oznaka FROM [CRM_SumSumarum].[dbo].[VrstaNaloga]",
      );

    const startDate = new Date(`${year}-01-01T00:00:00Z`);
    const endDate = new Date(`${year + 1}-01-01T00:00:00Z`);
    const data = [];
    const zadnjiRacunResult = await pool
      .request()
      .input("apUser", sql.NVarChar, firma.ApUser)
      .query(`
        SELECT TOP 1
          COALESCE(ns.Datum, n.DatumFakture, n.Datum) AS DatumRacuna,
          COALESCE(ns.Referenca, n.Referenca, n.BrojDok) AS OpisRacuna,
          CASE
            WHEN ISNUMERIC(LEFT(
              COALESCE(ns.Referenca, n.Referenca, n.BrojDok, ''),
              CHARINDEX('/', COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') + '/') - 1
            )) = 1
            THEN CONVERT(int, LEFT(
              COALESCE(ns.Referenca, n.Referenca, n.BrojDok, ''),
              CHARINDEX('/', COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') + '/') - 1
            ))
            ELSE NULL
          END AS BrojRacuna,
          k.Naziv AS Komitent,
          ns.Duguje AS Iznos
        FROM [CRM_SumSumarum].[dbo].[NalogStavke] ns
        INNER JOIN [CRM_SumSumarum].[dbo].[Nalog] n ON ns.IdNalog = n.Id
        INNER JOIN [CRM_SumSumarum].[dbo].[Apps] Apps ON n.IdApp = Apps.Id
        LEFT JOIN [CRM_SumSumarum].[dbo].[Komitent] k ON ns.IdKomitent = k.Id
        WHERE Apps.Godina = 2026
          AND Apps.ApUser = @apUser
          AND ns.OznakaKonta IN ('2020', '2030')
          AND ns.Duguje > 0
          AND COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') LIKE '%/%'
        ORDER BY
          COALESCE(ns.Datum, n.DatumFakture, n.Datum) DESC,
          CASE
            WHEN ISNUMERIC(LEFT(
              COALESCE(ns.Referenca, n.Referenca, n.BrojDok, ''),
              CHARINDEX('/', COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') + '/') - 1
            )) = 1
            THEN CONVERT(int, LEFT(
              COALESCE(ns.Referenca, n.Referenca, n.BrojDok, ''),
              CHARINDEX('/', COALESCE(ns.Referenca, n.Referenca, n.BrojDok, '') + '/') - 1
            ))
            ELSE 0
          END DESC,
          COALESCE(ns.Referenca, n.Referenca, n.BrojDok) DESC;
      `);
    const zadnjiRacun = zadnjiRacunResult.recordset[0] || null;

    for (const banka of bankeVrste) {
      const vrstaId = banka.id
        ? banka.id
        : vrsteNaloga.recordset.find(
            (v) => v.Oznaka && v.Oznaka.toUpperCase() === banka.oznaka,
          )?.Id;

      if (!vrstaId) continue;

      const result = await pool
        .request()
        .input("apUser", sql.NVarChar, firma.ApUser)
        .input("vrstaId", sql.Int, vrstaId)
        .input("startDate", sql.Date, startDate)
        .input("endDate", sql.Date, endDate)
        .query(`
          SELECT n.Rbr, n.Datum
          FROM [CRM_SumSumarum].[dbo].[Nalog] n
          INNER JOIN [CRM_SumSumarum].[dbo].[Apps] a ON n.IdApp = a.Id
          WHERE a.ApUser = @apUser
            AND n.IdVrstaNaloga = @vrstaId
            AND n.Rbr IS NOT NULL
            AND n.Datum >= @startDate
            AND n.Datum < @endDate
          ORDER BY Rbr;
        `);

      const dates = [];
      const nums = [];
      result.recordset.forEach((row) => {
        const num = Number(row.Rbr);
        if (!Number.isNaN(num)) {
          nums.push(num);
          dates.push({ rbr: num, datum: row.Datum });
        }
      });

      if (!nums.length) continue;

      const uniqueNums = Array.from(new Set(nums)).sort((a, b) => a - b);
      const numSet = new Set(uniqueNums);
      const maxRbr = uniqueNums[uniqueNums.length - 1];
      const missing = [];

      for (let i = 1; i <= maxRbr; i++) {
        if (!numSet.has(i)) missing.push(i);
      }

      const maxDate = dates.find((item) => item.rbr === maxRbr)?.datum || null;

      data.push({
        banka: banka.code,
        bankaNaziv: banka.naziv,
        maxRbr,
        maxDate,
        missing,
      });
    }

    res.json({ success: true, year, firma, zadnjiRacun, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/plate/pregled", requirePortalUser, async (req, res) => {
  try {
    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const portalFirma = firmaResult.recordset[0];
    if (!portalFirma?.PIB && !portalFirma?.NazivFirme && !portalFirma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await getPlatePool();
    const firmaPlateResult = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("pib", sql.NVarChar, String(portalFirma.PIB || "").trim())
      .input(
        "naziv",
        sql.NVarChar,
        String(portalFirma.NazivFirme || portalFirma.ApUser || "").trim(),
      )
      .query(`
        SELECT TOP 1 Id, Naziv, PuniNaziv, PIB, Grad, Adresa, Email, ZiroRacun
        FROM dbo.Firma
        WHERE IdApp = @idApp
          AND (
            LTRIM(RTRIM(ISNULL(PIB, ''))) = @pib
            OR UPPER(LTRIM(RTRIM(ISNULL(Naziv, '')))) = UPPER(@naziv)
            OR UPPER(LTRIM(RTRIM(ISNULL(PuniNaziv, '')))) = UPPER(@naziv)
          )
        ORDER BY Id DESC;
      `);

    const firma = firmaPlateResult.recordset[0];
    if (!firma) {
      return res.json({
        success: false,
        error: "Firma nije pronadjena u bazi plata.",
      });
    }

    const countsResult = await pool
      .request()
      .input("idFirma", sql.Int, firma.Id)
      .query(`
        SELECT
          (SELECT COUNT(*) FROM dbo.Radnik WHERE IdFirma = @idFirma) AS Radnici,
          (SELECT COUNT(*) FROM dbo.Radnik WHERE IdFirma = @idFirma AND Aktivan = 1) AS Aktivni,
          (SELECT COUNT(*) FROM dbo.Radnik WHERE IdFirma = @idFirma AND Zaposlen = 1) AS Zaposleni,
          (SELECT COUNT(*) FROM dbo.Obracun WHERE IdFirma = @idFirma) AS Obracuni;
      `);

    const monthsResult = await pool
      .request()
      .input("idFirma", sql.Int, firma.Id)
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
      firma,
      counts: countsResult.recordset[0],
      months: monthsResult.recordset,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/plate/detalji", requirePortalUser, async (req, res) => {
  const godina = parseInt(req.query.godina, 10);
  const mjesec = parseInt(req.query.mjesec, 10);

  if (!godina || !mjesec) {
    return res.json({ success: false, error: "Nedostaju parametri." });
  }

  try {
    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const portalFirma = firmaResult.recordset[0];
    if (!portalFirma?.PIB && !portalFirma?.NazivFirme && !portalFirma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await getPlatePool();
    const firmaPlateResult = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("pib", sql.NVarChar, String(portalFirma.PIB || "").trim())
      .input(
        "naziv",
        sql.NVarChar,
        String(portalFirma.NazivFirme || portalFirma.ApUser || "").trim(),
      )
      .query(`
        SELECT TOP 1 Id, Naziv, PuniNaziv, PIB
        FROM dbo.Firma
        WHERE IdApp = @idApp
          AND (
            LTRIM(RTRIM(ISNULL(PIB, ''))) = @pib
            OR UPPER(LTRIM(RTRIM(ISNULL(Naziv, '')))) = UPPER(@naziv)
            OR UPPER(LTRIM(RTRIM(ISNULL(PuniNaziv, '')))) = UPPER(@naziv)
          )
        ORDER BY Id DESC;
      `);

    const firma = firmaPlateResult.recordset[0];
    if (!firma) {
      return res.json({
        success: false,
        error: "Firma nije pronadjena u bazi plata.",
      });
    }

    const result = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("idFirma", sql.Int, firma.Id)
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

    res.json({ success: true, firma, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/plate/platna-lista", requirePortalUser, async (req, res) => {
  const godina = parseInt(req.query.godina, 10);
  const mjesec = parseInt(req.query.mjesec, 10);
  const idRadnik = parseInt(req.query.idRadnik, 10);
  const idObracun = String(req.query.idObracun || "").trim();

  if (!godina || !mjesec || !idRadnik || !idObracun) {
    return res.json({ success: false, error: "Nedostaju parametri platne liste." });
  }

  try {
    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const portalFirma = firmaResult.recordset[0];
    if (!portalFirma?.PIB && !portalFirma?.NazivFirme && !portalFirma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await getPlatePool();
    const result = await pool
      .request()
      .input("idApp", sql.Int, PLATE_ID_APP)
      .input("pib", sql.NVarChar, String(portalFirma.PIB || "").trim())
      .input(
        "naziv",
        sql.NVarChar,
        String(portalFirma.NazivFirme || portalFirma.ApUser || "").trim(),
      )
      .input("godina", sql.Int, godina)
      .input("mjesec", sql.Int, mjesec)
      .input("idRadnik", sql.Int, idRadnik)
      .input("idObracun", sql.UniqueIdentifier, idObracun)
      .query(`
        SELECT TOP 1
          f.Id,
          f.Naziv,
          f.PuniNaziv,
          f.PIB,
          f.Grad,
          f.Adresa,
          f.ImeOvlLica,
          f.PrezimeOvlLica
        FROM dbo.Firma f
        WHERE f.IdApp = @idApp
          AND (
            LTRIM(RTRIM(ISNULL(f.PIB, ''))) = @pib
            OR UPPER(LTRIM(RTRIM(ISNULL(f.Naziv, '')))) = UPPER(@naziv)
            OR UPPER(LTRIM(RTRIM(ISNULL(f.PuniNaziv, '')))) = UPPER(@naziv)
          )
        ORDER BY f.Id DESC;

        SELECT TOP 1
          o.Id,
          o.GodObr,
          o.MjesObr,
          o.BrojObr,
          o.OznakaObr,
          o.DatumObracuna,
          o.FondSati,
          o.ObrVrKoef
        FROM dbo.Obracun o
        INNER JOIN dbo.Firma f ON f.Id = o.IdFirma
        WHERE o.Id = @idObracun
          AND o.GodObr = @godina
          AND o.MjesObr = @mjesec
          AND f.IdApp = @idApp
          AND (
            LTRIM(RTRIM(ISNULL(f.PIB, ''))) = @pib
            OR UPPER(LTRIM(RTRIM(ISNULL(f.Naziv, '')))) = UPPER(@naziv)
            OR UPPER(LTRIM(RTRIM(ISNULL(f.PuniNaziv, '')))) = UPPER(@naziv)
          );

        SELECT TOP 1
          r.Id,
          r.Prezime,
          r.Ime,
          r.MaticniBroj,
          r.RadnoMjestoOpis,
          r.BrojTekucegRacuna,
          r.Telefon,
          r.Email,
          r.FondSatiDan,
          r.UkupnoSati,
          r.KoeficijentSlozenosti,
          r.KoeficijentMinuliRad,
          r.ObrVrKoeficijenta,
          r.NetoIznos,
          r.BrutoIznos,
          vr.BrojRadnihSati AS BrojRadnihSatiVrste
        FROM dbo.Radnik r
        INNER JOIN dbo.Firma f ON f.Id = r.IdFirma
        LEFT JOIN dbo.Nom_VrstaRadnogVremena vr ON vr.Id = r.IdVrstaRadnogVremena
        WHERE r.Id = @idRadnik
          AND f.IdApp = @idApp
          AND (
            LTRIM(RTRIM(ISNULL(f.PIB, ''))) = @pib
            OR UPPER(LTRIM(RTRIM(ISNULL(f.Naziv, '')))) = UPPER(@naziv)
            OR UPPER(LTRIM(RTRIM(ISNULL(f.PuniNaziv, '')))) = UPPER(@naziv)
          );

        SELECT
          ou.Id,
          ou.Rbr,
          ou.SifraPrimanja,
          sp.Sifra,
          sp.Naziv,
          ou.DatumOd,
          ou.DatumDo,
          ou.Neto,
          ou.Bruto,
          ou.ProcenatOsnoviceSaUmanjenjem,
          ou.FondSati,
          ou.UkupnoSati,
          ou.IznosZaObracun,
          ou.OporeziviBruto,
          ou.Porez,
          ou.Prirez,
          ou.DZPio,
          ou.DZZdravstvo,
          ou.DZNezaposleni,
          ou.DPPio,
          ou.DPZdravstvo,
          ou.DPNezaposleni,
          ou.DPFondRada,
          ou.DPSindikat,
          ou.DPPrivKomora,
          ou.ObrVrKoeficijenta,
          ou.StopaPrireza,
          ou.StartniDioZarade,
          ou.KoefSlozenosti,
          ou.KoefMinuliRad,
          ou.ObracunatiBruto
        FROM dbo.Obracun_Uslovi ou
        LEFT JOIN dbo.SifarnikPrimanja sp ON sp.Id = ou.IdSfarnikPrimanja
        INNER JOIN dbo.Obracun o ON o.Id = ou.IdObracun
        INNER JOIN dbo.Firma f ON f.Id = o.IdFirma
        WHERE ou.IdObracun = @idObracun
          AND ou.IdRadnik = @idRadnik
          AND o.GodObr = @godina
          AND o.MjesObr = @mjesec
          AND f.IdApp = @idApp
          AND (
            LTRIM(RTRIM(ISNULL(f.PIB, ''))) = @pib
            OR UPPER(LTRIM(RTRIM(ISNULL(f.Naziv, '')))) = UPPER(@naziv)
            OR UPPER(LTRIM(RTRIM(ISNULL(f.PuniNaziv, '')))) = UPPER(@naziv)
          )
        ORDER BY ou.Rbr, ou.DatumOd;
      `);

    const firma = result.recordsets[0][0];
    const obracun = result.recordsets[1][0];
    const radnik = result.recordsets[2][0];
    const stavke = result.recordsets[3] || [];

    if (!firma || !obracun || !radnik) {
      return res
        .status(404)
        .json({ success: false, error: "Platna lista nije pronadjena." });
    }

    res.json({ success: true, firma, obracun, radnik, stavke });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/kalkulacije", requirePortalUser, async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const idObjekat = parseInt(req.query.idObjekat, 10) || null;

  try {
    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const firma = firmaResult.recordset[0];
    if (!firma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await sql.connect(dbConfig);
    const appResult = await pool
      .request()
      .input("apUser", sql.NVarChar, firma.ApUser)
      .input("year", sql.Int, year)
      .query(`
        SELECT TOP 1 Id, ApUser, Godina, VATNumber
        FROM dbo.Apps
        WHERE ApUser = @apUser AND Godina = @year AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const appFirma = appResult.recordset[0];
    if (!appFirma) {
      return res.json({
        success: true,
        year,
        firma,
        radnje: [],
        summary: { brojKalkulacija: 0, ukupno: 0 },
        data: [],
      });
    }

    const radnjeResult = await pool
      .request()
      .input("idApp", sql.Int, appFirma.Id)
      .query(`
        SELECT
          r.Id,
          r.Naziv,
          r.Oznaka,
          COUNT(d.Id) AS BrojKalkulacija
        FROM dbo.Nom_RJ r
        LEFT JOIN dbo.Dokument d
          ON d.IdObjekat = r.Id
          AND d.IdApp = @idApp
          AND d.IdVrstaDokumenta = 1
        WHERE r.IdApp = @idApp
        GROUP BY r.Id, r.Naziv, r.Oznaka
        ORDER BY r.Oznaka, r.Naziv;
      `);

    const request = pool
      .request()
      .input("idApp", sql.Int, appFirma.Id)
      .input("idObjekat", sql.Int, idObjekat);

    const kalkulacijeResult = await request.query(`
      SELECT
        d.Id,
        d.Rbr,
        d.Oznaka,
        d.DatumKreiranja,
        d.DatumValute,
        d.IdObjekat,
        r.Naziv AS Radnja,
        r.Oznaka AS OznakaRadnje,
        k.Naziv AS Dobavljac,
        k.Pib,
        COUNT(sd.Id) AS BrojStavki,
        SUM(ISNULL(sd.Ukupno, 0)) AS Ukupno,
        SUM(ISNULL(sd.ProdajnaVrijednost, 0)) AS ProdajnaVrijednost
      FROM dbo.Dokument d
      LEFT JOIN dbo.Nom_RJ r ON r.Id = d.IdObjekat
      LEFT JOIN dbo.Komitent k ON k.Id = d.IdKomitent
      LEFT JOIN dbo.StavkaDokumenta sd ON sd.IdDokument = d.Id
      WHERE d.IdApp = @idApp
        AND d.IdVrstaDokumenta = 1
        AND (@idObjekat IS NULL OR d.IdObjekat = @idObjekat)
      GROUP BY
        d.Id,
        d.Rbr,
        d.Oznaka,
        d.DatumKreiranja,
        d.DatumValute,
        d.IdObjekat,
        r.Naziv,
        r.Oznaka,
        k.Naziv,
        k.Pib
      ORDER BY d.Rbr DESC, d.DatumKreiranja DESC;
    `);

    const ukupno = kalkulacijeResult.recordset.reduce(
      (sum, row) => sum + Number(row.Ukupno || 0),
      0,
    );
    const prodajnaVrijednost = kalkulacijeResult.recordset.reduce(
      (sum, row) => sum + Number(row.ProdajnaVrijednost || 0),
      0,
    );

    res.json({
      success: true,
      year,
      firma,
      radnje: radnjeResult.recordset,
      summary: {
        brojKalkulacija: kalkulacijeResult.recordset.length,
        ukupno,
        prodajnaVrijednost,
      },
      data: kalkulacijeResult.recordset,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/kalkulacije/:id", requirePortalUser, async (req, res) => {
  const id = String(req.params.id || "").trim();

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ success: false, error: "Neispravan ID kalkulacije." });
  }

  try {
    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const firma = firmaResult.recordset[0];
    if (!firma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .input("apUser", sql.NVarChar, firma.ApUser)
      .query(`
        SELECT TOP 1
          a.ApUser,
          a.Godina,
          a.VATNumber AS FirmaPib,
          d.Id,
          d.Rbr,
          d.Oznaka,
          d.DatumKreiranja,
          d.DatumValute,
          d.IdNacinPlacanja,
          d.Napomena,
          r.Naziv AS Objekat,
          COALESCE(r2.Naziv, r.Naziv) AS OtpremljenoU,
          k.Naziv AS Dobavljac,
          k.Pib,
          k.RegPdv,
          k.Adresa,
          k.TelFax
        FROM dbo.Dokument d
        INNER JOIN dbo.Apps a ON a.Id = d.IdApp
        LEFT JOIN dbo.Nom_RJ r ON r.Id = d.IdObjekat
        LEFT JOIN dbo.Nom_RJ r2 ON r2.Id = d.IdObjekat2
        LEFT JOIN dbo.Komitent k ON k.Id = d.IdKomitent
        WHERE d.Id = @id
          AND d.IdVrstaDokumenta = 1
          AND a.ApUser = @apUser;

        SELECT
          sd.Rbr,
          art.Sifra,
          COALESCE(sd.Naziv, art.Naziv) AS Naziv,
          sd.Kolicina,
          sd.CijenaBezPDV,
          sd.RabatProcenat,
          sd.Rabat,
          sd.Cijena,
          sd.Pdv,
          sd.Ukupno,
          sd.PC,
          sd.Marza,
          sd.ProdajniPdv,
          sd.VPC,
          sd.ProdajnaVrijednost,
          sd.ProdajnaKolicina,
          (ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0)) AS NetoCijena,
          (ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Pdv, 0) / 100.0) AS PdvIznos,
          (ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * (1 + ISNULL(sd.Pdv, 0) / 100.0)) AS CijenaSaPdv,
          (ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Kolicina, 0)) AS NabavnaBezPdv,
          (
            ISNULL(sd.ProdajnaVrijednost, 0) / NULLIF(1 + ISNULL(sd.ProdajniPdv, 0) / 100.0, 0)
            - ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Kolicina, 0)
          ) AS Ruc
        FROM dbo.StavkaDokumenta sd
        LEFT JOIN dbo.Artikal art ON art.Id = sd.IdArtikal
        WHERE sd.IdDokument = @id
        ORDER BY sd.Rbr;

        SELECT
          sd.Pdv AS UlazStopa,
          SUM(ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Kolicina, 0)) AS UlazBezPdv,
          SUM(ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Kolicina, 0) * ISNULL(sd.Pdv, 0) / 100.0) AS UlazPdv,
          SUM(ISNULL(sd.Ukupno, 0)) AS UlazIznos,
          sd.ProdajniPdv AS IzlazStopa,
          SUM(ISNULL(sd.ProdajnaVrijednost, 0) / NULLIF(1 + ISNULL(sd.ProdajniPdv, 0) / 100.0, 0)) AS IzlazBezPdv,
          SUM(ISNULL(sd.ProdajnaVrijednost, 0) - ISNULL(sd.ProdajnaVrijednost, 0) / NULLIF(1 + ISNULL(sd.ProdajniPdv, 0) / 100.0, 0)) AS IzlazPdv,
          SUM(ISNULL(sd.ProdajnaVrijednost, 0)) AS IzlazIznos
        FROM dbo.StavkaDokumenta sd
        WHERE sd.IdDokument = @id
        GROUP BY sd.Pdv, sd.ProdajniPdv
        ORDER BY sd.Pdv, sd.ProdajniPdv;
      `);

    const dokument = result.recordsets[0][0];
    if (!dokument) {
      return res.status(404).json({ success: false, error: "Kalkulacija nije pronadjena." });
    }

    res.json({
      success: true,
      firma,
      dokument,
      stavke: result.recordsets[1] || [],
      rekapitulacija: result.recordsets[2] || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/portal/kalkulacije/:id/pdf", requirePortalUser, async (req, res) => {
  const id = String(req.params.id || "").trim();

  if (!isGuid(id)) {
    return res.status(400).json({ success: false, error: "Neispravan ID kalkulacije." });
  }

  try {
    const portalPool = await getPortalPool();
    const firmaResult = await portalPool
      .request()
      .input("clientUserId", sql.Int, req.portalUser.Id)
      .query(`
        SELECT TOP 1 ApUser, NazivFirme, PIB
        FROM dbo.ClientUserFirme
        WHERE ClientUserId = @clientUserId AND IsActive = 1
        ORDER BY Id DESC;
      `);

    const firma = firmaResult.recordset[0];
    if (!firma?.ApUser) {
      return res
        .status(404)
        .json({ success: false, error: "Korisniku nije dodijeljena firma." });
    }

    const pool = await sql.connect(dbConfig);
    const result = await pool
      .request()
      .input("id", sql.UniqueIdentifier, id)
      .input("apUser", sql.NVarChar, firma.ApUser)
      .query(`
        SELECT TOP 1
          a.ApUser,
          a.Godina,
          a.VATNumber AS FirmaPib,
          d.Id,
          d.Rbr,
          d.Oznaka,
          d.DatumKreiranja,
          d.DatumValute,
          d.IdNacinPlacanja,
          r.Naziv AS Objekat,
          COALESCE(r2.Naziv, r.Naziv) AS OtpremljenoU,
          k.Naziv AS Dobavljac,
          k.Pib,
          k.RegPdv,
          k.Adresa,
          k.TelFax
        FROM dbo.Dokument d
        INNER JOIN dbo.Apps a ON a.Id = d.IdApp
        LEFT JOIN dbo.Nom_RJ r ON r.Id = d.IdObjekat
        LEFT JOIN dbo.Nom_RJ r2 ON r2.Id = d.IdObjekat2
        LEFT JOIN dbo.Komitent k ON k.Id = d.IdKomitent
        WHERE d.Id = @id
          AND d.IdVrstaDokumenta = 1
          AND a.ApUser = @apUser;

        SELECT
          sd.Rbr,
          art.Sifra,
          COALESCE(sd.Naziv, art.Naziv) AS Naziv,
          sd.Kolicina,
          sd.CijenaBezPDV,
          sd.RabatProcenat,
          sd.Rabat,
          sd.Pdv,
          sd.Ukupno,
          sd.PC,
          sd.Marza,
          sd.ProdajniPdv,
          sd.VPC,
          sd.ProdajnaVrijednost,
          (ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0)) AS NetoCijena,
          (ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Pdv, 0) / 100.0) AS PdvIznos,
          (ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * (1 + ISNULL(sd.Pdv, 0) / 100.0)) AS CijenaSaPdv,
          (ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Kolicina, 0)) AS NabavnaBezPdv,
          (
            ISNULL(sd.ProdajnaVrijednost, 0) / NULLIF(1 + ISNULL(sd.ProdajniPdv, 0) / 100.0, 0)
            - ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Kolicina, 0)
          ) AS Ruc
        FROM dbo.StavkaDokumenta sd
        LEFT JOIN dbo.Artikal art ON art.Id = sd.IdArtikal
        WHERE sd.IdDokument = @id
        ORDER BY sd.Rbr;

        SELECT
          sd.Pdv AS UlazStopa,
          SUM(ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Kolicina, 0)) AS UlazBezPdv,
          SUM(ISNULL(sd.CijenaBezPDV, 0) * (1 - ISNULL(sd.RabatProcenat, 0) / 100.0) * ISNULL(sd.Kolicina, 0) * ISNULL(sd.Pdv, 0) / 100.0) AS UlazPdv,
          SUM(ISNULL(sd.Ukupno, 0)) AS UlazIznos,
          sd.ProdajniPdv AS IzlazStopa,
          SUM(ISNULL(sd.ProdajnaVrijednost, 0) / NULLIF(1 + ISNULL(sd.ProdajniPdv, 0) / 100.0, 0)) AS IzlazBezPdv,
          SUM(ISNULL(sd.ProdajnaVrijednost, 0) - ISNULL(sd.ProdajnaVrijednost, 0) / NULLIF(1 + ISNULL(sd.ProdajniPdv, 0) / 100.0, 0)) AS IzlazPdv,
          SUM(ISNULL(sd.ProdajnaVrijednost, 0)) AS IzlazIznos
        FROM dbo.StavkaDokumenta sd
        WHERE sd.IdDokument = @id
        GROUP BY sd.Pdv, sd.ProdajniPdv
        ORDER BY sd.Pdv, sd.ProdajniPdv;
      `);

    const dokument = result.recordsets[0][0];
    const stavke = result.recordsets[1] || [];
    const rekapitulacija = result.recordsets[2] || [];

    if (!dokument) {
      return res.status(404).json({ success: false, error: "Kalkulacija nije pronadjena." });
    }

    const fileName = `Kalkulacija ${dokument.Rbr || ""}-${asciiFileName(
      dokument.ApUser || "firma",
    )}.pdf`;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );

    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 24,
      bufferPages: true,
    });
    doc.pipe(res);

    const fontPath = getPdfFontPath();
    if (fontPath) {
      doc.registerFont("Regular", fontPath);
      doc.registerFont("Bold", fontPath);
      doc.font("Regular");
    }

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const pageBottom = doc.page.height - doc.page.margins.bottom;
    const pageWidth = right - left;

    function pdfText(value) {
      return String(value ?? "-");
    }

    function textRight(text, x, y, width) {
      doc.text(pdfText(text), x, y, { width, align: "right" });
    }

    function checkPage(height = 18) {
      if (doc.y + height > pageBottom) {
        doc.addPage();
      }
    }

    doc.fontSize(11).text(dokument.ApUser || firma.NazivFirme || "-");
    doc.moveDown(0.6);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(1.6);
    doc.fontSize(22).text("Kalkulacija", { align: "center" });
    doc.moveDown(1.2);

    const topY = doc.y;
    doc.fontSize(9);
    const rowGap = 14;
    const leftLabel = left;
    const leftValue = left + 108;
    const mid = left + pageWidth * 0.42;
    const rightBlock = left + pageWidth * 0.72;

    const headerRows = [
      ["Broj dokumenta:", `${dokument.Rbr || "-"}/${dokument.Godina || ""}`],
      ["Datum dokumenta:", formatPdfDate(dokument.DatumKreiranja)],
      ["Broj racuna dobavljaca:", dokument.Oznaka || "-"],
      ["Datum fakture dob.:", formatPdfDate(dokument.DatumKreiranja)],
      ["Datum valute:", formatPdfDate(dokument.DatumValute)],
      ["Nacin placanja:", nacinPlacanjaLabel(dokument.IdNacinPlacanja)],
    ];
    headerRows.forEach((row, index) => {
      const y = topY + index * rowGap;
      doc.font("Regular").text(row[0], leftLabel, y, { width: 105 });
      doc.font("Bold").text(row[1], leftValue, y, { width: 150 });
    });

    doc.font("Regular").fontSize(10).text("Objekat:", mid, topY, { width: 50 });
    doc.font("Bold").text(dokument.Objekat || "-", mid + 45, topY, { width: 130 });
    doc.font("Regular").text("Otpremljeno u:", rightBlock, topY, { width: 80 });
    doc.font("Bold").text(dokument.OtpremljenoU || dokument.Objekat || "-", rightBlock + 82, topY, {
      width: 130,
    });

    const supplierY = topY + 28;
    const supplierRows = [
      ["Dobavljac:", dokument.Dobavljac],
      ["PIB:", dokument.Pib],
      ["Reg.PDV:", dokument.RegPdv],
      ["Adresa:", dokument.Adresa],
      ["Tel/Fax:", dokument.TelFax],
    ];
    supplierRows.forEach((row, index) => {
      const y = supplierY + index * rowGap;
      doc.font("Regular").text(row[0], mid + 35, y, { width: 65 });
      doc.font("Bold").text(row[1] || "-", mid + 100, y, { width: 190 });
    });

    doc.font("Regular");
    doc.y = topY + 95;

    const columns = [
      { label: "Rbr", width: 20, align: "right" },
      { label: "Sifra i naziv artikla", width: 118 },
      { label: "Kol", width: 34, align: "right" },
      { label: "Cij. bez PDV", width: 45, align: "right" },
      { label: "Rab %", width: 32, align: "right" },
      { label: "Rabat", width: 36, align: "right" },
      { label: "Neto", width: 40, align: "right" },
      { label: "PDV %", width: 30, align: "right" },
      { label: "PDV", width: 32, align: "right" },
      { label: "Cij. sa PDV", width: 42, align: "right" },
      { label: "Nab.", width: 42, align: "right" },
      { label: "NV bez PDV", width: 46, align: "right" },
      { label: "RUC", width: 34, align: "right" },
      { label: "VPC", width: 42, align: "right" },
      { label: "Pr. PDV", width: 34, align: "right" },
      { label: "PC", width: 40, align: "right" },
      { label: "Prod.", width: 42, align: "right" },
      { label: "Marza", width: 34, align: "right" },
    ];

    function drawHeader() {
      let x = left;
      const y = doc.y;
      doc.font("Bold").fontSize(6.7);
      columns.forEach((col) => {
        doc.rect(x, y, col.width, 18).fillAndStroke("#e4e4e4", "#444");
        doc.fillColor("#111").text(col.label, x + 2, y + 5, {
          width: col.width - 4,
          align: col.align || "left",
        });
        x += col.width;
      });
      doc.font("Regular").fillColor("#111");
      doc.y = y + 20;
    }

    function drawRow(values, bold = false) {
      checkPage(22);
      let x = left;
      const y = doc.y;
      const rowHeight = 18;
      doc.font(bold ? "Bold" : "Regular").fontSize(6.5);
      values.forEach((value, index) => {
        const col = columns[index];
        doc.text(pdfText(value), x + 2, y + 2, {
          width: col.width - 4,
          align: col.align || "left",
          height: rowHeight - 3,
          ellipsis: true,
        });
        x += col.width;
      });
      doc.y = y + rowHeight;
      doc.font("Regular");
    }

    drawHeader();

    let totalRabat = 0;
    let totalNabavna = 0;
    let totalBezPdv = 0;
    let totalRuc = 0;
    let totalProdajna = 0;

    stavke.forEach((row) => {
      totalRabat += Number(row.Rabat || 0);
      totalNabavna += Number(row.Ukupno || 0);
      totalBezPdv += Number(row.NabavnaBezPdv || 0);
      totalRuc += Number(row.Ruc || 0);
      totalProdajna += Number(row.ProdajnaVrijednost || 0);
      drawRow([
        row.Rbr || "",
        [row.Sifra, row.Naziv].filter(Boolean).join(", "),
        Number(row.Kolicina || 0).toLocaleString("sr-RS", { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
        Number(row.CijenaBezPDV || 0).toLocaleString("sr-RS", { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        formatPdfMoney(row.RabatProcenat),
        formatPdfMoney(row.Rabat),
        Number(row.NetoCijena || 0).toLocaleString("sr-RS", { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        Number(row.Pdv || 0).toLocaleString("sr-RS", { maximumFractionDigits: 0 }),
        formatPdfMoney(row.PdvIznos),
        formatPdfMoney(row.CijenaSaPdv),
        formatPdfMoney(row.Ukupno),
        formatPdfMoney(row.NabavnaBezPdv),
        formatPdfMoney(row.Ruc),
        Number(row.VPC || 0).toLocaleString("sr-RS", { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        formatPdfMoney(row.ProdajniPdv),
        Number(row.PC || 0).toLocaleString("sr-RS", { minimumFractionDigits: 4, maximumFractionDigits: 4 }),
        formatPdfMoney(row.ProdajnaVrijednost),
        formatPdfMoney(row.Marza),
      ]);
    });

    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    drawRow([
      "", "", "", "", "", formatPdfMoney(totalRabat), "", "", "", "",
      formatPdfMoney(totalNabavna),
      formatPdfMoney(totalBezPdv),
      formatPdfMoney(totalRuc),
      "", "", "", formatPdfMoney(totalProdajna), "",
    ], true);

    checkPage(120);
    doc.moveDown(0.6);
    doc.font("Regular").fontSize(14).text("Rekapitulacija kalkulacije", left, doc.y, {
      width: pageWidth,
      align: "left",
    });
    doc.moveTo(left, doc.y).lineTo(right, doc.y).stroke();
    doc.moveDown(1.2);

    const recapY = doc.y;
    const recapWidth = 300;
    const recapCols = [105, 65, 65, 65];

    function drawRecap(title, x, rows, type) {
      doc.font("Bold").fontSize(10).text(title, x, recapY, {
        width: recapWidth,
        align: "center",
      });
      let y = recapY + 18;
      const labels = ["Naziv stope", "Iznos bez PDV", "Iznos PDV", "Iznos"];
      let cx = x;
      doc.font("Bold").fontSize(7.5);
      labels.forEach((label, index) => {
        doc.rect(cx, y, recapCols[index], 15).fillAndStroke("#e4e4e4", "#444");
        doc.fillColor("#111").text(label, cx + 2, y + 4, {
          width: recapCols[index] - 4,
          align: index ? "right" : "left",
        });
        cx += recapCols[index];
      });
      y += 16;

      let bezPdv = 0;
      let pdv = 0;
      let iznos = 0;
      doc.font("Regular").fontSize(8);
      rows.forEach((row) => {
        const stopa = type === "ulaz" ? row.UlazStopa : row.IzlazStopa;
        const rowBezPdv = Number(type === "ulaz" ? row.UlazBezPdv : row.IzlazBezPdv || 0);
        const rowPdv = Number(type === "ulaz" ? row.UlazPdv : row.IzlazPdv || 0);
        const rowIznos = Number(type === "ulaz" ? row.UlazIznos : row.IzlazIznos || 0);
        bezPdv += rowBezPdv;
        pdv += rowPdv;
        iznos += rowIznos;
        doc.text(`Stand. st. (${Number(stopa || 0).toFixed(0)}%)`, x + 2, y, {
          width: recapCols[0] - 4,
        });
        textRight(formatPdfMoney(rowBezPdv), x + recapCols[0], y, recapCols[1] - 4);
        textRight(formatPdfMoney(rowPdv), x + recapCols[0] + recapCols[1], y, recapCols[2] - 4);
        textRight(formatPdfMoney(rowIznos), x + recapCols[0] + recapCols[1] + recapCols[2], y, recapCols[3] - 4);
        y += 14;
      });

      doc.moveTo(x, y).lineTo(x + recapWidth, y).stroke();
      y += 4;
      doc.font("Bold");
      doc.text("Ukupno", x + 2, y, { width: recapCols[0] - 4 });
      textRight(formatPdfMoney(bezPdv), x + recapCols[0], y, recapCols[1] - 4);
      textRight(formatPdfMoney(pdv), x + recapCols[0] + recapCols[1], y, recapCols[2] - 4);
      textRight(formatPdfMoney(iznos), x + recapCols[0] + recapCols[1] + recapCols[2], y, recapCols[3] - 4);
      doc.font("Regular");
    }

    drawRecap("ULAZ", left + 70, rekapitulacija, "ulaz");
    drawRecap("IZLAZ", left + pageWidth - recapWidth - 70, rekapitulacija, "izlaz");

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/logout", async (req, res) => {
  try {
    const token = parseCookies(req).admin_session;
    if (token) {
      const pool = await getPortalPool();
      await pool
        .request()
        .input("tokenHash", sql.NVarChar, hashToken(token))
        .query(`
          UPDATE dbo.ClientSessions
          SET RevokedAt = SYSUTCDATETIME()
          WHERE SessionTokenHash = @tokenHash AND RevokedAt IS NULL;
        `);
    }
  } catch (error) {
    console.error("Logout error:", error.message);
  }

  res.clearCookie("admin_session", { path: "/" });
  res.redirect("/index.html");
});

app.get("/admin.html", requireAdmin, (req, res) => sendRootFile(res, "admin.html"));
app.get("/banke.html", requireAdmin, (req, res) => sendRootFile(res, "banke.html"));
app.get("/plate.html", requireAdmin, (req, res) => sendRootFile(res, "plate.html"));
app.get("/user.html", requirePortalUser, (req, res) => sendRootFile(res, "user.html"));
app.get("/script.js", requireAdmin, (req, res) => sendRootFile(res, "script.js"));
app.get("/banke.js", requireAdmin, (req, res) => sendRootFile(res, "banke.js"));
app.get("/plate.js", requireAdmin, (req, res) => sendRootFile(res, "plate.js"));
app.get("/user.js", requirePortalUser, (req, res) => sendRootFile(res, "user.js"));

app.use(requireAdmin);

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

app.get("/portal/firme", async (req, res) => {
  try {
    const pool = await sql.connect(dbConfig);
    const result = await pool.request().query(`
      SELECT DISTINCT
        Id,
        ApUser,
        ApUser AS NazivFirme,
        VATnumber AS PIB
      FROM [CRM_SumSumarum].[dbo].[Apps]
      WHERE Godina = 2026 AND IsActive = 1
      ORDER BY ApUser;
    `);

    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.get("/portal/users", async (req, res) => {
  try {
    const pool = await getPortalPool();
    const result = await pool.request().query(`
      SELECT
        u.Id,
        u.Username,
        u.DisplayName,
        u.Role,
        u.IsActive,
        u.CreatedAt,
        f.FirmaId,
        f.IdApp,
        f.ApUser,
        f.NazivFirme,
        f.PIB
      FROM dbo.ClientUsers u
      LEFT JOIN dbo.ClientUserFirme f
        ON f.ClientUserId = u.Id AND f.IsActive = 1
      WHERE u.Role = 'user' AND u.IsActive = 1
      ORDER BY u.Username, f.NazivFirme;
    `);

    const users = new Map();
    result.recordset.forEach((row) => {
      if (!users.has(row.Id)) {
        users.set(row.Id, {
          Id: row.Id,
          Username: row.Username,
          DisplayName: row.DisplayName,
          Role: row.Role,
          IsActive: row.IsActive,
          CreatedAt: row.CreatedAt,
          Firme: [],
        });
      }

      if (row.NazivFirme) {
        users.get(row.Id).Firme.push({
          FirmaId: row.FirmaId,
          IdApp: row.IdApp,
          ApUser: row.ApUser,
          NazivFirme: row.NazivFirme,
          PIB: row.PIB,
        });
      }
    });

    res.json({ success: true, data: Array.from(users.values()) });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

app.post("/portal/users", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const password = String(req.body.password || "");
    const displayName = String(req.body.displayName || username).trim();
    const firmaId = Number(req.body.firmaId);

    if (!username || !password || !firmaId) {
      return res.status(400).json({
        success: false,
        error: "Unesite korisnika, lozinku i firmu.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Lozinka mora imati najmanje 6 karaktera.",
      });
    }

    const firmaPool = await sql.connect(dbConfig);
    const firmaResult = await firmaPool
      .request()
      .input("firmaId", sql.Int, firmaId)
      .query(`
        SELECT TOP 1
          Id,
          ApUser,
          ApUser AS NazivFirme,
          VATnumber AS PIB
        FROM [CRM_SumSumarum].[dbo].[Apps]
        WHERE Id = @firmaId AND Godina = 2026 AND IsActive = 1;
      `);

    const firma = firmaResult.recordset[0];
    if (!firma) {
      return res
        .status(404)
        .json({ success: false, error: "Firma nije pronadjena." });
    }

    const portalPool = await getPortalPool();
    const exists = await portalPool
      .request()
      .input("username", sql.NVarChar, username)
      .query(`
        SELECT TOP 1 Id, IsActive, Role
        FROM dbo.ClientUsers
        WHERE Username = @username;
      `);

    const existingUser = exists.recordset[0];
    if (existingUser?.IsActive) {
      return res
        .status(409)
        .json({ success: false, error: "Korisnik vec postoji." });
    }

    if (existingUser && existingUser.Role !== "user") {
      return res.status(409).json({
        success: false,
        error: "Korisnicko ime koristi nalog koji nije klijentski user.",
      });
    }

    const transaction = new sql.Transaction(portalPool);
    await transaction.begin();

    try {
      let userId = existingUser?.Id;

      const userRequest = new sql.Request(transaction)
        .input("username", sql.NVarChar, username)
        .input("displayName", sql.NVarChar, displayName || username)
        .input("passwordHash", sql.NVarChar, scryptHash(password));

      if (userId) {
        await userRequest.input("userId", sql.Int, userId).query(`
          UPDATE dbo.ClientUsers
          SET DisplayName = @displayName,
              PasswordHash = @passwordHash,
              Role = 'user',
              IsActive = 1
          WHERE Id = @userId;
        `);
      } else {
        const userInsert = await userRequest.query(`
          INSERT INTO dbo.ClientUsers
            (Username, DisplayName, PasswordHash, Role, IsActive)
          OUTPUT INSERTED.Id
          VALUES
            (@username, @displayName, @passwordHash, 'user', 1);
        `);

        userId = userInsert.recordset[0].Id;
      }

      await new sql.Request(transaction)
        .input("clientUserId", sql.Int, userId)
        .input("firmaSource", sql.NVarChar, "CRM")
        .input("firmaId", sql.Int, firma.Id)
        .input("idApp", sql.Int, firma.Id)
        .input("apUser", sql.NVarChar, firma.ApUser)
        .input("nazivFirme", sql.NVarChar, firma.NazivFirme || firma.ApUser)
        .input("pib", sql.NVarChar, firma.PIB)
        .query(`
          UPDATE dbo.ClientUserFirme
          SET IsActive = 0
          WHERE ClientUserId = @clientUserId;

          INSERT INTO dbo.ClientUserFirme
            (ClientUserId, FirmaSource, FirmaId, IdApp, ApUser, NazivFirme, PIB, IsActive)
          VALUES
            (@clientUserId, @firmaSource, @firmaId, @idApp, @apUser, @nazivFirme, @pib, 1);
        `);

      await transaction.commit();
      res.json({ success: true, userId, reactivated: Boolean(existingUser) });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/portal/users/:id/password", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const password = String(req.body.password || "");

    if (!userId || !password) {
      return res
        .status(400)
        .json({ success: false, error: "Unesite novu lozinku." });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: "Lozinka mora imati najmanje 6 karaktera.",
      });
    }

    const pool = await getPortalPool();
    const result = await pool
      .request()
      .input("userId", sql.Int, userId)
      .input("passwordHash", sql.NVarChar, scryptHash(password))
      .query(`
        UPDATE dbo.ClientUsers
        SET PasswordHash = @passwordHash
        WHERE Id = @userId AND Role = 'user';

        SELECT @@ROWCOUNT AS Changed;
      `);

    if (!result.recordset[0]?.Changed) {
      return res
        .status(404)
        .json({ success: false, error: "Korisnik nije pronadjen." });
    }

    await pool
      .request()
      .input("userId", sql.Int, userId)
      .query(`
        UPDATE dbo.ClientSessions
        SET RevokedAt = SYSUTCDATETIME()
        WHERE ClientUserId = @userId AND RevokedAt IS NULL;
      `);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete("/portal/users/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    if (!userId) {
      return res
        .status(400)
        .json({ success: false, error: "Korisnik nije ispravan." });
    }

    const pool = await getPortalPool();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    try {
      const result = await new sql.Request(transaction)
        .input("userId", sql.Int, userId)
        .query(`
          UPDATE dbo.ClientUsers
          SET IsActive = 0
          WHERE Id = @userId AND Role = 'user' AND IsActive = 1;

          SELECT @@ROWCOUNT AS Changed;
        `);

      if (!result.recordset[0]?.Changed) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ success: false, error: "Korisnik nije pronadjen." });
      }

      await new sql.Request(transaction).input("userId", sql.Int, userId).query(`
        UPDATE dbo.ClientUserFirme
        SET IsActive = 0
        WHERE ClientUserId = @userId;

        UPDATE dbo.ClientSessions
        SET RevokedAt = SYSUTCDATETIME()
        WHERE ClientUserId = @userId AND RevokedAt IS NULL;
      `);

      await transaction.commit();
      res.json({ success: true });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Pokretanje servera
const PORT = 8585;
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
