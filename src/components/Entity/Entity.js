import React, { Fragment } from "react";
import { observer } from "mobx-react";
import { Form, Input, Button, Tag, Tooltip, Badge } from "antd";
import { DeleteOutlined, LinkOutlined, PlusOutlined, CompressOutlined } from "@ant-design/icons";
import { Typography } from "antd";

import { NodeMinimal } from "../Node/Node";
import Hint from "../Hint/Hint";
import styles from "./Entity.module.scss";

const { Paragraph, Text } = Typography;

const renderLabels = element => {
  return (
    <Text key={element.pid} className={styles.labels}>
      Labels:&nbsp;
      {element.selectedLabels.map(label => {
        const bgColor = label.background || "#000000";

        return (
          <Tag key={label.id} color={bgColor} className={styles.tag}>
            {label.value}
          </Tag>
        );
      })}
    </Text>
  );
};

const renderResult = result => {
  if (result.type.endsWith("labels")) {
    return renderLabels(result);
  } else if (result.type === "rating") {
    return <Paragraph>Rating: {result.mainValue}</Paragraph>;
  } else if (result.type === "textarea") {
    return (
      <Paragraph className={styles.row}>
        <Text>Text: </Text>
        <Text mark className={styles.long}>
          {result.mainValue.join("\n")}
        </Text>
      </Paragraph>
    );
  } else if (result.type === "choices") {
    return <Paragraph>Choices: {result.mainValue.join(", ")}</Paragraph>;
  }

  return null;
};

export default observer(({ store, completion }) => {
  const node = completion.highlightedNode;

  return (
    <Fragment>
      <p className={styles.row}>
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

        <Fragment>{node.results.map(renderResult)}</Fragment>
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
                aria-label="Create Relation"
                className={styles.button}
                onClick={() => {
                  completion.startRelationMode(node);
                }}
              >
                <LinkOutlined />

                {store.settings.enableHotkeys && store.settings.enableTooltips && <Hint>[ r ]</Hint>}
              </Button>
            </Tooltip>

            {/*<Tooltip placement="topLeft" title="Create Normalization">*/}
            {/*  <Button*/}
            {/*    className={styles.button}*/}
            {/*    onClick={() => {*/}
            {/*      completion.setNormalizationMode(true);*/}
            {/*    }}*/}
            {/*  >*/}
            {/*    <PlusOutlined />*/}
            {/*  </Button>*/}
            {/*</Tooltip>*/}
          </Fragment>
        )}

        <Tooltip placement="topLeft" title="Unselect: [u]">
          <Button
            className={styles.button}
            type="dashed"
            onClick={() => {
              completion.unselectAll();
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
