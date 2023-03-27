import { axisBottom, scaleTime, select } from 'd3';

const prepareDataElement = ({
  id, label, startDate, endDate, duration, dependsOn,
}) => {
  if ((!startDate || !endDate) && !duration) {
    throw new Error('Wrong element format: should contain either startDate and duration, or endDate and duration or startDate and endDate');
  }

  startDate = startDate && startDate.getTime();
  endDate = endDate && endDate.getTime();

  if (startDate && !endDate && duration) {
    endDate = startDate + duration;
  }

  if (!startDate && endDate && duration) {
    startDate = endDate - duration;
  }

  if (!dependsOn) { dependsOn = []; }

  return {
    id,
    label,
    startDate,
    endDate,
    duration,
    dependsOn,
  };
};

const findDateBoundaries = (data) => {
  let minStartDate;
  let maxEndDate;

  data.forEach(({ startDate, endDate }) => {
    if (!minStartDate || startDate < minStartDate) minStartDate = startDate;

    if (!minStartDate || endDate < minStartDate) minStartDate = endDate;

    if (!maxEndDate || endDate > maxEndDate) maxEndDate = endDate;

    if (!maxEndDate || startDate > maxEndDate) maxEndDate = startDate;
  });

  return {
    minStartDate,
    maxEndDate,
  };
};

const createDataCacheById = (data) => data.reduce((cache, elt) => ({ ...cache, [elt.id]: elt }), {});

const createChildrenCache = (data) => {
  const dataCache = createDataCacheById(data);

  const fillDependenciesForElement = (eltId, dependenciesByParent) => {
    dataCache[eltId].dependsOn.forEach((parentId) => {
      if (!dependenciesByParent[parentId]) {
        dependenciesByParent[parentId] = [];
      }

      if (dependenciesByParent[parentId].indexOf(eltId) < 0) {
        dependenciesByParent[parentId].push(eltId);
      }

      fillDependenciesForElement(parentId, dependenciesByParent);
    });
  };

  return data.reduce((cache, elt) => {
    if (!cache[elt.id]) { cache[elt.id] = []; }

    fillDependenciesForElement(elt.id, cache);

    return cache;
  }, {});
};

const sortElementsByChildrenCount = (data) => {
  const childrenByParentId = createChildrenCache(data);

  return data.sort((e1, e2) => {
    if (childrenByParentId[e1.id] && childrenByParentId[e2.id] && childrenByParentId[e1.id].length > childrenByParentId[e2.id].length) {
      return -1;
    }
    return 1;
  });
};

const sortElementsByEndDate = (data) => data.sort((e1, e2) => {
  if (e1.endDate < e2.endDate) return -1;
  return 1;
});

const sortElements = (data, sortMode) => {
  if (sortMode === 'childrenCount') {
    return sortElementsByChildrenCount(data);
  } if (sortMode === 'date') {
    return sortElementsByEndDate(data);
  }
};

const parseUserData = (data) => data.map(prepareDataElement);

const createPolylineData = (rectangleData, elementHeight) => {
  // prepare dependencies polyline data
  const cachedData = createDataCacheById(rectangleData);

  // used to calculate offsets between elements later
  const storedConnections = rectangleData.reduce((acc, e) => ({ ...acc, [e.id]: 0 }), {});

  // create data describing connections' lines
  return rectangleData.flatMap((d) => d.dependsOn
    .map((parentId) => cachedData[parentId])
    .map((parent) => {
      const color = `#${(Math.max(0.1, Math.min(0.9, Math.random())) * 0xFFF << 0).toString(16)}`;

      // increase the amount rows occupied by both parent and current element (d)
      storedConnections[parent.id]++;
      storedConnections[d.id]++;

      const deltaParentConnections = storedConnections[parent.id] * (elementHeight / 4);
      const deltaChildConnections = storedConnections[d.id] * (elementHeight / 4);

      const points = [
        d.x, (d.y + (elementHeight / 2)),
        d.x - deltaChildConnections, (d.y + (elementHeight / 2)),
        d.x - deltaChildConnections, (d.y - (elementHeight * 0.25)),
        parent.xEnd + deltaParentConnections, (d.y - (elementHeight * 0.25)),
        parent.xEnd + deltaParentConnections, (parent.y + (elementHeight / 2)),
        parent.xEnd, (parent.y + (elementHeight / 2)),
      ];

      let strokeDash = '0';
      let stroke = color;

      if (d.errors.length > 0) {
        strokeDash = '3';
        stroke = '#d33';
      }

      return {
        points: points.join(','),
        stroke,
        strokeDash,
      };
    }));
};

const createElementData = (data, elementHeight, xScale, fontSize) => data.map((d, i) => {
  const x = xScale(d.startDate);
  const xEnd = xScale(d.endDate);
  const y = i * elementHeight * 1.5;
  const width = xEnd - x;
  const height = elementHeight;

  const charWidth = (width / fontSize);
  const { dependsOn } = d;
  const { id } = d;

  const tooltip = d.label;

  const singleCharWidth = fontSize * 0.5;
  const singleCharHeight = fontSize * 0.45;

  let { label } = d;

  if (label.length > charWidth) {
    label = `${label.split('').slice(0, charWidth - 3).join('')}...`;
  }

  const labelX = x + ((width / 2) - ((label.length / 2) * singleCharWidth));
  const labelY = y + ((height / 2) + (singleCharHeight));

  const { errors } = d;

  return {
    x,
    y,
    xEnd,
    width,
    height,
    id,
    dependsOn,
    label,
    labelX,
    labelY,
    tooltip,
    errors,
  };
});

const createChartSVG = (data, placeholder, {
  svgWidth,
  svgHeight,
  elementHeight,
  scaleWidth,
  fontSize,
  minStartDate,
  maxEndDate,
  margin,
  showRelations,
}) => {
  // create container element for the whole chart
  const svg = select(placeholder).append('svg').attr('width', svgWidth).attr('height', svgHeight);

  // error style
  svg.append('pattern')
    .attr('id', 'error-fill')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', '4')
    .attr('height', '4')
    .append('path')
    .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
    .style('stroke', '#d33')
    .style('stroke-width', '1');

  const xScale = scaleTime()
    .domain([minStartDate, maxEndDate])
    .range([0, scaleWidth]);

  // prepare data for every data element
  const rectangleData = createElementData(data, elementHeight, xScale, fontSize);

  const xAxis = axisBottom(xScale);

  // create container for the data
  const g1 = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // add milestone relationship lines to the SVG
  if (showRelations) {
    // create data describing connections' lines
    const polylineData = createPolylineData(rectangleData, elementHeight);

    const linesContainer = g1.append('g').attr('transform', `translate(0,${margin.top})`);

    linesContainer
      .selectAll('polyline')
      .data(polylineData)
      .enter()
      .append('polyline')
      .style('fill', 'none')
      .style('stroke', (d) => d.stroke)
      .style('stroke-dasharray', (d) => d.strokeDash)
      .attr('points', (d) => d.points);
  }

  const grid = g1.append('g');

  grid
    .selectAll('rect')
    .data(xScale.ticks())
    .enter()
    .append('rect')
    .attr('x', (d, i) => xScale(d))
    .attr('y', 0)
    .attr('height', svgHeight)
    .attr('width', (d, i) => svgWidth / xScale.ticks().length)
    .style('fill', (d, i) => (i % 2 ? '#dedede30' : '#dedede00'));

  const nowOnScale = xScale(Date.now());

  if (nowOnScale >= xScale.range()[0] && nowOnScale <= xScale.range()[1]) {
    grid
      .append('line')
      .attr('x1', nowOnScale)
      .attr('y1', 0)
      .attr('x2', nowOnScale)
      .attr('y2', svgHeight)
      .style('stroke', 'rgb(232, 102, 102)')
      .style('stroke-width', 3);
  }

  g1.append('g').call(xAxis);

  // append milestones only after we have rendered the connections to prevent
  // lines overlapping the milestones
  const barsContainer = g1.append('g').attr('transform', `translate(0,${margin.top})`);

  // create axes
  const bars = barsContainer
    .selectAll('g')
    .data(rectangleData)
    .enter()
    .append('g');

  bars
    .append('rect')
    .attr('rx', elementHeight / 2)
    .attr('ry', elementHeight / 2)
    .attr('x', (d) => d.x)
    .attr('y', (d) => d.y)
    .attr('width', (d) => d.width)
    .attr('height', (d) => d.height)
    .style('fill', (d) => (d.errors.length > 0 ? 'url(#error-fill)' : '#ddd'))
    .style('stroke', 'black');

  bars
    .append('text')
    .style('fill', 'black')
    .style('font-family', 'sans-serif')
    .attr('x', (d) => d.labelX)
    .attr('y', (d) => d.labelY)
    .text((d) => d.label);

  bars
    .append('title')
    .text((d) => d.tooltip);
};

const detectConflicts = (data) => {
  const dataCache = createDataCacheById(data);

  return data.map((milestone) => {
    const errorousDependencies = milestone.dependsOn
      .filter((dependencyId) => dataCache[dependencyId].startDate >= milestone.startDate); milestone.errors = (milestone.errors || [])
      .concat(errorousDependencies
        .map((errorId) => `Dependency ${errorId} must end before this milestone`));
    return milestone;
  });
};

export const createGanttChart = (placeholder, data, {
  elementHeight, sortMode = 'date', showRelations = true, svgOptions,
}) => {
  // prepare data
  const margin = (svgOptions && svgOptions.margin) || {
    top: elementHeight * 2,
    left: elementHeight * 2,
  };

  const scaleWidth = ((svgOptions && svgOptions.width) || 600) - (margin.left * 2);
  const scaleHeight = Math.max((svgOptions && svgOptions.height) || 200, data.length * elementHeight * 2) - (margin.top * 2);

  const svgWidth = scaleWidth + (margin.left * 2);
  const svgHeight = scaleHeight + (margin.top * 2);

  const fontSize = (svgOptions && svgOptions.fontSize) || 12;

  data = parseUserData(data); // transform raw user data to valid values
  data = sortElements(data, sortMode);
  data = detectConflicts(data);

  let { minStartDate, maxEndDate } = findDateBoundaries(data);

  // add some padding to axes
  minStartDate -= 2 * 24 * 60 * 60 * 1000;
  maxEndDate += 2 * 24 * 60 * 60 * 1000;

  createChartSVG(data, placeholder, {
    svgWidth, svgHeight, scaleWidth, elementHeight, scaleHeight, fontSize, minStartDate, maxEndDate, margin, showRelations,
  });
};
