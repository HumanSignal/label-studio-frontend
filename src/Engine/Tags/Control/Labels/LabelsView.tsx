import { defineTagView } from '@tags/Base/TagController';
import { TagView } from '@tags/Base/TagView';
import { useAtom } from 'jotai';
import { useControllerEvent } from 'src/core/CommunicationBus/Hooks';
import { Block } from 'src/utils/bem';
import { HypertextLabelsController } from '../HypertextLabels/HypertextLabelsTagController';
import { LabelController } from '../Label/LabelView';
import { LabelsContextProvider } from './LabelsContext';
import { LabelsController } from './LabelsController';
import { LabelsTagViewControllerClass } from './LabelsTypes';

import './Labels.styl';

export const CreateLabelsView = function <T extends LabelsTagViewControllerClass>(): TagView<T> {
  return ({
    tree,
    node,
    annotationAtom,
    controller,
  }) => {
    const mods = {
      // hidden: !controller.visible.value,
      inline: controller.showinline.value,
    };

    const selectedLabelsAtom = useSelectedLabels(controller);

    console.log('render component', selectedLabelsAtom);

    return (
      <Block name="labels" mod={mods}>
        <LabelsContextProvider value={{
          selected: selectedLabelsAtom,
        }}>
          {tree.renderChildren({
            node: node.element,
            annotationAtom,
          })}
        </LabelsContextProvider>
      </Block>
    );
  };
};

const useSelectedLabels = (controller: HypertextLabelsController) => {
  const multiselect = controller.choice.value === 'multiple';
  const [selectedLabels, setSelectedLabels] = useAtom(controller.selectedLabelsAtom);

  useControllerEvent(controller, 'label-selected', (tag) => {
    if (tag.type !== 'label') return;

    const value = tag.controller as LabelController;
    const valueExists = selectedLabels.includes(value);

    setSelectedLabels((selected) => {
      let result: typeof selected;

      if (multiselect) {
        result = valueExists
          ? selected.filter(v => v !== value)
          : [...selected, value];
      } else {
        result = valueExists ? [] : [value];
      }

      controller.emit('labels-selection-changed', {
        labels: result,
      });

      return result;
    });
  }, [selectedLabels]);

  return controller.selectedLabelsAtom;
};

export const LabelsView = defineTagView(
  LabelsController,
  CreateLabelsView<typeof LabelsController>(),
);

export { LabelsController };
