const MINUS = "−";

function num(value: number, digits: number) {
  return Math.abs(value).toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function sign(value: number, digits: number, signed: boolean) {
  const rounded = Number(value.toFixed(digits));
  if (rounded < 0) return MINUS;
  if (signed && rounded > 0) return "+";
  return "";
}

/** Fração → "12,3%". */
export function fmtPct(value: number, digits = 1, signed = false) {
  const v = value * 100;
  return `${sign(v, digits, signed)}${num(v, digits)}%`;
}

/** p.p. já em pontos → "+1,2 p.p.". */
export function fmtPP(value: number, digits = 1, signed = true) {
  return `${sign(value, digits, signed)}${num(value, digits)} p.p.`;
}

/** R$ milhões ilustrativos → "R$ 1.987 mi". */
export function fmtBRL(value: number, digits = 0, signed = false) {
  return `${sign(value, digits, signed)}R$ ${num(value, digits)} mi`;
}

export function fmtNumber(value: number, digits = 1, signed = false) {
  return `${sign(value, digits, signed)}${num(value, digits)}`;
}

export function fmtMultiple(value: number, digits = 2) {
  return `${num(value, digits)}x`;
}
