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

function generateHTML(modules: ModuleNode[], cycles: string[][]): string {
    const modulesInCycles = new Set<string>();
    for (const cycle of cycles) {
        for (const mod of cycle) modulesInCycles.add(mod);
    }

    // Group by area
    const areas = new Map<string, ModuleNode[]>();
    for (const mod of modules) {
        if (!areas.has(mod.area)) areas.set(mod.area, []);
        areas.get(mod.area)!.push(mod);
    }

    // Generate nodes data
    const nodesData = modules.map(m => ({
        id: m.name,
        area: m.area,
        inCycle: modulesInCycles.has(m.name),
        forwardRefCount: m.forwardRefs.length,
        importCount: m.imports.length,
        path: m.path
    }));

    // Generate links data
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

    // Area colors
    const areaColors = [
        '#e3f2fd', '#f3e5f5', '#e8f5e9', '#fff3e0', '#fce4ec',
        '#e0f2f1', '#f1f8e9', '#fff8e1', '#efebe9', '#e8eaf6'
    ];

    const areaColorMap: Record<string, string> = {};
    Array.from(areas.keys()).forEach((area, i) => {
        areaColorMap[area] = areaColors[i % areaColors.length];
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMAE Module Dependencies</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            overflow: hidden;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        .sidebar {
            width: 320px;
            background: white;
            border-right: 1px solid #ddd;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .sidebar-header {
            padding: 16px;
            background: #1976d2;
            color: white;
        }
        
        .sidebar-header h1 {
            font-size: 18px;
            margin-bottom: 8px;
        }
        
        .stats {
            display: flex;
            gap: 16px;
            font-size: 12px;
            opacity: 0.9;
        }
        
        .search-box {
            padding: 12px 16px;
            border-bottom: 1px solid #eee;
        }
        
        .search-box input {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .area-list {
            flex: 1;
            overflow-y: auto;
            padding: 8px;
        }
        
        .area-section {
            margin-bottom: 8px;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .area-header {
            padding: 10px 12px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
        }
        
        .area-header:hover {
            filter: brightness(0.95);
        }
        
        .area-header.collapsed::after {
            content: '▶';
            font-size: 10px;
        }
        
        .area-header::after {
            content: '▼';
            font-size: 10px;
        }
        
        .module-list {
            max-height: 300px;
            overflow-y: auto;
            background: white;
        }
        
        .module-item {
            padding: 6px 12px 6px 24px;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .module-item:hover {
            background: #f5f5f5;
        }
        
        .module-item.highlighted {
            background: #fff3cd;
        }
        
        .module-item.in-cycle {
            color: #d32f2f;
        }
        
        .cycle-badge {
            background: #d32f2f;
            color: white;
            font-size: 9px;
            padding: 1px 4px;
            border-radius: 3px;
            margin-left: auto;
        }
        
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .toolbar {
            padding: 12px 16px;
            background: white;
            border-bottom: 1px solid #ddd;
            display: flex;
            gap: 12px;
            align-items: center;
        }
        
        .toolbar button {
            padding: 6px 12px;
            border: 1px solid #ddd;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
        }
        
        .toolbar button:hover {
            background: #f5f5f5;
        }
        
        .toolbar button.active {
            background: #1976d2;
            color: white;
            border-color: #1976d2;
        }
        
        .legend {
            display: flex;
            gap: 16px;
            margin-left: auto;
            font-size: 12px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .legend-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        
        #graph-container {
            flex: 1;
            overflow: hidden;
            background: #fafafa;
            cursor: grab;
        }
        
        #graph-container:active {
            cursor: grabbing;
        }
        
        .tooltip {
            position: absolute;
            padding: 12px;
            background: rgba(0,0,0,0.9);
            color: white;
            border-radius: 6px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            max-width: 300px;
            z-index: 1000;
        }
        
        .tooltip.visible {
            opacity: 1;
        }

        .node-label {
            font-size: 10px;
            pointer-events: none;
            fill: #333;
        }

        .link {
            stroke-opacity: 0.4;
        }

        .link.forward-ref {
            stroke-dasharray: 4,4;
        }

        .node {
            cursor: pointer;
            stroke: #fff;
            stroke-width: 2px;
        }

        .node:hover {
            stroke: #1976d2;
            stroke-width: 3px;
        }

        .node.in-cycle {
            stroke: #d32f2f;
            stroke-width: 3px;
        }

        .node.highlighted {
            stroke: #ff9800;
            stroke-width: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <aside class="sidebar">
            <div class="sidebar-header">
                <h1>📦 Module Dependencies</h1>
                <div class="stats">
                    <span>${modules.length} modules</span>
                    <span>${cycles.length} cycles</span>
                </div>
            </div>
            <div class="search-box">
                <input type="text" id="searchInput" placeholder="Search modules...">
            </div>
            <div class="area-list" id="areaList"></div>
        </aside>
        
        <main class="main-content">
            <div class="toolbar">
                <button id="resetZoom">Reset View</button>
                <button id="fitToScreen">Fit to Screen</button>
                <button id="toggleCycles" class="active">Show Cycles</button>
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-dot" style="background: #1976d2;"></div>
                        <span>Regular import</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot" style="background: #d32f2f;"></div>
                        <span>forwardRef</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-dot" style="background: #ff9800; border: 2px solid #d32f2f;"></div>
                        <span>In cycle</span>
                    </div>
                </div>
            </div>
            <div id="graph-container"></div>
        </main>
    </div>
    
    <div class="tooltip" id="tooltip"></div>

    <script>
        const modulesData = ${JSON.stringify(nodesData, null, 2)};
        const linksData = ${JSON.stringify(linksData, null, 2)};
        const areaColorMap = ${JSON.stringify(areaColorMap)};
        const cycles = ${JSON.stringify(cycles)};

        // D3 setup
        const container = document.getElementById('graph-container');
        const width = container.clientWidth;
        const height = container.clientHeight;

        const svg = d3.select('#graph-container')
            .append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', [0, 0, width, height]);

        // Add zoom behavior
        const g = svg.append('g');
        
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Arrow markers
        svg.append('defs').selectAll('marker')
            .data(['regular', 'forwardRef'])
            .enter()
            .append('marker')
            .attr('id', d => \`arrow-\${d}\`)
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', d => d === 'forwardRef' ? '#d32f2f' : '#666');

        // Simulation
        const simulation = d3.forceSimulation(modulesData)
            .force('link', d3.forceLink(linksData).id(d => d.id).distance(80))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(35))
            .force('x', d3.forceX(width / 2).strength(0.05))
            .force('y', d3.forceY(height / 2).strength(0.05));

        // Draw links
        const link = g.append('g')
            .selectAll('line')
            .data(linksData)
            .enter()
            .append('line')
            .attr('class', d => \`link \${d.type === 'forwardRef' ? 'forward-ref' : ''}\`)
            .attr('stroke', d => d.type === 'forwardRef' ? '#d32f2f' : '#666')
            .attr('stroke-width', d => d.type === 'forwardRef' ? 2 : 1)
            .attr('marker-end', d => \`url(#arrow-\${d.type})\`);

        // Draw nodes
        const node = g.append('g')
            .selectAll('circle')
            .data(modulesData)
            .enter()
            .append('circle')
            .attr('class', d => \`node \${d.inCycle ? 'in-cycle' : ''}\`)
            .attr('r', d => 8 + Math.min(d.importCount + d.forwardRefCount, 10))
            .attr('fill', d => areaColorMap[d.area] || '#e3f2fd')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // Node labels
        const label = g.append('g')
            .selectAll('text')
            .data(modulesData)
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
                <strong>\${d.id}</strong><br>
                Area: \${d.area}<br>
                Imports: \${d.importCount}<br>
                forwardRefs: \${d.forwardRefCount}<br>
                \${d.inCycle ? '<span style="color:#ff9800">⚠️ In circular dependency</span>' : ''}
            \`;
            tooltip.classList.add('visible');
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY + 10 + 'px';
        })
        .on('mouseout', () => tooltip.classList.remove('visible'));

        // Update positions
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

        // Drag functions
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

        // Toolbar buttons
        document.getElementById('resetZoom').onclick = () => {
            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity
            );
        };

        document.getElementById('fitToScreen').onclick = () => {
            const bounds = g.node().getBBox();
            const parent = svg.node().parentElement;
            const fullWidth = parent.clientWidth;
            const fullHeight = parent.clientHeight;
            const width = bounds.width;
            const height = bounds.height;
            const midX = bounds.x + width / 2;
            const midY = bounds.y + height / 2;
            
            if (width === 0 || height === 0) return;
            
            const scale = 0.8 / Math.max(width / fullWidth, height / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

            svg.transition().duration(750).call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        };

        let showingCycles = true;
        document.getElementById('toggleCycles').onclick = function() {
            showingCycles = !showingCycles;
            this.classList.toggle('active');
            
            node.style('opacity', d => {
                if (!showingCycles) return 1;
                return d.inCycle ? 1 : 0.3;
            });
            
            link.style('opacity', d => {
                if (!showingCycles) return 0.4;
                const sourceInCycle = modulesData.find(m => m.id === d.source.id)?.inCycle;
                const targetInCycle = modulesData.find(m => m.id === d.target.id)?.inCycle;
                return (sourceInCycle && targetInCycle) ? 0.6 : 0.1;
            });
        };

        // Build area list
        const areaList = document.getElementById('areaList');
        const areaGroups = {};
        
        modulesData.forEach(m => {
            if (!areaGroups[m.area]) areaGroups[m.area] = [];
            areaGroups[m.area].push(m);
        });

        Object.entries(areaGroups).sort((a, b) => b[1].length - a[1].length).forEach(([area, mods]) => {
            const section = document.createElement('div');
            section.className = 'area-section';
            section.innerHTML = \`
                <div class="area-header" style="background: \${areaColorMap[area]}">
                    <span>\${area} (\${mods.length})</span>
                </div>
                <div class="module-list">
                    \${mods.map(m => \`
                        <div class="module-item \${m.inCycle ? 'in-cycle' : ''}" data-module="\${m.id}">
                            <span>\${m.id.replace('Module', '')}</span>
                            \${m.inCycle ? '<span class="cycle-badge">CYCLE</span>' : ''}
                        </div>
                    \`).join('')}
                </div>
            \`;
            
            const header = section.querySelector('.area-header');
            const list = section.querySelector('.module-list');
            
            header.addEventListener('click', () => {
                header.classList.toggle('collapsed');
                list.style.display = list.style.display === 'none' ? 'block' : 'none';
            });
            
            section.querySelectorAll('.module-item').forEach(item => {
                item.addEventListener('click', () => {
                    const moduleName = item.dataset.module;
                    const moduleData = modulesData.find(m => m.id === moduleName);
                    
                    if (moduleData) {
                        // Highlight node
                        node.classed('highlighted', d => d.id === moduleName);
                        
                        // Center view on node
                        svg.transition().duration(750).call(
                            zoom.transform,
                            d3.zoomIdentity
                                .translate(width / 2, height / 2)
                                .scale(1.5)
                                .translate(-moduleData.x, -moduleData.y)
                        );
                    }
                });
            });
            
            areaList.appendChild(section);
        });

        // Search functionality
        document.getElementById('searchInput').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            
            document.querySelectorAll('.module-item').forEach(item => {
                const name = item.dataset.module.toLowerCase();
                item.style.display = name.includes(term) ? 'flex' : 'none';
            });
            
            if (term) {
                const matches = modulesData.filter(m => m.id.toLowerCase().includes(term));
                node.style('opacity', d => matches.find(m => m.id === d.id) ? 1 : 0.1);
                link.style('opacity', 0.05);
            } else {
                node.style('opacity', 1);
                link.style('opacity', d => d.type === 'forwardRef' ? 0.6 : 0.4);
            }
        });
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
