import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { Pool } from 'pg';

const prisma = new PrismaClient();
const logger = new Logger('PgsqlMigrate');

type IFilenameHash = {
    fileName: string;
    hash: string;
    content: string;
};
async function main() {
    const pgsqlDir = process.env.PGSQL_DIR || './pgsql';

    try {
        // Check if directory exists
        if (!fs.existsSync(pgsqlDir)) {
            throw new Error(`Directory ${pgsqlDir} does not exist`);
        }

        const files = fs.readdirSync(pgsqlDir).filter((file) => file.endsWith('.pgsql'));

        if (files.length === 0) {
            logger.warn(`No .pgsql files found in ${pgsqlDir}`);
            return;
        }

        const createTablesPromise = createMigrationTables();
        const fileHashes: IFilenameHash[] = await Promise.all(
            files.map(async (file) => {
                const filePath = path.join(pgsqlDir, file);
                return {
                    fileName: file,
                    hash: await calculateSHA256(filePath),
                    content: await fs.promises.readFile(filePath, 'utf-8'),
                };
            })
        );

        await createTablesPromise;

        const dbEntries = await getExistingMigrations();

        const filesToUpdate = fileHashes.filter((file) => {
            const dbEntry = dbEntries.find((entry) => entry.file_name === file.fileName);
            return !dbEntry || dbEntry.hash !== file.hash;
        });

        if (filesToUpdate.length > 0) {
            const feedback = await updateFunctions(filesToUpdate);
            logger.log(`Updated ${feedback.ok} PostgreSQL function(s), ${feedback.error} errored.`);
        } else {
            logger.log('No PostgreSQL functions need updating.');
        }
    } catch (error) {
        logger.error('An error occurred during migration:', error.stack);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

async function createMigrationTables() {
    await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS _migrate_pgsql (
            file_name TEXT PRIMARY KEY,
            hash TEXT NOT NULL,
            last_sql TEXT NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        `;

    await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS _migrate_pgsql_history (
            id SERIAL PRIMARY KEY,
            file_name TEXT NOT NULL,
            hash TEXT NOT NULL,
            sql TEXT NOT NULL,
            failed BOOLEAN DEFAULT FALSE,
            error TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (file_name) REFERENCES _migrate_pgsql(file_name)
        );
    `;
}

async function getExistingMigrations() {
    return prisma.$queryRaw<{ file_name: string; hash: string }[]>`
        SELECT file_name, hash FROM _migrate_pgsql;
    `;
}

async function updateFunctions(filesToUpdate: IFilenameHash[]) {
    let nSuccess = 0;
    let nErrored = 0;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const connection = await pool.connect();

    for (const file of filesToUpdate) {
        logger.log(`Updating ${file.fileName}...`);
        try {
            await connection.query('BEGIN');

            await connection.query(file.content);

            // Insert or update the main _migrate_pgsql table
            await connection.query(
                'INSERT INTO _migrate_pgsql (file_name, hash, last_sql) VALUES ($1, $2, $3) ' +
                    'ON CONFLICT (file_name) DO UPDATE SET hash = EXCLUDED.hash, last_sql = EXCLUDED.last_sql, updated_at = CURRENT_TIMESTAMP',
                [file.fileName, file.hash, file.content]
            );

            // Insert a new record into the _migrate_pgsql_history table
            await connection.query('INSERT INTO _migrate_pgsql_history (file_name, hash, sql) VALUES ($1, $2, $3)', [
                file.fileName,
                file.hash,
                file.content,
            ]);

            nSuccess++;
            await connection.query('COMMIT');
            logger.log(`Successfully updated ${file.fileName}`);
        } catch (error) {
            nErrored++;
            await connection.query('ROLLBACK');
            logger.error(`Error updating ${file.fileName}:`, error.message);

            try {
                await connection.query('BEGIN');

                await connection.query(
                    'INSERT INTO _migrate_pgsql (file_name, hash, last_sql) VALUES ($1, $2, $3) ' +
                        'ON CONFLICT (file_name) DO UPDATE SET hash = EXCLUDED.hash, last_sql = EXCLUDED.last_sql, updated_at = CURRENT_TIMESTAMP',
                    [file.fileName, '[Errored]', file.content]
                );

                await connection.query(
                    'INSERT INTO _migrate_pgsql_history (file_name, hash, sql, failed, error) VALUES ($1, $2, $3, true, $4)',
                    [file.fileName, file.hash, file.content, error.message]
                );
                await connection.query('COMMIT');
            } catch (error) {
                await connection.query('ROLLBACK');
                logger.error(`Error updating ${file.fileName} history:`, error.message);
            }
        }
    }
    connection.release();
    await pool.end();
    return { ok: nSuccess, error: nErrored };
}

async function calculateSHA256(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('error', reject);
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

main().catch((e) => {
    logger.error('Unhandled error:', e);
    process.exit(1);
});
