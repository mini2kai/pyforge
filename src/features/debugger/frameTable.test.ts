import { describe, expect, it } from "vitest";
import {
  cellText,
  exportExpression,
  isDataFrame,
  MAX_COLS,
  MAX_ROWS,
  parseShape,
  parseSplit,
  tableExpression,
  unquote,
} from "./frameTable";

describe("isDataFrame", () => {
  it("recognises the type name a DAP variable carries", () => {
    expect(isDataFrame({ typeName: "DataFrame", value: "<...>" })).toBe(true);
    expect(isDataFrame({ typeName: "pandas.core.frame.DataFrame", value: "" })).toBe(true);
  });

  it("recognises the class name in a repr when the type is generic", () => {
    expect(isDataFrame({ typeName: "object", value: "<class 'pandas.core.frame.DataFrame'>" })).toBe(true);
  });

  it("leaves everything else alone", () => {
    for (const v of [
      { typeName: "list", value: "[1, 2, 3]" },
      { typeName: "int", value: "42" },
      { typeName: "Series", value: "0    1" },
      { typeName: null, value: "{'a': 1}" },
    ])
      expect(isDataFrame(v), JSON.stringify(v)).toBe(false);
  });
});

describe("tableExpression", () => {
  it("asks for split JSON, bounded, with a string fallback for odd dtypes", () => {
    const e = tableExpression("work_df");
    expect(e).toContain("work_df");
    expect(e).toContain(`iloc[0:${MAX_ROWS}, :${MAX_COLS}]`);
    expect(e).toContain("orient='split'");
    // Dates, Decimals and numpy scalars do not serialise on their own.
    expect(e).toContain("default=str");
    expect(e).toContain("ensure_ascii=False");
  });

  it("turns missing values into null, which is what JSON needs", () => {
    // `to_json` writes a bare `NaN`, which is not JSON; `where(notna, None)` gives `null`.
    const e = tableExpression("df");
    expect(e).toContain("astype(object)");
    expect(e).toContain("notna(), None");
    expect(e).not.toContain("to_json");
  });

  it("pages from an offset", () => {
    expect(tableExpression("df", 200)).toContain(`iloc[200:${200 + MAX_ROWS}, :${MAX_COLS}]`);
  });

  it("honours explicit limits", () => {
    expect(tableExpression("df", 0, 10, 3)).toContain("iloc[0:10, :3]");
  });
});

describe("parseSplit", () => {
  it("reads columns and rows", () => {
    const t = parseSplit('{"columns":["a","b"],"data":[[1,"x"],[2,null]]}');
    expect(t).toEqual({
      columns: ["a", "b"],
      rows: [
        ["1", "x"],
        ["2", ""],
      ],
    });
  });

  it("flattens a cell that holds a structure", () => {
    const t = parseSplit('{"columns":["c"],"data":[[{"k":1}]]}');
    expect(t?.rows[0]?.[0]).toBe('{"k":1}');
  });

  it("returns null for anything that is not split JSON", () => {
    expect(parseSplit("not json")).toBeNull();
    expect(parseSplit('{"a":1}')).toBeNull();
    expect(parseSplit('{"columns":[],"data":{}}')).toBeNull();
  });
});

describe("cellText", () => {
  it("keeps null and numbers readable", () => {
    expect(cellText(null)).toBe("");
    expect(cellText(undefined)).toBe("");
    expect(cellText(0)).toBe("0");
    expect(cellText(1.5)).toBe("1.5");
    expect(cellText(false)).toBe("false");
    expect(cellText("")).toBe("");
  });
});

describe("unquote", () => {
  it("takes the debugger's quotes off a string result", () => {
    expect(unquote(`'{"a":1}'`)).toBe('{"a":1}');
    expect(unquote('"{\\"a\\":1}"')).toBe('{"a":1}');
  });

  it("leaves an unquoted value alone", () => {
    expect(unquote('{"a":1}')).toBe('{"a":1}');
  });
});

describe("parseShape", () => {
  it("reads the shape", () => {
    expect(parseShape("[540, 9]")).toEqual([540, 9]);
  });

  it("returns null for anything else", () => {
    expect(parseShape("not json")).toBeNull();
    expect(parseShape('{"rows":1}')).toBeNull();
    expect(parseShape("[1]")).toBeNull();
  });
});

describe("exportExpression", () => {
  it("writes on the debuggee's side, never through the wire", () => {
    const e = exportExpression("work_df", "C:/tmp/out.xlsx", "xlsx");
    expect(e).toContain("work_df");
    expect(e).toContain("to_excel");
    expect(e).toContain("index=False");
    // The path goes in as a JSON string literal, so Windows backslashes survive.
    expect(e).toContain('"C:/tmp/out.xlsx"');
    // Returns True rather than the frame: the debugger would try to expand that.
    expect(e).toMatch(/,\s*True\)\[1\]$/);
  });

  it("writes CSV with a BOM, so Excel reads UTF-8", () => {
    const e = exportExpression("df", "/tmp/a.csv", "csv");
    expect(e).toContain("to_csv");
    expect(e).toContain("utf-8-sig");
  });

  it("escapes a path with quotes in it", () => {
    expect(exportExpression("df", 'C:/a b/"x".csv', "csv")).toContain('"C:/a b/\\"x\\".csv"');
  });
});
