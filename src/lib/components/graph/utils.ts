import { TimeRange } from "./types";

export function msInRange(range: TimeRange) {
    switch (range) {
      case TimeRange["1D"]:
        return 86400000;
      case TimeRange["5D"]:
        return 432000000;
      case TimeRange["6M"]:
        return 15778800000;
      case TimeRange["1Y"]:
        return 31557600000;
      case TimeRange.MAX:
        return 63115200000;
    }
  }