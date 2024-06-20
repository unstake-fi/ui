import { TimeRange, type DateLineChartData } from "./types";

/**
 * Returns data within the time range and sums data values that belong to the same nearby date
 */
export function aggregateDataByDates(
  chartData: DateLineChartData[],
  timeRange: TimeRange
) {
  const initialDates: { [key: string]: DateLineChartData } = {};
  const minDate = getNearestDate(
    new Date(Date.now() - msInRange(timeRange)),
    timeRange
  );

  let currentDate = minDate;
  while (currentDate.getTime() < Date.now()) {
    const nearestDate = getNearestDate(currentDate, timeRange);
    const timeKey = nearestDate.toISOString();
    initialDates[timeKey] = {
      y: 0,
      x: nearestDate,
    };
    currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
  }

  return Object.values(
    chartData
      .filter((value) => value.x.getTime() >= minDate.getTime())
      .reduce((acc: { [key: string]: DateLineChartData }, current) => {
        console.log(current.x)
        const nearestDate = getNearestDate(current.x, timeRange);
        const timeKey = nearestDate.toISOString();
        acc[timeKey].y += current.y;
        return acc;
      }, initialDates)
  ).sort((a, b) => a.x.getTime() - b.x.getTime());
}

export function msInRange(timeRange: TimeRange) {
  switch (timeRange) {
    case TimeRange["1D"]:
      return 86400000;
    case TimeRange["5D"]:
      return 432000000;
    case TimeRange["2W"]:
      return 1209600000;
    case TimeRange["6M"]:
      return 15778800000;
    case TimeRange["1Y"]:
      return 31557600000;
    case TimeRange.MAX:
      return 94672800000;
  }
}

export function getNearestDate(date: Date, timeRange: TimeRange) {
  const nearestDate = new Date(date.getTime());
  switch (timeRange) {
    case TimeRange["1D"]:
    case TimeRange["5D"]:
    case TimeRange["2W"]:
      // Round to the nearest day
      nearestDate.setHours(0);
      nearestDate.setMinutes(0);
      nearestDate.setSeconds(0);
      nearestDate.setMilliseconds(0);
      return nearestDate;
    case TimeRange["6M"]:
    case TimeRange["1Y"]:
    case TimeRange.MAX:
      // Round to the nearest month
      nearestDate.setHours(0);
      nearestDate.setMinutes(0);
      nearestDate.setSeconds(0);
      nearestDate.setMilliseconds(0);
      nearestDate.setDate(1);
      return nearestDate;
  }
}

export function getTooltipFormat(timeRange: TimeRange) {
  switch (timeRange) {
    case TimeRange["1D"]:
    case TimeRange["5D"]:
    case TimeRange["2W"]:
      return "MMMM Do YYYY";
    case TimeRange["6M"]:
    case TimeRange["1Y"]:
    case TimeRange.MAX:
      return "MMMM YYYY";
  }
}

export function getRangeText(timeRange: TimeRange) {
  switch (timeRange) {
    case TimeRange["1D"]:
      return "past day";
    case TimeRange["5D"]:
      return "past 5 days";
    case TimeRange["2W"]:
      return "past 2 weeks";
    case TimeRange["6M"]:
      return "past 6 months";
    case TimeRange["1Y"]:
      return "past year";
    case TimeRange.MAX:
      return "all time";
  }
}
