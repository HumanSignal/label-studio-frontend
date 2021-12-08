import { Block, Elem } from "../../../utils/bem";
import Tree from 'rc-tree';
import { DataNode } from "rc-tree/lib/interface";
import "./TreeView.styl";
import React, { FC } from "react";
import { NodeIcon } from "../../Node/Node.js";
import { IconArrow } from "../../../assets/icons/tree";
import { observer } from "mobx-react-lite";

interface TreeNode extends DataNode {
  root?: boolean;
}

interface OutlinerTreeProps {
  regions: any;
}

export const OutlinerTree: FC<OutlinerTreeProps> = observer(({ regions }) => {
  const regionTree = regions.asTree((item, idx, onClick) => {
    const toName = item.labeling?.to_name;
    const groupType = toName?.type;
    const groupLabel = toName?.parsedValue ?? toName?.value;

    const result: any = {
      key: item.id,
      title: 123,
    };

    if (groupType && groupLabel) {
      result.group = {
        title: groupLabel,
        type: groupType,
      };
    }

    return result;
  });

  console.log(regionTree);

  const treeData: TreeNode[] = [
    {
      key: '0-0',
      root: true,
      disabled: true,
      title: <RootTitle title="Root 1"/>,
      children: [
        {
          key: '0-0-0',
          title: 'parent 1-1',
          children: [{ key: '0-0-0-0', title: 'parent 1-1-0' }],
        },
        {
          key: '0-0-1',
          title: (
            <div>Hello world</div>
          ),
          children: [
            { key: '0-0-1-0', title: 'parent 1-2-0' },
            { key: '0-0-1-1', title: 'parent 1-2-1' },
            { key: '0-0-1-2', title: 'parent 1-2-2' },
            { key: '0-0-1-3', title: 'parent 1-2-3' },
            { key: '0-0-1-4', title: 'parent 1-2-4' },
            { key: '0-0-1-5', title: 'parent 1-2-5' },
            { key: '0-0-1-6', title: 'parent 1-2-6' },
            { key: '0-0-1-7', title: 'parent 1-2-7' },
            { key: '0-0-1-8', title: 'parent 1-2-8' },
            { key: '0-0-1-9', title: 'parent 1-2-9' },
          ],
        },
      ],
    },
    {
      key: '0-1',
      title: <RootTitle title="Root 2"/>,
      children: [
        {
          key: '0-1-0',
          title: 'parent 1-1',
          children: [{ key: '0-1-0-0', title: 'parent 1-1-0' }],
        },
        {
          key: '0-1-1',
          title: (
            <div>Hello world</div>
          ),
          children: [
            { key: '0-1-1-0', title: 'parent 1-2-0', disableCheckbox: true },
            { key: '0-1-1-1', title: 'parent 1-2-1' },
            { key: '0-1-1-2', title: 'parent 1-2-2' },
            { key: '0-1-1-3', title: 'parent 1-2-3' },
            { key: '0-1-1-4', title: 'parent 1-2-4' },
            { key: '0-1-1-5', title: 'parent 1-2-5' },
            { key: '0-1-1-6', title: 'parent 1-2-6' },
            { key: '0-1-1-7', title: 'parent 1-2-7' },
            { key: '0-1-1-8', title: 'parent 1-2-8' },
            { key: '0-1-1-9', title: 'parent 1-2-9' },
          ],
        },
      ],
    },
  ];

  return (
    <Block name="outliner-tree">
      <Tree
        draggable
        allowDrop={(data) => {
          console.log(data);
          return true;
        }}
        defaultExpandAll
        checkable={false}
        prefixCls="lsf-tree"
        treeData={regionTree}
        icon={(data) => {
          if (data.item) {
            return <NodeIcon node={data.item}/>;
          }

          return null;
        }}
        switcherIcon={(data) => {
          return data.isLeaf ? null : <IconArrow/>;
        }}
      />
    </Block>
  );
});

const RootTitle = ({ title }) => {
  return (
    <Elem name="item">
      {title}
    </Elem>
  );
};

const RegionNode: FC = (props) => {
  return (
    <div>
      {props.children}
    </div>
  );
};
