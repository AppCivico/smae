import { Database } from 'duckdb-async';
import * as fs from 'fs';

async function bootstrap() {
    const csvFile = process.argv[2];
    const outputXlsx = process.argv[3];

    if (!csvFile || !outputXlsx) throw Error('Both CSV file and output XLSX file paths must be provided');

    // Check if the CSV file exists
    if (!fs.existsSync(csvFile)) throw Error(`CSV file does not exist: ${csvFile}`);

    try {
        await processCsvToXlsx(csvFile, outputXlsx);
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

async function processCsvToXlsx(csvFile: string, outputXlsx: string) {
    LogMemoryUsage('before loading duckdb');
    const db = await Database.create(':memory:');

    await db.all(`LOAD excel;`);

    LogMemoryUsage('after loading spatial extension');
    console.log(`Loading CSV file: ${csvFile}`);
    await db.all(`CREATE TABLE tbl AS SELECT * FROM read_csv_auto('${csvFile}')`);
    LogMemoryUsage('after importing CSV file');

    console.log(`Exporting to XLSX file: ${outputXlsx}`);
    await db.all(`COPY tbl TO '${outputXlsx}' (FORMAT xlsx, HEADER true)`);
    LogMemoryUsage('after processing');
    await db.close();
}

bootstrap();
