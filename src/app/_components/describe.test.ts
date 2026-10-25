// Tests for the date wording screens show: always "25 Oct 2026", whatever
// the browser's language, and the End-before-Start message of the date field.

import { describe, expect, it } from "vitest";
import { dateOrderError, formatDate, formatDay } from "./describe";

describe("formatDay (what a date box holds)", () => {
  it("writes day, short month and year", () => {
    expect(formatDay("2026-10-25")).toBe("25 Oct 2026");
    expect(formatDay("2026-09-01")).toBe("1 Sep 2026");
    expect(formatDay("2027-01-31")).toBe("31 Jan 2027");
  });

  it("is empty for no date or something that isn't one", () => {
    expect(formatDay("")).toBe("");
    expect(formatDay("25/10/2026")).toBe("");
  });
});

describe("formatDate (dates from the server)", () => {
  it("uses the same wording, on the local day", () => {
    expect(formatDate(new Date(2026, 9, 25, 0, 30))).toBe("25 Oct 2026");
    expect(formatDate(new Date(2026, 8, 9))).toBe("9 Sep 2026");
    expect(formatDate(null)).toBe("");
  });
});

describe("dateOrderError", () => {
  it("refuses an end before the start, naming the start", () => {
    expect(dateOrderError("2026-11-01", "2026-10-31")).toBe("End can't be before Start (1\u00a0Nov\u00a02026).");
  });

  it("allows the same day, a later day, or either date empty", () => {
    expect(dateOrderError("2026-11-01", "2026-11-01")).toBeNull();
    expect(dateOrderError("2026-11-01", "2027-01-01")).toBeNull();
    expect(dateOrderError("", "2026-10-31")).toBeNull();
    expect(dateOrderError("2026-11-01", "")).toBeNull();
  });
});
