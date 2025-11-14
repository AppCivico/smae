const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const exts = ['ts'];

function walk(dir, list = []) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', '.git'].includes(f)) continue;
      walk(full, list);
    } else {
      const ext = f.split('.').pop();
      if (exts.includes(ext)) list.push(full);
    }
  }
  return list;
}

/**
 * Detects fields that have:
 *   @IsString()
 * but *not*:
 *   @MaxLength(...)
 *
 * Works on property-level decorators like:
 *   @IsString()
 *   @MaxLength(50)
 *   myField: string;
 */
function checkFile(content) {
  const lines = content.split('\n');
  const missing = [];

  // Very loose decorator matcher
  // Collects blocks of decorators + next line as the property
  let decoratorBlock = [];

  const decoratorRegex = /^\s*@([A-Za-z0-9_]+)(\(|\s|$)/;
  const propertyRegex = /^\s*([A-Za-z0-9_]+)\??:\s*[\w<>\[\]]+/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const decMatch = line.match(decoratorRegex);
    if (decMatch) {
      decoratorBlock.push(decMatch[1]);
      continue;
    }

    // If this line looks like a property, check decorators
    const propMatch = line.match(propertyRegex);
    if (propMatch) {
      const propName = propMatch[1];

      const hasIsString = decoratorBlock.includes('IsString');
      const hasMaxLength = decoratorBlock.includes('MaxLength');

      if (hasIsString && !hasMaxLength) {
        missing.push({
          property: propName,
          decorators: [...decoratorBlock]
        });
      }

      decoratorBlock = []; // reset after a property
    } else {
      // If it's a blank or unrelated line, reset block
      if (!line.trim().startsWith('@')) decoratorBlock = [];
    }
  }

  return missing;
}

function main() {
  const files = walk(ROOT);
  const results = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const missing = checkFile(content);
    if (missing.length > 0) {
      results.push({ file, missing });
    }
  }

  if (results.length === 0) {
    console.log('All @IsString fields have @MaxLength. ✔️');
    return;
  }

  console.log('Fields missing @MaxLength:');
  for (const r of results) {
    console.log('\n--- ' + r.file);
    for (const m of r.missing) {
      console.log(`  ${m.property}  (decorators: ${m.decorators.join(', ')})`);
    }
  }
}

main();
