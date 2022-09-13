import Registry from "../../../core/Registry";
import { AudioModel } from "./model";
import { AudioView } from './view';
import { AudioRegionModel } from "../../../regions/AudioRegion";
import * as AudioNext from "../AudioNext";
import { FF_DEV_2715, isFF } from "../../../utils/feature-flags";

// Fallback to the previos version
let TagView = AudioNext.HtxAudio;
let TagModel = AudioNext.AudioModel;
let TagRegionModel = AudioNext.AudioRegionModel;

if (isFF(FF_DEV_2715)) {
  TagView = AudioView;
  TagModel = AudioModel;
  TagRegionModel = AudioRegionModel;
}

// Replacing both Audio and AudioPlus
// Must add a deprecation warning
Registry.addTag("audio", AudioModel, TagView);
Registry.addTag("audioplus", AudioModel, TagView);
Registry.addObjectType(TagModel);

export { TagRegionModel as AudioRegionModel, TagModel as AudioModel, TagView as HtxAudio };
