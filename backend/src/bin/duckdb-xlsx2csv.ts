import { Database } from 'duckdb-async';
import * as fs from 'fs';

async function bootstrap() {
    const xlsxFile = process.argv[2];
    const outputCsv = process.argv[3];

    if (!xlsxFile || !outputCsv) throw Error('Both XLSX file and output CSV file paths must be provided');

    // Check if the XLSX file exists
    if (!fs.existsSync(xlsxFile)) throw Error(`XLSX file does not exist: ${xlsxFile}`);

    try {
        await processXlsxToCsv(xlsxFile, outputCsv);
        if (process.send) process.send({ event: 'success' });
    } catch (error) {
        const ev = { event: 'error', error };
        if (process.send) {
            process.send(ev);
        } else {
            console.log('error', error);
        }
    }
}

function LogMemoryUsage(ctx: string) {
    const memoryUsage = process.memoryUsage();
    console.log(
        [
            `${ctx}: Process Memory Usage:`,
            `RSS: ${Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100} MB`,
            `Heap Total: ${Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100} MB`,
            `Heap Used: ${Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100} MB`,
            `External: ${Math.round((memoryUsage.external / 1024 / 1024) * 100) / 100} MB`,
        ].join(' ')
    );
}

async function processXlsxToCsv(xlsxFile: string, outputCsv: string) {
    LogMemoryUsage('before loading duckdb');
    const db = await Database.create(':memory:');

    // Install and load the excel extension instead of spatial
    await db.all(`LOAD excel;`);

    LogMemoryUsage('after loading excel extension');
    console.log(`Loading XLSX file: ${xlsxFile}`);

    // Create a table from the XLSX file using the excel extension
    // Set all_varchar=true to ensure consistent handling of different data types
    await db.all(`CREATE TABLE tbl AS SELECT * FROM read_xlsx('${xlsxFile}', all_varchar=true)`);
    LogMemoryUsage('after importing XLSX file');

    console.log(`Exporting to CSV file: ${outputCsv}`);
    // Export the table to a CSV file
    await db.all(`COPY tbl TO '${outputCsv}' (FORMAT CSV, HEADER)`);
    LogMemoryUsage('after processing');
    await db.close();
}

bootstrap();
