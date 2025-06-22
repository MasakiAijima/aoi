const svg = d3.select("#viz");
const size = 800; // increase overall radius for more spacing between nodes

// レイヤー構造（外側から内側へ）
const layers = ["Micro", "Affordance", "Impact", "Goal"];

// 各レイヤーの中心半径（白とグレーの帯の中央）
// 最内層の Goal は円の中心に配置する
const step = (size - 80) / (layers.length - 1);
const ringRadii = layers.map((_, i) => size - i * step);
const layerRadiusByName = {
  Micro: (ringRadii[0] + ringRadii[1]) / 2,
  Affordance: (ringRadii[1] + ringRadii[2]) / 2,
  Impact: (ringRadii[2] + ringRadii[3]) / 2,
  Goal: 0
};

// フォントサイズをレイヤー毎に指定
const fontSizeByLayer = {
  Micro: 12,
  Affordance: 14,
  Impact: 16,
  Goal: 18
};

// カテゴリごとの色設定
const categoryColor = d3.scaleOrdinal()
  .domain([
    "Natural", "Financial", "Manufactured", "Digital",
    "Human", "Social", "Political", "Cultural"
  ])
  .range([
    "#9ED2FF", "#AEEBD8", "#D8F5B0", "#FFD395",
    "#FFF3A0", "#FFCCA2", "#F4A9B8", "#D8C8FF"
  ]);

// データ読み込み
d3.json("data/infra.json").then(draw);

function polarToCartesian(angle, radius) {
  return [
    radius * Math.cos(angle - Math.PI / 2),
    radius * Math.sin(angle - Math.PI / 2)
  ];
}

function draw({ nodes, links }) {
  // 背景の同心円を描画
  const ringG = svg.append("g").attr("class", "rings");
  layers.forEach((layer, i) => {
    ringG.append("circle")
      .attr("r", ringRadii[i])
      .attr("fill", i % 2 === 0 ? "#ffffff" : "#f2f2f2");
  });

  // 各レイヤーごとのノードをグループ化して、角度を均等割当て
  const nodesByLayer = d3.group(nodes, d => d.layer);
  nodes.forEach(d => {
    const group = nodesByLayer.get(d.layer);
    const index = group.indexOf(d);
    const angle = 2 * Math.PI * index / group.length;
    d.angle = angle;
    d.radius = layerRadiusByName[d.layer];
    [d.x, d.y] = polarToCartesian(angle, d.radius);
  });

  // リンク描画
  const linkGen = d3.linkRadial()
    .angle(d => d.angle)
    .radius(d => d.radius);

  const filteredLinks = links.map(l => ({
      source: nodes.find(n => n.id === l.source),
      target: nodes.find(n => n.id === l.target)
    }))
    .filter(l => l.source && l.target);

  svg.append("g")
    .attr("class", "links")
    .selectAll("path")
    .data(filteredLinks)
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

  // ノードの丸
  nodeG.append("circle")
    .attr("r", 6)
    .attr("fill", d => categoryColor(d.category))
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5);

  // ノードのテキスト（常に横書き）
  nodeG.append("text")
    .text(d => d.display_name)
    .attr("dy", "-0.8em")
    .attr("text-anchor", "middle")
    .attr("fill", "#999")
    .style("font-size", d => `${fontSizeByLayer[d.layer]}px`)
    .style("pointer-events", "none");

  // 凡例
  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${size + 60},${-size})`);

  categoryColor.domain().forEach((cat, i) => {
    const g = legend.append("g").attr("transform", `translate(0, ${i * 24})`);
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

// ノード hover で強調
function highlight(event, d) {
  svg.selectAll(".link").classed("highlight", l =>
    l.source.id === d.id || l.target.id === d.id
  ).attr("stroke-opacity", l =>
    l.source.id === d.id || l.target.id === d.id ? 0.9 : 0.2
  );

  d3.select(this).classed("highlight", true);
  d3.select(this).select("text").attr("fill", "#000");
}

// hover 解除
function clearHighlight() {
  svg.selectAll(".highlight").classed("highlight", false)
    .attr("stroke-opacity", 0.4);
  svg.selectAll(".node text").attr("fill", "#999");
}
