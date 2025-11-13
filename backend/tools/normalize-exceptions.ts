import fs from 'fs';
import path from 'path';

// A simple script to normalize exception message strings in TypeScript files.
// It looks for patterns like: throw new HttpException('message', 400)
// or: throw new BadRequestException(`message`)
// and replaces the first occurrence of <word>| (optionally followed by a space)
// at the beginning of the string with an empty string, preserving the rest.

// Usage: node normalize-exceptions.js [--apply] [--ext ts,tsx]
// Default is dry-run (no files modified). Use --apply to write changes.

const ROOT = path.resolve(__dirname, '..');
const exts = process.argv.includes('--ext')
    ? process.argv[process.argv.indexOf('--ext') + 1].split(',')
    : ['ts'];
const APPLY = process.argv.includes('--apply');

function walk(dir: string, filelist: string[] = []) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const full = path.join(dir, f);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            if (f === 'node_modules' || f === '.git') continue;
            walk(full, filelist);
        } else {
            const fileExt = f.split('.').pop() ?? '';
            if (exts.includes(fileExt)) filelist.push(full);
        }
    }
    return filelist;
}

function normalizeContent(content: string) {
    // Regex to find throw new <AnyException>(`...` or '...' or "...")
    // and remove leading: optional whitespace, then word chars or - or _ or
    // then a pipe '|' optionally followed by a space, at start of the string content.
    // We must handle backtick templates and single/double quoted strings.

    // This regex finds string literals inside throw new ...(...)
    const throwRegex = /throw\s+new\s+([A-Za-z0-9_$.]+)\s*\(([^)]*)\)/gs;

    let changed = false;
    const newContent = content.replace(throwRegex, (match, exceptionClass, args) => {
        // We'll only modify when the first argument is a string literal
        const trimmed = args.trimStart();
        if (!trimmed) return match;

        // match a starting string literal (single, double or backtick)
        const strLitRegex = /^(['"`])([\s\S]*?)\1/;
        const m = trimmed.match(strLitRegex);
        if (!m) return match;

        const quote = m[1];
        const inner = m[2];

        // If inner starts with something like key| or key | (key can be word characters, hyphen or underscore)
        const keyPrefix = inner.match(/^[\s]*[A-Za-z0-9_-]+\|\s*/);
        if (!keyPrefix) return match;

        const newInner = inner.replace(/^[\s]*[A-Za-z0-9_-]+\|\s*/, '');
        const newLiteral = quote + newInner + quote;

        // replace only the first occurrence of the literal in args
        const newArgs = trimmed.replace(strLitRegex, newLiteral);

        changed = true;
        // Reconstruct the throw expression with the modified args (preserve spacing before args)
        const prefix = match.slice(0, match.indexOf('(') + 1);
        return prefix + newArgs + ')';
    });

    return { changed, newContent };
}

function main() {
    const files = walk(ROOT);
    const fixes: { file: string; before: string; after: string }[] = [];

    for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const { changed, newContent } = normalizeContent(content);
        if (changed) {
            fixes.push({ file, before: content, after: newContent });
            if (APPLY) fs.writeFileSync(file, newContent, 'utf8');
        }
    }

    if (fixes.length === 0) {
        console.log('No exception string prefixes found.');
        return;
    }

    console.log(`Found ${fixes.length} files with potential changes.`);
    for (const f of fixes) {
        console.log('\n--- ' + f.file);
        // show a small diff-like preview: first lines where they differ
        const befLines = f.before.split(/\n/);
        const aftLines = f.after.split(/\n/);
        let i = 0;
        let shown = 0;
        while (i < Math.min(befLines.length, aftLines.length) && shown < 10) {
            if (befLines[i] !== aftLines[i]) {
                console.log(`- ${befLines[i]}`);
                console.log(`+ ${aftLines[i]}`);
                shown++;
            }
            i++;
        }
    }

    if (!APPLY) {
        console.log('\nDry run complete. To apply changes run: node tools/normalize-exceptions.js --apply');
    } else {
        console.log('\nAll changes applied.');
    }
}

main();
