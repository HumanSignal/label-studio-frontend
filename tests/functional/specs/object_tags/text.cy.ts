import { LabelStudio } from '@heartexlabs/ls-test/helpers/LSF';

describe('<Text> tag', () => {
  it('Display non-string values', () => {
    const config = `
      <View>
        <Header>String — usual case</Header>
        <Text name="string" value="$string"></Text>
        <Header>Float number</Header>
        <Text name="number" value="$number"></Text>
        <Header>Boolean</Header>
        <Text name="bool" value="$bool"></Text>
        <Header>Array</Header>
        <Text name="array" value="$array"></Text>
        <Header value="Crazy header $string $number $bool $array" />
      </View>
    `;

    const data = {
      string: 'Simple text',
      number: 123.45,
      bool: false,
      array: [1, 2, 3],
    };

    LabelStudio.params()
      .config(config)
      .data(data)
      .withResult([])
      .init();

    cy.get('.lsf-object').contains('Simple text').should('be.visible');
    cy.get('.lsf-object').contains('123.45').should('be.visible');
    cy.get('.lsf-object').contains('false').should('be.visible');
    cy.get('.lsf-object').contains('1,2,3').should('be.visible');
  });
});
