

/* global Feature, Scenario, locate */
const { initLabelStudio } = require("./helpers");

Feature("Repeater paginate on region click");



const data = {
  images: [
    {
      url: "https://htx-pub.s3.amazonaws.com/demo/images/demo_stock_purchase_agreement/0001.jpg",
    },
    {
      url: "https://htx-pub.s3.amazonaws.com/demo/images/demo_stock_purchase_agreement/0002.jpg",
    },
    {
      url: "https://htx-pub.s3.amazonaws.com/demo/images/demo_stock_purchase_agreement/0003.jpg",
    },
  ],
};

const configPagination = `
  <View>
    <Repeater on="$images" indexFlag="{{idx}}" mode="pagination" >
      <Image name="page_{{idx}}" value="$images[{{idx}}].url"/>
      <RectangleLabels name="labels_{{idx}}" toName="page_{{idx}}">
        <Label value="Document Title" />
        <Label value="Document Date" />
        <Label value="Document Author" background="yellow"/>
      </RectangleLabels>
    </Repeater>
  </View>
`;

const configScroll = `
  <View>
    <Repeater on="$images" indexFlag="{{idx}}" >
      <Image name="page_{{idx}}" value="$images[{{idx}}].url"/>
      <RectangleLabels name="labels_{{idx}}" toName="page_{{idx}}">
        <Label value="Document Title" />
        <Label value="Document Date" />
        <Label value="Document Author" background="yellow"/>
      </RectangleLabels>
    </Repeater>
  </View>
`;


const annotations = [
  {
    id: 38,
    result: [
      {
        id: "Eg3_P8-ZRu",
        type: "rectanglelabels",
        value: {
          x: 8.247422680412368,
          y: 54.22647527910686,
          width: 75.46391752577318,
          height: 9.090909090909092,
          rotation: 0,
          rectanglelabels: ["Document Date"],
        },
        origin: "manual",
        to_name: "page_0",
        from_name: "labels_0",
        image_rotation: 0,
        original_width: 800,
        original_height: 1035,
      },
      {
        id: "Eg3_P8-ZRu",
        type: "taxonomy",
        value: {
          x: 8.247422680412368,
          y: 54.22647527910686,
          width: 75.46391752577318,
          height: 9.090909090909092,
          rotation: 0,
          taxonomy: [["Archaea"]],
        },
        origin: "manual",
        to_name: "page_0",
        from_name: "categories_0",
        image_rotation: 0,
        original_width: 800,
        original_height: 1035,
      },
      {
        id: "yd33DCnE52",
        type: "rectanglelabels",
        value: {
          x: 22.379603399433428,
          y: 70.31044654069684,
          width: 20.396600566572232,
          height: 22.560672877544462,
          rotation: 0,
          rectanglelabels: ["Document Title"],
        },
        origin: "manual",
        to_name: "page_2",
        from_name: "labels_2",
        image_rotation: 0,
        original_width: 600,
        original_height: 776,
      },
      {
        id: "7qxBZWOXXG",
        type: "rectanglelabels",
        value: {
          x: 33.711048158640224,
          y: 60.01577056744838,
          width: 23.229461756373937,
          height: 7.447212406179728,
          rotation: 0,
          rectanglelabels: ["Document Author"],
        },
        origin: "manual",
        to_name: "page_1",
        from_name: "labels_1",
        image_rotation: 0,
        original_width: 600,
        original_height: 776,
      },
    ],
  },
];

Scenario("Outliner Regions will paginate view window on region click", async function({ I, LabelStudio }) {
  const params = { config: configPagination, annotations, data };

  I.amOnPage("/");
  LabelStudio.setFeatureFlags({
    ff_front_1170_outliner_030222_short: true,
  });
  I.executeScript(initLabelStudio, params);

  I.click(locate(".lsf-outliner-item__title").withText("Document Author"));
  I.seeElement(locate(".lsf-label__hotkey").withText("6"));
  I.seeElement(locate(".lsf-pagination__page-indicator").withText("2"));

  I.click(locate(".lsf-outliner-item__title").withText("Document Title"));
  I.seeElement(locate(".lsf-label__hotkey").withText("7"));
  I.seeElement(locate(".lsf-pagination__page-indicator").withText("3"));

  I.click(locate(".lsf-outliner-item__title").withText("Document Date"));
  I.seeElement(locate(".lsf-label__hotkey").withText("2"));
  I.seeElement(locate(".lsf-pagination__page-indicator").withText("1"));

});

Scenario("Regions will paginate view window on region click", async function({ I, LabelStudio }) {
  const params = { config: configPagination, annotations, data };

  I.amOnPage("/");
  LabelStudio.setFeatureFlags({
    ff_front_1170_outliner_030222_short: false,
  });
  I.executeScript(initLabelStudio, params);

  I.click(locate(".lsf-region-item__title").withText("Document Author"));
  I.seeElement(locate(".lsf-label__hotkey").withText("6"));
  I.seeElement(locate(".lsf-pagination__page-indicator").withText("2"));

  I.click(locate(".lsf-region-item__title").withText("Document Title"));
  I.seeElement(locate(".lsf-label__hotkey").withText("7"));
  I.seeElement(locate(".lsf-pagination__page-indicator").withText("3"));

  I.click(locate(".lsf-region-item__title").withText("Document Date"));
  I.seeElement(locate(".lsf-label__hotkey").withText("2"));
  I.seeElement(locate(".lsf-pagination__page-indicator").withText("1"));

});

Scenario("Outliner Regions will scroll view window on region click", async function({ I, LabelStudio }) {
  const params = { config: configScroll, annotations, data };

  I.amOnPage("/");
  LabelStudio.setFeatureFlags({
    ff_front_1170_outliner_030222_short: true,
  });
  I.executeScript(initLabelStudio, params);

  I.click(locate(".lsf-outliner-item__title").withText("Document Author"));
  I.waitForVisible(locate(".lsf-label__hotkey").withText("6"));

  I.click(locate(".lsf-outliner-item__title").withText("Document Title"));
  I.waitForVisible(locate(".lsf-label__hotkey").withText("7"));

  I.click(locate(".lsf-outliner-item__title").withText("Document Date"));
  I.waitForVisible(locate(".lsf-label__hotkey").withText("2"));

});

Scenario("Regions will scroll view window on region click", async function({ I, LabelStudio }) {
  const params = { config: configScroll, annotations, data };
  
  LabelStudio.setFeatureFlags({
    ff_front_1170_outliner_030222_short: true,
  });
  I.amOnPage("/");
  I.executeScript(initLabelStudio, params);
  
  I.click(locate(".lsf-region-item__title").withText("Document Author"));
  I.waitForVisible(locate(".lsf-label__hotkey").withText("6"));

  I.click(locate(".lsf-region-item__title").withText("Document Title"));
  I.waitForVisible(locate(".lsf-label__hotkey").withText("7"));

  I.click(locate(".lsf-region-item__title").withText("Document Date"));
  I.waitForVisible(locate(".lsf-label__hotkey").withText("2"));

});

