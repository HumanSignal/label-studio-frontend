import { Typography } from "antd";
import { observer } from "mobx-react";
import { FC } from "react";
import { IconTrash } from "../../../assets/icons";
import { Tag } from "../../../common/Tag/Tag";
import { PER_REGION_MODES } from "../../../mixins/PerRegionModes";
import { Block, Elem } from "../../../utils/bem";

const { Text, Paragraph } = Typography;

const RegionLabels: FC<{result: any}> = (result: any) => {
  const labels: any[] = result.selectedLabels;
  const showLabels = true; //labels.length > 1;

  return (
    <Text key={result.pid}>
      {showLabels && labels.map(label => {
        const bgColor = label.background || "#000000";

        return (
          <Tag key={label.id} color={bgColor}>
            {label.value}
          </Tag>
        );
      })}

      {result.value.text ? (
        <div>
          <pre
            style={{ margin: 0 }}
            dangerouslySetInnerHTML={{
              __html: result.value.text.replace(/\\n/g, '\n'),
            }}
          />
        </div>
      ) : null}
    </Text>
  );
};

const renderResult = (result: any) => {
  const { type, from_name, mainValue } = result;
  const isRegionList = from_name.displaMode === PER_REGION_MODES.REGION_LIST;

  if (type.endsWith("labels")) {
    return (
      <Block name="region-meta">
        <RegionLabels result={result}/>
      </Block>
    );
  } else if (type === "rating") {
    return (
      <Block name="region-meta">
        <Text>Rating: </Text>
        {mainValue}
      </Block>
    );
  } else if (type === "textarea" && !(from_name.perregion && isRegionList)) {
    return (
      <Block name="region-meta">
        <Text>Text: </Text>
        <Text mark >
          {mainValue.join("\n")}
        </Text>
      </Block>
    );
  } else if (type === "choices") {
    return (
      <Block name="region-meta">
        <Text>Choices: </Text>
        {mainValue.join(", ")}
      </Block>
    );
  }

  return null;
};

export const RegionDetailsMain: FC<{region: any}> = observer(({
  region,
}) => {
  return (
    <Elem name="result">
      {region?.results.map(renderResult)}
    </Elem>
  );
});


export const RegionDetailsMeta: FC<{region: any}> = observer(({
  region,
}) => {
  return (
    <>

      {region?.meta?.text && (
        <Elem name="text">
            Meta: <span>{region.meta.text}</span>
            &nbsp;
          <IconTrash
            type="delete"
            style={{ cursor: "pointer" }}
            onClick={() => {
              region.deleteMetaInfo();
            }}
          />
        </Elem>
      )}
    </>
  );
});
