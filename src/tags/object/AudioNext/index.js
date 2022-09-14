import Registry from "../../../core/Registry";
import { AudioModel } from "./model";
import { AudioUltraModel } from "../AudioUltra/model";
import { HtxAudio } from "./view_old";
import { AudioNext } from './view';
import { AudioView } from '../AudioUltra/view';
import { AudioRegionModel } from "../../../regions/AudioRegion";
import { FF_DEV_1713, FF_DEV_2715, isFF } from "../../../utils/feature-flags";

// Fallback to the previos version
let _tagView = HtxAudio;
let _model = AudioModel;

if (isFF(FF_DEV_1713)) {
  _tagView = AudioNext;
}

if (isFF(FF_DEV_2715)) {
  _model = AudioUltraModel;
  _tagView = AudioView;
}


// Replacing both Audio and AudioPlus
// Must add a deprecation warning
Registry.addTag("audio", _model, _tagView);
Registry.addTag("audioplus", _model, _tagView);
Registry.addObjectType(_model);

export { AudioRegionModel, _model as AudioModel, HtxAudio };
