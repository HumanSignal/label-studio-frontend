export const simpleData = {
  text: 'This text exists for no reason',
};
export const taxonomyConfig = `<View>
  <Text name="text"/>
  <Taxonomy name="choices" toName="text">
    <Choice value="Choice 1" />
    <Choice value="Choice 2" hint="A hint for Choice 2" />
    <Choice value="Choice 3" selected="true" />
  </Taxonomy>
</View>`;

export const dynamicData = {
  text: 'This text exists for no reason',
  items: [
    { value: 'Choice 1' },
    { value: 'Choice 2', hint: 'A hint for Choice 2' },
    { value: 'Choice 3', selected: true },
  ],
};
export const dynamicTaxonomyConfig = `<View>
  <Text name="text"/>
  <Taxonomy name="choices" toName="text" value="$items">
  </Taxonomy>
</View>`;
