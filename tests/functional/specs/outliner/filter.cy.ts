import { ImageView, Labels, LabelStudio, Sidebar } from '@heartexlabs/ls-test/helpers/LSF';

const config = `
  <View>
    <Image name="img" value="$image"></Image>
    <RectangleLabels name="tag" toName="img">
      <Label value="Planet"></Label>
      <Label value="Moonwalker" background="blue"></Label>
      <Label value="Moonwalker 1" background="red"></Label>
      <Label value="Moonwalker 2" background="pink"></Label>
      <Label value="Moonwalker 3" background="yellow"></Label>
    </RectangleLabels>
  </View>
`;

const image = 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg';

const task = {
  id: 1,
  annotations: [{ id: 1001, result: [
    {
      id: 'Dx_aB91ISN',
      source: '$image',
      from_name: 'tag',
      to_name: 'img',
      type: 'rectanglelabels',
      origin: 'manual',
      value: {
        height: 10.458911419423693,
        rotation: 0,
        width: 12.4,
        x: 50.8,
        y: 5.869797225186766,
        rectanglelabels: ['Moonwalker'],
      },
    },
    {
      id: 'Dx_aB91INs',
      source: '$image',
      from_name: 'tag',
      to_name: 'img',
      type: 'rectanglelabels',
      origin: 'manual',
      value: {
        height: 10.458911419423693,
        rotation: 0,
        width: 12.4,
        x: 150.8,
        y: 15.866,
        rectanglelabels: ['Moonwalker 2'],
      },
    },
    {
      id: 'Dx_aB91ANs',
      source: '$image',
      from_name: 'tag',
      to_name: 'img',
      type: 'rectanglelabels',
      origin: 'manual',
      value: {
        height: 10.458911419423693,
        rotation: 0,
        width: 12.4,
        x: 150.8,
        y: 45.866,
        rectanglelabels: ['Moonwalker 3'],
      },
    },
    {
      id: 'Dx_aB19ISN',
      source: '$image',
      from_name: 'tag',
      to_name: 'img',
      type: 'rectanglelabels',
      origin: 'manual',
      value: {
        height: 10.458911419423693,
        rotation: 0,
        width: 12.4,
        x: 250.8,
        y: 15.866,
        rectanglelabels: ['Planet'],
      },
    },
  ] }],
  predictions: [],
  data: { image },
};

describe('Filter outliner scenario', () => {
  it('Check if filter is visible', () => {
    //the test will be created here
    LabelStudio.init({
      config,
      task,
    });
  });
});
