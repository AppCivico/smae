/**
 * Verify that all module files are properly imported in NestJS
 * Checks that each *.module.ts file is referenced somewhere in the app
 * Usage: npx ts-node tools/check-module-imports.ts
 */
import { readFileSync } from 'fs';
import { globSync } from 'glob';

interface ModuleInfo {
    name: string;
    path: string;
    className: string;
    isImported: boolean;
    importedBy: string[];
}

interface ValidationResult {
    total: number;
    imported: number;
    orphaned: ModuleInfo[];
    warnings: string[];
}

/**
 * Extract module class name from file content
 */
function extractModuleClassName(content: string): string | null {
    const match = content.match(/export\s+class\s+(\w+Module)/);
    return match ? match[1] : null;
}

/**
 * Find all module files in the src directory
 */
function findAllModules(): ModuleInfo[] {
    const moduleFiles = globSync('src/**/*.module.ts', { absolute: true });
    const modules: ModuleInfo[] = [];

    for (const filePath of moduleFiles) {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const className = extractModuleClassName(content);

            if (!className) {
                console.warn(`⚠️  Could not extract class name from ${filePath}`);
                continue;
            }

            const relativePath = filePath.replace(process.cwd(), '.');

            modules.push({
                name: relativePath.split('/').pop()!.replace('.ts', ''),
                path: relativePath,
                className,
                isImported: false,
                importedBy: [],
            });
        } catch (error) {
            console.warn(`⚠️  Error reading ${filePath}:`, error);
        }
    }

    return modules;
}

/**
 * Check if a module is imported in any TypeScript file
 */
function checkModuleImports(modules: ModuleInfo[]): void {
    // Get all TypeScript files (focus on module and config files)
    const tsFiles = globSync('src/**/*.ts', { absolute: true });

    // Modules that should be ignored (external/framework modules)
    const ignoredModules = [
        'ConfigModule',
        'ServeStaticModule',
        'PrismaModule', // checked separately if needed
        'ScheduleModule',
        'JwtModule',
        'PassportModule',
        'MulterModule',
        'ThrottlerModule',
        'BullModule',
        'EventEmitterModule',
    ];

    for (const module of modules) {
        // Skip if already marked as imported
        if (module.isImported) continue;

        // Skip ignored modules
        if (ignoredModules.includes(module.className)) {
            module.isImported = true;
            module.importedBy.push('(framework module)');
            continue;
        }

        // Search for imports of this module
        for (const tsFile of tsFiles) {
            // Skip the module's own file
            if (tsFile.includes(module.path.replace('./', ''))) continue;

            try {
                const content = readFileSync(tsFile, 'utf-8');

                // Check for import statement
                const importRegex = new RegExp(`import\\s+\\{[^}]*\\b${module.className}\\b[^}]*\\}`, 'm');
                const importsArrayRegex = new RegExp(`imports:\\s*\\[[^\\]]*\\b${module.className}\\b[^\\]]*\\]`, 's');
                const forwardRefRegex = new RegExp(`forwardRef\\s*\\(\\s*\\(\\)\\s*=>\\s*${module.className}\\s*\\)`, 'm');

                if (importRegex.test(content) || importsArrayRegex.test(content) || forwardRefRegex.test(content)) {
                    const relativeTsFile = tsFile.replace(process.cwd(), '.');
                    module.importedBy.push(relativeTsFile);
                    module.isImported = true;
                }
            } catch (error) {
                // Ignore read errors
            }
        }
    }
}

/**
 * Generate validation report
 */
function generateReport(modules: ModuleInfo[]): ValidationResult {
    const orphaned = modules.filter(m => !m.isImported);
    const imported = modules.filter(m => m.isImported);
    const warnings: string[] = [];

    // Check for suspicious patterns
    for (const module of orphaned) {
        // Check if it's a test file (should be ignored)
        if (module.path.includes('.spec.') || module.path.includes('.test.')) {
            continue;
        }

        // Check if it's in a common location that should be imported
        if (module.path.includes('/src/pp/') ||
            module.path.includes('/src/casa-civil/') ||
            module.path.includes('/src/reports/')) {
            warnings.push(`⚠️  ${module.className} in domain folder but not imported`);
        }
    }

    return {
        total: modules.length,
        imported: imported.length,
        orphaned,
        warnings,
    };
}

/**
 * Print results
 */
function printReport(result: ValidationResult): void {
    console.log('\n' + '='.repeat(70));
    console.log('📋 MODULE IMPORT VALIDATION REPORT');
    console.log('='.repeat(70));

    console.log(`\n📊 Summary:`);
    console.log(`   Total modules found: ${result.total}`);
    console.log(`   ✅ Imported modules: ${result.imported}`);
    console.log(`   ❌ Orphaned modules: ${result.orphaned.length}`);

    if (result.orphaned.length > 0) {
        console.log('\n🔍 Orphaned Modules (not imported anywhere):');
        console.log('─'.repeat(70));

        // Group by directory for better readability
        const byDirectory = new Map<string, ModuleInfo[]>();
        for (const module of result.orphaned) {
            const dir = module.path.substring(0, module.path.lastIndexOf('/'));
            if (!byDirectory.has(dir)) byDirectory.set(dir, []);
            byDirectory.get(dir)!.push(module);
        }

        for (const [dir, mods] of [...byDirectory.entries()].sort()) {
            console.log(`\n📁 ${dir}/`);
            for (const mod of mods) {
                console.log(`   ❌ ${mod.className}`);
                console.log(`      File: ${mod.path}`);
            }
        }
    }

    if (result.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        console.log('─'.repeat(70));
        for (const warning of result.warnings) {
            console.log(`   ${warning}`);
        }
    }

    console.log('\n' + '='.repeat(70));

    if (result.orphaned.length === 0) {
        console.log('✅ All modules are properly imported!');
    } else {
        console.log('❌ Found orphaned modules that need to be imported or removed.');
        console.log('\n💡 Next steps:');
        console.log('   1. Check if these modules should be imported in app.module.*.ts files');
        console.log('   2. Or verify if these modules can be safely deleted');
        console.log('   3. If a module is only used as a dynamic import, you can ignore it');
    }

    console.log('='.repeat(70) + '\n');
}

/**
 * Main function
 */
function main() {
    console.log('🔍 Searching for module files...');
    const modules = findAllModules();
    console.log(`📦 Found ${modules.length} module files`);

    console.log('\n🔎 Checking module imports...');
    checkModuleImports(modules);

    console.log('📊 Generating report...');
    const result = generateReport(modules);

    printReport(result);

    // Exit with error code if there are orphaned modules
    if (result.orphaned.length > 0) {
        process.exit(1);
    }
}

main();
