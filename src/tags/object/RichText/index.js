import { RichTextModel } from "./model";
import { HtxRichText } from "./view";
import Registry from "../../../core/Registry";

Registry.addTag("richtext", RichTextModel, HtxRichText);

export { RichTextModel, HtxRichText };
