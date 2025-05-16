"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const duckdb_async_1 = require("duckdb-async");
const process_1 = require("process");
async function bootstrap() {
    const db = await duckdb_async_1.Database.create(':memory:');
    for (const extension of ['https', 'postgres', 'sqlite', 'excel']) {
        console.log(`Installing ${extension} extension`);
        const feedback = await db.all(`INSTALL ${extension}`);
        if (feedback.length > 0) {
            console.error(feedback);
            (0, process_1.exit)(1);
        }
    }
    await db.close();
}
bootstrap();
//# sourceMappingURL=install-duckdb-extensions.js.map
