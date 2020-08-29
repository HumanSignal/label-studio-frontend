import { RichTextModel } from "./model";
import { HtxRichText } from "./view";
import Registry from "../../../core/Registry";

// Registry.addTag("richtext", RichTextModel, HtxRichText);
Registry.addTag("hypertext", RichTextModel, HtxRichText);
Registry.addTag("text", RichTextModel, HtxRichText);

export { RichTextModel, HtxRichText };
