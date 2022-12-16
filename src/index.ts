import './assets/styles/global.scss';
import './core/feature-flags';
import { LabelStudio } from './LabelStudio';

Object.assign(window, { LabelStudio });

export default LabelStudio;

export { LabelStudio };
