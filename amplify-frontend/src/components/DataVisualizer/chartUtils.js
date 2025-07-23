export function generateChartOptions(chartType, mappings, dataset) {
  if (!dataset || !dataset.length) {
    return {};
  }

  const { x, y, color, size } = mappings;
  
  switch (chartType) {
    case 'bar':
      return generateBarOptions(x, y, dataset);
    case 'line':
      return generateLineOptions(x, y, dataset);
    case 'scatter':
      return generateScatterOptions(x, y, color, size, dataset);
    case 'pie':
      return generatePieOptions(x, y, dataset);
    case 'box':
      return generateBoxOptions(x, y, dataset);
    default:
      return {};
  }
}

function generateBarOptions(x, y, dataset) {
  if (!x || !y) return {};

  const xData = [...new Set(dataset.map(d => d[x]))];
  const yData = xData.map(xVal => {
    const items = dataset.filter(d => d[x] === xVal);
    return items.reduce((sum, item) => sum + Number(item[y]), 0) / items.length;
  });

  return {
    xAxis: {
      type: 'category',
      data: xData,
    },
    yAxis: {
      type: 'value',
    },
    series: [{
      data: yData,
      type: 'bar',
    }],
  };
}

function generateLineOptions(x, y, dataset) {
  if (!x || !y) return {};

  const sortedData = [...dataset].sort((a, b) => a[x] - b[x]);
  const xData = sortedData.map(d => d[x]);
  const yData = sortedData.map(d => d[y]);

  return {
    xAxis: {
      type: 'category',
      data: xData,
    },
    yAxis: {
      type: 'value',
    },
    series: [{
      data: yData,
      type: 'line',
      smooth: true,
    }],
  };
}

function generateScatterOptions(x, y, color, size, dataset) {
  if (!x || !y) return {};

  const data = dataset.map(d => ({
    value: [d[x], d[y], color ? d[color] : undefined, size ? d[size] : undefined],
  }));

  return {
    xAxis: { type: 'value' },
    yAxis: { type: 'value' },
    series: [{
      type: 'scatter',
      data,
      symbolSize: size ? (data) => data.value[3] : 10,
    }],
  };
}

function generatePieOptions(x, y, dataset) {
  if (!x || !y) return {};

  const aggregatedData = dataset.reduce((acc, curr) => {
    const key = curr[x];
    if (!acc[key]) {
      acc[key] = { value: 0, count: 0 };
    }
    acc[key].value += Number(curr[y]);
    acc[key].count += 1;
    return acc;
  }, {});

  const data = Object.entries(aggregatedData).map(([name, { value, count }]) => ({
    name,
    value: value / count,
  }));

  return {
    series: [{
      type: 'pie',
      radius: '50%',
      data,
    }],
  };
}

function generateBoxOptions(x, y, dataset) {
  if (!x || !y) return {};

  const groupedData = dataset.reduce((acc, curr) => {
    const key = curr[x];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(Number(curr[y]));
    return acc;
  }, {});

  const data = Object.entries(groupedData).map(([category, values]) => {
    values.sort((a, b) => a - b);
    const q1 = values[Math.floor(values.length * 0.25)];
    const median = values[Math.floor(values.length * 0.5)];
    const q3 = values[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const min = Math.max(q1 - 1.5 * iqr, values[0]);
    const max = Math.min(q3 + 1.5 * iqr, values[values.length - 1]);

    return [category, min, q1, median, q3, max];
  });

  return {
    xAxis: {
      type: 'category',
      data: data.map(d => d[0]),
    },
    yAxis: {
      type: 'value',
    },
    series: [{
      type: 'boxplot',
      data: data.map(d => d.slice(1)),
    }],
  };
}
