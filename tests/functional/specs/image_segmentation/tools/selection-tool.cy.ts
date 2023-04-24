import { ImageView, LabelStudio, Sidebar } from '@heartexlabs/ls-test/helpers/LSF';

const image = 'https://htx-misc.s3.amazonaws.com/opensource/label-studio/examples/images/nick-owuor-astro-nic-visuals-wDifg5xc9Z4-unsplash.jpg';

describe('Image segmentation', () => {
  describe('Tools', () => {
    describe('Selection tool', () => {
      const simpleRectangleConfig = `
            <View>
              <Image name="image" value="$image" />
              <Rectangle name="rect" toName="image" />
            </View>`;
      const simpleRectangleResult = [
        {
          'id': 'rect_1',
          'original_width': 2242,
          'original_height': 2802,
          'image_rotation': 0,
          'value': {
            'x': 20,
            'y': 20,
            'width': 60,
            'height': 60,
            'rotation': 0,
          },
          'from_name': 'rect',
          'to_name': 'image',
          'type': 'rectangle',
          'origin': 'manual',
        },
      ];
      const fourRectanglesResult = [
        {
          'id': 'rect_1',
          'original_width': 2242,
          'original_height': 2802,
          'image_rotation': 0,
          'value': {
            'x': 20,
            'y': 20,
            'width': 20,
            'height': 20,
            'rotation': 0,
          },
          'from_name': 'rect',
          'to_name': 'image',
          'type': 'rectangle',
          'origin': 'manual',
        },
        {
          'id': 'rect_2',
          'original_width': 2242,
          'original_height': 2802,
          'image_rotation': 0,
          'value': {
            'x': 60,
            'y': 20,
            'width': 20,
            'height': 20,
            'rotation': 0,
          },
          'from_name': 'rect',
          'to_name': 'image',
          'type': 'rectangle',
          'origin': 'manual',
        },
        {
          'id': 'rect_3',
          'original_width': 2242,
          'original_height': 2802,
          'image_rotation': 0,
          'value': {
            'x': 20,
            'y': 60,
            'width': 20,
            'height': 20,
            'rotation': 0,
          },
          'from_name': 'rect',
          'to_name': 'image',
          'type': 'rectangle',
          'origin': 'manual',
        },
        {
          'id': 'rect_4',
          'original_width': 2242,
          'original_height': 2802,
          'image_rotation': 0,
          'value': {
            'x': 60,
            'y': 60,
            'width': 20,
            'height': 20,
            'rotation': 0,
          },
          'from_name': 'rect',
          'to_name': 'image',
          'type': 'rectangle',
          'origin': 'manual',
        },
      ];

      describe('Сlick interactions', () => {
        const simpleEllipseConfig = `
            <View>
              <Image name="image" value="$image" />
              <Ellipse name="ellipse" toName="image" />
            </View>`;
        const simpleEllipseResult = [
          {
            'id': 'ellipse_1',
            'original_width': 2242,
            'original_height': 2802,
            'image_rotation': 0,
            'value': {
              'x': 50,
              'y': 50,
              'radiusX': 30,
              'radiusY': 30,
              'rotation': 0,
            },
            'from_name': 'ellipse',
            'to_name': 'image',
            'type': 'ellipse',
            'origin': 'manual',
          },
        ];
        const simplePolygonConfig = `
            <View>
              <Image name="image" value="$image" />
              <Polygon name="polygon" toName="image" />
            </View>`;
        const simplePolygonResult = [
          {
            'id': 'polygon_1',
            'original_width': 2242,
            'original_height': 2802,
            'image_rotation': 0,
            'value': {
              /*
                ____
               | ___|
               | |___
               |____|
               */
              'points': [
                [20, 20],
                [80, 20],
                [80, 40],
                [40, 40],
                [40, 60],
                [80, 60],
                [80, 80],
                [20, 80],
              ],
            },
            'from_name': 'polygon',
            'to_name': 'image',
            'type': 'polygon',
            'origin': 'manual',
          },
        ];
        const simplePointConfig = `
            <View>
              <Image name="image" value="$image" />
              <KeyPoint name="keypoint" toName="image" />
            </View>`;
        const simplePointResult = [
          {
            'id': 'keypoint_1',
            'original_width': 2242,
            'original_height': 2802,
            'image_rotation': 0,
            'value': {
              x: 50,
              y: 50,
              width: 100 / 2242,
            },
            'from_name': 'keypoint',
            'to_name': 'image',
            'type': 'keypoint',
            'origin': 'manual',
          },
        ];

        it('Should select rectangle region by clicking on center', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(simpleRectangleResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.clickAtRelative(.5, .5);
          Sidebar.hasSelectedRegions(1);
        });

        it('Should select rectangle region by clicking on edge', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(simpleRectangleResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.clickAtRelative(.2, .5);
          Sidebar.hasSelectedRegions(1);
        });

        it('Should select ellipse region by clicking on center', () => {
          LabelStudio.params()
            .config(simpleEllipseConfig)
            .data({
              image,
            })
            .withResult(simpleEllipseResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.clickAtRelative(.5, .5);
          Sidebar.hasSelectedRegions(1);
        });

        it('Should not select ellipse region by clicking inside it\'s bbox but outside region itself', () => {
          LabelStudio.params()
            .config(simpleEllipseConfig)
            .data({
              image,
            })
            .withResult(simpleEllipseResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.clickAtRelative(.25, .25);
          Sidebar.hasSelectedRegions(0);
        });

        it('Should select polygon region by clicking on it', () => {
          LabelStudio.params()
            .config(simplePolygonConfig)
            .data({
              image,
            })
            .withResult(simplePolygonResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.clickAtRelative(.3, .5);
          Sidebar.hasSelectedRegions(1);
        });

        it('Should not select polygon region by clicking inside it\'s bbox but outside region itself', () => {
          LabelStudio.params()
            .config(simplePolygonConfig)
            .data({
              image,
            })
            .withResult(simplePolygonResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.clickAtRelative(.6, .5);
          Sidebar.hasSelectedRegions(0);
        });

        it('Should select keypoint region by clicking on it', () => {
          LabelStudio.params()
            .config(simplePointConfig)
            .data({
              image,
            })
            .withResult(simplePointResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.clickAtRelative(.5, .5);
          Sidebar.hasSelectedRegions(1);
        });

        it('Should not select hidden region by click', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(simpleRectangleResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          Sidebar.toggleRegionVisibility(0);
          Sidebar.hasSelectedRegions(0);
          ImageView.clickAtRelative(.5, .5);
          Sidebar.hasSelectedRegions(0);
        });

        it('Should select a couple of regions by clicking with Ctrl pressed', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(fourRectanglesResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          Sidebar.hasSelectedRegions(0);

          ImageView.clickAtRelative(.3, .3);
          Sidebar.hasSelectedRegions(1);

          ImageView.clickAtRelative(.7, .3, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(2);
        });

        it('Should select regions inside transformer area by clicking with Ctrl pressed', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(fourRectanglesResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          Sidebar.hasSelectedRegions(0);

          ImageView.clickAtRelative(.3, .3, { ctrlKey: true, metaKey: true });
          ImageView.clickAtRelative(.7, .3, { ctrlKey: true, metaKey: true });
          ImageView.clickAtRelative(.7, .7, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(3);

          ImageView.clickAtRelative(.3, .7, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(4);
        });

        it('Should deselect regions by clicking with Ctrl pressed', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(fourRectanglesResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          Sidebar.hasSelectedRegions(0);
          ImageView.drawRectRelative(.1, .1, .8, .8);
          Sidebar.hasSelectedRegions(4);

          ImageView.clickAtRelative(.3, .3, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(3);

          ImageView.clickAtRelative(.3, .7, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(2);

          ImageView.clickAtRelative(.7, .7, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(1);

          ImageView.clickAtRelative(.7, .3, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(0);
        });
      });

      describe('Selecting area', () => {
        it('Should be able to select just one region', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(fourRectanglesResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.drawRectRelative(.1, .1, .4, .4);
          Sidebar.hasSelectedRegions(1);
        });

        it('Should be able to select all regions', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(fourRectanglesResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.drawRectRelative(.1, .1, .8, .8);
          Sidebar.hasSelectedRegions(4);
        });

        it('Should not select hidden region by selecting area', () => {
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(simpleRectangleResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          Sidebar.toggleRegionVisibility(0);
          Sidebar.hasSelectedRegions(0);
          ImageView.drawRectRelative(.1, .1, .8, .8);
          Sidebar.hasSelectedRegions(0);
        });

        it('Should disappear after mouseup', () =>{
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult([])
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          ImageView.capture('canvas');
          ImageView.drawRectRelative(.05, .05, .9, .9);
          // empirically chosen threshold to catch slight changes
          ImageView.canvasShouldNotChange('canvas', 0.009);
        });

        it('Should add regions to selection with Ctrl pressed', () =>{
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(fourRectanglesResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          Sidebar.hasSelectedRegions(0);

          ImageView.drawRectRelative(.1, .1, .4, .4, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(1);

          ImageView.drawRectRelative(.1, .1, .8, .4, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(2);

          ImageView.drawRectRelative(.1, .5, .8, .4, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(4);

        });

        it('Should not reset selection with Ctrl pressed', () =>{
          LabelStudio.params()
            .config(simpleRectangleConfig)
            .data({
              image,
            })
            .withResult(fourRectanglesResult)
            .init();

          ImageView.waitForImage();
          ImageView.selectMoveToolByButton();
          Sidebar.hasSelectedRegions(0);
          ImageView.drawRectRelative(.1, .1, .8, .8);

          ImageView.drawRectRelative(.9, .9, .01, .01, { ctrlKey: true, metaKey: true });
          Sidebar.hasSelectedRegions(4);

        });
      });
    });
  });
});
