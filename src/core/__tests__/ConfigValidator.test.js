/* global it, expect */
import Tree from "../Tree";
import "../../tags/object/Image";
import "../../tags/object/HyperText";
import "../../tags/control/RectangleLabels";
import "../../tags/control/Label";

it("Should fail if a tag referenced by toName doesn't exist", () => {
  const result = Tree.treeToModel(`
  <View>
    <Image name="img1" value="$image"></Image>
    <RectangleLabels name="tag" toName="img" fillOpacity="0.5" strokeWidth="5">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
  </View>
  `);

  const errorItem = result.validation[0];

  expect(errorItem.error).toBe("ERR_TAG_NOT_FOUND");
});

it("Should fail if a tag referenced by toName is not image", () => {
  const result = Tree.treeToModel(`
  <View>
    <HyperText name="img" value="$text"></HyperText>
    <RectangleLabels name="tag" toName="img" fillOpacity="0.5" strokeWidth="5">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
  </View>
  `);

  const errorItem = result.validation[0];

  expect(errorItem.error).toBe("ERR_TAG_UNSUPPORTED");
});

it("Should fail if tag lacks mandatory attribute toName", () => {
  const result = Tree.treeToModel(`
  <View>
    <Image name="img" value="$image"></Image>
    <RectangleLabels name="tag" fillOpacity="0.5" strokeWidth="5">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
  </View>
  `);

  const errorItem = result.validation[0];

  expect(errorItem.error).toBe("ERR_REQUIRED");
});

it("Should fail if opacity attribute is out of range", () => {
  const result = Tree.treeToModel(`
  <View>
    <Image name="img" value="$image"></Image>
    <RectangleLabels name="tag" toName="img" fillOpacity="-1" strokeWidth="5">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
  </View>
  `);

  const errorItem = result.validation[0];

  expect(errorItem.error).toBe("ERR_BAD_TYPE");
});

it("Should fail if color is not a proper CSS color", () => {
  const result = Tree.treeToModel(`
  <View>
    <Image name="img" value="$image"></Image>
    <RectangleLabels name="tag" toName="img" fillOpacity="0.6" strokeWidth="5">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="verywrongcolor"></Label>
    </RectangleLabels>
  </View>
  `);

  const errorItem = result.validation[0];

  expect(errorItem.error).toBe("ERR_BAD_TYPE");
});
