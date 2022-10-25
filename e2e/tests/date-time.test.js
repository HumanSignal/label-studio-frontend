/* global Feature, Scenario, locate */

const { serialize, selectText } = require("./helpers");

const assert = require("assert");

Feature("Date Time");

const config = `<View>
<Header>Select text to see related smaller DateTime controls for every region</Header>
<Labels name="label" toName="text">
  <Label value="birth" background="green"/>
  <Label value="death" background="red"/>
  <Label value="event" background="orange"/>
</Labels>
<Text name="text" value="$text"/>
<View visibleWhen="region-selected">
  <Header>Date in this fragment, required, stored as ISO date</Header>
  <DateTime name="date" toName="text" perRegion="true" only="date" required="true" format="%Y-%m-%d"/>
  <Header>Year this happened, but stored also as ISO date</Header>
  <DateTime name="year" toName="text" perRegion="true" only="year" format="%Y-%m-%d"/>
</View>
</View>
`;



const data = {
  text: `Albert Einstein (/ˈaɪnstaɪn/ EYEN-styne;[6] German: [ˈalbɛʁt ˈʔaɪnʃtaɪn] (listen); 14 March 1879 – 18 April 1955) was a German-born theoretical physicist,[7] widely acknowledged to be one of the greatest and most influential physicists of all time. Einstein is best known for developing the theory of relativity, but he also made important contributions to the development of the theory of quantum mechanics. Relativity and quantum mechanics are together the two pillars of modern physics.[3][8] His mass–energy equivalence formula E = mc2, which arises from relativity theory, has been dubbed "the world's most famous equation".[9] His work is also known for its influence on the philosophy of science.[10][11] He received the 1921 Nobel Prize in Physics "for his services to theoretical physics, and especially for his discovery of the law of the photoelectric effect",[12] a pivotal step in the development of quantum theory. His intellectual achievements and originality resulted in "Einstein" becoming synonymous with "genius".[13]`,
};

const annotations = [
  { label: 'birth', rangeStart: 83, rangeEnd: 96, text: '14 March 1879', date: '03141879', dateValue: '1879-03-14', year: '2022' },
  { label: 'death', rangeStart: 99, rangeEnd: 112, text: '18 April 1955', date: '04181955', dateValue: '1955-04-18', year: '2021' },
  { label: 'event', rangeStart: 728, rangeEnd: 755, text: '1921 Nobel Prize in Physics', date: '10101921', dateValue: '1921-10-10', year: '2020' },
];

const params = { config, data };

Scenario("Check DateTime holds state between annotations and saves result", async function({ I, LabelStudio }) {

  I.amOnPage("/");

  LabelStudio.init(params);

  annotations.forEach(annotation => {
    I.click(locate("span").withText(annotation.label));
    I.executeScript(selectText, {
      selector: ".lsf-htx-richtext",
      rangeStart: annotation.rangeStart,
      rangeEnd: annotation.rangeEnd,
    });
    I.click(locate("li").withText(annotation.text));
    I.fillField('input[type=date]', annotation.date);
    I.selectOption('select[name=year-year]', annotation.year);
    I.click(locate("li").withText(annotation.text));
  });

  annotations.forEach(annotation => {
    I.click(locate("li").withText(annotation.text));
    I.seeInField('input[type=date]', annotation.dateValue);
    I.seeInField('select[name=year-year]', annotation.year);

  });
  const results = await I.executeScript(serialize);

  results.filter(result => result.value.labels).forEach((result, index) => {
    const input = annotations[index];
    const expected = { end: input.rangeEnd, labels: [input.label], start: input.rangeStart, text: input.text };
    
    assert.deepEqual(result.value, expected);
  });

});
