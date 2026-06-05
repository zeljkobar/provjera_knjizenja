require("dotenv").config();

const fs = require("fs");
const path = require("path");
const sql = require("mssql");

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const importantTables = new Set([
  "Apps",
  "Dokument",
  "StavkaDokumenta",
  "Nalog",
  "NalogStavke",
  "VrstaDokumenta",
  "VrstaNaloga",
  "Komitent",
  "Konto",
  "Artikal",
  "Nom_RJ",
  "Nom_PDV",
  "Firma",
  "SaldoDobavljaca",
]);

function mdTable(headers, rows) {
  const clean = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
  return [
    `| ${headers.map(clean).join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(clean).join(" | ")} |`),
  ].join("\n");
}

function fmtNumber(value) {
  return Number(value || 0).toLocaleString("sr-RS");
}

function columnType(column) {
  const type = column.DATA_TYPE;
  if (["nvarchar", "varchar", "char", "nchar"].includes(type)) {
    return `${type}(${column.CHARACTER_MAXIMUM_LENGTH === -1 ? "max" : column.CHARACTER_MAXIMUM_LENGTH})`;
  }
  if (["decimal", "numeric"].includes(type)) {
    return `${type}(${column.NUMERIC_PRECISION},${column.NUMERIC_SCALE})`;
  }
  return type;
}

function inferTarget(columnName, tableNames) {
  if (!columnName.startsWith("Id") || columnName === "Id") return "";
  const raw = columnName.slice(2);
  if (tableNames.has(raw)) return raw;
  const nomName = `Nom_${raw}`;
  if (tableNames.has(nomName)) return nomName;
  const vrstaName = `Vrsta${raw}`;
  if (tableNames.has(vrstaName)) return vrstaName;
  return "";
}

async function main() {
  const pool = await sql.connect(dbConfig);

  const tablesResult = await pool.request().query(`
    SELECT
      t.TABLE_SCHEMA,
      t.TABLE_NAME,
      CAST(ISNULL(rowStats.RowCnt, 0) AS bigint) AS RowCnt
    FROM INFORMATION_SCHEMA.TABLES t
    OUTER APPLY (
      SELECT SUM(p.row_count) AS RowCnt
      FROM sys.dm_db_partition_stats p
      JOIN sys.objects o ON o.object_id = p.object_id
      JOIN sys.schemas s ON s.schema_id = o.schema_id
      WHERE s.name = t.TABLE_SCHEMA
        AND o.name = t.TABLE_NAME
        AND p.index_id IN (0, 1)
    ) rowStats
    WHERE t.TABLE_TYPE = 'BASE TABLE'
      AND t.TABLE_SCHEMA = 'dbo'
    ORDER BY t.TABLE_NAME;
  `);

  const columnsResult = await pool.request().query(`
    SELECT
      TABLE_NAME,
      COLUMN_NAME,
      DATA_TYPE,
      CHARACTER_MAXIMUM_LENGTH,
      NUMERIC_PRECISION,
      NUMERIC_SCALE,
      IS_NULLABLE,
      ORDINAL_POSITION
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
    ORDER BY TABLE_NAME, ORDINAL_POSITION;
  `);

  const primaryKeysResult = await pool.request().query(`
    SELECT
      ku.TABLE_NAME,
      ku.COLUMN_NAME,
      tc.CONSTRAINT_NAME
    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
    JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE ku
      ON ku.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
     AND ku.TABLE_SCHEMA = tc.TABLE_SCHEMA
    WHERE tc.TABLE_SCHEMA = 'dbo'
      AND tc.CONSTRAINT_TYPE = 'PRIMARY KEY'
    ORDER BY ku.TABLE_NAME, ku.ORDINAL_POSITION;
  `);

  const foreignKeysResult = await pool.request().query(`
    SELECT
      fk.name AS ForeignKeyName,
      parentTable.name AS ParentTable,
      parentColumn.name AS ParentColumn,
      referencedTable.name AS ReferencedTable,
      referencedColumn.name AS ReferencedColumn
    FROM sys.foreign_keys fk
    JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    JOIN sys.tables parentTable ON parentTable.object_id = fkc.parent_object_id
    JOIN sys.columns parentColumn
      ON parentColumn.object_id = fkc.parent_object_id
     AND parentColumn.column_id = fkc.parent_column_id
    JOIN sys.tables referencedTable ON referencedTable.object_id = fkc.referenced_object_id
    JOIN sys.columns referencedColumn
      ON referencedColumn.object_id = fkc.referenced_object_id
     AND referencedColumn.column_id = fkc.referenced_column_id
    JOIN sys.schemas s ON s.schema_id = parentTable.schema_id
    WHERE s.name = 'dbo'
    ORDER BY parentTable.name, parentColumn.name;
  `);

  const appYearsResult = await pool.request().query(`
    SELECT Godina, COUNT(*) AS BrojFirmi
    FROM dbo.Apps
    GROUP BY Godina
    ORDER BY Godina DESC;
  `);

  const documentTypesResult = await pool.request().query(`
    SELECT
      vd.Id,
      vd.Oznaka,
      vd.Naziv,
      vd.NazivUStampi,
      COUNT(d.Id) AS BrojDokumenata
    FROM dbo.VrstaDokumenta vd
    LEFT JOIN dbo.Dokument d ON d.IdVrstaDokumenta = vd.Id
    GROUP BY vd.Id, vd.Oznaka, vd.Naziv, vd.NazivUStampi
    ORDER BY BrojDokumenata DESC, vd.Id;
  `);

  const journalTypesResult = await pool.request().query(`
    SELECT
      vn.Id,
      vn.Oznaka,
      vn.Naziv,
      COUNT(n.Id) AS BrojNaloga
    FROM dbo.VrstaNaloga vn
    LEFT JOIN dbo.Nalog n ON n.IdVrstaNaloga = vn.Id
    GROUP BY vn.Id, vn.Oznaka, vn.Naziv
    ORDER BY BrojNaloga DESC, vn.Id;
  `);

  const paymentTypesResult = await pool.request().query(`
    SELECT
      np.Id,
      np.Naziv,
      COUNT(d.Id) AS BrojDokumenata
    FROM dbo.Nom_NacinPlacanja np
    LEFT JOIN dbo.Dokument d ON d.IdNacinPlacanja = np.Id
    GROUP BY np.Id, np.Naziv
    ORDER BY BrojDokumenata DESC, np.Id;
  `);

  const kontoGroupsResult = await pool.request().query(`
    SELECT
      LEFT(Oznaka, 1) AS Klasa,
      COUNT(*) AS BrojKonta
    FROM dbo.Konto
    WHERE Oznaka IS NOT NULL AND Oznaka <> ''
    GROUP BY LEFT(Oznaka, 1)
    ORDER BY Klasa;
  `);

  const tableNames = new Set(tablesResult.recordset.map((row) => row.TABLE_NAME));
  const columnsByTable = new Map();
  columnsResult.recordset.forEach((column) => {
    if (!columnsByTable.has(column.TABLE_NAME)) columnsByTable.set(column.TABLE_NAME, []);
    columnsByTable.get(column.TABLE_NAME).push(column);
  });

  const pkByTable = new Map();
  primaryKeysResult.recordset.forEach((pk) => {
    if (!pkByTable.has(pk.TABLE_NAME)) pkByTable.set(pk.TABLE_NAME, []);
    pkByTable.get(pk.TABLE_NAME).push(pk.COLUMN_NAME);
  });

  const inferredRelations = [];
  columnsResult.recordset.forEach((column) => {
    const target = inferTarget(column.COLUMN_NAME, tableNames);
    if (target) {
      inferredRelations.push([
        column.TABLE_NAME,
        column.COLUMN_NAME,
        target,
        "pretpostavka po nazivu kolone",
      ]);
    }
  });

  const report = [];
  report.push("# Pregled baze CRM_SumSumarum");
  report.push("");
  report.push(`Generisano: ${new Date().toLocaleString("sr-RS")}`);
  report.push("");
  report.push("Ovaj izvjestaj je nastao read-only citanjem SQL Server baze iz Node skripta `inspect-accounting-schema.js`.");
  report.push("");

  report.push("## Sve tabele");
  report.push("");
  report.push(
    mdTable(
      ["Tabela", "Broj zapisa", "Primarni kljuc"],
      tablesResult.recordset.map((row) => [
        row.TABLE_NAME,
        fmtNumber(row.RowCnt),
        (pkByTable.get(row.TABLE_NAME) || []).join(", ") || "-",
      ]),
    ),
  );
  report.push("");

  report.push("## Najvaznije tabele za knjigovodstvo");
  report.push("");
  report.push(
    mdTable(
      ["Tabela", "Uloga"],
      [
        ["Apps", "firma/godina rada; vecina knjigovodstvenih podataka je vezana na `Apps.Id`"],
        ["Nalog", "zaglavlje knjigovodstvenog naloga"],
        ["NalogStavke", "stavke knjigovodstvenog naloga; promet po kontima, komitentima i datumima"],
        ["Konto", "kontni plan"],
        ["Komitent", "kupci, dobavljaci i poslovni partneri"],
        ["VrstaNaloga", "sifarnik vrsta naloga: izvodi, izlazne fakture, pocetno stanje itd."],
        ["Dokument", "zaglavlje materijalnih/robnih dokumenata, ukljucujuci kalkulacije"],
        ["StavkaDokumenta", "stavke dokumenata/kalkulacija po artiklima"],
        ["VrstaDokumenta", "sifarnik vrsta dokumenata; `Id = 1` je ulazna kalkulacija"],
        ["Artikal", "artikli/robe/usluge"],
        ["Nom_RJ", "radne jedinice/objekti/radnje"],
        ["Nom_PDV", "PDV sifarnik"],
      ],
    ),
  );
  report.push("");

  report.push("## Stvarni strani kljucevi koje baza deklarise");
  report.push("");
  if (foreignKeysResult.recordset.length) {
    report.push(
      mdTable(
        ["FK", "Tabela", "Kolona", "Vezana tabela", "Vezana kolona"],
        foreignKeysResult.recordset.map((row) => [
          row.ForeignKeyName,
          row.ParentTable,
          row.ParentColumn,
          row.ReferencedTable,
          row.ReferencedColumn,
        ]),
      ),
    );
  } else {
    report.push("Baza ne deklarise strane kljuceve ili ih skript nije pronasao. Veze se zato moraju citati iz naziva kolona i postojeceg koda.");
  }
  report.push("");

  report.push("## Pretpostavljene veze po kolonama `Id...`");
  report.push("");
  report.push(
    mdTable(
      ["Tabela", "Kolona", "Vjerovatno pokazuje na", "Napomena"],
      inferredRelations
        .filter((row) => importantTables.has(row[0]) || importantTables.has(row[2]))
        .sort((a, b) => `${a[0]}.${a[1]}`.localeCompare(`${b[0]}.${b[1]}`)),
    ),
  );
  report.push("");

  report.push("## Kolone vaznijih tabela");
  report.push("");
  [...importantTables]
    .filter((tableName) => columnsByTable.has(tableName))
    .sort()
    .forEach((tableName) => {
      report.push(`### ${tableName}`);
      report.push("");
      report.push(
        mdTable(
          ["Kolona", "Tip", "NULL"],
          columnsByTable.get(tableName).map((column) => [
            column.COLUMN_NAME,
            columnType(column),
            column.IS_NULLABLE,
          ]),
        ),
      );
      report.push("");
    });

  report.push("## Stvarni zapisi i upotreba sifarnika");
  report.push("");

  report.push("### Apps po godinama");
  report.push("");
  report.push(
    mdTable(
      ["Godina", "Broj firmi/aplikacija"],
      appYearsResult.recordset.map((row) => [row.Godina, fmtNumber(row.BrojFirmi)]),
    ),
  );
  report.push("");

  report.push("### Vrste dokumenata");
  report.push("");
  report.push(
    mdTable(
      ["Id", "Oznaka", "Naziv", "Naziv u stampi", "Broj dokumenata"],
      documentTypesResult.recordset.map((row) => [
        row.Id,
        row.Oznaka,
        row.Naziv,
        row.NazivUStampi,
        fmtNumber(row.BrojDokumenata),
      ]),
    ),
  );
  report.push("");

  report.push("### Vrste naloga");
  report.push("");
  report.push(
    mdTable(
      ["Id", "Oznaka", "Naziv", "Broj naloga"],
      journalTypesResult.recordset.map((row) => [
        row.Id,
        row.Oznaka,
        row.Naziv,
        fmtNumber(row.BrojNaloga),
      ]),
    ),
  );
  report.push("");

  report.push("### Nacini placanja na dokumentima");
  report.push("");
  report.push(
    mdTable(
      ["Id", "Naziv", "Broj dokumenata"],
      paymentTypesResult.recordset.map((row) => [
        row.Id,
        row.Naziv,
        fmtNumber(row.BrojDokumenata),
      ]),
    ),
  );
  report.push("");

  report.push("### Konta po klasama");
  report.push("");
  report.push(
    mdTable(
      ["Klasa", "Broj konta"],
      kontoGroupsResult.recordset.map((row) => [row.Klasa, fmtNumber(row.BrojKonta)]),
    ),
  );
  report.push("");

  report.push("## Kako bih modelovao novu racunovodstvenu bazu");
  report.push("");
  report.push("Za novu bazu bih razdvojio knjigovodstvo, robno/materijalno i portal, ali bih ostavio jasne veze.");
  report.push("");
  report.push(
    mdTable(
      ["Tabela", "Namjena"],
      [
        ["Tenants/Firme", "klijent/firma, PIB, naziv, adresa, status"],
        ["FiscalYears", "godina poslovanja po firmi"],
        ["Users", "korisnici portala i administratori"],
        ["UserFirmAccess", "koji korisnik vidi koju firmu"],
        ["Partners", "kupci/dobavljaci/komitenti"],
        ["ChartOfAccounts", "kontni plan"],
        ["JournalTypes", "vrste naloga"],
        ["Journals", "zaglavlje naloga"],
        ["JournalLines", "stavke naloga sa kontom, komitentom, duguje/potrazuje"],
        ["Banks", "banke i racuni"],
        ["BankStatements", "izvodi banaka"],
        ["DocumentTypes", "vrste dokumenata: kalkulacija, faktura, otpremnica..."],
        ["Documents", "zaglavlje dokumenata"],
        ["DocumentLines", "stavke dokumenata"],
        ["Items", "artikli/usluge"],
        ["Warehouses/Stores", "radnje, magacini, objekti"],
        ["VatRates", "PDV stope"],
        ["PayrollCompanies", "firme u modulu plata"],
        ["Employees", "radnici"],
        ["PayrollRuns", "obracuni plata"],
        ["PayrollRunLines", "stavke obracuna po radniku"],
        ["AuditLog", "ko je sta uradio i kada"],
      ],
    ),
  );
  report.push("");
  report.push("Najvaznije pravilo: sve transakcione tabele moraju imati `FirmId`, `FiscalYearId`, datume, status, i jasne strane kljuceve. GUID bih koristio za javne/vanjske ID-jeve, a numericki `identity/bigint` za interne kljuceve gdje performanse znace vise.");
  report.push("");

  const outputPath = path.join(__dirname, "ACCOUNTING_SCHEMA_REPORT.md");
  fs.writeFileSync(outputPath, report.join("\n"), "utf8");

  console.log(`Izvjestaj napravljen: ${outputPath}`);
  console.log(`Tabele: ${tablesResult.recordset.length}`);
  console.log(`Deklarisani FK: ${foreignKeysResult.recordset.length}`);
  console.log(`Pretpostavljene veze: ${inferredRelations.length}`);

  await sql.close();
}

main().catch(async (error) => {
  console.error(error);
  await sql.close();
  process.exit(1);
});
