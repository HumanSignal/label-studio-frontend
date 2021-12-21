import { TimelineView } from "../Types";
import { default as frames } from "./Frames";

const Views = {
  frames,
};

export type ViewTypes = keyof typeof Views;
export type ViewType<T extends ViewTypes> = (typeof Views)[T];

type ControlsType<D extends ViewTypes> = ViewType<D>["Controls"];

type ControlsInnerType<C extends TimelineView> = C["Controls"];

type Params = ControlsInnerType<typeof Views.frames>;

type Args<C> = C extends Params<infer T> ? T : unknown;

export default Views;
