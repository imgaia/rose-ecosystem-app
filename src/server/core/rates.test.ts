import { describe, expect, it } from "vitest";
import { RuleError } from "./errors";
import { convert, findRate, parseDecimal } from "./rates";

const CHF = { code: "CHF", decimals: 2 };
const RCC = { code: "RCC", decimals: 2 };

describe("rates", () => {
  it("parses decimals exactly", () => {
    expect(parseDecimal("1.25")).toEqual({ num: 125n, den: 100n });
    expect(() => parseDecimal("-1")).toThrow();
    expect(() => parseDecimal("0")).toThrow();
  });

  it("finds a rate in either direction", () => {
    expect(findRate("CHF", "RCC")?.text).toBe("1");
    expect(findRate("RCC", "CHF")?.text).toBe("1/1");
    expect(findRate("CHF", "EUR")).toBeNull();
  });

  it("converts in whole minor units, dividing by a ratio and rounding down", () => {
    expect(convert(1_000, CHF, RCC).toAmount).toBe(1_000);
    expect(convert(1_000, CHF, RCC, "0.5").toAmount).toBe(2_000);
    expect(convert(1_000, CHF, RCC, "3").toAmount).toBe(333);
    expect(convert(1_000, CHF, { code: "RCC", decimals: 0 }).toAmount).toBe(10);
  });

  it("refuses a pair the rates file doesn't have (R-FIN-05)", () => {
    const error = (() => {
      try {
        convert(100, CHF, { code: "EUR", decimals: 2 });
      } catch (e) {
        return e;
      }
    })();
    expect(error).toBeInstanceOf(RuleError);
    expect((error as RuleError).ruleIds).toEqual(["R-FIN-05"]);
  });
});
