/**
 * Generate interactive HTML viewer for module dependencies
 * Usage: npx ts-node tools/graph-html-viewer.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { globSync } from 'glob';

interface ModuleNode {
    name: string;
    path: string;
    imports: string[];
    forwardRefs: string[];
    area: string;
}

interface GraphLink {
    source: string;
    target: string;
    type: 'regular' | 'forwardRef';
}

function extractModules(): ModuleNode[] {
    const moduleFiles = globSync('src/**/*.module.ts', { absolute: true });
    const modules: ModuleNode[] = [];
    
    for (const filePath of moduleFiles) {
        const content = readFileSync(filePath, 'utf-8');
        
        const nameMatch = content.match(/export class (\w+Module)/);
        if (!nameMatch) continue;
        
        const moduleName = nameMatch[1];
        const relativePath = filePath.replace(process.cwd(), '.');
        const area = relativePath.split('/')[2] || 'root';
        
        const importsMatch = content.match(/imports:\s*\[([^\]]+)\]/s);
        const imports: string[] = [];
        const forwardRefs: string[] = [];
        
        if (importsMatch) {
            const importsContent = importsMatch[1];
            
            const forwardRefRegex = /forwardRef\s*\(\s*\(\)\s*=>\s*(\w+Module)\s*\)/g;
            let match;
            while ((match = forwardRefRegex.exec(importsContent)) !== null) {
                forwardRefs.push(match[1]);
            }
            
            const directImportRegex = /(?<!forwardRef\s*\(\s*\(\)\s*=>\s*)(\w+Module)(?!\s*\w)/g;
            while ((match = directImportRegex.exec(importsContent)) !== null) {
                const mod = match[1];
                if (!forwardRefs.includes(mod) && 
                    !['PrismaModule', 'JwtModule', 'ScheduleModule', 'ConfigModule'].includes(mod)) {
                    imports.push(mod);
                }
            }
        }
        
        modules.push({
            name: moduleName,
            path: relativePath,
            imports,
            forwardRefs,
            area
        });
    }
    
    return modules;
}

function findCircularDependencies(modules: ModuleNode[]): string[][] {
    const graph = new Map<string, Set<string>>();
    
    for (const mod of modules) {
        const deps = new Set([...mod.imports, ...mod.forwardRefs]);
        graph.set(mod.name, deps);
    }
    
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const path: string[] = [];
    
    function dfs(node: string): void {
        if (recursionStack.has(node)) {
            const cycleStart = path.indexOf(node);
            if (cycleStart !== -1) {
                const cycle = [...path.slice(cycleStart), node];
                const cycleKey = cycle.join(',');
                
                if (!cycles.some(c => [...c, c[0]].join(',') === cycleKey)) {
                    cycles.push([...path.slice(cycleStart), node]);
                }
            }
            return;
        }
        
        if (visited.has(node)) return;
        
        visited.add(node);
        recursionStack.add(node);
        path.push(node);
        
        const deps = graph.get(node) || new Set();
        for (const dep of deps) {
            if (graph.has(dep)) {
                dfs(dep);
            }
        }
        
        path.pop();
        recursionStack.delete(node);
    }
    
    for (const mod of modules) {
        if (!visited.has(mod.name)) {
            dfs(mod.name);
        }
    }
    
    return cycles;
}

function generateAreaColors(modules: ModuleNode[]): Record<string, string> {
    const palette = [
        '#4a9eff', '#8b5cf6', '#ec4899', '#f97316', '#22c55e',
        '#eab308', '#ef4444', '#06b6d4', '#a855f7', '#14b8a6',
        '#3b82f6', '#f472b6', '#84cc16', '#6366f1', '#facc15'
    ];
    const areas = [...new Set(modules.map(m => m.area))];
    const colors: Record<string, string> = {};
    areas.forEach((area, i) => {
        colors[area] = palette[i % palette.length];
    });
    return colors;
}

function generateHTML(modules: ModuleNode[], cycles: string[][]): string {
    const modulesInCycles = new Set<string>();
    for (const cycle of cycles) {
        for (const mod of cycle) modulesInCycles.add(mod);
    }

    const areaColors = generateAreaColors(modules);

    const nodesData = modules.map(m => ({
        id: m.name,
        area: m.area,
        path: m.path,
        imports: m.imports,
        forwardRefs: m.forwardRefs,
        inCycle: modulesInCycles.has(m.name),
        color: areaColors[m.area] || '#64748b'
    }));

    const linksData: GraphLink[] = [];
    for (const mod of modules) {
        for (const imp of mod.imports) {
            if (modules.find(m => m.name === imp)) {
                linksData.push({ source: imp, target: mod.name, type: 'regular' });
            }
        }
        for (const imp of mod.forwardRefs) {
            if (modules.find(m => m.name === imp)) {
                linksData.push({ source: imp, target: mod.name, type: 'forwardRef' });
            }
        }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMAE Module Explorer</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-dark: #0a0a0f;
            --bg-card: #12121a;
            --bg-hover: #1a1a24;
            --border: #2a2a3a;
            --text-primary: #e8e8f0;
            --text-secondary: #8888a0;
            --accent-blue: #4a9eff;
            --accent-purple: #a855f7;
            --accent-pink: #ec4899;
            --accent-orange: #f97316;
            --accent-green: #22c55e;
            --accent-red: #ef4444;
            --accent-yellow: #eab308;
            --accent-cyan: #06b6d4;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Space Grotesk', sans-serif;
            background: var(--bg-dark);
            color: var(--text-primary);
            overflow: hidden;
            height: 100vh;
        }

        .app {
            display: grid;
            grid-template-columns: 300px 1fr;
            grid-template-rows: 60px 1fr;
            height: 100vh;
        }

        /* Header */
        header {
            grid-column: 1 / -1;
            background: var(--bg-card);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            padding: 0 24px;
            gap: 24px;
        }

        .logo {
            display: flex;
            align-items: center;
            gap: 12px;
            font-weight: 600;
            font-size: 18px;
        }

        .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        .view-modes {
            display: flex;
            gap: 4px;
            background: var(--bg-dark);
            padding: 4px;
            border-radius: 8px;
        }

        .view-mode {
            padding: 8px 16px;
            border: none;
            background: transparent;
            color: var(--text-secondary);
            font-family: inherit;
            font-size: 13px;
            font-weight: 500;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
        }

        .view-mode:hover {
            color: var(--text-primary);
        }

        .view-mode.active {
            background: var(--accent-blue);
            color: white;
        }

        .stats {
            display: flex;
            gap: 24px;
            margin-left: auto;
            font-size: 13px;
        }

        .stat {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .stat-value {
            font-weight: 600;
            font-family: 'JetBrains Mono', monospace;
        }

        .stat-label {
            color: var(--text-secondary);
        }

        /* Sidebar */
        .sidebar {
            background: var(--bg-card);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .search-container {
            padding: 16px;
            border-bottom: 1px solid var(--border);
        }

        .search-input {
            width: 100%;
            padding: 10px 14px;
            background: var(--bg-dark);
            border: 1px solid var(--border);
            border-radius: 8px;
            color: var(--text-primary);
            font-family: inherit;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s;
        }

        .search-input:focus {
            border-color: var(--accent-blue);
        }

        .search-input::placeholder {
            color: var(--text-secondary);
        }

        .filter-section {
            padding: 16px;
            border-bottom: 1px solid var(--border);
        }

        .filter-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-secondary);
            margin-bottom: 12px;
        }

        .filter-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .filter-chip {
            padding: 6px 10px;
            background: var(--bg-dark);
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .filter-chip:hover {
            border-color: var(--accent-blue);
        }

        .filter-chip.active {
            background: var(--accent-blue);
            border-color: var(--accent-blue);
            color: white;
        }

        .filter-chip .count {
            opacity: 0.7;
            font-family: 'JetBrains Mono', monospace;
        }

        .module-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }

        .area-group {
            margin-bottom: 4px;
        }

        .area-header {
            padding: 10px 12px;
            font-size: 12px;
            font-weight: 600;
            color: var(--text-secondary);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            border-radius: 6px;
            transition: all 0.2s;
        }

        .area-header:hover {
            background: var(--bg-hover);
            color: var(--text-primary);
        }

        .area-header .chevron {
            font-size: 10px;
            transition: transform 0.2s;
        }

        .area-header.collapsed .chevron {
            transform: rotate(-90deg);
        }

        .area-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }

        .area-modules {
            padding-left: 20px;
        }

        .area-modules.hidden {
            display: none;
        }

        .module-item {
            padding: 8px 12px;
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
            cursor: pointer;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .module-item:hover {
            background: var(--bg-hover);
        }

        .module-item.selected {
            background: var(--accent-blue);
            color: white;
        }

        .module-item.in-cycle::before {
            content: '';
            width: 6px;
            height: 6px;
            background: var(--accent-red);
            border-radius: 50%;
        }

        .module-item.has-forward-ref::after {
            content: '↻';
            margin-left: auto;
            color: var(--accent-orange);
            font-size: 14px;
        }

        /* Main canvas */
        .canvas-container {
            position: relative;
            overflow: hidden;
            background: var(--bg-dark);
        }

        #graph-canvas {
            width: 100%;
            height: 100%;
        }

        /* Floating controls */
        .canvas-controls {
            position: absolute;
            bottom: 24px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 8px;
            background: var(--bg-card);
            padding: 8px;
            border-radius: 12px;
            border: 1px solid var(--border);
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }

        .canvas-btn {
            width: 40px;
            height: 40px;
            border: none;
            background: var(--bg-dark);
            color: var(--text-primary);
            border-radius: 8px;
            cursor: pointer;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }

        .canvas-btn:hover {
            background: var(--accent-blue);
        }

        /* Tooltip */
        .tooltip {
            position: absolute;
            padding: 16px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.5);
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            max-width: 320px;
            z-index: 1000;
        }

        .tooltip.visible {
            opacity: 1;
        }

        .tooltip-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }

        .tooltip-icon {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .tooltip-name {
            font-weight: 600;
            font-size: 14px;
        }

        .tooltip-path {
            font-size: 11px;
            color: var(--text-secondary);
            font-family: 'JetBrains Mono', monospace;
        }

        .tooltip-stats {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
        }

        .tooltip-stat {
            font-size: 12px;
        }

        .tooltip-stat-value {
            font-weight: 600;
            font-family: 'JetBrains Mono', monospace;
        }

        .tooltip-stat-label {
            color: var(--text-secondary);
            font-size: 11px;
        }

        .tooltip-badge {
            display: inline-block;
            padding: 4px 8px;
            background: var(--accent-red);
            color: white;
            font-size: 10px;
            font-weight: 600;
            border-radius: 4px;
            margin-top: 8px;
        }

        /* Detail panel */
        .detail-panel {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 320px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            overflow: hidden;
            display: none;
        }

        .detail-panel.visible {
            display: block;
        }

        .detail-header {
            padding: 20px;
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: flex-start;
            gap: 16px;
        }

        .detail-close {
            margin-left: auto;
            width: 28px;
            height: 28px;
            border: none;
            background: var(--bg-dark);
            color: var(--text-secondary);
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
        }

        .detail-close:hover {
            color: var(--text-primary);
        }

        .detail-content {
            padding: 20px;
            max-height: 400px;
            overflow-y: auto;
        }

        .detail-section {
            margin-bottom: 20px;
        }

        .detail-section:last-child {
            margin-bottom: 0;
        }

        .detail-section-title {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: var(--text-secondary);
            margin-bottom: 10px;
        }

        .dep-item {
            padding: 8px 10px;
            background: var(--bg-dark);
            border-radius: 6px;
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
            margin-bottom: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }

        .dep-item:hover {
            background: var(--bg-hover);
        }

        .dep-item.forward-ref {
            border-left: 3px solid var(--accent-orange);
        }

        .dep-arrow {
            color: var(--text-secondary);
        }

        /* Grid view */
        .grid-view {
            display: none;
            padding: 24px;
            overflow-y: auto;
            height: 100%;
        }

        .grid-view.active {
            display: block;
        }

        .grid-area {
            margin-bottom: 32px;
        }

        .grid-area-title {
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .grid-modules {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 8px;
        }

        .grid-module {
            padding: 12px 14px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 8px;
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .grid-module:hover {
            border-color: var(--accent-blue);
            transform: translateY(-2px);
        }

        .grid-module.in-cycle {
            border-color: var(--accent-red);
        }

        .grid-module .deps {
            margin-left: auto;
            color: var(--text-secondary);
            font-size: 11px;
        }

        /* Cycle view */
        .cycle-view {
            display: none;
            padding: 24px;
            overflow-y: auto;
            height: 100%;
        }

        .cycle-view.active {
            display: block;
        }

        .cycle-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 16px;
        }

        .cycle-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }

        .cycle-number {
            width: 32px;
            height: 32px;
            background: var(--accent-red);
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            font-size: 14px;
        }

        .cycle-title {
            font-weight: 600;
        }

        .cycle-path {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 8px;
        }

        .cycle-node {
            padding: 8px 12px;
            background: var(--bg-dark);
            border-radius: 6px;
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
            cursor: pointer;
            transition: all 0.2s;
        }

        .cycle-node:hover {
            background: var(--bg-hover);
        }

        .cycle-arrow {
            color: var(--accent-red);
            font-weight: 600;
        }

        /* Scrollbar */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: var(--bg-dark);
        }

        ::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: var(--text-secondary);
        }

        /* Node styling in SVG */
        .node-circle {
            cursor: pointer;
            transition: all 0.2s;
        }

        .node-label {
            font-family: 'JetBrains Mono', monospace;
            font-size: 9px;
            fill: var(--text-primary);
            pointer-events: none;
        }

        .link-line {
            stroke-opacity: 0.3;
            transition: stroke-opacity 0.2s;
        }

        .link-line.forward-ref {
            stroke-dasharray: 4 4;
        }

        .link-line.highlighted {
            stroke-opacity: 1;
            stroke-width: 2px;
        }
    </style>
</head>
<body>
    <div class="app">
        <header>
            <div class="logo">
                <div class="logo-icon">📦</div>
                <span>SMAE Modules</span>
            </div>
            
            <div class="view-modes">
                <button class="view-mode active" data-view="graph">Graph</button>
                <button class="view-mode" data-view="grid">Grid</button>
                <button class="view-mode" data-view="cycles">Cycles</button>
            </div>
            
            <div class="stats">
                <div class="stat">
                    <span class="stat-value" id="total-modules">0</span>
                    <span class="stat-label">modules</span>
                </div>
                <div class="stat">
                    <span class="stat-value" id="total-cycles">0</span>
                    <span class="stat-label">cycles</span>
                </div>
                <div class="stat">
                    <span class="stat-value" id="total-forward-refs">0</span>
                    <span class="stat-label">forwardRefs</span>
                </div>
            </div>
        </header>
        
        <aside class="sidebar">
            <div class="search-container">
                <input type="text" class="search-input" id="search" placeholder="Search modules...">
            </div>
            
            <div class="filter-section">
                <div class="filter-title">Quick Filters</div>
                <div class="filter-chips">
                    <button class="filter-chip" data-filter="all">All</button>
                    <button class="filter-chip" data-filter="cycles">
                        🔴 In Cycles
                        <span class="count" id="cycle-count"></span>
                    </button>
                    <button class="filter-chip" data-filter="forward-ref">
                        ↻ forwardRef
                        <span class="count" id="forward-ref-count"></span>
                    </button>
                </div>
            </div>
            
            <div class="module-list" id="module-list"></div>
        </aside>
        
        <main class="canvas-container">
            <svg id="graph-canvas"></svg>
            
            <div class="grid-view" id="grid-view"></div>
            <div class="cycle-view" id="cycle-view"></div>
            
            <div class="canvas-controls">
                <button class="canvas-btn" id="zoom-in" title="Zoom In">+</button>
                <button class="canvas-btn" id="zoom-out" title="Zoom Out">−</button>
                <button class="canvas-btn" id="zoom-fit" title="Fit to View">⊡</button>
                <button class="canvas-btn" id="zoom-reset" title="Reset">↺</button>
            </div>
            
            <div class="detail-panel" id="detail-panel">
                <div class="detail-header">
                    <div>
                        <div class="tooltip-name" id="detail-name"></div>
                        <div class="tooltip-path" id="detail-path"></div>
                    </div>
                    <button class="detail-close" id="detail-close">×</button>
                </div>
                <div class="detail-content" id="detail-content"></div>
            </div>
        </main>
    </div>
    
    <div class="tooltip" id="tooltip"></div>

    <script>
        const modulesData = ${JSON.stringify(nodesData, null, 2)};
        const cyclesData = ${JSON.stringify(cycles, null, 2)};
        const areaColors = ${JSON.stringify(areaColors)};

        // Build graph data
        const nodes = modulesData.map(m => ({
            ...m,
            color: areaColors[m.area] || '#64748b'
        }));

        const links = [];
        modulesData.forEach(mod => {
            mod.imports.forEach(imp => {
                if (modulesData.find(m => m.id === imp)) {
                    links.push({ source: imp, target: mod.id, type: 'regular' });
                }
            });
            mod.forwardRefs.forEach(ref => {
                if (modulesData.find(m => m.id === ref)) {
                    links.push({ source: ref, target: mod.id, type: 'forwardRef' });
                }
            });
        });

        // Update stats
        document.getElementById('total-modules').textContent = nodes.length;
        document.getElementById('total-cycles').textContent = cyclesData.length;
        document.getElementById('total-forward-refs').textContent = nodes.reduce((acc, n) => acc + n.forwardRefs.length, 0);
        document.getElementById('cycle-count').textContent = nodes.filter(n => n.inCycle).length;
        document.getElementById('forward-ref-count').textContent = nodes.filter(n => n.forwardRefs.length > 0).length;

        // Build sidebar
        function buildSidebar(filter = 'all', search = '') {
            const moduleList = document.getElementById('module-list');
            moduleList.innerHTML = '';

            let filteredNodes = nodes;
            if (filter === 'cycles') {
                filteredNodes = nodes.filter(n => n.inCycle);
            } else if (filter === 'forward-ref') {
                filteredNodes = nodes.filter(n => n.forwardRefs.length > 0);
            }

            if (search) {
                filteredNodes = filteredNodes.filter(n => 
                    n.id.toLowerCase().includes(search.toLowerCase())
                );
            }

            // Group by area
            const areas = {};
            filteredNodes.forEach(n => {
                if (!areas[n.area]) areas[n.area] = [];
                areas[n.area].push(n);
            });

            Object.entries(areas).sort((a, b) => b[1].length - a[1].length).forEach(([area, mods]) => {
                const group = document.createElement('div');
                group.className = 'area-group';
                
                const header = document.createElement('div');
                header.className = 'area-header';
                header.innerHTML = \`
                    <span class="chevron">▼</span>
                    <span class="area-dot" style="background: \${areaColors[area] || '#64748b'}"></span>
                    <span>\${area}</span>
                    <span style="margin-left: auto; opacity: 0.5">\${mods.length}</span>
                \`;
                
                const modulesCont = document.createElement('div');
                modulesCont.className = 'area-modules';
                
                mods.forEach(mod => {
                    const item = document.createElement('div');
                    item.className = 'module-item' + 
                        (mod.inCycle ? ' in-cycle' : '') +
                        (mod.forwardRefs.length > 0 ? ' has-forward-ref' : '');
                    item.textContent = mod.id.replace('Module', '');
                    item.dataset.module = mod.id;
                    item.addEventListener('click', () => selectModule(mod.id));
                    modulesCont.appendChild(item);
                });
                
                header.addEventListener('click', () => {
                    header.classList.toggle('collapsed');
                    modulesCont.classList.toggle('hidden');
                });
                
                group.appendChild(header);
                group.appendChild(modulesCont);
                moduleList.appendChild(group);
            });
        }

        // Initialize D3 graph
        const svg = d3.select('#graph-canvas');
        const container = document.querySelector('.canvas-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        svg.attr('viewBox', [0, 0, width, height]);

        const g = svg.append('g');

        // Zoom
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));

        svg.call(zoom);

        // Arrow markers
        svg.append('defs').selectAll('marker')
            .data(['regular', 'forwardRef'])
            .enter()
            .append('marker')
            .attr('id', d => \`arrow-\${d}\`)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 18)
            .attr('refY', 0)
            .attr('markerWidth', 5)
            .attr('markerHeight', 5)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', d => d === 'forwardRef' ? '#f97316' : '#64748b');

        // Force simulation
        const simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(40))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05));

        // Links
        const link = g.append('g')
            .selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('class', d => \`link-line \${d.type === 'forwardRef' ? 'forward-ref' : ''}\`)
            .attr('stroke', d => d.type === 'forwardRef' ? '#f97316' : '#4a5568')
            .attr('stroke-width', d => d.type === 'forwardRef' ? 1.5 : 1)
            .attr('marker-end', d => \`url(#arrow-\${d.type})\`);

        // Nodes
        const node = g.append('g')
            .selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('class', 'node-circle')
            .attr('r', d => 8 + Math.min((d.imports.length + d.forwardRefs.length) * 2, 8))
            .attr('fill', d => d.color)
            .attr('stroke', d => d.inCycle ? '#ef4444' : '#1a1a24')
            .attr('stroke-width', d => d.inCycle ? 3 : 2)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Labels
        const label = g.append('g')
            .selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'node-label')
            .attr('dx', 12)
            .attr('dy', 4)
            .text(d => d.id.replace('Module', ''));

        // Tooltip
        const tooltip = document.getElementById('tooltip');

        node.on('mouseover', function(event, d) {
            tooltip.innerHTML = \`
                <div class="tooltip-header">
                    <div class="tooltip-icon" style="background: \${d.color}">\${d.id.charAt(0)}</div>
                    <div>
                        <div class="tooltip-name">\${d.id}</div>
                        <div class="tooltip-path">\${d.path}</div>
                    </div>
                </div>
                <div class="tooltip-stats">
                    <div class="tooltip-stat">
                        <div class="tooltip-stat-value">\${d.imports.length}</div>
                        <div class="tooltip-stat-label">imports</div>
                    </div>
                    <div class="tooltip-stat">
                        <div class="tooltip-stat-value">\${d.forwardRefs.length}</div>
                        <div class="tooltip-stat-label">forwardRefs</div>
                    </div>
                </div>
                \${d.inCycle ? '<div class="tooltip-badge">⚠️ In Circular Dependency</div>' : ''}
            \`;
            tooltip.classList.add('visible');
            tooltip.style.left = event.pageX + 16 + 'px';
            tooltip.style.top = event.pageY + 16 + 'px';
        })
        .on('mouseout', () => tooltip.classList.remove('visible'))
        .on('click', (event, d) => selectModule(d.id));

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);

            label
                .attr('x', d => d.x)
                .attr('y', d => d.y);
        });

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Module selection
        let selectedModule = null;

        function selectModule(moduleId) {
            selectedModule = moduleId;
            const mod = nodes.find(n => n.id === moduleId);
            if (!mod) return;

            // Highlight in sidebar
            document.querySelectorAll('.module-item').forEach(item => {
                item.classList.toggle('selected', item.dataset.module === moduleId);
            });

            // Highlight in graph
            node.attr('opacity', d => {
                if (d.id === moduleId) return 1;
                if (mod.imports.includes(d.id) || mod.forwardRefs.includes(d.id)) return 1;
                if (d.imports.includes(moduleId) || d.forwardRefs.includes(moduleId)) return 1;
                return 0.2;
            });

            link.attr('stroke-opacity', d => {
                if (d.source.id === moduleId || d.target.id === moduleId) return 1;
                return 0.05;
            });

            label.attr('opacity', d => {
                if (d.id === moduleId) return 1;
                if (mod.imports.includes(d.id) || mod.forwardRefs.includes(d.id)) return 1;
                if (d.imports.includes(moduleId) || d.forwardRefs.includes(moduleId)) return 1;
                return 0.2;
            });

            // Show detail panel
            showDetailPanel(mod);

            // Center on node
            const x = mod.x || width/2;
            const y = mod.y || height/2;
            svg.transition().duration(500).call(
                zoom.transform,
                d3.zoomIdentity.translate(width/2, height/2).scale(1.5).translate(-x, -y)
            );
        }

        function clearSelection() {
            selectedModule = null;
            document.querySelectorAll('.module-item').forEach(item => {
                item.classList.remove('selected');
            });
            node.attr('opacity', 1);
            link.attr('stroke-opacity', 0.3);
            label.attr('opacity', 1);
            document.getElementById('detail-panel').classList.remove('visible');
        }

        function showDetailPanel(mod) {
            const panel = document.getElementById('detail-panel');
            document.getElementById('detail-name').textContent = mod.id;
            document.getElementById('detail-path').textContent = mod.path;

            const content = document.getElementById('detail-content');
            let html = '';

            if (mod.inCycle) {
                html += \`<div style="background: rgba(239,68,68,0.1); border: 1px solid var(--accent-red); border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 12px;">
                    <strong style="color: var(--accent-red)">⚠️ Circular Dependency</strong><br>
                    This module is part of a dependency cycle
                </div>\`;
            }

            if (mod.imports.length > 0) {
                html += \`<div class="detail-section">
                    <div class="detail-section-title">Imports (\${mod.imports.length})</div>
                    \${mod.imports.map(imp => \`
                        <div class="dep-item" onclick="selectModule('\${imp}')">
                            <span class="dep-arrow">←</span>
                            \${imp.replace('Module', '')}
                        </div>
                    \`).join('')}
                </div>\`;
            }

            if (mod.forwardRefs.length > 0) {
                html += \`<div class="detail-section">
                    <div class="detail-section-title">forwardRef (\${mod.forwardRefs.length})</div>
                    \${mod.forwardRefs.map(ref => \`
                        <div class="dep-item forward-ref" onclick="selectModule('\${ref}')">
                            <span class="dep-arrow">↻</span>
                            \${ref.replace('Module', '')}
                        </div>
                    \`).join('')}
                </div>\`;
            }

            // Find dependents
            const dependents = nodes.filter(n => 
                n.imports.includes(mod.id) || n.forwardRefs.includes(mod.id)
            );
            if (dependents.length > 0) {
                html += \`<div class="detail-section">
                    <div class="detail-section-title">Used By (\${dependents.length})</div>
                    \${dependents.map(dep => \`
                        <div class="dep-item" onclick="selectModule('\${dep.id}')">
                            <span class="dep-arrow">→</span>
                            \${dep.id.replace('Module', '')}
                        </div>
                    \`).join('')}
                </div>\`;
            }

            content.innerHTML = html;
            panel.classList.add('visible');
        }

        document.getElementById('detail-close').addEventListener('click', clearSelection);

        // Build grid view
        function buildGridView() {
            const gridView = document.getElementById('grid-view');
            const areas = {};
            nodes.forEach(n => {
                if (!areas[n.area]) areas[n.area] = [];
                areas[n.area].push(n);
            });

            gridView.innerHTML = Object.entries(areas)
                .sort((a, b) => b[1].length - a[1].length)
                .map(([area, mods]) => \`
                    <div class="grid-area">
                        <div class="grid-area-title">
                            <span class="area-dot" style="background: \${areaColors[area] || '#64748b'}"></span>
                            \${area}
                            <span style="opacity: 0.5; font-weight: 400">(\${mods.length})</span>
                        </div>
                        <div class="grid-modules">
                            \${mods.map(m => \`
                                <div class="grid-module \${m.inCycle ? 'in-cycle' : ''}" 
                                     onclick="selectModule('\${m.id}'); switchView('graph')">
                                    \${m.inCycle ? '<span style="color: var(--accent-red)">●</span>' : ''}
                                    \${m.id.replace('Module', '')}
                                    <span class="deps">\${m.imports.length + m.forwardRefs.length}</span>
                                </div>
                            \`).join('')}
                        </div>
                    </div>
                \`).join('');
        }

        // Build cycle view
        function buildCycleView() {
            const cycleView = document.getElementById('cycle-view');
            cycleView.innerHTML = cyclesData.map((cycle, i) => \`
                <div class="cycle-card">
                    <div class="cycle-header">
                        <div class="cycle-number">\${i + 1}</div>
                        <div class="cycle-title">\${cycle.length - 1} modules in cycle</div>
                    </div>
                    <div class="cycle-path">
                        \${cycle.map((mod, j) => \`
                            \${j > 0 ? '<span class="cycle-arrow">→</span>' : ''}
                            <span class="cycle-node" onclick="selectModule('\${mod}'); switchView('graph')">
                                \${mod.replace('Module', '')}
                            </span>
                        \`).join('')}
                    </div>
                </div>
            \`).join('');
        }

        // View switching
        function switchView(view) {
            document.querySelectorAll('.view-mode').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });

            document.getElementById('graph-canvas').style.display = view === 'graph' ? 'block' : 'none';
            document.getElementById('grid-view').classList.toggle('active', view === 'grid');
            document.getElementById('cycle-view').classList.toggle('active', view === 'cycles');
            document.querySelector('.canvas-controls').style.display = view === 'graph' ? 'flex' : 'none';
        }

        document.querySelectorAll('.view-mode').forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.dataset.view));
        });

        // Filter chips
        document.querySelectorAll('.filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                buildSidebar(chip.dataset.filter, document.getElementById('search').value);
            });
        });

        // Search
        document.getElementById('search').addEventListener('input', (e) => {
            const activeFilter = document.querySelector('.filter-chip.active')?.dataset.filter || 'all';
            buildSidebar(activeFilter, e.target.value);
        });

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => {
            svg.transition().duration(300).call(zoom.scaleBy, 1.5);
        });

        document.getElementById('zoom-out').addEventListener('click', () => {
            svg.transition().duration(300).call(zoom.scaleBy, 0.67);
        });

        document.getElementById('zoom-fit').addEventListener('click', () => {
            const bounds = g.node().getBBox();
            const dx = bounds.width, dy = bounds.height;
            const x = bounds.x + dx / 2, y = bounds.y + dy / 2;
            const scale = 0.8 / Math.max(dx / width, dy / height);
            const translate = [width / 2 - scale * x, height / 2 - scale * y];

            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        });

        document.getElementById('zoom-reset').addEventListener('click', () => {
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
            clearSelection();
        });

        // Initialize
        buildSidebar();
        buildGridView();
        buildCycleView();

        // Expose selectModule globally
        window.selectModule = selectModule;
        window.switchView = switchView;
    </script>
</body>
</html>`;
}

function main() {
    console.log('🔍 Parsing module files...');
    const modules = extractModules();
    
    console.log(`📦 Found ${modules.length} modules`);
    
    const forwardRefCount = modules.reduce((acc, m) => acc + m.forwardRefs.length, 0);
    console.log(`🔗 Found ${forwardRefCount} forwardRef dependencies`);
    
    console.log('\n🔍 Looking for circular dependencies...');
    const cycles = findCircularDependencies(modules);
    console.log(`⚠️  Found ${cycles.length} circular dependency chains`);
    
    // Generate HTML
    const outputDir = join(process.cwd(), 'dist-graph');
    try {
        mkdirSync(outputDir, { recursive: true });
    } catch (e) {}
    
    console.log('\n🎨 Generating interactive HTML viewer...');
    
    const html = generateHTML(modules, cycles);
    writeFileSync(join(outputDir, 'modules-viewer.html'), html);
    
    console.log('\n📊 Output files:');
    console.log('   - dist-graph/modules-viewer.html');
    console.log('\n💡 To view:');
    console.log('   Open dist-graph/modules-viewer.html in your browser');
    console.log('   Or serve with: npx serve dist-graph');
}

main();
