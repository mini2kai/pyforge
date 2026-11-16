import { describe, expect, it } from "vitest";
import { columnText, normalized, numericColumns, rowText, selectionText, type Selection } from "./ui/FrameTableDialog";

const table = {
  columns: ["n", "dt", "price", "name"],
  rows: [
    ["1", "2026-01-01", "1.5", "工厂A"],
    ["2", "2026-01-02", "", "工厂B"],
    ["3", "2026-01-03", "2.25", "工厂C"],
  ],
};

const sel = (row: number, col: number, toRow: number, toCol: number): Selection => ({ row, col, toRow, toCol });

describe("normalized", () => {
  it("puts a backwards drag in reading order", () => {
    expect(normalized(sel(2, 3, 0, 1))).toEqual(sel(0, 1, 2, 3));
  });
});

describe("selectionText", () => {
  it("writes TSV with the selected column headers", () => {
    expect(selectionText(table, sel(0, 3, 1, 3), { columns: table.columns })).toBe("name\n工厂A\n工厂B");
  });

  it("writes a rectangle without headers", () => {
    expect(selectionText(table, sel(1, 0, 2, 1))).toBe("2\t2026-01-02\n3\t2026-01-03");
  });

  it("keeps an empty cell empty rather than dropping the column", () => {
    expect(selectionText(table, sel(1, 0, 1, 2))).toBe("2\t2026-01-02\t");
  });

  it("copies one cell", () => {
    expect(selectionText(table, sel(0, 0, 0, 0))).toBe("1");
  });
});

describe("columnText", () => {
  it("writes one value per line", () => {
    expect(columnText(table, 3)).toBe("工厂A\n工厂B\n工厂C");
  });
});

describe("rowText", () => {
  it("writes the row as TSV", () => {
    expect(rowText(table, 0)).toBe("1\t2026-01-01\t1.5\t工厂A");
  });
});

describe("numericColumns", () => {
  it("right-aligns only columns whose every value is a number", () => {
    expect(numericColumns(table)).toEqual([true, false, true, false]);
  });

  it("ignores empty cells when deciding", () => {
    const withGaps = { columns: ["a"], rows: [["1"], [""], ["3"]] };
    expect(numericColumns(withGaps)).toEqual([true]);
  });

  it("treats a column of blanks as not numeric", () => {
    expect(numericColumns({ columns: ["a"], rows: [[""], [""]] })).toEqual([false]);
  });
});
