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

/**
 * DateTime adds date and time selection
 *
 * @example
 * <View>
 *   <Text name="txt" value="$text" />
 *   <DateTime name="datetime" toName="txt" only="date" />
 * </View>
 *
 * @name DateTime
 * @param {string} name              - Name of the element
 * @param {string} toName            - Name of the element that you want to label
 * @param {string} only              - Comma-separated list of parts to display (date, time)
 * @param {string} format                     - Input/output strftime format for datetime (internally it's always ISO);
 *        by default this is ISO with "T" separator when bot date and time parts enabled;
 *        that's ISO date when only date is enabled;
 *        that's just a 24h time with leading zero when only time is enabled
 * @param {string} [min]             - Minimum datetime value
 * @param {string} [max]             - Maximum datetime value
 * @param {boolean} [required=false] - Whether datetime is required or not
 * @param {string} [requiredMessage] - Message to show if validation fails
 * @param {boolean} [perRegion]      - Use this tag to label regions instead of the whole object
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
      return isDefined(self.date) || isDefined(self.time);
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

    get datetime() {
      if (self.onlyTime) return self.time || "00:00";
      if (!self.date) return null;

      const dateStr = `${self.date}T${self.time || "00:00"}`;
      const date = new Date(dateStr);

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
    date: null,
    time: null,
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
  .volatile(() => {
    const months = [];
    const monthName = d3.timeFormat("%B");
    const date = new Date("2021-01-13");

    for (let m = 0; m < 12; m++) {
      date.setMonth(m);
      months[m] = monthName(date);
    }

    return { months };
  })
  .actions(self => ({
    copyState(obj) {
      self.setDateTime(obj.datetime);
    },

    needsUpdate() {
      if (self.result) {
        self.setDateTime(self.result.mainValue);
      } else {
        self.date = null;
        self.time = null;
      }
    },

    unselectAll() {},

    resetDateTime() {
      self.date = null;
      self.time = null;
    },

    setDateTime(value) {
      if (self.onlyTime) {
        self.time = value;
        return;
      }

      const date = self.parseDateTime(value);

      if (!date) return self.resetDateTime();

      self.date = self.formatDate(date);
      self.time = self.formatTime(date);
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

    setDatePart(index, value) {
      const now = self.formatDate(new Date);
      const date = self.date ?? now;
      const parts = date.split("-");
      const defaultParts = now.split("-");

      parts[index] = value || defaultParts[index];
      self.date = parts.join("-");

      self.updateResult();
    },

    onMonthChange(e) {
      self.setDatePart(1, e.target.value);
    },

    onYearChange(e) {
      self.setDatePart(0, e.target.value);
    },

    onDateChange(e) {
      self.date = e.target.value;
      self.updateResult();
    },
    
    onTimeChange(e) {
      self.time = e.target.value;
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
      style: { width: "auto" },
      className: "ant-input",
    };
    const [minTime, maxTime] = [item.min, item.max].map(s => s?.match(/\d?\d:\d\d/)?.[0]);

    return (
      <div style={visibleStyle}>
        {item.showMonth && (
          <select
            name={item.name + "-date"}
            onChange={item.onMonthChange}
          >
            <option value="">Select month...</option>
            {item.months.map((month, index) => (
              <option key={month} value={`${index < 9 ? "0" : ""}${index + 1}`}>
                {month}
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
