const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');
const sql = require('mssql');
require('dotenv').config();

// Database configuration
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

async function main() {
  try {
    // Read CSV file
    console.log('Reading CSV file...');
    const csvData = fs.readFileSync(path.join(__dirname, 'rezultati.csv'), 'utf-8');
    const records = csv.parse(csvData, {
      columns: false,
      skip_empty_lines: true,
    });

    // Connect to database
    console.log('Connecting to database...');
    const pool = await sql.connect(dbConfig);

    // Parse CSV and update database
    console.log('Updating komitent table with emails from CSV...');
    const updatedRecords = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const pib = record[0];
      const naziv = record[1];
      const email = record[7]; // Email is in 8th column (0-indexed: 7)

      if (pib && email) {
        try {
          // Update database
          const request = pool.request();
          request.input('pib', sql.VarChar, pib);
          request.input('email', sql.VarChar, email);
          
          const updateResult = await request.query(`
            UPDATE [CRM_SumSumarum].[dbo].[komitent]
            SET Email = @email
            WHERE Pib = @pib
          `);

          if (updateResult.rowsAffected[0] > 0) {
            console.log(`✓ Updated PIB ${pib}: ${naziv} -> ${email}`);
            updatedRecords.push({ pib, naziv, email });
          }
        } catch (err) {
          console.error(`✗ Error updating PIB ${pib}:`, err.message);
        }
      }
    }

    // Read existing vendor-mapping.json
    console.log('\nReading vendor-mapping.json...');
    const mappingPath = path.join(__dirname, 'vendor-mapping.json');
    let existingMapping = {};
    if (fs.existsSync(mappingPath)) {
      existingMapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
    }

    // Add new mappings only if they don't exist
    console.log('Adding new entries to vendor-mapping.json...');
    let addedCount = 0;
    for (const record of updatedRecords) {
      const key = record.naziv.trim().toUpperCase();
      if (!existingMapping[key]) {
        existingMapping[key] = record.email;
        addedCount++;
        console.log(`  + Added: ${key} -> ${record.email}`);
      } else {
        console.log(`  - Skipped (already exists): ${key}`);
      }
    }

    // Sort and write updated vendor-mapping.json
    console.log('\nWriting updated vendor-mapping.json...');
    const sortedMapping = {};
    Object.keys(existingMapping)
      .sort()
      .forEach(key => {
        sortedMapping[key] = existingMapping[key];
      });

    fs.writeFileSync(
      mappingPath,
      JSON.stringify(sortedMapping, null, 2),
      'utf-8'
    );

    console.log(`\n✓ Done! Updated ${updatedRecords.length} records in database, added ${addedCount} new entries to vendor-mapping.json.`);
    
    // Close connection
    await pool.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
