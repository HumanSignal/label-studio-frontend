import { Fragment } from "react";
import { Block } from "../../utils/bem";
import { guidGenerator } from "../../utils/unique";
import './Toolbar.styl';
import './Tool.styl';

export const Toolbar = ({ tools }) => {
  return (
    <Block name="toolbar">
      {tools.map(tool => {
        return (
          <Fragment key={guidGenerator()}>
            {tool.viewClass}
          </Fragment>
        );
      })}
    </Block>
  );
};
