import assert from "node:assert/strict";
import { test } from "node:test";
import { isValidDateOnly } from "../src/shared/lib/dates";
import { formatISODate, formatShortDate } from "../src/shared/lib/utils";

test("calendar dates reject impossible values and allow past history", () => {
  for (const value of ["", "2035-02-29", "2024-02-30", "2024-13-01", "2024-1-01", "junk"]) {
    assert.equal(isValidDateOnly(value), false, value);
  }
  for (const value of ["2024-02-29", "2035-06-15", "2000-01-01"]) assert.equal(isValidDateOnly(value), true);
});

test("date-only formatting retains the date across timezones", () => {
  const original = process.env.TZ;
  try {
    for (const timezone of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
      process.env.TZ = timezone;
      assert.equal(formatISODate("2035-06-15"), "2035-06-15");
      assert.match(formatShortDate("2035-06-15"), /Jun 15$/);
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});
