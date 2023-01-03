import { types } from 'mobx-state-tree';

import WithStatesMixin from '../mixins/WithStates';
import NormalizationMixin from '../mixins/Normalization';
import RegionsMixin from '../mixins/Regions';
import { AreaMixin } from '../mixins/AreaMixin';
import Registry from '../core/Registry';
import { FF_DEV_2715, isFF } from '../utils/feature-flags';

import { AudioUltraRegionModel as _audioUltraRegionModel } from './AudioRegion/AudioUltraRegionModel';
import { AudioRegionModel as _audioRegionModel } from './AudioRegion/AudioRegionModel';
import { EditableRegion } from './EditableRegion';

const EditableAudioModel = types
  .model('EditableAudioModel', {})
  .volatile(() => ({
    editableFields: [
      { property: 'start', label: 'Start' },
      { property: 'end', label: 'End' },
    ],
  }));

const AudioRegionModel = types.compose(
  'AudioRegionModel',
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  EditableRegion,
  EditableAudioModel,
  _audioRegionModel,
);

const AudioUltraRegionModel = types.compose(
  'AudioRegionModel',
  WithStatesMixin,
  RegionsMixin,
  AreaMixin,
  NormalizationMixin,
  EditableRegion,
  EditableAudioModel,
  _audioUltraRegionModel,
);

let _exportAudioRegion = AudioRegionModel;

if (isFF(FF_DEV_2715)) {
  _exportAudioRegion = AudioUltraRegionModel;
}

Registry.addRegionType(_exportAudioRegion, 'audioplus');
Registry.addRegionType(_exportAudioRegion, 'audio');

export { _exportAudioRegion as AudioRegionModel };
