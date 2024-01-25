export const brushConfig = `
<View>
  <Image name="image" value="$image" crossOrigin="anonymous" />
  <Brush name="brush" toName="image" />
  <Labels name="label" toName="image">
    <Label value="Label A" background="green" />
    <Label value="Label B" background="yellow" />
  </Labels>
</View>
`;

export const brushCenteredConfig = `
<View>
  <Image name="image" value="$image" crossOrigin="anonymous" horizontalalignment="center"/>
  <Brush name="brush" toName="image" />
  <Labels name="label" toName="image">
    <Label value="Label A" background="green" />
    <Label value="Label B" background="yellow" />
  </Labels>
</View>
`;

export const brushImageData = {
  image: 'https://htx-pub.s3.amazonaws.com/samples/magicwand/magic_wand_scale_1_20200902_015806_26_2235_1B_AnalyticMS_00750_00750.jpg',
};
