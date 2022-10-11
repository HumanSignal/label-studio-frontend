/* global Feature, Scenario, locate, DataTable, Data */

const { serialize, selectText } = require("./helpers");

const assert = require("assert");

Feature("Taxonomy");

const cases = {
  taxonmy: {
    config: `<View>
      <Text name="text" value="$text"/>
      <Labels name="label" toName="text">
        <Label value="PER" background="red"/>
        <Label value="ORG" background="darkorange"/>
        <Label value="LOC" background="orange"/>
        <Label value="MISC" background="green"/>
      </Labels>
      <Taxonomy name="taxonomy" toName="text" perRegion="true" >
        <Choice value="Archaea" />
        <Choice value="Bacteria" />
        <Choice value="Eukarya">
          <Choice value="Human" />
          <Choice value="Oppossum" />
          <Choice value="Extraterrestial" selected="true" />
        </Choice>
      </Taxonomy>
    </View>`,
    text: `To have faith is to trust yourself to the water`,
    annotations: [
      { label: 'PER', rangeStart: 0, rangeEnd: 2, text: 'To', taxonmy: ["Eukarya", "Extraterrestial"], taxonomyLabel: "Extraterrestial" },
      { label: 'PER', rangeStart: 3, rangeEnd: 7, text: 'have', taxonmy: ["Archaea"], taxonomyLabel: "Archaea" },
    ],
  },
  taxonomyWithShowLabels: {
    config: `<View>
      <Text name="text" value="$text"/>
      <Labels name="label" toName="text">
        <Label value="PER" background="red"/>
        <Label value="ORG" background="darkorange"/>
        <Label value="LOC" background="orange"/>
        <Label value="MISC" background="green"/>
      </Labels>
      <Taxonomy name="taxonomy" showfullpath="true" toName="text" perRegion="true" >
        <Choice value="Archaea" />
        <Choice value="Bacteria" />
        <Choice value="Eukarya">
          <Choice value="Human" />
          <Choice value="Oppossum" />
          <Choice value="Extraterrestial" selected="true" />
        </Choice>
      </Taxonomy>
    </View>`,
    text: `To have faith is to trust yourself to the water`,
    annotations: [
      { label: 'PER', rangeStart: 0, rangeEnd: 2, text: 'To', taxonmy: ["Eukarya", "Extraterrestial"], taxonomyLabel: "Eukarya / Extraterrestial" },
    ],
  },
};

const taxonomyTable = new DataTable(["taxnomyName"]);

for (const taxonomyName of Object.keys(cases)) {
  taxonomyTable.add([taxonomyName]);
}

Data(taxonomyTable).Scenario("Check Taxonomy", async ({ I, LabelStudio, current }) => {
  const { taxnomyName } = current;
  const Taxonomy = cases[taxnomyName];
  const { annotations, config, text } = Taxonomy;

  I.amOnPage("/");

  LabelStudio.init({ config, data: { text } });

  annotations.forEach(annotation => {
    I.click(locate("span").withText(annotation.label));
    I.executeScript(selectText, {
      selector: ".lsf-htx-richtext",
      rangeStart: annotation.rangeStart,
      rangeEnd: annotation.rangeEnd,
    });
    I.click(locate("span").withText(annotation.label));
    I.click(locate("li").withText(annotation.text));
  });

  annotations.forEach(annotation => {
    I.click(locate("li").withText(annotation.text));
  });

  const results = await I.executeScript(serialize);

  results.filter(result => result.value.labels).forEach((result, index) => {
    const annotation = annotations[index];
    const expected = { end: annotation.rangeEnd, labels: [annotation.label], start: annotation.rangeStart, text: annotation.text };
    
    assert.deepEqual(result.value, expected);

    locate("div").withText(annotation.taxonomyLabel);
  });
  
});