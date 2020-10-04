import { RichTextModel } from "./model";
import { HtxRichText } from "./view";
import Registry from "../../../core/Registry";

Registry.addTag("hypertext", RichTextModel, HtxRichText({ isText: false }));
Registry.addTag("text", RichTextModel, HtxRichText({ isText: true }));

export { RichTextModel, HtxRichText };
