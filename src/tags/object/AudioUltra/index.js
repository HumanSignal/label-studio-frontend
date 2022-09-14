import Registry from "../../../core/Registry";
import { AudioUltraModel } from "./model";
import { AudioView } from './view';
import { FF_DEV_2715, isFF } from "../../../utils/feature-flags";

if (isFF(FF_DEV_2715)) {
  Registry.addTag("audio", AudioUltraModel, AudioView);
  Registry.addTag("audioplus", AudioUltraModel, AudioView);
}

Registry.addObjectType(AudioUltraModel);

export { AudioView, AudioUltraModel };
