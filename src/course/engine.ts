// @ts-nocheck
// Course engine ported from Stats Study Lab (stats-lab-assets): math, dataset, charts, widgets,
// and the Week 1–6 lessons + practice generators. Lesson text is HTML; render it inside `.lab`.

/* =========================================================================
   MATH: normal and t distributions, descriptive statistics
   ========================================================================= */
const M = (() => {
  const erfc = z => {
    const x = Math.abs(z), t = 1 / (1 + 0.5 * x);
    const r = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
    return z >= 0 ? r : 2 - r;
  };
  const phi = z => 0.5 * erfc(-z / Math.SQRT2);
  const npdf = z => Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
  const lgamma = x => {
    const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp);
    let s = 1.000000000190015; for (const c of g) s += c / ++y;
    return -tmp + Math.log(2.5066282746310005 * s / x);
  };
  const betacf = (a, b, x) => {
    const FP = 1e-30; let qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
    if (Math.abs(d) < FP) d = FP; d = 1 / d; let h = d;
    for (let m = 1; m <= 300; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((qam + m2) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; h *= d * c;
      aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
      d = 1 + aa * d; if (Math.abs(d) < FP) d = FP; c = 1 + aa / c; if (Math.abs(c) < FP) c = FP; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-14) break;
    }
    return h;
  };
  const ibeta = (a, b, x) => {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
    return x < (a + 1) / (a + b + 2) ? bt * betacf(a, b, x) / a : 1 - bt * betacf(b, a, 1 - x) / b;
  };
  const tcdf = (t, v) => { const p = 0.5 * ibeta(v / 2, 0.5, v / (v + t * t)); return t >= 0 ? 1 - p : p; };
  const tpdf = (t, v) => Math.exp(lgamma((v + 1) / 2) - lgamma(v / 2)) / Math.sqrt(v * Math.PI) * Math.pow(1 + t * t / v, -(v + 1) / 2);
  const invert = (f, p) => { let lo = -80, hi = 80; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; f(mid) < p ? lo = mid : hi = mid; } return (lo + hi) / 2; };
  const invphi = p => invert(phi, p);
  const tinv = (p, v) => invert(t => tcdf(t, v), p);
  /* chi-square and F: regularized incomplete gamma, CDFs, PDFs and inverses */
  const gser = (a, x) => { let ap = a, del = 1 / a, sm = del; for (let n = 0; n < 1000; n++) { ap++; del *= x / ap; sm += del; if (Math.abs(del) < Math.abs(sm) * 1e-15) break; } return sm * Math.exp(-x + a * Math.log(x) - lgamma(a)); };
  const gcf = (a, x) => { const FP = 1e-300; let b = x + 1 - a, c = 1 / FP, d = 1 / b, h = d; for (let i = 1; i < 1000; i++) { const an = -i * (i - a); b += 2; d = an * d + b; if (Math.abs(d) < FP) d = FP; c = b + an / c; if (Math.abs(c) < FP) c = FP; d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-15) break; } return Math.exp(-x + a * Math.log(x) - lgamma(a)) * h; };
  const gammaP = (a, x) => x <= 0 ? 0 : x < a + 1 ? gser(a, x) : 1 - gcf(a, x);
  const chi2cdf = (x, k) => gammaP(k / 2, x / 2);
  const chi2pdf = (x, k) => x <= 0 ? 0 : Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lgamma(k / 2));
  const fcdf = (x, m, n) => x <= 0 ? 0 : ibeta(m / 2, n / 2, m * x / (m * x + n));
  const fpdf = (x, m, n) => x <= 0 ? 0 : Math.exp(0.5 * (m * Math.log(m * x) + n * Math.log(n) - (m + n) * Math.log(m * x + n)) - Math.log(x) - (lgamma(m / 2) + lgamma(n / 2) - lgamma((m + n) / 2)));
  const invPos = (fn, p) => { let lo = 0, hi = 1; while (fn(hi) < p && hi < 1e7) hi *= 2; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; fn(mid) < p ? lo = mid : hi = mid; } return (lo + hi) / 2; };
  const chi2inv = (p, k) => invPos(x => chi2cdf(x, k), p);
  const finv = (p, m, n) => invPos(x => fcdf(x, m, n), p);
  /* quartiles: Excel QUARTILE.INC (position 1 + (n − 1)p), QUARTILE.EXC (position (n + 1)p) and Tukey's halves */
  const sorted = a => [...a].sort((x, y) => x - y);
  const atPos = (s, h) => { h = Math.max(1, Math.min(s.length, h)); const lo = Math.floor(h); return lo >= s.length ? s[s.length - 1] : s[lo - 1] + (h - lo) * (s[lo] - s[lo - 1]); };
  const qInc = (a, p) => atPos(sorted(a), 1 + (a.length - 1) * p);
  const qExc = (a, p) => atPos(sorted(a), (a.length + 1) * p);
  const sum = a => a.reduce((s, x) => s + x, 0);
  const mean = a => sum(a) / a.length;
  const median = a => { const s = [...a].sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
  const ss = a => { const m = mean(a); return sum(a.map(x => (x - m) ** 2)); };
  const varS = a => ss(a) / (a.length - 1), varP = a => ss(a) / a.length;
  const tukey = a => { const s = sorted(a), n = s.length, h = Math.floor(n / 2); return [median(s.slice(0, h)), median(s.slice(n - h))]; };
  return { phi, npdf, tcdf, tpdf, invphi, tinv, chi2cdf, chi2pdf, chi2inv, fcdf, fpdf, finv, qInc, qExc, tukey, mean, median, ss, varS, varP, sdS: a => Math.sqrt(varS(a)), sdP: a => Math.sqrt(varP(a)), sum };
})();

/* =========================================================================
   DATASET (Week 1/Data.xlsx, 60 students) – used only in Practice › Apply to dataset
   columns: id, age, gender, method, job, stress, study, sleep, attend, grade, pass
   ========================================================================= */
const RAW = [["S001",19,"Male","Solo","No","Medium",9.5,6.9,85,68,"Pass"],["S002",18,"Female","Tutoring","No","Low",16,8.3,98,94,"Pass"],["S003",20,"Male","Group","No","Medium",8.5,6.7,81,65,"Pass"],["S004",20,"Male","Tutoring","No","Low",15,8.1,96,91,"Pass"],["S005",19,"Female","OnlineResources","No","Low",13,7.9,94,84,"Pass"],["S006",22,"Male","Group","Yes","Medium",7.5,6.3,77,58,"Pass"],["S007",20,"Male","Group","Yes","Medium",8.5,6.5,82,66,"Pass"],["S008",20,"Female","Solo","Yes","High",4,5.4,60,42,"Fail"],["S009",20,"Female","Solo","No","Medium",8,6.9,83,67,"Pass"],["S010",21,"Male","Solo","Yes","Low",10,7,86,72,"Pass"],["S011",18,"Male","Tutoring","No","Medium",13,7,93,83,"Pass"],["S012",20,"Female","Tutoring","No","Low",14,8,95,88,"Pass"],["S013",21,"Female","Tutoring","Yes","Medium",11,6.7,85,73,"Pass"],["S014",19,"Non-binary","Group","No","Medium",9,6.8,84,69,"Pass"],["S015",18,"Female","Group","No","Low",10.5,7.5,89,74,"Pass"],["S016",18,"Female","OnlineResources","No","Low",12.5,7.9,92,81,"Pass"],["S017",23,"Male","Solo","Yes","Medium",7.5,6.1,78,59,"Pass"],["S018",20,"Male","OnlineResources","No","Medium",9.5,6.8,83,67,"Pass"],["S019",19,"Male","Tutoring","No","Low",13.5,7.6,94,86,"Pass"],["S020",18,"Female","OnlineResources","No","Medium",8,6.5,78,61,"Pass"],["S021",22,"Female","Solo","Yes","High",3,5.1,55,36,"Fail"],["S022",23,"Male","Group","Yes","High",4.5,5.6,63,43,"Fail"],["S023",18,"Female","OnlineResources","No","Medium",10,7,88,72,"Pass"],["S024",19,"Female","OnlineResources","No","Low",11,7.8,89,75,"Pass"],["S025",20,"Female","Tutoring","Yes","Medium",10.5,6.8,87,74,"Pass"],["S026",20,"Female","Solo","Yes","Medium",7,6,74,56,"Pass"],["S027",19,"Female","Solo","No","Low",12,7.5,91,78,"Pass"],["S028",19,"Female","Solo","No","Low",12,7.3,91,79,"Pass"],["S029",22,"Female","OnlineResources","Yes","Medium",8,6.4,80,63,"Pass"],["S030",20,"Female","OnlineResources","No","Low",12,7.6,91,80,"Pass"],["S031",20,"Male","Group","No","Medium",8,6.7,80,62,"Pass"],["S032",21,"Male","Tutoring","No","Low",15.5,8.2,96,92,"Pass"],["S033",22,"Male","Solo","No","Medium",9,6.6,85,68,"Pass"],["S034",22,"Male","OnlineResources","Yes","Medium",7,6,76,57,"Pass"],["S035",21,"Male","Group","Yes","High",5,5.7,65,47,"Fail"],["S036",19,"Male","OnlineResources","No","Low",11.5,7.6,88,76,"Pass"],["S037",19,"Male","Solo","No","Medium",8.5,6.6,82,64,"Pass"],["S038",22,"Male","OnlineResources","Yes","High",5.5,5.8,70,52,"Pass"],["S039",19,"Female","Group","No","Medium",9,6.8,83,66,"Pass"],["S040",18,"Male","Tutoring","No","Medium",12,7.1,90,80,"Pass"],["S041",19,"Male","Group","No","Low",11,7.4,90,77,"Pass"],["S042",20,"Male","Tutoring","No","Low",13,7.8,94,87,"Pass"],["S043",22,"Female","Tutoring","Yes","Medium",10,6.6,84,71,"Pass"],["S044",20,"Female","Group","Yes","High",6,6,68,49,"Fail"],["S045",23,"Male","OnlineResources","Yes","High",5,5.5,64,46,"Fail"],["S046",21,"Male","Solo","Yes","High",3.5,5.3,58,40,"Fail"],["S047",21,"Female","OnlineResources","Yes","High",4.5,5.6,62,44,"Fail"],["S048",18,"Male","Solo","No","Low",11,7.4,89,75,"Pass"],["S049",23,"Male","Solo","Yes","Medium",7,6.2,75,58,"Pass"],["S050",21,"Female","Solo","No","Low",11.5,7.2,90,76,"Pass"],["S051",18,"Female","OnlineResources","Yes","Medium",7.5,6.2,79,60,"Pass"],["S052",21,"Male","Solo","Yes","High",4,5.5,61,45,"Fail"],["S053",21,"Female","Group","Yes","High",5.5,5.9,69,48,"Fail"],["S054",21,"Female","Group","No","Medium",9.5,6.7,86,70,"Pass"],["S055",22,"Female","Group","No","Medium",9,6.9,84,69,"Pass"],["S056",20,"Female","Tutoring","No","Low",14.5,8,97,90,"Pass"],["S057",19,"Male","Group","No","Low",12,7.7,92,79,"Pass"],["S058",21,"Female","OnlineResources","Yes","High",5.5,5.8,66,50,"Pass"],["S059",18,"Male","Solo","Yes","High",3.5,5.2,59,39,"Fail"],["S060",18,"Female","Tutoring","No","Low",14,8.1,95,89,"Pass"]];
const COLS = ["StudentID", "Age", "Gender", "StudyMethod", "PartTimeJob", "StressLevel", "StudyHoursPerWeek", "SleepHoursPerNight", "AttendancePercent", "FinalGrade", "PassFail"];
const LETTERS = "ABCDEFGHIJK";
const NUMERIC = [
  { i: 9, name: "FinalGrade", unit: "points" },
  { i: 6, name: "StudyHoursPerWeek", unit: "h" },
  { i: 7, name: "SleepHoursPerNight", unit: "h" },
  { i: 8, name: "AttendancePercent", unit: "%" },
  { i: 1, name: "Age", unit: "years" }
];
const GROUPS = [
  { key: "all", label: "All students", f: () => true },
  { key: "pass", label: "Passed", f: r => r[10] === "Pass" },
  { key: "fail", label: "Failed", f: r => r[10] === "Fail" },
  { key: "female", label: "Female students", f: r => r[2] === "Female" },
  { key: "male", label: "Male students", f: r => r[2] === "Male" },
  { key: "job", label: "Students with a part-time job", f: r => r[4] === "Yes" },
  { key: "nojob", label: "Students without a part-time job", f: r => r[4] === "No" },
  { key: "solo", label: "Solo studiers", f: r => r[3] === "Solo" },
  { key: "group", label: "Group studiers", f: r => r[3] === "Group" },
  { key: "tutor", label: "Students with tutoring", f: r => r[3] === "Tutoring" },
  { key: "online", label: "Online-resource studiers", f: r => r[3] === "OnlineResources" },
  { key: "lowstress", label: "Low-stress students", f: r => r[5] === "Low" },
  { key: "highstress", label: "High-stress students", f: r => r[5] === "High" }
];
const col = (i, g = GROUPS[0]) => RAW.filter(g.f).map(r => r[i]);

/* =========================================================================
   HELPERS
   ========================================================================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fx = (x, dp) => { let s = (Math.round(x * 10 ** dp) / 10 ** dp).toFixed(dp); if (/^-0(\.0*)?$/.test(s)) s = s.slice(1); return s; };
const f = (x, dp) => fx(x, dp).replace("-", "−");
const g4 = x => +(+x).toFixed(4) + "";
const xl = s => `<code class="xl">${s}</code>`;
const fr = (a, b) => `<span class="frac"><span>${a}</span><span>${b}</span></span>`;
const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const toPlain = h => h.replace(/<span class="frac"><span>(.*?)<\/span><span>(.*?)<\/span><\/span>/g, "($1) / ($2)").replace(/<sub>(.*?)<\/sub>/g, "_$1").replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const valChips = (a, mids = []) => `<div class="vals">${a.map((v, k) => `<span class="${mids.includes(k) ? "mid" : ""}">${v}</span>`).join("")}</div>`;
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const bus = (name, detail) => window.dispatchEvent(new CustomEvent(name, { detail }));
const dpOf = x => { const s = String(x); return s.includes(".") ? s.split(".")[1].length : 0; };
/* t-table steps in the course format: columns are areas BELOW t, from 0.500 up */
const tSteps = (below, df, dp) => {
  const c = Math.max(below, 1 - below), v = M.tinv(c, df), t = M.tinv(below, df);
  return below >= 0.5
    ? `<li>The t-table gives areas below t. Row df = ${df}, column ${f(c, 3)}: ${v.toFixed(3)}</li><li>t = <b class="num">${f(t, dp)}</b></li>`
    : `<li>Area below is ${g4(below)}, less than 0.5, so t is negative. The table only lists areas from 0.500 up.</li><li>Use symmetry: row df = ${df}, column 1 − ${g4(below)} = ${f(c, 3)} gives ${v.toFixed(3)}</li><li>Flip the sign: t = <b class="num">${f(t, dp)}</b></li>`;
};
const tableLookupZ = z => { const a = Math.abs(z); if (a > 3.59) return null; const r = Math.floor(Math.round(a * 100) / 10) / 10; const c = Math.round(a * 100) % 10; return { row: r.toFixed(1), col: ".0" + c }; };

function devTable(vals, dp = 2) {
  const m = M.mean(vals);
  const rows = vals.map(x => `<tr><td class="m">${x}</td><td class="m">${f(x - m, dp + 1)}</td><td class="m">${f((x - m) ** 2, dp + 2)}</td></tr>`).join("");
  return `<div class="tablewrap"><table class="t"><thead><tr><th>x</th><th>x − x̄</th><th>(x − x̄)²</th></tr></thead><tbody>${rows}</tbody>
    <tfoot><tr><td class="m">Σx = ${g4(M.sum(vals))}</td><td class="m">0</td><td class="m">${f(M.ss(vals), dp + 2)}</td></tr></tfoot></table></div>`;
}

/* =========================================================================
   CHART: probability curve (standard normal or t)
   ========================================================================= */
/* the shape of each distribution the curve can draw */
function distSpec(o) {
  if (o.dist === "chi2") return { x0: 0, x1: Math.max(8, Math.ceil(o.df + 4.5 * Math.sqrt(2 * o.df))), pdf: x => M.chi2pdf(x, o.df), cdf: x => M.chi2cdf(x, o.df), sym: "q", pos: true };
  if (o.dist === "f") return { x0: 0, x1: 5, pdf: x => M.fpdf(x, o.m, o.n), cdf: x => M.fcdf(x, o.m, o.n), sym: "f", pos: true };
  if (o.dist === "t") return { x0: -4, x1: 4, pdf: x => M.tpdf(x, o.df), cdf: x => M.tcdf(x, o.df), sym: "t", ymax: 0.42 };
  return { x0: -4, x1: 4, pdf: M.npdf, cdf: M.phi, sym: "z", ymax: 0.42 };
}
function makeCurve(host, getOpts) {
  const W = 640, L = 18, R = 18, T = 30, B = 30;
  let X0 = -4, X1 = 4;
  host.classList.add("viz");
  host.innerHTML = `<svg role="img"></svg><div class="vtip" hidden></div>`;
  const svg = host.querySelector("svg"), tip = host.querySelector(".vtip");
  let dragging = false;
  const ptX = e => { const r = svg.getBoundingClientRect(); return { px: (e.clientX - r.left) * W / r.width, cx: e.clientX - r.left, cy: e.clientY - r.top }; };
  function render() {
    const o = getOpts(), sp = distSpec(o);
    X0 = sp.x0; X1 = sp.x1;
    if (sp.pos) { const far = Math.max(0, ...(o.marks || []).map(m => m.x)); if (far * 1.15 > X1) X1 = Math.ceil(far * 1.15); }
    const H = o.small ? 190 : 250;
    let YMAX = sp.ymax;
    if (!YMAX) { let mx = 0; for (let i = 1; i <= 200; i++) { const y = sp.pdf(X0 + (X1 - X0) * (0.015 + 0.985 * i / 200)); if (Number.isFinite(y) && y > mx) mx = y; } YMAX = mx * 1.12; }
    const sx = x => L + (x - X0) / (X1 - X0) * (W - L - R);
    const sy = y => H - B - Math.min(y, YMAX * 1.04) / YMAX * (H - T - B);
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("aria-label", o.aria || "Probability curve");
    let s = "";
    const ticks = sp.pos ? niceTicks(X0, X1, 7).filter(k => k >= X0 && k <= X1) : [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    for (const k of ticks) {
      s += `<line class="grid" x1="${sx(k)}" x2="${sx(k)}" y1="${T - 6}" y2="${sy(0)}"/>`;
      s += `<text class="tick" x="${sx(k)}" y="${H - 10}" text-anchor="middle">${k < 0 ? "−" + -k : k}</text>`;
    }
    const pathFor = (fn, a, b) => { let d = ""; const n = Math.max(2, Math.round((b - a) / (X1 - X0) * 240)); for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; const y = fn(x); d += (i ? "L" : "M") + sx(x).toFixed(1) + "," + sy(Number.isFinite(y) ? y : YMAX).toFixed(1); } return d; };
    for (const [a0, b0] of o.regions || []) {
      const a = clamp(a0, X0, X1), b = clamp(b0, X0, X1);
      if (b - a > 0.001) s += `<path class="shade" d="${pathFor(sp.pdf, a, b)}L${sx(b)},${sy(0)}L${sx(a)},${sy(0)}Z"/>`;
    }
    if (o.overlay) s += `<path class="overlay" d="${pathFor(M.npdf, X0, X1)}"/>`;
    s += `<path class="curve" d="${pathFor(sp.pdf, X0, X1)}"/>`;
    s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${sy(0)}" y2="${sy(0)}"/>`;
    const marks = o.marks || [];
    const close = marks.length === 2 && Math.abs(sx(clamp(marks[0].x, X0, X1)) - sx(clamp(marks[1].x, X0, X1))) < 120;
    marks.forEach((m, k) => {
      const out = m.x < X0 || m.x > X1, x = sx(clamp(m.x, X0, X1));
      s += `<line class="mark" x1="${x}" x2="${x}" y1="${T - 4}" y2="${sy(0)}"/>`;
      let anchor = "middle", tx = x;
      if (close) { anchor = k === 0 ? "end" : "start"; tx = x + (k === 0 ? -6 : 6); }
      if (tx < L + 50) { anchor = "start"; tx = Math.max(tx, L); } else if (tx > W - R - 50) { anchor = "end"; tx = Math.min(tx, W - R); }
      s += `<text class="marklbl" x="${tx}" y="${T - 12}" text-anchor="${anchor}">${m.label}${out ? (m.x < X0 ? " ←" : " →") : ""}</text>`;
    });
    if (o.center) s += `<text class="marklbl" x="${sx(0)}" y="${sy(0.12)}" text-anchor="middle">${o.center}</text>`;
    s += `<line class="guide" id="g" x1="0" x2="0" y1="${T - 6}" y2="${sy(0)}" visibility="hidden"/>`;
    s += `<rect x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent"/>`;
    svg.innerHTML = s;
    host.classList.toggle("pick", !!o.onPick);
    render.sx = sx; render.o = o; render.sp = sp;
  }
  const xFromPx = px => clamp(X0 + (px - L) / (W - L - R) * (X1 - X0), X0, X1);
  svg.addEventListener("pointermove", e => {
    const { px, cx, cy } = ptX(e), x = xFromPx(px), o = render.o, sp = render.sp;
    const g = svg.querySelector("#g"); g.setAttribute("x1", render.sx(x)); g.setAttribute("x2", render.sx(x)); g.setAttribute("visibility", "visible");
    tip.hidden = false; tip.style.left = clamp(cx, 90, svg.clientWidth - 90) + "px"; tip.style.top = cy + "px";
    tip.textContent = `${sp.sym} = ${f(x, 2)} · area left ${f(sp.cdf(x), 4)}`;
    if (dragging && o.onPick) o.onPick(Math.round(x * 100) / 100);
  });
  svg.addEventListener("pointerleave", () => { tip.hidden = true; const g = svg.querySelector("#g"); if (g) g.setAttribute("visibility", "hidden"); dragging = false; });
  svg.addEventListener("pointerdown", e => { const o = render.o; if (!o.onPick) return; dragging = true; o.onPick(Math.round(xFromPx(ptX(e).px) * 100) / 100); });
  window.addEventListener("pointerup", () => { dragging = false; });
  render();
  return render;
}

/* =========================================================================
   CHART: dot plot with mean, median and ±1 SD band (dataset explorer)
   ========================================================================= */
function niceTicks(lo, hi, n = 6) {
  const span = hi - lo || 1, raw = span / n, mag = 10 ** Math.floor(Math.log10(raw)), e = raw / mag;
  const step = mag * (e < 1.5 ? 1 : e < 3 ? 2 : e < 7 ? 5 : 10);
  const t = []; for (let v = Math.floor(lo / step) * step; v <= Math.ceil(hi / step) * step + 1e-9; v += step) t.push(+v.toFixed(6));
  return t;
}
function dotPlot(host, rows, i, unit) {
  const W = 640, H = 250, L = 18, R = 18, T = 46, B = 30;
  const vals = rows.map(r => r[i]);
  const m = M.mean(vals), md = M.median(vals), s = vals.length > 1 ? M.sdS(vals) : 0;
  const ticks = niceTicks(Math.min(...vals, m - s), Math.max(...vals, m + s));
  const X0 = ticks[0], X1 = ticks[ticks.length - 1];
  const sx = x => L + (x - X0) / (X1 - X0 || 1) * (W - L - R);
  const counts = {}, pos = [];
  rows.forEach(r => { const k = r[i].toFixed(2); counts[k] = (counts[k] || 0) + 1; pos.push(counts[k] - 1); });
  const maxC = Math.max(...Object.values(counts));
  const rad = clamp(Math.min((H - T - B - 6) / (maxC * 2.15), 6), 2.5, 6);
  const base = H - B;
  let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Dot plot">`;
  ticks.forEach(t => { svg += `<line class="grid" x1="${sx(t)}" x2="${sx(t)}" y1="${T}" y2="${base}"/><text class="tick" x="${sx(t)}" y="${H - 10}" text-anchor="middle">${+t.toFixed(2)}</text>`; });
  if (s > 0) svg += `<rect class="band" x="${sx(m - s)}" y="${T}" width="${sx(m + s) - sx(m - s)}" height="${base - T}"/>`;
  svg += `<line class="axis" x1="${L}" x2="${W - R}" y1="${base}" y2="${base}"/>`;
  rows.forEach((r, k) => { const cy = base - rad - 1 - pos[k] * (rad * 2 + 1); svg += `<circle class="dot" cx="${sx(r[i])}" cy="${cy}" r="${rad}" data-k="${k}"/>`; });
  const lab = (x, y, text) => { const px = sx(x), right = px > W - 150; return `<text class="lbl" x="${px + (right ? -6 : 6)}" y="${y}" text-anchor="${right ? "end" : "start"}">${text}</text>`; };
  svg += `<line class="meanline" x1="${sx(m)}" x2="${sx(m)}" y1="${T - 30}" y2="${base}"/>` + lab(m, T - 20, `x̄ = ${f(m, 2)}`);
  svg += `<line class="medline" x1="${sx(md)}" x2="${sx(md)}" y1="${T - 14}" y2="${base}"/>` + lab(md, T - 4, `median = ${+md.toFixed(2)}`);
  svg += `</svg><div class="vtip" hidden></div>`;
  host.classList.add("viz"); host.innerHTML = svg;
  const tip = host.querySelector(".vtip"), el = host.querySelector("svg");
  el.addEventListener("pointerover", e => {
    const c = e.target.closest("circle.dot"); if (!c) return;
    $$("circle.hot", el).forEach(d => d.classList.remove("hot")); c.classList.add("hot");
    const r = rows[+c.dataset.k], bb = el.getBoundingClientRect(), cb = c.getBoundingClientRect();
    tip.hidden = false; tip.style.left = clamp(cb.left - bb.left + cb.width / 2, 70, bb.width - 70) + "px"; tip.style.top = (cb.top - bb.top) + "px";
    tip.textContent = `${r[0]} · ${r[i]} ${unit}`;
  });
  el.addEventListener("pointerleave", () => { tip.hidden = true; $$("circle.hot", el).forEach(d => d.classList.remove("hot")); });
  return { m, md, s, n: vals.length, v: s * s, min: Math.min(...vals), max: Math.max(...vals) };
}

/* =========================================================================
   WIDGETS
   ========================================================================= */
const WIDGETS = {};

/* Mean vs median: drag points on a number line */
WIDGETS.balance = el => {
  let vals = [3, 4, 5, 6, 7, 8, 9];
  const W = 640, H = 170, L = 20, R = 20, X0 = 0, X1 = 30, base = 120;
  el.innerHTML = `<div class="wtitle"><b>Mean vs median</b><span>Drag a dot sideways</span></div>
    <div class="legend"><span><i></i>Mean</span><span><i class="med"></i>Median</span></div>
    <div class="viz bal"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Number line with draggable values"></svg></div>
    <div class="readout"><div class="big" id="bal-out"></div><div class="sub">Pull one dot far to the right. The mean follows it; the median barely moves.</div></div>
    <div><button class="btn ghost" type="button" id="bal-reset">Reset values</button></div>`;
  const svg = $("svg", el), sx = x => L + (x - X0) / (X1 - X0) * (W - L - R), xFrom = px => clamp(Math.round(X0 + (px - L) / (W - L - R) * (X1 - X0)), X0, X1);
  let drag = -1;
  const draw = () => {
    const m = M.mean(vals), md = M.median(vals), seen = {};
    let s = "";
    for (let t = 0; t <= 30; t += 5) s += `<line class="grid" x1="${sx(t)}" x2="${sx(t)}" y1="40" y2="${base}"/><text class="tick" x="${sx(t)}" y="${base + 22}" text-anchor="middle">${t}</text>`;
    s += `<line class="axis" x1="${L}" x2="${W - R}" y1="${base}" y2="${base}"/>`;
    s += `<line class="meanline" x1="${sx(m)}" x2="${sx(m)}" y1="16" y2="${base}"/><text class="lbl" x="${sx(m) + 6}" y="26">mean ${f(m, 2)}</text>`;
    s += `<line class="medline" x1="${sx(md)}" x2="${sx(md)}" y1="34" y2="${base}"/><text class="lbl" x="${sx(md) + 6}" y="46">median ${g4(md)}</text>`;
    vals.forEach((v, k) => { seen[v] = (seen[v] || 0) + 1; s += `<circle class="drag" data-k="${k}" cx="${sx(v)}" cy="${base - 10 - (seen[v] - 1) * 19}" r="9"/>`; });
    svg.innerHTML = s;
    $("#bal-out", el).innerHTML = `mean = <em>${f(m, 2)}</em> · median = ${g4(md)}`;
  };
  const px = e => { const r = svg.getBoundingClientRect(); return (e.clientX - r.left) * W / r.width; };
  svg.addEventListener("pointerdown", e => { const c = e.target.closest("circle.drag"); if (!c) return; drag = +c.dataset.k; svg.setPointerCapture(e.pointerId); e.preventDefault(); });
  svg.addEventListener("pointermove", e => { if (drag < 0) return; const v = xFrom(px(e)); if (v !== vals[drag]) { vals[drag] = v; draw(); } });
  svg.addEventListener("pointerup", () => { drag = -1; });
  svg.addEventListener("pointercancel", () => { drag = -1; });
  $("#bal-reset", el).addEventListener("click", () => { vals = [3, 4, 5, 6, 7, 8, 9]; draw(); });
  draw();
};

/* Step-by-step calculator for any small list */
WIDGETS.calc = el => {
  el.innerHTML = `<div class="wtitle"><b>Step-by-step calculator</b><span>Use it to check your hand calculations</span></div>
    <label class="field"><span>Your numbers (commas or spaces between them; use ; if you write decimals with a comma)</span>
    <textarea id="calc-in" rows="2">4, 8, 6, 5, 3, 7, 9</textarea></label><div class="calc-out"></div>`;
  const run = () => {
    const raw = $("#calc-in", el).value;
    const parts = raw.includes(";") ? raw.split(/[;\s]+/).map(p => p.replace(",", ".")) : raw.split(/[,\s]+/);
    const v = parts.map(Number).filter((x, k) => parts[k] !== "" && Number.isFinite(x));
    const out = $(".calc-out", el);
    if (v.length < 2) { out.innerHTML = `<p class="sub">Enter at least two numbers.</p>`; return; }
    const s = [...v].sort((a, b) => a - b), n = v.length, mids = n % 2 ? [(n - 1) / 2] : [n / 2 - 1, n / 2];
    const m = M.mean(v), ss = M.ss(v);
    out.innerHTML = `<h4>1 · Sort and find the middle</h4>${valChips(s, mids)}
      <p>n = ${n}, so the median sits at position (n + 1) / 2 = ${(n + 1) / 2}. ${n % 2 ? `Median = <b class="num">${g4(s[mids[0]])}</b>.` : `That falls between two values, so median = (${s[mids[0]]} + ${s[mids[1]]}) / 2 = <b class="num">${g4(M.median(v))}</b>.`}</p>
      <h4>2 · Mean</h4><p>x̄ = Σx / n = ${g4(M.sum(v))} / ${n} = <b class="num">${f(m, 4)}</b></p>
      <h4>3 · Deviations from the mean</h4>${devTable(v)}
      <h4 style="margin-top:12px">4 · Variance and standard deviation</h4>
      <div class="stats">
        <div class="stat"><span>Sample s² = SS / (n − 1)</span><b>${f(ss / (n - 1), 4)}</b></div>
        <div class="stat"><span>Sample SD s</span><b>${f(Math.sqrt(ss / (n - 1)), 4)}</b></div>
        <div class="stat"><span>Population σ² = SS / n</span><b>${f(ss / n, 4)}</b></div>
        <div class="stat"><span>Population SD σ</span><b>${f(Math.sqrt(ss / n), 4)}</b></div>
      </div>`;
  };
  $("#calc-in", el).addEventListener("input", run); run();
};

/* 68–95–99.7 rule */
WIDGETS.rule = el => {
  let k = 1;
  el.innerHTML = `<div class="wtitle"><b>The 68–95–99.7 rule</b><span>Area within k standard deviations of the mean</span></div>
    <div class="seg">${[1, 2, 3].map(n => `<button type="button" data-k="${n}">within ±${n} SD</button>`).join("")}</div><div class="rviz"></div>`;
  const curve = makeCurve($(".rviz", el), () => ({ dist: "z", small: true, regions: [[-k, k]], marks: [{ x: -k, label: "−" + k }, { x: k, label: "+" + k }], center: f((M.phi(k) - M.phi(-k)) * 100, 1) + "%", aria: "Normal curve with central area shaded" }));
  const sync = () => $$("[data-k]", el).forEach(b => b.setAttribute("aria-pressed", +b.dataset.k === k));
  el.addEventListener("click", e => { const b = e.target.closest("[data-k]"); if (!b) return; k = +b.dataset.k; sync(); curve(); });
  sync();
};

/* Dataset explorer (Practice › Apply to dataset) */
WIDGETS.explorer = el => {
  el.innerHTML = `<div class="ctl">
      <label class="field"><span>Variable</span><select id="ex-var">${NUMERIC.map((c, k) => `<option value="${k}">${c.name}</option>`).join("")}</select></label>
      <label class="field"><span>Students</span><select id="ex-grp">${GROUPS.map((g, k) => `<option value="${k}">${g.label}</option>`).join("")}</select></label>
    </div>
    <div class="legend"><span><i></i>Mean</span><span><i class="med"></i>Median</span><span><i class="band"></i>Mean ± 1 SD</span><span class="sub">Hover a dot to see the student</span></div>
    <div class="ex-plot"></div><div class="stats"></div>`;
  const draw = () => {
    const c = NUMERIC[$("#ex-var", el).value], g = GROUPS[$("#ex-grp", el).value], rows = RAW.filter(g.f);
    const r = dotPlot($(".ex-plot", el), rows, c.i, c.unit);
    $(".stats", el).innerHTML = [["n", r.n], ["Mean x̄", f(r.m, 2)], ["Median", +r.md.toFixed(2)], ["Variance s²", f(r.v, 2)], ["SD s", f(r.s, 3)], ["Range", `${r.min} – ${r.max}`]]
      .map(([a, b]) => `<div class="stat"><span>${a}</span><b>${b}</b></div>`).join("");
  };
  el.addEventListener("change", draw); draw();
};

function distExplorer(el, dist) {
  const isT = dist === "t", S = isT ? "T" : "Z", s = isT ? "t" : "z", id = k => `${dist}-${k}`;
  const st = { mode: "left", a: isT ? 2.015 : 1.64, b: -1, p: 0.95, dir: "below", df: 5 };
  const modes = [["left", `Area below ${s}`], ["right", `Area above ${s}`], ...(isT ? [] : [["between", "Area between"]]), ["find", `Find ${s} from an area`]];
  el.innerHTML = `<div class="wtitle"><b>${isT ? "t-distribution" : "Standard normal"} explorer</b><span>Drag on the curve to move ${s}</span></div>
    <div class="seg">${modes.map(([k, l]) => `<button type="button" data-mode="${k}">${l}</button>`).join("")}</div>
    <div class="ctl"></div>
    ${isT ? `<div class="legend"><span><i></i>t-distribution</span><span><i class="dash"></i>Standard normal (for comparison)</span><span><i class="fill"></i>Shaded area = probability</span></div>` : ""}
    <div class="dviz"></div><div class="readout"></div>`;
  const slider = (k, label, v) => `<div class="field"><span>${label}</span><div class="row"><input type="range" id="${id(k + "-r")}" min="-4" max="4" step="0.01" value="${v}"><input type="number" id="${id(k + "-n")}" min="-6" max="6" step="0.01" value="${v}"></div></div>`;
  const dfField = () => `<div class="field"><span>Degrees of freedom (df)</span><div class="row"><input type="range" id="${id("df-r")}" min="1" max="60" step="1" value="${st.df}"><input type="number" id="${id("df-n")}" min="1" max="500" step="1" value="${st.df}"></div></div>`;
  const ctl = () => {
    let h = "";
    if (st.mode === "find") h = `<div class="field"><span>Area (probability)</span><input type="number" id="${id("p")}" min="0.0001" max="0.9999" step="0.005" value="${st.p}"></div>
      <label class="field"><span>The area lies</span><select id="${id("dir")}"><option value="below">below ${s}</option><option value="above">above ${s}</option></select></label>`;
    else if (st.mode === "between") h = slider("b", "Lower value a", st.b) + slider("a", "Upper value b", st.a);
    else h = slider("a", `Value of ${s}`, st.a);
    $(".ctl", el).innerHTML = (isT ? dfField() : "") + h;
    const d = $(`#${id("dir")}`, el); if (d) d.value = st.dir;
    $$(".seg button", el).forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === st.mode));
  };
  const cdf = x => isT ? M.tcdf(x, st.df) : M.phi(x);
  const inv = p => isT ? M.tinv(p, st.df) : M.invphi(p);
  const findVal = () => inv(st.dir === "below" ? st.p : 1 - st.p);
  const syncInputs = () => { for (const k of ["a", "b"]) { const r = $(`#${id(k + "-r")}`, el), n = $(`#${id(k + "-n")}`, el); if (r) { r.value = st[k]; n.value = st[k]; } } };
  const opts = () => {
    const o = { dist, df: st.df, overlay: isT, aria: `${isT ? "t" : "Standard normal"} curve with shaded area` };
    if (st.mode === "left") { o.regions = [[-9, st.a]]; o.marks = [{ x: st.a, label: `${s} = ${f(st.a, 3)}` }]; }
    if (st.mode === "right") { o.regions = [[st.a, 9]]; o.marks = [{ x: st.a, label: `${s} = ${f(st.a, 3)}` }]; }
    if (st.mode === "between") { const lo = Math.min(st.a, st.b), hi = Math.max(st.a, st.b); o.regions = [[lo, hi]]; o.marks = [{ x: lo, label: `a = ${f(lo, 2)}` }, { x: hi, label: `b = ${f(hi, 2)}` }]; }
    if (st.mode === "find") { const v = findVal(); o.regions = st.dir === "below" ? [[-99, v]] : [[v, 99]]; o.marks = [{ x: v, label: `${s} = ${f(v, 3)}` }]; }
    o.onPick = x => {
      if (st.mode === "find") { const c = cdf(x); st.p = +(st.dir === "below" ? c : 1 - c).toFixed(4); const pi = $(`#${id("p")}`, el); if (pi) pi.value = st.p; }
      else if (st.mode === "between") { if (Math.abs(x - st.a) < Math.abs(x - st.b)) st.a = x; else st.b = x; syncInputs(); }
      else { st.a = x; syncInputs(); }
      update();
    };
    return o;
  };
  const fn = isT ? (x, tail) => tail ? `=T.DIST.RT(${fx(x, 3)},${st.df})` : `=T.DIST(${fx(x, 3)},${st.df},TRUE)` : (x, tail) => tail ? `=1-NORM.S.DIST(${fx(x, 2)},TRUE)` : `=NORM.S.DIST(${fx(x, 2)},TRUE)`;
  const zHint = x => { const t = tableLookupZ(x); if (!t) return ""; const base = M.phi(Math.abs(Math.round(x * 100) / 100));
    return `z-table: row ${t.row}, column ${t.col} → Φ(${f(Math.abs(x), 2)}) = ${f(base, 4)}${x < 0 ? `, and by symmetry Φ(${f(x, 2)}) = 1 − ${f(base, 4)} = ${f(1 - base, 4)}` : ""}.`; };
  const compare = txt => isT ? `<div class="sub">${txt}</div>` : "";
  function readout() {
    const R = $(".readout", el); let h = "";
    if (st.mode === "left") {
      const p = cdf(st.a);
      h = `<div class="big">P(${S} &lt; ${f(st.a, isT ? 3 : 2)}) = <em>${f(p, 4)}</em></div>
        <div class="sub">${isT ? `The shaded area is ${f(p * 100, 2)}% of the curve.` : zHint(st.a)}</div>
        ${compare(`With the standard normal instead: P(Z &lt; ${f(st.a, 3)}) = ${f(M.phi(st.a), 4)}`)}
        <div class="sub">Excel: ${xl(fn(st.a, false))}</div>`;
    } else if (st.mode === "right") {
      const p = cdf(st.a);
      h = `<div class="big">P(${S} &gt; ${f(st.a, isT ? 3 : 2)}) = 1 − ${f(p, 4)} = <em>${f(1 - p, 4)}</em></div>
        <div class="sub">${isT ? "Area above means 1 minus the area below." : zHint(st.a) + " Then subtract from 1."}</div>
        ${compare(`With the standard normal instead: P(Z &gt; ${f(st.a, 3)}) = ${f(1 - M.phi(st.a), 4)}`)}
        <div class="sub">Excel: ${xl(fn(st.a, true))}</div>`;
    } else if (st.mode === "between") {
      const lo = Math.min(st.a, st.b), hi = Math.max(st.a, st.b), pl = cdf(lo), ph = cdf(hi);
      h = `<div class="big">P(${f(lo, 2)} &lt; Z &lt; ${f(hi, 2)}) = ${f(ph, 4)} − ${f(pl, 4)} = <em>${f(ph - pl, 4)}</em></div>
        <div class="sub">Area below b minus area below a.</div>
        <div class="sub">Excel: ${xl(`=NORM.S.DIST(${fx(hi, 2)},TRUE)-NORM.S.DIST(${fx(lo, 2)},TRUE)`)}</div>`;
    } else {
      const v = findVal(), below = st.dir === "below" ? st.p : 1 - st.p;
      h = `<div class="big">${s} = <em>${f(v, 3)}</em> <span class="sub">(${f(v, 4)})</span></div>
        <div class="sub">${st.dir === "above" ? `Area above ${f(st.p, 4)} means area below = 1 − ${f(st.p, 4)} = ${f(below, 4)}. ` : ""}${below < 0.5 ? `Less than half the area is below, so ${s} is negative. ` : ""}${isT ? `t-table: row df = ${st.df}, column ${f(Math.max(below, 1 - below), 3)}${below < 0.5 ? ", then flip the sign" : ""}.` : "Look up " + f(below, 4) + " in the body of the z-table."}</div>
        ${compare(`The standard normal would give z = ${f(M.invphi(below), 3)}. The t value is further out because of the heavier tails.`)}
        <div class="sub">Excel: ${xl(isT ? `=T.INV(${g4(below)},${st.df})` : `=NORM.S.INV(${g4(below)})`)}</div>`;
    }
    R.innerHTML = h;
  }
  let curve;
  function update() {
    curve(); readout();
    if (isT) { const v = st.mode === "find" ? findVal() : st.a; bus("stat:t", { df: st.df, alpha: st.mode === "find" ? Math.min(st.p, 1 - st.p) : 1 - M.tcdf(Math.abs(v), st.df) }); }
    else { const v = st.mode === "find" ? findVal() : st.mode === "between" ? null : st.a; if (v != null) bus("stat:z", { z: v }); }
  }
  el.addEventListener("click", e => { const b = e.target.closest(".seg button"); if (!b) return; st.mode = b.dataset.mode; ctl(); update(); });
  el.addEventListener("input", e => {
    const t = e.target, k = t.id.replace(dist + "-", "");
    const v = parseFloat(t.value); if (!Number.isFinite(v) && t.tagName !== "SELECT") return;
    if (k.startsWith("a-") || k.startsWith("b-")) { st[k[0]] = clamp(v, -6, 6); syncInputs(); }
    if (k.startsWith("df-")) { st.df = clamp(Math.round(v), 1, 500); $(`#${id("df-r")}`, el).value = Math.min(st.df, 60); $(`#${id("df-n")}`, el).value = st.df; }
    if (k === "p") { if (v <= 0 || v >= 1) return; st.p = v; }
    if (k === "dir") st.dir = t.value;
    update();
  });
  ctl();
  curve = makeCurve($(".dviz", el), opts);
  update();
}
WIDGETS.zexplorer = el => distExplorer(el, "z");
WIDGETS.texplorer = el => distExplorer(el, "t");

WIDGETS.ztable = el => {
  const colsH = [...Array(10)].map((_, c) => `.0${c}`);
  let body = "";
  for (let r = 0; r <= 35; r++) {
    const z0 = r / 10;
    body += `<tr data-r="${z0.toFixed(1)}"><th>${z0.toFixed(1)}</th>${colsH.map((_, c) => `<td data-c="${c}">${M.phi(z0 + c / 100).toFixed(4)}</td>`).join("")}</tr>`;
  }
  el.innerHTML = `<div class="wtitle"><b>z-table · P(Z &lt; z)</b><span>Follows the explorer above</span></div>
    <div class="lookup"><table><thead><tr><th>z</th>${colsH.map(c => `<th data-c="${c.slice(-1)}">${c}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>
    <p class="sub" style="margin:0">Same layout as your course table. For a negative z, look up the positive value and use Φ(−z) = 1 − Φ(z).</p>`;
  const box = $(".lookup", el);
  window.addEventListener("stat:z", e => {
    if (!el.isConnected) return;
    $$(".hr,.hc,.hit", el).forEach(n => n.classList.remove("hr", "hc", "hit"));
    const t = tableLookupZ(e.detail.z); if (!t) return;
    const row = $(`tr[data-r="${t.row}"]`, el), c = t.col.slice(-1); if (!row) return;
    row.classList.add("hr"); $$(`[data-c="${c}"]`, el).forEach(n => n.classList.add("hc"));
    $(`td[data-c="${c}"]`, row).classList.add("hit");
    box.scrollTop = row.offsetTop - box.clientHeight / 2;
  });
};

WIDGETS.ttable = el => {
  const A = [0.999, 0.995, 0.990, 0.975, 0.950, 0.900, 0.850, 0.800, 0.700, 0.600, 0.500];
  const dfs = [...Array(30)].map((_, k) => k + 1).concat([40, 60, 120, Infinity]);
  const body = dfs.map(df => `<tr data-df="${df}"><th>${df === Infinity ? "∞" : df}</th>${A.map((a, c) => `<td data-c="${c}">${Math.abs(df === Infinity ? M.invphi(a) : M.tinv(a, df)).toFixed(3)}</td>`).join("")}</tr>`).join("");
  el.innerHTML = `<div class="wtitle"><b>t-table · P(t<sub>df</sub> &lt; t)</b><span>Follows the explorer above</span></div>
    <div class="lookup"><table><thead><tr><th>df</th>${A.map((a, c) => `<th data-c="${c}">${a.toFixed(3)}</th>`).join("")}</tr></thead><tbody>${body}</tbody></table></div>
    <p class="sub" style="margin:0">Same layout as your course table: each column is the area <b>below</b> t. If your df is not listed, use the next smaller df.</p>`;
  const box = $(".lookup", el);
  window.addEventListener("stat:t", e => {
    if (!el.isConnected) return;
    const { df, alpha } = e.detail;
    $$(".hr,.hc,.hit", el).forEach(n => n.classList.remove("hr", "hc", "hit"));
    const useDf = dfs.filter(d => d <= df).pop() || 1;
    const row = $(`tr[data-df="${useDf}"]`, el); row.classList.add("hr");
    const c = A.findIndex(a => Math.abs(a - (1 - alpha)) < 0.0006);
    if (c >= 0) { $$(`[data-c="${c}"]`, el).forEach(n => n.classList.add("hc")); $(`td[data-c="${c}"]`, row).classList.add("hit"); }
    box.scrollTop = row.offsetTop - box.clientHeight / 2;
  });
};

/* =========================================================================
   COURSE CONTENT
   WEEKS = [{ id, num, title, blurb, parts: [...] }]
   part:    { title, intro, buildsOn, table?, bridge, summary: [..], concepts: [..], practice: [..] }
   concept: { name, tag, idea, formula?, steps?, example?, watch?, widgets?: [..],
              keys: [[name, formulaHtml, excel]]   (rows for the formula sheet) }
   practice type: { key, label, mode: "general" | "data", gen() -> { q, ans, dp, steps, viz?, excel?, alts? } }
     multiple choice: gen() returns { q, ans: "<label>", choices: [labels], steps } instead of a number.
   Lessons use general numbers only. The dataset appears only in Practice › Apply to dataset.
   ========================================================================= */
const EX = [4, 8, 6, 5, 3, 7, 9];

/* PMF and CDF: bars for P(X = x), the bars up to k add up to P(X ≤ k) */
const PMF_PRESETS = [
  { label: "Fair die", what: "X = the number rolled", xs: [1, 2, 3, 4, 5, 6], ps: [1, 1, 1, 1, 1, 1].map(c => c / 6) },
  { label: "Heads in 3 coin flips", what: "X = the number of heads", xs: [0, 1, 2, 3], ps: [1, 3, 3, 1].map(c => c / 8) },
  { label: "Sum of two dice", what: "X = the sum of two dice", xs: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], ps: [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1].map(c => c / 36) }
];
const roundedBar = (x0, y0, bw, top) => { const r = Math.min(4, bw / 2, Math.max(0, y0 - top)); return `M${x0},${y0}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + bw - r}Q${x0 + bw},${top} ${x0 + bw},${top + r}V${y0}Z`; };
WIDGETS.pmf = el => {
  let P = PMF_PRESETS[1], k = 1;
  el.innerHTML = `<div class="wtitle"><b>PMF and CDF</b><span>Hover a bar, move k</span></div>
    <div class="seg">${PMF_PRESETS.map((p, i) => `<button type="button" data-i="${i}">${p.label}</button>`).join("")}</div>
    <div class="ctl"><div class="field"><span>k, for P(X ≤ k)</span><div class="row"><input type="range" id="pm-k" step="1"><b class="num" id="pm-kv"></b></div></div></div>
    <div class="legend"><span><i class="on"></i>Counted in P(X ≤ k)</span><span><i class="ex"></i>E[X], the long-run average</span></div>
    <div class="viz" id="pm-viz"><svg role="img" aria-label="Bar chart of a probability mass function"></svg><div class="vtip" hidden></div></div>
    <div class="readout" id="pm-out"></div>`;
  const svg = $("#pm-viz svg", el), tip = $("#pm-viz .vtip", el), W = 640, H = 220, Lp = 18, Rp = 18, T = 30, B = 30;
  const cum = i => P.ps.slice(0, i + 1).reduce((s, p) => s + p, 0);
  const draw = () => {
    const n = P.xs.length, slot = (W - Lp - Rp) / n, bw = Math.min(46, slot * 0.62), ymax = Math.max(...P.ps) * 1.2;
    const sy = y => H - B - y / ymax * (H - T - B), cx = i => Lp + slot * (i + 0.5);
    const mu = P.xs.reduce((s, x, i) => s + x * P.ps[i], 0), vr = P.xs.reduce((s, x, i) => s + (x - mu) ** 2 * P.ps[i], 0);
    let s = "";
    P.xs.forEach((x, i) => {
      const top = sy(P.ps[i]);
      s += `<path class="bar${x <= k ? " on" : ""}" d="${roundedBar(cx(i) - bw / 2, sy(0), bw, top)}"/>`;
      s += `<text class="tick" x="${cx(i)}" y="${H - 10}" text-anchor="middle">${x}</text>`;
      if (n <= 6) s += `<text class="tick" x="${cx(i)}" y="${top - 6}" text-anchor="middle">${f(P.ps[i], 3)}</text>`;
    });
    s += `<line class="axis" x1="${Lp}" x2="${W - Rp}" y1="${sy(0)}" y2="${sy(0)}"/>`;
    const mx = cx(mu - P.xs[0]);
    s += `<line class="exline" x1="${mx}" x2="${mx}" y1="${T - 10}" y2="${sy(0)}"/><text class="marklbl" x="${mx}" y="${T - 16}" text-anchor="middle">E[X] = ${g4(mu)}</text>`;
    P.xs.forEach((x, i) => { s += `<rect class="hit" data-i="${i}" x="${cx(i) - slot / 2}" y="${T}" width="${slot}" height="${H - T - B}" fill="transparent"/>`; });
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.innerHTML = s;
    const inc = P.xs.map((x, i) => i).filter(i => P.xs[i] <= k), F = inc.length ? cum(inc[inc.length - 1]) : 0;
    $("#pm-kv", el).textContent = k;
    $("#pm-out", el).innerHTML = `<div class="big">P(X ≤ ${k}) = ${inc.length <= 6 ? inc.map(i => f(P.ps[i], 3)).join(" + ") + " = " : ""}<em>${f(F, 3)}</em></div>
      <div class="sub">${P.what}. P(X &gt; ${k}) = 1 − ${f(F, 3)} = ${f(1 - F, 3)}.</div>
      <div class="stats"><div class="stat"><span>E[X]</span><b>${f(mu, 3)}</b></div><div class="stat"><span>Var(X)</span><b>${f(vr, 3)}</b></div><div class="stat"><span>SD(X)</span><b>${f(Math.sqrt(vr), 3)}</b></div><div class="stat"><span>Σ P(X = x)</span><b>1</b></div></div>`;
  };
  const setP = i => { P = PMF_PRESETS[i]; const r = $("#pm-k", el); r.min = P.xs[0]; r.max = P.xs[P.xs.length - 1]; k = P.xs[Math.floor((P.xs.length - 1) / 2)]; r.value = k; $$(".seg button", el).forEach(b => b.setAttribute("aria-pressed", +b.dataset.i === i)); draw(); };
  el.addEventListener("click", e => { const b = e.target.closest(".seg button"); if (b) setP(+b.dataset.i); });
  $("#pm-k", el).addEventListener("input", e => { k = +e.target.value; draw(); });
  svg.addEventListener("pointermove", e => {
    const h = e.target.closest(".hit"); if (!h) { tip.hidden = true; return; }
    const i = +h.dataset.i, r = svg.getBoundingClientRect();
    tip.hidden = false; tip.style.left = clamp(e.clientX - r.left, 90, r.width - 90) + "px"; tip.style.top = (e.clientY - r.top) + "px";
    tip.textContent = `P(X = ${P.xs[i]}) = ${f(P.ps[i], 3)} · F(${P.xs[i]}) = ${f(cum(i), 3)}`;
  });
  svg.addEventListener("pointerleave", () => { tip.hidden = true; });
  svg.addEventListener("click", e => { const h = e.target.closest(".hit"); if (h) { k = P.xs[+h.dataset.i]; $("#pm-k", el).value = k; draw(); } });
  setP(1);
};

/* Central Limit Theorem: histogram of many sample means against the normal curve */
const gauss = () => { let u = 0; while (!u) u = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random()); };
WIDGETS.clt = el => {
  const POPS = [
    { label: "Right-skewed population", mu: 2, sd: 2, draw: () => -2 * Math.log(1 - Math.random()) },
    { label: "Two-peaked population", mu: 5, sd: Math.sqrt(0.36 + 9), draw: () => (Math.random() < 0.5 ? 2 : 8) + 0.6 * gauss() }
  ];
  const NS = [1, 2, 5, 10, 30], REPS = 4000, LO = 0, HI = 10, BINS = 80;
  let pop = 0, n = 1, means = [];
  el.innerHTML = `<div class="wtitle"><b>Central Limit Theorem</b><span>${REPS.toLocaleString("en")} samples, each of size n</span></div>
    <div class="seg" id="clt-pop">${POPS.map((p, i) => `<button type="button" data-p="${i}">${p.label}</button>`).join("")}</div>
    <div class="ctl"><div class="field"><span>Sample size n</span><div class="seg" id="clt-n">${NS.map(v => `<button type="button" data-n="${v}">n = ${v}</button>`).join("")}</div></div><button class="btn ghost" type="button" id="clt-again">Draw again</button></div>
    <div class="legend"><span><i class="hbar"></i>Sample means x̄ (histogram)</span><span><i></i>Normal curve N(μ, σ²/n) from the CLT</span></div>
    <div class="viz"><svg role="img" aria-label="Histogram of sample means with the normal curve"></svg></div>
    <div class="readout" id="clt-out"></div>`;
  const svg = $(".viz svg", el), W = 640, H = 230, Lp = 18, Rp = 18, T = 14, B = 30;
  const simulate = () => { const P = POPS[pop]; means = []; for (let r = 0; r < REPS; r++) { let s = 0; for (let i = 0; i < n; i++) s += P.draw(); means.push(s / n); } };
  const draw = () => {
    const P = POPS[pop], se = P.sd / Math.sqrt(n), bw = (HI - LO) / BINS, counts = Array(BINS).fill(0);
    means.forEach(m => { const b = Math.floor((m - LO) / bw); if (b >= 0 && b < BINS) counts[b]++; });
    const dens = counts.map(c => c / (REPS * bw)), peak = 1 / (se * Math.sqrt(2 * Math.PI)), ymax = Math.max(...dens, peak) * 1.1;
    const sx = x => Lp + (x - LO) / (HI - LO) * (W - Lp - Rp), sy = y => H - B - y / ymax * (H - T - B);
    let s = "";
    for (let k = 0; k <= 10; k += 2) s += `<line class="grid" x1="${sx(k)}" x2="${sx(k)}" y1="${T}" y2="${sy(0)}"/><text class="tick" x="${sx(k)}" y="${H - 10}" text-anchor="middle">${k}</text>`;
    dens.forEach((d, b) => { if (d > 0) s += `<rect class="hbar" x="${sx(LO + b * bw) + 0.5}" y="${sy(d)}" width="${Math.max(0.5, sx(bw) - sx(0) - 1)}" height="${sy(0) - sy(d)}"/>`; });
    let d = ""; for (let i = 0; i <= 300; i++) { const x = LO + (HI - LO) * i / 300; d += (i ? "L" : "M") + sx(x).toFixed(1) + "," + sy(M.npdf((x - P.mu) / se) / se).toFixed(1); }
    s += `<path class="curve" d="${d}"/><line class="axis" x1="${Lp}" x2="${W - Rp}" y1="${sy(0)}" y2="${sy(0)}"/>`;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`); svg.innerHTML = s;
    const mm = M.mean(means), msd = Math.sqrt(M.varP(means));
    $("#clt-out", el).innerHTML = `<div class="stats"><div class="stat"><span>Mean of the x̄'s</span><b>${f(mm, 3)}</b></div><div class="stat"><span>μ</span><b>${f(P.mu, 3)}</b></div><div class="stat"><span>SD of the x̄'s</span><b>${f(msd, 3)}</b></div><div class="stat"><span>σ / √n</span><b>${f(se, 3)}</b></div></div>
      <div class="sub">${n === 1 ? "With n = 1 each “mean” is a single value, so the histogram shows the population itself. Now increase n." : n < 10 ? "The shape is already moving towards the bell curve, and the spread shrinks like σ / √n." : "The sample means are close to normal, even though the population is not. That is the Central Limit Theorem."}</div>`;
    $$("#clt-pop button", el).forEach(b => b.setAttribute("aria-pressed", +b.dataset.p === pop));
    $$("#clt-n button", el).forEach(b => b.setAttribute("aria-pressed", +b.dataset.n === n));
  };
  el.addEventListener("click", e => {
    const p = e.target.closest("[data-p]"), m = e.target.closest("[data-n]");
    if (p) pop = +p.dataset.p; else if (m) n = +m.dataset.n; else if (!e.target.closest("#clt-again")) return;
    simulate(); draw();
  });
  simulate(); draw();
};

/* Shapes: right-skewed, symmetric and left-skewed curves with mean and median */
WIDGETS.shapes = el => {
  const logn = x => x <= 0 ? 0 : Math.exp(-((Math.log(x / 0.2)) ** 2) / (2 * 0.75 ** 2)) / x;
  const P = [{ pdf: logn, t: "Right-skewed", s: "mean > median" }, { pdf: x => Math.exp(-((x - 0.5) ** 2) / (2 * 0.15 ** 2)), t: "Symmetric", s: "mean = median" }, { pdf: x => logn(1 - x), t: "Left-skewed", s: "mean < median" }];
  const W = 640, H = 200, gap = 22, pw = (W - 2 * gap) / 3, T = 34, B = 34;
  let s = "";
  P.forEach((p, k) => {
    const x0 = k * (pw + gap), xs = [...Array(401)].map((_, i) => i / 400), ys = xs.map(p.pdf), ym = Math.max(...ys);
    let c = 0, tot = ys.reduce((a, b) => a + b, 0), med = 0.5; for (let i = 0; i < ys.length; i++) { c += ys[i]; if (c >= tot / 2) { med = xs[i]; break; } }
    const mean = xs.reduce((a, x, i) => a + x * ys[i], 0) / tot, sx = x => x0 + 8 + x * (pw - 16), sy = y => H - B - y / ym * (H - T - B) * 0.95;
    const d = xs.map((x, i) => (i ? "L" : "M") + sx(x).toFixed(1) + "," + sy(ys[i]).toFixed(1)).join("");
    s += `<path class="area" d="${d}L${sx(1)},${sy(0)}L${sx(0)},${sy(0)}Z"/><path class="curve2" d="${d}"/><line class="axis" x1="${sx(0)}" x2="${sx(1)}" y1="${sy(0)}" y2="${sy(0)}"/>`;
    s += `<line class="meanline" x1="${sx(mean)}" x2="${sx(mean)}" y1="${T - 2}" y2="${sy(0)}"/><line class="medline" x1="${sx(med)}" x2="${sx(med)}" y1="${T - 2}" y2="${sy(0)}"/>`;
    s += `<text class="lbl" x="${x0 + pw / 2}" y="16" text-anchor="middle" font-weight="600">${p.t}</text><text class="tick" x="${x0 + pw / 2}" y="${H - 12}" text-anchor="middle">${p.s}</text>`;
  });
  el.innerHTML = `<div class="wtitle"><b>Shape of a distribution</b><span>The long tail pulls the mean</span></div>
    <div class="legend"><span><i></i>Mean</span><span><i class="med"></i>Median</span></div>
    <div class="viz"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Three distributions: right-skewed, symmetric and left-skewed, each with its mean and median">${s}</svg></div>`;
};

/* Chi-square and F explorers, following the course tables (area BELOW the value) */
const CHI_COLS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 0.75, 0.9, 0.95, 0.975, 0.99, 0.995];
const CHI_DFS = [...Array(30)].map((_, i) => i + 1).concat([40, 60]);
const F_COLS = [0.9, 0.95, 0.975, 0.99, 0.995];
const F_DFS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30, 60, 120];
const p3 = p => (+p).toFixed(3);
function posExplorer(el, kind) {
  const isF = kind === "f", st = isF ? { mode: "find", m: 5, n: 6, p: 0.95, v: 2 } : { mode: "find", df: 12, p: 0.975, v: 10 };
  const levels = isF ? [0.005, 0.01, 0.025, 0.05, 0.1, ...F_COLS] : CHI_COLS;
  const sub = () => isF ? `F<sub>${st.m},${st.n}</sub>` : `χ²<sub>${st.df}</sub>`;
  const cdf = x => isF ? M.fcdf(x, st.m, st.n) : M.chi2cdf(x, st.df);
  const inv = p => isF ? M.finv(p, st.m, st.n) : M.chi2inv(p, st.df);
  const dpv = () => isF && !(st.mode === "find" && st.p < 0.5) ? 2 : 3;
  el.innerHTML = `<div class="wtitle"><b>${isF ? "F" : "Chi-square"} explorer</b><span>${isF ? "m = numerator df, n = denominator df" : "Change df and watch the shape"}</span></div>
    <div class="seg"><button type="button" data-mode="find">Value from an area</button><button type="button" data-mode="area">Area from a value</button></div>
    <div class="ctl"></div><div class="dviz"></div><div class="readout"></div>`;
  const opt = (v, cur, lbl = v) => `<option value="${v}" ${+cur === +v ? "selected" : ""}>${lbl}</option>`;
  const ctl = () => {
    let h = isF ? `<label class="field"><span>m (numerator df)</span><select data-k="m">${F_DFS.map(v => opt(v, st.m)).join("")}</select></label><label class="field"><span>n (denominator df)</span><select data-k="n">${F_DFS.map(v => opt(v, st.n)).join("")}</select></label>`
      : `<div class="field"><span>Degrees of freedom (df)</span><div class="row"><input type="range" data-k="df" min="1" max="60" step="1" value="${st.df}"><input type="number" data-k="df" min="1" max="200" step="1" value="${st.df}"></div></div>`;
    h += st.mode === "find" ? `<label class="field"><span>Area below the value</span><select data-k="p">${levels.map(v => opt(v, st.p, p3(v))).join("")}</select></label>`
      : `<div class="field"><span>Value (or drag on the curve)</span><input type="number" data-k="v" min="0" step="0.01" value="${st.v}"></div>`;
    $(".ctl", el).innerHTML = h;
    $$(".seg button", el).forEach(b => b.setAttribute("aria-pressed", b.dataset.mode === st.mode));
  };
  const val = () => st.mode === "find" ? inv(st.p) : st.v;
  const opts = () => { const v = val(); return { dist: isF ? "f" : "chi2", df: st.df, m: st.m, n: st.n, regions: [[0, v]], marks: [{ x: v, label: `${isF ? "f" : "q"} = ${f(v, dpv())}` }],
    onPick: st.mode === "area" ? x => { st.v = Math.max(0, x); const i = $('[data-k="v"]', el); if (i) i.value = st.v; update(); } : null, aria: `${isF ? "F" : "Chi-square"} curve with the area below the value shaded` }; };
  const readout = () => {
    const v = val(), R = $(".readout", el); let h;
    if (st.mode === "find") {
      let how;
      if (!isF) how = CHI_DFS.includes(st.df) ? `χ²-table: row df = ${st.df}, column ${p3(st.p)} → q = ${f(v, 3)}.` : `df = ${st.df} is not a row of the table (it jumps from 30 to 40 and 60). Excel gives the exact value.`;
      else if (st.p >= 0.9) how = `F-table: block n = ${st.n}, line ${p3(st.p)}, column m = ${st.m} → f = ${f(v, 2)}.`;
      else { const up = M.finv(1 - st.p, st.n, st.m); how = `An area below ${p3(st.p)} is not in the table. Swap the df and take the reciprocal: f = 1 / f<sub>${p3(1 - st.p)}; ${st.n},${st.m}</sub> = 1 / ${f(up, 2)} = ${f(1 / up, 3)}.`; }
      h = `<div class="big">P(${sub()} &lt; ${isF ? "f" : "q"}) = ${p3(st.p)} → ${isF ? "f" : "q"} = <em>${f(v, dpv())}</em></div><div class="sub">${how} The area above is 1 − ${p3(st.p)} = ${p3(1 - st.p)}.</div>
        <div class="sub">Excel: ${xl(isF ? `=F.INV(${g4(st.p)},${st.m},${st.n})` : `=CHISQ.INV(${g4(st.p)},${st.df})`)}</div>`;
    } else {
      const c = cdf(v);
      h = `<div class="big">P(${sub()} &lt; ${f(v, 2)}) = <em>${f(c, 4)}</em></div><div class="sub">Area above: P(${sub()} &gt; ${f(v, 2)}) = 1 − ${f(c, 4)} = ${f(1 - c, 4)}. With the table you can only bracket this between two columns.</div>
        <div class="sub">Excel: ${xl(isF ? `=F.DIST(${fx(v, 2)},${st.m},${st.n},TRUE)` : `=CHISQ.DIST(${fx(v, 2)},${st.df},TRUE)`)}</div>`;
    }
    R.innerHTML = h;
  };
  let curve;
  const update = () => { curve(); readout(); };
  el.addEventListener("click", e => { const b = e.target.closest(".seg button"); if (!b) return; if (st.mode === "find" && b.dataset.mode === "area") st.v = +val().toFixed(2); st.mode = b.dataset.mode; ctl(); update(); });
  el.addEventListener("input", e => {
    const k = e.target.dataset.k; if (!k) return; const v = parseFloat(e.target.value); if (!Number.isFinite(v)) return;
    if (k === "df") { st.df = clamp(Math.round(v), 1, 200); $$('[data-k="df"]', el).forEach(i => { if (i !== e.target) i.value = Math.min(st.df, i.type === "range" ? 60 : 200); }); }
    else if (k === "v") { if (v < 0) return; st.v = v; } else st[k] = v;
    update();
  });
  ctl(); curve = makeCurve($(".dviz", el), opts); update();
}
WIDGETS.chi2explorer = el => posExplorer(el, "chi2");
WIDGETS.fexplorer = el => posExplorer(el, "f");

/* variable types: labels, a bank of general examples, and the dataset's clear-cut columns */
const VT = { nominal: "Qualitative · nominal", ordinal: "Qualitative · ordinal", discrete: "Quantitative · discrete", continuous: "Quantitative · continuous" };
const VT_ORDER = ["nominal", "ordinal", "discrete", "continuous"];
const VT_WHY = {
  nominal: "The values are labels with no natural order, so it is qualitative and nominal.",
  ordinal: "The values are categories with a natural order, but the distances between them are not defined, so it is qualitative and ordinal.",
  discrete: "The values are numbers you can do arithmetic with, and they are counts (0, 1, 2, …) with gaps in between, so it is quantitative and discrete.",
  continuous: "The values are numbers you can do arithmetic with, and they are measured, so any value in an interval is possible. It is quantitative and continuous."
};
const VARS = [
  { name: "Number of siblings", vals: "0, 2, 1, 3", type: "discrete" },
  { name: "Height in cm", vals: "172.4, 165.0, 181.3", type: "continuous" },
  { name: "Nationality", vals: "Portuguese, German, Italian", type: "nominal" },
  { name: "Customer satisfaction", vals: "low, medium, high", type: "ordinal" },
  { name: "Price of a coffee in €", vals: "1.20, 0.85, 2.40", type: "continuous", note: "Money is treated as continuous." },
  { name: "Customers arriving per hour", vals: "14, 9, 22", type: "discrete" },
  { name: "Waiting time for the bus in minutes", vals: "3.7, 12.1, 0.4", type: "continuous" },
  { name: "Eye colour", vals: "blue, brown, green", type: "nominal" },
  { name: "Highest education level", vals: "high school, bachelor, master, PhD", type: "ordinal" },
  { name: "Country code (Portugal = 1, Germany = 2, Spain = 3)", vals: "1, 3, 2", type: "nominal", note: "The numbers are only labels: an average country code of 2 means nothing." },
  { name: "T-shirt size", vals: "S, M, L, XL", type: "ordinal" },
  { name: "Defective items in a batch", vals: "0, 3, 1", type: "discrete" },
  { name: "Weight of a parcel in kg", vals: "2.35, 0.80, 5.12", type: "continuous" },
  { name: "Payment method", vals: "cash, card, mobile", type: "nominal" },
  { name: "Rating from 1 (very bad) to 5 (very good)", vals: "4, 2, 5", type: "ordinal", note: "The numbers show an order, but the step from 1 to 2 need not equal the step from 4 to 5." },
  { name: "Credit rating", vals: "AAA, AA, A, BBB", type: "ordinal" },
  { name: "Cars in a household", vals: "0, 1, 2", type: "discrete" },
  { name: "Daily temperature in °C", vals: "18.4, 21.7, 15.2", type: "continuous" },
  { name: "Blood type", vals: "A, B, AB, 0", type: "nominal" },
  { name: "Goals scored in a match", vals: "0, 2, 5", type: "discrete" },
  { name: "Postal code", vals: "1000, 4050, 2780", type: "nominal", note: "Postal codes are numbers, but adding or averaging them means nothing." },
  { name: "Finishing place in a race", vals: "1st, 2nd, 3rd", type: "ordinal" },
  { name: "Time to finish an exam in minutes", vals: "84.5, 102.0, 71.3", type: "continuous" },
  { name: "Industry of a firm", vals: "retail, banking, energy", type: "nominal" }
];
const DATA_VARS = [
  { i: 0, type: "nominal", note: "S001, S002, … only identify students; there is nothing to add or order." },
  { i: 2, type: "nominal" }, { i: 3, type: "nominal" },
  { i: 4, type: "nominal", note: "Yes / No has no natural order." },
  { i: 5, type: "ordinal", note: "Low < Medium < High has an order, but the gaps are not defined." },
  { i: 6, type: "continuous", note: "Hours are measured: 9.5 h is as possible as 9.53 h." },
  { i: 7, type: "continuous", note: "Hours are measured: 6.9 h is as possible as 6.93 h." }
];
const CENTER_FOR = { nominal: "Mode", ordinal: "Median", discrete: "Mean", continuous: "Mean" };
const CENTER_WHY = {
  nominal: "Nominal categories have no order and no numbers to add, so only the <b>mode</b> (most frequent category) makes sense.",
  ordinal: "Ordinal categories can be sorted, so the <b>median</b> (middle category) makes sense. The mean does not, because the distances are not defined.",
  discrete: "Quantitative values can be added and divided, so the <b>mean</b> makes sense and uses every value. (The median works too, but the mean carries more information.)",
  continuous: "Quantitative values can be added and divided, so the <b>mean</b> makes sense and uses every value. (The median works too, but the mean carries more information.)"
};
const CATS = { 2: ["Female", "Male", "Non-binary"], 3: ["Solo", "Group", "Tutoring", "OnlineResources"], 4: ["Yes", "No"], 5: ["Low", "Medium", "High"] };
const GCOND = { pass: [10, "Pass"], fail: [10, "Fail"], female: [2, "Female"], male: [2, "Male"], job: [4, "Yes"], nojob: [4, "No"], solo: [3, "Solo"], group: [3, "Group"], tutor: [3, "Tutoring"], online: [3, "OnlineResources"], lowstress: [5, "Low"], highstress: [5, "High"] };
const classSteps = (type, note) => `<ol>
  <li>Is it a number you can do arithmetic with (would an average make sense)? <b>${type === "discrete" || type === "continuous" ? "Yes → quantitative" : "No → qualitative"}</b>.</li>
  <li>${type === "discrete" || type === "continuous" ? `Is it counted or measured? <b>${type === "discrete" ? "Counted → discrete" : "Measured → continuous"}</b>.` : `Do the categories have a natural order? <b>${type === "ordinal" ? "Yes → ordinal" : "No → nominal"}</b>.`}</li>
  <li>Answer: <b>${VT[type]}</b>. ${note || ""}</li></ol>`;

/* Sort the variable: a quick classifier in the lesson */
WIDGETS.classify = el => {
  let order = [...VARS].sort(() => Math.random() - 0.5), k = 0, score = 0, done = 0, answered = false;
  const draw = () => {
    const v = order[k % order.length];
    el.innerHTML = `<div class="wtitle"><b>Sort the variable</b><span>${done ? `${score} / ${done} right` : "Pick the type"}</span></div>
      <div class="vcard"><span class="vn">${v.name}</span><span class="vv">e.g. ${v.vals}</span></div>
      <div class="choices">${VT_ORDER.map(t => `<button class="choice" type="button" data-t="${t}">${VT[t]}</button>`).join("")}</div>
      <div id="cl-fb" aria-live="polite"></div><div><button class="btn ghost" type="button" id="cl-next">Next variable →</button></div>`;
    $$(".choice", el).forEach(b => b.addEventListener("click", () => {
      const ok = b.dataset.t === v.type;
      if (!answered) { answered = true; done++; if (ok) score++; $(".wtitle span", el).textContent = `${score} / ${done} right`; }
      b.classList.add(ok ? "right" : "wrong");
      if (ok) $$(".choice", el).forEach(x => x.disabled = true);
      $("#cl-fb", el).innerHTML = ok ? `<div class="feed ok">${VT_WHY[v.type]} ${v.note || ""}</div>` : `<div class="feed no">Not quite. Ask: would an average make sense? Then: counted or measured, ordered or not?</div>`;
    }));
    $("#cl-next", el).addEventListener("click", () => { k++; answered = false; draw(); $(".choice", el).focus(); });
  };
  draw();
};

/* helpers for the practice generators of parts 2, 3, 5 and 7 */
const sortN = a => [...a].sort((x, y) => x - y);
const qStep = (s, p, name) => { const h = 1 + (s.length - 1) * p, lo = Math.floor(h), fr = +(h - lo).toFixed(4), v = M.qInc(s, p);
  return `<li>${name}: position 1 + (${s.length} − 1) × ${p} = ${g4(h)}${fr ? ` → between sorted values no. ${lo} and ${lo + 1}: ${s[lo - 1]} + ${g4(fr)} × (${s[lo]} − ${s[lo - 1]}) = ${g4(v)}` : ` → sorted value no. ${lo}: ${g4(v)}`}.</li>`; };
const iqrNote = (ans, e, t) => { const o = [...new Set([e, t].map(x => g4(x)))].filter(x => x !== g4(ans)); return o.length ? `<p class="sub" style="margin:0">Other quartile methods give ${o.join(" or ")}; those answers also count.</p>` : ""; };
const randPMF = (k, start = 0) => { const c = Array(k + 1).fill(1); for (let r = 0; r < 20 - (k + 1); r++) c[ri(0, k)]++; return { xs: c.map((_, i) => start + i), ps: c.map(x => x / 20) }; };
const pmfTable = (xs, ps, hide = -1, dp = 2) => `<div class="tablewrap"><table class="t"><tbody><tr><th>x</th>${xs.map(x => `<td class="m">${x}</td>`).join("")}</tr><tr><th>P(X = x)</th>${ps.map((p, i) => `<td class="m">${i === hide ? "?" : f(p, dp)}</td>`).join("")}</tr></tbody></table></div>`;
const momentTable = (xs, ps, mu) => `<div class="tablewrap"><table class="t"><thead><tr><th>x</th><th>P(X = x)</th><th>x · P</th><th>x² · P</th></tr></thead><tbody>${xs.map((x, i) => `<tr><td class="m">${x}</td><td class="m">${f(ps[i], 2)}</td><td class="m">${g4(x * ps[i])}</td><td class="m">${g4(x * x * ps[i])}</td></tr>`).join("")}
  <tr><td>Sum</td><td class="m">1</td><td class="m">${g4(mu)}</td><td class="m">${g4(xs.reduce((s, x, i) => s + x * x * ps[i], 0))}</td></tr></tbody></table></div>`;
const SHAPE_Q = [
  { c: "Monthly salaries in a company", u: "€", type: "right", md: [1800, 2300], dp: 0 },
  { c: "House prices in a city", u: "thousand €", type: "right", md: [250, 400], dp: 0 },
  { c: "Waiting times at a call centre", u: "minutes", type: "right", md: [3, 8], dp: 1 },
  { c: "Scores on a very easy exam", u: "points", type: "left", md: [80, 90], dp: 1 },
  { c: "Age at retirement", u: "years", type: "left", md: [63, 66], dp: 1 },
  { c: "Heights of adult women", u: "cm", type: "sym", md: [162, 168], dp: 1 },
  { c: "Weights of 1 kg sugar packs", u: "g", type: "sym", md: [998, 1002], dp: 1 }
];
const SKEW_LBL = { right: "Right-skewed", sym: "Approximately symmetric", left: "Left-skewed" };
const PS_BANK = [
  ["The average monthly income of all households in Portugal", "Parameter", "It describes the whole population of households."],
  ["The average monthly income of 500 households in a survey", "Statistic", "It is computed from a sample of 500 households."],
  ["The proportion of all students at your university who commute by metro", "Parameter", "It describes every student, the whole population."],
  ["The share of metro commuters among 80 students you asked", "Statistic", "It is computed from a sample of 80 students."],
  ["The standard deviation of the weights of every cereal box a factory produced last year", "Parameter", "It describes all boxes, the whole population."],
  ["The standard deviation of the weights of 30 boxes taken from the production line", "Statistic", "It is computed from a sample of 30 boxes."],
  ["The mean grade of the 40 students who answered your questionnaire", "Statistic", "It is computed from the 40 students in the sample."],
  ["The true mean waiting time of all customers of a call centre", "Parameter", "It describes all customers, the whole population."],
  ["p̂ = 0.42, the share of yes-answers in a poll of 1,000 voters", "Statistic", "It is computed from a sample of 1,000 voters (and the hat ^ marks a sample value)."],
  ["μ, the mean height of all adults in Spain", "Parameter", "It describes all adults in Spain (and Greek letters mark population values)."]
];
const EST_BANK = [
  ["The rule “use the sample mean X̄ to estimate μ”", "Estimator", "It is a rule that works for any sample, so its value changes from sample to sample."],
  ["x̄ = 71.3, the mean grade in your sample of 40 students", "Estimate", "It is one number, from one particular sample."],
  ["S² = Σ(Xᵢ − X̄)² / (n − 1), used to estimate σ²", "Estimator", "It is a formula (a rule), not a number from one sample."],
  ["s² = 12.4, computed from 25 measured parts", "Estimate", "It is the value the rule gave for this one sample."],
  ["Using the sample proportion P̂ to estimate the population proportion p", "Estimator", "It is a rule that can be applied to any sample."],
  ["p̂ = 0.38 from a survey of 300 customers", "Estimate", "It is one number, from one particular survey."]
];
const F_M = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30], F_N = [3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 30, 60];
const PAIRS = [["pass", "fail"], ["female", "male"], ["job", "nojob"], ["lowstress", "highstress"]];
const grp = k => GROUPS.find(g => g.key === k);

const WEEK1_PARTS = [
/* ------------------------------------------------------------- Part 1 */
{
  title: "Data and variables",
  intro: "Before computing anything, look at what kind of data you have. The type of a variable decides which summaries and methods make sense.",
  buildsOn: "nothing, this is the starting point",
  bridge: "Quantitative data → measure center and spread",
  summary: [
    "Data is a table: each <b>row</b> is an observation, each <b>column</b> is a variable.",
    "<b>Quantitative</b> variables are numbers you can do arithmetic with: <b>discrete</b> if counted, <b>continuous</b> if measured.",
    "<b>Qualitative</b> variables are categories: <b>nominal</b> without order, <b>ordinal</b> with an order but no defined distances.",
    "Numeric codes (Portugal = 1) do not make a variable quantitative. Nominal → mode, ordinal → median, quantitative → mean."
  ],
  concepts: [
    { name: "Observations and variables", tag: "Basics",
      idea: `<p>Data is usually stored as a table. Each <b>row</b> is one <b>observation</b>: one person, firm, day or product. Each <b>column</b> is a <b>variable</b>: a characteristic that can differ from one observation to the next.</p>`,
      example: `<p>A small survey of four people:</p><div class="tablewrap"><table class="t"><thead><tr><th>Person</th><th>Country</th><th>Satisfaction</th><th>Siblings</th><th>Height (cm)</th></tr></thead><tbody>
        <tr><td>1</td><td>Portugal</td><td>high</td><td class="m">2</td><td class="m">172.4</td></tr>
        <tr><td>2</td><td>Germany</td><td>low</td><td class="m">0</td><td class="m">181.3</td></tr>
        <tr><td>3</td><td>Spain</td><td>medium</td><td class="m">1</td><td class="m">165.0</td></tr>
        <tr><td>4</td><td>Portugal</td><td>high</td><td class="m">3</td><td class="m">169.8</td></tr></tbody></table></div>
        <p>4 observations (rows) and 4 variables (columns). Each column is a different type of variable; the next concepts sort them out.</p>`,
      watch: `<p>The type of a variable decides what you may compute. An average height makes sense; an "average country" does not. So classify the variables first.</p>`,
      keys: [["Observation vs variable", "row = one observation · column = one variable", ""]] },
    { name: "Quantitative variables", tag: "Type",
      idea: `<p>A <b>quantitative</b> (metric) variable is a number where arithmetic makes sense: differences and averages mean something. There are two kinds.</p>
        <ul><li><b>Discrete</b>: countable values with gaps in between, such as 0, 1, 2, 3. You get them by <b>counting</b>.</li><li><b>Continuous</b>: any value in an interval is possible. You get them by <b>measuring</b>.</li></ul>`,
      steps: `<ol><li>Check that an average would make sense. If yes, the variable is quantitative.</li><li>Ask: was it counted or measured? Counted → discrete. Measured → continuous.</li></ol>`,
      example: `<ul><li>Discrete: number of siblings (0, 1, 2), customers per hour, defective items in a batch.</li><li>Continuous: height (172.4 cm), waiting time (3.7 min), price (€1.20).</li></ul>`,
      watch: `<p>Continuous values are often rounded when recorded (height as 172 cm), but the variable is still continuous. Money is usually treated as continuous too.</p>`,
      keys: [["Discrete", "counted: countable values with gaps (0, 1, 2, …)", ""], ["Continuous", "measured: any value in an interval", ""]] },
    { name: "Qualitative variables", tag: "Type",
      idea: `<p>A <b>qualitative</b> (categorical) variable puts each observation into a category or group. There are two kinds.</p>
        <ul><li><b>Nominal</b>: the categories have no order, such as nationality or eye colour.</li><li><b>Ordinal</b>: the categories have a natural order, but the distances between them are not defined, such as satisfaction (low &lt; medium &lt; high).</li></ul>`,
      steps: `<ol><li>Check that the values are labels or groups, not quantities.</li><li>Ask: can the categories be sorted in a meaningful way? Yes → ordinal. No → nominal.</li></ol>`,
      example: `<ul><li>Nominal: nationality, payment method (cash, card, mobile), blood type.</li><li>Ordinal: education level (high school &lt; bachelor &lt; master), T-shirt size (S &lt; M &lt; L), credit rating.</li></ul>`,
      watch: `<p><b>Numbers can be labels.</b> If countries are coded Portugal = 1, Germany = 2, Spain = 3, the variable is still nominal: an average of 2 means nothing. A rating from 1 to 5 is ordinal: the order is real, but "4 − 2" is not a meaningful distance.</p>`,
      keys: [["Nominal", "categories without order", ""], ["Ordinal", "ordered categories; distances not defined", ""]] },
    { name: "Classifying a variable", tag: "Method",
      idea: `<p>Two questions are enough to classify any variable.</p>`,
      steps: `<div class="vtree"><div class="vq"><b>Question 1.</b> Is it a number where arithmetic makes sense (would an average mean something)?</div>
        <div class="vbr"><b>Yes → Quantitative</b><span class="sub">Question 2: counted or measured?</span><div class="vsub"><div><b>Discrete</b>counted</div><div><b>Continuous</b>measured</div></div></div>
        <div class="vbr"><b>No → Qualitative</b><span class="sub">Question 2: is there a natural order?</span><div class="vsub"><div><b>Nominal</b>no order</div><div><b>Ordinal</b>ordered</div></div></div></div>`,
      example: `<p>The survey from concept 1.1:</p><ul><li>Country: not a quantity, no order → <b>nominal</b>.</li><li>Satisfaction: not a quantity, ordered → <b>ordinal</b>.</li><li>Siblings: a quantity, counted → <b>discrete</b>.</li><li>Height: a quantity, measured → <b>continuous</b>.</li></ul>`,
      watch: `<p>Don't judge by how the values look. Ask what they mean: postal codes and jersey numbers are numbers, but they are nominal.</p>`,
      widgets: ["classify"],
      keys: [["Classify a variable", "average makes sense? yes → quantitative (counted → discrete, measured → continuous) · no → qualitative (ordered → ordinal, else nominal)", ""]] },
    { name: "What you can compute", tag: "Summaries",
      idea: `<p>Each type allows a different set of summaries. Every type allows counting how often each value occurs: the <b>frequency</b>. The most frequent value is the <b>mode</b>.</p>`,
      formula: `<div class="formula"><div class="fb">relative frequency = ${fr("count", "n")}</div><span class="fn">count = how often a category occurs · n = number of observations</span></div>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th>Type</th><th>Frequencies, mode</th><th>Median, percentiles</th><th>Mean, variance, SD</th></tr></thead><tbody>
        <tr><td>Nominal</td><td>✓</td><td>–</td><td>–</td></tr>
        <tr><td>Ordinal</td><td>✓</td><td>✓</td><td>–</td></tr>
        <tr><td>Quantitative</td><td>✓</td><td>✓</td><td>✓</td></tr></tbody></table></div>
        <p>Survey countries Portugal, Germany, Spain, Portugal: Portugal occurs 2 times, so its relative frequency is 2 / 4 = <b class="num">0.5</b> and the mode is <b>Portugal</b>.</p>
        <p>Numbers 2, 4, 4, 6, 9: the mode is <b class="num">4</b>, because it occurs twice.</p>`,
      watch: `<p>A variable can have no mode (all values different) or several modes (a tie). In Excel, ${xl("=MODE.SNGL()")} only works on numbers; for categories count each one with ${xl("=COUNTIF()")}.</p>`,
      keys: [["Mode", "the most frequent value or category", "=MODE.SNGL(range)"], ["Relative frequency", `${fr("count", "n")}`, "=COUNTIF(range,\"Yes\")/COUNTA(range)"]] }
  ],
  practice: [
    { key: "classify", label: "Classify a variable", mode: "general", gen() {
      const v = pick(VARS);
      return { q: `<p>Classify this variable:</p><div class="vcard"><span class="vn">${v.name}</span><span class="vv">e.g. ${v.vals}</span></div>`,
        ans: VT[v.type], choices: VT_ORDER.map(t => VT[t]), steps: classSteps(v.type, v.note) };
    } },
    { key: "center", label: "Which measure of center?", mode: "general", gen() {
      const v = pick(VARS);
      return { q: `<p>Which measure of center is meaningful for this variable <b>and</b> uses the most information?</p><div class="vcard"><span class="vn">${v.name}</span><span class="vv">e.g. ${v.vals}</span></div>`,
        ans: CENTER_FOR[v.type], choices: ["Mode", "Median", "Mean"],
        steps: `<ol><li>Type: <b>${VT[v.type]}</b>. ${v.note || ""}</li><li>${CENTER_WHY[v.type]}</li></ol>` };
    } },
    { key: "mode", label: "Mode", mode: "general", gen() {
      let v, m;
      do { v = [...Array(ri(7, 11))].map(() => ri(1, 9)); const c = {}; v.forEach(x => c[x] = (c[x] || 0) + 1); const top = Math.max(...Object.values(c)); m = Object.keys(c).filter(k => c[k] === top); if (top < 2) m = []; } while (m.length !== 1);
      const ans = +m[0], cnt = v.filter(x => x === ans).length, s = [...v].sort((a, b) => a - b);
      return { q: `<p>Find the mode of these values:</p>${valChips(v)}`, ans, dp: 0,
        steps: `<ol><li>Sort them so equal values sit together:${valChips(s, s.map((x, k) => x === ans ? k : -1).filter(k => k >= 0))}</li><li>${ans} occurs ${cnt} times, more than any other value, so the mode is <b class="num">${ans}</b>.</li></ol>`, excel: "=MODE.SNGL(range)" };
    } },
    { key: "dclass", label: "Classify a column", mode: "data", gen() {
      const d = pick(DATA_VARS), ex = [...new Set(RAW.map(r => r[d.i]))].slice(0, 4).join(", ");
      return { q: `<p>Classify the column <b>${COLS[d.i]}</b> in Data.xlsx.</p><div class="vcard"><span class="vv">e.g. ${ex}</span></div>`,
        ans: VT[d.type], choices: VT_ORDER.map(t => VT[t]), steps: classSteps(d.type, d.note) };
    } },
    { key: "dmode", label: "Mode of a category", mode: "data", gen() {
      let i, g, v, c, top, m;
      do { i = pick([2, 3, 4, 5]); g = pick(GROUPS); v = col(i, g); c = {}; v.forEach(x => c[x] = (c[x] || 0) + 1); top = Math.max(...Object.values(c)); m = Object.keys(c).filter(k => c[k] === top); }
      while (m.length !== 1 || Object.keys(c).length < 2);
      const L = LETTERS[i];
      return { q: `<p>What is the <b>mode</b> of <b>${COLS[i]}</b> for <b>${g.label.toLowerCase()}</b>?</p>`, ans: m[0], choices: CATS[i],
        steps: `<ol><li>Keep only ${g.label.toLowerCase()}: n = ${v.length}.</li><li>Count each category: ${CATS[i].map(k => `${k} ${c[k] || 0}`).join(" · ")}.</li><li>The most frequent is <b>${m[0]}</b> (${top} of ${v.length}).</li></ol>
          <p class="sub" style="margin:0">Excel: count each category with ${xl(g.key === "all" ? `=COUNTIF(${L}2:${L}61,"${m[0]}")` : `=COUNTIFS(${L}2:${L}61,"${m[0]}",${LETTERS[GCOND[g.key][0]]}2:${LETTERS[GCOND[g.key][0]]}61,"${GCOND[g.key][1]}")`)}</p>` };
    } },
    { key: "dfreq", label: "Frequency", mode: "data", gen() {
      let i, g, k, v;
      do { i = pick([2, 3, 4, 5]); g = pick(GROUPS); k = pick(CATS[i]); v = col(i, g); } while (new Set(v).size < 2);
      const ans = v.filter(x => x === k).length, L = LETTERS[i];
      return { q: `<p>How many of the <b>${g.label.toLowerCase()}</b> have <b>${COLS[i]} = ${k}</b>?</p>`, ans, dp: 0,
        steps: `<ol><li>Keep only ${g.label.toLowerCase()}: n = ${v.length}.</li><li>Count the rows with ${COLS[i]} = ${k}: <b class="num">${ans}</b>.</li><li>As a relative frequency: ${ans} / ${v.length} = ${f(ans / v.length, 3)}.</li></ol>`,
        excel: g.key === "all" ? `=COUNTIF(${L}2:${L}61,"${k}")` : `=COUNTIFS(${L}2:${L}61,"${k}",${LETTERS[GCOND[g.key][0]]}2:${LETTERS[GCOND[g.key][0]]}61,"${GCOND[g.key][1]}")` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 2 */
{
  title: "Center, spread and shape",
  intro: "A few numbers summarise most quantitative data: where the values sit (the center), how far they spread out, and the shape of the distribution. This part builds them one step at a time.",
  buildsOn: "quantitative variables from Part 1",
  bridge: "From data to probability models",
  summary: [
    "The <b>mean</b> is the balance point; the <b>median</b> is the middle value. Outliers pull the mean but not the median.",
    "<b>Variance</b> is the average squared distance from the mean; the <b>standard deviation</b> is its square root, in the original units.",
    "Divide by <b>n − 1</b> for a sample, by <b>N</b> for a whole population.",
    "The <b>range</b> uses only the extremes; the <b>IQR</b> = Q3 − Q1 covers the middle 50% and resists outliers. The <b>CV</b> = s / x̄ compares spread across units.",
    "<b>Skewness</b>: mean &gt; median suggests a right skew, mean &lt; median a left skew. <b>Kurtosis</b> above 3 (excess above 0) means heavier tails than the normal."
  ],
  concepts: [
    { name: "Mean", tag: "Center",
      idea: `<p>The mean adds up every value and shares the total equally. Think of the values as weights on a ruler: the mean is where the ruler balances.</p>`,
      formula: `<div class="formula"><div class="fb">x̄ = ${fr("Σx", "n")}</div><span class="fn">Σx = sum of all values · n = number of values</span></div>`,
      steps: `<ol><li>Add up all the values.</li><li>Count how many values there are.</li><li>Divide the sum by the count.</li></ol>`,
      example: `<p>Seven quiz scores:</p>${valChips(EX)}<p>Σx = 4 + 8 + 6 + 5 + 3 + 7 + 9 = 42, n = 7, so x̄ = 42 / 7 = <b class="num">6</b>.</p>`,
      watch: `<p>One extreme value pulls the mean a long way. For 3, 4, 5, 6, 52 the mean is 70 / 5 = 14, even though four of the five values are 6 or less.</p>`,
      keys: [["Mean", `x̄ = ${fr("Σx", "n")}`, "=AVERAGE(range)"]] },
    { name: "Median", tag: "Center",
      idea: `<p>The median is the middle value once the data is sorted. Half the values lie below it and half above.</p>`,
      formula: `<div class="formula"><div class="fb">position = ${fr("n + 1", "2")}</div><span class="fn">the position of the median in the sorted list</span></div>`,
      steps: `<ol><li>Sort the values from low to high.</li><li>Find the position (n + 1) / 2.</li><li>If n is odd, take the value at that position. If n is even, average the two middle values.</li></ol>`,
      example: `<p><b>Odd n.</b> The seven scores sorted:</p>${valChips([3, 4, 5, 6, 7, 8, 9], [3])}<p>Position (7 + 1) / 2 = 4, so the median is <b class="num">6</b>.</p>
        <p><b>Even n.</b> 3, 5, 8, 10, 12, 15: position (6 + 1) / 2 = 3.5, between 8 and 10, so the median is (8 + 10) / 2 = <b class="num">9</b>.</p>`,
      watch: `<p>Always sort first. The median of 3, 4, 5, 6, 52 is 5, while the mean is 14. With outliers or skewed data, the median describes a typical value better.</p>`,
      widgets: ["balance"],
      keys: [["Median", "middle of the sorted data; n even → average of the two middle values", "=MEDIAN(range)"]] },
    { name: "Variance", tag: "Spread",
      idea: `<p>Two groups can share the same mean but differ a lot in spread. Variance measures spread as the average <b>squared</b> distance from the mean. Squaring makes every distance positive and weighs big distances more.</p>`,
      formula: `<div class="formula"><div class="fb">s² = ${fr("Σ(x − x̄)²", "n − 1")}</div><span class="fn">sample variance</span></div>`,
      steps: `<ol><li>Find the mean x̄.</li><li>Subtract it from every value: x − x̄.</li><li>Square each difference.</li><li>Add the squares. This sum is SS, the sum of squares.</li><li>Divide by n − 1.</li></ol>`,
      example: `<p>The seven scores, with x̄ = 6:</p>${devTable(EX)}<p>SS = 28, so s² = 28 / (7 − 1) = <b class="num">4.667</b>.</p>`,
      watch: `<p>The deviations always add up to 0. That is a quick check of your table. Variance is in squared units (points², hours²), which is why we usually report the standard deviation.</p>`,
      keys: [["Sample variance", `s² = ${fr("Σ(x − x̄)²", "n − 1")}`, "=VAR.S(range)"], ["Population variance", `σ² = ${fr("Σ(x − μ)²", "N")}`, "=VAR.P(range)"]] },
    { name: "Standard deviation", tag: "Spread",
      idea: `<p>The standard deviation (SD) is the square root of the variance. It brings the spread back to the original units, so you can read it as a typical distance from the mean.</p>`,
      formula: `<div class="formula"><div class="fb">s = √s²</div><span class="fn">sample SD</span></div>`,
      steps: `<ol><li>Compute the variance s² (concept 2.3).</li><li>Take the square root.</li></ol>`,
      example: `<p>For the seven scores, s² = 4.667, so s = √4.667 = <b class="num">2.160</b>. A typical score sits about 2.2 points from the mean of 6.</p>`,
      watch: `<p>Don't take the square root of the deviations one by one. Square, add, divide, and only then take the root.</p>`,
      widgets: ["calc"],
      keys: [["Standard deviation", "s = √s²", "=STDEV.S(range)"]] },
    { name: "Sample or population?", tag: "Spread",
      idea: `<p>Divide by <b>n − 1</b> when your data is a <b>sample</b> from a bigger group, which is the usual case. Divide by <b>N</b> only when you have every member of the group you care about (the <b>population</b>).</p>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th></th><th>Sample (÷ n − 1)</th><th>Population (÷ N)</th></tr></thead><tbody>
        <tr><td>Symbols</td><td>x̄, s², s</td><td>μ, σ², σ</td></tr>
        <tr><td>Excel</td><td>${xl("=VAR.S()")} ${xl("=STDEV.S()")}</td><td>${xl("=VAR.P()")} ${xl("=STDEV.P()")}</td></tr>
        <tr><td>Seven scores, variance</td><td class="m">28 / 6 = 4.667</td><td class="m">28 / 7 = 4.000</td></tr>
        <tr><td>Seven scores, SD</td><td class="m">2.160</td><td class="m">2.000</td></tr></tbody></table></div>`,
      watch: `<p>Why n − 1? The deviations are measured from x̄, which was calculated from the same data, so they come out a little too small. Dividing by n − 1 corrects for that.</p>`,
      keys: [["Sample vs population", "sample: ÷ (n − 1) · population: ÷ N", "=VAR.S / =VAR.P"]] },
    { name: "Range and IQR", tag: "Spread",
      idea: `<p>Two simpler measures of spread. The <b>range</b> is the distance from the smallest to the largest value. The <b>interquartile range (IQR)</b> is the width of the middle 50% of the data, between the first quartile Q1 (25% below it) and the third quartile Q3 (75% below it). The median is Q2.</p>`,
      formula: `<div class="formula"><div class="fb">Range = max − min</div></div> <div class="formula"><div class="fb">IQR = Q3 − Q1</div><span class="fn">position of a quartile in the sorted data: 1 + (n − 1) · p</span></div>`,
      steps: `<ol><li>Sort the values.</li><li>Range: largest minus smallest.</li><li>Q1: go to position 1 + (n − 1) × 0.25. If it falls between two values, move that fraction of the way from the lower to the upper one.</li><li>Q3: the same with 0.75.</li><li>IQR = Q3 − Q1.</li></ol>`,
      example: `<p>The seven scores sorted:</p>${valChips([3, 4, 5, 6, 7, 8, 9], [1, 2, 4, 5])}<ul><li>Range = 9 − 3 = <b class="num">6</b></li><li>Q1: position 1 + 6 × 0.25 = 2.5, halfway between 4 and 5 → 4.5</li><li>Q3: position 1 + 6 × 0.75 = 5.5, halfway between 7 and 8 → 7.5</li><li>IQR = 7.5 − 4.5 = <b class="num">3</b></li></ul>
        <p>With an outlier, 3, 4, 5, 6, 52: the range jumps to 49, but the IQR is only 6 − 4 = 2. The IQR is <b>robust</b> to outliers; the range is not.</p>`,
      watch: `<p>There are several quartile methods (Excel's ${xl("QUARTILE.INC")} and ${xl("QUARTILE.EXC")}, or the median of each half), and they can differ slightly for small samples. The practice questions accept any of them.</p>`,
      keys: [["Range", "max − min", "=MAX(range)-MIN(range)"], ["Interquartile range", "IQR = Q3 − Q1", "=QUARTILE.INC(range,3)-QUARTILE.INC(range,1)"]] },
    { name: "Coefficient of variation", tag: "Spread",
      idea: `<p>The coefficient of variation (CV) measures spread <b>relative to the mean</b>. It has no units, so it can compare the spread of variables measured in different units or with very different means.</p>`,
      formula: `<div class="formula"><div class="fb">CV = ${fr("s", "x̄")}</div><span class="fn">often shown as a percentage</span></div>`,
      steps: `<ol><li>Compute the mean x̄.</li><li>Compute the standard deviation s.</li><li>Divide: CV = s / x̄.</li></ol>`,
      example: `<p>The seven scores: CV = 2.160 / 6 = <b class="num">0.36</b>, so the SD is 36% of the mean.</p><p>Salaries in firm A: x̄ = €3,000, s = €600, CV = 0.20. Firm B: x̄ = €1,000, s = €300, CV = 0.30. Firm B has the smaller SD but the larger <b>relative</b> spread.</p>`,
      watch: `<p>The CV only makes sense for positive data with a true zero, such as money, weight or time. It is meaningless for temperatures in °C, where the mean can be close to 0.</p>`,
      keys: [["Coefficient of variation", `CV = ${fr("s", "x̄")}`, "=STDEV.S(range)/AVERAGE(range)"]] },
    { name: "Shape: skewness and kurtosis", tag: "Shape",
      idea: `<p><b>Skewness</b> describes symmetry. A <b>right</b> (positive) skew has a long tail to the right, which usually pulls the mean above the median. A <b>left</b> (negative) skew has a long tail to the left: mean below the median. In a symmetric distribution the mean and median are about equal.</p>
        <p><b>Kurtosis</b> describes how heavy the tails are. The normal distribution has kurtosis 3, or <b>excess kurtosis</b> 0. Higher values mean heavier tails, so extreme values are more common.</p>`,
      steps: `<ol><li>Compare the mean with the median: mean &gt; median suggests a right skew, mean &lt; median a left skew.</li><li>Or compute the skewness: positive = right skew, negative = left skew, about 0 = symmetric.</li><li>Kurtosis above 3 (excess above 0): heavier tails than the normal.</li></ol>`,
      example: `<ul><li>Incomes: a few very high earners stretch the right tail, so the mean income is above the median. Right-skewed.</li><li>Scores on an easy exam: most students score high, a few score low. Left-skewed.</li><li>Daily stock returns: excess kurtosis is often 3 or more, so big crashes and jumps are more common than a normal model predicts.</li></ul>`,
      watch: `<p>Excel's ${xl("=KURT()")} returns the <b>excess</b> kurtosis, so a normal distribution gives 0 there, not 3.</p>`,
      widgets: ["shapes"],
      keys: [["Skewness", "right skew: mean > median · left skew: mean < median", "=SKEW(range)"], ["Kurtosis", "normal = 3 (excess kurtosis 0); higher = heavier tails", "=KURT(range) gives the excess"]] }
  ],
  practice: [
    { key: "median", label: "Median", mode: "general", gen() {
      const n = ri(5, 10), v = [...Array(n)].map(() => ri(38, 98)), s = [...v].sort((a, b) => a - b);
      const mids = n % 2 ? [(n - 1) / 2] : [n / 2 - 1, n / 2], ans = M.median(v);
      return { q: `<p>Find the median of these ${n} exam scores:</p>${valChips(v)}`, ans, dp: 1,
        steps: `<ol><li>Sort them:${valChips(s, mids)}</li><li>n = ${n}, so the middle position is (${n} + 1) / 2 = ${(n + 1) / 2}.</li>
          <li>${n % 2 ? `The value at that position is <b class="num">${ans}</b>.` : `Average the two middle values: (${s[mids[0]]} + ${s[mids[1]]}) / 2 = <b class="num">${ans}</b>.`}</li></ol>`, excel: "=MEDIAN(range)" };
    } },
    { key: "mean", label: "Mean", mode: "general", gen() {
      const n = ri(5, 8), v = [...Array(n)].map(() => ri(51, 84) / 10), ans = M.mean(v);
      return { q: `<p>Find the mean of these values (round to 2 decimals):</p>${valChips(v)}`, ans, dp: 2,
        steps: `<ol><li>Add them: Σx = ${g4(M.sum(v))}</li><li>Divide by n = ${n}: x̄ = ${g4(M.sum(v))} / ${n} = <b class="num">${f(ans, 2)}</b></li></ol>`, excel: "=AVERAGE(range)" };
    } },
    { key: "variance", label: "Variance", mode: "general", gen() {
      const n = ri(5, 6), v = [...Array(n)].map(() => ri(3, 16)), pop = Math.random() < 0.25, ans = pop ? M.varP(v) : M.varS(v);
      return { q: `<p>These values are ${pop ? "a whole <b>population</b>" : "a <b>sample</b>"}. Find the ${pop ? "population" : "sample"} variance (round to 2 decimals).</p>${valChips(v)}`, ans, dp: 2,
        steps: `<ol><li>Mean: x̄ = ${M.sum(v)} / ${n} = ${f(M.mean(v), 3)}</li><li>Deviations and squares:${devTable(v)}</li>
          <li>${pop ? `Population: divide by N = ${n}` : `Sample: divide by n − 1 = ${n - 1}`}: ${f(M.ss(v), 4)} / ${pop ? n : n - 1} = <b class="num">${f(ans, 2)}</b></li></ol>`, excel: pop ? "=VAR.P(range)" : "=VAR.S(range)" };
    } },
    { key: "sd", label: "Standard deviation", mode: "general", gen() {
      const n = ri(5, 6), v = [...Array(n)].map(() => ri(55, 98)), ans = M.sdS(v);
      return { q: `<p>Find the sample standard deviation of these values (round to 2 decimals):</p>${valChips(v)}`, ans, dp: 2,
        steps: `<ol><li>Mean: x̄ = ${M.sum(v)} / ${n} = ${f(M.mean(v), 3)}</li><li>Deviations and squares:${devTable(v)}</li>
          <li>Variance: s² = ${f(M.ss(v), 4)} / ${n - 1} = ${f(M.varS(v), 4)}</li><li>SD: s = √${f(M.varS(v), 4)} = <b class="num">${f(ans, 2)}</b></li></ol>`, excel: "=STDEV.S(range)" };
    } },
    { key: "dstat", label: "Summary statistics", mode: "data", gen() {
      const c = pick(NUMERIC.slice(0, 4)), g = pick(GROUPS.slice(0, 7)), stat = pick(["mean", "median", "sample SD", "sample variance"]);
      const v = col(c.i, g), L = LETTERS[c.i];
      const ans = stat === "mean" ? M.mean(v) : stat === "median" ? M.median(v) : stat === "sample SD" ? M.sdS(v) : M.varS(v);
      const fnName = { mean: "AVERAGE", median: "MEDIAN", "sample SD": "STDEV.S", "sample variance": "VAR.S" }[stat];
      const steps = stat === "median"
        ? `<ol><li>Keep only ${g.label.toLowerCase()}: n = ${v.length}.</li><li>Sort the ${c.name} values:${valChips([...v].sort((a, b) => a - b), v.length % 2 ? [(v.length - 1) / 2] : [v.length / 2 - 1, v.length / 2])}</li><li>Median = <b class="num">${g4(ans)}</b></li></ol>`
        : `<ol><li>Keep only ${g.label.toLowerCase()}: n = ${v.length}.</li><li>Σx = ${g4(M.sum(v))}, so x̄ = ${f(M.mean(v), 4)}</li>
          ${stat === "mean" ? "" : `<li>SS = Σ(x − x̄)² = ${f(M.ss(v), 4)}</li><li>s² = ${f(M.ss(v), 4)} / ${v.length - 1} = ${f(M.varS(v), 4)}</li>${stat === "sample SD" ? `<li>s = √${f(M.varS(v), 4)} = ${f(M.sdS(v), 4)}</li>` : ""}`}
          <li>Answer: <b class="num">${f(ans, 2)}</b></li></ol>`;
      return { q: `<p>Find the <b>${stat}</b> of <b>${c.name}</b> for <b>${g.label.toLowerCase()}</b> (round to 2 decimals).</p>`,
        ans, dp: 2, steps, excel: g.key === "all" ? `=${fnName}(${L}2:${L}61)` : `Filter the rows first, then =${fnName}(…)` };
    } },
    { key: "rangeiqr", label: "Range and IQR", mode: "general", gen() {
      const n = ri(7, 11), v = [...Array(n)].map(() => ri(10, 60)), s = sortN(v);
      if (Math.random() < 0.3) { const ans = s[n - 1] - s[0];
        return { q: `<p>Find the <b>range</b> of these values:</p>${valChips(v)}`, ans, dp: 0,
          steps: `<ol><li>Sort them:${valChips(s, [0, n - 1])}</li><li>Range = max − min = ${s[n - 1]} − ${s[0]} = <b class="num">${ans}</b></li></ol>`, excel: "=MAX(range)-MIN(range)" }; }
      const q1 = M.qInc(v, 0.25), q3 = M.qInc(v, 0.75), ans = q3 - q1, e = M.qExc(v, 0.75) - M.qExc(v, 0.25), t = M.tukey(v);
      return { q: `<p>Find the <b>interquartile range</b> (IQR) of these values (2 decimals):</p>${valChips(v)}`, ans, dp: 2, alts: [e, t[1] - t[0]],
        steps: `<ol><li>Sort them:${valChips(s)}</li>${qStep(s, 0.25, "Q1")}${qStep(s, 0.75, "Q3")}<li>IQR = Q3 − Q1 = ${g4(q3)} − ${g4(q1)} = <b class="num">${f(ans, 2)}</b></li></ol>${iqrNote(ans, e, t[1] - t[0])}`,
        excel: "=QUARTILE.INC(range,3)-QUARTILE.INC(range,1)" };
    } },
    { key: "cv", label: "Coefficient of variation", mode: "general", gen() {
      const n = ri(5, 7), v = [...Array(n)].map(() => ri(20, 80)), m = M.mean(v), sd = M.sdS(v), ans = sd / m;
      return { q: `<p>Find the <b>coefficient of variation</b> CV = s / x̄ of this sample (3 decimals):</p>${valChips(v)}`, ans, dp: 3,
        steps: `<ol><li>Mean: x̄ = ${M.sum(v)} / ${n} = ${f(m, 4)}</li><li>SD: SS = ${f(M.ss(v), 4)}, s² = ${f(M.ss(v), 4)} / ${n - 1} = ${f(M.varS(v), 4)}, s = ${f(sd, 4)}</li><li>CV = ${f(sd, 4)} / ${f(m, 4)} = <b class="num">${f(ans, 3)}</b>, or ${f(ans * 100, 1)}%.</li></ol>`, excel: "=STDEV.S(range)/AVERAGE(range)" };
    } },
    { key: "shape", label: "Shape: skew and tails", mode: "general", gen() {
      if (Math.random() < 0.6) {
        const c = pick(SHAPE_Q), md = c.md[0] + Math.random() * (c.md[1] - c.md[0]);
        const mean = c.type === "right" ? md * (1 + 0.1 + Math.random() * 0.2) : c.type === "left" ? md * (1 - 0.04 - Math.random() * 0.06) : md * (1 + (Math.random() - 0.5) * 0.002);
        const a = fx(mean, c.dp), b = fx(md, c.dp), ans = SKEW_LBL[c.type];
        return { q: `<p>${c.c}: the mean is <b>${a}</b> ${c.u} and the median is <b>${b}</b> ${c.u}. What is the most likely shape of the distribution?</p>`,
          ans, choices: Object.values(SKEW_LBL),
          steps: `<ol><li>Compare: mean ${a} ${c.type === "right" ? "&gt;" : c.type === "left" ? "&lt;" : "≈"} median ${b}.</li><li>${c.type === "right" ? "A long right tail pulls the mean up, above the median." : c.type === "left" ? "A long left tail pulls the mean down, below the median." : "Mean and median are almost equal, as in a symmetric distribution."}</li><li>Answer: <b>${ans}</b>.</li></ol>` };
      }
      const heavy = pick(["heavy", "normal", "light"]), excess = Math.random() < 0.5;
      const ex = heavy === "heavy" ? 1.2 + Math.random() * 3 : heavy === "light" ? -(0.6 + Math.random() * 0.6) : (Math.random() - 0.5) * 0.1;
      const val = excess ? ex : ex + 3, L = { heavy: "Heavier tails than the normal", normal: "Tails like the normal", light: "Lighter tails than the normal" };
      return { q: `<p>${excess ? `Excel's <code class="xl">=KURT()</code> (excess kurtosis) returns <b>${fx(val, 2)}</b>` : `The kurtosis of a variable is <b>${fx(val, 2)}</b>`}. What does this say about its tails?</p>`,
        ans: L[heavy], choices: [L.heavy, L.normal, L.light],
        steps: `<ol><li>The normal distribution has kurtosis 3, which is excess kurtosis 0.</li><li>${excess ? `Excess kurtosis ${fx(val, 2)}` : `Kurtosis ${fx(val, 2)}, so excess kurtosis ${fx(val, 2)} − 3 = ${fx(ex, 2)}`}: ${heavy === "heavy" ? "above 0, so extreme values are more common than in a normal distribution." : heavy === "light" ? "below 0, so extreme values are rarer than in a normal distribution." : "about 0, as in a normal distribution."}</li><li>Answer: <b>${L[heavy]}</b>.</li></ol>` };
    } },
    { key: "dspread", label: "Range, IQR and CV", mode: "data", gen() {
      const c = pick(NUMERIC.slice(0, 4)), g = pick(GROUPS.slice(0, 7)), v = col(c.i, g), s = sortN(v), stat = pick(["range", "IQR", "CV"]), L = LETTERS[c.i], n = v.length;
      const keep = `<li>Keep only ${g.label.toLowerCase()}: n = ${n}.</li>`;
      if (stat === "range") return { q: `<p>Find the <b>range</b> of <b>${c.name}</b> for <b>${g.label.toLowerCase()}</b>.</p>`, ans: s[n - 1] - s[0], dp: 2,
        steps: `<ol>${keep}<li>Range = max − min = ${s[n - 1]} − ${s[0]} = <b class="num">${g4(s[n - 1] - s[0])}</b></li></ol>`, excel: g.key === "all" ? `=MAX(${L}2:${L}61)-MIN(${L}2:${L}61)` : "Filter the rows first, then =MAX(…)-MIN(…)" };
      if (stat === "IQR") { const q1 = M.qInc(v, 0.25), q3 = M.qInc(v, 0.75), e = M.qExc(v, 0.75) - M.qExc(v, 0.25), t = M.tukey(v);
        return { q: `<p>Find the <b>IQR</b> of <b>${c.name}</b> for <b>${g.label.toLowerCase()}</b> (2 decimals).</p>`, ans: q3 - q1, dp: 2, alts: [e, t[1] - t[0]],
          steps: `<ol>${keep}<li>Sort the ${n} values.</li>${qStep(s, 0.25, "Q1")}${qStep(s, 0.75, "Q3")}<li>IQR = ${g4(q3)} − ${g4(q1)} = <b class="num">${f(q3 - q1, 2)}</b></li></ol>${iqrNote(q3 - q1, e, t[1] - t[0])}`,
          excel: g.key === "all" ? `=QUARTILE.INC(${L}2:${L}61,3)-QUARTILE.INC(${L}2:${L}61,1)` : "Filter the rows first, then =QUARTILE.INC(…,3)-QUARTILE.INC(…,1)" }; }
      const m = M.mean(v), sd = M.sdS(v);
      return { q: `<p>Find the <b>coefficient of variation</b> of <b>${c.name}</b> for <b>${g.label.toLowerCase()}</b> (3 decimals).</p>`, ans: sd / m, dp: 3,
        steps: `<ol>${keep}<li>x̄ = ${f(m, 4)}, s = ${f(sd, 4)}</li><li>CV = s / x̄ = <b class="num">${f(sd / m, 3)}</b></li></ol>`, excel: g.key === "all" ? `=STDEV.S(${L}2:${L}61)/AVERAGE(${L}2:${L}61)` : "Filter the rows first, then =STDEV.S(…)/AVERAGE(…)" };
    } }
  ]
},
/* ------------------------------------------------------------- Part 3 */
{
  title: "Random variables",
  intro: "A random variable turns the outcome of a random experiment into a number. Its distribution says which values are possible and how likely each one is. Every statistical table describes such a distribution.",
  buildsOn: "the mean and variance from Part 2",
  bridge: "The most important continuous distribution",
  summary: [
    "A <b>random variable</b> X maps outcomes to numbers; x is a value it takes. It is <b>discrete</b> (countable values) or <b>continuous</b> (any value in an interval).",
    "Discrete: the <b>PMF</b> P(X = x) gives each probability, and they add up to 1. Continuous: probabilities are <b>areas</b> under the <b>PDF</b> f(x), and P(X = x) = 0.",
    "The <b>CDF</b> F(x) = P(X ≤ x) adds up probability from the left. The statistical tables are tabulated CDFs.",
    "<b>E[X]</b> = Σ x·P(X = x) is the long-run average; <b>Var(X)</b> = E[X²] − μ². E[aX + b] = aE[X] + b, Var(aX + b) = a²Var(X), and for independent X, Y: Var(X ± Y) = Var(X) + Var(Y)."
  ],
  concepts: [
    { name: "Random variables", tag: "Basics",
      idea: `<p>A <b>random variable</b> X assigns a number to each outcome of a random experiment. Capital X is the variable itself; small x is a value it actually takes (a realised value).</p>
        <ul><li><b>Discrete</b>: countable values, for example the number shown by a die (1 to 6) or the number of customers in an hour.</li><li><b>Continuous</b>: any value in an interval, for example the waiting time for a bus.</li></ul>`,
      example: `<p>Flip a coin 3 times and let X = the number of heads. The outcome HTH gives x = 2; TTT gives x = 0. X can take the values 0, 1, 2 and 3, so it is discrete.</p>`,
      watch: `<p>The same split as in Part 1: counted → discrete, measured → continuous. It decides whether you add up probabilities (discrete) or take areas (continuous).</p>`,
      keys: [["Random variable", "X = the variable · x = a value it takes", ""]] },
    { name: "Discrete: the PMF", tag: "Distribution",
      idea: `<p>A discrete random variable is described by its <b>probability mass function</b> (PMF): the probability P(X = x) of every possible value. Each probability is between 0 and 1, and together they add up to 1.</p>`,
      formula: `<div class="formula"><div class="fb">Σ P(X = x) = 1</div><span class="fn">over all possible values x</span></div>`,
      steps: `<ol><li>List the possible values x.</li><li>Write down P(X = x) for each one.</li><li>Check that the probabilities add up to 1.</li><li>For an event such as X ≤ 1, add up the probabilities of the values it contains.</li></ol>`,
      example: `<p>X = number of heads in 3 coin flips:</p>${pmfTable([0, 1, 2, 3], [0.125, 0.375, 0.375, 0.125], -1, 3)}<p>P(X ≥ 2) = 0.375 + 0.125 = <b class="num">0.5</b>.</p>`,
      watch: `<p>"At least 2" means 2 or more (≥ 2); "more than 2" means 3 or more (&gt; 2). For discrete variables this difference changes the answer.</p>`,
      widgets: ["pmf"],
      keys: [["PMF", "P(X = x), with Σ P(X = x) = 1", ""]] },
    { name: "Continuous: the PDF", tag: "Distribution",
      idea: `<p>A continuous random variable is described by a <b>probability density function</b> (PDF) f(x), a curve. Probabilities are <b>areas</b> under the curve, and the total area is 1.</p>`,
      formula: `<div class="formula"><div class="fb">P(a &lt; X &lt; b) = area under f(x) between a and b</div></div>`,
      steps: `<ol><li>Sketch the curve and mark a and b.</li><li>The probability is the area between them.</li><li>A single point has no width, so P(X = x) = 0. That is why P(X &lt; x) = P(X ≤ x).</li></ol>`,
      example: `<p>A bus comes at a random moment in the next 10 minutes, so the waiting time X is equally likely anywhere from 0 to 10. The PDF is flat at height 0.1 (area 10 × 0.1 = 1). Then P(2 &lt; X &lt; 5) = (5 − 2) × 0.1 = <b class="num">0.3</b>.</p>`,
      watch: `<p>The height f(x) is not a probability, and it can even be above 1. Only areas are probabilities.</p>`,
      keys: [["PDF", "P(a < X < b) = area under f(x) from a to b · P(X = x) = 0", ""]] },
    { name: "The CDF", tag: "Distribution",
      idea: `<p>The <b>cumulative distribution function</b> (CDF) adds up probability from the left: F(x) = P(X ≤ x). It rises from 0 to 1. Every table in your course is a tabulated CDF: the z-table gives Φ(z) = P(Z ≤ z), and the t, χ² and F tables give areas below a value.</p>`,
      formula: `<div class="formula"><div class="fb">F(x) = P(X ≤ x)</div></div> <div class="formula"><div class="fb">P(X &gt; x) = 1 − F(x)</div></div> <div class="formula"><div class="fb">P(a &lt; X ≤ b) = F(b) − F(a)</div></div>`,
      example: `<p>Heads in 3 flips: F(1) = 0.125 + 0.375 = 0.5 and F(2) = 0.5 + 0.375 = 0.875.</p><ul><li>P(X &gt; 1) = 1 − F(1) = <b class="num">0.5</b></li><li>P(1 &lt; X ≤ 2) = F(2) − F(1) = <b class="num">0.375</b></li></ul>`,
      watch: `<p>Same rules as with the z-table in Part 4: above = 1 − below, between = difference of two CDF values.</p>`,
      keys: [["CDF", "F(x) = P(X ≤ x)", ""], ["Above and between", "P(X > x) = 1 − F(x) · P(a < X ≤ b) = F(b) − F(a)", ""]] },
    { name: "Expected value and variance", tag: "Moments",
      idea: `<p>The <b>expected value</b> E[X] = μ is the long-run average of X: weight each value by its probability. The <b>variance</b> Var(X) = σ² is the expected squared distance from μ, and the SD is its square root. These are the population versions of x̄ and s² from Part 2.</p>`,
      formula: `<div class="formula"><div class="fb">E[X] = μ = Σ x · P(X = x)</div></div> <div class="formula"><div class="fb">Var(X) = E[X²] − μ²</div><span class="fn">E[X²] = Σ x² · P(X = x) · also Var(X) = Σ (x − μ)² · P(X = x)</span></div>`,
      steps: `<ol><li>Make a table with columns x, P, x·P and x²·P.</li><li>E[X] = sum of the x·P column.</li><li>E[X²] = sum of the x²·P column.</li><li>Var(X) = E[X²] − (E[X])², and SD(X) = √Var(X).</li></ol>`,
      example: `<p>A fair die, P = 1/6 for each of 1 to 6:</p><ul><li>E[X] = (1 + 2 + 3 + 4 + 5 + 6) / 6 = <b class="num">3.5</b></li><li>E[X²] = (1 + 4 + 9 + 16 + 25 + 36) / 6 = 91 / 6 = 15.167</li><li>Var(X) = 15.167 − 3.5² = <b class="num">2.917</b>, SD(X) = 1.708</li></ul>`,
      watch: `<p>E[X] does not have to be a possible value: nobody rolls a 3.5. And square the mean <b>after</b> computing it: E[X²] is not the same as (E[X])².</p>`,
      keys: [["Expected value", "E[X] = μ = Σ x · P(X = x)", "=SUMPRODUCT(x_range,p_range)"], ["Variance of X", "Var(X) = Σ (x − μ)² · P(X = x) = E[X²] − μ²", ""]] },
    { name: "Rules for E and Var", tag: "Rules",
      idea: `<p>Shifting and scaling a variable, or adding two variables, changes the mean and variance in predictable ways.</p>`,
      formula: `<div class="formula"><div class="fb">E[aX + b] = a · E[X] + b</div></div> <div class="formula"><div class="fb">Var(aX + b) = a² · Var(X)</div><span class="fn">so SD(aX + b) = |a| · SD(X)</span></div> <div class="formula"><div class="fb">Var(X ± Y) = Var(X) + Var(Y)</div><span class="fn">if X and Y are independent · E[X ± Y] = E[X] ± E[Y] always</span></div>`,
      steps: `<ol><li>Adding a constant b moves every value, so the mean moves but the spread stays the same.</li><li>Multiplying by a scales distances by a, so the variance scales by a².</li><li>For independent variables, variances add, both for a sum and for a difference.</li></ol>`,
      example: `<p>A temperature X in °C has E[X] = 20 and SD(X) = 2. In °F, Y = 1.8X + 32:</p><ul><li>E[Y] = 1.8 × 20 + 32 = <b class="num">68</b></li><li>Var(Y) = 1.8² × 2² = <b class="num">12.96</b>, SD(Y) = 1.8 × 2 = 3.6</li></ul>`,
      watch: `<p>Var(X − Y) = Var(X) <b>+</b> Var(Y), not minus: subtracting a random amount adds uncertainty. And add <b>variances</b>, never SDs.</p>`,
      keys: [["Linear transformation", "E[aX + b] = a·E[X] + b · Var(aX + b) = a²·Var(X)", ""], ["Sum or difference (independent)", "E[X ± Y] = E[X] ± E[Y] · Var(X ± Y) = Var(X) + Var(Y)", ""]] }
  ],
  practice: [
    { key: "pmfmiss", label: "Missing probability", mode: "general", gen() {
      const k = ri(3, 4), d = randPMF(k, pick([0, 0, 1])), h = ri(0, k), rest = 1 - d.ps[h];
      return { q: `<p>X is a discrete random variable with this PMF. Find the missing probability.</p>${pmfTable(d.xs, d.ps, h)}`, ans: d.ps[h], dp: 2,
        steps: `<ol><li>All probabilities add up to 1.</li><li>The known ones add up to ${d.ps.filter((_, i) => i !== h).map(p => f(p, 2)).join(" + ")} = ${f(rest, 2)}.</li><li>Missing: 1 − ${f(rest, 2)} = <b class="num">${f(d.ps[h], 2)}</b></li></ol>` };
    } },
    { key: "pmfprob", label: "Probability from a PMF", mode: "general", gen() {
      const k = ri(3, 5), d = randPMF(k), c = ri(1, k - 1), kind = pick(["le", "lt", "gt", "ge"]);
      const test = { le: x => x <= c, lt: x => x < c, gt: x => x > c, ge: x => x >= c }[kind], sym = { le: "≤", lt: "&lt;", gt: "&gt;", ge: "≥" }[kind];
      const inc = d.xs.filter(test), ans = inc.reduce((s, x) => s + d.ps[d.xs.indexOf(x)], 0);
      return { q: `<p>X has this PMF. Find <b>P(X ${sym} ${c})</b>.</p>${pmfTable(d.xs, d.ps)}`, ans, dp: 2,
        steps: `<ol><li>Values with X ${sym} ${c}: ${inc.join(", ")}.</li><li>Add their probabilities: ${inc.map(x => f(d.ps[d.xs.indexOf(x)], 2)).join(" + ")} = <b class="num">${f(ans, 2)}</b></li>${kind === "gt" || kind === "ge" ? `<li>Check: 1 − P(X ${kind === "gt" ? "≤" : "&lt;"} ${c}) = 1 − ${f(1 - ans, 2)} = ${f(ans, 2)}.</li>` : ""}</ol>` };
    } },
    { key: "ev", label: "Expected value", mode: "general", gen() {
      const d = randPMF(ri(3, 4), pick([0, 1, 2])), mu = d.xs.reduce((s, x, i) => s + x * d.ps[i], 0);
      return { q: `<p>X has this PMF. Find the expected value <b>E[X]</b>.</p>${pmfTable(d.xs, d.ps)}`, ans: mu, dp: 2,
        steps: `<ol><li>Multiply each value by its probability: ${d.xs.map((x, i) => `${x} × ${f(d.ps[i], 2)}`).join(" + ")}</li><li>E[X] = <b class="num">${f(mu, 2)}</b></li></ol>`, excel: "=SUMPRODUCT(x_range,p_range)" };
    } },
    { key: "varx", label: "Variance of X", mode: "general", gen() {
      const d = randPMF(ri(3, 4), pick([0, 1])), mu = d.xs.reduce((s, x, i) => s + x * d.ps[i], 0), ex2 = d.xs.reduce((s, x, i) => s + x * x * d.ps[i], 0), v = ex2 - mu * mu, sd = Math.random() < 0.35;
      return { q: `<p>X has this PMF. Find the ${sd ? "<b>standard deviation SD(X)</b>" : "<b>variance Var(X)</b>"} (2 decimals).</p>${pmfTable(d.xs, d.ps)}`, ans: sd ? Math.sqrt(v) : v, dp: 2,
        steps: `<ol><li>Build the table:${momentTable(d.xs, d.ps, mu)}</li><li>E[X] = ${g4(mu)}, E[X²] = ${g4(ex2)}</li><li>Var(X) = ${g4(ex2)} − ${g4(mu)}² = ${f(v, 4)}</li>${sd ? `<li>SD(X) = √${f(v, 4)} = <b class="num">${f(Math.sqrt(v), 2)}</b></li>` : `<li>Answer: <b class="num">${f(v, 2)}</b></li>`}</ol>` };
    } },
    { key: "lin", label: "E and Var of aX + b", mode: "general", gen() {
      const c = pick([
        () => { const a = pick([12, 15, 25]), b = -pick([100, 200, 300]); return { a, b, mu: ri(30, 60), sd: ri(4, 9), x: "X, the number of units a shop sells per day", y: `daily profit Y = ${a}X − ${-b} (in €)` }; },
        () => ({ a: 1.8, b: 32, mu: ri(15, 25), sd: ri(2, 5), x: "X, a daily temperature in °C", y: "the same temperature in °F, Y = 1.8X + 32" }),
        () => { const a = pick([40, 55, 60]), b = pick([25, 30, 50]); return { a, b, mu: ri(2, 6), sd: pick([0.5, 1, 1.5]), x: "X, the hours a technician spends on a job", y: `the bill Y = ${a}X + ${b} (in €)` }; }
      ])();
      const what = pick(["E", "Var", "SD"]), ans = what === "E" ? c.a * c.mu + c.b : what === "Var" ? c.a ** 2 * c.sd ** 2 : Math.abs(c.a) * c.sd;
      return { q: `<p>${c.x} has E[X] = ${c.mu} and SD(X) = ${c.sd}. Find <b>${what === "E" ? "E[Y]" : what === "Var" ? "Var(Y)" : "SD(Y)"}</b> for ${c.y}.</p>`, ans, dp: 2,
        steps: `<ol><li>Y = aX + b with a = ${c.a} and b = ${c.b}.</li>${what === "E" ? `<li>E[Y] = a·E[X] + b = ${c.a} × ${c.mu} ${c.b < 0 ? "−" : "+"} ${Math.abs(c.b)} = <b class="num">${g4(ans)}</b></li>`
          : what === "Var" ? `<li>Var(X) = SD² = ${c.sd}² = ${g4(c.sd ** 2)}. The constant b does not change the spread.</li><li>Var(Y) = a²·Var(X) = ${c.a}² × ${g4(c.sd ** 2)} = <b class="num">${g4(ans)}</b></li>`
          : `<li>SD(Y) = |a|·SD(X) = ${Math.abs(c.a)} × ${c.sd} = <b class="num">${g4(ans)}</b>. The constant b does not change the spread.</li>`}</ol>` };
    } },
    { key: "sumvar", label: "Sums of variables", mode: "general", gen() {
      const c = pick([["X, the time to prepare a pizza", "Y, the time to deliver it", "minutes"], ["X, the score on exam part A", "Y, the score on exam part B", "points"], ["X, the weight of a product", "Y, the weight of its box", "g"]]);
      const mx = ri(10, 40), sx = ri(2, 6), my = ri(5, 30), sy2 = ri(2, 6), op = pick(["+", "−"]), what = pick(["E", "Var", "SD", "Var", "SD"]);
      const v = sx * sx + sy2 * sy2, e = op === "+" ? mx + my : mx - my, ans = what === "E" ? e : what === "Var" ? v : Math.sqrt(v);
      return { q: `<p>${c[0]} has mean ${mx} and SD ${sx}; ${c[1]} has mean ${my} and SD ${sy2} (${c[2]}). X and Y are independent. Find <b>${what === "E" ? `E[X ${op} Y]` : what === "Var" ? `Var(X ${op} Y)` : `SD(X ${op} Y)`}</b>${what === "SD" ? " (2 decimals)" : ""}.</p>`, ans, dp: 2,
        steps: `<ol>${what === "E" ? `<li>Means add or subtract directly: E[X ${op} Y] = ${mx} ${op} ${my} = <b class="num">${e}</b></li>`
          : `<li>Variances: Var(X) = ${sx}² = ${sx * sx}, Var(Y) = ${sy2}² = ${sy2 * sy2}.</li><li>Independent, so the variances add${op === "−" ? " (also for a difference)" : ""}: Var(X ${op} Y) = ${sx * sx} + ${sy2 * sy2} = ${v}</li>${what === "SD" ? `<li>SD = √${v} = <b class="num">${f(Math.sqrt(v), 2)}</b></li>` : `<li>Answer: <b class="num">${v}</b></li>`}`}</ol>` };
    } },
    { key: "drv", label: "A random student", mode: "data", gen() {
      const v = RAW.map(r => r[1]), a = pick([18, 19, 20, 21, 22]), kind = pick(["eq", "le", "gt", "ev"]);
      const cnt = { eq: v.filter(x => x === a).length, le: v.filter(x => x <= a).length, gt: v.filter(x => x > a).length }[kind];
      if (kind === "ev") { const ages = [...new Set(v)].sort((x, y) => x - y), mu = M.mean(v);
        return { q: `<p>Pick one of the 60 students at random. X = their <b>Age</b>. Find <b>E[X]</b> (2 decimals).</p>`, ans: mu, dp: 2,
          steps: `<ol><li>Each student is equally likely, so P(X = x) = (number of students aged x) / 60.</li><li>PMF: ${ages.map(x => `P(${x}) = ${v.filter(y => y === x).length}/60`).join(", ")}</li><li>E[X] = Σ x · P(X = x), which is just the mean age: <b class="num">${f(mu, 2)}</b></li></ol>`, excel: "=AVERAGE(B2:B61)" }; }
      const sym = { eq: "=", le: "≤", gt: "&gt;" }[kind], crit = { eq: `${a}`, le: `"<=${a}"`, gt: `">${a}"` }[kind];
      return { q: `<p>Pick one of the 60 students at random. X = their <b>Age</b>. Find <b>P(X ${sym} ${a})</b> (3 decimals).</p>`, ans: cnt / 60, dp: 3,
        steps: `<ol><li>Each student is equally likely, so P = (number of students with Age ${sym} ${a}) / 60.</li><li>Count: ${cnt} students.</li><li>P = ${cnt} / 60 = <b class="num">${f(cnt / 60, 3)}</b></li></ol>`, excel: `=COUNTIF(B2:B61,${crit})/60` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 4 */
{
  title: "Normal distribution and z-scores", table: "normal",
  intro: "Many measurements pile up in a bell shape. Measured in standard deviations from the mean, every bell curve looks the same, and one table gives its probabilities.",
  buildsOn: "the mean and SD (Part 2) and the PDF and CDF (Part 3)",
  bridge: "From single values to sample means",
  summary: [
    "A <b>z-score</b> counts how many SDs a value is from the mean: z = (x − μ) / σ.",
    "Probability is <b>area</b> under the curve. The z-table gives the area <b>below</b> z; use 1 − Φ(z) for above and Φ(b) − Φ(a) for between.",
    "Going backwards, find the area inside the table and read off z. Areas below 0.5 give negative z."
  ],
  concepts: [
    { name: "The normal curve", tag: "Model",
      idea: `<p>The normal distribution is a symmetric bell curve described by its mean μ (the center) and SD σ (the width). The <b>standard normal</b> Z has μ = 0 and σ = 1. The total area under the curve is 1, and the probability of a range is the area over it.</p>`,
      steps: `<ul><li>Symmetric around the mean: mean = median.</li><li>About 68% of values lie within ±1 SD, 95% within ±2 SD, 99.7% within ±3 SD.</li></ul>`,
      watch: `<p>The curve never quite reaches zero, but beyond ±3.5 SD the area left is tiny, which is why the table stops at 3.5.</p>`,
      widgets: ["rule"],
      keys: [["68–95–99.7 rule", "P(−1 < Z < 1) ≈ 0.68 · P(−2 < Z < 2) ≈ 0.95 · P(−3 < Z < 3) ≈ 0.997", ""]] },
    { name: "z-scores", tag: "Standardize",
      idea: `<p>A z-score tells you how many standard deviations a value lies from the mean. It turns any normal variable X into the standard normal Z, so one table works for all of them.</p>`,
      formula: `<div class="formula"><div class="fb">z = ${fr("x − μ", "σ")}</div><span class="fn">x = value · μ = mean · σ = SD</span></div>`,
      steps: `<ol><li>Subtract the mean from the value.</li><li>Divide by the SD.</li><li>Read the sign: positive = above the mean, negative = below.</li></ol>`,
      example: `<p>Exam scores have μ = 70 and σ = 8.</p><ul><li>A score of 82: z = (82 − 70) / 8 = <b class="num">1.5</b>, 1.5 SDs above the mean.</li><li>A score of 62: z = (62 − 70) / 8 = <b class="num">−1</b>, 1 SD below the mean.</li></ul>`,
      watch: `<p>Divide by σ, not σ². And keep the sign: dropping a minus sign is the most common mistake.</p>`,
      keys: [["z-score", `z = ${fr("x − μ", "σ")}`, "=STANDARDIZE(x,mean,sd)"]] },
    { name: "From z to probability", tag: "Table",
      idea: `<p>The z-table gives Φ(z) = P(Z &lt; z), the area to the <b>left</b> of z. Every other question is built from that one number.</p>`,
      formula: `<div class="formula"><div class="fb">P(Z &gt; z) = 1 − Φ(z)</div></div> <div class="formula"><div class="fb">P(a &lt; Z &lt; b) = Φ(b) − Φ(a)</div></div>`,
      steps: `<ol><li>Sketch the curve, mark z and shade the area you need.</li><li>Look up Φ(z): row = z to one decimal, column = second decimal.</li><li>Below: use Φ(z). Above: 1 − Φ(z). Between: Φ(b) − Φ(a).</li><li>For negative z, use symmetry: Φ(−z) = 1 − Φ(z).</li></ol>`,
      example: `<ul><li>P(Z &gt; 1): row 1.0, column .00 gives 0.8413, so 1 − 0.8413 = <b class="num">0.1587</b>.</li><li>P(−1 &lt; Z &lt; 1) = 0.8413 − 0.1587 = <b class="num">0.6826</b>.</li></ul>`,
      watch: `<p>If the shaded area covers more than half the curve, the answer must be above 0.5. This catches most 1 − p mistakes.</p>`,
      widgets: ["zexplorer", "ztable"],
      keys: [["Area below z", "P(Z < z) = Φ(z)", "=NORM.S.DIST(z,TRUE)"], ["Area above z", "P(Z > z) = 1 − Φ(z)", "=1-NORM.S.DIST(z,TRUE)"], ["Area between", "P(a < Z < b) = Φ(b) − Φ(a)", ""], ["Symmetry", "Φ(−z) = 1 − Φ(z)", ""]] },
    { name: "From probability to z", tag: "Table",
      idea: `<p>Now the area is given and you need z. Search for the area <b>inside</b> the table, then read off the row and column.</p>`,
      formula: `<div class="formula"><div class="fb">z = Φ⁻¹(p)</div><span class="fn">p = area below z</span></div>`,
      steps: `<ol><li>If the area is given <b>above</b> z, convert: area below = 1 − area above.</li><li>If the area below is less than 0.5, z is negative: look up 1 − p and flip the sign.</li><li>Find the closest value in the table body and read z.</li></ol>`,
      example: `<ul><li>Area below 0.95: 0.9500 lies halfway between 0.9495 (z = 1.64) and 0.9505 (z = 1.65), so z = <b class="num">1.645</b>.</li><li>Area above 0.975: area below = 0.025, less than 0.5. Look up 0.975 → 1.96, then flip: z = <b class="num">−1.96</b>.</li></ul>`,
      watch: `<p>The z-table body only holds areas from 0.5 up. Every area below 0.5 needs the symmetry step.</p>`,
      keys: [["z from area below p", "z = Φ⁻¹(p)", "=NORM.S.INV(p)"]] },
    { name: "Normal probabilities for real values", tag: "Apply",
      idea: `<p>Put the last three concepts together: standardize the value, then use the table.</p>`,
      steps: `<ol><li>Write the question as P(X &gt; x), P(X &lt; x) or between.</li><li>Convert x to z = (x − μ) / σ, rounded to 2 decimals for the table.</li><li>Answer the matching Z question.</li></ol>`,
      example: `<p>Exam scores are normal with μ = 70, σ = 8. What share of students score above 82?</p><ol><li>z = (82 − 70) / 8 = 1.5</li><li>Φ(1.50) = 0.9332</li><li>P(X &gt; 82) = 1 − 0.9332 = <b class="num">0.0668</b>, about 6.7%.</li></ol>`,
      watch: `<p>Round z to 2 decimals before the table lookup. Excel's ${xl("=NORM.DIST(x,mean,sd,TRUE)")} skips the rounding, so its answer can differ in the last digit.</p>`,
      keys: [["Probability for X", "P(X < x) = Φ((x − μ) / σ)", "=NORM.DIST(x,mean,sd,TRUE)"]] }
  ],
  practice: [
    { key: "zbelow", label: "z from area below", mode: "general", gen() {
      const p = pick([0.95, 0.95, 0.05, 0.90, 0.10, 0.975, 0.025, 0.99, 0.01, 0.80, 0.20, 0.75, 0.70, 0.85]);
      const dp = (p === 0.95 || p === 0.05) ? 3 : 2, z = M.invphi(p);
      return { q: `<p>Find the value z of a standard normal random variable such that the probability of a value <b>below</b> it is <b>${p}</b>. Use ${dp} decimals.</p>`,
        ans: z, dp, viz: { dist: "z", regions: [[-9, z]], marks: [{ x: z, label: `z = ${f(z, dp)}` }] },
        steps: `<ol><li>Area below is ${p}${p < 0.5 ? ", less than half, so z is negative" : ""}.</li><li>${p < 0.5 ? `Look up 1 − ${p} = ${g4(1 - p)} in the body of the z-table and flip the sign` : `Find ${f(p, 4)} in the body of the z-table`}.</li><li>z = <b class="num">${f(z, dp)}</b></li></ol>`,
        excel: `=NORM.S.INV(${p})` };
    } },
    { key: "zabove", label: "z from area above", mode: "general", gen() {
      const p = pick([0.975, 0.975, 0.95, 0.90, 0.05, 0.025, 0.10, 0.01, 0.80, 0.20, 0.99]);
      const below = 1 - p, dp = (p === 0.95 || p === 0.05) ? 3 : 2, z = M.invphi(below);
      return { q: `<p>Find the value z of a standard normal random variable such that the probability of a value <b>above</b> it is <b>${p}</b>. Use ${dp} decimals.</p>`,
        ans: z, dp, viz: { dist: "z", regions: [[z, 9]], marks: [{ x: z, label: `z = ${f(z, dp)}` }] },
        steps: `<ol><li>Convert to an area below: 1 − ${p} = ${g4(below)}.</li><li>${below < 0.5 ? `Less than half lies below, so z is negative. Look up ${g4(1 - below)} and flip the sign.` : `Look up ${f(below, 4)} in the z-table.`}</li><li>z = <b class="num">${f(z, dp)}</b></li></ol>`,
        excel: `=NORM.S.INV(${g4(below)})` };
    } },
    { key: "pabove", label: "Area above z", mode: "general", gen() {
      const z = ri(-250, 300) / 100, p = 1 - M.phi(z), t = tableLookupZ(z);
      return { q: `<p>Find the probability that a standard normal random variable <b>exceeds</b> z = ${f(z, 2)}. Use 4 decimals.</p>`, ans: p, dp: 4,
        viz: { dist: "z", regions: [[z, 9]], marks: [{ x: z, label: `z = ${f(z, 2)}` }] },
        steps: `<ol><li>Table row ${t.row}, column ${t.col}: Φ(${f(Math.abs(z), 2)}) = ${f(M.phi(Math.abs(z)), 4)}${z < 0 ? `, so Φ(${f(z, 2)}) = 1 − ${f(M.phi(Math.abs(z)), 4)} = ${f(M.phi(z), 4)}` : ""}.</li>
          <li>Area above = 1 − Φ(z) = 1 − ${f(M.phi(z), 4)} = <b class="num">${f(p, 4)}</b></li></ol>`, excel: `=1-NORM.S.DIST(${fx(z, 2)},TRUE)` };
    } },
    { key: "pbelow", label: "Area below z", mode: "general", gen() {
      const z = ri(-300, 250) / 100, p = M.phi(z), t = tableLookupZ(z);
      return { q: `<p>Find P(Z &lt; ${f(z, 2)}) for a standard normal random variable. Use 4 decimals.</p>`, ans: p, dp: 4,
        viz: { dist: "z", regions: [[-9, z]], marks: [{ x: z, label: `z = ${f(z, 2)}` }] },
        steps: `<ol><li>Table row ${t.row}, column ${t.col}: Φ(${f(Math.abs(z), 2)}) = ${f(M.phi(Math.abs(z)), 4)}.</li>${z < 0 ? `<li>z is negative, so use symmetry: Φ(${f(z, 2)}) = 1 − ${f(M.phi(-z), 4)} = <b class="num">${f(p, 4)}</b></li>` : `<li>That is already the area below: <b class="num">${f(p, 4)}</b></li>`}</ol>`,
        excel: `=NORM.S.DIST(${fx(z, 2)},TRUE)` };
    } },
    { key: "between", label: "Area between", mode: "general", gen() {
      let a = ri(-250, 150) / 100, b = ri(-100, 250) / 100; if (b - a < 0.3) b = +(a + 0.3 + ri(0, 150) / 100).toFixed(2);
      const p = M.phi(b) - M.phi(a);
      return { q: `<p>Find P(${f(a, 2)} &lt; Z &lt; ${f(b, 2)}). Use 4 decimals.</p>`, ans: p, dp: 4,
        viz: { dist: "z", regions: [[a, b]], marks: [{ x: a, label: f(a, 2) }, { x: b, label: f(b, 2) }] },
        steps: `<ol><li>Φ(${f(b, 2)}) = ${f(M.phi(b), 4)}</li><li>Φ(${f(a, 2)}) = ${f(M.phi(a), 4)}</li><li>Subtract: ${f(M.phi(b), 4)} − ${f(M.phi(a), 4)} = <b class="num">${f(p, 4)}</b></li></ol>`,
        excel: `=NORM.S.DIST(${fx(b, 2)},TRUE)-NORM.S.DIST(${fx(a, 2)},TRUE)`, alts: [+(+M.phi(b).toFixed(4) - +M.phi(a).toFixed(4)).toFixed(4)] };
    } },
    { key: "std", label: "z-score", mode: "general", gen() {
      const [mu, sg] = pick([[70, 8], [50, 10], [100, 15], [500, 100], [60, 12], [170, 9], [25, 4]]);
      const x = Math.round(mu + (ri(-250, 250) / 100) * sg), z = (x - mu) / sg;
      return { q: `<p>A variable has mean μ = ${mu} and standard deviation σ = ${sg}. Find the z-score of x = ${x} (round to 2 decimals).</p>`, ans: z, dp: 2,
        steps: `<ol><li>z = (x − μ) / σ = (${x} − ${mu}) / ${sg}</li><li>= ${x - mu} / ${sg} = <b class="num">${f(z, 2)}</b>${z < 0 ? " (below the mean)" : z > 0 ? " (above the mean)" : ""}</li></ol>`,
        excel: `=STANDARDIZE(${x},${mu},${sg})` };
    } },
    { key: "real", label: "Probability for X", mode: "general", gen() {
      const [mu, sg] = pick([[70, 8], [50, 10], [100, 15], [500, 100], [60, 12], [170, 9]]);
      const x = Math.round(mu + (ri(-220, 220) / 100) * sg), above = Math.random() < 0.5;
      const z = (x - mu) / sg, zr = Math.round(z * 100) / 100, p = above ? 1 - M.phi(zr) : M.phi(zr);
      return { q: `<p>X is normal with μ = ${mu} and σ = ${sg}. Find P(X ${above ? "&gt;" : "&lt;"} ${x}). Use 4 decimals.</p>`, ans: p, dp: 4, alts: [above ? 1 - M.phi(z) : M.phi(z)],
        viz: { dist: "z", regions: above ? [[zr, 9]] : [[-9, zr]], marks: [{ x: zr, label: `z = ${f(zr, 2)}` }] },
        steps: `<ol><li>Standardize: z = (${x} − ${mu}) / ${sg} = ${f(z, 4)} ≈ ${f(zr, 2)}</li><li>Φ(${f(zr, 2)}) = ${f(M.phi(zr), 4)}</li><li>${above ? `Above: 1 − ${f(M.phi(zr), 4)} = ` : "Below: "}<b class="num">${f(p, 4)}</b></li></ol>`,
        excel: `=${above ? "1-" : ""}NORM.DIST(${x},${mu},${sg},TRUE)` };
    } },
    { key: "dz", label: "z-score of a student", mode: "data", gen() {
      const c = pick(NUMERIC.slice(0, 4)), r = pick(RAW), v = col(c.i), m = M.mean(v), s = M.sdS(v), x = r[c.i], z = (x - m) / s, L = LETTERS[c.i];
      return { q: `<p>Student <b>${r[0]}</b> has ${c.name} = <b>${x}</b>. Using the mean and sample SD of ${c.name} for all 60 students, find this student's z-score (round to 2 decimals).</p>`, ans: z, dp: 2,
        alts: [(x - +m.toFixed(2)) / +s.toFixed(2)],
        steps: `<ol><li>Mean of ${c.name}: x̄ = ${g4(M.sum(v))} / 60 = ${f(m, 4)}</li><li>Sample SD: s = ${f(s, 4)}</li><li>z = (${x} − ${f(m, 4)}) / ${f(s, 4)} = <b class="num">${f(z, 2)}</b></li></ol>`,
        excel: `=STANDARDIZE(${x},AVERAGE(${L}2:${L}61),STDEV.S(${L}2:${L}61))` };
    } },
    { key: "dnorm", label: "Normal model of a variable", mode: "data", gen() {
      const c = pick([NUMERIC[0], NUMERIC[1], NUMERIC[3]]), v = col(c.i), m = +M.mean(v).toFixed(2), s = +M.sdS(v).toFixed(2);
      const lo = Math.min(...v), hi = Math.max(...v), x = Math.round(lo + (hi - lo) * (0.2 + Math.random() * 0.6)), above = Math.random() < 0.5;
      const z = (x - m) / s, zr = Math.round(z * 100) / 100, p = above ? 1 - M.phi(zr) : M.phi(zr);
      return { q: `<p>Model <b>${c.name}</b> as a normal variable with the mean and sample SD of all 60 students (rounded to 2 decimals). What is the probability that a student has ${c.name} <b>${above ? "above" : "below"} ${x}</b>? Use 4 decimals.</p>`,
        ans: p, dp: 4, alts: [above ? 1 - M.phi(z) : M.phi(z)],
        viz: { dist: "z", regions: above ? [[zr, 9]] : [[-9, zr]], marks: [{ x: zr, label: `z = ${f(zr, 2)}` }] },
        steps: `<ol><li>From the data: μ ≈ ${m}, σ ≈ ${s}</li><li>z = (${x} − ${m}) / ${s} = ${f(z, 4)} ≈ ${f(zr, 2)}</li><li>Φ(${f(zr, 2)}) = ${f(M.phi(zr), 4)}</li><li>${above ? `Above: 1 − ${f(M.phi(zr), 4)} = ` : "Below: "}<b class="num">${f(p, 4)}</b></li></ol>`,
        excel: `=${above ? "1-" : ""}NORM.DIST(${x},${m},${s},TRUE)` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 5 */
{
  title: "Samples and sampling distributions", table: "normal",
  intro: "In practice you see a sample, not the whole population. A statistic such as x̄ changes from sample to sample. Its distribution, the sampling distribution, tells you how precise it is.",
  buildsOn: "random variables (Part 3) and the normal curve (Part 4)",
  bridge: "σ unknown → use s and t",
  summary: [
    "<b>Parameters</b> (μ, σ², σ, p) describe the population and are usually unknown. <b>Statistics</b> (x̄, s², s, p̂) are computed from a sample and vary from sample to sample.",
    "The SD of a statistic is its <b>standard error</b>. For the sample mean: SE(X̄) = σ / √n.",
    "<b>Central Limit Theorem</b>: for large n, X̄ ≈ N(μ, σ²/n), whatever the shape of the population. Then z = (x̄ − μ) / (σ/√n).",
    "An <b>estimator</b> is a rule (use X̄); an <b>estimate</b> is the number it gives for one sample (x̄ = 71.3)."
  ],
  concepts: [
    { name: "Parameters and statistics", tag: "Basics",
      idea: `<p>The <b>population</b> is the whole group you care about, of size N. The <b>sample</b> is the part you actually observe, of size n. A number that describes the population is a <b>parameter</b>: fixed, but usually unknown. A number computed from a sample is a <b>statistic</b>: known, but it would change with a different sample.</p>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th></th><th>Parameter (population)</th><th>Statistic (sample)</th></tr></thead><tbody>
        <tr><td>Mean</td><td class="m">μ</td><td class="m">x̄</td></tr><tr><td>Variance, SD</td><td class="m">σ², σ</td><td class="m">s², s</td></tr><tr><td>Proportion</td><td class="m">p</td><td class="m">p̂</td></tr><tr><td>Size</td><td class="m">N</td><td class="m">n</td></tr></tbody></table></div>
        <p>The mean income of <b>all</b> households in a country is a parameter μ. The mean income of the 500 households in your survey is a statistic x̄ that estimates it.</p>`,
      watch: `<p>Greek letters (μ, σ) and p are for the population; Latin letters (x̄, s) and hats (p̂) are for the sample.</p>`,
      keys: [["Parameters vs statistics", "μ, σ², σ, p (population) · x̄, s², s, p̂ (sample)", ""]] },
    { name: "Sampling distribution and standard error", tag: "Sampling",
      idea: `<p>Take many samples of the same size and compute x̄ for each one: you get many different values. Before you draw the sample, X̄ is a <b>random variable</b>, and its distribution is the <b>sampling distribution</b>. Its SD is the <b>standard error</b> (SE): how much x̄ typically misses μ.</p>`,
      formula: `<div class="formula"><div class="fb">E[X̄] = μ &nbsp;·&nbsp; SE(X̄) = ${fr("σ", "√n")}</div><span class="fn">with σ unknown, estimate it by s / √n</span></div>`,
      steps: `<ol><li>Take the population SD σ (or the sample SD s if σ is unknown).</li><li>Divide by √n.</li></ol>`,
      example: `<ul><li>Exam scores with σ = 8 and samples of n = 16: SE = 8 / √16 = <b class="num">2</b>.</li><li>With n = 64: SE = 8 / 8 = <b class="num">1</b>. Four times the data halves the standard error.</li></ul>`,
      watch: `<p>The SD describes single values; the SE describes the sample mean. They differ by the factor √n, so don't mix them up.</p>`,
      keys: [["Standard error of the mean", `SE(X̄) = ${fr("σ", "√n")} (estimate: s / √n)`, "=STDEV.S(range)/SQRT(COUNT(range))"]] },
    { name: "Central Limit Theorem", tag: "Theorem",
      idea: `<p>The <b>Central Limit Theorem</b> (CLT) says that for a large sample, X̄ is approximately normal with mean μ and SD σ / √n, <b>whatever the shape</b> of the population. A common rule of thumb is n ≥ 30. If the population itself is normal, X̄ is exactly normal for any n.</p>`,
      formula: `<div class="formula"><div class="fb">X̄ ≈ N(μ, σ²/n)</div></div> <div class="formula"><div class="fb">z = ${fr("x̄ − μ", "σ / √n")}</div></div>`,
      steps: `<ol><li>Compute the standard error σ / √n.</li><li>Standardize the sample mean: z = (x̄ − μ) / SE.</li><li>Use the z-table as in Part 4.</li></ol>`,
      example: `<p>Exam scores have μ = 70 and σ = 8. For a sample of n = 16 students, what is P(X̄ &gt; 72)?</p><ol><li>SE = 8 / √16 = 2</li><li>z = (72 − 70) / 2 = 1</li><li>P(X̄ &gt; 72) = 1 − Φ(1) = 1 − 0.8413 = <b class="num">0.1587</b></li></ol>
        <p>For one single student, P(X &gt; 72) uses z = (72 − 70) / 8 = 0.25 and is 0.4013, much larger: averages vary much less than single values.</p>`,
      watch: `<p>Divide by σ / √n for a sample mean, and by σ for a single value. Using σ for a mean is the most common mistake here.</p>`,
      widgets: ["clt"],
      keys: [["Central Limit Theorem", "X̄ ≈ N(μ, σ²/n) for large n", ""], ["z for a sample mean", `z = ${fr("x̄ − μ", "σ / √n")}`, ""]] },
    { name: "Estimator and estimate", tag: "Basics",
      idea: `<p>An <b>estimator</b> is a rule for guessing a parameter from data, such as "use the sample mean X̄ to estimate μ". It is a random variable. An <b>estimate</b> is the number that rule gives for one particular sample, such as x̄ = 71.3.</p>
        <p>An estimator is <b>unbiased</b> if on average it hits the parameter: E[X̄] = μ, and E[S²] = σ² when S² divides by n − 1. That is the reason for n − 1 in concept 2.5.</p>`,
      example: `<ul><li>Estimator: X̄ = ΣXᵢ / n, a formula that works for any sample.</li><li>Estimate: x̄ = 71.3, from the 40 students you surveyed.</li></ul>`,
      watch: `<p>Capital letters (X̄, S²) usually mean the random rule; small letters (x̄, s²) mean the number from your data.</p>`,
      keys: [["Estimator vs estimate", "estimator = a rule (X̄) · estimate = its value in one sample (x̄ = 71.3)", ""], ["Unbiased estimator", "E[X̄] = μ · E[S²] = σ² (with n − 1)", ""]] }
  ],
  practice: [
    { key: "paramstat", label: "Parameter or statistic?", mode: "general", gen() {
      const b = pick(PS_BANK);
      return { q: `<p>Is this a <b>parameter</b> or a <b>statistic</b>?</p><div class="vcard"><span class="vn">${b[0]}</span></div>`, ans: b[1], choices: ["Parameter", "Statistic"],
        steps: `<ol><li>Ask: does it describe the whole population, or was it computed from a sample?</li><li>${b[2]}</li><li>Answer: <b>${b[1]}</b>.</li></ol>` };
    } },
    { key: "estq", label: "Estimator or estimate?", mode: "general", gen() {
      const b = pick(EST_BANK);
      return { q: `<p>Is this an <b>estimator</b> or an <b>estimate</b>?</p><div class="vcard"><span class="vn">${b[0]}</span></div>`, ans: b[1], choices: ["Estimator", "Estimate"],
        steps: `<ol><li>An estimator is a rule; an estimate is the number the rule gives for one sample.</li><li>${b[2]}</li><li>Answer: <b>${b[1]}</b>.</li></ol>` };
    } },
    { key: "se", label: "Standard error", mode: "general", gen() {
      const kind = pick(["sigma", "s", "factor"]);
      if (kind === "factor") { const n1 = pick([10, 20, 25, 50]), k = pick([4, 9, 16, 2]), ans = 1 / Math.sqrt(k);
        return { q: `<p>The sample size grows from n = ${n1} to n = ${n1 * k}. By what factor is the standard error of x̄ multiplied? (3 decimals)</p>`, ans, dp: 3,
          steps: `<ol><li>SE = σ / √n, so SE is proportional to 1 / √n.</li><li>n is multiplied by ${k}, so SE is multiplied by 1 / √${k} = <b class="num">${f(ans, 3)}</b>${k === 4 ? ": it halves" : k === 9 ? ": it becomes a third" : ""}.</li></ol>` }; }
      const sd = ri(4, 20), n = pick([9, 16, 25, 30, 36, 49, 50, 64, 100]), ans = sd / Math.sqrt(n);
      return { q: `<p>${kind === "sigma" ? `A population has σ = ${sd}.` : `A sample of n = ${n} has standard deviation s = ${sd}; σ is unknown.`} Find the standard error of the sample mean${kind === "sigma" ? ` for samples of n = ${n}` : ""} (3 decimals).</p>`, ans, dp: 3,
        steps: `<ol><li>SE = ${kind === "sigma" ? "σ" : "s"} / √n = ${sd} / √${n} = ${sd} / ${g4(Math.sqrt(n))}</li><li>SE = <b class="num">${f(ans, 3)}</b></li></ol>`, excel: kind === "s" ? "=STDEV.S(range)/SQRT(COUNT(range))" : `=${sd}/SQRT(${n})` };
    } },
    { key: "clt", label: "Probability for x̄", mode: "general", gen() {
      const c = pick([["A machine fills bottles", "ml", 500, 12], ["Exam scores", "points", 70, 8], ["Daily sales of a shop", "€", 1200, 150], ["Commute times", "minutes", 35, 10]]);
      const [what, u, mu, sd] = c, n = pick([16, 25, 36, 49, 64, 100]), se = sd / Math.sqrt(n), kind = pick(["above", "below", "between"]);
      const zz = pick([0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5]), sgn = pick([1, -1]);
      if (kind === "between") { const lo = +(mu - zz * se).toFixed(1), hi = +(mu + zz * se).toFixed(1), za = +((lo - mu) / se).toFixed(2), zb = +((hi - mu) / se).toFixed(2), ans = M.phi(zb) - M.phi(za);
        return { q: `<p>${what}: μ = ${mu} ${u}, σ = ${sd} ${u}. For a random sample of n = ${n}, find <b>P(${lo} &lt; X̄ &lt; ${hi})</b> (4 decimals).</p>`, ans, dp: 4, alts: [M.phi((hi - mu) / se) - M.phi((lo - mu) / se)],
          viz: { dist: "z", regions: [[za, zb]], marks: [{ x: za, label: `z = ${f(za, 2)}` }, { x: zb, label: `z = ${f(zb, 2)}` }] },
          steps: `<ol><li>SE = σ / √n = ${sd} / √${n} = ${g4(se)}</li><li>z-values: (${lo} − ${mu}) / ${g4(se)} = ${f(za, 2)} and (${hi} − ${mu}) / ${g4(se)} = ${f(zb, 2)}</li><li>Φ(${f(zb, 2)}) − Φ(${f(za, 2)}) = ${f(M.phi(zb), 4)} − ${f(M.phi(za), 4)} = <b class="num">${f(ans, 4)}</b></li></ol>` }; }
      const x = +(mu + sgn * zz * se).toFixed(1), z = +((x - mu) / se).toFixed(2), below = M.phi(z), ans = kind === "above" ? 1 - below : below, ex = M.phi((x - mu) / se);
      return { q: `<p>${what}: μ = ${mu} ${u}, σ = ${sd} ${u}. For a random sample of n = ${n}, find <b>P(X̄ ${kind === "above" ? "&gt;" : "&lt;"} ${x})</b> (4 decimals).</p>`, ans, dp: 4, alts: [kind === "above" ? 1 - ex : ex],
        viz: { dist: "z", regions: kind === "above" ? [[z, 9]] : [[-9, z]], marks: [{ x: z, label: `z = ${f(z, 2)}` }] },
        steps: `<ol><li>By the CLT, X̄ ≈ N(${mu}, ${sd}² / ${n}).</li><li>SE = σ / √n = ${sd} / √${n} = ${g4(se)}</li><li>z = (${x} − ${mu}) / ${g4(se)} = ${f(z, 2)}</li><li>Φ(${f(z, 2)}) = ${f(below, 4)}${kind === "above" ? `, so P(X̄ &gt; ${x}) = 1 − ${f(below, 4)} = <b class="num">${f(ans, 4)}</b>` : `, so P(X̄ &lt; ${x}) = <b class="num">${f(ans, 4)}</b>`}</li></ol>` };
    } },
    { key: "dse", label: "Standard error of a mean", mode: "data", gen() {
      const c = pick(NUMERIC.slice(0, 4)), g = pick(GROUPS.slice(0, 7)), v = col(c.i, g), n = v.length, s = M.sdS(v), ans = s / Math.sqrt(n), L = LETTERS[c.i];
      return { q: `<p>Estimate the <b>standard error of the mean</b> of <b>${c.name}</b> for <b>${g.label.toLowerCase()}</b> (3 decimals).</p>`, ans, dp: 3,
        steps: `<ol><li>Keep only ${g.label.toLowerCase()}: n = ${n}.</li><li>Sample SD: s = ${f(s, 4)}</li><li>SE = s / √n = ${f(s, 4)} / √${n} = <b class="num">${f(ans, 3)}</b></li></ol>`,
        excel: g.key === "all" ? `=STDEV.S(${L}2:${L}61)/SQRT(60)` : "Filter the rows first, then =STDEV.S(…)/SQRT(COUNT(…))" };
    } },
    { key: "dclt", label: "Sample means from the class", mode: "data", gen() {
      const c = pick(NUMERIC.slice(0, 4)), all = col(c.i), mu = M.mean(all), sd = M.sdP(all), n = pick([4, 9, 16, 25]), se = sd / Math.sqrt(n), up = Math.random() < 0.5;
      const x = +(mu + (up ? 1 : -1) * pick([0.5, 0.75, 1, 1.25, 1.5, 2]) * se).toFixed(1), z = +((x - mu) / se).toFixed(2), below = M.phi(z), ans = up ? 1 - below : below, L = LETTERS[c.i];
      return { q: `<p>Treat the 60 students as the whole population. You draw random samples of n = ${n} students and compute the mean <b>${c.name}</b>. Assuming X̄ is approximately normal, find <b>P(X̄ ${up ? "&gt;" : "&lt;"} ${x})</b> (4 decimals).</p>`, ans, dp: 4, alts: [up ? 1 - M.phi((x - mu) / se) : M.phi((x - mu) / se)],
        viz: { dist: "z", regions: up ? [[z, 9]] : [[-9, z]], marks: [{ x: z, label: `z = ${f(z, 2)}` }] },
        steps: `<ol><li>Population values (all 60): μ = ${f(mu, 4)}, σ = ${f(sd, 4)} (population SD, divide by N).</li><li>SE = σ / √n = ${f(sd, 4)} / √${n} = ${f(se, 4)}</li><li>z = (${x} − ${f(mu, 4)}) / ${f(se, 4)} = ${f(z, 2)}</li><li>Φ(${f(z, 2)}) = ${f(below, 4)}${up ? `, so P(X̄ &gt; ${x}) = 1 − ${f(below, 4)} = <b class="num">${f(ans, 4)}</b>` : ` = <b class="num">${f(ans, 4)}</b>`}</li></ol>`,
        excel: `μ: =AVERAGE(${L}2:${L}61) · σ: =STDEV.P(${L}2:${L}61)` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 6 */
{
  title: "The t-distribution", table: "t-student",
  intro: "z-scores need the population SD σ. Usually you only have the sample SD s, which adds uncertainty. The t-distribution builds that uncertainty in.",
  buildsOn: "the standard error (Part 5) and table reading from Part 4",
  bridge: "More distributions for variances",
  summary: [
    "Use <b>t</b> instead of z when σ is unknown and estimated by s. Its shape depends on <b>df = n − 1</b>.",
    "t has heavier tails than Z, so the same probability needs a bigger t value. As df grows, t approaches Z.",
    "The course t-table gives areas <b>below</b> t (columns 0.999 to 0.500). For areas below 0.5, use symmetry and flip the sign."
  ],
  concepts: [
    { name: "Why a t-distribution?", tag: "Model",
      idea: `<p>When σ is replaced by the sample SD s, extreme values become more likely, especially for small samples. The t-distribution is bell-shaped and symmetric around 0 like Z, but with <b>heavier tails</b>.</p>`,
      formula: `<div class="formula"><div class="fb">T = ${fr("X̄ − μ", "s / √n")} ~ t(n − 1)</div><span class="fn">like z for a sample mean, but with s instead of σ</span></div> <div class="formula"><div class="fb">df = n − 1</div><span class="fn">degrees of freedom for one sample of size n</span></div>`,
      steps: `<ul><li>Small df: noticeably flatter peak and fatter tails.</li><li>Large df (above about 30): almost identical to Z.</li><li>df = ∞ is exactly the standard normal.</li></ul>`,
      watch: `<p>df is n − 1, not n. A sample of 16 has df = 15.</p>`,
      widgets: ["texplorer"],
      keys: [["t statistic", `T = ${fr("X̄ − μ", "s / √n")} ~ t(n − 1)`, ""], ["Degrees of freedom", "df = n − 1", ""]] },
    { name: "From probability to t", tag: "Table",
      idea: `<p>The course t-table gives <b>P(t<sub>df</sub> &lt; t)</b>. Rows are df, columns are areas below (0.999 down to 0.500), and the cells are t values.</p>`,
      steps: `<ol><li>If the area is given above t, convert: area below = 1 − area above.</li><li>Area below ≥ 0.5: go to row df and the matching column.</li><li>Area below &lt; 0.5: t is negative. Look up column 1 − p and flip the sign.</li><li>If df is not in the table, use the next smaller df.</li></ol>`,
      example: `<ul><li>df = 5, area below 0.95: row 5, column 0.950 → t = <b class="num">2.015</b>.</li><li>df = 15, area above 0.975: area below = 0.025. Use column 0.975 → 2.131, then flip: t = <b class="num">−2.13</b>.</li></ul>`,
      watch: `<p>Many textbooks print right-tail tables. Your course table is cumulative (area below), so always check the table heading first.</p>`,
      widgets: ["ttable"],
      keys: [["t from area below p", "t such that P(t<sub>df</sub> < t) = p", "=T.INV(p,df)"], ["Symmetry", "P(T < −t) = P(T > t)", ""]] },
    { name: "From t to probability", tag: "Table",
      idea: `<p>Now t is given. Find it in the row for your df; its column is the area below.</p>`,
      steps: `<ol><li>Go to row df and find the t value in the body.</li><li>Its column gives P(T &lt; t).</li><li>For the area above, subtract from 1. For a negative t, use symmetry.</li></ol>`,
      example: `<p>df = 20, P(T &gt; 1.064): in row 20, 1.064 sits in column 0.850, so P(T &lt; 1.064) = 0.85 and P(T &gt; 1.064) = 1 − 0.85 = <b class="num">0.15</b>.</p>`,
      watch: `<p>If the t value falls between two table entries, the table only gives a range for the probability. Excel gives the exact value: ${xl("=T.DIST.RT(t,df)")}.</p>`,
      keys: [["Area below t", "P(T < t)", "=T.DIST(t,df,TRUE)"], ["Area above t", "P(T > t) = 1 − P(T < t)", "=T.DIST.RT(t,df)"]] },
    { name: "t compared with z", tag: "Compare",
      idea: `<p>The value with 95% of the area below it, for different df:</p>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th>Distribution</th><th>Value</th></tr></thead><tbody>
        ${[1, 5, 10, 30, 120].map(d => `<tr><td>t, df = ${d}</td><td class="m">${M.tinv(0.95, d).toFixed(3)}</td></tr>`).join("")}
        <tr><td>Standard normal z</td><td class="m">1.645</td></tr></tbody></table></div>`,
      watch: `<p>Smaller samples need a bigger t to reach the same probability. That is the price of estimating σ with s.</p>`,
      keys: [] }
  ],
  practice: [
    { key: "tstat", label: "t statistic", mode: "general", gen() {
      const c = pick([["A coffee machine should pour", "ml", 250, [3, 8]], ["Batteries are labelled with a life of", "hours", 20, [1, 3]], ["A bakery's loaves should weigh", "g", 800, [10, 25]]]);
      const [txt, u, mu0, sr] = c, n = pick([9, 12, 16, 20, 25]), s = ri(sr[0], sr[1]), xbar = +(mu0 + (Math.random() < 0.5 ? -1 : 1) * (0.3 + Math.random() * 1.2) * s / Math.sqrt(n) * 2).toFixed(1);
      const se = s / Math.sqrt(n), t = (xbar - mu0) / se;
      return { q: `<p>${txt} μ = ${mu0} ${u}. A sample of n = ${n} has x̄ = ${xbar} ${u} and s = ${s} ${u}. Compute the t statistic T = (x̄ − μ) / (s / √n) (2 decimals).</p>`, ans: t, dp: 2,
        steps: `<ol><li>Standard error: s / √n = ${s} / √${n} = ${f(se, 4)}</li><li>t = (${xbar} − ${mu0}) / ${f(se, 4)} = <b class="num">${f(t, 2)}</b></li><li>It follows a t-distribution with df = n − 1 = ${n - 1}.</li></ol>` };
    } },
    { key: "tbelow", label: "t from area below", mode: "general", gen() {
      const df = pick([3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18, 20, 24, 25, 30]), useN = Math.random() < 0.3;
      const p = pick([0.95, 0.975, 0.90, 0.99, 0.995, 0.05, 0.025, 0.10, 0.01, 0.80, 0.85]), dp = pick([2, 3]), t = M.tinv(p, df);
      return { q: `<p>${useN ? `A sample has n = ${df + 1} observations. ` : ""}Find the value t of a t-Student random variable with ${useN ? "the matching degrees of freedom" : `<b>${df}</b> degrees of freedom`} such that the probability of a value <b>below</b> it is <b>${p}</b>. Use ${dp} decimals.</p>`,
        ans: t, dp, viz: { dist: "t", df, overlay: true, regions: [[-99, t]], marks: [{ x: t, label: `t = ${f(t, 3)}` }] },
        steps: `<ol>${useN ? `<li>df = n − 1 = ${df + 1} − 1 = ${df}</li>` : ""}${tSteps(p, df, dp)}</ol>`, excel: `=T.INV(${p},${df})` };
    } },
    { key: "tabove", label: "t from area above", mode: "general", gen() {
      const df = pick([4, 5, 6, 8, 10, 11, 12, 15, 16, 20, 22, 25, 28, 30]);
      const p = pick([0.975, 0.95, 0.90, 0.99, 0.05, 0.025, 0.10, 0.01]), dp = pick([2, 3]), t = M.tinv(1 - p, df);
      return { q: `<p>Find the value t of a t-Student random variable with <b>${df}</b> degrees of freedom such that the probability of a value <b>above</b> it is <b>${p}</b>. Use ${dp} decimals.</p>`,
        ans: t, dp, viz: { dist: "t", df, overlay: true, regions: [[t, 99]], marks: [{ x: t, label: `t = ${f(t, 3)}` }] },
        steps: `<ol><li>Area above ${p} means area below = 1 − ${p} = ${g4(1 - p)}.</li>${tSteps(1 - p, df, dp)}</ol>`, excel: `=T.INV(${g4(1 - p)},${df})` };
    } },
    { key: "tprob", label: "Area from t", mode: "general", gen() {
      const df = pick([5, 6, 8, 9, 10, 12, 15, 17, 20, 24, 26, 30]), a = pick([0.40, 0.30, 0.20, 0.15, 0.10, 0.05, 0.025, 0.01, 0.005, 0.001]);
      const t = +M.tinv(1 - a, df).toFixed(3), kind = pick(["above", "above", "below", "negbelow"]);
      const ans = kind === "below" ? 1 - a : a, dp = Math.max(2, dpOf(a));
      const qt = kind === "negbelow" ? `P(T &lt; −${t})` : kind === "below" ? `P(T &lt; ${t})` : `P(T &gt; ${t})`;
      const regions = kind === "above" ? [[t, 99]] : kind === "below" ? [[-99, t]] : [[-99, -t]];
      return { q: `<p>Find the probability ${qt} for a t-Student random variable with <b>${df}</b> degrees of freedom. Use ${dp} decimals.</p>`, ans, dp,
        viz: { dist: "t", df, overlay: true, regions, marks: [{ x: kind === "negbelow" ? -t : t, label: `t = ${kind === "negbelow" ? "−" : ""}${t}` }] },
        steps: `<ol><li>Row df = ${df}: ${t} sits in column ${f(1 - a, 3)}. So P(T &lt; ${t}) = ${g4(1 - a)}.</li>
          ${kind === "below" ? `<li>That is already the answer: <b class="num">${f(ans, dp)}</b></li>` : kind === "negbelow" ? `<li>By symmetry, P(T &lt; −${t}) = P(T &gt; ${t}) = 1 − ${g4(1 - a)} = <b class="num">${f(ans, dp)}</b></li>` : `<li>Area above = 1 − ${g4(1 - a)} = <b class="num">${f(ans, dp)}</b></li>`}</ol>`,
        excel: kind === "above" ? `=T.DIST.RT(${t},${df})` : kind === "below" ? `=T.DIST(${t},${df},TRUE)` : `=T.DIST(-${t},${df},TRUE)` };
    } },
    { key: "dt", label: "t for a group", mode: "data", gen() {
      const g = pick(GROUPS.slice(1)), n = RAW.filter(g.f).length, df = n - 1, p = pick([0.90, 0.95, 0.975, 0.99, 0.995]);
      const tableDf = df > 30 ? (df >= 60 ? 60 : df >= 40 ? 40 : 30) : df, t = M.tinv(p, df), tTab = M.tinv(p, tableDf);
      return { q: `<p>You treat the <b>${g.label.toLowerCase()}</b> in the dataset as one sample. Count them, then find the value t with P(T &lt; t) = <b>${p}</b> for the matching degrees of freedom. Use 3 decimals.</p>`,
        ans: t, dp: 3, alts: [tTab],
        viz: { dist: "t", df, overlay: true, regions: [[-99, t]], marks: [{ x: t, label: `t = ${f(t, 3)}` }] },
        steps: `<ol><li>Count the ${g.label.toLowerCase()}: n = ${n}.</li><li>df = n − 1 = ${df}</li>${tableDf !== df ? `<li>df = ${df} is not in the table, so use the next smaller row, df = ${tableDf}: ${tTab.toFixed(3)} (Excel gives the exact ${f(t, 3)}).</li>` : `<li>Row df = ${df}, column ${f(p, 3)}: t = <b class="num">${f(t, 3)}</b></li>`}</ol>`,
        excel: `=T.INV(${p},${df})` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 7 */
{
  title: "Chi-square and F distributions", table: "chi-square",
  intro: "Two more distributions complete your table set. Both only take positive values and are skewed to the right. Later weeks use them for variances, goodness-of-fit and ANOVA; here the goal is to read their tables with confidence.",
  buildsOn: "reading the z and t tables (Parts 4 and 6)",
  summary: [
    "<b>χ²(ν)</b> is a sum of ν squared standard normals: positive, right-skewed, mean = ν. It is used for a variance: (n − 1)s² / σ² ~ χ²(n − 1).",
    "The course χ²-table gives q with <b>P(χ²<sub>df</sub> &lt; q)</b> in the columns 0.005 to 0.995. It is not symmetric, so a lower value needs its own column, never a sign flip.",
    "<b>F(m, n)</b> is a ratio of two chi-squares, each divided by its df: m in the numerator, n in the denominator. It is used to compare two variances.",
    "The course F-table gives f with <b>P(F<sub>m,n</sub> &lt; f)</b> = 0.900 to 0.995. For a lower tail, swap the df and take the reciprocal: f<sub>p; m,n</sub> = 1 / f<sub>1−p; n,m</sub>."
  ],
  concepts: [
    { name: "The chi-square distribution", tag: "Model",
      idea: `<p>Square ν independent standard normal variables and add them up: the result follows a <b>chi-square</b> distribution with ν degrees of freedom, χ²(ν). It can't be negative, it is skewed to the right, and its mean is ν. As ν grows, it becomes more symmetric.</p>`,
      formula: `<div class="formula"><div class="fb">χ²(ν) = Z₁² + Z₂² + … + Z<sub>ν</sub>²</div></div> <div class="formula"><div class="fb">${fr("(n − 1) s²", "σ²")} ~ χ²(n − 1)</div><span class="fn">the link to the sample variance of a normal population</span></div>`,
      steps: `<ul><li>Only positive values: the curve starts at 0.</li><li>Small df: strongly skewed. Large df: closer to a bell shape.</li><li>Uses: inference on a variance, goodness-of-fit tests, tests of independence.</li></ul>`,
      watch: `<p>Because the curve is not symmetric around 0, the trick "flip the sign" from z and t does not work here.</p>`,
      widgets: ["chi2explorer"],
      keys: [["Chi-square", "χ²(ν) = Z₁² + … + Z<sub>ν</sub>² · (n − 1)s² / σ² ~ χ²(n − 1)", ""]] },
    { name: "Reading the χ² table", tag: "Table",
      idea: `<p>Your course table gives <b>P(χ²<sub>df</sub> &lt; q)</b>: rows are df (1 to 30, 40, 60), columns are areas below (0.005 to 0.995), and the cells are the values q.</p>`,
      steps: `<ol><li>Convert to an area below: if the area is given above q, use 1 − area.</li><li>Go to row df and the column of that area. The cell is q.</li><li>Backwards: find q in row df; its column is P(χ² &lt; q).</li><li>For the middle part of the distribution (for example the middle 95%), read a lower and an upper value from two columns, 0.025 and 0.975.</li></ol>`,
      example: `<ul><li>df = 12, area below 0.975: q = <b class="num">23.337</b>. So P(χ²<sub>12</sub> &gt; 23.337) = 1 − 0.975 = 0.025.</li><li>df = 10, middle 95%: lower value (column 0.025) = <b class="num">3.247</b>, upper value (column 0.975) = <b class="num">20.483</b>.</li></ul>`,
      watch: `<p>Many textbooks print upper-tail tables. Yours is cumulative, so a column of 0.950 means 95% of the area lies <b>below</b> q.</p>`,
      keys: [["χ² from area below p", "q such that P(χ²<sub>df</sub> < q) = p", "=CHISQ.INV(p,df)"], ["Area below q", "P(χ²<sub>df</sub> < q)", "=CHISQ.DIST(q,df,TRUE)"]] },
    { name: "The F distribution", tag: "Model",
      idea: `<p>Divide two independent chi-square variables, each by its own df, and you get an <b>F</b> distribution. It has two degrees of freedom: <b>m</b> for the numerator and <b>n</b> for the denominator. Like χ², it is positive and skewed to the right.</p>`,
      formula: `<div class="formula"><div class="fb">F(m, n) = ${fr("χ²(m) / m", "χ²(n) / n")}</div></div> <div class="formula"><div class="fb">F = ${fr("s₁²", "s₂²")}</div><span class="fn">ratio of two sample variances, with m = n₁ − 1 and n = n₂ − 1</span></div>`,
      steps: `<ul><li>Uses: comparing two variances, ANOVA, the overall significance of a regression.</li><li>The order matters: F(3, 10) and F(10, 3) are different distributions.</li></ul>`,
      watch: `<p>Always note which df belongs to the numerator (m) and which to the denominator (n) before using the table.</p>`,
      widgets: ["fexplorer"],
      keys: [["F distribution", "F(m, n) = (χ²<sub>m</sub> / m) / (χ²<sub>n</sub> / n) · F = s₁² / s₂²", ""]] },
    { name: "Reading the F table", tag: "Table",
      idea: `<p>Your course table gives <b>P(F<sub>m,n</sub> &lt; f)</b> for five areas: 0.900, 0.950, 0.975, 0.990 and 0.995. Columns are m (numerator df). Rows come in blocks, one per n (denominator df), with a line for each area. The table runs over two pages.</p>`,
      steps: `<ol><li>Find the block for n, then the line with your area below (0.950, …).</li><li>Go to column m. The cell is f.</li><li>Small areas below (0.100, 0.050, …) are not in the table. Swap the df and take the reciprocal: f<sub>p; m,n</sub> = 1 / f<sub>1−p; n,m</sub>.</li></ol>`,
      example: `<ul><li>P(F<sub>5,6</sub> &lt; f) = 0.95: block n = 6, line 0.950, column m = 5 → f = <b class="num">4.39</b>.</li><li>P(F<sub>5,6</sub> &lt; f) = 0.05: swap to F<sub>6,5</sub> with area 0.95. Block 5, line 0.950, column 6 → 4.95, so f = 1 / 4.95 = <b class="num">0.202</b>.</li></ul>`,
      watch: `<p>Putting the larger variance in the numerator means you only ever need the upper tail, which is directly in the table.</p>`,
      keys: [["F from area below p", "f such that P(F<sub>m,n</sub> < f) = p", "=F.INV(p,m,n)"], ["Lower tail of F", "f<sub>p; m,n</sub> = 1 / f<sub>1−p; n,m</sub>", ""]] }
  ],
  practice: [
    { key: "chiq", label: "χ² value from an area", mode: "general", gen() {
      const df = pick(CHI_DFS.slice(1)), col = pick(CHI_COLS), above = Math.random() < 0.35, q = M.chi2inv(col, df), given = above ? +(1 - col).toFixed(3) : col;
      return { q: `<p>Find q such that <b>P(χ²<sub>${df}</sub> ${above ? "&gt;" : "&lt;"} q) = ${given}</b>. Use 3 decimals.</p>`, ans: q, dp: 3,
        viz: { dist: "chi2", df, regions: above ? [[q, 9999]] : [[0, q]], marks: [{ x: q, label: `q = ${f(q, 3)}` }] },
        steps: `<ol>${above ? `<li>The table needs the area below: 1 − ${given} = ${p3(col)}.</li>` : ""}<li>χ²-table: row df = ${df}, column ${p3(col)}.</li><li>q = <b class="num">${f(q, 3)}</b></li></ol>`, excel: `=CHISQ.INV(${g4(col)},${df})` };
    } },
    { key: "chip", label: "Area from a χ² value", mode: "general", gen() {
      const df = pick(CHI_DFS.slice(1)), col = pick(CHI_COLS), q = +M.chi2inv(col, df).toFixed(3), above = Math.random() < 0.5, ans = above ? 1 - col : col;
      return { q: `<p>Find <b>P(χ²<sub>${df}</sub> ${above ? "&gt;" : "&lt;"} ${fx(q, 3)})</b>. Use 3 decimals.</p>`, ans, dp: 3,
        viz: { dist: "chi2", df, regions: above ? [[q, 9999]] : [[0, q]], marks: [{ x: q, label: `q = ${fx(q, 3)}` }] },
        steps: `<ol><li>In row df = ${df}, the value ${fx(q, 3)} sits in column ${p3(col)}, so P(χ² &lt; ${fx(q, 3)}) = ${p3(col)}.</li>${above ? `<li>Area above: 1 − ${p3(col)} = <b class="num">${p3(ans)}</b></li>` : `<li>Answer: <b class="num">${p3(ans)}</b></li>`}</ol>`, excel: above ? `=1-CHISQ.DIST(${fx(q, 3)},${df},TRUE)` : `=CHISQ.DIST(${fx(q, 3)},${df},TRUE)` };
    } },
    { key: "chimid", label: "Middle of χ²", mode: "general", gen() {
      const df = pick(CHI_DFS.slice(1)), c = pick([0.90, 0.95, 0.99]), a = +((1 - c) / 2).toFixed(3), lower = Math.random() < 0.5, lo = M.chi2inv(a, df), hi = M.chi2inv(1 - a, df);
      return { q: `<p>Two values cut off the <b>middle ${c * 100}%</b> of a χ² distribution with ${df} degrees of freedom, with equal areas in both tails. Find the <b>${lower ? "lower" : "upper"}</b> value (3 decimals).</p>`, ans: lower ? lo : hi, dp: 3,
        viz: { dist: "chi2", df, regions: [[lo, hi]], marks: [{ x: lo, label: f(lo, 3) }, { x: hi, label: f(hi, 3) }] },
        steps: `<ol><li>Each tail holds (1 − ${c}) / 2 = ${p3(a)}.</li><li>Lower value: area below ${p3(a)} → row ${df}, column ${p3(a)} = ${f(lo, 3)}.</li><li>Upper value: area below ${p3(1 - a)} → row ${df}, column ${p3(1 - a)} = ${f(hi, 3)}.</li><li>The ${lower ? "lower" : "upper"} value is <b class="num">${f(lower ? lo : hi, 3)}</b>. The two are not symmetric, so each needs its own column.</li></ol>`, excel: `=CHISQ.INV(${g4(lower ? a : 1 - a)},${df})` };
    } },
    { key: "fq", label: "F value (upper tail)", mode: "general", gen() {
      const m = pick(F_M), n = pick(F_N), col = pick(F_COLS), above = Math.random() < 0.35, v = M.finv(col, m, n), given = above ? +(1 - col).toFixed(3) : col;
      return { q: `<p>Find f such that <b>P(F<sub>${m},${n}</sub> ${above ? "&gt;" : "&lt;"} f) = ${given}</b>. Use 2 decimals.</p>`, ans: v, dp: 2, table: "f-snedecor",
        viz: { dist: "f", m, n, regions: above ? [[v, 9999]] : [[0, v]], marks: [{ x: v, label: `f = ${f(v, 2)}` }] },
        steps: `<ol>${above ? `<li>The table needs the area below: 1 − ${given} = ${p3(col)}.</li>` : ""}<li>F-table: block n = ${n}, line ${p3(col)}, column m = ${m}.</li><li>f = <b class="num">${f(v, 2)}</b></li></ol>`, excel: `=F.INV(${g4(col)},${m},${n})` };
    } },
    { key: "flow", label: "F value (lower tail)", mode: "general", gen() {
      const m = pick(F_M), n = pick(F_N), p = pick([0.1, 0.05, 0.025, 0.01, 0.005]), above = Math.random() < 0.35, up = +M.finv(1 - p, n, m).toFixed(2), ans = 1 / up, given = above ? +(1 - p).toFixed(3) : p;
      return { q: `<p>Find f such that <b>P(F<sub>${m},${n}</sub> ${above ? "&gt;" : "&lt;"} f) = ${given}</b>. Use 3 decimals.</p>`, ans, dp: 3, alts: [M.finv(p, m, n)], table: "f-snedecor",
        viz: { dist: "f", m, n, regions: above ? [[ans, 9999]] : [[0, ans]], marks: [{ x: ans, label: `f = ${f(ans, 3)}` }] },
        steps: `<ol>${above ? `<li>Area below: 1 − ${given} = ${p3(p)}.</li>` : ""}<li>An area below ${p3(p)} is a lower tail, which is not in the table.</li><li>Swap the df and use 1 − ${p3(p)} = ${p3(1 - p)}: f<sub>${p3(p)}; ${m},${n}</sub> = 1 / f<sub>${p3(1 - p)}; ${n},${m}</sub>.</li><li>F-table: block ${m} (now the denominator), line ${p3(1 - p)}, column ${n} → ${fx(up, 2)}.</li><li>f = 1 / ${fx(up, 2)} = <b class="num">${f(ans, 3)}</b></li></ol>`, excel: `=F.INV(${g4(p)},${m},${n})` };
    } },
    { key: "dfratio", label: "Variance ratio F", mode: "data", gen() {
      const c = pick(NUMERIC.slice(0, 4)), pr = pick(PAIRS).map(grp), a = col(c.i, pr[0]), b = col(c.i, pr[1]), va = M.varS(a), vb = M.varS(b), t = va >= vb ? 0 : 1;
      const top = t ? b : a, bot = t ? a : b, gt = pr[t], gb = pr[1 - t], vt = M.varS(top), vbt = M.varS(bot), F = vt / vbt;
      return { q: `<p>Compare the spread of <b>${c.name}</b> between <b>${pr[0].label.toLowerCase()}</b> and <b>${pr[1].label.toLowerCase()}</b>. Compute F = s₁² / s₂² with the larger sample variance on top (2 decimals).</p>`, ans: F, dp: 2, table: "f-snedecor",
        steps: `<ol><li>${pr[0].label}: n = ${a.length}, s² = ${f(va, 4)}. ${pr[1].label}: n = ${b.length}, s² = ${f(vb, 4)}.</li><li>Larger variance on top: F = ${f(vt, 4)} / ${f(vbt, 4)} = <b class="num">${f(F, 2)}</b></li><li>Degrees of freedom: m = ${top.length} − 1 = ${top.length - 1} (${gt.label.toLowerCase()}), n = ${bot.length} − 1 = ${bot.length - 1} (${gb.label.toLowerCase()}). Comparing F with the F-table tells you whether the spreads really differ; that test comes in a later week.</li></ol>`,
        excel: "Filter each group, then =VAR.S(group 1)/VAR.S(group 2)" };
    } }
  ]
}
];

/* =========================================================================
   WEEKS 2–6 · shared helpers (source: the course content specification for weeks 2–6, Moodle pages of course 2966)
   The course writes π for a population proportion and p for a sample proportion.
   ========================================================================= */
const shuffle = a => a.map(x => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map(x => x[1]);
const rr = (a, b, dp) => +(a + Math.random() * (b - a)).toFixed(dp);
const tRow = df => df <= 30 ? df : df < 40 ? 30 : df < 60 ? 40 : df < 120 ? 60 : 120;
const fRow = v => [...F_DFS].reverse().find(d => d <= v) || 1;
const chiRow = v => [...CHI_DFS].reverse().find(d => d <= v) || 1;
const pFmt = p => p < 0.0001 ? "&lt; 0.0001" : f(p, 4);
/* course-table lookups, written as the student would do them */
const zLook = col => `z-table: find ${f(col, 4)} in the body (area below z) → z = <b class="num">${M.invphi(col).toFixed(3)}</b>`;
const tLook = (col, df) => { const r = tRow(df);
  return r === df ? `t-table: row df = ${df}, column ${f(col, 3)} → t = <b class="num">${M.tinv(col, df).toFixed(3)}</b>`
    : `t-table: df = ${df} is not a row, so use the next smaller row, df = ${r}, column ${f(col, 3)} → t = <b class="num">${M.tinv(col, r).toFixed(3)}</b> (Excel gives the exact ${M.tinv(col, df).toFixed(3)})`; };
const fLook = (col, m, n) => { const r = fRow(n);
  return r === n ? `F-table: block n = ${n}, line ${f(col, 3)}, column m = ${m} → f = <b class="num">${M.finv(col, m, n).toFixed(2)}</b>`
    : `F-table: n = ${n} has no block, so use the next smaller block, n = ${r}, line ${f(col, 3)}, column m = ${m} → f = <b class="num">${M.finv(col, m, r).toFixed(2)}</b> (Excel gives the exact ${M.finv(col, m, n).toFixed(2)})`; };
const chiLook = (col, df) => { const r = chiRow(df);
  return r === df ? `χ²-table: row df = ${df}, column ${f(col, 3)} → q = <b class="num">${M.chi2inv(col, df).toFixed(3)}</b>`
    : `χ²-table: df = ${df} is not a row, so use the next smaller row, df = ${r}, column ${f(col, 3)} → q = <b class="num">${M.chi2inv(col, r).toFixed(3)}</b> (Excel gives the exact ${M.chi2inv(col, df).toFixed(3)})`; };

/* hypothesis tests */
const TAIL = { two: { h0: "=", h1: "≠", name: "Two-tailed" }, right: { h0: "≤", h1: "&gt;", name: "Right-tailed" }, left: { h0: "≥", h1: "&lt;", name: "Left-tailed" } };
const hyp = (par, v, t) => `H₀: ${par} ${TAIL[t].h0} ${v} · H₁: ${par} ${TAIL[t].h1} ${v}`;
const pOf = (stat, tail, cdf) => tail === "two" ? 2 * (1 - cdf(Math.abs(stat))) : tail === "right" ? 1 - cdf(stat) : cdf(stat);
const critCol = (a, tail) => tail === "two" ? 1 - a / 2 : 1 - a;
const rejects = (stat, c, tail) => tail === "two" ? Math.abs(stat) > c : tail === "right" ? stat > c : stat < -c;
const ruleTxt = (sym, c, tail) => tail === "two" ? `reject H₀ if ${sym} &lt; −${c} or ${sym} &gt; ${c}` : tail === "right" ? `reject H₀ if ${sym} &gt; ${c}` : `reject H₀ if ${sym} &lt; −${c}`;
const rejViz = (dist, df, c, stat, tail, sym) => ({ dist, df, overlay: dist === "t",
  regions: tail === "two" ? [[-99, -c], [c, 99]] : tail === "right" ? [[c, 99]] : [[-99, -c]], marks: [{ x: stat, label: `${sym} = ${f(stat, 2)}` }] });
const pSteps = (sym, stat, tail, p) => tail === "two" ? `p = 2 × P(${sym.toUpperCase()} &gt; ${f(Math.abs(stat), 3)}) = ${pFmt(p)}` : tail === "right" ? `p = P(${sym.toUpperCase()} &gt; ${f(stat, 3)}) = ${pFmt(p)}` : `p = P(${sym.toUpperCase()} &lt; ${f(stat, 3)}) = ${pFmt(p)}`;
/* decision with both approaches; c = critical value as read from the table */
const decideSteps = (sym, stat, c, tail, a, p) => { const rej = p <= a;
  return `<li>Critical value approach: ${ruleTxt(sym, f(c, 3), tail)}. ${sym} = ${f(stat, 3)}, so ${rej ? "it falls in the rejection region" : "it does not fall in the rejection region"}.</li>
    <li>p-value approach: ${pSteps(sym, stat, tail, p)} ${rej ? "≤" : "&gt;"} α = ${a}.</li>
    <li>Both approaches agree: <b>${rej ? "reject H₀" : "fail to reject H₀"}</b>.</li>`; };
/* keep generated statistics away from the critical value, so table and Excel always agree */
const clear = (stat, cs) => cs.every(c => Math.abs(Math.abs(stat) - c) > 0.06);

/* question builders for concept checks */
const tfGen = (bank, lead) => () => { const b = pick(bank);
  return { q: `<p>${lead || "True or false?"}</p><div class="vcard"><span class="vn">${b[0]}</span></div>`, ans: b[1] ? "True" : "False", choices: ["True", "False"],
    steps: `<ol><li>${b[2]}</li><li>Answer: <b>${b[1] ? "True" : "False"}</b>.</li></ol>` }; };
const mcGen = bank => () => { const b = pick(bank);
  return { q: `<p>${b.q}</p>`, ans: b.a, choices: shuffle([b.a, ...b.w]), steps: `<ol><li>${b.why}</li><li>Answer: <b>${b.a}</b>.</li></ol>` }; };
/* "A test gives p = 0.02. Which statement is correct?" — the course's recurring question */
const pGen = (ctx, right, wrong) => () => { const r = pick(right), w = shuffle(wrong).slice(0, 3);
  return { q: `<p>${ctx} The p-value is <b>0.02</b>. Which statement is correct?</p>`, ans: r[0], choices: shuffle([r[0], ...w.map(x => x[0])]),
    steps: `<ol><li>Correct: <b>${r[0]}</b> ${r[1]}</li>${w.map(x => `<li>Wrong: ${x[0]} ${x[1]}</li>`).join("")}</ol>` }; };

/* contexts for means in the Nova SBE student data */
const MEAN_CTX = [
  { what: "daily study time", u: "h/day", mu: [3.5, 6], s: [1.2, 2.5], dp: 1 },
  { what: "weekly study time", u: "h/week", mu: [12, 20], s: [3.5, 6], dp: 1 },
  { what: "GPA (0–20 scale)", u: "points", mu: [13.5, 16], s: [1.5, 3], dp: 2 },
  { what: "sleep duration", u: "h/night", mu: [6.3, 7.6], s: [0.7, 1.3], dp: 2 },
  { what: "stress level (0–10 scale)", u: "points", mu: [4.5, 7], s: [1.4, 2.4], dp: 2 },
  { what: "class attendance", u: "%", mu: [72, 90], s: [8, 15], dp: 1 }
];
const PROP_CTX = [["study Solo", 0.25, 0.45], ["study in groups", 0.2, 0.4], ["do extracurricular activities", 0.3, 0.6], ["report high stress", 0.2, 0.45], ["sleep less than 7 hours", 0.35, 0.6], ["have a High GPA", 0.2, 0.4], ["attend every class", 0.4, 0.7]];
/* the dataset: proportions and subgroups */
const DPROPS = [{ i: 10, v: "Pass", lbl: "passed" }, { i: 4, v: "Yes", lbl: "have a part-time job" }, { i: 5, v: "High", lbl: "report high stress" }, { i: 3, v: "Solo", lbl: "study solo" }, { i: 2, v: "Female", lbl: "are female" }];
const dPropPick = () => { let pr, g, v, x;
  do { pr = pick(DPROPS); g = pick(GROUPS.filter(gg => gg.key === "all" || GCOND[gg.key][0] !== pr.i)); v = col(pr.i, g); x = v.filter(y => y === pr.v).length; }
  while (v.length < 20 || x < 5 || v.length - x < 5);
  return { pr, g, n: v.length, x, p: x / v.length }; };
const gFilterTxt = (g, colIdx, val) => { const L = LETTERS[colIdx];
  return g.key === "all" ? `=COUNTIF(${L}2:${L}61,"${val}")/60` : `=COUNTIFS(${L}2:${L}61,"${val}",${LETTERS[GCOND[g.key][0]]}2:${LETTERS[GCOND[g.key][0]]}61,"${GCOND[g.key][1]}")/COUNTIF(${LETTERS[GCOND[g.key][0]]}2:${LETTERS[GCOND[g.key][0]]}61,"${GCOND[g.key][1]}")`; };

/* ========================================================================= WEEK 2 */
const SAMPLE_BANK = [
  { q: "To estimate the mean study time of Nova SBE students, you ask the first 60 students you meet in the library at 10 pm.", a: "Biased: not every student has the same chance", why: "Students in the library late at night study more than average, so the sample overstates study time. That is systematic bias, and a larger sample would not fix it." },
  { q: "You draw 200 student numbers at random from the full list of enrolled students and survey those students.", a: "Random and representative", why: "Every student has the same chance of being chosen, so there is no systematic bias, and 200 is large enough for the CLT." },
  { q: "You post a poll about stress on the student union's Instagram page; 400 students choose to answer.", a: "Biased: not every student has the same chance", why: "Students choose themselves (self-selection). Very stressed or very relaxed students may be more likely to answer." },
  { q: "You pick 5 students at random from the student list to estimate the mean GPA of all students.", a: "Random, but too small to be precise", why: "The selection is random, so there is no bias, but with n = 5 the standard error σ / √5 is large and the estimate is imprecise." },
  { q: "You ask only the students of your own master's class about their sleep duration.", a: "Biased: not every student has the same chance", why: "One class is not representative of all students: same programme, same timetable, similar habits." },
  { q: "To study class attendance, you survey the students present at a Friday 8 am lecture.", a: "Biased: not every student has the same chance", why: "Students who skip class cannot be in the sample, so attendance is overstated." },
  { q: "A random number generator picks 150 of all enrolled students, and all of them answer.", a: "Random and representative", why: "Random selection from the whole population, with no non-response: a good sample." },
  { q: "You choose 4 students at random to estimate the share of students who study in groups.", a: "Random, but too small to be precise", why: "Random, so unbiased, but a proportion from 4 students can only be 0, 0.25, 0.5, 0.75 or 1: far too imprecise." }
].map(b => ({ ...b, w: ["Random and representative", "Biased: not every student has the same chance", "Random, but too small to be precise"].filter(x => x !== b.a) }));
const SAMPVAR_TF = [
  ["Two groups sample the same population and get mean GPAs of 14.8 and 15.6. One group must have made a mistake.", false, "Different samples give different means. That is sampling variability, and it is expected."],
  ["Sample means vary less from sample to sample when the sample size n is larger.", true, "The standard error σ / √n shrinks as n grows."],
  ["The Central Limit Theorem says that the population becomes normal when n is large.", false, "The population keeps its shape. The CLT is about the distribution of x̄."],
  ["Even if daily study hours are right-skewed, x̄ from samples of n = 50 is approximately normal.", true, "That is the CLT: for n ≥ 30 (rule of thumb) x̄ is approximately normal, whatever the population shape."],
  ["If the population is normal, x̄ is normal for any sample size.", true, "With a normal population, x̄ is exactly normal, even for small n."],
  ["The mean of the sampling distribution of x̄ equals μ.", true, "x̄ is unbiased: E[x̄] = μ."],
  ["A statistic such as x̄ is a fixed number that does not depend on which students were sampled.", false, "A statistic changes from sample to sample; the parameter μ is the fixed one."],
  ["A very large sample removes the bias of a non-random sample.", false, "Size reduces random error, not systematic bias. 2,000 library students still overstate study time."],
  ["An unbiased estimator gives exactly the parameter value in every sample.", false, "Unbiased means correct on average over many samples, not in every single sample."],
  ["Quadrupling the sample size halves the standard error of x̄.", true, "SE = σ / √n, and √4 = 2."]
];
const CI_TF = [
  ["A 95% CI for the mean sleep duration is [6.7 ; 7.3] h. There is a 95% probability that μ lies in this interval.", false, "μ is fixed; this interval either contains it or not. The 95% describes the method: 95% of intervals built this way contain μ."],
  ["A 95% CI for the mean sleep duration is [6.7 ; 7.3] h. So 95% of students sleep between 6.7 and 7.3 hours.", false, "The CI is about the mean μ, not about individual students."],
  ["If we repeated the sampling many times, about 95% of the 95% intervals would contain μ.", true, "That is exactly what the confidence level means."],
  ["A 99% CI is more precise than a 95% CI from the same data.", false, "It uses a bigger reliability factor, so it is wider and less precise."],
  ["Doubling the sample size makes the interval narrower.", true, "Width ∝ 1 / √n, so it shrinks by a factor 1 / √2 ≈ 0.71."],
  ["15.0 ± 0.2 is more precise than 15.0 ± 1.5.", true, "A smaller margin of error means a narrower, more precise interval."],
  ["More confidence comes at the cost of a wider interval.", true, "That is the trade-off between confidence and precision."],
  ["When σ is unknown and estimated by s, we use the t-distribution with n − 1 degrees of freedom.", true, "Estimating σ adds uncertainty; t has heavier tails to reflect it."],
  ["A larger sample standard deviation s gives a narrower interval.", false, "More variability means a larger SE and a wider interval."],
  ["The centre of a confidence interval for μ is the sample mean x̄.", true, "CI = x̄ ± margin of error, so x̄ is the midpoint."]
];
const WHICHCI_BANK = [
  { q: "A random sample of 40 students has mean sleep duration 6.9 h and sample SD 1.1 h. You want a CI for μ.", a: "x̄ ± t · s / √n, with df = n − 1", why: "σ is unknown and estimated by s, so the reliability factor comes from the t-table." },
  { q: "From years of records, the SD of GPA is known to be σ = 2.4. A sample of 50 students has x̄ = 15.1. You want a CI for μ.", a: "x̄ ± z · σ / √n", why: "σ is known, so the reliability factor comes from the z-table." },
  { q: "In a random sample of 250 students, 95 study Solo. You want a CI for the share of all students who study Solo.", a: "p ± z · √(p(1 − p) / n)", why: "It is a proportion, so it uses z with the standard error √(p(1 − p) / n)." },
  { q: "A sample of 12 students has mean weekly study time 15.3 h and s = 4.1 h. Study times are roughly normal. You want a CI for μ.", a: "x̄ ± t · s / √n, with df = n − 1", why: "σ is unknown and n is small; with a normal population the t interval is the right one (df = 11)." },
  { q: "Of 400 surveyed students, 168 do extracurricular activities. You want a 90% CI for π.", a: "p ± z · √(p(1 − p) / n)", why: "A share (proportion) always uses z." },
  { q: "The attendance rate of students is known to have σ = 9%. A random sample of 36 students has mean 84%. You want a 99% CI for μ.", a: "x̄ ± z · σ / √n", why: "σ is given as known, so z is used." }
].map(b => ({ ...b, w: ["x̄ ± z · σ / √n", "x̄ ± t · s / √n, with df = n − 1", "p ± z · √(p(1 − p) / n)"].filter(x => x !== b.a) }));
const CONFS = [0.90, 0.95, 0.99];
const ciBound = (lo, hi, low) => low ? lo : hi;

const WEEK2_PARTS = [
/* ------------------------------------------------------------- Part 1 */
{
  title: "Samples and sampling variability", table: "normal",
  intro: "We almost never observe the whole population. This part explains why a well-chosen sample is enough, why different samples give different answers, and why the Central Limit Theorem makes the sample mean predictable.",
  buildsOn: "parameters, statistics and the CLT from Week 1, Part 5",
  bridge: "x̄ varies predictably → build an interval around it",
  summary: [
    "<b>Parameters</b> (μ, σ, π) are fixed but unknown; <b>statistics</b> (x̄, s, p) are computed from a sample and change from sample to sample.",
    "A good sample is <b>random</b>, <b>representative</b> and <b>large enough</b>. Random selection avoids systematic bias; a large size does not fix bias.",
    "<b>Sampling variability</b> is normal: different samples give different x̄. It shrinks as n grows, because SE = σ / √n.",
    "<b>Central Limit Theorem</b>: for n ≥ 30 (rule of thumb), x̄ ≈ N(μ, σ²/n) whatever the population shape. For a normal population this holds for any n.",
    "x̄, s and p are <b>point estimators</b> of μ, σ and π. Good estimators are <b>unbiased</b> and <b>efficient</b> (small variance)."
  ],
  concepts: [
    { name: "Why we use samples", tag: "Basics",
      idea: `<p>The <b>population</b> is every unit we care about, for example all Nova SBE students. A <b>sample</b> is the part we actually observe. Surveying everybody is usually too expensive or too slow, so we use a sample and generalise.</p>
        <p>Values that describe the population are <b>parameters</b>: μ (mean), σ (standard deviation) and π (proportion). They are fixed but unknown. Values computed from the sample are <b>statistics</b>: x̄, s and p. They are known, but change with every new sample.</p>`,
      steps: `<p>A good sample is:</p><ol><li><b>Random</b>: every student has the same chance of being chosen. This avoids systematic bias.</li><li><b>Representative</b>: it looks like the population (programmes, years, habits).</li><li><b>Large enough</b>: so the estimate is precise.</li></ol>`,
      example: `<ul><li>Bad: asking 60 students in the library at 10 pm about their study time. Late-night library users study more than average, so the sample overstates μ.</li><li>Good: drawing 200 student numbers at random from the full student list.</li></ul>`,
      watch: `<p>A bigger sample does not cure bias. 2,000 library students still overstate study time. From now on the course writes <b>π</b> for a population proportion and <b>p</b> for a sample proportion (Week 1 wrote p and p̂).</p>`,
      keys: [["Parameter vs statistic", "μ, σ, π (population: fixed, unknown) · x̄, s, p (sample: vary)", ""]] },
    { name: "Sampling variability", tag: "Sampling",
      idea: `<p>Two groups sample the same population and get mean GPAs of 14.8 and 15.6. Nobody made a mistake: each random sample contains different students, so each gives a slightly different x̄. This is <b>sampling variability</b>. It is expected, and it shrinks as the sample gets bigger.</p>`,
      formula: `<div class="formula"><div class="fb">SE(x̄) = ${fr("σ", "√n")}</div><span class="fn">standard error: the typical distance between x̄ and μ · use s / √n when σ is unknown</span></div>`,
      steps: `<ol><li>Take σ (or s when σ is unknown).</li><li>Divide by √n.</li></ol>`,
      example: `<p>GPA has σ = 2.4 points.</p><ul><li>n = 16: SE = 2.4 / 4 = <b class="num">0.6</b></li><li>n = 64: SE = 2.4 / 8 = <b class="num">0.3</b></li></ul><p>Four times as many students halves the standard error.</p>`,
      watch: `<p>The SD σ describes single students; the SE describes the sample mean. Don't mix them up.</p>`,
      keys: [["Standard error of x̄", `SE = ${fr("σ", "√n")} (or ${fr("s", "√n")})`, "=STDEV.S(range)/SQRT(COUNT(range))"]] },
    { name: "Sampling distribution and the CLT", tag: "Theorem",
      idea: `<p>Imagine taking every possible sample of size n and computing x̄ each time. The distribution of all those x̄ values is the <b>sampling distribution</b> of x̄. Its mean is μ and its standard deviation is the standard error σ / √n.</p>
        <p>The <b>Central Limit Theorem</b> (CLT) adds its shape: for a large enough sample (rule of thumb <b>n ≥ 30</b>), x̄ is approximately <b>normal</b>, whatever the shape of the population. If the population is normal, x̄ is normal for any n. This is why the z and t methods in the next weeks work.</p>`,
      formula: `<div class="formula"><div class="fb">x̄ ≈ N(μ, σ²/n)</div></div> <div class="formula"><div class="fb">z = ${fr("x̄ − μ", "σ / √n")}</div></div>`,
      steps: `<ol><li>Check that the CLT applies: n ≥ 30 or a normal population.</li><li>Compute SE = σ / √n.</li><li>Standardise: z = (x̄ − μ) / SE, then use the z-table.</li></ol>`,
      example: `<p>Daily study time is right-skewed with μ = 4.5 h and σ = 2 h. For a random sample of n = 36 students, what is P(x̄ &gt; 5)?</p><ol><li>n = 36 ≥ 30, so x̄ is approximately normal.</li><li>SE = 2 / √36 = 0.333</li><li>z = (5 − 4.5) / 0.333 = 1.50</li><li>P(x̄ &gt; 5) = 1 − 0.9332 = <b class="num">0.0668</b></li></ol>`,
      watch: `<p>The CLT does <b>not</b> make the population normal. Study hours stay skewed; only the distribution of the sample means becomes bell-shaped.</p>`,
      widgets: ["clt"],
      keys: [["Central Limit Theorem", "x̄ ≈ N(μ, σ²/n) for n ≥ 30, whatever the population shape", ""], ["z for a sample mean", `z = ${fr("x̄ − μ", "σ / √n")}`, ""]] },
    { name: "Point estimators", tag: "Estimation",
      idea: `<p>A <b>point estimator</b> is a single number from the sample used as a best guess for a parameter: x̄ estimates μ, s estimates σ, p estimates π.</p>
        <p>A good estimator is <b>unbiased</b> (its sampling distribution is centred on the parameter) and <b>efficient</b> (small variance, so it is usually close). Its precision improves as n grows.</p>`,
      example: `<p>A sample of 25 students studies on average x̄ = 14.2 h/week. That is our point estimate of μ. But is μ 14.0? 15.5? The single number gives no idea of how far off it might be.</p>`,
      watch: `<p>A point estimate is almost never exactly right. The next part adds a margin of error to show how precise it is.</p>`,
      keys: [["Point estimators", "x̄ → μ · s → σ · p → π", "=AVERAGE(range) · =STDEV.S(range)"], ["Good estimator", "unbiased (centred on the parameter) · efficient (small variance)", ""]] }
  ],
  practice: [
    { key: "goodsample", label: "Good sample?", mode: "general", gen: mcGen(SAMPLE_BANK) },
    { key: "sampvar", label: "Sampling: true or false", mode: "general", gen: tfGen(SAMPVAR_TF) },
    { key: "se2", label: "Standard error and n", mode: "general", gen() {
      const c = pick(MEAN_CTX), sd = rr(c.s[0], c.s[1], 1), kind = pick(["se", "n", "factor"]), n = pick([16, 25, 36, 49, 64, 100]);
      if (kind === "factor") { const k = pick([2, 4, 9]), ans = 1 / Math.sqrt(k);
        return { q: `<p>A study of ${c.what} grows its sample from n = ${n} to n = ${n * k} students. By what factor is the standard error of x̄ multiplied? (3 decimals)</p>`, ans, dp: 3,
          steps: `<ol><li>SE = σ / √n, so SE is proportional to 1 / √n.</li><li>n is multiplied by ${k}, so SE is multiplied by 1 / √${k} = <b class="num">${f(ans, 3)}</b>${k === 4 ? ": it halves" : k === 2 ? ": about 0.71, not 0.5" : ""}.</li></ol>` }; }
      const se = sd / Math.sqrt(n);
      if (kind === "n") return { q: `<p>The SD of ${c.what} is σ = ${sd} ${c.u}. How many students must you sample so that the standard error of x̄ is ${f(se, 3)} ${c.u}?</p>`, ans: n, dp: 0,
        steps: `<ol><li>SE = σ / √n, so √n = σ / SE = ${sd} / ${f(se, 3)} = ${f(Math.sqrt(n), 2)}.</li><li>n = ${f(Math.sqrt(n), 2)}² = <b class="num">${n}</b> students.</li></ol>` };
      return { q: `<p>The SD of ${c.what} among Nova SBE students is σ = ${sd} ${c.u}. Find the standard error of x̄ for random samples of n = ${n} (3 decimals).</p>`, ans: se, dp: 3,
        steps: `<ol><li>SE = σ / √n = ${sd} / √${n} = ${sd} / ${g4(Math.sqrt(n))}</li><li>SE = <b class="num">${f(se, 3)}</b> ${c.u}</li></ol>`, excel: `=${sd}/SQRT(${n})` };
    } },
    { key: "clt2", label: "CLT: probability for x̄", mode: "general", gen() {
      const c = pick(MEAN_CTX), mu = rr(c.mu[0], c.mu[1], 1), sd = rr(c.s[0], c.s[1], 1), n = pick([36, 40, 49, 64, 100]), se = sd / Math.sqrt(n), up = Math.random() < 0.5;
      const x = +(mu + (up ? 1 : -1) * pick([0.5, 1, 1.25, 1.5, 2, 2.5]) * se).toFixed(2), z = +((x - mu) / se).toFixed(2), below = M.phi(z), ans = up ? 1 - below : below;
      return { q: `<p>The ${c.what} of Nova SBE students has μ = ${mu} ${c.u} and σ = ${sd} ${c.u}; its distribution is not normal. For a random sample of n = ${n} students, find <b>P(x̄ ${up ? "&gt;" : "&lt;"} ${x})</b> (4 decimals).</p>`, ans, dp: 4, alts: [up ? 1 - M.phi((x - mu) / se) : M.phi((x - mu) / se)],
        viz: { dist: "z", regions: up ? [[z, 9]] : [[-9, z]], marks: [{ x: z, label: `z = ${f(z, 2)}` }] },
        steps: `<ol><li>n = ${n} ≥ 30, so by the CLT x̄ ≈ N(${mu}, ${sd}² / ${n}) even though the population is not normal.</li><li>SE = ${sd} / √${n} = ${f(se, 4)}</li><li>z = (${x} − ${mu}) / ${f(se, 4)} = ${f(z, 2)}</li><li>Φ(${f(z, 2)}) = ${f(below, 4)}${up ? `, so P(x̄ &gt; ${x}) = 1 − ${f(below, 4)} = <b class="num">${f(ans, 4)}</b>` : ` = <b class="num">${f(ans, 4)}</b>`}</li></ol>` };
    } },
    { key: "dsample", label: "A random sample of students", mode: "data", gen() {
      const c = pick(NUMERIC.slice(0, 4)), idx = shuffle([...RAW.keys()]).slice(0, 8).sort((a, b) => a - b), v = idx.map(k => RAW[k][c.i]), ans = M.mean(v), mu = M.mean(col(c.i));
      return { q: `<p>You draw a random sample of 8 students: ${idx.map(k => RAW[k][0]).join(", ")}. Their <b>${c.name}</b> values are:</p>${valChips(v)}<p>Find the sample mean x̄ (2 decimals).</p>`, ans, dp: 2,
        steps: `<ol><li>Σx = ${g4(M.sum(v))}, n = 8</li><li>x̄ = ${g4(M.sum(v))} / 8 = <b class="num">${f(ans, 2)}</b></li><li>The mean of all 60 students is ${f(mu, 2)}. Your sample misses it by ${f(Math.abs(ans - mu), 2)} ${c.unit}: that is sampling variability. Press "Next question" and a new sample gives a different x̄.</li></ol>`, excel: "=AVERAGE(the 8 values)" };
    } }
  ]
},
/* ------------------------------------------------------------- Part 2 */
{
  title: "Confidence interval for a mean", table: "t-student",
  intro: "A confidence interval turns the point estimate into a range of plausible values for μ: estimate ± margin of error. It uses z when σ is known and t when σ is estimated by s.",
  buildsOn: "the standard error and the CLT (Part 1) and the z and t tables from Week 1",
  bridge: "Same recipe for a proportion",
  summary: [
    "CI = point estimate ± <b>margin of error</b>, and margin of error = <b>reliability factor</b> × standard error.",
    "σ known: x̄ ± z<sub>α/2</sub> · σ / √n. σ unknown (the usual case): x̄ ± t<sub>α/2, n−1</sub> · s / √n.",
    "Common z values: 90% → 1.645, 95% → 1.96, 99% → 2.576. In the course t-table, a 95% interval uses the column 0.975.",
    "The interval is wider with more confidence and more variability, and narrower with a larger n (width ∝ 1 / √n).",
    "“We are 95% confident that μ lies between …” means the <b>method</b> captures μ in 95% of repeated samples. It is not a probability about this one interval."
  ],
  concepts: [
    { name: "Point estimate ± margin of error", tag: "Interval",
      idea: `<p>A <b>confidence interval</b> (CI) gives a range of plausible values for a parameter and shows how uncertain the estimate is. Every CI in this course has the same structure.</p>`,
      formula: `<div class="formula"><div class="fb">CI = point estimate ± margin of error</div></div> <div class="formula"><div class="fb">margin of error = reliability factor × standard error</div><span class="fn">reliability factor = z<sub>α/2</sub> or t<sub>α/2, n−1</sub> · confidence level = 1 − α</span></div>`,
      steps: `<ol><li>Identify the parameter and the confidence level.</li><li>Check the assumptions: random sample; population normal or n large enough (CLT).</li><li>Decide z (σ known) or t (σ unknown, df = n − 1).</li><li>Find the reliability factor in the table.</li><li>Compute the standard error and the margin of error.</li><li>Build the interval and interpret it in context.</li></ol>`,
      example: `<p>Reading an interval backwards: a CI of [14.8 ; 15.6] has</p><ul><li>midpoint x̄ = (14.8 + 15.6) / 2 = <b class="num">15.2</b></li><li>margin of error = (15.6 − 14.8) / 2 = <b class="num">0.4</b> (half the width)</li></ul>`,
      watch: `<p>15.0 ± 0.2 is more precise than 15.0 ± 1.5: same estimate, much smaller margin of error.</p>`,
      keys: [["Confidence interval", "point estimate ± reliability factor × standard error", ""], ["From a CI back to its parts", "x̄ = (lower + upper) / 2 · margin of error = (upper − lower) / 2", ""]] },
    { name: "CI for μ when σ is known (z)", tag: "z",
      idea: `<p>If the population SD σ is known, x̄ is (approximately) normal with SE = σ / √n, and the reliability factor comes from the standard normal table.</p>`,
      formula: `<div class="formula"><div class="fb">x̄ ± z<sub>α/2</sub> · ${fr("σ", "√n")}</div></div>
        <div class="tablewrap"><table class="t"><thead><tr><th>Confidence</th><th>α</th><th>Area below z</th><th>z<sub>α/2</sub></th></tr></thead><tbody>
        <tr><td>90%</td><td class="m">0.10</td><td class="m">0.95</td><td class="m">1.645</td></tr><tr><td>95%</td><td class="m">0.05</td><td class="m">0.975</td><td class="m">1.96</td></tr><tr><td>99%</td><td class="m">0.01</td><td class="m">0.995</td><td class="m">2.576</td></tr></tbody></table></div>`,
      steps: `<ol><li>α = 1 − confidence level; each tail holds α / 2.</li><li>Look up the area below 1 − α / 2 in the z-table: that is z<sub>α/2</sub>.</li><li>SE = σ / √n; margin of error = z × SE.</li><li>Interval: x̄ − margin to x̄ + margin.</li></ol>`,
      example: `<p>Sleep duration has known σ = 0.9 h. A random sample of 36 students sleeps on average 6.8 h. 95% CI?</p><ol><li>z = 1.96</li><li>SE = 0.9 / √36 = 0.15; margin = 1.96 × 0.15 = 0.294</li><li>CI = [6.51 ; 7.09] hours</li></ol>`,
      watch: `<p>σ is rarely known in practice. If the problem only gives the sample SD s, use t (next concept).</p>`,
      widgets: ["zexplorer"],
      keys: [["CI for μ, σ known", `x̄ ± z<sub>α/2</sub> · ${fr("σ", "√n")}`, "=CONFIDENCE.NORM(alpha,sigma,n)"], ["Common z values", "90% → 1.645 · 95% → 1.96 · 99% → 2.576", "=NORM.S.INV(1-alpha/2)"]] },
    { name: "CI for μ when σ is unknown (t)", tag: "t",
      idea: `<p>Usually σ is unknown and we estimate it by s. That adds uncertainty, so the reliability factor comes from the <b>t-distribution</b> with <b>df = n − 1</b>, which has heavier tails than Z.</p>`,
      formula: `<div class="formula"><div class="fb">x̄ ± t<sub>α/2, n−1</sub> · ${fr("s", "√n")}</div></div>`,
      steps: `<ol><li>df = n − 1.</li><li>The course t-table gives areas <b>below</b> t, so a (1 − α) interval uses the column 1 − α / 2 (95% → 0.975).</li><li>SE = s / √n; margin = t × SE.</li><li>Build the interval and interpret it.</li></ol>`,
      example: `<p>A random sample of 25 students studies on average 14.2 h/week with s = 4.5. 95% CI?</p><ol><li>σ unknown → t, df = 24. t-table: row 24, column 0.975 → <b class="num">2.064</b></li><li>SE = 4.5 / √25 = 0.90; margin = 2.064 × 0.90 = 1.858</li><li>CI = [<b class="num">12.34</b> ; <b class="num">16.06</b>] hours/week</li></ol>
        <p>Interpretation: we are 95% confident that the mean weekly study time of all Nova SBE students is between 12.34 and 16.06 hours.</p>`,
      watch: `<p>For a 95% interval the column is 0.975, not 0.950: the 5% is split into two tails of 2.5%. Using 0.950 gives a 90% interval.</p>`,
      keys: [["CI for μ, σ unknown", `x̄ ± t<sub>α/2, n−1</sub> · ${fr("s", "√n")}`, "=CONFIDENCE.T(alpha,s,n)"]] },
    { name: "Reliability factor and degrees of freedom", tag: "Table",
      idea: `<p>Use <b>z</b> when σ is known (and for proportions). Use <b>t</b> when σ is unknown and estimated by s. The t-distribution depends on the <b>degrees of freedom</b> df = n − 1: the number of values that are free to vary once x̄ is fixed. As df grows, t gets closer to z.</p>`,
      steps: `<ol><li>Confidence level → α → column 1 − α / 2.</li><li>Row df = n − 1. If that df is not in the table, use the next smaller row.</li><li>Reverse use: find a t value in its row; the columns around it bracket the tail probability.</li></ol>`,
      example: `<ul><li>95%, n = 16 → df = 15 → column 0.975: t = <b class="num">2.131</b>.</li><li>95%, n = 100 → df = 99. The table jumps from 60 to 120, so use row 60: 2.000. Excel gives the exact 1.984, already close to z = 1.96.</li><li>Reverse: t = 2.35 with 10 df lies between 2.228 (column 0.975) and 2.764 (column 0.990). So the area above 2.35 is between 0.01 and 0.025 (exactly 0.020), and the two-tailed probability is about 0.041.</li></ul>`,
      watch: `<p>df is n − 1, not n. And check which way your table works: the course table is cumulative (area below t).</p>`,
      widgets: ["texplorer", "ttable"],
      keys: [["Reliability factor", "z<sub>α/2</sub> (σ known) · t<sub>α/2, n−1</sub> (σ unknown): course table column 1 − α/2", "=T.INV(1-alpha/2,n-1)"], ["Degrees of freedom", "df = n − 1", ""]] },
    { name: "Width of the interval", tag: "Precision",
      idea: `<p>The width of a CI is twice the margin of error. Three things drive it:</p><ul><li><b>Confidence level</b> up → bigger reliability factor → wider.</li><li><b>Variability</b> (σ or s) up → bigger SE → wider.</li><li><b>Sample size</b> n up → smaller SE → narrower. Width ∝ 1 / √n: doubling n multiplies the width by 1 / √2 ≈ 0.71; quadrupling n halves it.</li></ul>`,
      formula: `<div class="formula"><div class="fb">width = 2 × reliability factor × SE</div></div>`,
      example: `<p>The study-time sample (n = 25, s = 4.5, df = 24):</p><div class="tablewrap"><table class="t"><thead><tr><th>Confidence</th><th>t (column)</th><th>Width</th></tr></thead><tbody>
        <tr><td>90%</td><td class="m">1.711 (0.950)</td><td class="m">3.08 h</td></tr><tr><td>95%</td><td class="m">2.064 (0.975)</td><td class="m">3.72 h</td></tr><tr><td>99%</td><td class="m">2.797 (0.995)</td><td class="m">5.03 h</td></tr></tbody></table></div>
        <p>A CI from 200 students is narrower than one from 20, because each new student adds information and the average of many values wobbles less.</p>`,
      watch: `<p>The trade-off: more confidence means less precision. A 99% interval is not "better" than a 95% interval; it is wider.</p>`,
      keys: [["Width of a CI", "2 × reliability factor × SE · width ∝ 1 / √n", ""]] },
    { name: "Interpreting a confidence interval", tag: "Interpretation",
      idea: `<p>Correct: "We are 95% confident that the mean study time of all Nova SBE students lies between 4.2 and 5.6 hours per day." The 95% describes the <b>method</b>: if we took many samples and built an interval from each, about 95% of those intervals would contain μ.</p>`,
      example: `<p>A researcher reports a 95% CI for mean sleep duration of [6.7 ; 7.3] h.</p><ul><li>✓ We are 95% confident that μ lies between 6.7 and 7.3 h.</li><li>✗ There is a 95% probability that μ is in this interval. (μ is fixed; this interval either contains it or not.)</li><li>✗ 95% of students sleep between 6.7 and 7.3 h. (The CI is about the mean, not individual values.)</li></ul>`,
      watch: `<p>We can never be completely certain about a parameter from a sample: only a census would give μ exactly. An interval is more useful to decision-makers than one number, because it shows how far the estimate could be off.</p>`,
      keys: [["Interpreting a 95% CI", "“95% confident μ lies in [a ; b]”: 95% of such intervals contain μ", ""]] }
  ],
  practice: [
    { key: "rf", label: "Reliability factor", mode: "general", gen() {
      const conf = pick(CONFS), known = Math.random() < 0.3, col = 1 - (1 - conf) / 2;
      if (known) { const ans = M.invphi(col);
        return { q: `<p>σ is known. Find the reliability factor z<sub>α/2</sub> for a <b>${conf * 100}%</b> confidence interval (3 decimals).</p>`, ans, dp: 3, table: "normal",
          viz: { dist: "z", regions: [[-ans, ans]], marks: [{ x: -ans, label: `−${f(ans, 3)}` }, { x: ans, label: f(ans, 3) }] },
          steps: `<ol><li>α = 1 − ${conf} = ${g4(1 - conf)}; each tail holds ${g4((1 - conf) / 2)}.</li><li>Area below z = 1 − ${g4((1 - conf) / 2)} = ${g4(col)}.</li><li>${zLook(col)}</li></ol>`, excel: `=NORM.S.INV(${g4(col)})` }; }
      const n = pick([6, 8, 10, 12, 15, 16, 20, 21, 25, 26, 31, 41, 50, 61, 100]), df = n - 1, ans = M.tinv(col, df);
      return { q: `<p>A random sample of <b>n = ${n}</b> students; σ is unknown. Find the reliability factor for a <b>${conf * 100}%</b> confidence interval for μ (3 decimals).</p>`, ans, dp: 3, alts: [M.tinv(col, tRow(df))],
        viz: { dist: "t", df, overlay: true, regions: [[-ans, ans]], marks: [{ x: -ans, label: `−${f(ans, 3)}` }, { x: ans, label: f(ans, 3) }] },
        steps: `<ol><li>σ unknown → t with df = n − 1 = ${df}.</li><li>α = ${g4(1 - conf)}, so the column is 1 − α/2 = ${g4(col)}.</li><li>${tLook(col, df)}</li></ol>`, excel: `=T.INV(${g4(col)},${df})` };
    } },
    { key: "ciz", label: "CI for μ (σ known)", mode: "general", gen() {
      const c = pick(MEAN_CTX), conf = pick(CONFS), n = pick([25, 36, 49, 64, 81, 100]), sd = rr(c.s[0], c.s[1], 1), x = rr(c.mu[0], c.mu[1], c.dp), z = M.invphi(1 - (1 - conf) / 2), se = sd / Math.sqrt(n), me = z * se, low = Math.random() < 0.5;
      return { q: `<p>The ${c.what} of Nova SBE students has a known σ = ${sd} ${c.u}. A random sample of n = ${n} gives x̄ = ${x}. Find the <b>${low ? "lower" : "upper"} bound</b> of the ${conf * 100}% CI for μ (2 decimals).</p>`, ans: low ? x - me : x + me, dp: 2, table: "normal", alts: [low ? x - +z.toFixed(2) * se : x + +z.toFixed(2) * se],
        steps: `<ol><li>σ known → z. ${zLook(1 - (1 - conf) / 2)}</li><li>SE = ${sd} / √${n} = ${f(se, 4)}</li><li>Margin of error = ${z.toFixed(3)} × ${f(se, 4)} = ${f(me, 4)}</li><li>CI = ${x} ± ${f(me, 4)} = [${f(x - me, 2)} ; ${f(x + me, 2)}]. The ${low ? "lower" : "upper"} bound is <b class="num">${f(low ? x - me : x + me, 2)}</b>.</li></ol>`, excel: `=${x}${low ? "-" : "+"}CONFIDENCE.NORM(${g4(1 - conf)},${sd},${n})` };
    } },
    { key: "cit", label: "CI for μ (σ unknown)", mode: "general", gen() {
      const c = pick(MEAN_CTX), conf = pick(CONFS), n = pick([10, 12, 15, 16, 20, 25, 26, 30, 31, 40]), df = n - 1, col = 1 - (1 - conf) / 2, s = rr(c.s[0], c.s[1], 1), x = rr(c.mu[0], c.mu[1], c.dp);
      const t = M.tinv(col, df), tt = M.tinv(col, tRow(df)), se = s / Math.sqrt(n), me = t * se, low = Math.random() < 0.5;
      return { q: `<p>A random sample of n = ${n} Nova SBE students has a mean ${c.what} of x̄ = ${x} ${c.u} with s = ${s}. Find the <b>${low ? "lower" : "upper"} bound</b> of the ${conf * 100}% CI for μ (2 decimals).</p>`, ans: low ? x - me : x + me, dp: 2, alts: [low ? x - tt * se : x + tt * se],
        steps: `<ol><li>σ unknown → t, df = ${df}. Column 1 − α/2 = ${g4(col)}. ${tLook(col, df)}</li><li>SE = ${s} / √${n} = ${f(se, 4)}</li><li>Margin of error = ${t.toFixed(3)} × ${f(se, 4)} = ${f(me, 4)}</li><li>CI = ${x} ± ${f(me, 4)} = [${f(x - me, 2)} ; ${f(x + me, 2)}]. The ${low ? "lower" : "upper"} bound is <b class="num">${f(low ? x - me : x + me, 2)}</b>.</li></ol>`, excel: `=${x}${low ? "-" : "+"}CONFIDENCE.T(${g4(1 - conf)},${s},${n})` };
    } },
    { key: "me", label: "Margin of error", mode: "general", gen() {
      const c = pick(MEAN_CTX), conf = pick(CONFS), n = pick([9, 16, 25, 36, 50, 64]), df = n - 1, col = 1 - (1 - conf) / 2, s = rr(c.s[0], c.s[1], 1), t = M.tinv(col, df), se = s / Math.sqrt(n), ans = t * se;
      return { q: `<p>A random sample of n = ${n} students has s = ${s} ${c.u} for ${c.what}; σ is unknown. Find the <b>margin of error</b> of a ${conf * 100}% CI for μ (3 decimals).</p>`, ans, dp: 3, alts: [M.tinv(col, tRow(df)) * se],
        steps: `<ol><li>t with df = ${df}: ${tLook(col, df)}</li><li>SE = ${s} / √${n} = ${f(se, 4)}</li><li>Margin of error = ${t.toFixed(3)} × ${f(se, 4)} = <b class="num">${f(ans, 3)}</b></li></ol>`, excel: `=CONFIDENCE.T(${g4(1 - conf)},${s},${n})` };
    } },
    { key: "recover", label: "From a CI to x̄ and margin", mode: "general", gen() {
      const c = pick(MEAN_CTX), x = rr(c.mu[0], c.mu[1], 2), me = rr(c.s[0] * 0.15, c.s[0] * 0.6, 2), lo = +(x - me).toFixed(2), hi = +(x + me).toFixed(2), ask = pick(["mean", "me", "width"]);
      const ans = ask === "mean" ? (lo + hi) / 2 : ask === "me" ? (hi - lo) / 2 : hi - lo;
      return { q: `<p>A report gives a 95% CI for the mean ${c.what} of [${lo} ; ${hi}] ${c.u}. Find the <b>${ask === "mean" ? "sample mean x̄" : ask === "me" ? "margin of error" : "width of the interval"}</b> (3 decimals).</p>`, ans, dp: 3,
        steps: `<ol><li>The interval is x̄ ± margin, so x̄ is the midpoint and the margin is half the width.</li><li>${ask === "mean" ? `x̄ = (${lo} + ${hi}) / 2 = <b class="num">${f(ans, 3)}</b>` : ask === "me" ? `margin = (${hi} − ${lo}) / 2 = <b class="num">${f(ans, 3)}</b>` : `width = ${hi} − ${lo} = <b class="num">${f(ans, 3)}</b>`}</li></ol>` };
    } },
    { key: "width", label: "Width of the interval", mode: "general", gen() {
      const w = rr(1.2, 4, 2), kind = pick(["n", "conf"]);
      if (kind === "n") { const k = pick([2, 4, 9]), ans = w / Math.sqrt(k);
        return { q: `<p>A 95% CI for μ (σ known) has width ${w}. The sample size is multiplied by <b>${k}</b>; everything else stays the same. What is the new width? (3 decimals)</p>`, ans, dp: 3,
          steps: `<ol><li>Width = 2 · z · σ / √n, so width ∝ 1 / √n.</li><li>New width = ${w} / √${k} = ${w} / ${g4(Math.sqrt(k))} = <b class="num">${f(ans, 3)}</b></li></ol>` }; }
      const [c1, c2] = shuffle(CONFS).slice(0, 2), z1 = M.invphi(1 - (1 - c1) / 2), z2 = M.invphi(1 - (1 - c2) / 2), ans = w * z2 / z1;
      return { q: `<p>A ${c1 * 100}% CI for μ (σ known) has width ${w}. What would the width be at <b>${c2 * 100}%</b> confidence with the same data? (3 decimals)</p>`, ans, dp: 3, alts: [w * +z2.toFixed(2) / +z1.toFixed(2)], table: "normal",
        steps: `<ol><li>Width = 2 · z · σ / √n; only z changes.</li><li>z for ${c1 * 100}% = ${z1.toFixed(3)}, for ${c2 * 100}% = ${z2.toFixed(3)}.</li><li>New width = ${w} × ${z2.toFixed(3)} / ${z1.toFixed(3)} = <b class="num">${f(ans, 3)}</b>. ${c2 > c1 ? "More confidence, wider interval." : "Less confidence, narrower interval."}</li></ol>` };
    } },
    { key: "trev", label: "Reverse use of the t-table", mode: "general", gen() {
      const A = [0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.975, 0.99, 0.995, 0.999], df = ri(5, 30), k = ri(3, A.length - 2), lo = M.tinv(A[k], df), hi = M.tinv(A[k + 1], df), t = +(lo + (0.25 + Math.random() * 0.5) * (hi - lo)).toFixed(2);
      const rng = i => `between ${g4(+(1 - A[i + 1]).toFixed(3))} and ${g4(+(1 - A[i]).toFixed(3))}`, ans = rng(k), others = [k - 2, k - 1, k + 1].filter(i => i >= 0 && i < A.length - 1).map(rng);
      return { q: `<p>A t statistic of <b>t = ${t}</b> has <b>${df}</b> degrees of freedom. Using the course t-table, the area <b>above</b> t lies…</p>`, ans, choices: [ans, ...others].sort((a, b) => parseFloat(b.slice(8)) - parseFloat(a.slice(8))),
        viz: { dist: "t", df, overlay: true, regions: [[t, 99]], marks: [{ x: t, label: `t = ${t}` }] },
        steps: `<ol><li>Row df = ${df}: ${lo.toFixed(3)} (column ${f(A[k], 3)}) &lt; ${t} &lt; ${hi.toFixed(3)} (column ${f(A[k + 1], 3)}).</li><li>So the area below t is between ${f(A[k], 3)} and ${f(A[k + 1], 3)}, and the area above is <b>${ans}</b> (exactly ${f(1 - M.tcdf(t, df), 4)}).</li><li>For a two-tailed question, double it: between ${g4(+(2 * (1 - A[k + 1])).toFixed(3))} and ${g4(+(2 * (1 - A[k])).toFixed(3))}.</li></ol>`, excel: `=T.DIST.RT(${t},${df})` };
    } },
    { key: "ciint", label: "Interpreting a CI", mode: "general", gen: tfGen(CI_TF) },
    { key: "dci", label: "CI for a mean in the dataset", mode: "data", gen() {
      let c, g, v; do { c = pick(NUMERIC.slice(0, 4)); g = pick(GROUPS); v = col(c.i, g); } while (v.length < 10);
      const conf = pick(CONFS), n = v.length, df = n - 1, col1 = 1 - (1 - conf) / 2, x = M.mean(v), s = M.sdS(v), se = s / Math.sqrt(n), t = M.tinv(col1, df), me = t * se, low = Math.random() < 0.5, L = LETTERS[c.i];
      return { q: `<p>Treat the <b>${g.label.toLowerCase()}</b> as a random sample. Find the <b>${low ? "lower" : "upper"} bound</b> of the ${conf * 100}% CI for the mean <b>${c.name}</b> (2 decimals).</p>`, ans: low ? x - me : x + me, dp: 2, alts: [low ? x - M.tinv(col1, tRow(df)) * se : x + M.tinv(col1, tRow(df)) * se],
        steps: `<ol><li>n = ${n}, x̄ = ${f(x, 4)}, s = ${f(s, 4)}</li><li>σ unknown → t, df = ${df}. ${tLook(col1, df)}</li><li>SE = ${f(s, 4)} / √${n} = ${f(se, 4)}; margin = ${t.toFixed(3)} × ${f(se, 4)} = ${f(me, 4)}</li><li>CI = [${f(x - me, 2)} ; ${f(x + me, 2)}] ${c.unit}. The ${low ? "lower" : "upper"} bound is <b class="num">${f(low ? x - me : x + me, 2)}</b>.</li></ol>`,
        excel: g.key === "all" ? `=AVERAGE(${L}2:${L}61)${low ? "-" : "+"}CONFIDENCE.T(${g4(1 - conf)},STDEV.S(${L}2:${L}61),60)` : "Filter the rows first, then =AVERAGE(…) ± CONFIDENCE.T(alpha,STDEV.S(…),n)" };
    } }
  ]
},
/* ------------------------------------------------------------- Part 3 */
{
  title: "Confidence interval for a proportion", table: "normal",
  intro: "Many questions are about shares: what fraction of students study Solo, or work part-time? The same recipe, estimate ± margin of error, works for a population proportion π.",
  buildsOn: "the CI recipe from Part 2 and the z-table",
  summary: [
    "The sample proportion p = x / n estimates π. Its standard error is √(p(1 − p) / n).",
    "CI for π: p ± z<sub>α/2</sub> · √(p(1 − p) / n). Proportions always use <b>z</b>, never t.",
    "Rule of thumb for the normal approximation: at least 5 successes and 5 failures (np ≥ 5 and n(1 − p) ≥ 5).",
    "Choose the interval by what you estimate: a mean with σ known → z; a mean with σ unknown → t (df = n − 1); a proportion → z."
  ],
  concepts: [
    { name: "Sample proportion and its standard error", tag: "Proportion",
      idea: `<p>For a yes/no variable (studies Solo or not), the parameter is the population proportion <b>π</b>. Its point estimate is the sample proportion <b>p</b>: the number of "yes" answers divided by n. By the CLT, p is approximately normal for large n.</p>`,
      formula: `<div class="formula"><div class="fb">p = ${fr("x", "n")}</div><span class="fn">x = number of successes</span></div> <div class="formula"><div class="fb">SE(p) = √${fr("p(1 − p)", "n")}</div></div>`,
      steps: `<ol><li>p = x / n.</li><li>Check: n·p ≥ 5 and n·(1 − p) ≥ 5 (a common rule of thumb).</li><li>SE = √(p(1 − p) / n).</li></ol>`,
      example: `<p>120 of 300 sampled students study Solo: p = 120 / 300 = 0.40, SE = √(0.4 × 0.6 / 300) = <b class="num">0.0283</b>.</p>`,
      watch: `<p>Write proportions as decimals in the formula: 0.40, not 40.</p>`,
      keys: [["Sample proportion", `p = ${fr("x", "n")}`, "=COUNTIF(range,\"Yes\")/COUNTA(range)"], ["Standard error of p", `√${fr("p(1 − p)", "n")}`, ""]] },
    { name: "CI for a proportion π", tag: "Proportion",
      idea: `<p>Same structure as before: point estimate ± reliability factor × SE. For a proportion the reliability factor is always a z value.</p>`,
      formula: `<div class="formula"><div class="fb">p ± z<sub>α/2</sub> · √${fr("p(1 − p)", "n")}</div></div>`,
      steps: `<ol><li>Compute p and SE.</li><li>Find z<sub>α/2</sub> (1.645, 1.96 or 2.576).</li><li>Margin = z × SE; build the interval.</li><li>Interpret in context.</li></ol>`,
      example: `<p>120 of 300 students study Solo. 95% CI for π?</p><ol><li>p = 0.40; SE = 0.0283</li><li>Margin = 1.96 × 0.0283 = 0.0554</li><li>CI = [<b class="num">0.345</b> ; <b class="num">0.455</b>]</li></ol><p>We are 95% confident that between 34.5% and 45.5% of all Nova SBE students study Solo.</p>`,
      watch: `<p>No t-distribution here, even for moderate n: there is no separate σ to estimate, because SE depends only on p.</p>`,
      keys: [["CI for π", `p ± z<sub>α/2</sub> · √${fr("p(1 − p)", "n")}`, ""]] },
    { name: "Choosing the right interval", tag: "Method",
      idea: `<p>Ask two questions: am I estimating a mean or a proportion? And for a mean: is σ known?</p>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th>Situation</th><th>Interval</th><th>Table</th></tr></thead><tbody>
        <tr><td>Mean, σ known</td><td>x̄ ± z · σ / √n</td><td>Z</td></tr>
        <tr><td>Mean, σ unknown</td><td>x̄ ± t · s / √n</td><td>t, df = n − 1</td></tr>
        <tr><td>Proportion</td><td>p ± z · √(p(1 − p) / n)</td><td>Z</td></tr></tbody></table></div>`,
      watch: `<p>"The sample SD is 1.1" means s, so t. "The SD is known to be 1.1" or "from past records σ = 1.1" means z.</p>`,
      keys: [["Which interval?", "mean, σ known → z · mean, σ unknown → t (df = n − 1) · proportion → z", ""]] }
  ],
  practice: [
    { key: "sep", label: "Standard error of p", mode: "general", gen() {
      const [what, a, b] = pick(PROP_CTX), n = pick([100, 150, 200, 250, 300, 400, 500]), x = Math.round(n * rr(a, b, 2)), p = x / n, ans = Math.sqrt(p * (1 - p) / n);
      return { q: `<p>In a random sample of ${n} students, ${x} ${what}. Find the standard error of the sample proportion (4 decimals).</p>`, ans, dp: 4,
        steps: `<ol><li>p = ${x} / ${n} = ${g4(p)}</li><li>SE = √(${g4(p)} × ${g4(1 - p)} / ${n}) = <b class="num">${f(ans, 4)}</b></li></ol>` };
    } },
    { key: "cip", label: "CI for π", mode: "general", gen() {
      const [what, a, b] = pick(PROP_CTX), n = pick([100, 150, 200, 250, 300, 400, 500]), x = Math.round(n * rr(a, b, 2)), p = x / n, conf = pick(CONFS), z = M.invphi(1 - (1 - conf) / 2), se = Math.sqrt(p * (1 - p) / n), me = z * se, ask = pick(["lower", "upper", "margin"]);
      const ans = ask === "lower" ? p - me : ask === "upper" ? p + me : me;
      return { q: `<p>In a random sample of ${n} Nova SBE students, ${x} ${what}. Find the <b>${ask === "margin" ? "margin of error" : ask + " bound"}</b> of the ${conf * 100}% CI for the population proportion π (3 decimals).</p>`, ans, dp: 3,
        steps: `<ol><li>p = ${x} / ${n} = ${g4(p)}; check n·p = ${x} ≥ 5 and n·(1 − p) = ${n - x} ≥ 5.</li><li>SE = √(${g4(p)} × ${g4(1 - p)} / ${n}) = ${f(se, 4)}</li><li>${zLook(1 - (1 - conf) / 2)}</li><li>Margin = ${z.toFixed(3)} × ${f(se, 4)} = ${f(me, 4)}</li><li>CI = [${f(p - me, 3)} ; ${f(p + me, 3)}]. ${ask === "margin" ? "Margin of error" : `The ${ask} bound`}: <b class="num">${f(ans, 3)}</b></li></ol>` };
    } },
    { key: "whichci", label: "Which interval?", mode: "general", gen: mcGen(WHICHCI_BANK) },
    { key: "dcip", label: "CI for a proportion in the dataset", mode: "data", gen() {
      const { pr, g, n, x, p } = dPropPick(), conf = pick(CONFS), z = M.invphi(1 - (1 - conf) / 2), se = Math.sqrt(p * (1 - p) / n), me = z * se, low = Math.random() < 0.5;
      return { q: `<p>Treat the <b>${g.label.toLowerCase()}</b> as a random sample. Find the <b>${low ? "lower" : "upper"} bound</b> of the ${conf * 100}% CI for the proportion who <b>${pr.lbl}</b> (${COLS[pr.i]} = ${pr.v}) (3 decimals).</p>`, ans: low ? p - me : p + me, dp: 3,
        steps: `<ol><li>n = ${n}, x = ${x} ${pr.lbl}, so p = ${x} / ${n} = ${f(p, 4)}.</li><li>SE = √(${f(p, 4)} × ${f(1 - p, 4)} / ${n}) = ${f(se, 4)}</li><li>z = ${z.toFixed(3)}; margin = ${f(me, 4)}</li><li>CI = [${f(p - me, 3)} ; ${f(p + me, 3)}]. The ${low ? "lower" : "upper"} bound is <b class="num">${f(low ? p - me : p + me, 3)}</b>.</li></ol>`, excel: `p: ${gFilterTxt(g, pr.i, pr.v)}` };
    } }
  ]
}
];

/* ========================================================================= WEEK 3 */
const CLAIMS = [
  ["An administrator claims students study 5 h/day on average. You want to check whether this is wrong.", "μ", "5", "two"],
  ["A researcher believes the mean GPA of Nova SBE students is no longer 15.", "μ", "15", "two"],
  ["The student union suspects that students sleep less than 7 hours a night on average.", "μ", "7", "left"],
  ["A tutor believes Group studiers have a mean GPA above 14.", "μ", "14", "right"],
  ["The school claims at least 80% of students attend class regularly; you suspect fewer do.", "π", "0.80", "left"],
  ["You want to test whether the share of students who study Solo differs from 50%.", "π", "0.50", "two"],
  ["A coach believes more than 30% of students do extracurricular activities.", "π", "0.30", "right"],
  ["The library says students study 20 hours per week on average; you think it is more.", "μ", "20", "right"],
  ["Last year the mean stress level was 6 (0–10 scale). You want to know whether it has changed.", "μ", "6", "two"],
  ["A professor suspects that students need less than 90 minutes on average for the mock exam.", "μ", "90", "left"],
  ["A study adviser claims that no more than 25% of students report high stress; you think it is higher.", "π", "0.25", "right"]
];
const DCLAIMS = [
  ["Is the mean FinalGrade of all students different from 70 points?", "μ", "70", "two"],
  ["Do students with a part-time job study less than 10 hours per week on average?", "μ", "10", "left"],
  ["Do students sleep more than 6.5 hours per night on average?", "μ", "6.5", "right"],
  ["Is the share of students who pass higher than 75%?", "π", "0.75", "right"],
  ["Is the mean attendance different from 80%?", "μ", "80", "two"],
  ["Is the share of students with a part-time job below 50%?", "π", "0.50", "left"],
  ["Do Solo studiers have a mean FinalGrade below 65 points?", "μ", "65", "left"]
];
const hypChoices = (par, v, t) => [hyp(par, v, t), ...["two", "right", "left"].filter(x => x !== t).map(x => hyp(par, v, x)), `H₀: ${par === "μ" ? "x̄" : "p"} = ${v} · H₁: ${par === "μ" ? "x̄" : "p"} ${TAIL[t].h1} ${v}`];
const hypWhy = t => t === "two" ? "“Different from / changed / no longer” gives H₁ with ≠: a two-tailed test." : t === "right" ? "“More than / above / higher” gives H₁ with &gt;: a right-tailed test. H₀ takes the rest, with the equality (≤)." : "“Less than / below / fewer” gives H₁ with &lt;: a left-tailed test. H₀ takes the rest, with the equality (≥).";
const hypGen = (bank, lead) => () => { const [c, par, v, t] = pick(bank), ans = hyp(par, v, t);
  return { q: `<p>${lead}</p><div class="vcard"><span class="vn">${c}</span></div><p>Which hypotheses fit?</p>`, ans, choices: shuffle(hypChoices(par, v, t)),
    steps: `<ol><li>Hypotheses are about the parameter (${par}), never about the sample value.</li><li>${hypWhy(t)}</li><li>Answer: <b>${ans}</b></li></ol>` }; };
const ERR_CTX = [
  ["H₀: μ = 5 h of daily study", "the true mean is 5 h", "the true mean is 6 h"],
  ["H₀: μ = 15 (mean GPA)", "the mean GPA really is 15", "the mean GPA is actually 15.8"],
  ["H₀: π = 0.5 (share of Solo studiers)", "exactly half of all students study Solo", "only 40% of students study Solo"],
  ["H₀: μ ≥ 7 h of sleep", "students sleep 7.2 h on average", "students sleep 6.5 h on average"]
];
const TEST_TF = [
  ["α is the probability of rejecting H₀ when H₀ is true.", true, "α is the maximum accepted probability of a Type I error."],
  ["Choosing a smaller α makes it easier to reject H₀.", false, "A smaller α makes the rejection region smaller, so it is harder to reject."],
  ["A smaller α increases the risk of a Type II error.", true, "Harder to reject means a false H₀ is missed more often."],
  ["Power is the probability of rejecting H₀ when H₀ is false.", true, "Power = 1 − β."],
  ["Power increases with a larger sample size.", true, "A larger n gives a smaller SE, so a true difference is easier to detect."],
  ["If we fail to reject H₀, we have proven that H₀ is true.", false, "Absence of evidence is not evidence of absence: the sample may be too small to detect a difference."],
  ["A good test makes both error probabilities zero.", false, "Errors can never be fully eliminated, only balanced and reduced with more data."],
  ["H₀ always contains the equality (=, ≤ or ≥).", true, "H₀ is the status quo with the equality; H₁ uses ≠, &lt; or &gt;."],
  ["The hypotheses are statements about the sample mean x̄.", false, "They are about the population parameter μ (or π). x̄ is known; there is nothing to test about it."],
  ["A Type II error means failing to reject a false H₀.", true, "That is the definition; its probability is β."],
  ["If x̄ differs from μ₀, H₀ is false.", false, "x̄ always differs a little from μ₀ because of sampling variability. The test asks whether the difference is too large to be chance."]
];
const P3_RIGHT = [["The result is statistically significant at the 5% level.", "0.02 ≤ 0.05, so H₀ is rejected at α = 0.05."], ["The observed data would be relatively unusual if H₀ were true.", "That is what a small p-value means."]];
const P3_WRONG = [["There is a 2% probability that H₀ is true.", "The p-value is computed assuming H₀ is true; it is not the probability of H₀."], ["The sample definitely came from a different population.", "A test never gives certainty; there is still a chance of a Type I error."],
  ["The result is significant at the 1% level.", "0.02 &gt; 0.01, so at α = 0.01 we fail to reject H₀."], ["The difference must be large and important.", "Statistical significance does not mean practical importance; with a large n tiny differences become significant."],
  ["There is a 98% probability that H₁ is true.", "The p-value says nothing directly about the probability of H₁."]];
/* a random one-sample test for μ (z or t) that stays clear of the critical value */
const meanTest = (forceT) => {
  for (;;) {
    const c = pick(MEAN_CTX), tail = pick(["two", "right", "left"]), a = pick([0.10, 0.05, 0.05, 0.01]), known = !forceT && Math.random() < 0.3;
    const n = known ? pick([25, 36, 49, 64, 100]) : pick([10, 12, 15, 16, 20, 25, 30, 40, 50]), mu0 = rr(c.mu[0], c.mu[1], c.dp === 2 ? 1 : 0), sd = rr(c.s[0], c.s[1], 1), se = sd / Math.sqrt(n);
    const dir = tail === "two" ? pick([1, -1]) : tail === "right" ? 1 : -1, x = +(mu0 + dir * rr(0.3, 3, 2) * se).toFixed(2), stat = (x - mu0) / se;
    const df = n - 1, cdf = known ? M.phi : v => M.tcdf(v, df), col = critCol(a, tail), cx = known ? M.invphi(col) : M.tinv(col, df), ct = known ? cx : M.tinv(col, tRow(df));
    if (!clear(stat, [cx, ct])) continue;
    return { c, tail, a, known, n, mu0, sd, se, x, stat, df, col, crit: cx, critT: ct, p: pOf(stat, tail, cdf), sym: known ? "z" : "t" };
  }
};
const meanTestQ = T => `<p>${hyp("μ", T.mu0, T.tail)}, about the ${T.c.what} of Nova SBE students. A random sample of n = ${T.n} gives x̄ = ${T.x} ${T.c.u}; ${T.known ? `σ = ${T.sd} is known` : `s = ${T.sd}`}. α = ${T.a}.</p>`;
const critLook = T => T.known ? zLook(T.col) : tLook(T.col, T.df);

const WEEK3_PARTS = [
/* ------------------------------------------------------------- Part 1 */
{
  title: "The logic of hypothesis testing", table: "normal",
  intro: "Does the sample support or contradict a claim about the population? Before any formula, this part sets up the hypotheses, the significance level and the two ways a decision can go wrong.",
  buildsOn: "sampling distributions and confidence intervals (Week 2)",
  bridge: "Put the logic to work for a mean",
  summary: [
    "<b>H₀</b> is the status quo and always contains the equality (=, ≤, ≥). <b>H₁</b> is what we look for evidence of (≠, &lt;, &gt;).",
    "“Differs / changed / no longer” → two-tailed. “More than” → right-tailed. “Less than” → left-tailed.",
    "Assume H₀ is true and ask how unusual the sample would be. If it is very unusual, reject H₀.",
    "<b>α</b> = the maximum accepted probability of a <b>Type I error</b> (rejecting a true H₀). A <b>Type II error</b> is failing to reject a false H₀ (probability β). <b>Power</b> = 1 − β grows with n.",
    "We <b>fail to reject</b> H₀; we never “accept” it."
  ],
  concepts: [
    { name: "Null and alternative hypotheses", tag: "Hypotheses",
      idea: `<p>A <b>statistical hypothesis</b> is a claim about a population parameter. The <b>null hypothesis H₀</b> is the status quo, the claim being tested; it always contains the equality (=, ≤ or ≥). The <b>alternative hypothesis H₁</b> is what we look for evidence of (≠, &lt; or &gt;).</p>`,
      steps: `<ol><li>Find the parameter: a mean μ or a proportion π.</li><li>Find the number in the claim: μ₀ or π₀.</li><li>Put the direction you want evidence for into H₁; H₀ gets the rest, including the equality.</li></ol>`,
      example: `<ul><li>An administrator claims students study 5 h/day. The claim with "=" goes into H₀: <b>H₀: μ = 5, H₁: μ ≠ 5</b>. Evidence against it: a sample mean far from 5.</li><li>A researcher believes mean GPA is "no longer 15": <b>H₀: μ = 15, H₁: μ ≠ 15</b>.</li></ul>`,
      watch: `<p>Hypotheses are always about the parameter (μ, π), never about x̄ or p. We already know x̄; the question is what it says about μ.</p>`,
      keys: [["Hypotheses", "H₀: status quo, contains = (or ≤, ≥) · H₁: ≠, < or >", ""]] },
    { name: "One- or two-tailed?", tag: "Hypotheses",
      idea: `<p>The words of the question decide where the rejection region sits.</p>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th>Words in the question</th><th>H₀</th><th>H₁</th><th>Test</th></tr></thead><tbody>
        <tr><td>differs from, has changed, is no longer</td><td>μ = μ₀</td><td>μ ≠ μ₀</td><td>two-tailed</td></tr>
        <tr><td>more than, above, increased</td><td>μ ≤ μ₀</td><td>μ &gt; μ₀</td><td>right-tailed</td></tr>
        <tr><td>less than, below, decreased</td><td>μ ≥ μ₀</td><td>μ &lt; μ₀</td><td>left-tailed</td></tr></tbody></table></div>
        <p>"The union suspects students sleep less than 7 h": H₀: μ ≥ 7, H₁: μ &lt; 7, left-tailed.</p>`,
      watch: `<p>"At least 80%" is the claim (H₀: π ≥ 0.80). If you suspect fewer, H₁: π &lt; 0.80. The sign of H₁ points to the tail.</p>`,
      keys: [["Tails", "H₁: ≠ → two-tailed · > → right-tailed · < → left-tailed", ""]] },
    { name: "The logic of a test", tag: "Logic",
      idea: `<p>A sample mean always differs a little from μ₀, just because of sampling variability. So "x̄ = 15.8 is not 15" proves nothing yet. The test asks: <b>if H₀ were true, how unusual would a sample like ours be?</b> The answer depends on the size of the difference, the variability and n. If the result would be very unusual under H₀, we reject H₀.</p>`,
      steps: `<ol><li>Formulate H₀ and H₁ (decide the tails).</li><li>Choose α.</li><li>Check the assumptions and choose z or t.</li><li>Compute the test statistic.</li><li>Find the critical value(s) and/or the p-value.</li><li>State the decision rule and decide.</li><li>Write the conclusion in context, in plain language.</li></ol>`,
      example: `<p>n = 40, x̄ = 15.8, μ₀ = 15: a difference of 0.8 points. With s = 2.4, the SE is 2.4 / √40 = 0.38, so x̄ is 2.1 standard errors above 15. Under H₀ that happens rarely, which is evidence against H₀. With n = 10 the SE is 0.76 and the same 0.8 is only about 1 SE: entirely plausible by chance.</p>`,
      watch: `<p>The same seven steps return in every test of the course (ANOVA, χ², regression). Only the statistic and the table change.</p>`,
      keys: [["Testing procedure", "H₀/H₁ → α → assumptions → statistic → critical value / p-value → decision rule → conclusion", ""]] },
    { name: "Significance level α", tag: "Decision",
      idea: `<p>The <b>significance level α</b> is the maximum probability we accept of rejecting H₀ when it is actually true. Common values: 0.10, 0.05, 0.01. α sets the size of the <b>rejection region</b>: the values of the statistic so extreme that we reject H₀.</p>`,
      steps: `<ul><li>Two-tailed: α is split, α / 2 in each tail.</li><li>One-tailed: all of α sits in one tail.</li><li>Smaller α → smaller rejection region → harder to reject → fewer Type I errors but more Type II errors.</li></ul>`,
      example: `<p>α = 0.05 means: if H₀ is true, we wrongly reject it in at most 5% of samples. Going from 5% to 1% moves the two-tailed z critical value from 1.96 to 2.576, so a result that was significant can become non-significant.</p>`,
      watch: `<p>Choose α before looking at the data. Changing it afterwards to get the result you want is not allowed.</p>`,
      keys: [["Significance level", "α = P(reject H₀ | H₀ true) · two-tailed: α/2 per tail", ""]] },
    { name: "Type I and Type II errors", tag: "Errors",
      idea: `<p>A test decides on a sample, so it can be wrong in two ways.</p>`,
      formula: `<div class="tablewrap"><table class="t"><thead><tr><th>Decision</th><th>H₀ is true</th><th>H₀ is false</th></tr></thead><tbody>
        <tr><td>Reject H₀</td><td><b>Type I error</b> (probability α)</td><td>Correct (power = 1 − β)</td></tr>
        <tr><td>Fail to reject H₀</td><td>Correct</td><td><b>Type II error</b> (probability β)</td></tr></tbody></table></div>`,
      example: `<p>H₀: students study μ = 5 h/day.</p><ul><li>The true mean is 5 h but the test rejects H₀: <b>Type I error</b>. Its probability is α.</li><li>The true mean is 6 h but the test fails to reject H₀: <b>Type II error</b>. It becomes less likely with a larger n, because the SE shrinks.</li></ul>`,
      watch: `<p>Errors can never be fully eliminated. Lowering α raises β; only more data (a larger n) lowers both.</p>`,
      keys: [["Type I error", "reject a true H₀ · probability α", ""], ["Type II error and power", "fail to reject a false H₀ · probability β · power = 1 − β", ""]] },
    { name: "Fail to reject is not accept", tag: "Interpretation",
      idea: `<p>If the evidence is not strong enough, we <b>fail to reject H₀</b>. That does not prove H₀ is true: the true mean might differ a little, and our sample was too small to show it. Absence of evidence is not evidence of absence.</p>`,
      example: `<p>n = 10, x̄ = 15.8, μ₀ = 15 → fail to reject. Correct: "There is not enough evidence that the mean GPA differs from 15." Wrong: "The mean GPA is 15."</p>`,
      watch: `<p>In the exam always write "reject H₀" or "fail to reject H₀", never "accept H₀".</p>`,
      keys: [["Wording", "“reject H₀” or “fail to reject H₀”, never “accept H₀”", ""]] }
  ],
  practice: [
    { key: "hyp", label: "Formulate H₀ and H₁", mode: "general", gen: hypGen(CLAIMS, "A claim from the student data:") },
    { key: "tail", label: "Which tail?", mode: "general", gen() {
      const [c, par, v, t] = pick(CLAIMS);
      return { q: `<p>Which test fits this question?</p><div class="vcard"><span class="vn">${c}</span></div>`, ans: TAIL[t].name + " test", choices: ["Two-tailed test", "Right-tailed test", "Left-tailed test"],
        steps: `<ol><li>${hypWhy(t)}</li><li>Hypotheses: ${hyp(par, v, t)}.</li><li>Answer: <b>${TAIL[t].name} test</b>.</li></ol>` };
    } },
    { key: "err", label: "Type I or Type II?", mode: "general", gen() {
      const [h, truth, alt] = pick(ERR_CTX), h0true = Math.random() < 0.5, rej = Math.random() < 0.5;
      const ans = h0true && rej ? "Type I error" : !h0true && !rej ? "Type II error" : "Correct decision";
      return { q: `<p>${h}. In reality <b>${h0true ? truth : alt}</b>, and your test <b>${rej ? "rejects H₀" : "fails to reject H₀"}</b>. What happened?</p>`, ans, choices: ["Type I error", "Type II error", "Correct decision"],
        steps: `<ol><li>H₀ is ${h0true ? "true" : "false"} in reality; the test ${rej ? "rejects" : "does not reject"} it.</li><li>${ans === "Type I error" ? "Rejecting a true H₀ is a Type I error; its probability is α." : ans === "Type II error" ? "Failing to reject a false H₀ is a Type II error; its probability β falls as n grows." : "The decision matches reality."}</li><li>Answer: <b>${ans}</b>.</li></ol>` };
    } },
    { key: "testtf", label: "α, errors and power", mode: "general", gen: tfGen(TEST_TF) },
    { key: "dhyp", label: "Hypotheses for the dataset", mode: "data", gen: hypGen(DCLAIMS, "A question about Data.xlsx:") }
  ]
},
/* ------------------------------------------------------------- Part 2 */
{
  title: "Testing a mean", table: "t-student",
  intro: "The full procedure for μ: a z test when σ is known and a t test when σ is estimated by s. The critical value approach and the p-value approach always lead to the same decision.",
  buildsOn: "the logic of testing (Part 1) and the t-table (Week 2)",
  bridge: "Same procedure for a proportion",
  summary: [
    "Test statistic: z = (x̄ − μ₀) / (σ / √n) when σ is known; t = (x̄ − μ₀) / (s / √n) with df = n − 1 when it is not.",
    "<b>Critical value approach</b>: reject H₀ if the statistic falls beyond the critical value. Equivalent on the x̄ scale: reject if x̄ is outside μ₀ ± t · s / √n.",
    "<b>p-value</b>: the probability of a result at least as extreme as ours, assuming H₀ is true. Reject H₀ if p ≤ α.",
    "The course t-table only brackets the p-value between two columns; Excel gives it exactly.",
    "A two-tailed test at level α rejects H₀: μ = μ₀ exactly when μ₀ lies outside the (1 − α) confidence interval."
  ],
  concepts: [
    { name: "The test statistic for μ", tag: "Statistic",
      idea: `<p>The course treats the <b>sample mean</b> as the test statistic and measures how far it is from μ₀ in standard errors. Standardised, that distance is z (σ known) or t (σ unknown).</p>`,
      formula: `<div class="formula"><div class="fb">z = ${fr("x̄ − μ₀", "σ / √n")}</div><span class="fn">σ known</span></div> <div class="formula"><div class="fb">t = ${fr("x̄ − μ₀", "s / √n")}, df = n − 1</div><span class="fn">σ unknown, estimated by s</span></div>`,
      steps: `<ol><li>SE = σ / √n (or s / √n).</li><li>Difference: x̄ − μ₀.</li><li>Divide: statistic = difference / SE.</li></ol>`,
      example: `<p>Is the mean GPA of Nova SBE students different from 15? n = 40, x̄ = 15.8, s = 2.4, α = 0.05.</p><ol><li>H₀: μ = 15; H₁: μ ≠ 15 (two-tailed)</li><li>SE = 2.4 / √40 = 0.3795</li><li>t = (15.8 − 15) / 0.3795 = <b class="num">2.108</b>, df = 39</li></ol>`,
      watch: `<p>Use σ / √n, not σ. The statistic is about the mean of n students, not one student.</p>`,
      keys: [["z test for μ", `z = ${fr("x̄ − μ₀", "σ / √n")}`, ""], ["t test for μ", `t = ${fr("x̄ − μ₀", "s / √n")}, df = n − 1`, ""]] },
    { name: "Critical value approach", tag: "Decision",
      idea: `<p>The <b>critical value</b> is the boundary of the rejection region. Reject H₀ if the statistic falls beyond it. Always write the decision rule explicitly.</p>`,
      formula: `<div class="tablewrap"><table class="t"><thead><tr><th>Test</th><th>Table column (area below)</th><th>Decision rule</th></tr></thead><tbody>
        <tr><td>Two-tailed</td><td class="m">1 − α/2</td><td>reject H₀ if t &lt; −t<sub>crit</sub> or t &gt; t<sub>crit</sub></td></tr>
        <tr><td>Right-tailed</td><td class="m">1 − α</td><td>reject H₀ if t &gt; t<sub>crit</sub></td></tr>
        <tr><td>Left-tailed</td><td class="m">1 − α, then flip the sign</td><td>reject H₀ if t &lt; −t<sub>crit</sub></td></tr></tbody></table></div>
        <div class="formula"><div class="fb">critical boundary on the x̄ scale: μ₀ ± t<sub>crit</sub> · ${fr("s", "√n")}</div></div>`,
      steps: `<ol><li>Find the column from α and the tail type, and the row df = n − 1.</li><li>Write the decision rule.</li><li>Compare the statistic with the critical value, or, the same thing, x̄ with the boundary on the x̄ scale.</li></ol>`,
      example: `<p>GPA example, α = 0.05, two-tailed, df = 39:</p><ol><li>Column 0.975. df = 39 is not a row of the course table; the next smaller row, 30, gives <b class="num">2.042</b> (Excel: 2.023).</li><li>Decision rule: reject H₀ if |t| &gt; 2.042.</li><li>t = 2.108 &gt; 2.042 → <b>reject H₀</b>.</li><li>On the x̄ scale (with 2.023): 15 ± 2.023 × 0.3795 = [14.23 ; 15.77]. x̄ = 15.8 lies outside, the same decision.</li></ol>`,
      watch: `<p>For a left-tailed test the critical value is negative: the course table gives the positive value, and you flip the sign by symmetry.</p>`,
      widgets: ["texplorer"],
      keys: [["Critical value", "two-tailed: column 1 − α/2 · one-tailed: column 1 − α", "=T.INV(1-alpha/2,df)"], ["Critical boundary for x̄", `μ₀ ± t<sub>crit</sub> · ${fr("s", "√n")}`, ""]] },
    { name: "p-value approach", tag: "Decision",
      idea: `<p>The <b>p-value</b> is the probability of observing a result at least as extreme as the sample's, <b>assuming H₀ is true</b>. A small p means the data would be unusual under H₀. <b>Decision: reject H₀ if p ≤ α.</b></p>`,
      formula: `<div class="tablewrap"><table class="t"><thead><tr><th>Test</th><th>p-value</th></tr></thead><tbody>
        <tr><td>Right-tailed</td><td>P(T &gt; t)</td></tr><tr><td>Left-tailed</td><td>P(T &lt; t)</td></tr><tr><td>Two-tailed</td><td>2 × P(T &gt; |t|)</td></tr></tbody></table></div>`,
      steps: `<ol><li>Compute the tail area beyond the statistic (z-table, or bracket it in the t-table).</li><li>For a two-tailed test, double it.</li><li>Compare with α.</li></ol>`,
      example: `<p>GPA example: t = 2.108, df = 39. In the course table (row 30): 2.042 (column 0.975) &lt; 2.108 &lt; 2.457 (column 0.990), so the one-tail area is between 0.01 and 0.025 and the two-tailed p is between 0.02 and 0.05. Excel: p = <b class="num">0.041</b>.</p>
        <ul><li>α = 0.05: p = 0.041 ≤ 0.05 → reject H₀. There is significant evidence at the 5% level that the mean GPA differs from 15.</li><li>α = 0.01: p = 0.041 &gt; 0.01 → fail to reject. The conclusion depends on α.</li></ul>`,
      watch: `<p>Both approaches always agree, because "statistic beyond the critical value" and "tail area smaller than α" are the same event. Report the p-value: it tells the reader the decision for any α.</p>`,
      widgets: ["ttable"],
      keys: [["p-value", "P(result at least as extreme as observed | H₀ true) · reject H₀ if p ≤ α", "=T.DIST.2T(ABS(t),df) · =T.DIST.RT(t,df)"]] },
    { name: "z test when σ is known", tag: "z",
      idea: `<p>When σ is known (or for proportions, next part), the statistic follows the standard normal, and both the critical value and the p-value come from the z-table.</p>`,
      example: `<p>The student union suspects students sleep less than 7 h. σ = 1.2 h is known; n = 64 students sleep x̄ = 6.7 h on average. α = 0.05.</p><ol><li>H₀: μ ≥ 7; H₁: μ &lt; 7 (left-tailed)</li><li>z = (6.7 − 7) / (1.2 / √64) = −0.3 / 0.15 = <b class="num">−2.00</b></li><li>Critical value: −1.645. Rule: reject H₀ if z &lt; −1.645. −2.00 &lt; −1.645 → reject.</li><li>p = P(Z &lt; −2.00) = 1 − 0.9772 = <b class="num">0.0228</b> ≤ 0.05 → reject.</li><li>Conclusion: at the 5% level, students sleep less than 7 hours on average.</li></ol>`,
      watch: `<p>One-tailed critical values for z: 1.282 (α = 0.10), 1.645 (0.05), 2.326 (0.01). Two-tailed: 1.645, 1.96, 2.576.</p>`,
      keys: [["z critical values", "one-tailed: 1.282 · 1.645 · 2.326 · two-tailed: 1.645 · 1.96 · 2.576 (α = 0.10 · 0.05 · 0.01)", "=NORM.S.INV(1-alpha)"]] },
    { name: "Confidence intervals and two-tailed tests", tag: "Link",
      idea: `<p>A two-tailed test at level α rejects H₀: μ = μ₀ <b>exactly when μ₀ lies outside the (1 − α) confidence interval</b>. The CI collects all values of μ₀ that would not be rejected.</p>`,
      example: `<p>GPA example: 95% CI = 15.8 ± 2.023 × 0.3795 = 15.8 ± 0.768 = [15.03 ; 16.57]. It does not contain 15, so the 5% two-tailed test rejects H₀: μ = 15. Same conclusion as before.</p>`,
      watch: `<p>The link only works when the levels match (95% CI ↔ α = 0.05) and the test is two-tailed.</p>`,
      keys: [["CI ↔ test", "two-tailed test at α rejects H₀: μ = μ₀ ⇔ μ₀ outside the (1 − α) CI", ""]] }
  ],
  practice: [
    { key: "tstat3", label: "Test statistic", mode: "general", gen() {
      const T = meanTest();
      return { q: meanTestQ(T) + `<p>Compute the test statistic ${T.sym} (3 decimals).</p>`, ans: T.stat, dp: 3,
        steps: `<ol><li>${T.known ? "σ known → z" : `σ unknown → t with df = ${T.df}`}.</li><li>SE = ${T.sd} / √${T.n} = ${f(T.se, 4)}</li><li>${T.sym} = (${T.x} − ${T.mu0}) / ${f(T.se, 4)} = <b class="num">${f(T.stat, 3)}</b></li></ol>` };
    } },
    { key: "tcrit3", label: "Critical value", mode: "general", gen() {
      const T = meanTest(), sg = T.tail === "left" ? -1 : 1;
      return { q: meanTestQ(T) + `<p>Find the critical value${T.tail === "two" ? " (the positive one)" : ""} of ${T.sym} (3 decimals).</p>`, ans: sg * T.crit, dp: 3, alts: [sg * T.critT], table: T.known ? "normal" : "t-student",
        viz: rejViz(T.known ? "z" : "t", T.df, T.crit, sg * T.crit, T.tail, `${T.sym} crit`),
        steps: `<ol><li>${TAIL[T.tail].name} test with α = ${T.a}: the table column is ${T.tail === "two" ? `1 − α/2 = ${g4(T.col)}` : `1 − α = ${g4(T.col)}`}.</li><li>${critLook(T)}</li>${T.tail === "left" ? `<li>Left-tailed: flip the sign → <b class="num">${f(-T.crit, 3)}</b>.</li>` : ""}<li>Decision rule: ${ruleTxt(T.sym, f(T.crit, 3), T.tail)}.</li></ol>`, excel: T.known ? `=NORM.S.INV(${g4(T.col)})` : `=T.INV(${g4(T.col)},${T.df})` };
    } },
    { key: "bound", label: "Critical boundary for x̄", mode: "general", gen() {
      const T = meanTest(true), low = T.tail === "left" || (T.tail === "two" && Math.random() < 0.5), ans = T.mu0 + (low ? -1 : 1) * T.crit * T.se;
      return { q: meanTestQ(T) + `<p>Find the ${T.tail === "two" ? (low ? "lower" : "upper") + " " : ""}critical boundary on the scale of x̄: the value x̄ must ${low ? "fall below" : "exceed"} to reject H₀ (2 decimals).</p>`, ans, dp: 2, alts: [T.mu0 + (low ? -1 : 1) * T.critT * T.se],
        steps: `<ol><li>${tLook(T.col, T.df)}</li><li>SE = ${T.sd} / √${T.n} = ${f(T.se, 4)}</li><li>Boundary = μ₀ ${low ? "−" : "+"} t × SE = ${T.mu0} ${low ? "−" : "+"} ${T.crit.toFixed(3)} × ${f(T.se, 4)} = <b class="num">${f(ans, 2)}</b></li><li>x̄ = ${T.x} ${(low ? T.x < ans : T.x > ans) ? "is beyond it" : "is not beyond it"}${T.tail === "two" ? ` (the other boundary is ${f(T.mu0 + (low ? 1 : -1) * T.crit * T.se, 2)})` : ""}, so ${T.p <= T.a ? "reject H₀" : "fail to reject H₀"}.</li></ol>` };
    } },
    { key: "pz", label: "p-value of a z test", mode: "general", gen() {
      let T; do T = meanTest(); while (!T.known);
      const z2 = +T.stat.toFixed(2), p2 = pOf(z2, T.tail, M.phi);
      return { q: meanTestQ(T) + `<p>Compute the z statistic (round it to 2 decimals) and the <b>p-value</b> (4 decimals).</p>`, ans: p2, dp: 4, alts: [T.p], table: "normal",
        viz: rejViz("z", 0, T.crit, z2, T.tail, "z"),
        steps: `<ol><li>z = (${T.x} − ${T.mu0}) / (${T.sd} / √${T.n}) = ${f(z2, 2)}</li><li>Φ(${f(Math.abs(z2), 2)}) = ${f(M.phi(Math.abs(z2)), 4)}</li><li>${pSteps("z", z2, T.tail, p2)}</li><li>${p2 <= T.a ? `p ≤ α = ${T.a}: reject H₀` : `p &gt; α = ${T.a}: fail to reject H₀`}.</li></ol>`, excel: T.tail === "two" ? `=2*(1-NORM.S.DIST(${fx(Math.abs(z2), 2)},TRUE))` : T.tail === "right" ? `=1-NORM.S.DIST(${fx(z2, 2)},TRUE)` : `=NORM.S.DIST(${fx(z2, 2)},TRUE)` };
    } },
    { key: "prange", label: "p-value from the t-table", mode: "general", gen() {
      const A = [0.6, 0.7, 0.8, 0.85, 0.9, 0.95, 0.975, 0.99, 0.995, 0.999];
      for (;;) { const T = meanTest(true); if (T.df > 30 || T.tail === "left" && T.stat > 0) continue;
        const at = Math.abs(T.stat), k = A.findIndex((a, i) => i < A.length - 1 && M.tinv(a, T.df) <= at && at < M.tinv(A[i + 1], T.df)); if (k < 2) continue;
        const m = T.tail === "two" ? 2 : 1, rng = i => `between ${g4(+(m * (1 - A[i + 1])).toFixed(3))} and ${g4(+(m * (1 - A[i])).toFixed(3))}`, ans = rng(k);
        const choices = [k - 2, k - 1, k, k + 1].filter(i => i >= 0 && i < A.length - 1).map(rng);
        return { q: meanTestQ(T) + `<p>The test statistic is t = ${f(T.stat, 3)} with ${T.df} df. Using the course t-table, the p-value lies…</p>`, ans, choices,
          viz: rejViz("t", T.df, T.crit, T.stat, T.tail, "t"),
          steps: `<ol><li>Row df = ${T.df}: ${M.tinv(A[k], T.df).toFixed(3)} (column ${f(A[k], 3)}) ≤ ${f(at, 3)} &lt; ${M.tinv(A[k + 1], T.df).toFixed(3)} (column ${f(A[k + 1], 3)}).</li><li>So the one-tail area beyond |t| is between ${g4(+(1 - A[k + 1]).toFixed(3))} and ${g4(+(1 - A[k]).toFixed(3))}.</li><li>${T.tail === "two" ? "Two-tailed: double it" : "One-tailed: that is the p-value"} → <b>${ans}</b> (Excel: ${f(T.p, 4)}).</li><li>${T.p <= T.a ? `p ≤ α = ${T.a}: reject H₀` : `p &gt; α = ${T.a}: fail to reject H₀`}.</li></ol>`, excel: T.tail === "two" ? `=T.DIST.2T(${fx(at, 3)},${T.df})` : `=T.DIST.RT(${fx(at, 3)},${T.df})` }; }
    } },
    { key: "decide3", label: "Full test: decision", mode: "general", gen() {
      const T = meanTest(), rej = T.p <= T.a;
      return { q: meanTestQ(T) + `<p>Carry out the test. What is the decision?</p>`, ans: rej ? "Reject H₀" : "Fail to reject H₀", choices: ["Reject H₀", "Fail to reject H₀"], table: T.known ? "normal" : "t-student",
        viz: rejViz(T.known ? "z" : "t", T.df, T.crit, T.stat, T.tail, T.sym),
        steps: `<ol><li>${T.known ? "σ known → z" : `σ unknown → t, df = ${T.df}`}. SE = ${f(T.se, 4)}, ${T.sym} = (${T.x} − ${T.mu0}) / ${f(T.se, 4)} = ${f(T.stat, 3)}.</li><li>${critLook(T)}</li>${decideSteps(T.sym, T.stat, T.critT, T.tail, T.a, T.p)}<li>Conclusion: ${rej ? `at the ${T.a * 100}% level there is significant evidence that the mean ${T.c.what} ${T.tail === "two" ? "differs from" : T.tail === "right" ? "is greater than" : "is less than"} ${T.mu0}` : `at the ${T.a * 100}% level there is not enough evidence that the mean ${T.c.what} ${T.tail === "two" ? "differs from" : T.tail === "right" ? "is greater than" : "is less than"} ${T.mu0}`}.</li></ol>` };
    } },
    { key: "cilink", label: "CI and test", mode: "general", gen() {
      const c = pick(MEAN_CTX), x = rr(c.mu[0], c.mu[1], 2), me = rr(c.s[0] * 0.2, c.s[0] * 0.6, 2), lo = +(x - me).toFixed(2), hi = +(x + me).toFixed(2), inside = Math.random() < 0.5;
      const mu0 = inside ? +(lo + (0.15 + Math.random() * 0.7) * (hi - lo)).toFixed(c.dp === 2 ? 1 : 0) : +(Math.random() < 0.5 ? lo - rr(0.1, 0.5, 2) * me : hi + rr(0.1, 0.5, 2) * me).toFixed(2);
      const out = mu0 < lo || mu0 > hi, ans = out ? "Reject H₀" : "Fail to reject H₀";
      return { q: `<p>A 95% CI for the mean ${c.what} is [${lo} ; ${hi}] ${c.u}. Without any further calculation: what does a two-tailed test of H₀: μ = ${mu0} at α = 0.05 decide?</p>`, ans, choices: ["Reject H₀", "Fail to reject H₀"],
        steps: `<ol><li>A two-tailed test at α = 0.05 rejects H₀: μ = μ₀ exactly when μ₀ lies outside the 95% CI.</li><li>${mu0} lies ${out ? "outside" : "inside"} [${lo} ; ${hi}].</li><li>Answer: <b>${ans}</b>.</li></ol>` };
    } },
    { key: "dttest", label: "t test in the dataset", mode: "data", gen() {
      let c, g, v; do { c = pick(NUMERIC.slice(0, 4)); g = pick(GROUPS); v = col(c.i, g); } while (v.length < 10);
      const n = v.length, x = M.mean(v), s = M.sdS(v), se = s / Math.sqrt(n), mu0 = Math.round(x + (Math.random() < 0.5 ? -1 : 1) * rr(0.3, 2.8, 2) * se), t = (x - mu0) / se, ask = pick(["t", "p"]), p = 2 * (1 - M.tcdf(Math.abs(t), n - 1));
      return { q: `<p>Test H₀: μ = ${mu0} against H₁: μ ≠ ${mu0} for the mean <b>${c.name}</b> of the <b>${g.label.toLowerCase()}</b>. Find the ${ask === "t" ? "<b>t statistic</b> (3 decimals)" : "<b>two-tailed p-value</b> (4 decimals, use Excel)"}.</p>`, ans: ask === "t" ? t : p, dp: ask === "t" ? 3 : 4,
        steps: `<ol><li>n = ${n}, x̄ = ${f(x, 4)}, s = ${f(s, 4)}, df = ${n - 1}</li><li>SE = ${f(s, 4)} / √${n} = ${f(se, 4)}</li><li>t = (${f(x, 4)} − ${mu0}) / ${f(se, 4)} = ${ask === "t" ? `<b class="num">${f(t, 3)}</b>` : f(t, 3)}</li><li>p = 2 × P(T &gt; ${f(Math.abs(t), 3)}) = ${ask === "p" ? `<b class="num">${f(p, 4)}</b>` : f(p, 4)} → ${p <= 0.05 ? "reject" : "fail to reject"} H₀ at α = 0.05.</li></ol>`, excel: `=T.DIST.2T(${fx(Math.abs(t), 3)},${n - 1})` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 3 */
{
  title: "Testing a proportion and reading results", table: "normal",
  intro: "The same procedure tests a claim about a proportion π. Then three ideas that come back in every later week: the effect of the sample size, statistical versus practical significance, and how to read a p-value correctly.",
  buildsOn: "the testing procedure (Part 2) and the CI for π (Week 2)",
  summary: [
    "Test for π: z = (p − π₀) / √(π₀(1 − π₀) / n). The SE uses π₀ from H₀, not p.",
    "With the same x̄, a larger n gives a smaller SE, a larger statistic and a smaller p-value: more power.",
    "<b>Statistically significant ≠ important.</b> With a large n, tiny differences (5.05 vs 5.00 h) can be significant.",
    "p = 0.02 means: data like ours would be unusual if H₀ were true. It is <b>not</b> the probability that H₀ is true."
  ],
  concepts: [
    { name: "Test for a proportion π", tag: "Proportion",
      idea: `<p>To test a claim about a population proportion, standardise the sample proportion p. Because we assume H₀ is true, the standard error uses <b>π₀</b>.</p>`,
      formula: `<div class="formula"><div class="fb">z = ${fr("p − π₀", "√(π₀(1 − π₀) / n)")}</div></div>`,
      steps: `<ol><li>H₀ and H₁ about π.</li><li>p = x / n.</li><li>SE = √(π₀(1 − π₀) / n).</li><li>z = (p − π₀) / SE; critical value and/or p-value from the z-table.</li><li>Decide and conclude.</li></ol>`,
      example: `<p>Claim: 50% of students study Solo. Sample: 210 of 400. α = 0.05, two-tailed.</p><ol><li>H₀: π = 0.5; H₁: π ≠ 0.5</li><li>p = 210 / 400 = 0.525</li><li>SE = √(0.5 × 0.5 / 400) = 0.025</li><li>z = (0.525 − 0.5) / 0.025 = <b class="num">1.00</b>; z<sub>crit</sub> = ±1.96 → fail to reject.</li><li>p-value = 2 × (1 − 0.8413) = <b class="num">0.317</b> &gt; 0.05 → fail to reject.</li><li>No significant evidence that the proportion differs from 50%.</li></ol>`,
      watch: `<p>Tests use π₀ in the SE; confidence intervals use p (Week 2). Don't swap them.</p>`,
      keys: [["z test for π", `z = ${fr("p − π₀", "√(π₀(1 − π₀) / n)")}`, ""]] },
    { name: "Sample size and power", tag: "Power",
      idea: `<p>With the same difference x̄ − μ₀, a larger n gives a smaller SE, so a larger test statistic and a smaller p-value. Large samples detect small true differences; small samples often miss them (Type II errors).</p>`,
      example: `<p>x̄ = 15.8, s = 2.4, H₀: μ = 15, two-tailed:</p><div class="tablewrap"><table class="t"><thead><tr><th>n</th><th>SE</th><th>t</th><th>p-value</th></tr></thead><tbody>
        <tr><td class="m">10</td><td class="m">0.759</td><td class="m">1.054</td><td class="m">0.319</td></tr><tr><td class="m">40</td><td class="m">0.379</td><td class="m">2.108</td><td class="m">0.041</td></tr><tr><td class="m">160</td><td class="m">0.190</td><td class="m">4.216</td><td class="m">&lt; 0.001</td></tr></tbody></table></div>
        <p>Researcher A (n = 20) and researcher B (n = 200) can find similar x̄ and still reach different conclusions: B's test has much more power.</p>`,
      watch: `<p>A non-significant result from a small sample is weak evidence: the test may simply lack power.</p>`,
      keys: [["Effect of n", "larger n → smaller SE → larger |statistic| → smaller p → more power", ""]] },
    { name: "Statistical vs practical significance", tag: "Interpretation",
      idea: `<p><b>Statistically significant</b> means: the difference is unlikely to be chance. It does not mean the difference is large or important. Always look at the size of the difference too.</p>`,
      example: `<p>10,000 students, x̄ = 5.05 h/day, s = 1.5, H₀: μ = 5: t = 0.05 / (1.5 / 100) = 3.33, p ≈ 0.001. Highly significant, but 0.05 h is 3 minutes a day: irrelevant for any decision.</p>`,
      watch: `<p>Report both: the p-value (is there an effect?) and the estimate or CI (how big is it?).</p>`,
      keys: [["Practical significance", "significant = unlikely to be chance · not the same as large or important", ""]] },
    { name: "Reading a p-value correctly", tag: "Interpretation",
      idea: `<p>A test gives p = 0.02. Which statements are correct?</p>`,
      example: `<ul><li>✗ There is a 2% probability that H₀ is true.</li><li>✓ The result is statistically significant at the 5% level.</li><li>✗ The sample definitely came from a different population.</li><li>✓ The observed data would be relatively unusual if H₀ were true.</li><li>✗ Failing to reject H₀ would prove H₀ is true.</li><li>✗ Statistically significant means important.</li></ul>`,
      watch: `<p>The p-value is computed <b>assuming</b> H₀ is true, so it cannot be the probability of H₀. This question format returns every week of the course.</p>`,
      keys: [["Meaning of p", "P(data at least this extreme | H₀ true) · not P(H₀ true)", ""]] }
  ],
  practice: [
    { key: "zprop", label: "z for a proportion", mode: "general", gen() {
      for (;;) { const [what, a, b] = pick(PROP_CTX), pi0 = +rr(a, b, 2).toFixed(2), n = pick([100, 150, 200, 250, 300, 400, 500]), tail = pick(["two", "right", "left"]), se = Math.sqrt(pi0 * (1 - pi0) / n);
        const dir = tail === "two" ? pick([1, -1]) : tail === "right" ? 1 : -1, x = Math.round(n * (pi0 + dir * rr(0.3, 3, 2) * se)), p = x / n, z = (p - pi0) / se, al = pick([0.10, 0.05, 0.01]), col = critCol(al, tail), cz = M.invphi(col);
        if (!clear(z, [cz]) || x <= 0 || x >= n) continue;
        const pv = pOf(z, tail, M.phi), ask = pick(["z", "p", "decide"]);
        const q = `<p>${hyp("π", pi0, tail)}, where π is the share of students who ${what}. In a random sample of ${n}, ${x} ${what}. α = ${al}.</p>`;
        const base = `<li>p = ${x} / ${n} = ${g4(p)}</li><li>SE = √(${pi0} × ${g4(1 - pi0)} / ${n}) = ${f(se, 4)} (uses π₀)</li><li>z = (${g4(p)} − ${pi0}) / ${f(se, 4)} = ${f(z, 3)}</li>`;
        if (ask === "decide") return { q: q + `<p>What is the decision?</p>`, ans: pv <= al ? "Reject H₀" : "Fail to reject H₀", choices: ["Reject H₀", "Fail to reject H₀"], viz: rejViz("z", 0, cz, z, tail, "z"),
          steps: `<ol>${base}<li>${zLook(col)}</li>${decideSteps("z", z, cz, tail, al, pv)}</ol>` };
        return { q: q + `<p>Find the ${ask === "z" ? "<b>z statistic</b> (3 decimals)" : "<b>p-value</b> (4 decimals)"}.</p>`, ans: ask === "z" ? z : pv, dp: ask === "z" ? 3 : 4, alts: ask === "p" ? [pOf(+z.toFixed(2), tail, M.phi)] : [], viz: rejViz("z", 0, cz, z, tail, "z"),
          steps: `<ol>${base}<li>${pSteps("z", z, tail, pv)} → ${pv <= al ? "reject" : "fail to reject"} H₀ at α = ${al}.</li></ol>` }; }
    } },
    { key: "nchange", label: "Same mean, different n", mode: "general", gen() {
      const c = pick(MEAN_CTX), mu0 = rr(c.mu[0], c.mu[1], 1), s = rr(c.s[0], c.s[1], 1), d = +(s * rr(0.15, 0.45, 2)).toFixed(2), x = +(mu0 + d).toFixed(2), n = pick([16, 25, 36, 64, 100, 144, 400]), t = (x - mu0) / (s / Math.sqrt(n));
      return { q: `<p>H₀: μ = ${mu0} for the ${c.what}. The sample mean is x̄ = ${x} with s = ${s}. Compute the t statistic if the sample has <b>n = ${n}</b> students (3 decimals).</p>`, ans: t, dp: 3,
        steps: `<ol><li>SE = ${s} / √${n} = ${f(s / Math.sqrt(n), 4)}</li><li>t = (${x} − ${mu0}) / ${f(s / Math.sqrt(n), 4)} = <b class="num">${f(t, 3)}</b></li><li>Two-tailed p = ${f(2 * (1 - M.tcdf(Math.abs(t), n - 1)), 4)}. The same difference of ${f(x - mu0, 2)} becomes more significant as n grows, because t grows with √n.</li></ol>` };
    } },
    { key: "pstate3", label: "p = 0.02: which is correct?", mode: "general", gen: pGen("A one-sample t test of H₀: μ = 15 (mean GPA) gives a test statistic of t = 2.4.", P3_RIGHT, P3_WRONG) },
    { key: "dprop3", label: "Test a proportion in the dataset", mode: "data", gen() {
      const { pr, g, n, x, p } = dPropPick(), pi0 = Math.min(0.9, Math.max(0.1, Math.round((p + pick([-1, 1]) * rr(0.04, 0.15, 2)) * 20) / 20)), se = Math.sqrt(pi0 * (1 - pi0) / n), z = (p - pi0) / se, pv = 2 * (1 - M.phi(Math.abs(z)));
      return { q: `<p>Treat the <b>${g.label.toLowerCase()}</b> as a random sample. Test H₀: π = ${pi0} against H₁: π ≠ ${pi0}, where π is the share who <b>${pr.lbl}</b>. Find the <b>z statistic</b> (3 decimals).</p>`, ans: z, dp: 3,
        steps: `<ol><li>n = ${n}, x = ${x}, p = ${f(p, 4)}</li><li>SE = √(${pi0} × ${g4(1 - pi0)} / ${n}) = ${f(se, 4)}</li><li>z = (${f(p, 4)} − ${pi0}) / ${f(se, 4)} = <b class="num">${f(z, 3)}</b></li><li>p-value = ${f(pv, 4)} → ${pv <= 0.05 ? "reject" : "fail to reject"} H₀ at α = 0.05.</li></ol>`, excel: `p: ${gFilterTxt(g, pr.i, pr.v)}` };
    } }
  ]
}
];

/* ========================================================================= WEEK 4 */
const anovaOf = groups => {
  const all = groups.flat(), n = all.length, k = groups.length, grand = M.mean(all), means = groups.map(M.mean);
  const ssb = groups.reduce((s, g, j) => s + g.length * (means[j] - grand) ** 2, 0), ssw = groups.reduce((s, g) => s + M.ss(g), 0);
  const df1 = k - 1, df2 = n - k, msb = ssb / df1, msw = ssw / df2, F = msb / msw;
  return { k, n, grand, means, ssb, ssw, sst: ssb + ssw, df1, df2, msb, msw, F, p: 1 - M.fcdf(F, df1, df2) };
};
const anovaTable = (o, hide = [], dp = 2) => { const c = (k, v, d = dp) => `<td class="m">${hide.includes(k) ? "?" : typeof v === "number" ? f(v, d) : v}</td>`;
  return `<div class="tablewrap"><table class="t"><thead><tr><th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th></tr></thead><tbody>
    <tr><td>Between groups</td>${c("ssb", o.ssb)}${c("df1", o.df1, 0)}${c("msb", o.msb)}${c("F", o.F, 3)}</tr>
    <tr><td>Within groups</td>${c("ssw", o.ssw)}${c("df2", o.df2, 0)}${c("msw", o.msw, 3)}<td></td></tr>
    <tr><td>Total</td>${c("sst", o.sst)}${c("dft", o.n - 1, 0)}<td></td><td></td></tr></tbody></table></div>`; };
const METHODS3 = ["Solo", "Group", "Hybrid"], METHODS4 = ["Solo", "Group", "Hybrid", "Tutoring"];
/* small raw GPA data for k study methods, kept integer and on the 0–20 scale */
const anovaRaw = () => { for (;;) { const k = pick([3, 3, 4]), m = pick([4, 5, 5, 6]), base = ri(12, 15), shifts = [...Array(k)].map(() => pick([-1, 0, 0, 1, 1, 2]));
  const groups = shifts.map(sh => [...Array(m)].map(() => clamp(base + sh + ri(-2, 2), 8, 20))), o = anovaOf(groups);
  if (o.ssw > 0 && o.ssb > 0) return { names: (k === 3 ? METHODS3 : METHODS4), groups, o }; } };
const rawTable = (names, groups) => `<div class="tablewrap"><table class="t"><thead><tr>${names.map(n => `<th>${n}</th>`).join("")}</tr></thead><tbody>
  <tr>${groups.map(g => `<td class="m">${g.join(", ")}</td>`).join("")}</tr><tr>${groups.map(g => `<td class="m">x̄ = ${g4(M.mean(g))}</td>`).join("")}</tr></tbody></table></div>`;
const ssbSteps = (o, groups) => `<li>Group means: ${o.means.map(g4).join(", ")}; grand mean x̄ = ${g4(o.grand)} (all ${o.n} values).</li>
  <li>SSB = Σ nⱼ (x̄ⱼ − x̄)² = ${groups.map((g, j) => `${g.length} × (${g4(o.means[j])} − ${g4(o.grand)})²`).join(" + ")} = ${f(o.ssb, 3)}</li>`;
const sswSteps = (o, groups) => `<li>SSW = Σ Σ (xᵢⱼ − x̄ⱼ)², the squared deviations inside each group: ${groups.map(g => f(M.ss(g), 3)).join(" + ")} = ${f(o.ssw, 3)}</li>`;
const ANOVA_FIT = [
  { q: "An administrator believes the study method (Solo, Group, Hybrid) leads to different GPAs. Is one-way ANOVA appropriate?", a: "Yes: GPA is metric and study method is categorical", why: "ANOVA compares the means of one metric variable (GPA) across the groups of one categorical factor (study method)." },
  { q: "You want to know whether stress level (0–10 score) differs between the Bachelor, Master and PhD programmes.", a: "Yes: stress score is metric and programme is categorical", why: "One metric dependent variable, one categorical factor with three groups." },
  { q: "You want to know whether study method (Solo, Group, Hybrid) is related to GPA category (Low, Medium, High).", a: "No: both variables are categorical, use a χ² test", why: "GPA category is categorical, not metric, so there are no group means to compare. Contingency analysis (Week 5) fits." },
  { q: "You want to know whether daily study hours help predict GPA.", a: "No: both variables are metric, use regression", why: "Both variables are quantitative, so simple linear regression (Week 6) fits." },
  { q: "You want to compare the mean sleep duration of students with low, medium and high stress.", a: "Yes: sleep duration is metric and stress category is categorical", why: "One metric variable (sleep hours) compared across three categories." },
  { q: "You want to know whether gender is associated with taking part in extracurricular activities (yes/no).", a: "No: both variables are categorical, use a χ² test", why: "Two categorical variables: contingency analysis." }
].map(b => ({ ...b, w: ["Yes: GPA is metric and study method is categorical", "Yes: stress score is metric and programme is categorical", "Yes: sleep duration is metric and stress category is categorical", "No: both variables are categorical, use a χ² test", "No: both variables are metric, use regression"].filter(x => x !== b.a).filter((x, i, arr) => !(b.a.startsWith("Yes") && x.startsWith("Yes"))).slice(0, 3) }));
const ANOVA_TF = [
  ["H₁ in a one-way ANOVA says that all population means are different.", false, "H₁ says that at least one mean differs from the others."],
  ["If H₀ is true, F is expected to be close to 1.", true, "Both mean squares then estimate the same variance, so their ratio is about 1."],
  ["A large F is evidence against H₀.", true, "The group means differ more than the spread inside the groups would explain."],
  ["The ANOVA F test is always right-tailed.", true, "Only large values of F (between ≫ within) count against H₀."],
  ["F can be negative when one group mean is below the grand mean.", false, "F is a ratio of two sums of squares, so it is always ≥ 0."],
  ["Running three separate t-tests at α = 0.05 keeps the overall Type I error risk at 5%.", false, "The risk of at least one false positive grows to about 1 − 0.95³ = 0.143."],
  ["If ANOVA rejects H₀, it tells you which groups differ.", false, "It only says at least one mean differs. Post-hoc tests (e.g. Tukey) compare the pairs."],
  ["ANOVA assumes independent random samples, roughly normal populations and equal variances.", true, "Those are the three assumptions of one-way ANOVA."],
  ["df₁ = k − 1 and df₂ = n − k.", true, "k − 1 for between groups, n − k for within groups."],
  ["Failing to reject H₀ proves that all means are exactly equal.", false, "It only means there is not enough evidence of a difference."]
];
const P4_RIGHT = [["The result is significant at the 5% level.", "0.02 ≤ 0.05, so H₀ is rejected at α = 0.05."], ["At least one population mean may differ from the others.", "That is what rejecting H₀ means in ANOVA."]];
const P4_WRONG = [["There is a 2% probability that H₀ is true.", "The p-value assumes H₀ is true; it is not its probability."], ["ANOVA proves which specific groups are different.", "Only post-hoc tests can say which pairs differ."],
  ["All three study methods have different mean GPAs.", "H₁ only says at least one mean differs."], ["Failing to reject would prove all means are exactly equal.", "Fail to reject never proves H₀."], ["The result is significant at the 1% level.", "0.02 &gt; 0.01."]];
const dAnova = () => { const fac = pick([3, 5]), y = pick(NUMERIC.slice(0, 4)), levels = CATS[fac], groups = levels.map(l => RAW.filter(r => r[fac] === l).map(r => r[y.i]));
  return { fac, y, levels, groups, o: anovaOf(groups) }; };

const WEEK4_PARTS = [
/* ------------------------------------------------------------- Part 1 */
{
  title: "The idea of ANOVA", table: "f-snedecor",
  intro: "Do several group means differ because the populations differ, or just by chance? One-way analysis of variance (ANOVA) answers this with one single test, by comparing the variation between the groups with the variation inside them.",
  buildsOn: "hypothesis tests for one mean (Week 3) and the F distribution (Week 1)",
  bridge: "Compute it: the ANOVA table",
  summary: [
    "Use ANOVA for one <b>metric</b> dependent variable and one <b>categorical</b> factor with k groups (typically 3 or more).",
    "Many t-tests inflate the Type I error: with 3 groups, 3 tests at 5% give a 14.3% chance of at least one false positive. ANOVA tests all means at once at level α.",
    "H₀: μ₁ = μ₂ = … = μ<sub>k</sub>. H₁: <b>at least one</b> mean differs.",
    "F = MSB / MSW compares between-group with within-group variation. Under H₀, F ≈ 1; large F is evidence against H₀. Always right-tailed, with df₁ = k − 1 and df₂ = n − k.",
    "Assumptions: independent random samples, approximately normal populations, equal variances."
  ],
  concepts: [
    { name: "When to use ANOVA", tag: "Method",
      idea: `<p>One-way ANOVA compares the means of a <b>metric (quantitative) dependent variable</b> across the groups of <b>one categorical factor</b>. It extends the one-mean test of Week 3 to several means at once.</p>`,
      example: `<ul><li>GPA (metric) by study method: Solo / Group / Hybrid (factor, k = 3).</li><li>Stress score (metric) by programme (factor).</li><li>Not ANOVA: study method × GPA category (both categorical → χ², Week 5); study hours → GPA (both metric → regression, Week 6).</li></ul>`,
      watch: `<p>The dependent variable must be metric: it needs a mean. "GPA category: Low / Medium / High" is categorical, so it does not work as the dependent variable of an ANOVA.</p>`,
      keys: [["When ANOVA", "metric dependent variable · one categorical factor with k groups", ""]] },
    { name: "Why not many t-tests?", tag: "Method",
      idea: `<p>Each test carries a Type I error risk α. With k groups there are k(k − 1) / 2 pairs to compare, and the risk of <b>at least one</b> false positive grows fast. ANOVA tests all means in one test at level α.</p>`,
      formula: `<div class="formula"><div class="fb">P(at least one Type I error) = 1 − (1 − α)<sup>m</sup></div><span class="fn">m = number of independent tests</span></div>`,
      example: `<ul><li>k = 3 → m = 3 tests: 1 − 0.95³ = <b class="num">0.143</b></li><li>k = 5 → m = 10 tests: 1 − 0.95¹⁰ = <b class="num">0.401</b></li></ul>`,
      watch: `<p>Instead of 5%, you would wrongly "find" a difference in 14% or 40% of studies, even when all groups are the same.</p>`,
      keys: [["Many tests", "P(≥ 1 false positive) = 1 − (1 − α)<sup>m</sup>, m = k(k − 1) / 2 pairs", ""]] },
    { name: "Hypotheses", tag: "Hypotheses",
      idea: `<p>H₀ says the factor makes no difference: all population means are equal. H₁ says at least one is different.</p>`,
      formula: `<div class="formula"><div class="fb">H₀: μ₁ = μ₂ = … = μ<sub>k</sub></div></div> <div class="formula"><div class="fb">H₁: at least one μⱼ differs</div></div>`,
      example: `<p>GPA by study method: H₀: μ<sub>Solo</sub> = μ<sub>Group</sub> = μ<sub>Hybrid</sub> (study method does not affect mean GPA). H₁: at least one study method has a different mean GPA.</p>`,
      watch: `<p>H₁ is <b>not</b> "all means are different". Two could be equal and the third different.</p>`,
      keys: [["ANOVA hypotheses", "H₀: μ₁ = … = μ<sub>k</sub> · H₁: at least one mean differs", ""]] },
    { name: "Between and within variation", tag: "Logic",
      idea: `<p>Sample means always differ a little by chance, so different means alone prove nothing. ANOVA compares two kinds of variation:</p>
        <ul><li><b>Between groups</b>: how far the group means lie from the grand mean.</li><li><b>Within groups</b>: the natural spread of the students inside each group.</li></ul>
        <p>If the group means are far apart <b>compared with</b> the spread inside the groups, they differ more than chance would explain.</p>`,
      example: `<ul><li>Means 14.4, 16.6, 15.2 with values tightly packed in each group → the gaps stand out → evidence of a difference.</li><li>The same means but each group spread from 9 to 20 → the gaps disappear in the noise → no evidence.</li></ul>`,
      watch: `<p>The name "analysis of variance" is about this: we test means by comparing two variances.</p>`,
      keys: [["Logic of ANOVA", "between-group variation vs within-group variation", ""]] },
    { name: "The F statistic", tag: "Statistic",
      idea: `<p>F is the ratio of the between-group mean square to the within-group mean square. Under H₀ both estimate the same variance, so <b>F ≈ 1</b>. A large F is evidence against H₀. F is never negative, and the test is always <b>right-tailed</b>.</p>`,
      formula: `<div class="formula"><div class="fb">F = ${fr("MSB", "MSW")}</div><span class="fn">follows F(df₁, df₂) under H₀ · df₁ = k − 1 (numerator) · df₂ = n − k (denominator)</span></div>`,
      steps: `<ol><li>df₁ = k − 1, df₂ = n − k.</li><li>F-table: block n = df₂, line 1 − α (0.950 for α = 0.05), column m = df₁.</li><li>Reject H₀ if F &gt; F<sub>crit</sub>.</li></ol>`,
      example: `<p>k = 3 study methods, n = 15 students: df₁ = 2, df₂ = 12. F<sub>crit</sub>(0.05; 2, 12): block 12, line 0.950, column 2 → <b class="num">3.89</b>. An F of 5.8 is far above 1 and above 3.89 → reject H₀.</p>`,
      watch: `<p>The F-Snedecor distribution is right-skewed and defined by two df. Keep the order: numerator df₁ first, denominator df₂ second.</p>`,
      widgets: ["fexplorer"],
      keys: [["F statistic", `F = ${fr("MSB", "MSW")} · df₁ = k − 1 · df₂ = n − k`, "=F.INV(1-alpha,k-1,n-k)"]] },
    { name: "Assumptions", tag: "Assumptions",
      idea: `<p>One-way ANOVA needs:</p><ol><li><b>Independent random samples</b> from each group.</li><li>Approximately <b>normal</b> populations in each group.</li><li><b>Equal variances</b> across the groups.</li></ol>`,
      example: `<p>GPA by study method: students sampled at random and independently; GPA roughly bell-shaped in each group; similar spread of GPA among Solo, Group and Hybrid studiers.</p>`,
      watch: `<p>The ANOVA is fairly robust to mild non-normality with similar group sizes, but very unequal spreads can mislead it.</p>`,
      keys: [["ANOVA assumptions", "independent random samples · normal populations · equal variances", ""]] }
  ],
  practice: [
    { key: "anovafit", label: "Is ANOVA appropriate?", mode: "general", gen: mcGen(ANOVA_FIT) },
    { key: "fwer", label: "Risk of many t-tests", mode: "general", gen() {
      const k = pick([3, 4, 5, 6]), a = pick([0.05, 0.10, 0.01]), m = k * (k - 1) / 2, ans = 1 - (1 - a) ** m;
      return { q: `<p>You compare the mean GPA of <b>${k}</b> study methods with separate t-tests for every pair, each at α = ${a}. Assuming the tests are independent, what is the probability of at least one Type I error if all means are equal? (3 decimals)</p>`, ans, dp: 3,
        steps: `<ol><li>Number of pairs: m = k(k − 1) / 2 = ${k} × ${k - 1} / 2 = ${m}.</li><li>P(no false positive in one test) = 1 − ${a} = ${g4(1 - a)}.</li><li>P(at least one) = 1 − ${g4(1 - a)}<sup>${m}</sup> = <b class="num">${f(ans, 3)}</b>, far above ${a}. That is why we use one ANOVA.</li></ol>` };
    } },
    { key: "anovatf", label: "ANOVA: true or false", mode: "general", gen: tfGen(ANOVA_TF) },
    { key: "fdf", label: "Degrees of freedom", mode: "general", gen() {
      const k = ri(3, 6), per = ri(5, 25), n = k * per, which = pick([1, 2]);
      return { q: `<p>A one-way ANOVA compares ${k} groups with ${per} students each. Find <b>df${which === 1 ? "₁ (between groups)" : "₂ (within groups)"}</b>.</p>`, ans: which === 1 ? k - 1 : n - k, dp: 0,
        steps: `<ol><li>k = ${k} groups, n = ${k} × ${per} = ${n} students.</li><li>${which === 1 ? `df₁ = k − 1 = <b class="num">${k - 1}</b>` : `df₂ = n − k = ${n} − ${k} = <b class="num">${n - k}</b>`}</li><li>Check: df₁ + df₂ = ${n - 1} = n − 1, the total df.</li></ol>` };
    } },
    { key: "fcrit4", label: "Critical F value", mode: "general", gen() {
      const k = ri(3, 6), n2 = pick([6, 7, 8, 9, 10, 12, 15, 20, 30, 60]), df1 = k - 1, a = pick([0.05, 0.05, 0.01, 0.10]), col = 1 - a, ans = M.finv(col, df1, n2);
      return { q: `<p>An ANOVA compares <b>k = ${k}</b> groups with <b>n = ${n2 + k}</b> students in total. Find the critical value F<sub>crit</sub> at α = ${a} (2 decimals).</p>`, ans, dp: 2,
        viz: { dist: "f", m: df1, n: n2, regions: [[ans, 9999]], marks: [{ x: ans, label: `F crit = ${f(ans, 2)}` }] },
        steps: `<ol><li>df₁ = k − 1 = ${df1}, df₂ = n − k = ${n2}.</li><li>The F test is right-tailed, so the area below F<sub>crit</sub> is 1 − α = ${g4(col)}.</li><li>${fLook(col, df1, n2)}</li></ol>`, excel: `=F.INV(${g4(col)},${df1},${n2})` };
    } },
    { key: "dgm", label: "Group and grand means", mode: "data", gen() {
      const D = dAnova(), j = ri(0, D.levels.length - 1), grand = Math.random() < 0.4, ans = grand ? D.o.grand : D.o.means[j];
      return { q: `<p>An ANOVA compares the mean <b>${D.y.name}</b> across the groups of <b>${COLS[D.fac]}</b> (${D.levels.join(", ")}). Find the ${grand ? "<b>grand mean</b> of all 60 students" : `mean of the group <b>${D.levels[j]}</b>`} (2 decimals).</p>`, ans, dp: 2,
        steps: `<ol><li>Dependent variable: ${D.y.name} (metric). Factor: ${COLS[D.fac]} (categorical, k = ${D.levels.length}).</li><li>Group sizes and means: ${D.levels.map((l, i) => `${l} n = ${D.groups[i].length}, x̄ = ${f(D.o.means[i], 2)}`).join(" · ")}.</li><li>${grand ? `Grand mean of all values: <b class="num">${f(ans, 2)}</b>. (It is the weighted mean of the group means, not their plain average.)` : `Mean of ${D.levels[j]}: <b class="num">${f(ans, 2)}</b>`}</li></ol>`,
        excel: grand ? `=AVERAGE(${LETTERS[D.y.i]}2:${LETTERS[D.y.i]}61)` : `=AVERAGEIF(${LETTERS[D.fac]}2:${LETTERS[D.fac]}61,"${D.levels[j]}",${LETTERS[D.y.i]}2:${LETTERS[D.y.i]}61)` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 2 */
{
  title: "The ANOVA table", table: "f-snedecor",
  intro: "All ANOVA calculations fit into one table: sums of squares, degrees of freedom, mean squares and F. This part builds it step by step, reads the decision from it, and shows what ANOVA cannot tell you.",
  buildsOn: "the logic and the F statistic (Part 1)",
  summary: [
    "SSB = Σ nⱼ(x̄ⱼ − x̄)² (between), SSW = Σ Σ (xᵢⱼ − x̄ⱼ)² (within), SST = SSB + SSW.",
    "df: k − 1, n − k and n − 1. MS = SS / df. F = MSB / MSW.",
    "Reject H₀ if F &gt; F<sub>α; k−1, n−k</sub> or p ≤ α. Both approaches agree.",
    "Completing a partial table only needs SST = SSB + SSW, df₁ + df₂ = n − 1, MS = SS / df and F = MSB / MSW.",
    "After rejecting H₀, <b>post-hoc tests</b> (e.g. Tukey) show which groups differ. Check practical significance too."
  ],
  concepts: [
    { name: "Sums of squares", tag: "Table",
      idea: `<p>The total variation of all values around the grand mean splits into a part between the groups and a part within them.</p>`,
      formula: `<div class="formula"><div class="fb">SSB = Σ nⱼ (x̄ⱼ − x̄)²</div><span class="fn">between: group means around the grand mean, weighted by group size</span></div>
        <div class="formula"><div class="fb">SSW = Σ Σ (xᵢⱼ − x̄ⱼ)²</div><span class="fn">within: each value around its own group mean</span></div>
        <div class="formula"><div class="fb">SST = SSB + SSW</div><span class="fn">total: each value around the grand mean</span></div>`,
      example: `<p>GPA by study method, 5 students per group (n = 15, k = 3):</p><div class="tablewrap"><table class="t"><thead><tr><th>Solo</th><th>Group</th><th>Hybrid</th></tr></thead><tbody>
        <tr><td class="m">14, 15, 13, 16, 14</td><td class="m">16, 17, 15, 18, 17</td><td class="m">15, 16, 14, 16, 15</td></tr><tr><td class="m">x̄ = 14.4</td><td class="m">x̄ = 16.6</td><td class="m">x̄ = 15.2</td></tr></tbody></table></div>
        <ul><li>Grand mean = 15.4</li><li>SSB = 5(14.4 − 15.4)² + 5(16.6 − 15.4)² + 5(15.2 − 15.4)² = 5 + 7.2 + 0.2 = <b class="num">12.4</b></li><li>SSW = 5.2 + 5.2 + 2.8 = <b class="num">13.2</b> (squared deviations inside each group)</li><li>SST = 12.4 + 13.2 = <b class="num">25.6</b></li></ul>`,
      watch: `<p>Weight each group's squared distance by its size nⱼ. Forgetting nⱼ is the most common mistake in SSB.</p>`,
      keys: [["Between groups", "SSB = Σ nⱼ (x̄ⱼ − x̄)²", ""], ["Within groups", "SSW = Σ Σ (xᵢⱼ − x̄ⱼ)²", ""], ["Total", "SST = SSB + SSW", ""]] },
    { name: "Degrees of freedom and mean squares", tag: "Table",
      idea: `<p>Dividing each sum of squares by its degrees of freedom gives a <b>mean square</b>, an average variation that can be compared fairly.</p>`,
      formula: `<div class="tablewrap"><table class="t"><thead><tr><th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th></tr></thead><tbody>
        <tr><td>Between groups</td><td class="m">SSB</td><td class="m">k − 1</td><td class="m">MSB = SSB / (k − 1)</td><td class="m">F = MSB / MSW</td></tr>
        <tr><td>Within groups (error)</td><td class="m">SSW</td><td class="m">n − k</td><td class="m">MSW = SSW / (n − k)</td><td></td></tr>
        <tr><td>Total</td><td class="m">SST</td><td class="m">n − 1</td><td></td><td></td></tr></tbody></table></div>`,
      example: `<p>The study-method example:</p><div class="tablewrap"><table class="t"><thead><tr><th>Source</th><th>SS</th><th>df</th><th>MS</th><th>F</th></tr></thead><tbody>
        <tr><td>Between</td><td class="m">12.4</td><td class="m">2</td><td class="m">6.2</td><td class="m"><b>5.64</b></td></tr><tr><td>Within</td><td class="m">13.2</td><td class="m">12</td><td class="m">1.1</td><td></td></tr><tr><td>Total</td><td class="m">25.6</td><td class="m">14</td><td></td><td></td></tr></tbody></table></div>`,
      watch: `<p>There is no MS for the total row: MSB and MSW do not add up, only the SS and the df do.</p>`,
      keys: [["Mean squares", "MSB = SSB / (k − 1) · MSW = SSW / (n − k)", ""], ["ANOVA df", "k − 1 + n − k = n − 1", ""]] },
    { name: "Decision: critical value and p-value", tag: "Decision",
      idea: `<p>Compare F with the critical value of the F distribution, or the p-value with α. Then conclude in context.</p>`,
      steps: `<ol><li>Identify the metric dependent variable and the factor (k groups).</li><li>H₀: all means equal; H₁: at least one differs. Choose α.</li><li>Compute the group means and the grand mean.</li><li>Compute SSB, SSW, SST; df; MSB, MSW; F.</li><li>Find F<sub>crit</sub> (df₁ = k − 1, df₂ = n − k) and/or the p-value.</li><li>Decide; if you reject H₀, mention that post-hoc tests are needed to see which groups differ.</li></ol>`,
      example: `<ul><li>F<sub>crit</sub>(0.05; 2, 12): block 12, line 0.950, column 2 → <b class="num">3.89</b> (Excel: 3.885). Decision rule: reject H₀ if F &gt; 3.89.</li><li>F = 5.64 &gt; 3.89 → reject H₀. p = <b class="num">0.019</b> ≤ 0.05, the same decision.</li><li>Conclusion: at the 5% level, the mean GPA differs for at least one study method. ANOVA does not say which.</li><li>At α = 0.01: F<sub>crit</sub> = 6.93 (line 0.990) → 5.64 &lt; 6.93, fail to reject (p = 0.019 &gt; 0.01).</li></ul>`,
      watch: `<p>The course F-table only brackets the p-value: 5.64 lies between the 0.975 line (5.10) and the 0.990 line (6.93), so 0.01 &lt; p &lt; 0.025. Excel gives it exactly with ${xl("=F.DIST.RT(F,df1,df2)")}.</p>`,
      keys: [["ANOVA decision", "reject H₀ if F > F<sub>α; k−1, n−k</sub> or p ≤ α", "=F.DIST.RT(F,k-1,n-k)"]] },
    { name: "Completing an ANOVA table", tag: "Exam skill",
      idea: `<p>Exam questions often give part of the table. Four relations fill in the rest.</p>`,
      steps: `<ol><li>SST = SSB + SSW (so any one follows from the other two).</li><li>df: k − 1, n − k, n − 1 (and df₁ + df₂ = n − 1).</li><li>MS = SS / df in each row (so SS = MS × df).</li><li>F = MSB / MSW.</li><li>Then F<sub>crit</sub> from the table and the decision.</li></ol>`,
      example: `<p>Given: SSB = 48, SST = 228, k = 4, n = 40.</p><ol><li>SSW = 228 − 48 = 180</li><li>df₁ = 3, df₂ = 36</li><li>MSB = 48 / 3 = 16; MSW = 180 / 36 = 5</li><li>F = 16 / 5 = <b class="num">3.20</b></li><li>F<sub>crit</sub>(0.05; 3, 36): no block 36, so use block 30 → 2.92. 3.20 &gt; 2.92 → reject H₀.</li></ol>`,
      watch: `<p>Check your table: the SS column and the df column must both add up to the total row.</p>`,
      keys: [["Fill a partial table", "SST = SSB + SSW · SS = MS × df · F = MSB / MSW", ""]] },
    { name: "After ANOVA", tag: "Interpretation",
      idea: `<p>Rejecting H₀ says that at least one mean differs, not which. <b>Post-hoc tests</b>, such as Tukey's test, compare the pairs of groups while keeping the overall error rate at α.</p>
        <p>Also check <b>practical significance</b>: with many students, a largest difference of 0.1 GPA points can be significant and still not matter.</p>`,
      example: `<p>In the study-method example, Group (16.6) and Solo (14.4) look most different, but only a post-hoc test can confirm which pairs differ significantly.</p>`,
      watch: `<p>Researcher A (30 students) and B (300 students) can see similar group means and still reach different conclusions: B's within-group mean square is estimated with far more df, and the same differences give a much larger F.</p>`,
      keys: [["After rejecting H₀", "post-hoc tests (e.g. Tukey) show which groups differ", ""]] }
  ],
  practice: [
    { key: "ss4", label: "Sums of squares", mode: "general", gen() {
      const R = anovaRaw(), o = R.o, ask = pick(["ssb", "ssw", "sst"]), ans = o[ask];
      return { q: `<p>GPA of students by study method:</p>${rawTable(R.names, R.groups)}<p>Find <b>${ask.toUpperCase()}</b> (2 decimals).</p>`, ans, dp: 2,
        steps: `<ol>${ssbSteps(o, R.groups)}${sswSteps(o, R.groups)}<li>SST = SSB + SSW = ${f(o.ssb, 3)} + ${f(o.ssw, 3)} = ${f(o.sst, 3)}</li><li>${ask.toUpperCase()} = <b class="num">${f(ans, 2)}</b></li></ol>` };
    } },
    { key: "fraw", label: "Full ANOVA from raw data", mode: "general", gen() {
      const R = anovaRaw(), o = R.o, a = 0.05, c = M.finv(0.95, o.df1, o.df2), ask = pick(["F", "F", "decide"]);
      const steps = `<ol>${ssbSteps(o, R.groups)}${sswSteps(o, R.groups)}<li>df₁ = ${o.k} − 1 = ${o.df1}, df₂ = ${o.n} − ${o.k} = ${o.df2}; MSB = ${f(o.ssb, 3)} / ${o.df1} = ${f(o.msb, 3)}; MSW = ${f(o.ssw, 3)} / ${o.df2} = ${f(o.msw, 3)}</li><li>F = ${f(o.msb, 3)} / ${f(o.msw, 3)} = ${f(o.F, 3)}</li><li>${fLook(0.95, o.df1, o.df2)}. ${o.F > c ? "F &gt; F<sub>crit</sub>: reject H₀" : "F &lt; F<sub>crit</sub>: fail to reject H₀"}; p = ${pFmt(o.p)}.</li></ol>${anovaTable(o)}`;
      if (ask === "decide") return { q: `<p>GPA of students by study method:</p>${rawTable(R.names, R.groups)}<p>Test at α = 0.05 whether the mean GPA differs between the methods. What is the decision?</p>`, ans: o.p <= a ? "Reject H₀" : "Fail to reject H₀", choices: ["Reject H₀", "Fail to reject H₀"],
        viz: { dist: "f", m: o.df1, n: o.df2, regions: [[c, 9999]], marks: [{ x: o.F, label: `F = ${f(o.F, 2)}` }] }, steps };
      return { q: `<p>GPA of students by study method:</p>${rawTable(R.names, R.groups)}<p>Compute the ANOVA <b>F statistic</b> (2 decimals).</p>`, ans: o.F, dp: 2, steps,
        viz: { dist: "f", m: o.df1, n: o.df2, regions: [[c, 9999]], marks: [{ x: o.F, label: `F = ${f(o.F, 2)}` }] } };
    } },
    { key: "partial", label: "Complete the ANOVA table", mode: "general", gen() {
      const k = ri(3, 5), per = pick([5, 6, 8, 10, 12]), n = k * per, df1 = k - 1, df2 = n - k, msw = rr(0.8, 6, 2), F = rr(0.6, 7, 2), msb = msw * F, ssb = msb * df1, ssw = msw * df2;
      const o = { k, n, df1, df2, ssb: +ssb.toFixed(2), ssw: +ssw.toFixed(2), msb: 0, msw: 0, F: 0, sst: 0 }; o.sst = +(o.ssb + o.ssw).toFixed(2); o.msb = o.ssb / df1; o.msw = o.ssw / df2; o.F = o.msb / o.msw;
      const v = pick([{ show: ["ssb", "sst"], ask: "F" }, { show: ["ssw", "sst"], ask: "msb" }, { show: ["ssb", "ssw"], ask: "F" }, { show: ["msb", "ssw"], ask: "ssb" }, { show: ["ssb", "sst"], ask: "msw" }]);
      const hide = ["ssb", "ssw", "sst", "msb", "msw", "F"].filter(x => !v.show.includes(x)), ans = o[v.ask], c = M.finv(0.95, df1, df2);
      const name = { F: "F", msb: "MSB", msw: "MSW", ssb: "SSB" }[v.ask];
      return { q: `<p>A one-way ANOVA compares the mean stress level of students in <b>k = ${k}</b> programmes, with <b>n = ${n}</b> students in total. Part of the output:</p>${anovaTable(o, hide)}<p>Find <b>${name}</b> (${v.ask === "F" ? 3 : 2} decimals).</p>`, ans, dp: v.ask === "F" ? 3 : 2,
        steps: `<ol><li>df₁ = k − 1 = ${df1}, df₂ = n − k = ${df2}, total = ${n - 1}.</li>${v.show.includes("sst") ? `<li>${v.show.includes("ssb") ? `SSW = SST − SSB = ${o.sst} − ${o.ssb} = ${f(o.ssw, 2)}` : `SSB = SST − SSW = ${o.sst} − ${o.ssw} = ${f(o.ssb, 2)}`}</li>` : v.show.includes("msb") ? `<li>SSB = MSB × df₁ = ${f(o.msb, 2)} × ${df1} = ${f(o.ssb, 2)}</li>` : ""}
          <li>MSB = SSB / df₁ = ${f(o.ssb, 2)} / ${df1} = ${f(o.msb, 3)}; MSW = SSW / df₂ = ${f(o.ssw, 2)} / ${df2} = ${f(o.msw, 3)}</li><li>F = MSB / MSW = ${f(o.F, 3)}</li><li>${name} = <b class="num">${f(ans, v.ask === "F" ? 3 : 2)}</b></li>
          <li>Decision at α = 0.05: ${fLook(0.95, df1, df2)}, so ${o.F > c ? "reject H₀" : "fail to reject H₀"}.</li></ol>${anovaTable(o)}` };
    } },
    { key: "decide4", label: "ANOVA decision", mode: "general", gen() {
      for (;;) { const k = ri(3, 6), n2 = pick([6, 8, 10, 12, 15, 20, 30, 60]), df1 = k - 1, a = pick([0.05, 0.05, 0.01, 0.10]), c = M.finv(1 - a, df1, n2), F = rr(0.5, c * 2, 2);
        if (Math.abs(F - c) < 0.1) continue; const p = 1 - M.fcdf(F, df1, n2), rej = F > c;
        return { q: `<p>A one-way ANOVA of GPA across <b>${k}</b> study methods with <b>n = ${n2 + k}</b> students gives <b>F = ${F}</b>. Decide at α = ${a}.</p>`, ans: rej ? "Reject H₀" : "Fail to reject H₀", choices: ["Reject H₀", "Fail to reject H₀"],
          viz: { dist: "f", m: df1, n: n2, regions: [[c, 9999]], marks: [{ x: F, label: `F = ${F}` }] },
          steps: `<ol><li>df₁ = ${df1}, df₂ = ${n2}. The test is right-tailed: area below F<sub>crit</sub> = ${g4(1 - a)}.</li><li>${fLook(1 - a, df1, n2)}. Decision rule: reject H₀ if F &gt; ${f(c, 2)}.</li><li>F = ${F} ${rej ? "&gt;" : "&lt;"} ${f(c, 2)}; p = ${pFmt(p)} ${rej ? "≤" : "&gt;"} ${a}.</li><li><b>${rej ? "Reject H₀" : "Fail to reject H₀"}</b>: ${rej ? "at least one study method has a different mean GPA (post-hoc tests would show which)." : "not enough evidence that the mean GPA differs between methods."}</li></ol>`, excel: `=F.DIST.RT(${F},${df1},${n2})` }; }
    } },
    { key: "pstate4", label: "p = 0.02: which is correct?", mode: "general", gen: pGen("A one-way ANOVA compares the mean GPA of Solo, Group and Hybrid studiers.", P4_RIGHT, P4_WRONG) },
    { key: "danova", label: "ANOVA on the dataset", mode: "data", gen() {
      const D = dAnova(), o = D.o, ask = pick(["F", "ssb", "decide"]), c = M.finv(0.95, o.df1, o.df2);
      const steps = `<ol><li>Dependent variable ${D.y.name}; factor ${COLS[D.fac]} with k = ${o.k} groups; n = 60.</li><li>Group means: ${D.levels.map((l, i) => `${l} ${f(o.means[i], 2)} (n = ${D.groups[i].length})`).join(" · ")}; grand mean ${f(o.grand, 3)}.</li>
        <li>SSB = Σ nⱼ(x̄ⱼ − x̄)² = ${f(o.ssb, 2)}; SSW = ${f(o.ssw, 2)}; SST = ${f(o.sst, 2)}</li><li>MSB = ${f(o.ssb, 2)} / ${o.df1} = ${f(o.msb, 3)}; MSW = ${f(o.ssw, 2)} / ${o.df2} = ${f(o.msw, 3)}; F = ${f(o.F, 3)}</li>
        <li>${fLook(0.95, o.df1, o.df2)}. p = ${pFmt(o.p)} → ${o.p <= 0.05 ? "reject H₀: at least one group mean differs" : "fail to reject H₀"}.</li></ol>`;
      if (ask === "decide") return { q: `<p>Does the mean <b>${D.y.name}</b> differ between the groups of <b>${COLS[D.fac]}</b> (${D.levels.join(", ")})? Run a one-way ANOVA at α = 0.05.</p>`, ans: o.p <= 0.05 ? "Reject H₀" : "Fail to reject H₀", choices: ["Reject H₀", "Fail to reject H₀"], steps,
        viz: { dist: "f", m: o.df1, n: o.df2, regions: [[c, 9999]], marks: [{ x: o.F, label: `F = ${f(o.F, 2)}` }] } };
      return { q: `<p>Run a one-way ANOVA of <b>${D.y.name}</b> by <b>${COLS[D.fac]}</b> (${D.levels.join(", ")}). Find <b>${ask === "F" ? "the F statistic" : "SSB"}</b> (2 decimals).</p>`, ans: ask === "F" ? o.F : o.ssb, dp: 2, steps, excel: "Data › Data Analysis › Anova: Single Factor (one column per group)" };
    } }
  ]
}
];

/* ========================================================================= WEEK 5 */
const chiOf = O => { const r = O.length, c = O[0].length, rs = O.map(row => M.sum(row)), cs = O[0].map((_, j) => M.sum(O.map(row => row[j]))), N = M.sum(rs);
  const E = O.map((row, i) => row.map((_, j) => rs[i] * cs[j] / N)), C = O.map((row, i) => row.map((o, j) => (o - E[i][j]) ** 2 / E[i][j])), chi2 = M.sum(C.flat()), df = (r - 1) * (c - 1);
  return { r, c, rs, cs, N, E, C, chi2, df, p: 1 - M.chi2cdf(chi2, df), minE: Math.min(...E.flat()) }; };
const ctTable = (rn, cn, X, o, dp = 0, hide = null) => `<div class="tablewrap"><table class="t"><thead><tr><th></th>${cn.map(c => `<th>${c}</th>`).join("")}${o ? "<th>Total</th>" : ""}</tr></thead><tbody>
  ${X.map((row, i) => `<tr><td>${rn[i]}</td>${row.map((v, j) => `<td class="m">${hide && hide[0] === i && hide[1] === j ? "?" : f(v, dp)}</td>`).join("")}${o ? `<td class="m">${o.rs[i]}</td>` : ""}</tr>`).join("")}
  ${o ? `<tr><td>Total</td>${o.cs.map(v => `<td class="m">${v}</td>`).join("")}<td class="m">${o.N}</td></tr>` : ""}</tbody></table></div>`;
const CT_CTX = [
  { rv: "Study method", rows: ["Solo", "Group", "Hybrid"], cv: "GPA category", cols: ["Low", "Medium", "High"] },
  { rv: "Sleep quality", rows: ["Poor", "Good"], cv: "Stress level", cols: ["Low", "Medium", "High"] },
  { rv: "Gender", rows: ["Female", "Male"], cv: "Extracurricular activities", cols: ["Yes", "No"] },
  { rv: "Class attendance", rows: ["Regular", "Irregular"], cv: "GPA category", cols: ["Low", "Medium", "High"] },
  { rv: "Study method", rows: ["Solo", "Group", "Hybrid"], cv: "Part-time job", cols: ["Yes", "No"] }
];
/* a random contingency table with every expected count ≥ 5 */
const ctRandom = () => { for (;;) { const C = pick(CT_CTX), r = C.rows.length, c = C.cols.length, base = [...Array(c)].map(() => rr(0.6, 1.4, 2)), str = pick([0, 0.15, 0.3, 0.5]);
  const O = C.rows.map(() => { const tot = ri(25, 90), w = base.map(b => Math.max(0.15, b * (1 + str * (Math.random() * 2 - 1)))), sw = M.sum(w); const row = w.map(x => Math.round(tot * x / sw)); return row; });
  const o = chiOf(O); if (o.minE >= 5 && O.flat().every(v => v > 0)) return { C, O, o }; } };
const expSteps = (o, i, j, rn, cn) => `E = (row total × column total) / grand total = ${o.rs[i]} × ${o.cs[j]} / ${o.N} = <b class="num">${f(o.E[i][j], 2)}</b> (${rn[i]}, ${cn[j]})`;
const CHI_TF = [
  ["H₀ of the χ² test of independence says the two variables are independent.", true, "H₀: independent; H₁: associated."],
  ["Expected frequencies are the counts we would expect if H₀ (independence) were true.", true, "E = row total × column total / grand total."],
  ["A large χ² statistic is evidence against independence.", true, "It means the observed counts are far from the expected ones."],
  ["The χ² test of independence is two-tailed.", false, "It is always right-tailed: only large χ² values count against H₀."],
  ["χ² can be negative when the observed count is below the expected count.", false, "Each term (O − E)² / E is squared, so χ² ≥ 0."],
  ["A significant χ² proves that one variable causes the other.", false, "It shows an association, not causation."],
  ["A large χ² always means a strong relationship.", false, "χ² also grows with n: the same percentages in a sample ten times larger give a χ² ten times larger."],
  ["A rule of thumb is that every expected frequency should be at least 5.", true, "Otherwise the χ² approximation is unreliable."],
  ["df = (r − 1)(c − 1) for a table with r rows and c columns.", true, "That is the number of cells that can vary freely once the totals are fixed."],
  ["Failing to reject H₀ proves the variables are completely unrelated.", false, "It only means there is not enough evidence of an association."]
];
const WHICH_TEST = [
  { q: "Is study method (Solo / Group / Hybrid) associated with GPA category (Low / Medium / High)?", a: "Chi-square test of independence", why: "Both variables are categorical." },
  { q: "Does mean GPA differ between Solo, Group and Hybrid studiers?", a: "One-way ANOVA", why: "GPA is metric and study method is a categorical factor with 3 groups." },
  { q: "Do students who study more hours per day have a higher GPA?", a: "Simple linear regression", why: "Both variables are metric." },
  { q: "Is the share of students with a part-time job different for men and women?", a: "Chi-square test of independence", why: "Gender and part-time job (yes/no) are both categorical." },
  { q: "Does mean sleep duration differ between students with low, medium and high stress?", a: "One-way ANOVA", why: "Sleep duration is metric; stress category is a categorical factor." },
  { q: "Is sleep quality (Poor / Good) related to stress level category (Low / Medium / High)?", a: "Chi-square test of independence", why: "Both variables are categorical." },
  { q: "Is the mean GPA of all Nova SBE students different from 15?", a: "One-sample t test", why: "One metric variable compared with a claimed value; σ unknown." },
  { q: "Does class attendance (%) help predict GPA?", a: "Simple linear regression", why: "Both variables are metric." }
].map(b => ({ ...b, w: ["Chi-square test of independence", "One-way ANOVA", "Simple linear regression", "One-sample t test"].filter(x => x !== b.a) }));
const P5_RIGHT = [["The result is significant at the 5% level.", "0.02 ≤ 0.05."], ["The variables may be associated.", "Rejecting independence means there is evidence of an association."]];
const P5_WRONG = [["There is a 2% probability that H₀ is true.", "The p-value assumes H₀ is true."], ["The analysis proves that study method causes GPA category.", "Association is not causation."],
  ["The relationship must be strong, because χ² is large.", "χ² also grows with n; it does not measure strength."], ["Failing to reject would prove the variables are completely unrelated.", "Fail to reject never proves H₀."], ["The result is significant at the 1% level.", "0.02 &gt; 0.01."]];
const DCT = [[5, 4], [2, 4], [4, 10], [2, 10], [3, 4], [3, 10]];
const dCt = () => { const [a, b] = pick(DCT), rows = CATS[a].filter(x => x !== "Non-binary"), cols = b === 10 ? ["Pass", "Fail"] : CATS[b].filter(x => x !== "Non-binary");
  const O = rows.map(rv => cols.map(cv => RAW.filter(r => r[a] === rv && r[b] === cv).length)); return { a, b, rows, cols, O, o: chiOf(O) }; };
const dCtNote = D => `${D.a === 2 || D.b === 2 ? "The one non-binary student is left out, so n = 59. " : ""}${D.o.minE < 5 ? `Careful: the smallest expected count is ${f(D.o.minE, 2)} &lt; 5, so the χ² approximation is doubtful here.` : "All expected counts are at least 5."}`;

const WEEK5_PARTS = [
/* ------------------------------------------------------------- Part 1 */
{
  title: "Contingency tables and independence", table: "chi-square",
  intro: "When both variables are categorical there are no means to compare. Instead we count: how many students fall into each combination of categories? This part reads such tables and states what independence means.",
  buildsOn: "qualitative variables (Week 1) and the testing procedure (Week 3)",
  bridge: "Test it: the χ² test",
  summary: [
    "Contingency analysis applies when <b>both</b> variables are <b>categorical</b>.",
    "A contingency table shows counts per cell, with row totals, column totals and the grand total. Row percentages compare the rows.",
    "<b>Independent</b>: the distribution of one variable is the same in every category of the other.",
    "H₀: the variables are independent. H₁: the variables are associated."
  ],
  concepts: [
    { name: "When both variables are categorical", tag: "Method",
      idea: `<p>Contingency analysis (the χ² test of independence) checks whether two <b>categorical</b> variables are related.</p>`,
      example: `<ul><li>Study method (Solo / Group / Hybrid) × GPA category (Low / Medium / High)</li><li>Sleep quality × stress level category</li><li>Gender × extracurricular participation (yes / no)</li></ul>
        <p>Compare: ANOVA needs a metric dependent variable (mean GPA by study method); regression needs two metric variables.</p>`,
      watch: `<p>The same idea can be measured two ways: GPA (metric) by study method → ANOVA; GPA <b>category</b> by study method → χ².</p>`,
      keys: [["When contingency analysis", "both variables categorical", ""]] },
    { name: "Reading a contingency table", tag: "Table",
      idea: `<p>Each <b>cell</b> counts the students with one combination of categories. The <b>row totals</b> and <b>column totals</b> are the distributions of each variable on its own; the <b>grand total</b> is n.</p>`,
      formula: `<div class="formula"><div class="fb">row % = ${fr("cell count", "row total")} × 100</div><span class="fn">compares the rows · column % = cell / column total</span></div>`,
      example: `<p>200 students, study method × GPA category:</p>${ctTable(["Solo", "Group", "Hybrid"], ["Low", "Medium", "High"], [[20, 30, 10], [10, 25, 25], [15, 20, 45]], chiOf([[20, 30, 10], [10, 25, 25], [15, 20, 45]]))}
        <ul><li>Share with a High GPA: Solo 10 / 60 = 16.7%, Group 25 / 60 = 41.7%, Hybrid 45 / 80 = 56.3%.</li><li>Overall: 80 / 200 = 40%.</li></ul>`,
      watch: `<p>Percentages show a pattern, but a pattern can also be random variation. Only the test (next part) says whether it is too large to be chance.</p>`,
      keys: [["Row percentage", `${fr("cell", "row total")} × 100`, ""]] },
    { name: "Independence", tag: "Concept",
      idea: `<p>Two categorical variables are <b>independent</b> if the distribution of one is the same in every category of the other. For study method and GPA category: the share of High-GPA students would be the same for Solo, Group and Hybrid studiers.</p>`,
      example: `<p>If 40% of all students have a High GPA and the variables are independent, we would expect about 40% High GPAs in every study method: 24 of the 60 Solo studiers, 24 of the 60 Group studiers and 32 of the 80 Hybrid studiers.</p>`,
      watch: `<p>In a sample the shares will never be exactly equal, even under independence. The question is whether they differ more than chance would explain.</p>`,
      keys: [["Independence", "same distribution of one variable in every category of the other", ""]] },
    { name: "Hypotheses", tag: "Hypotheses",
      idea: `<p>H₀ is the "no relationship" claim, as always.</p>`,
      formula: `<div class="formula"><div class="fb">H₀: the variables are independent</div></div> <div class="formula"><div class="fb">H₁: the variables are associated</div></div>`,
      example: `<p>H₀: study method and GPA category are independent (the share in each GPA category is the same for every method). H₁: study method and GPA category are associated.</p>`,
      watch: `<p>The hypotheses are in words, not about μ. There is no direction (no left/right tail in H₁), but the test itself is right-tailed.</p>`,
      keys: [["χ² hypotheses", "H₀: independent · H₁: associated", ""]] }
  ],
  practice: [
    { key: "rowpct", label: "Row or column percentage", mode: "general", gen() {
      const { C, O, o } = ctRandom(), i = ri(0, o.r - 1), j = ri(0, o.c - 1), byRow = Math.random() < 0.65, ans = 100 * O[i][j] / (byRow ? o.rs[i] : o.cs[j]);
      return { q: `<p>${C.rv} × ${C.cv} for a sample of ${o.N} students:</p>${ctTable(C.rows, C.cols, O, o)}<p>${byRow ? `What percentage of the <b>${C.rows[i]}</b> students have ${C.cv.toLowerCase()} = <b>${C.cols[j]}</b>?` : `What percentage of the students with ${C.cv.toLowerCase()} = <b>${C.cols[j]}</b> are <b>${C.rows[i]}</b>?`} (1 decimal, in %)</p>`, ans, dp: 1,
        steps: `<ol><li>${byRow ? `Divide by the row total of ${C.rows[i]}: ${O[i][j]} / ${o.rs[i]}` : `Divide by the column total of ${C.cols[j]}: ${O[i][j]} / ${o.cs[j]}`}</li><li>= <b class="num">${f(ans, 1)}%</b></li></ol>` };
    } },
    { key: "whichtest", label: "Which test?", mode: "general", gen: mcGen(WHICH_TEST) },
    { key: "chitf1", label: "Independence: true or false", mode: "general", gen: tfGen(CHI_TF.slice(0, 2).concat(CHI_TF.slice(5, 7)).concat([
      ["If 40% of all students have a High GPA and the variables are independent, about 40% of Solo studiers should have a High GPA.", true, "Independence means the same distribution in every row."],
      ["Contingency analysis can be used when one variable is GPA measured on the 0–20 scale.", false, "GPA as a number is metric; for a metric variable by groups use ANOVA."],
      ["A column percentage divides the cell count by its column total.", true, "Row % uses the row total, column % the column total."]])) },
    { key: "dcount", label: "Cross-tabulate the dataset", mode: "data", gen() {
      const D = dCt(), i = ri(0, D.rows.length - 1), j = ri(0, D.cols.length - 1), pct = Math.random() < 0.5, ans = pct ? 100 * D.O[i][j] / D.o.rs[i] : D.O[i][j];
      return { q: `<p>Cross-tabulate <b>${COLS[D.a]}</b> (rows) by <b>${COLS[D.b]}</b> (columns). ${pct ? `What percentage of the <b>${D.rows[i]}</b> students have ${COLS[D.b]} = <b>${D.cols[j]}</b>? (1 decimal)` : `How many students have ${COLS[D.a]} = <b>${D.rows[i]}</b> and ${COLS[D.b]} = <b>${D.cols[j]}</b>?`}</p>`, ans, dp: pct ? 1 : 0,
        steps: `<ol><li>The contingency table:</li></ol>${ctTable(D.rows, D.cols, D.O, D.o)}<ol start="2"><li>${pct ? `${D.O[i][j]} / ${D.o.rs[i]} = <b class="num">${f(ans, 1)}%</b>` : `Cell (${D.rows[i]}, ${D.cols[j]}): <b class="num">${ans}</b>`}</li></ol>`,
        excel: `=COUNTIFS(${LETTERS[D.a]}2:${LETTERS[D.a]}61,"${D.rows[i]}",${LETTERS[D.b]}2:${LETTERS[D.b]}61,"${D.cols[j]}")` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 2 */
{
  title: "The chi-square test of independence", table: "chi-square",
  intro: "The test compares what we observe in each cell with what we would expect if the variables were independent. The bigger the gaps, the larger χ², and the stronger the evidence of an association.",
  buildsOn: "contingency tables (Part 1) and the χ² table (Week 1)",
  summary: [
    "Expected frequency: Eᵢⱼ = row totalᵢ × column totalⱼ / grand total.",
    "χ² = Σ (O − E)² / E over all cells. O ≈ E gives a small χ²; a large χ² is evidence against independence. Always right-tailed.",
    "df = (r − 1)(c − 1). Reject H₀ if χ² &gt; χ²<sub>α, df</sub> (course table column 1 − α) or p ≤ α.",
    "Assumptions: random sample; every expected frequency ≥ 5 (rule of thumb).",
    "Rejecting H₀ shows an <b>association</b>, not causation and not its strength."
  ],
  concepts: [
    { name: "Expected frequencies", tag: "Computation",
      idea: `<p>The expected frequency E of a cell is the count we would expect if H₀ (independence) were true: the row's share of the column total.</p>`,
      formula: `<div class="formula"><div class="fb">Eᵢⱼ = ${fr("row totalᵢ × column totalⱼ", "grand total")}</div></div>`,
      example: `<p>Study method × GPA category (n = 200). Solo–Low: 60 × 45 / 200 = <b class="num">13.5</b>. All expected counts:</p>${ctTable(["Solo", "Group", "Hybrid"], ["Low", "Medium", "High"], [[13.5, 22.5, 24], [13.5, 22.5, 24], [18, 30, 32]], null, 1)}
        <p>Each row of E has the same shape as the overall column totals (45 : 75 : 80), which is exactly what independence means.</p>`,
      watch: `<p>The expected counts have the same row and column totals as the observed table. That is a quick check of your calculation.</p>`,
      keys: [["Expected frequency", `Eᵢⱼ = ${fr("row total × column total", "grand total")}`, ""]] },
    { name: "The χ² statistic", tag: "Statistic",
      idea: `<p>χ² adds up the squared, standardised gaps between observed and expected counts. If O ≈ E everywhere, χ² is small. A large χ² means the data are far from what independence predicts.</p>`,
      formula: `<div class="formula"><div class="fb">χ² = Σ ${fr("(O − E)²", "E")}</div><span class="fn">sum over all r × c cells</span></div>`,
      steps: `<ol><li>For each cell: (O − E)², divided by E.</li><li>Add all cells.</li></ol>`,
      example: `<p>Solo–Low: (20 − 13.5)² / 13.5 = 3.13. Solo–High: (10 − 24)² / 24 = 8.17. Adding all nine cells gives <b class="num">χ² = 24.14</b>.</p>`,
      watch: `<p>Divide by E, not by O. And use the counts, never the percentages.</p>`,
      keys: [["χ² statistic", `χ² = Σ ${fr("(O − E)²", "E")}`, "=CHISQ.TEST(observed,expected) gives the p-value"]] },
    { name: "Degrees of freedom and critical value", tag: "Table",
      idea: `<p>The χ² distribution is right-skewed, takes only positive values, and its shape depends on df. For an r × c table, df = (r − 1)(c − 1).</p>`,
      formula: `<div class="formula"><div class="fb">df = (r − 1)(c − 1)</div></div>`,
      steps: `<ol><li>df = (r − 1)(c − 1).</li><li>The test is right-tailed: the course χ²-table column is 1 − α (0.950 for α = 0.05).</li><li>Decision rule: reject H₀ if χ² &gt; χ²<sub>crit</sub>.</li></ol>`,
      example: `<ul><li>3 × 3 table: df = 2 × 2 = 4 → row 4, column 0.950 → <b class="num">9.488</b>.</li><li>4 study methods × 3 GPA categories: df = 3 × 2 = 6 → <b class="num">12.592</b>.</li></ul>`,
      watch: `<p>More df → larger critical value. A bigger table needs a bigger χ² to be significant.</p>`,
      widgets: ["chi2explorer"],
      keys: [["χ² degrees of freedom", "df = (r − 1)(c − 1)", ""], ["χ² critical value", "row df, column 1 − α of the course table", "=CHISQ.INV(1-alpha,df)"]] },
    { name: "The full test", tag: "Decision",
      idea: `<p>The same seven-step procedure as every test in the course.</p>`,
      steps: `<ol><li>Identify the two categorical variables; build the table with totals.</li><li>H₀: independent; H₁: associated. Choose α.</li><li>Compute E for every cell.</li><li>Compute χ².</li><li>df = (r − 1)(c − 1); find χ²<sub>crit</sub> and/or the p-value.</li><li>Decide; conclude in context (association, not causation).</li></ol>`,
      example: `<p>Is study method associated with GPA category? n = 200, α = 0.05.</p><ol><li>χ² = 24.14, df = 4, χ²<sub>crit</sub> = 9.488</li><li>24.14 &gt; 9.488 → reject H₀. p ≈ 0.00007 (in the table, 24.14 is beyond the 0.995 column, 14.860, so p &lt; 0.005).</li><li>Study method and GPA category are associated at the 5% level. This does not mean the study method <b>causes</b> a higher GPA.</li></ol>`,
      watch: `<p>The p-value from the course table can only be bracketed between two columns; Excel's ${xl("=CHISQ.DIST.RT(x,df)")} gives it exactly.</p>`,
      keys: [["χ² decision", "reject H₀ if χ² > χ²<sub>α, df</sub> or p ≤ α", "=CHISQ.DIST.RT(chi2,df)"]] },
    { name: "Assumptions and interpretation", tag: "Interpretation",
      idea: `<ul><li><b>Random sample</b>, each student counted once.</li><li><b>Expected counts large enough</b>: rule of thumb E ≥ 5 in every cell. If not, merge categories or collect more data.</li></ul>`,
      example: `<ul><li><b>Association ≠ causation</b>: Hybrid studiers may have higher GPAs because motivated students choose that method.</li><li><b>Significance ≠ strength</b>: multiply every count by 10 and the percentages stay the same, but χ² becomes 10 times larger. With 500 students tiny differences become significant; with 50 a real association can be missed (Type II error).</li></ul>`,
      watch: `<p>Check E ≥ 5 on the <b>expected</b> counts, not the observed ones.</p>`,
      keys: [["χ² assumptions", "random sample · every expected count ≥ 5", ""]] },
    { name: "ANOVA or contingency analysis?", tag: "Method",
      idea: `<p>Both ask whether groups differ, but on different kinds of data.</p>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th></th><th>ANOVA</th><th>Contingency analysis</th></tr></thead><tbody>
        <tr><td>Dependent variable</td><td>metric (GPA 0–20)</td><td>categorical (GPA category)</td></tr><tr><td>Compares</td><td>group means</td><td>distributions of counts</td></tr>
        <tr><td>Statistic</td><td>F = MSB / MSW</td><td>χ² = Σ (O − E)² / E</td></tr><tr><td>df</td><td>k − 1 and n − k</td><td>(r − 1)(c − 1)</td></tr><tr><td>Table</td><td>F-Snedecor</td><td>Chi-square</td></tr></tbody></table></div>`,
      watch: `<p>Both tests are right-tailed and both say only that a difference exists, not where it is or why.</p>`,
      keys: [] }
  ],
  practice: [
    { key: "expf", label: "Expected frequency", mode: "general", gen() {
      const { C, O, o } = ctRandom(), i = ri(0, o.r - 1), j = ri(0, o.c - 1);
      return { q: `<p>${C.rv} × ${C.cv}:</p>${ctTable(C.rows, C.cols, O, o)}<p>Find the <b>expected frequency</b> of the cell (${C.rows[i]}, ${C.cols[j]}) under independence (2 decimals).</p>`, ans: o.E[i][j], dp: 2,
        steps: `<ol><li>${expSteps(o, i, j, C.rows, C.cols)}</li><li>Observed: ${O[i][j]}. ${O[i][j] > o.E[i][j] ? "More" : "Fewer"} students than independence predicts.</li></ol>` };
    } },
    { key: "contrib", label: "Contribution of one cell", mode: "general", gen() {
      const { C, O, o } = ctRandom(), i = ri(0, o.r - 1), j = ri(0, o.c - 1), e2 = +o.E[i][j].toFixed(2), ans = (O[i][j] - o.E[i][j]) ** 2 / o.E[i][j];
      return { q: `<p>${C.rv} × ${C.cv}:</p>${ctTable(C.rows, C.cols, O, o)}<p>Compute the cell's contribution (O − E)² / E to χ² for (${C.rows[i]}, ${C.cols[j]}) (3 decimals).</p>`, ans, dp: 3, alts: [(O[i][j] - e2) ** 2 / e2],
        steps: `<ol><li>${expSteps(o, i, j, C.rows, C.cols)}</li><li>(O − E)² / E = (${O[i][j]} − ${f(o.E[i][j], 2)})² / ${f(o.E[i][j], 2)} = <b class="num">${f(ans, 3)}</b></li></ol>` };
    } },
    { key: "chi2stat", label: "χ² statistic", mode: "general", gen() {
      let R; do R = ctRandom(); while (R.o.r * R.o.c > 6);
      const { C, O, o } = R;
      return { q: `<p>${C.rv} × ${C.cv}:</p>${ctTable(C.rows, C.cols, O, o)}<p>Compute the <b>χ² statistic</b> of the test of independence (2 decimals).</p>`, ans: o.chi2, dp: 2,
        steps: `<ol><li>Expected counts (row total × column total / ${o.N}):</li></ol>${ctTable(C.rows, C.cols, o.E, null, 2)}<ol start="2"><li>Contributions (O − E)² / E:</li></ol>${ctTable(C.rows, C.cols, o.C, null, 3)}<ol start="3"><li>χ² = sum of all contributions = <b class="num">${f(o.chi2, 2)}</b>, with df = (${o.r} − 1)(${o.c} − 1) = ${o.df}.</li></ol>` };
    } },
    { key: "chidf", label: "Degrees of freedom", mode: "general", gen() {
      const r = ri(2, 5), c = ri(2, 5);
      return { q: `<p>A contingency table crosses one variable with <b>${r}</b> categories (rows) and another with <b>${c}</b> categories (columns). Find the degrees of freedom of the χ² test.</p>`, ans: (r - 1) * (c - 1), dp: 0,
        steps: `<ol><li>df = (r − 1)(c − 1) = (${r} − 1)(${c} − 1) = <b class="num">${(r - 1) * (c - 1)}</b></li></ol>` };
    } },
    { key: "chicrit", label: "Critical χ² value", mode: "general", gen() {
      const r = ri(2, 5), c = ri(2, 4), df = (r - 1) * (c - 1), a = pick([0.05, 0.05, 0.01, 0.10]), col = 1 - a, ans = M.chi2inv(col, df);
      return { q: `<p>A χ² test of independence on a <b>${r} × ${c}</b> table at α = ${a}. Find the critical value (3 decimals).</p>`, ans, dp: 3,
        viz: { dist: "chi2", df, regions: [[ans, 9999]], marks: [{ x: ans, label: `χ² crit = ${f(ans, 3)}` }] },
        steps: `<ol><li>df = (${r} − 1)(${c} − 1) = ${df}.</li><li>Right-tailed: area below = 1 − α = ${g4(col)}.</li><li>${chiLook(col, df)}</li></ol>`, excel: `=CHISQ.INV(${g4(col)},${df})` };
    } },
    { key: "decide5", label: "χ² decision", mode: "general", gen() {
      for (;;) { const { C, O, o } = ctRandom(), a = pick([0.05, 0.05, 0.01, 0.10]), c = M.chi2inv(1 - a, o.df); if (Math.abs(o.chi2 - c) < 0.15) continue; const rej = o.chi2 > c;
        return { q: `<p>${C.rv} × ${C.cv}:</p>${ctTable(C.rows, C.cols, O, o)}<p>The test of independence gives <b>χ² = ${f(o.chi2, 2)}</b>. Decide at α = ${a}.</p>`, ans: rej ? "Reject H₀" : "Fail to reject H₀", choices: ["Reject H₀", "Fail to reject H₀"],
          viz: { dist: "chi2", df: o.df, regions: [[c, 9999]], marks: [{ x: o.chi2, label: `χ² = ${f(o.chi2, 2)}` }] },
          steps: `<ol><li>df = (${o.r} − 1)(${o.c} − 1) = ${o.df}; ${chiLook(1 - a, o.df)}.</li><li>Decision rule: reject H₀ if χ² &gt; ${f(c, 3)}. χ² = ${f(o.chi2, 2)} ${rej ? "&gt;" : "&lt;"} ${f(c, 3)}; p = ${pFmt(o.p)}.</li><li><b>${rej ? "Reject H₀" : "Fail to reject H₀"}</b>: ${rej ? `${C.rv.toLowerCase()} and ${C.cv.toLowerCase()} are associated (not necessarily causally)` : `not enough evidence of an association between ${C.rv.toLowerCase()} and ${C.cv.toLowerCase()}`}.</li></ol>`, excel: `=CHISQ.DIST.RT(${fx(o.chi2, 2)},${o.df})` }; }
    } },
    { key: "chitf2", label: "χ² test: true or false", mode: "general", gen: tfGen(CHI_TF) },
    { key: "pstate5", label: "p = 0.02: which is correct?", mode: "general", gen: pGen("A χ² test of independence of study method and GPA category is carried out.", P5_RIGHT, P5_WRONG) },
    { key: "dexp", label: "Expected count in the dataset", mode: "data", gen() {
      const D = dCt(), i = ri(0, D.rows.length - 1), j = ri(0, D.cols.length - 1);
      return { q: `<p>Cross-tabulate <b>${COLS[D.a]}</b> by <b>${COLS[D.b]}</b>. Find the expected count of (${D.rows[i]}, ${D.cols[j]}) under independence (2 decimals).</p>`, ans: D.o.E[i][j], dp: 2,
        steps: `<ol><li>Observed table:</li></ol>${ctTable(D.rows, D.cols, D.O, D.o)}<ol start="2"><li>${expSteps(D.o, i, j, D.rows, D.cols)}</li><li>${dCtNote(D)}</li></ol>` };
    } },
    { key: "dchi", label: "χ² test on the dataset", mode: "data", gen() {
      const D = dCt(), o = D.o, ask = pick(["chi", "decide"]), c = M.chi2inv(0.95, o.df);
      const steps = `<ol><li>Observed table:</li></ol>${ctTable(D.rows, D.cols, D.O, o)}<ol start="2"><li>Expected counts:</li></ol>${ctTable(D.rows, D.cols, o.E, null, 2)}<ol start="3"><li>χ² = Σ (O − E)² / E = ${f(o.chi2, 3)}, df = ${o.df}.</li><li>${chiLook(0.95, o.df)}; p = ${pFmt(o.p)} → ${o.p <= 0.05 ? "reject H₀: the variables are associated" : "fail to reject H₀"}.</li><li>${dCtNote(D)}</li></ol>`;
      if (ask === "decide") return { q: `<p>Are <b>${COLS[D.a]}</b> and <b>${COLS[D.b]}</b> associated? Run a χ² test of independence at α = 0.05.</p>`, ans: o.p <= 0.05 ? "Reject H₀" : "Fail to reject H₀", choices: ["Reject H₀", "Fail to reject H₀"], steps,
        viz: { dist: "chi2", df: o.df, regions: [[c, 9999]], marks: [{ x: o.chi2, label: `χ² = ${f(o.chi2, 2)}` }] } };
      return { q: `<p>Run a χ² test of independence of <b>${COLS[D.a]}</b> and <b>${COLS[D.b]}</b>. Find the χ² statistic (2 decimals).</p>`, ans: o.chi2, dp: 2, steps, excel: "p-value: =CHISQ.TEST(observed range, expected range)" };
    } }
  ]
}
];

/* ========================================================================= WEEK 6 */
const regOf = (X, Y) => { const n = X.length, mx = M.mean(X), my = M.mean(Y); let sxy = 0; X.forEach((x, i) => { sxy += (x - mx) * (Y[i] - my); });
  const sxx = M.ss(X), sst = M.ss(Y), b1 = sxy / sxx, b0 = my - b1 * mx, ssr = b1 * sxy, sse = Math.max(0, sst - ssr), seb = Math.sqrt(sse / (n - 2) / sxx), t = b1 / seb;
  const se = Math.sqrt(sse / (n - 2)), seb0 = se * Math.sqrt(1 / n + mx * mx / sxx);
  return { n, mx, my, sxy, sxx, sst, ssr, sse, b1, b0, R2: ssr / sst, r: sxy / Math.sqrt(sxx * sst), seb, t, p: 2 * (1 - M.tcdf(Math.abs(t), n - 2)), se, seb0, p0: 2 * (1 - M.tcdf(Math.abs(b0 / seb0), n - 2)) }; };
const regRaw = () => { for (;;) { const n = ri(5, 8), X = [...Array(n)].map(() => ri(1, 9)).sort((a, b) => a - b), b0 = ri(8, 12), b1 = pick([0.5, 0.6, 0.75, 0.8, 1, 1.2]);
  const Y = X.map(x => clamp(Math.round(b0 + b1 * x + ri(-2, 2) * 0.5), 6, 20)), o = regOf(X, Y); if (new Set(X).size >= 3 && o.sst > 0 && o.sse > 0) return { X, Y, o }; } };
const xyTable = (X, Y, xl1 = "X = study hours/day", yl = "Y = GPA") => `<div class="tablewrap"><table class="t"><tbody><tr><th>${xl1}</th>${X.map(x => `<td class="m">${x}</td>`).join("")}</tr><tr><th>${yl}</th>${Y.map(y => `<td class="m">${y}</td>`).join("")}</tr></tbody></table></div>`;
const lsSteps = (X, Y, o) => `<li>x̄ = ${g4(o.mx)}, ȳ = ${g4(o.my)}</li><li>Σ(x − x̄)(y − ȳ) = ${f(o.sxy, 3)}; Σ(x − x̄)² = ${f(o.sxx, 3)}</li><li>b₁ = ${f(o.sxy, 3)} / ${f(o.sxx, 3)} = ${f(o.b1, 4)}</li><li>b₀ = ȳ − b₁x̄ = ${g4(o.my)} − ${f(o.b1, 4)} × ${g4(o.mx)} = ${f(o.b0, 4)}</li>`;
const regOut = (o, xn = "Study hours") => `<div class="tablewrap"><table class="t"><thead><tr><th colspan="2">Regression statistics</th></tr></thead><tbody>
    <tr><td>Multiple R</td><td class="m">${f(Math.abs(o.r), 4)}</td></tr><tr><td>R Square</td><td class="m">${f(o.R2, 4)}</td></tr><tr><td>Standard Error</td><td class="m">${f(o.se, 4)}</td></tr><tr><td>Observations</td><td class="m">${o.n}</td></tr></tbody></table></div>
  <div class="tablewrap"><table class="t"><thead><tr><th></th><th>Coefficients</th><th>Standard Error</th><th>t Stat</th><th>P-value</th></tr></thead><tbody>
    <tr><td>Intercept</td><td class="m">${f(o.b0, 4)}</td><td class="m">${f(o.seb0, 4)}</td><td class="m">${f(o.b0 / o.seb0, 3)}</td><td class="m">${f(o.p0, 4)}</td></tr>
    <tr><td>${xn}</td><td class="m">${f(o.b1, 4)}</td><td class="m">${f(o.seb, 4)}</td><td class="m">${f(o.t, 3)}</td><td class="m">${f(o.p, 4)}</td></tr></tbody></table></div>`;
/* a synthetic Excel-style output with every number consistent */
const regSynth = () => { const C = pick([["Study hours/day", "h", 1, 9], ["Sleep hours/night", "h", 5, 9], ["Attendance", "%", 50, 100]]), n = pick([20, 25, 30, 40, 50, 60]), mx = (C[2] + C[3]) / 2, sdx = (C[3] - C[2]) / 4;
  const b1 = C[1] === "%" ? rr(0.02, 0.09, 3) : rr(0.2, 1.1, 2), b0 = +(15 - b1 * mx + rr(-1, 1, 1)).toFixed(2), R2 = rr(0.08, 0.75, 2), sxx = sdx * sdx * (n - 1), ssr = b1 * b1 * sxx, sst = ssr / R2, sse = sst - ssr, se = Math.sqrt(sse / (n - 2)), seb = se / Math.sqrt(sxx);
  const t = b1 / seb, seb0 = se * Math.sqrt(1 / n + mx * mx / sxx);
  return { C, o: { n, b0, b1, R2, r: Math.sqrt(R2), se, seb, t, p: 2 * (1 - M.tcdf(t, n - 2)), seb0, p0: 2 * (1 - M.tcdf(Math.abs(b0 / seb0), n - 2)), sst, ssr, sse, mx } }; };
const REG_INTERP = [
  { q: "GPA = 10 + 0.8 × Study hours (per day). What does the slope 0.8 mean?", a: "Each extra hour of daily study is associated with a GPA that is 0.8 points higher on average", w: ["Students who study 1 hour have a GPA of 0.8", "80% of the variation in GPA is explained by study hours", "Studying one more hour causes the GPA to rise by exactly 0.8 for every student"], why: "The slope is the expected change in Y for a one-unit increase in X: an average association, not a guaranteed effect for each student, and not proof of causation." },
  { q: "GPA = 10 + 0.8 × Study hours (per day). What does the intercept 10 mean?", a: "The predicted GPA of a student who studies 0 hours per day", w: ["The average GPA of all students", "The GPA rises by 10 points per hour", "The smallest GPA in the data"], why: "The intercept is the predicted Y when X = 0. Interpret it with care: it only makes sense if X = 0 is realistic and inside the data range." },
  { q: "Stress = 9.5 − 0.6 × Sleep hours. What does the slope tell you?", a: "Each extra hour of sleep is associated with a stress score 0.6 points lower on average", w: ["Each extra hour of sleep raises stress by 0.6 points", "Students who sleep 0.6 hours have a stress score of 9.5", "60% of stress is explained by sleep"], why: "A negative slope means a negative relationship: Y falls by 0.6 on average when X rises by one unit." },
  { q: "A regression of GPA on study hours gives R² = 0.60. What does it mean?", a: "60% of the variation in GPA is explained by study hours; 40% is not", w: ["60% of the predictions are correct", "The correlation r is 0.60", "Studying explains 60% of a student's GPA points"], why: "R² is the share of the variation in Y explained by X. Here r = √0.60 ≈ 0.77, not 0.60." },
  { q: "The model predicts a GPA of 15.5 for a student who studies 6 h/day, but her actual GPA is 16.2. What is the 0.7 difference?", a: "A residual: observed minus predicted", w: ["A mistake in the model, so the model is useless", "The slope of the line", "The intercept"], why: "Residual e = Y − Ŷ = 16.2 − 15.5 = 0.7. Other factors affect GPA too, so predictions are estimates, not exact values." },
  { q: "Correlation between study hours and GPA is r = 0. What can you conclude?", a: "There is no linear relationship (there could still be a non-linear one)", w: ["There is no relationship of any kind", "Study hours cause GPA to stay constant", "The slope is 1"], why: "r measures only the linear relationship. A curved pattern can have r ≈ 0." },
  { q: "The data cover students studying 1 to 8 h/day. You use the line to predict the GPA of a student who studies 14 h/day. What is the problem?", a: "Extrapolation: the prediction is outside the observed X range and unreliable", w: ["There is no problem: the line goes on forever", "The intercept becomes negative", "R² becomes larger"], why: "We do not know whether the linear pattern continues beyond the data." },
  { q: "A significant positive slope links study hours and GPA. Does studying more cause a higher GPA?", a: "Not necessarily: correlation is not causation; other variables (e.g. motivation) may drive both", w: ["Yes: a significant slope proves causation", "Yes, if R² is above 0.5", "No: a significant slope means there is no relationship"], why: "Regression on observational data shows association. A third variable may cause both." }
];
const REG_TF = [
  ["In simple regression, R² = r².", true, "With one X, the coefficient of determination is the squared correlation."],
  ["Correlation r always lies between −1 and 1.", true, "−1 ≤ r ≤ 1; the sign gives the direction."],
  ["The least-squares line minimises the sum of the residuals.", false, "It minimises the sum of the <b>squared</b> residuals (the plain residuals always sum to 0)."],
  ["Regression treats X and Y symmetrically, just like correlation.", false, "Correlation is symmetric; regression has a direction (X explains Y) and allows predictions."],
  ["A low R² can still come with a significant slope.", true, "With a large n even a weak relationship can be significant."],
  ["A high R² proves that X causes Y.", false, "R² measures fit, not causation, and not whether the model is correct."],
  ["The slope test uses df = n − 2.", true, "Two parameters (b₀ and b₁) are estimated."],
  ["SST = SSR + SSE.", true, "Total variation = explained + unexplained."],
  ["The intercept always has a meaningful interpretation.", false, "Only if X = 0 is realistic and inside the data range."],
  ["H₀: β₁ = 0 means there is no linear relationship between X and Y.", true, "A slope of zero means Y does not change linearly with X."]
];
const P6_RIGHT = [["The relationship is significant at the 5% level.", "0.02 ≤ 0.05."], ["There is evidence of a linear relationship between the variables.", "Rejecting H₀: β₁ = 0 means the slope differs from 0."]];
const P6_WRONG = [["There is a 2% probability that H₀ is true.", "The p-value assumes H₀ is true."], ["The analysis proves that studying more causes a higher GPA.", "Association, not causation."],
  ["R² must be high, because the slope is significant.", "Significance and fit are different; a small R² can still be significant."], ["The slope is significant at the 1% level.", "0.02 &gt; 0.01."], ["98% of the variation in GPA is explained by study hours.", "That would be R², which the p-value does not give."]];
const METHOD_BANK = [
  { q: "Estimate the mean sleep duration of all Nova SBE students from a sample (σ unknown).", a: "CI for μ with t (df = n − 1)" },
  { q: "Estimate the share of students who study Solo.", a: "CI for π with z" },
  { q: "Test whether the mean GPA differs from 15.", a: "One-sample t test" },
  { q: "Test whether more than 30% of students do extracurricular activities.", a: "One-sample z test for π" },
  { q: "Compare the mean GPA of Solo, Group and Hybrid studiers.", a: "One-way ANOVA (F)" },
  { q: "Check whether sleep quality (Poor / Good) is related to stress category (Low / Medium / High).", a: "χ² test of independence" },
  { q: "Check whether study hours per day help predict GPA.", a: "Simple linear regression (t test of the slope)" },
  { q: "Compare the mean stress score across four programmes.", a: "One-way ANOVA (F)" },
  { q: "Check whether gender and part-time job (yes/no) are associated.", a: "χ² test of independence" },
  { q: "Estimate how much GPA changes per extra percentage point of class attendance.", a: "Simple linear regression (t test of the slope)" }
].map(b => ({ ...b, why: { "CI for μ with t (df = n − 1)": "Estimating a mean with σ unknown → t interval.", "CI for π with z": "Estimating a proportion → z interval.", "One-sample t test": "A claim about one mean, σ unknown → t test.", "One-sample z test for π": "A claim about one proportion → z test.", "One-way ANOVA (F)": "Metric Y by a categorical factor with ≥ 3 groups → ANOVA.", "χ² test of independence": "Two categorical variables → χ².", "Simple linear regression (t test of the slope)": "Two metric variables → regression." }[b.a] }))
  .map((b, _, all) => ({ ...b, w: shuffle([...new Set(all.map(x => x.a))].filter(x => x !== b.a)).slice(0, 3) }));
const DIST_BANK = () => { const k = ri(3, 5), n = ri(20, 60), r = ri(2, 4), c = ri(2, 4);
  return pick([
    { q: `A one-way ANOVA with k = ${k} groups and n = ${n} students.`, a: `F with df₁ = ${k - 1}, df₂ = ${n - k}`, w: [`F with df₁ = ${n - k}, df₂ = ${k - 1}`, `χ² with df = ${k - 1}`, `t with df = ${n - 1}`] },
    { q: `A χ² test of independence on a ${r} × ${c} table with n = ${n}.`, a: `χ² with df = ${(r - 1) * (c - 1)}`, w: [`χ² with df = ${n - 1}`, `χ² with df = ${r * c - 1}`, `F with df₁ = ${r - 1}, df₂ = ${c - 1}`] },
    { q: `A test of the slope in a simple regression with n = ${n} students.`, a: `t with df = ${n - 2}`, w: [`t with df = ${n - 1}`, `z`, `χ² with df = ${n - 2}`] },
    { q: `A one-sample test of μ with n = ${n} students, σ unknown.`, a: `t with df = ${n - 1}`, w: [`t with df = ${n - 2}`, `z`, `F with df₁ = 1, df₂ = ${n - 1}`] },
    { q: `A one-sample test of a proportion π with n = ${n * 5} students.`, a: "z", w: [`t with df = ${n * 5 - 1}`, `χ² with df = 1`, `t with df = ${n * 5 - 2}`] }
  ]); };
const DX = [{ i: 6, name: "StudyHoursPerWeek" }, { i: 7, name: "SleepHoursPerNight" }, { i: 8, name: "AttendancePercent" }];
const dReg = () => { const x = pick(DX), X = col(x.i), Y = col(9), o = regOf(X, Y); return { x, X, Y, o }; };

const WEEK6_PARTS = [
/* ------------------------------------------------------------- Part 1 */
{
  title: "The regression line", table: "t-student",
  intro: "Does one quantitative variable help explain and predict another? Simple linear regression fits a straight line through the data: its slope says how Y changes with X, and the line gives predictions.",
  buildsOn: "mean and variance (Week 1) and the idea of explained variation (Week 4)",
  bridge: "How good is the line, and is it significant?",
  summary: [
    "Regression needs two <b>metric</b> variables: Y (dependent, to explain) and X (independent, explanatory). Plot them first.",
    "Ŷ = b₀ + b₁X. <b>Slope b₁</b>: expected change in Y per one-unit increase in X. <b>Intercept b₀</b>: predicted Y at X = 0 (only meaningful if X = 0 is realistic).",
    "Least squares: b₁ = Σ(x − x̄)(y − ȳ) / Σ(x − x̄)², b₀ = ȳ − b₁x̄. The line minimises the sum of squared residuals.",
    "<b>Residual</b> e = Y − Ŷ. Predictions are estimates; only predict inside the observed X range (no extrapolation)."
  ],
  concepts: [
    { name: "When to use regression", tag: "Method",
      idea: `<p>Use simple linear regression when <b>both variables are metric</b> and one is meant to explain the other.</p><ul><li><b>Y, the dependent (response) variable</b>: what we want to explain or predict.</li><li><b>X, the independent (explanatory) variable</b>: what we use to explain it.</li></ul>`,
      example: `<ul><li>Study hours (X) → GPA (Y)</li><li>Sleep duration (X) → stress score (Y)</li><li>Class attendance (X) → GPA (Y)</li></ul><p>An administrator believes students who study more get higher GPAs: X = study hours, Y = GPA.</p>`,
      watch: `<p>Ask "what explains what?". The variable you want to predict is Y.</p>`,
      keys: [["When regression", "both variables metric · Y = dependent, X = explanatory", ""]] },
    { name: "Plot first: the scatterplot", tag: "Exploration",
      idea: `<p>Before any calculation, plot each student as a point (x, y). A scatterplot shows</p><ul><li><b>direction</b>: do the points rise (positive) or fall (negative)?</li><li><b>form</b>: do they follow a straight line, or a curve?</li><li><b>outliers</b>: points far from the pattern, which can pull the line.</li></ul>`,
      example: `<p>For the 8 students below the points rise steadily from (2, 12) to (8, 18): a positive, roughly linear relationship with no outliers.</p>${xyTable([2, 3, 4, 5, 5, 6, 7, 8], [12, 13, 13, 15, 14, 16, 16, 18])}`,
      watch: `<p>A straight line is only a good summary if the pattern is roughly linear. Use Excel's scatter chart (Insert › Scatter) to check.</p>`,
      keys: [] },
    { name: "Slope and intercept", tag: "Interpretation",
      idea: `<p>The regression line predicts Y from X.</p>`,
      formula: `<div class="formula"><div class="fb">Ŷ = b₀ + b₁ · X</div><span class="fn">b₁ = slope · b₀ = intercept · Ŷ = predicted Y</span></div>`,
      steps: `<ul><li><b>Slope b₁</b>: the expected change in Y for a one-unit increase in X. Its sign is the direction of the relationship.</li><li><b>Intercept b₀</b>: the expected Y when X = 0. Only meaningful if X = 0 is realistic and inside the data range.</li><li><b>Prediction</b>: plug X into the equation.</li></ul>`,
      example: `<p>GPA = 10 + 0.8 × Study hours (per day).</p><ul><li>Intercept 10: predicted GPA for a student who studies 0 hours (interpret with care).</li><li>Slope 0.8: each extra hour of daily study is associated with a 0.8-point higher GPA on average. Positive relationship.</li><li>Prediction for 6 h/day: 10 + 0.8 × 6 = <b class="num">14.8</b>. An estimate: the actual GPA will differ by a residual.</li></ul>`,
      watch: `<p>"Associated with", not "causes". The slope describes the average pattern in the data.</p>`,
      keys: [["Regression line", "Ŷ = b₀ + b₁ · X", "=FORECAST.LINEAR(x,known_y,known_x)"]] },
    { name: "Least squares", tag: "Computation",
      idea: `<p>Many lines could be drawn through a cloud of points. The <b>least-squares line</b> is the one that makes the sum of squared residuals Σ(y − ŷ)² as small as possible.</p>`,
      formula: `<div class="formula"><div class="fb">b₁ = ${fr("Σ(x − x̄)(y − ȳ)", "Σ(x − x̄)²")}</div></div> <div class="formula"><div class="fb">b₀ = ȳ − b₁ · x̄</div><span class="fn">so the line always passes through (x̄, ȳ)</span></div>`,
      steps: `<ol><li>Compute x̄ and ȳ.</li><li>For each student: (x − x̄), (y − ȳ), their product, and (x − x̄)².</li><li>b₁ = sum of products / sum of squares.</li><li>b₀ = ȳ − b₁ x̄.</li></ol>`,
      example: `<p>8 students (table in concept 6.2): x̄ = 5, ȳ = 14.625, Σ(x − x̄)(y − ȳ) = 27, Σ(x − x̄)² = 28.</p><ul><li>b₁ = 27 / 28 = <b class="num">0.964</b></li><li>b₀ = 14.625 − 0.964 × 5 = <b class="num">9.80</b></li><li>Ŷ = 9.80 + 0.964 · X</li></ul>`,
      watch: `<p>Keep 4 decimals for b₁ while computing b₀; rounding b₁ too early shifts b₀.</p>`,
      keys: [["Slope", `b₁ = ${fr("Σ(x − x̄)(y − ȳ)", "Σ(x − x̄)²")}`, "=SLOPE(known_y,known_x)"], ["Intercept", "b₀ = ȳ − b₁x̄", "=INTERCEPT(known_y,known_x)"]] },
    { name: "Residuals and predictions", tag: "Prediction",
      idea: `<p>A <b>residual</b> is the vertical distance from a point to the line: observed minus predicted. Two students with the same study hours can have different GPAs, because other factors matter too. So predictions are estimates, not exact values, and the residuals show what the line does not explain.</p>`,
      formula: `<div class="formula"><div class="fb">e = Y − Ŷ</div></div>`,
      example: `<p>Ŷ = 9.80 + 0.964 · X. For 6 h: Ŷ = 9.80 + 0.964 × 6 = 15.59. The student with 6 h has GPA 16, so e = 16 − 15.59 = <b class="num">+0.41</b>: she does a bit better than the line predicts.</p>`,
      watch: `<p><b>Extrapolation</b>: the data cover 2 to 8 hours. A prediction for 14 hours (9.80 + 0.964 × 14 = 23.3, above the 0–20 scale!) is unreliable, because we do not know whether the pattern continues.</p>`,
      keys: [["Residual", "e = Y − Ŷ", ""]] }
  ],
  practice: [
    { key: "predict", label: "Prediction", mode: "general", gen() {
      const b0 = rr(8, 12, 1), b1 = pick([0.5, 0.6, 0.7, 0.8, 0.9, 1.1]), x = rr(1, 8, 1), y = b0 + b1 * x, res = Math.random() < 0.4, obs = +(y + rr(-1.5, 1.5, 1)).toFixed(1);
      return { q: `<p>GPA = ${b0} + ${b1} × Study hours (per day). ${res ? `A student studies ${x} h/day and has a GPA of ${obs}. Find the <b>residual</b>` : `Predict the GPA of a student who studies <b>${x} h/day</b>`} (2 decimals).</p>`, ans: res ? obs - y : y, dp: 2,
        steps: `<ol><li>Ŷ = ${b0} + ${b1} × ${x} = ${f(y, 2)}</li>${res ? `<li>e = Y − Ŷ = ${obs} − ${f(y, 2)} = <b class="num">${f(obs - y, 2)}</b> (${obs > y ? "above" : "below"} the line)</li>` : `<li>Predicted GPA: <b class="num">${f(y, 2)}</b>, an estimate; the actual GPA will differ by a residual.</li>`}</ol>` };
    } },
    { key: "interp", label: "Interpret the regression", mode: "general", gen: mcGen(REG_INTERP) },
    { key: "b1", label: "Slope and intercept", mode: "general", gen() {
      const { X, Y, o } = regRaw(), ask = pick(["b1", "b0"]);
      return { q: `<p>Study hours and GPA for ${X.length} students:</p>${xyTable(X, Y)}<p>Find the least-squares <b>${ask === "b1" ? "slope b₁" : "intercept b₀"}</b> (${ask === "b1" ? 3 : 2} decimals).</p>`, ans: o[ask], dp: ask === "b1" ? 3 : 2, alts: ask === "b0" ? [o.my - +o.b1.toFixed(3) * o.mx] : [],
        steps: `<ol>${lsSteps(X, Y, o)}<li>Ŷ = ${f(o.b0, 2)} + ${f(o.b1, 3)} · X → ${ask === "b1" ? `b₁ = <b class="num">${f(o.b1, 3)}</b>` : `b₀ = <b class="num">${f(o.b0, 2)}</b>`}</li></ol>`, excel: ask === "b1" ? "=SLOPE(Y range,X range)" : "=INTERCEPT(Y range,X range)" };
    } },
    { key: "resid", label: "Residual from data", mode: "general", gen() {
      const { X, Y, o } = regRaw(), i = ri(0, X.length - 1), yh = o.b0 + o.b1 * X[i];
      return { q: `<p>Study hours and GPA for ${X.length} students:</p>${xyTable(X, Y)}<p>Fit the least-squares line and find the residual of the student with X = ${X[i]} and Y = ${Y[i]} (2 decimals).</p>`, ans: Y[i] - yh, dp: 2,
        steps: `<ol>${lsSteps(X, Y, o)}<li>Ŷ = ${f(o.b0, 4)} + ${f(o.b1, 4)} × ${X[i]} = ${f(yh, 3)}</li><li>e = ${Y[i]} − ${f(yh, 3)} = <b class="num">${f(Y[i] - yh, 2)}</b></li></ol>` };
    } },
    { key: "dslope", label: "Regression line in the dataset", mode: "data", gen() {
      const D = dReg(), o = D.o, ask = pick(["b1", "b0", "pred"]), xv = Math.round(o.mx + rr(-1, 1, 2) * Math.sqrt(o.sxx / 59)), yh = o.b0 + o.b1 * xv, L = LETTERS[D.x.i];
      const ans = ask === "b1" ? o.b1 : ask === "b0" ? o.b0 : yh;
      return { q: `<p>Regress <b>FinalGrade</b> (Y) on <b>${D.x.name}</b> (X) for all 60 students. ${ask === "pred" ? `Predict the FinalGrade of a student with ${D.x.name} = <b>${xv}</b>` : `Find the ${ask === "b1" ? "slope b₁" : "intercept b₀"}`} (3 decimals).</p>`, ans, dp: 3,
        steps: `<ol><li>x̄ = ${f(o.mx, 4)}, ȳ = ${f(o.my, 4)}; Σ(x − x̄)(y − ȳ) = ${f(o.sxy, 3)}; Σ(x − x̄)² = ${f(o.sxx, 3)}</li><li>b₁ = ${f(o.b1, 4)}: each extra unit of ${D.x.name} is associated with ${f(o.b1, 3)} more grade points on average.</li><li>b₀ = ${f(o.my, 4)} − ${f(o.b1, 4)} × ${f(o.mx, 4)} = ${f(o.b0, 4)}</li>${ask === "pred" ? `<li>Ŷ = ${f(o.b0, 4)} + ${f(o.b1, 4)} × ${xv} = <b class="num">${f(yh, 3)}</b></li>` : `<li>Answer: <b class="num">${f(ans, 3)}</b></li>`}</ol>`,
        excel: ask === "b1" ? `=SLOPE(J2:J61,${L}2:${L}61)` : ask === "b0" ? `=INTERCEPT(J2:J61,${L}2:${L}61)` : `=FORECAST.LINEAR(${xv},J2:J61,${L}2:${L}61)` };
    } }
  ]
},
/* ------------------------------------------------------------- Part 2 */
{
  title: "Fit and significance", table: "t-student",
  intro: "How well does the line fit, and is the relationship more than chance? Correlation and R² measure the fit; a t test of the slope checks significance, with the same logic as every test in the course.",
  buildsOn: "the regression line (Part 1) and the t test (Week 3)",
  bridge: "Putting the whole course together",
  summary: [
    "<b>r</b> measures the strength and direction of the <b>linear</b> relationship, −1 ≤ r ≤ 1.",
    "SST = SSR + SSE. <b>R²</b> = SSR / SST = 1 − SSE / SST: the share of the variation in Y explained by X. In simple regression R² = r².",
    "Slope test: H₀: β₁ = 0 (no linear relationship), H₁: β₁ ≠ 0; t = b₁ / SE(b₁), df = n − 2.",
    "Significant ≠ causal ≠ important. A high R² does not prove causation; a low R² can still come with a significant slope."
  ],
  concepts: [
    { name: "Correlation r", tag: "Fit",
      idea: `<p>The correlation coefficient <b>r</b> measures the strength and direction of the <b>linear</b> relationship between two metric variables. r = 1 or −1: all points on a line; r = 0: no linear relationship.</p>`,
      formula: `<div class="formula"><div class="fb">r = ${fr("Σ(x − x̄)(y − ȳ)", "√(Σ(x − x̄)² · Σ(y − ȳ)²)")}</div><span class="fn">−1 ≤ r ≤ 1 · the sign of r equals the sign of b₁</span></div>`,
      example: `<p>8 students: r = 27 / √(28 × 27.875) = <b class="num">0.966</b>, a very strong positive linear relationship.</p>`,
      watch: `<p>r = 0 means no <b>linear</b> relationship; a curved one is still possible. And correlation is symmetric (X with Y = Y with X), while regression has a direction and allows predictions.</p>`,
      keys: [["Correlation", `r = ${fr("Σ(x − x̄)(y − ȳ)", "√(Σ(x − x̄)² Σ(y − ȳ)²)")}`, "=CORREL(range1,range2)"]] },
    { name: "Explained variation and R²", tag: "Fit",
      idea: `<p>The total variation of Y splits into the part the line explains and the part it does not (the residuals).</p>`,
      formula: `<div class="formula"><div class="fb">SST = SSR + SSE</div><span class="fn">Σ(y − ȳ)² = Σ(ŷ − ȳ)² + Σ(y − ŷ)² · total = explained + unexplained</span></div>
        <div class="formula"><div class="fb">R² = ${fr("SSR", "SST")} = 1 − ${fr("SSE", "SST")}</div><span class="fn">in simple regression R² = r²</span></div>`,
      example: `<p>8 students: SST = 27.875, SSR = 26.036, SSE = 1.839. R² = 26.036 / 27.875 = <b class="num">0.934</b>: 93.4% of the variation in GPA is explained by study hours.</p>
        <p>R² = 0.60: 60% of the variation in Y is explained by X and 40% stays unexplained. Whether that is "good" depends on the context.</p>`,
      watch: `<p>R² = 0.6 does <b>not</b> mean 60% of the predictions are correct. And a high R² does not prove causation or a correct model.</p>`,
      keys: [["Variation", "SST = SSR + SSE", ""], ["R²", `R² = ${fr("SSR", "SST")} = 1 − ${fr("SSE", "SST")} = r²`, "=RSQ(known_y,known_x)"]] },
    { name: "Testing the slope", tag: "Test",
      idea: `<p>Even if X and Y are unrelated in the population, a sample slope will rarely be exactly 0. The t test checks whether b₁ is too far from 0 to be chance.</p>`,
      formula: `<div class="formula"><div class="fb">H₀: β₁ = 0 · H₁: β₁ ≠ 0</div><span class="fn">β₁ = the population slope</span></div> <div class="formula"><div class="fb">t = ${fr("b₁", "SE(b₁)")}, df = n − 2</div></div>`,
      steps: `<ol><li>H₀: β₁ = 0 (no linear relationship); H₁: β₁ ≠ 0.</li><li>t = b₁ / SE(b₁) (SE(b₁) from the output).</li><li>Critical value: course t-table, row n − 2, column 1 − α/2. Or compare the p-value with α.</li><li>Conclude in context, without claiming causality.</li></ol>`,
      example: `<p>8 students: SE(b₁) = 0.105, t = 0.964 / 0.105 = <b class="num">9.22</b>, df = 6. t<sub>crit</sub>: row 6, column 0.975 → 2.447. 9.22 &gt; 2.447 → reject H₀; p ≈ 0.0001.</p><p>There is a significant positive linear relationship between study hours and GPA, but this does not prove that studying more <b>causes</b> a higher GPA.</p>`,
      watch: `<p>df = n − 2, not n − 1: the line estimates two parameters, b₀ and b₁.</p>`,
      keys: [["Slope test", `t = ${fr("b₁", "SE(b₁)")}, df = n − 2 · H₀: β₁ = 0`, "=T.DIST.2T(ABS(t),n-2)"]] },
    { name: "Reading regression output", tag: "Output",
      idea: `<p>In practice software (Excel: Data › Data Analysis › Regression) does the calculations. You must read the output.</p>`,
      example: `<p>Excel output for the 8 students:</p>${regOut(regOf([2, 3, 4, 5, 5, 6, 7, 8], [12, 13, 13, 15, 14, 16, 16, 18]))}
        <ul><li><b>Coefficients</b>: b₀ = 9.80 (Intercept) and b₁ = 0.964 (Study hours): Ŷ = 9.80 + 0.964 X.</li><li><b>R Square</b> 0.934: share of the variation in GPA explained.</li><li><b>t Stat</b> = Coefficient / Standard Error; <b>P-value</b> of the slope tests H₀: β₁ = 0.</li><li>Multiple R = |r|.</li></ul>`,
      watch: `<p>Use the P-value in the <b>slope's</b> row, not the intercept's, to decide whether X is related to Y.</p>`,
      keys: [["Regression output", "t Stat = Coefficient / Standard Error · P-value tests H₀: coefficient = 0", "Data › Data Analysis › Regression"]] },
    { name: "Correlation is not causation", tag: "Interpretation",
      idea: `<p>A significant slope shows that X and Y move together. It does not show that X causes Y: a third variable, such as motivation, may drive both study hours and GPA.</p>`,
      example: `<ul><li>A significant but tiny slope (0.01 GPA points per extra hour per week) may be practically irrelevant.</li><li>With 30 vs 300 students: the larger sample detects weaker relationships (more power), so the same slope may be significant only there.</li></ul>`,
      watch: `<p>Type I error in regression: concluding there is a relationship when β₁ = 0. Type II error: missing a real relationship, more likely with a small n.</p>`,
      keys: [] }
  ],
  practice: [
    { key: "r2", label: "R² and r", mode: "general", gen() {
      const kind = pick(["ssr", "sse", "r", "fromr2"]), sst = rr(20, 200, 1), R2 = rr(0.1, 0.95, 3), ssr = +(sst * R2).toFixed(2), sse = +(sst - ssr).toFixed(2), r = +(pick([1, -1]) * Math.sqrt(R2)).toFixed(3);
      if (kind === "r") return { q: `<p>The correlation between sleep hours and stress is r = ${r}. What share of the variation in stress does a regression on sleep hours explain? Give R² (3 decimals).</p>`, ans: r * r, dp: 3,
        steps: `<ol><li>In simple regression R² = r².</li><li>R² = (${r})² = <b class="num">${f(r * r, 3)}</b>: ${f(r * r * 100, 1)}% of the variation is explained.</li></ol>` };
      if (kind === "fromr2") { const b1s = pick([1, -1]); return { q: `<p>A regression of stress on sleep hours has R² = ${R2} and a ${b1s > 0 ? "positive" : "negative"} slope. Find the correlation r (3 decimals).</p>`, ans: b1s * Math.sqrt(R2), dp: 3,
        steps: `<ol><li>|r| = √R² = √${R2} = ${f(Math.sqrt(R2), 4)}</li><li>The sign of r is the sign of the slope: r = <b class="num">${f(b1s * Math.sqrt(R2), 3)}</b></li></ol>` }; }
      const ans = ssr / sst;
      return { q: `<p>A regression of GPA on study hours gives SST = ${sst} and ${kind === "ssr" ? `SSR = ${ssr}` : `SSE = ${sse}`}. Find R² (3 decimals).</p>`, ans, dp: 3,
        steps: `<ol><li>${kind === "ssr" ? `R² = SSR / SST = ${ssr} / ${sst}` : `R² = 1 − SSE / SST = 1 − ${sse} / ${sst}`} = <b class="num">${f(ans, 3)}</b></li><li>${f(ans * 100, 1)}% of the variation in GPA is explained by study hours; ${f(100 - ans * 100, 1)}% is not.</li></ol>` };
    } },
    { key: "slopet", label: "Slope t test", mode: "general", gen() {
      for (;;) { const n = pick([8, 10, 12, 15, 20, 25, 30, 40, 62]), df = n - 2, b1 = rr(0.1, 1.2, 2), seb = rr(0.08, 0.6, 3), t = b1 / seb, a = pick([0.05, 0.05, 0.01]), col = 1 - a / 2, c = M.tinv(col, df), ct = M.tinv(col, tRow(df));
        if (!clear(t, [c, ct])) continue; const p = 2 * (1 - M.tcdf(t, df)), ask = pick(["t", "decide"]);
        const base = `<li>t = b₁ / SE(b₁) = ${b1} / ${seb} = ${f(t, 3)}, df = n − 2 = ${df}</li><li>${tLook(col, df)}</li>${decideSteps("t", t, ct, "two", a, p)}`;
        if (ask === "t") return { q: `<p>A regression of GPA on study hours with n = ${n} students gives b₁ = ${b1} with SE(b₁) = ${seb}. Compute the t statistic for H₀: β₁ = 0 (3 decimals).</p>`, ans: t, dp: 3, viz: rejViz("t", df, c, t, "two", "t"), steps: `<ol>${base}</ol>` };
        return { q: `<p>A regression of GPA on study hours with n = ${n} students gives b₁ = ${b1} with SE(b₁) = ${seb}. Test H₀: β₁ = 0 against H₁: β₁ ≠ 0 at α = ${a}.</p>`, ans: p <= a ? "Reject H₀" : "Fail to reject H₀", choices: ["Reject H₀", "Fail to reject H₀"], viz: rejViz("t", df, c, t, "two", "t"),
          steps: `<ol>${base}<li>${p <= a ? "There is a significant linear relationship between study hours and GPA (not proof of causation)." : "Not enough evidence of a linear relationship."}</li></ol>` }; }
    } },
    { key: "output", label: "Read the regression output", mode: "general", gen() {
      const { C, o } = regSynth(), ask = pick(["pred", "r2", "t", "decide", "r"]), xv = +(o.mx + rr(-1, 1, 1) * (C[3] - C[2]) / 4).toFixed(C[1] === "%" ? 0 : 1);
      const q = `<p>Excel output of a regression of GPA (0–20) on <b>${C[0]}</b> for n = ${o.n} students:</p>${regOut(o, C[0])}`;
      if (ask === "decide") return { q: q + `<p>At α = 0.05, is ${C[0].toLowerCase()} significantly related to GPA?</p>`, ans: o.p <= 0.05 ? "Yes: reject H₀: β₁ = 0" : "No: fail to reject H₀: β₁ = 0", choices: ["Yes: reject H₀: β₁ = 0", "No: fail to reject H₀: β₁ = 0"],
        steps: `<ol><li>Use the P-value of the ${C[0]} row: ${pFmt(o.p)}.</li><li>${o.p <= 0.05 ? "≤ 0.05 → reject H₀: a significant linear relationship." : "&gt; 0.05 → fail to reject H₀."}</li><li>R² = ${f(o.R2, 4)}: ${f(o.R2 * 100, 1)}% of the variation in GPA is explained. Significance and R² answer different questions.</li></ol>` };
      const map = { pred: [o.b0 + o.b1 * xv, 2, `Predict the GPA of a student with ${C[0].toLowerCase()} = ${xv} ${C[1]}`, `Ŷ = ${f(o.b0, 4)} + ${f(o.b1, 4)} × ${xv} = <b class="num">${f(o.b0 + o.b1 * xv, 2)}</b>`],
        r2: [o.R2 * 100, 1, "What percentage of the variation in GPA is explained by the model? (1 decimal)", `R Square = ${f(o.R2, 4)} → <b class="num">${f(o.R2 * 100, 1)}%</b>`],
        t: [o.b1 / o.seb, 2, "Verify the t Stat of the slope from the coefficient and its standard error", `t = ${f(o.b1, 4)} / ${f(o.seb, 4)} = <b class="num">${f(o.b1 / o.seb, 2)}</b>, df = ${o.n - 2}`],
        r: [Math.sqrt(o.R2), 3, "Find the correlation r between the two variables", `r = +√R² (the slope is positive) = √${f(o.R2, 4)} = <b class="num">${f(Math.sqrt(o.R2), 3)}</b> (Multiple R)`] }[ask];
      return { q: q + `<p>${map[2]} (${map[1]} decimals).</p>`, ans: map[0], dp: map[1], alts: ask === "pred" ? [+o.b0.toFixed(2) + +o.b1.toFixed(2) * xv] : ask === "t" ? [+o.b1.toFixed(4) / +o.seb.toFixed(4)] : [], steps: `<ol><li>${map[3]}</li></ol>` };
    } },
    { key: "regtf", label: "Regression: true or false", mode: "general", gen: tfGen(REG_TF) },
    { key: "pstate6", label: "p = 0.02: which is correct?", mode: "general", gen: pGen("A regression of GPA on study hours gives a slope with", P6_RIGHT, P6_WRONG) },
    { key: "dfit", label: "Fit and test in the dataset", mode: "data", gen() {
      const D = dReg(), o = D.o, ask = pick(["r2", "r", "t"]), L = LETTERS[D.x.i];
      const ans = ask === "r2" ? o.R2 : ask === "r" ? o.r : o.t;
      return { q: `<p>Regress <b>FinalGrade</b> on <b>${D.x.name}</b> for all 60 students. Find ${ask === "r2" ? "<b>R²</b>" : ask === "r" ? "the correlation <b>r</b>" : "the <b>t statistic of the slope</b>"} (3 decimals).</p>`, ans, dp: 3,
        steps: `<ol><li>b₁ = ${f(o.b1, 4)}, b₀ = ${f(o.b0, 4)}</li><li>SST = ${f(o.sst, 2)}, SSR = ${f(o.ssr, 2)}, SSE = ${f(o.sse, 2)} → R² = ${f(o.R2, 4)}, r = ${f(o.r, 4)}</li><li>SE(b₁) = √(SSE / (n − 2) / Σ(x − x̄)²) = ${f(o.seb, 4)}; t = ${f(o.b1, 4)} / ${f(o.seb, 4)} = ${f(o.t, 3)}, df = 58, p = ${pFmt(o.p)}</li><li>Answer: <b class="num">${f(ans, 3)}</b>. ${D.x.name} explains ${f(o.R2 * 100, 1)}% of the variation in FinalGrade; this is an association, not proof of causation.</li></ol>`,
        excel: ask === "r2" ? `=RSQ(J2:J61,${L}2:${L}61)` : ask === "r" ? `=CORREL(${L}2:${L}61,J2:J61)` : "Data › Data Analysis › Regression → t Stat" };
    } }
  ]
},
/* ------------------------------------------------------------- Part 3 */
{
  title: "Choosing the right method",
  intro: "The exam tests whether you can pick the right method, state the assumptions and hypotheses, and interpret the result. This part puts Weeks 2 to 6 side by side.",
  buildsOn: "all methods from Weeks 2 to 6",
  summary: [
    "Mean → z (σ known) or t (σ unknown). Proportion → z. Metric Y by groups → ANOVA (F). Two categorical → χ². Two metric → regression (t).",
    "Every test follows the same steps: H₀/H₁ → α → assumptions → statistic → critical value and/or p-value → decision rule → conclusion in context.",
    "Recurring ideas: both approaches agree; Type I/II errors and power; statistical vs practical significance; “fail to reject”, never “accept”; association is not causation."
  ],
  concepts: [
    { name: "The decision tree", tag: "Method",
      idea: `<p>Start from the question and the type of variables.</p>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th>Situation</th><th>Method</th><th>Distribution / table</th></tr></thead><tbody>
        <tr><td>Estimate a mean</td><td>CI for μ</td><td>Z (σ known) / t (σ unknown, df = n − 1)</td></tr>
        <tr><td>Estimate a proportion</td><td>CI for π</td><td>Z</td></tr>
        <tr><td>Test a claim about one mean</td><td>one-sample z / t test</td><td>Z / t</td></tr>
        <tr><td>Test a claim about one proportion</td><td>one-sample z test for π</td><td>Z</td></tr>
        <tr><td>Metric Y vs categorical factor (≥ 3 groups)</td><td>one-way ANOVA</td><td>F (df₁ = k − 1, df₂ = n − k)</td></tr>
        <tr><td>Two categorical variables</td><td>χ² test of independence</td><td>χ² (df = (r − 1)(c − 1))</td></tr>
        <tr><td>Two metric variables</td><td>simple linear regression</td><td>t (df = n − 2)</td></tr></tbody></table></div>`,
      watch: `<p>Decide first whether each variable is metric or categorical (Week 1, Part 1). That single step picks most of the method.</p>`,
      keys: [["Choosing a method", "mean → z/t · proportion → z · metric Y by groups → ANOVA · 2 categorical → χ² · 2 metric → regression", ""]] },
    { name: "One procedure for every test", tag: "Procedure",
      idea: `<p>The logic is the same in Weeks 3 to 6; only the statistic and the distribution change.</p>`,
      steps: `<ol><li>Formulate H₀ and H₁.</li><li>Choose α.</li><li>Check the assumptions.</li><li>Compute the test statistic (z, t, F or χ²).</li><li>Find the critical value and/or the p-value.</li><li>State the decision rule and decide.</li><li>Conclude in context, in plain language.</li></ol>`,
      example: `<div class="tablewrap"><table class="t"><thead><tr><th>Test</th><th>H₀</th><th>Statistic</th><th>Rejects for</th></tr></thead><tbody>
        <tr><td>Mean</td><td>μ = μ₀</td><td>t = (x̄ − μ₀) / (s/√n)</td><td>large |t| (or one tail)</td></tr><tr><td>Proportion</td><td>π = π₀</td><td>z = (p − π₀) / √(π₀(1 − π₀)/n)</td><td>large |z| (or one tail)</td></tr>
        <tr><td>ANOVA</td><td>μ₁ = … = μ<sub>k</sub></td><td>F = MSB / MSW</td><td>large F</td></tr><tr><td>χ²</td><td>independent</td><td>χ² = Σ (O − E)² / E</td><td>large χ²</td></tr><tr><td>Regression</td><td>β₁ = 0</td><td>t = b₁ / SE(b₁)</td><td>large |t|</td></tr></tbody></table></div>`,
      watch: `<p>F and χ² tests are always right-tailed; z and t tests can be two-, left- or right-tailed.</p>`,
      keys: [["Universal procedure", "H₀/H₁ → α → assumptions → statistic → critical value / p-value → decision rule → conclusion", ""]] },
    { name: "Ideas that come back every week", tag: "Review",
      idea: `<ul><li><b>Critical value vs p-value</b>: two routes, always the same decision.</li><li><b>Type I / Type II error</b>, α and power; a larger n gives more power.</li><li><b>Statistical vs practical significance</b>.</li><li><b>“Fail to reject H₀”</b>, never “accept H₀”.</li><li><b>p-value</b> = P(data this extreme | H₀ true), not P(H₀ true).</li><li><b>Association ≠ causation</b> (χ² and regression).</li></ul>`,
      example: `<p>Table skills for the exam: Z (confidence level ↔ z; z → tail area), t (α, tails, df → t; t → p-value range), χ² (α, df → critical value), F (α, df₁, df₂ → critical value).</p>`,
      watch: `<p>The exam is open-book: you can look up formulas, but you must know which one fits and what the result means.</p>`,
      keys: [] }
  ],
  practice: [
    { key: "method", label: "Choose the method", mode: "general", gen: mcGen(METHOD_BANK) },
    { key: "whichdist", label: "Which distribution and df?", mode: "general", gen() {
      const b = DIST_BANK();
      return { q: `<p>Which distribution (and degrees of freedom) does the test statistic follow under H₀?</p><div class="vcard"><span class="vn">${b.q}</span></div>`, ans: b.a, choices: shuffle([b.a, ...b.w]),
        steps: `<ol><li>Mean, σ unknown → t (n − 1) · proportion → z · ANOVA → F (k − 1, n − k) · χ² → (r − 1)(c − 1) · regression slope → t (n − 2).</li><li>Answer: <b>${b.a}</b>.</li></ol>` };
    } },
    { key: "dmethod", label: "Choose the method for the dataset", mode: "data", gen: mcGen([
      { q: "Does the mean FinalGrade differ between the four study methods (Solo, Group, Tutoring, OnlineResources)?", a: "One-way ANOVA (F)", why: "FinalGrade is metric; StudyMethod is a categorical factor with 4 groups." },
      { q: "Is StressLevel (Low / Medium / High) associated with having a PartTimeJob?", a: "χ² test of independence", why: "Both variables are categorical." },
      { q: "Do more StudyHoursPerWeek go with a higher FinalGrade?", a: "Simple linear regression (t test of the slope)", why: "Both variables are metric." },
      { q: "Is the mean SleepHoursPerNight different from 7 hours?", a: "One-sample t test", why: "One metric variable, a claimed value, σ unknown." },
      { q: "Is the share of students who pass above 75%?", a: "One-sample z test for π", why: "A claim about one proportion." },
      { q: "Estimate the mean AttendancePercent of all students with a range of plausible values.", a: "CI for μ with t (df = n − 1)", why: "Estimating a mean with σ unknown." }
    ].map((b, _, all) => ({ ...b, w: shuffle(["One-way ANOVA (F)", "χ² test of independence", "Simple linear regression (t test of the slope)", "One-sample t test", "One-sample z test for π", "CI for μ with t (df = n − 1)"].filter(x => x !== b.a)).slice(0, 3) }))) }
  ]
}
];

const WEEKS = [
  { id: "week1", num: 1, title: "Foundations of statistics",
    blurb: "Classify data and summarise it, model it with random variables and distributions, see how samples behave, and read the z, t, χ² and F tables.",
    parts: WEEK1_PARTS },
  { id: "week2", num: 2, title: "Sampling and confidence intervals",
    blurb: "What can a sample tell us about its population? Understand sampling variability and the Central Limit Theorem, then build and interpret confidence intervals for a mean and a proportion.",
    parts: WEEK2_PARTS },
  { id: "week3", num: 3, title: "Hypothesis tests for a mean or proportion",
    blurb: "Does the sample support or contradict a claim? Formulate H₀ and H₁, compute a z or t statistic, decide with critical values and p-values, and understand Type I and Type II errors.",
    parts: WEEK3_PARTS },
  { id: "week4", num: 4, title: "Analysis of variance (ANOVA)",
    blurb: "Do several group means differ for real, or just by chance? Compare between-group with within-group variation, build the ANOVA table and decide with the F distribution.",
    parts: WEEK4_PARTS },
  { id: "week5", num: 5, title: "Contingency analysis",
    blurb: "Are two categorical variables associated? Read contingency tables, compute expected frequencies and the χ² statistic, and interpret the result without claiming causation.",
    parts: WEEK5_PARTS },
  { id: "week6", num: 6, title: "Simple linear regression",
    blurb: "Does one metric variable help explain and predict another? Fit and interpret the regression line, measure the fit with r and R², test the slope, and choose the right method for any question.",
    parts: WEEK6_PARTS }
];
const cid = (pi, ci) => `c-${pi + 1}-${ci + 1}`;

/* =========================================================================
   STATISTICAL TABLES (images of the PDFs in the "Tabels" folder)
   ========================================================================= */
const TABLES = [
  { id: "normal", name: "Standard Normal", pages: ["tables/normal-1.png"],
    how: "Cells give P(Z &lt; z). Row: z to one decimal. Column: the second decimal. For negative z use Φ(−z) = 1 − Φ(z)." },
  { id: "t-student", name: "t-Student", pages: ["tables/t-student-1.png"],
    how: "Cells give t, where the column is P(t<sub>df</sub> &lt; t). Row: degrees of freedom. For areas below 0.5, use symmetry and flip the sign." },
  { id: "chi-square", name: "Chi-square", pages: ["tables/chi-square-1.png"],
    how: "Cells give q, where the column is P(χ²<sub>df</sub> &lt; q). Row: degrees of freedom." },
  { id: "f-snedecor", name: "F-Snedecor", pages: ["tables/f-snedecor-1.png", "tables/f-snedecor-2.png"],
    how: "Cells give f, where the number on the left is P(F<sub>m,n</sub> &lt; f). Columns: m (numerator df). Row blocks: n (denominator df). Two pages." }
];


export { M, RAW, COLS, LETTERS, NUMERIC, GROUPS, col, f, g4, xl, esc, pick, clamp, WIDGETS, makeCurve, WEEKS, TABLES };
