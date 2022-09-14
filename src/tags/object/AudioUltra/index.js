import Registry from "../../../core/Registry";
import { AudioUltraModel } from "./model";
import { AudioView } from './view';


Registry.addTag("audioultra", AudioUltraModel, AudioView);
Registry.addObjectType(AudioUltraModel);

export { AudioView, AudioUltraModel };
