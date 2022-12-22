import Registry from '../../../core/Registry';
import { ParagraphsModel } from './Model';
import { HtxParagraphs } from './Paragraphs';

Registry.addTag('paragraphs', ParagraphsModel, HtxParagraphs);
Registry.addObjectType(ParagraphsModel);

export * from './Model';
export * from './Paragraphs';