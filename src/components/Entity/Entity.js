import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { getType } from "mobx-state-tree";
import { Form, Input, Icon, Button, Tag, Tooltip, Badge } from "antd";
import {
  DeleteOutlined,
  LinkOutlined,
  PlusOutlined,
  FullscreenOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  CompressOutlined,
} from "@ant-design/icons";
import { Typography } from "antd";

import { NodeMinimal } from "../Node/Node";
import Hint from "../Hint/Hint";
import styles from "./Entity.module.scss";

const { Text } = Typography;

const templateElement = element => {
  return (
    <Text key={element.pid} className={styles.labels}>
      Labels:&nbsp;
      {element.selectedValues().map(title => {
        let bgColor = element.findLabel(title).background ? element.findLabel(title).background : "#000000";

        return (
          <Tag key={element.findLabel(title).id} color={bgColor} className={styles.tag}>
            {title}
          </Tag>
        );
      })}
    </Text>
  );
};

const RenderStates = observer(({ node }) => {
  const _render = s => {
    if (getType(s).name.indexOf("Labels") !== -1) {
      return templateElement(s);
    } else if (getType(s).name === "RatingModel") {
      return <Text>Rating: {s.getSelectedString()}</Text>;
    } else if (getType(s).name === "TextAreaModel") {
      const text = s.regions.map(r => r._value).join("\n");
      return (
        <Text>
          Text: <Text mark>{text.substring(0, 26)}...</Text>
        </Text>
      );
    }

    return null;
  };

  return <Fragment>{node.states.filter(s => s.holdsState).map(s => _render(s))}</Fragment>;
});

export default observer(({ store, completion }) => {
  const node = completion.highlightedNode;

  return (
    <Fragment>
      <p>
        <NodeMinimal node={node} /> (id: {node.id}){" "}
        {!node.editable && <Badge count={"readonly"} style={{ backgroundColor: "#ccc" }} />}
      </p>
      <div className={styles.statesblk + " ls-entity-states"}>
        {node.score && (
          <Fragment>
            <Text>
              Score: <Text underline>{node.score}</Text>
            </Text>
          </Fragment>
        )}

        {node.normalization && (
          <Text>
            Normalization: <Text code>{node.normalization}</Text>
            &nbsp;
            <DeleteOutlined
              type="delete"
              style={{ cursor: "pointer" }}
              onClick={() => {
                node.deleteNormalization();
              }}
            />
          </Text>
        )}

        {node.states && <RenderStates node={node} />}
      </div>

      <div className={styles.block + " ls-entity-buttons"}>
        {/* <Tooltip placement="topLeft" title="Hide: [h]"> */}
        {/*   <Button */}
        {/*     className={styles.button} */}
        {/*     onClick={() => { */}
        {/*         node.toggleHidden(); */}
        {/*         //node.unselectRegion(); */}
        {/*         //node.selectRegion(); */}
        {/*         // completion.startRelationMode(node); */}
        {/*     }} */}
        {/*   > */}
        {/*     { node.hidden ? <EyeOutlined /> : <EyeInvisibleOutlined /> } */}
        {/*     {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ h ]</Hint>} */}
        {/*   </Button> */}
        {/* </Tooltip> */}

        {node.editable && (
          <Fragment>
            <Tooltip placement="topLeft" title="Create Relation: [r]">
              <Button
                className={styles.button}
                onClick={() => {
                  completion.startRelationMode(node);
                }}
              >
                <LinkOutlined />

                {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ r ]</Hint>}
              </Button>
            </Tooltip>

            <Tooltip placement="topLeft" title="Create Normalization">
              <Button
                className={styles.button}
                onClick={() => {
                  completion.setNormalizationMode(true);
                }}
              >
                <PlusOutlined />
              </Button>
            </Tooltip>
          </Fragment>
        )}

        <Tooltip placement="topLeft" title="Unselect: [u]">
          <Button
            className={styles.button}
            type="dashed"
            onClick={() => {
              completion.highlightedNode.unselectRegion();
            }}
          >
            <CompressOutlined />
            {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ u ]</Hint>}
          </Button>
        </Tooltip>

        {node.editable && (
          <Tooltip placement="topLeft" title="Delete Entity: [Backspace]">
            <Button
              type="danger"
              className={styles.button}
              onClick={() => {
                completion.highlightedNode.deleteRegion();
              }}
            >
              <DeleteOutlined />

              {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ Bksp ]</Hint>}
            </Button>
          </Tooltip>
        )}
      </div>

      {completion.normalizationMode && (
        <Form
          style={{ marginTop: "0.5em", marginBottom: "0.5em" }}
          onFinish={value => {
            node.setNormalization(node.normInput);
            completion.setNormalizationMode(false);

            // ev.preventDefault();
            // return false;
          }}
        >
          <Input
            onChange={ev => {
              const { value } = ev.target;
              node.setNormInput(value);
            }}
            style={{ marginBottom: "0.5em" }}
            placeholder="Add Normalization"
          />

          <Button type="primary" htmlType="submit" style={{ marginRight: "0.5em" }}>
            Add
          </Button>

          <Button
            type="danger"
            htmlType="reset"
            onClick={ev => {
              completion.setNormalizationMode(false);

              ev.preventDefault();
              return false;
            }}
          >
            Cancel
          </Button>
        </Form>
      )}
    </Fragment>
  );
});
