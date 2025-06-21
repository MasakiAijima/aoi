const svg  = d3.select("#viz");
const size = 350;                 // 半径
const layers = ["Micro", "Affordance", "Impact", "Goal"];
const layerRadius = d3.scalePoint()
  .domain(layers)
  .range([size, 80]);             // 外→内

d3.json("data/infra.json").then(draw);

function polarToCartesian(angle, radius) {
  return [radius * Math.cos(angle - Math.PI/2),
          radius * Math.sin(angle - Math.PI/2)];
}

function draw({nodes, links}) {
  // 1. 各 layer ごとに配列を作り、角度を均等割り当て
  const nodesByLayer = d3.group(nodes, d => d.layer);
  nodes.forEach(d => {
    const siblings = nodesByLayer.get(d.layer);
    const idx = siblings.indexOf(d);
    const angle = 2 * Math.PI * idx / siblings.length;
    d.angle = angle;
    d.radius = layerRadius(d.layer);
    [d.x, d.y] = polarToCartesian(angle, d.radius);
  });

  // 2. リンク描画
  const linkGen = d3.linkRadial()
    .angle(d => d.angle)
    .radius(d => d.radius);

  svg.append("g")
     .attr("class", "links")
     .selectAll("path")
     .data(links.map(l => ({
       source: nodes.find(n => n.id === l.source),
       target: nodes.find(n => n.id === l.target)
     })))
     .enter().append("path")
       .attr("d", linkGen)
       .attr("class", "link");

  // 3. ノード描画
  const nodeG = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .enter().append("g")
      .attr("transform", d => `translate(${d.x},${d.y})`)
      .attr("class", d => `node ${d.layer.toLowerCase()}`)
      .on("mouseover", highlight)
      .on("mouseout", clearHighlight);

  nodeG.append("circle");
  nodeG.append("text")
       .attr("dy", "0.35em")
       .text(d => d.id)
       // 表裏を自動反転して読みやすく
       .attr("text-anchor", d => (d.angle > Math.PI ? "end" : "start"))
       .attr("transform", d => {
         const rot = d.angle * 180/Math.PI - 90;
         return `rotate(${rot}) translate(${d.angle > Math.PI ? -12 : 12},0)`;
       });
}

function highlight(event, d) {
  svg.selectAll(".link").classed("highlight", l =>
    l.source === d || l.target === d
  );
  d3.select(this).classed("highlight", true);
}

function clearHighlight() {
  svg.selectAll(".highlight").classed("highlight", false);
}
