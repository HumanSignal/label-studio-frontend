// this is just a virtual tag, expanded directly in Tree.tsx during config parsing

/**
 * Repeater Tag for using multiple data objects with the same semantics.
 * It repeats tags inside it for every item in given data array
 * @example
 * <Repeater on="$utterances" indexFlag="{{idx}}">
 *   <Text name="user_{{idx}}" value="$utterances[{{idx}}].text"/>
 *   <Header value="Utterance Review"/>
 *   <Choices name="utterance_action_{{idx}}" showInline="true" toName="user_{{idx}}">
 *     <Choice value="No Action"/>
 *     <Choice value="Training"/>
 *     <Choice value="New Intent"/>
 *   </Choices>
 * </Repeater>
 * @name Repeater
 * @meta_title Repeater Tag for using multiple data objects with the same semantics
 * @meta_description Allow to repeat similar data blocks in a simple way — like different versions of the text or different views on the same object for segmentation
 * @param {string} on                  - Data field object with array with similar data
 * @param {string} [indexFlag={{idx}}] - Placeholder for array index in params of underlying tags
 */
export const Repeater = () => {};
