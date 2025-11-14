const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APPLY = process.argv.includes('--apply');
const exts = ['ts'];

function walk(dir, filelist = []) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (f === 'node_modules' || f === '.git') continue;
            walk(full, filelist);
        } else {
            const fileExt = f.split('.').pop() || '';
            if (exts.includes(fileExt)) filelist.push(full);
        }
    }
    return filelist;
}

function normalizeDecorators(content) {
    // Patterns to target: message: '$property| text'  OR message: `...` or message: "..."
    // Also @IsInt({ message: '$property| id' })
    // We'll replace occurrences of '$property|\s*' inside decorator message strings.

    const decoratorMessageRegex = /(message\s*:\s*)(['"`])(\$property\|\s*)([\s\S]*?)\2/g;
    let changed = false;
    const newContent = content.replace(decoratorMessageRegex, (m, prefix, quote, key, rest) => {
        changed = true;
        // Keep same quoting
        return `${prefix}${quote}${rest}${quote}`;
    });

    return { changed, newContent };
}

function main() {
    const files = walk(ROOT);
    const fixes = [];

    for (const file of files) {
        // limit to dto files or specific folders? We'll scan all ts files but only record changes.
        const content = fs.readFileSync(file, 'utf8');
        const { changed, newContent } = normalizeDecorators(content);
        if (changed) {
            fixes.push({ file, before: content, after: newContent });
            if (APPLY) fs.writeFileSync(file, newContent, 'utf8');
        }
    }

    if (fixes.length === 0) {
        console.log('No decorator messages with $property| found.');
        return;
    }

    console.log(`Found ${fixes.length} files with potential decorator message changes.`);
    for (const f of fixes) {
        console.log('\n--- ' + f.file);
        const bef = f.before.split('\n');
        const aft = f.after.split('\n');
        for (let i = 0; i < Math.min(bef.length, aft.length); i++) {
            if (bef[i] !== aft[i]) {
                console.log('- ' + bef[i]);
                console.log('+ ' + aft[i]);
            }
        }
    }

    if (!APPLY) console.log('\nDry run complete. To apply run: node tools/normalize-decorator-messages.js --apply');
    else console.log('\nApplied changes.');
}

main();
