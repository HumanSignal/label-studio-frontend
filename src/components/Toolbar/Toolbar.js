import { Fragment, useMemo, useState } from "react";
import { Block, Elem } from "../../utils/bem";
import { guidGenerator } from "../../utils/unique";
import './Toolbar.styl';
import './Tool.styl';
import { useWindowSize } from "../../common/Utils/useWindowSize";
import { isDefined } from "../../utils/utilities";
import { inject, observer } from "mobx-react";
import { SmartToolsProvider, ToolbarProvider } from "./ToolbarContext";

export const Toolbar = inject("store")(observer(({ store, tools, expanded }) => {
  const [toolbar, setToolbar] = useState(null);
  const windowSize = useWindowSize();

  const alignment = useMemo(() => {
    if (!isDefined(toolbar)) return "right";

    const bbox = toolbar.getBoundingClientRect();

    if (bbox.left < 200) {
      return 'right';
    } else if (windowSize.width - bbox.right < 200) {
      return 'left';
    }

    return "right";
  }, [toolbar, windowSize]);

  const toolGroups = tools.filter(t => !t.dynamic).reduce((res,tool) => {
    const group = res[tool.group] ?? [];

    group.push(tool);
    res[tool.group] = group;
    return res;
  }, {});

  const smartTools = tools.filter(t => t.dynamic);

  return (
    <ToolbarProvider value={{ expanded, alignment }}>
      <Block ref={(el) => setToolbar(el)} name="toolbar" mod={{ alignment, expanded }}>
        {Object.entries(toolGroups).map(([name, tools], i) => {
          return tools.length ? (
            <Elem name="group" key={`toolset-${name}-${i}`}>
              {tools.map(tool => {
                return (
                  <Fragment key={guidGenerator()}>
                    {tool.viewClass}
                  </Fragment>
                );
              })}
            </Elem>
          ) : null;
        })}
        {/* <SmartTools tools={smartTools}/> */}
      </Block>
    </ToolbarProvider>
  );
}));

const SmartTools = ({ tools }) => {
  const selected = tools.find(t => t.selected) ?? tools[0];
  const otherTools = tools.filter(t => t !== selected);

  return (
    <SmartToolsProvider value={{ tools: otherTools }}>
      <Elem name="group">
        {selected.viewClass}
      </Elem>
    </SmartToolsProvider>
  );
};
