import Registry from '../../../core/Registry';
import { AudioModel } from './model';
import { HtxAudio } from './view_old';
import { AudioNext } from './view';
import { AudioRegionModel } from '../../../regions/AudioRegion';
import { FF_DEV_1713, isFF } from '../../../utils/feature-flags';

// Fallback to the previos version
let TagView = HtxAudio;

if (isFF(FF_DEV_1713)) {
  TagView = AudioNext;
}

// Replacing both Audio and AudioPlus
// Must add a deprecation warning
Registry.addTag('audio', AudioModel, TagView);
Registry.addTag('audioplus', AudioModel, TagView);
Registry.addObjectType(AudioModel);

export { AudioRegionModel, AudioModel, HtxAudio };
