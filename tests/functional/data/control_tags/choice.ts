export const simpleData = {
  text: 'This text exists for no reason',
};
export const choicesConfig = `<View>
  <Text name="text"/>
  <Choices name="choices" choice="single">
    <Choice value="Choice 1" />
    <Choice value="Choice 2" hint="A hint for Choice 2" />
    <Choice value="Choice 3" />
  </Choices>
</View>`;

export const choicesMultipleSelectionConfig = `<View>
  <Text name="text"/>
  <Choices name="choices" choice="multiple">
    <Choice value="Choice 1" />
    <Choice value="Choice 2" hint="A hint for Choice 2" />
    <Choice value="Choice 3" />
  </Choices>
</View>`;

export const choicesSelectLayoutConfig = `<View>
  <Text name="text"/>
  <Choices name="choices" layout="select" choice="multiple">
    <Choice value="Choice 1" />
    <Choice value="Choice 2" hint="A hint for Choice 2" />
    <Choice value="Choice 3" />
  </Choices>
</View>`;