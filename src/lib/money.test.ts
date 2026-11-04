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

  it("shows 2 decimals unless more are not zero (R-FIN-18)", () => {
    expect(formatAmount(5_000_000, 6, "JCN")).toBe("5.00 JCN");
    expect(formatAmount(5_100_000, 6, "JCN")).toBe("5.10 JCN");
    expect(formatAmount(5_123_000, 6, "JCN")).toBe("5.123 JCN");
    expect(formatAmount(1_229_769_229, 6, "JCN")).toBe("1229.769229 JCN");
    expect(formatAmount(12_345_678, 8, "BTC")).toBe("0.12345678 BTC");
    expect(formatAmount(1, 8, "BTC")).toBe("0.00000001 BTC");
    expect(formatAmount(-250_000, 4, "RBO")).toBe("-25.00 RBO");
    expect(formatAmount(7, 1, "ONE")).toBe("0.7 ONE");
  });

  it("formats 64-bit amounts exactly, beyond what a JavaScript number holds", () => {
    expect(formatAmount(100_000_000_000_000n, 8, "BTC")).toBe("1000000.00 BTC"); // 1,000,000 units at 8 decimals
    expect(formatAmount(10_000_000_000_000n, 8, "BTC")).toBe("100000.00 BTC");
    expect(formatAmount(123_456_789_012_345_678n, 8, "BTC")).toBe("1234567890.12345678 BTC");
    expect(formatAmount(2n ** 63n - 1n, 8, "BTC")).toBe("92233720368.54775807 BTC");
    expect(formatAmount(-(2n ** 63n), 2)).toBe("-92233720368547758.08");
    expect(formatAmount(2_147_483_648n, 2, "CHF")).toBe("21474836.48 CHF");
  });
});

describe("parseAmount", () => {
  it("reads typed amounts as minor units", () => {
    expect(parseAmount("25.50", 2)).toBe(2550n);
    expect(parseAmount("25.5", 2)).toBe(2550n);
    expect(parseAmount("25", 2)).toBe(2500n);
    expect(parseAmount("25.", 2)).toBe(2500n);
    expect(parseAmount(" 1'234.05 ", 2)).toBe(123405n);
    expect(parseAmount("1,234", 2)).toBe(123400n);
    expect(parseAmount("42", 0)).toBe(42n);
    expect(parseAmount("0.12345678", 8)).toBe(12_345_678n);
  });

  it("reads large amounts exactly", () => {
    expect(parseAmount("1000000", 8)).toBe(100_000_000_000_000n);
    expect(parseAmount("1,000,000.00000001", 8)).toBe(100_000_000_000_001n);
    expect(parseAmount("92233720368.54775807", 8)).toBe(2n ** 63n - 1n);
  });

  it("refuses what isn't an amount", () => {
    expect(parseAmount("", 2)).toBeNull();
    expect(parseAmount("abc", 2)).toBeNull();
    expect(parseAmount("-5", 2)).toBeNull();
    expect(parseAmount("1.234", 2)).toBeNull();
    expect(parseAmount("1.5", 0)).toBeNull();
  });
});
