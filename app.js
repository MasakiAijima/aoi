const svg = d3.select("#viz");
const size = 350;

// レイヤーと順序を定義（円環の内外順）
const layers = ["Micro", "Affordance", "Impact", "Goal"];
const layerRadius = d3.scalePoint()
  .domain(layers)
  .range([size, 80]); // 外→内

// カテゴリ別色スケール
const categoryColor = d3.scaleOrdinal()
  .domain([
    "Natural", "Financial", "Manufactured", "Digital",
    "Human", "Social", "Political", "Cultural"
  ])
  .range([
    "#9ED2FF", "#AEEBD8", "#D8F5B0", "#FFD395",
    "#FFF3A0", "#FFCCA2", "#F4A9B8", "#D8C8FF"
  ]);

// データ読み込み → 描画関数へ
d3.json("data/infra.json").then(draw);

function polarToCartesian(angle, radius) {
  return [
    radius * Math.cos(angle - Math.PI / 2),
    radius * Math.sin(angle - Math.PI / 2)
  ];
}

function draw({ nodes, links }) {
  // 背景リングを描画（レイヤー数分）
  const ringG = svg.append("g").attr("class", "rings");
  layers.forEach((layer, i) => {
    ringG.append("circle")
      .attr("r", layerRadius(layer))
      .attr("fill", i % 2 === 0 ? "#ffffff" : "#f2f2f2");
  });

  // ノードをレイヤーごとにグループ化
  const nodesByLayer = d3.group(nodes, d => d.layer);

  // 各ノードに角度と位置を割り当て
  nodes.forEach(d => {
    const sameLayer = nodesByLayer.get(d.layer);
    const index = sameLayer.indexOf(d);
    const angle = 2 * Math.PI * index / sameLayer.length;
    d.angle = angle;
    d.radius = layerRadius(d.layer);
    [d.x, d.y] = polarToCartesian(angle, d.radius);
  });

  // リンク描画
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
    .attr("class", "link")
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 2)
    .attr("opacity", 0.4);

  // ノード描画
  const nodeG = svg.append("g")
    .attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .enter().append("g")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .attr("class", d => `node ${d.layer.toLowerCase()}`)
    .on("mouseover", highlight)
    .on("mouseout", clearHighlight);

  nodeG.append("circle")
    .attr("r", 6)
    .attr("fill", d => categoryColor(d.category))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  nodeG.append("text")
    .attr("dy", "0.35em")
    .text(d => d.id)
    .attr("text-anchor", d => (d.angle > Math.PI ? "end" : "start"))
    .attr("transform", d => {
      const rot = d.angle * 180 / Math.PI - 90;
      const offset = d.angle > Math.PI ? -12 : 12;
      return `rotate(${rot}) translate(${offset},0)`;
    });

  // 凡例
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${size + 60},${-size})`);

  categoryColor.domain().forEach((cat, i) => {
    const g = legend.append("g")
      .attr("transform", `translate(0, ${i * 24})`);
    g.append("circle")
      .attr("r", 8)
      .attr("fill", categoryColor(cat));
    g.append("text")
      .attr("x", 16)
      .attr("dy", "0.35em")
      .text(cat)
      .style("font-size", "12px");
  });
}

// ノード・リンクのハイライト処理
function highlight(event, d) {
  svg.selectAll(".link").classed("highlight", l =>
    l.source.id === d.id || l.target.id === d.id
  ).attr("stroke-opacity", l =>
    l.source.id === d.id || l.target.id === d.id ? 0.9 : 0.2
  );
  d3.select(this).classed("highlight", true);
}

function clearHighlight() {
  svg.selectAll(".highlight").classed("highlight", false)
    .attr("stroke-opacity", 0.4);
}
