import { describe, expect, it } from "vitest";
import { formatAmount, parseAmount } from "./money";

describe("formatAmount", () => {
  it("puts the point where the currency's decimals say", () => {
    expect(formatAmount(2550, 2, "RCC")).toBe("25.50 RCC");
    expect(formatAmount(5, 2, "CHF")).toBe("0.05 CHF");
    expect(formatAmount(0, 2, "CHF")).toBe("0.00 CHF");
    expect(formatAmount(-1234, 2, "CHF")).toBe("-12.34 CHF");
    expect(formatAmount(42, 0, "PTS")).toBe("42 PTS");
    expect(formatAmount(100, 2)).toBe("1.00");
  });
});

describe("parseAmount", () => {
  it("reads typed amounts as minor units", () => {
    expect(parseAmount("25.50", 2)).toBe(2550);
    expect(parseAmount("25.5", 2)).toBe(2550);
    expect(parseAmount("25", 2)).toBe(2500);
    expect(parseAmount("25.", 2)).toBe(2500);
    expect(parseAmount(" 1'234.05 ", 2)).toBe(123405);
    expect(parseAmount("1,234", 2)).toBe(123400);
    expect(parseAmount("42", 0)).toBe(42);
  });

  it("refuses what isn't an amount", () => {
    expect(parseAmount("", 2)).toBeNull();
    expect(parseAmount("abc", 2)).toBeNull();
    expect(parseAmount("-5", 2)).toBeNull();
    expect(parseAmount("1.234", 2)).toBeNull();
    expect(parseAmount("1.5", 0)).toBeNull();
  });
});
