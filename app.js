const svg  = d3.select("#viz");
const size = 350;                 // 半径
const layers = ["Micro", "Affordance", "Impact", "Goal"];
const layerRadius = d3.scalePoint()
  .domain(layers)
  .range([size, 80]);             // 外→内

// 各レイヤーの要素を配列で定義
const micro = [
  "東京湾マリーナ",
  "地下鉄駅",
  "住宅地"
];

const affordance = [
  "マリーナ内活動",
  "交通ハブ",
  "生活利便"
];

const impact = [
  "リズムのある街並み",
  "都市の回遊性向上",
  "コミュニティ活性"
];

const goal = [
  "自己実現ある暮らしの促進",
  "都市の持続可能性"
];

// 要素間の関連をリンクとして定義
const links = [
  { source: "東京湾マリーナ", target: "マリーナ内活動" },
  { source: "地下鉄駅",     target: "交通ハブ" },
  { source: "住宅地",       target: "生活利便" },

  { source: "マリーナ内活動", target: "リズムのある街並み" },
  { source: "交通ハブ",       target: "都市の回遊性向上" },
  { source: "生活利便",       target: "コミュニティ活性" },

  { source: "リズムのある街並み", target: "自己実現ある暮らしの促進" },
  { source: "都市の回遊性向上",   target: "都市の持続可能性" },
  { source: "コミュニティ活性",   target: "都市の持続可能性" }
];

// 各レイヤーの配列をまとめてノード化
const nodes = [
  ...micro.map(id => ({ id, layer: "Micro" })),
  ...affordance.map(id => ({ id, layer: "Affordance" })),
  ...impact.map(id => ({ id, layer: "Impact" })),
  ...goal.map(id => ({ id, layer: "Goal" }))
];

draw({ nodes, links });

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
