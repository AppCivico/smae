import { Database } from 'duckdb-async';
import { exit } from 'process';

async function bootstrap() {
    const db = await Database.create(':memory:');

    for (const extension of ['https', 'postgres', 'sqlite', 'spatial']) {
        console.log(`Installing ${extension} extension`);
        const feedback = await db.all(`INSTALL ${extension}`);
        if (feedback.length > 0) {
            console.error(feedback);
            exit(1);
        }
    }

    await db.close();
}
bootstrap();
