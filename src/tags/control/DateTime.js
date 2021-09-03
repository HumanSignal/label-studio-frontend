import * as d3 from "d3";
import React from "react";
import { observer, inject } from "mobx-react";
import { types } from "mobx-state-tree";

import InfoModal from "../../components/Infomodal/Infomodal";
import { guidGenerator } from "../../core/Helpers";
import Registry from "../../core/Registry";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import PerRegionMixin from "../../mixins/PerRegion";
import RequiredMixin from "../../mixins/Required";
import { isDefined } from "../../utils/utilities";
import ControlBase from "./Base";

const FORMAT_FULL = "%Y-%m-%dT%H:%M";
const FORMAT_DATE = "%Y-%m-%d";
const FORMAT_TIME = "%H:%M";

const ISO_DATE_SEPARATOR = "T";

const zero = n => (n < 10 ? "0" : "") + n;

/**
 * The DateTime tag adds date and time selection to the labeling interface. Use this tag to add a date, timestamp, month, or year to an annotation.
 *
 * Use with the following data types: audio, image, HTML, paragraph, text, time series, video
 * @example
 * <View>
 *   <Text name="txt" value="$text" />
 *   <DateTime name="datetime" toName="txt" only="date" />
 * </View>
 *
 * @name DateTime
 * @param {string} name              - Name of the element
 * @param {string} toName            - Name of the element that you want to label
 * @param {string} only              - Comma-separated list of parts to display (date, time, month, year)
 *        date and month/year can't be used together. The date option takes precedence
 * @param {string} format            - Input/output strftime format for datetime (internally it's always ISO);
 *        when both date and time are displayed, by default shows ISO with a "T" separator;
 *        when only date is displayed, by default shows ISO date;
 *        when only time is displayed, by default shows a 24h time with leading zero
 * @param {string} [min]             - Set a minimum datetime value for only=date, minimum year for only=year
 * @param {string} [max]             - Set a maximum datetime value for only=date, maximum year for only=year
 * @param {boolean} [required=false] - Whether datetime is required or not
 * @param {string} [requiredMessage] - Message to show if validation fails
 * @param {boolean} [perRegion]      - Use this option to label regions instead of the whole object
 */
const TagAttrs = types.model({
  name: types.identifier,
  toname: types.maybeNull(types.string),

  format: types.maybeNull(types.string),
  only: types.maybeNull(types.string),
  min: types.maybeNull(types.string),
  max: types.maybeNull(types.string),
  step: types.maybeNull(types.string),
  defaultvalue: types.maybeNull(types.string),

  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model({
    pid: types.optional(types.string, guidGenerator),
    type: "datetime",
  })
  .views(self => ({
    selectedValues() {
      return self.datetime;
    },

    get holdsState() {
      return (isDefined(self.month) && isDefined(self.year)) || isDefined(self.time);
    },

    get showDate() {
      return !self.only || self.only.includes("date");
    },

    get showTime() {
      return !self.only || self.only.includes("time");
    },

    get onlyTime() {
      return self.only === "time";
    },

    get showMonth() {
      return self.only?.includes("month") && !self.only?.includes("date");
    },

    get showYear() {
      return self.only?.includes("year") && !self.only?.includes("date");
    },

    get date() {
      if (!self.month || !self.year) return undefined;
      return [self.year, zero(self.month), zero(self.day)].join("-");
    },

    get datetime() {
      const timeStr = self.time || "00:00";

      if (self.onlyTime) return timeStr;
      if (!self.date) return undefined;

      const date = new Date(self.date + ISO_DATE_SEPARATOR + timeStr);

      return self.formatDateTime(date);
    },

    get result() {
      if (self.perregion) {
        const area = self.annotation.highlightedNode;

        if (!area) return null;

        return self.annotation.results.find(r => r.from_name === self && r.area === area);
      }
      return self.annotation.results.find(r => r.from_name === self);
    },
  }))
  .volatile(() => ({
    day: undefined,
    month: undefined,
    year: undefined,
    time: undefined,
    formatDate: d3.timeFormat(FORMAT_DATE),
    formatTime: d3.timeFormat(FORMAT_TIME),
  }))
  .volatile(self => {
    let format;

    if (self.onlyTime) format = String; // don't format only=time
    else if (self.format) format = self.format;
    else if (!self.showTime) format = FORMAT_DATE;
    else format = FORMAT_FULL;

    return {
      formatDateTime: d3.timeFormat(format),
      parseDateTime: d3.timeParse(format),
    };
  })
  .volatile(self => {
    const years = [];
    const months = [];
    const monthName = d3.timeFormat("%B");
    const date = new Date;
    const getYear = minmax => {
      if (minmax === "current") return date.getFullYear();
      if (minmax.length === 4) return minmax;
      return self.parseDateTime(minmax)?.getFullYear();
    };
    const minYear = getYear(self.min ?? "2000");
    const maxYear = getYear(self.max ?? "current");

    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }

    for (let m = 0; m < 12; m++) {
      date.setMonth(m);
      months[m] = monthName(date);
    }

    return { months, years };
  })
  .actions(self => ({
    copyState(obj) {
      self.setDateTime(obj.datetime);
    },

    needsUpdate() {
      if (self.result) {
        self.setDateTime(self.result.mainValue);
      } else {
        self.resetDateTime();
      }
    },

    unselectAll() {},

    resetDate() {
      self.day = undefined;
      self.month = undefined;
      self.year = undefined;
    },

    resetDateTime() {
      self.resetDate();
      self.time = undefined;
    },

    setDateTime(value) {
      if (self.onlyTime) {
        self.time = value;
        return;
      }

      const date = self.parseDateTime(value);

      if (!date) return self.resetDateTime();

      self.day = date.getDate();
      self.month = date.getMonth() + 1;
      self.year = date.getFullYear();

      if (self.showTime) {
        self.time = self.formatTime(date);
      }
    },

    updateResult() {
      if (self.result) {
        self.result.area.setValue(self);
      } else {
        if (self.perregion) {
          const area = self.annotation.highlightedNode;

          if (!area) return null;
          area.setValue(self);
        } else {
          self.annotation.createResult({}, { datetime: self.datetime }, self, self.toname);
        }
      }
    },

    onMonthChange(e) {
      self.month = +e.target.value || undefined;
      self.updateResult();
    },

    onYearChange(e) {
      self.year = +e.target.value || undefined;
      self.updateResult();
    },

    onDateChange(e) {
      const date = new Date(e.target.value);

      if (date && !isNaN(date)) {
        self.day = date.getDate();
        self.month = date.getMonth() + 1;
        self.year = date.getFullYear();
      } else {
        self.resetDate();
      }
      self.updateResult();
    },
    
    onTimeChange(e) {
      self.time = e.target.value || undefined;
      self.updateResult();
    },

    updateFromResult() {
      this.needsUpdate();
    },

    requiredModal() {
      InfoModal.warning(self.requiredmessage || `DateTime "${self.name}" is required.`);
    },
  }));

const DateTimeModel = types.compose("DateTimeModel", ControlBase, TagAttrs, Model, RequiredMixin, PerRegionMixin, AnnotationMixin);

const HtxDateTime = inject("store")(
  observer(({ item }) => {
    const visibleStyle = item.perRegionVisible() ? {} : { display: "none" };
    const visual = {
      style: { width: "auto", marginRight: "4px" },
      className: "ant-input",
    };
    const [minTime, maxTime] = [item.min, item.max].map(s => s?.match(/\d?\d:\d\d/)?.[0]);

    return (
      <div style={visibleStyle}>
        {item.showMonth && (
          <select
            {...visual}
            name={item.name + "-date"}
            value={item.month}
            onChange={item.onMonthChange}
          >
            <option value="">Month...</option>
            {item.months.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </select>
        )}
        {item.showYear && (
          <select
            {...visual}
            name={item.name + "-year"}
            value={item.year}
            onChange={item.onYearChange}
          >
            <option value="">Year...</option>
            {item.years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        )}
        {item.showDate && (
          <input
            {...visual}
            type="date"
            name={item.name + "-date"}
            value={item.date ?? ""}
            min={item.min}
            max={item.max}
            // defaultValue={Number(item.defaultvalue)}
            onChange={item.onDateChange}
          />
        )}
        {item.showTime && (
          <input
            {...visual}
            type="time"
            name={item.name + "-time"}
            value={item.time ?? ""}
            min={minTime}
            max={maxTime}
            onChange={item.onTimeChange}
          />
        )}
      </div>
    );
  }),
);

Registry.addTag("datetime", DateTimeModel, HtxDateTime);

export { HtxDateTime, DateTimeModel };
