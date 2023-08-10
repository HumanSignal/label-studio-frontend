import { FC } from 'react';
import { observer } from 'mobx-react';

import { Block } from '../../../utils/bem';

export const RegionLabels: FC<{region: LSFRegion}> = observer(({ region }) => {
  const labelsInResults = region.results
    .filter(result => result.type.endsWith('labels'))
    .map((result: any) => result.selectedLabels || []);

  // mix taxonomies into labels
  // it's hard to get all levels of taxonomy from results to display it properly
  // @todo respect `showFullPath` property
  const taxonomies = region.results
    .filter(result => result.type === 'taxonomy')
    .map((result: any) => result.mainValue || []);
  const taxonomyInResults = [].concat(...taxonomies)
    .map((v: string[]) => v.join(' / '))
    .map((v: string) => ({ value: v, id: v }));

  const labels: any[] = [].concat(...labelsInResults, taxonomyInResults);

  if (!labels.length) return <Block name="labels-list">No label</Block>;

  return (
    <Block name="labels-list">
      {labels.map((label, index) => {
        const color = label.background || '#000000';

        return [
          index ? ', ' : null,
          <span key={label.id} style={{ color }}>
            {label.value}
          </span>,
        ];
      })}
    </Block>
  );
});
