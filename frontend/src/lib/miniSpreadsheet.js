// A deliberately small formula engine for the internship spreadsheet tasks —
// NOT a full spreadsheet implementation. Supported: +, -, *, /, parentheses,
// cell references (A1), ranges (B2:B10), SUM(...), AVERAGE(...),
// IF(cond,then,else) with a single comparison (==, !=, <, >, <=, >=).
// Explicitly NOT supported: nested/other functions, VLOOKUP/INDEX/MATCH,
// absolute refs ($A$1), cross-sheet refs, AND/OR. The grid is tiny (~20x7)
// so every change triggers a full recalc — no dependency graph is built,
// just a circular-reference guard via an evaluation stack.

class FormulaError extends Error {}

export function colLetterToIndex(letters) {
  let idx = 0;
  for (const ch of letters.toUpperCase()) {
    idx = idx * 26 + (ch.charCodeAt(0) - 64);
  }
  return idx - 1;
}

export function indexToColLetter(idx) {
  let n = idx + 1;
  let letters = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    letters = String.fromCharCode(65 + rem) + letters;
    n = Math.floor((n - 1) / 26);
  }
  return letters;
}

export function cellId(rowIdx, colIdx) {
  return `${indexToColLetter(colIdx)}${rowIdx + 1}`;
}

export function parseCellRef(ref) {
  const m = /^([A-Za-z]+)(\d+)$/.exec(ref);
  if (!m) return null;
  return { col: colLetterToIndex(m[1]), row: parseInt(m[2], 10) - 1 };
}

export function expandRange(rangeStr) {
  const [a, b] = rangeStr.split(":");
  const p1 = parseCellRef(a);
  const p2 = parseCellRef(b);
  if (!p1 || !p2) return [];
  const rowStart = Math.min(p1.row, p2.row);
  const rowEnd = Math.max(p1.row, p2.row);
  const colStart = Math.min(p1.col, p2.col);
  const colEnd = Math.max(p1.col, p2.col);
  const ids = [];
  for (let r = rowStart; r <= rowEnd; r++) {
    for (let c = colStart; c <= colEnd; c++) ids.push(cellId(r, c));
  }
  return ids;
}

function tokenize(expr) {
  const tokens = [];
  const n = expr.length;
  const isDigit = (ch) => ch >= "0" && ch <= "9";
  const isAlpha = (ch) => /[A-Za-z]/.test(ch);
  let i = 0;

  function readCellRef(start) {
    let j = start;
    while (j < n && isAlpha(expr[j])) j++;
    if (j === start) return null;
    let k = j;
    while (k < n && isDigit(expr[k])) k++;
    if (k === j) return null;
    return { text: expr.slice(start, k).toUpperCase(), end: k };
  }

  while (i < n) {
    const c = expr[i];
    if (/\s/.test(c)) { i++; continue; }
    if (isDigit(c) || c === ".") {
      let j = i;
      while (j < n && /[0-9.]/.test(expr[j])) j++;
      tokens.push({ type: "NUM", value: parseFloat(expr.slice(i, j)) });
      i = j;
      continue;
    }
    if (isAlpha(c)) {
      const ref = readCellRef(i);
      if (ref) {
        if (expr[ref.end] === ":") {
          const ref2 = readCellRef(ref.end + 1);
          if (ref2) {
            tokens.push({ type: "RANGE", value: `${ref.text}:${ref2.text}` });
            i = ref2.end;
            continue;
          }
        }
        tokens.push({ type: "CELL", value: ref.text });
        i = ref.end;
        continue;
      }
      let j = i;
      while (j < n && isAlpha(expr[j])) j++;
      tokens.push({ type: "IDENT", value: expr.slice(i, j).toUpperCase() });
      i = j;
      continue;
    }
    if (c === "<" || c === ">" || c === "=" || c === "!") {
      let op = c;
      let len = 1;
      if (expr[i + 1] === "=") { op += "="; len = 2; }
      tokens.push({ type: "CMP", value: op === "=" ? "==" : op });
      i += len;
      continue;
    }
    if ("+-*/(),".includes(c)) {
      tokens.push({ type: c });
      i++;
      continue;
    }
    throw new FormulaError(`Unexpected character '${c}'`);
  }
  return tokens;
}

function parseExpr(tokens, ctx) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  const expect = (type) => {
    const t = next();
    if (!t || t.type !== type) throw new FormulaError(`Expected '${type}'`);
    return t;
  };

  function parseCompare() {
    const left = parseAddSub();
    const t = peek();
    if (t && t.type === "CMP") {
      next();
      const right = parseAddSub();
      switch (t.value) {
        case "==": return left === right ? 1 : 0;
        case "!=": return left !== right ? 1 : 0;
        case "<": return left < right ? 1 : 0;
        case ">": return left > right ? 1 : 0;
        case "<=": return left <= right ? 1 : 0;
        case ">=": return left >= right ? 1 : 0;
        default: throw new FormulaError("Unsupported comparator");
      }
    }
    return left;
  }

  function parseAddSub() {
    let val = parseMulDiv();
    while (peek() && (peek().type === "+" || peek().type === "-")) {
      const op = next().type;
      const rhs = parseMulDiv();
      val = op === "+" ? val + rhs : val - rhs;
    }
    return val;
  }

  function parseMulDiv() {
    let val = parseUnary();
    while (peek() && (peek().type === "*" || peek().type === "/")) {
      const op = next().type;
      const rhs = parseUnary();
      if (op === "/") {
        if (rhs === 0) throw new FormulaError("#DIV/0!");
        val = val / rhs;
      } else {
        val = val * rhs;
      }
    }
    return val;
  }

  function parseUnary() {
    if (peek() && peek().type === "-") { next(); return -parseUnary(); }
    if (peek() && peek().type === "+") { next(); return parseUnary(); }
    return parsePrimary();
  }

  function parsePrimary() {
    const t = peek();
    if (!t) throw new FormulaError("Unexpected end of formula");
    if (t.type === "NUM") { next(); return t.value; }
    if (t.type === "CELL") { next(); return ctx.resolveCell(t.value); }
    if (t.type === "(") {
      next();
      const val = parseCompare();
      expect(")");
      return val;
    }
    if (t.type === "IDENT") {
      next();
      expect("(");
      const args = parseArgs();
      expect(")");
      return callFunction(t.value, args);
    }
    throw new FormulaError(`Unexpected token`);
  }

  function parseArgs() {
    const args = [];
    if (peek() && peek().type === ")") return args;
    args.push(parseArg());
    while (peek() && peek().type === ",") {
      next();
      args.push(parseArg());
    }
    return args;
  }

  function parseArg() {
    if (peek() && peek().type === "RANGE") {
      const t = next();
      return { kind: "range", values: ctx.resolveRange(t.value) };
    }
    return { kind: "value", value: parseCompare() };
  }

  function callFunction(name, args) {
    const nums = (a) => (a.kind === "range" ? a.values : [a.value]);
    if (name === "SUM") {
      return args.flatMap(nums).reduce((s, v) => s + (Number(v) || 0), 0);
    }
    if (name === "AVERAGE") {
      const vals = args.flatMap(nums).map(Number).filter((v) => !isNaN(v));
      return vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
    }
    if (name === "IF") {
      if (args.length !== 3) throw new FormulaError("IF needs 3 arguments");
      const [cond, ifTrue, ifFalse] = args;
      return cond.value ? ifTrue.value : ifFalse.value;
    }
    throw new FormulaError(`Unknown function ${name}`);
  }

  const result = parseCompare();
  if (pos < tokens.length) throw new FormulaError("Unexpected trailing input");
  return result;
}

// Full recalc over every cell in `rawInputs` ({cellId: rawValue}), resolving
// "=..." formulas (with cell-ref/range dependencies) and passing plain
// numbers/text through unchanged. Returns { values, errors } — error cells
// carry a "#..." sentinel string in both maps.
export function evaluateSheet(rawInputs) {
  const cache = {};
  const stack = new Set();

  function computeCell(id) {
    const raw = rawInputs[id];
    if (raw === undefined || raw === null || raw === "") return 0;
    if (typeof raw === "number") return raw;
    const str = String(raw).trim();
    if (str.startsWith("=")) {
      const tokens = tokenize(str.slice(1));
      return parseExpr(tokens, { resolveCell, resolveRange });
    }
    if (str !== "" && !isNaN(Number(str))) return Number(str);
    return str;
  }

  function resolveCell(id) {
    if (id in cache) {
      const v = cache[id];
      if (v && typeof v === "object" && v.__error) throw new FormulaError(v.__error);
      return v;
    }
    if (stack.has(id)) throw new FormulaError("#CIRC!");
    stack.add(id);
    try {
      const result = computeCell(id);
      cache[id] = result;
      stack.delete(id);
      return result;
    } catch (e) {
      cache[id] = { __error: e.message || "#ERR!" };
      stack.delete(id);
      throw e;
    }
  }

  function resolveRange(rangeStr) {
    return expandRange(rangeStr).map((id) => {
      try { return resolveCell(id); } catch { return 0; }
    });
  }

  const values = {};
  const errors = {};
  for (const id of Object.keys(rawInputs)) {
    try {
      values[id] = resolveCell(id);
    } catch (e) {
      const msg = e.message && e.message.startsWith("#") ? e.message : "#ERR!";
      values[id] = msg;
      errors[id] = msg;
    }
  }
  return { values, errors };
}

// Merges a task's spreadsheet_template (rows/cols/prefilled/locked_cells)
// with the student's own edits (`value`, keyed by cellId, editable cells
// only) into the full raw-input map every cell needs for evaluateSheet.
export function mergeRawInputs(template, value) {
  const { rows, cols, prefilled = {}, locked_cells = [] } = template || {};
  const lockedSet = new Set(locked_cells);
  const merged = {};
  for (let r = 0; r < (rows || 0); r++) {
    for (let c = 0; c < (cols || 0); c++) {
      const id = cellId(r, c);
      merged[id] = lockedSet.has(id) ? prefilled[id] ?? "" : value[id] ?? prefilled[id] ?? "";
    }
  }
  return merged;
}

// {cellId: {input, value}} for every cell in the grid — the wire format
// _auto_verify_spreadsheet (backend/internship_routes.py) grades against.
export function buildSubmissionPayload(template, value) {
  const rawInputs = mergeRawInputs(template, value);
  const { values } = evaluateSheet(rawInputs);
  const payload = {};
  for (const id of Object.keys(rawInputs)) {
    payload[id] = { input: rawInputs[id], value: values[id] };
  }
  return payload;
}
