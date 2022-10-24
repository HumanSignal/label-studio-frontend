/* global Feature, Scenario, locate, DataTable, Data */

const { serialize, selectText } = require("./helpers");

const assert = require("assert");

Feature("Taxonomy");

const cases = {
  taxonomy: {
    config: `<View>
      <Text name="text" value="$text"/>
      <Labels name="label" toName="text">
        <Label value="PER" background="red"/>
        <Label value="ORG" background="darkorange"/>
        <Label value="LOC" background="orange"/>
        <Label value="MISC" background="green"/>
      </Labels>
      <Taxonomy name="taxonomy" toName="text" >
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
      { label: 'PER', rangeStart: 0, rangeEnd: 2, text: 'To', test: {
        clickTaxonomy: ['Extraterrestial', 'Archaea'],
        assertTrue: [
          'Archaea',
        ],
        assertFalse: [
          'Extraterrestial',
        ],
      } },
      { label: 'PER', rangeStart: 3, rangeEnd: 7, text: 'have', test: {
        clickTaxonomy: ['Archaea'], 
        assertTrue: [
          'Archaea',
          'Extraterrestial',
        ], 
        assertFalse: [],
      } },
    ],
    isPerRegion: false,
    FF: {
      ff_front_1170_outliner_030222_short: false,
    },
  },
  taxonomyPerRegion: {
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
      { label: 'PER', rangeStart: 0, rangeEnd: 2, text: 'To', test: {
        clickTaxonomy: ['Extraterrestial', 'Archaea'],
        assertTrue: [
          'Archaea',
        ],
        assertFalse: [
          'Extraterrestial',
        ],
      } },
      { label: 'PER', rangeStart: 3, rangeEnd: 7, text: 'have', test: {
        clickTaxonomy: ['Archaea'], 
        assertTrue: [
          'Archaea',
          'Extraterrestial',
        ], 
        assertFalse: [],
      } },
    ],
    isPerRegion: true,
    FF: {
      ff_front_1170_outliner_030222_short: false,
    },
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
      { label: 'PER', rangeStart: 0, rangeEnd: 2, text: 'To', test: {
        clickTaxonomy: ['Human'], 
        assertTrue: [
          'Eukarya / Extraterrestial',
          'Eukarya / Human',
        ], 
        assertFalse: [
          'Bacteria',
        ],
      } },
    ],
    isPerRegion: true,
    FF: {
      ff_front_1170_outliner_030222_short: false,
    },
  },
  taxonomyOutliner: {
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
      { label: 'PER', rangeStart: 0, rangeEnd: 2, text: 'To', test: {
        clickTaxonomy: ['Extraterrestial'], 
        assertTrue: [
        ],
        assertFalse: [
          'Extraterrestial',
        ],
      } },
      { label: 'PER', rangeStart: 3, rangeEnd: 7, text: 'have', test: {
        clickTaxonomy: ['Archaea'], 
        assertTrue: [
          'Archaea',
          'Extraterrestial',
        ], 
        assertFalse: [],
      } },
    ],
    isPerRegion: true,
    FF: {
      ff_front_1170_outliner_030222_short: true,
    },
  },
  taxonomyWithShowLabelsWithOuliner: {
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
      { label: 'PER', rangeStart: 0, rangeEnd: 2, text: 'To', test: {
        clickTaxonomy: [['Human']], 
        assertTrue: [
          'Eukarya / Extraterrestial',
          'Eukarya / Human',
        ], 
        assertFalse: [
          'Bacteria',
        ],
      } },
    ],
    isPerRegion: true,
    FF: {
      ff_front_1170_outliner_030222_short: true,
    },
  },
};

const taxonomyTable = new DataTable(["taxnomyName"]);

for (const taxonomyName of Object.keys(cases)) {
  taxonomyTable.add([taxonomyName]);
}

Data(taxonomyTable).Scenario("Check Taxonomy", async ({ I, LabelStudio, current }) => {
  const { taxnomyName } = current;
  const Taxonomy = cases[taxnomyName];
  const { annotations, config, text, isPerRegion, FF } = Taxonomy;
  const outlinerSelector = ".lsf-outliner-item__title";
  const sideBarRegionSelector = "li";
  const taxonomyLabelSelector = ".lsf-taxonomy__label";

  I.amOnPage("/");

  LabelStudio.setFeatureFlags({ ff_dev_2007_rework_choices_280322_short: true, ...FF });
  LabelStudio.init({ config, data: { text } });
  
  const isOutliner = FF.ff_front_1170_outliner_030222_short;

  annotations.forEach(annotation => {
    let regionEl;

    if (isPerRegion) {
      I.click(locate(".lsf-label__text").withText(annotation.label));
      I.executeScript(selectText, {
        selector: ".lsf-htx-richtext",
        rangeStart: annotation.rangeStart,
        rangeEnd: annotation.rangeEnd,
      });
    
      regionEl = isOutliner ? locate(outlinerSelector).withText(annotation.label) : locate(sideBarRegionSelector).withText(annotation.text);
  
      I.seeElement(regionEl);
      I.click(regionEl);
    }

    I.click(locate("span").withText("Click to add..."));
    I.click(locate(".collapser.collapsed"));
    annotation.test.clickTaxonomy.forEach(t => I.click(locate("label").withText(t)));

    
    /* reseting clicks */
    I.click(locate(".collapser.open"));
    if (isPerRegion) {
      I.click(regionEl);
      I.click(locate(".lsf-label__text").withText(annotation.label));
    } else {
      I.click(locate("span").withText("Click to add..."));
    }
  });

  const results = await I.executeScript(serialize);

  results.filter(result => result.value.labels).forEach((result, index) => {
    const annotation = annotations[index];
    const expected = {
      end: annotation.rangeEnd,
      labels: [annotation.label], 
      start: annotation.rangeStart, 
      text: annotation.text,
    };

    assert.deepEqual(result.value, expected);

    if (isPerRegion) {
      const regionEl = isOutliner ? locate(outlinerSelector).withText(annotation.label) : locate(sideBarRegionSelector).withText(annotation.text);
  
      I.click(regionEl);
    }
    
    annotation.test.assertTrue.forEach(label => I.seeElement(locate(taxonomyLabelSelector).withText(label)));
    annotation.test.assertFalse.forEach(label => I.dontSeeElement(locate(taxonomyLabelSelector).withText(label)));
  });
  
});