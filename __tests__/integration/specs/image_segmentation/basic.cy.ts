import { ImageView } from 'cypress/objects/ImageView';
import { Labels } from 'cypress/objects/Labels';
import { LabelStudio } from 'cypress/objects/LabelStudio';
import { Sidebar } from 'cypress/objects/Sidebar';

const config = `
  <View>
    <Image name="img" value="$image"></Image>
    <RectangleLabels name="tag" toName="img">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
    </RectangleLabels>
  </View>
`;

const image = 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg';

describe('Basic Image scenario', () => {
  it('Should be able to draw a simple rectangle', () => {
    LabelStudio.init({
      config,
      task: {
        id: 1,
        annotations: [{ id: 1001, result: [] }],
        predictions: [],
        data: { image },
      },
    });

    ImageView.waitForImage(); 
    Sidebar.hasNoRegions();

    Labels.select('Planet');

    ImageView.drawRect(20, 20, 100, 100);

    Sidebar.hasRegions(1);
  });
});
