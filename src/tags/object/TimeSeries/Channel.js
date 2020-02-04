import React from "react";
import { observer, inject } from "mobx-react";
import { types } from "mobx-state-tree";

import ObjectBase from "../Base";
import ObjectTag from "../../../components/Tags/Object";
import Registry from "../../../core/Registry";
import Types from "../../../core/Types";
import { guidGenerator, restoreNewsnapshot } from "../../../core/Helpers";

const TagAttrs = types.model({
  name: types.maybeNull(types.string),
  value: types.maybeNull(types.string),
  zoom: types.optional(types.boolean, false),
  volume: types.optional(types.boolean, false),
  speed: types.optional(types.boolean, false),
  hotkey: types.maybeNull(types.string),
});

const Model = types
  .model("TimeSeriesModel", {
    id: types.optional(types.identifier, guidGenerator),
    type: "timeseries",
    children: Types.unionArray(["channel", "view"]),
    _value: types.optional(types.string, ""),
  })
  .actions(self => ({}));

const TimeSeriesChannelModel = types.compose("TimeSeriesChannelModel", Model, TagAttrs, ObjectBase);

const HtxTimeSeriesChannelView = observer(({ store, item }) => {
  if (!item._value) return null;

  return <ObjectTag item={item}></ObjectTag>;
});

const HtxTimeSeriesChannel = inject("store")(observer(HtxTimeSeriesChannelView));

Registry.addTag("timeserieschannel", TimeSeriesChannelModel, HtxTimeSeriesChannel);

export { TimeSeriesChannelModel, HtxTimeSeriesChannel };
