import { describe, expect, it } from "vitest";
import { formatAmount } from "./money";

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
