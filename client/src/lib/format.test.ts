import { describe, expect, it } from "vitest";
import { formatCompactNumber, formatCurrency, formatPercent, formatVolume, trendOf } from "@/lib/format";

describe("format helpers", () => {
  it("formats currency in INR", () => {
    expect(formatCurrency(1234.5)).toContain("1,234.50");
    expect(formatCurrency(null)).toBe("—");
  });

  it("formats percentages with an optional sign", () => {
    expect(formatPercent(2.5, { sign: true })).toBe("+2.50%");
    expect(formatPercent(-1.234, { sign: true })).toBe("-1.23%");
  });

  it("classifies trends", () => {
    expect(trendOf(1)).toBe("up");
    expect(trendOf(-1)).toBe("down");
    expect(trendOf(0)).toBe("flat");
    expect(trendOf(null)).toBe("flat");
  });

  it("formats volume using Indian units", () => {
    expect(formatVolume(2_50_00_000)).toBe("2.50 Cr");
    expect(formatVolume(3_40_000)).toBe("3.40 L");
  });

  it("compacts large numbers", () => {
    expect(formatCompactNumber(1_500_000)).toContain("15");
  });
});
