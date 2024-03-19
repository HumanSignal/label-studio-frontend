export const createConfigWithHotkey = (hotkey: string) => `<View>
  <Image name="img" value="$image"/>
  <RectangleLabels name="tag" toName="img">
    <Label value="Label" hotkey="${hotkey}" />
  </RectangleLabels>
</View>`;
