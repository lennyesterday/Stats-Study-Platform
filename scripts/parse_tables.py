# Usage: python3 scripts/parse_tables.py [materials/tables] [src/content/tables.ts]
# Re-extracts the four course tables from the PDFs (needs: pip install pypdf).
import json, sys, re
import pypdf
sp = sys.argv[1] if len(sys.argv) > 1 else "materials/tables"
out = sys.argv[2] if len(sys.argv) > 2 else "src/content/tables.ts"
def lines(name):
    return "\n".join(p.extract_text() for p in pypdf.PdfReader(f"{sp}/{name}.pdf").pages).splitlines()
num = re.compile(r'^-?\d+(\.\d+)?$')
# Z
z = {"rows": [], "cols": [round(i/100, 2) for i in range(10)], "values": []}
for l in lines("Standard Normal"):
    t = l.split()
    if len(t) == 11 and all(num.match(x) for x in t):
        z["rows"].append(float(t[0])); z["values"].append([float(x) for x in t[1:]])
assert len(z["rows"]) == 36
# t
tt = {"probs": [0.999,0.995,0.990,0.975,0.950,0.900,0.850,0.800,0.700,0.600,0.500], "dfs": [], "values": []}
for l in lines("t-Student"):
    t = l.split()
    if len(t) == 12 and (num.match(t[0]) or t[0] == '∞') and all(num.match(x) for x in t[1:]):
        tt["dfs"].append(None if t[0] == '∞' else int(t[0])); tt["values"].append([float(x) for x in t[1:]])
assert len(tt["dfs"]) == 34, len(tt["dfs"])
# chi2
c = {"probs": [0.005,0.010,0.025,0.050,0.100,0.250,0.500,0.750,0.900,0.950,0.975,0.990,0.995], "dfs": [], "values": []}
for l in lines("Chi-square"):
    t = l.split()
    if len(t) == 14 and all(num.match(x) for x in t):
        c["dfs"].append(int(t[0])); c["values"].append([float(x) for x in t[1:]])
assert len(c["dfs"]) == 32, len(c["dfs"])
# F
ms = [1,2,3,4,5,6,7,8,9,10,12,15,20,30,60,120,None]
ns = [1,2,3,4,5,6,7,8,9,10,12,15,20,30,60,120,None]
fr = []
for l in lines("F-Snedecor"):
    t = l.split()
    if t and t[0] in ("0.900","0.950","0.975","0.990","0.995"):
        vals = t[1:]
        if len(vals) == 18: vals = vals[1:]
        assert len(vals) == 17, l
        fr.append([float(x) for x in vals])
assert len(fr) == 85, len(fr)
f = {"probs": [0.900,0.950,0.975,0.990,0.995], "ms": ms, "ns": ns, "values": [fr[i*5:(i+1)*5] for i in range(17)]}
src = "// AUTO-GENERATED from materials/tables/*.pdf (course tables). Do not edit by hand.\n// null in df lists = infinity (∞).\n"
types = {
    "Z_TABLE": "{ rows: number[]; cols: number[]; values: number[][] }",
    "T_TABLE": "{ probs: number[]; dfs: (number | null)[]; values: number[][] }",
    "CHI2_TABLE": "{ probs: number[]; dfs: number[]; values: number[][] }",
    "F_TABLE": "{ probs: number[]; ms: (number | null)[]; ns: (number | null)[]; values: number[][][] }",
}
for name, obj in [("Z_TABLE", z), ("T_TABLE", tt), ("CHI2_TABLE", c), ("F_TABLE", f)]:
    src += f"export const {name}: {types[name]} = {json.dumps(obj, separators=(',', ':'))};\n"
open(out, "w").write(src)
print("ok", z["values"][10][4], tt["values"][14][4], c["values"][11][10], f["values"][5][1][4])
