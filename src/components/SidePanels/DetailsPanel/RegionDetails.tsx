import { Typography } from "antd";
import { observer } from "mobx-react";
import { FC, useMemo } from "react";
import { IconTrash } from "../../../assets/icons";
import { Tag } from "../../../common/Tag/Tag";
import { PER_REGION_MODES } from "../../../mixins/PerRegionModes";
import { Block, Elem } from "../../../utils/bem";
import "./RegionDetails.styl";

const { Text, Paragraph } = Typography;

const RegionLabels: FC<{result: any}> = ({ result }) => {
  const labels: any[] = result.selectedLabels;
  const showLabels = labels.length > 1;

  return (
    <Elem name="item" key={result.pid}>
      {showLabels && (
        <Elem name="content">
          {labels.map(label => {
            const bgColor = label.background || "#000000";

            return (
              <Tag key={label.id} color={bgColor} solid>
                {label.value}
              </Tag>
            );
          })}
        </Elem>
      )}

      {result.value.text ? (
        <Elem
          name="content"
          mod={{ type: "text" }}
          dangerouslySetInnerHTML={{
            __html: result.value.text.replace(/\\n/g, '\n'),
          }}
        />
      ) : null}
    </Elem>
  );
};

const ResultItem: FC<{result: any}> = observer(({ result }) => {
  const { type, from_name, mainValue } = result;
  const isRegionList = from_name.displaMode === PER_REGION_MODES.REGION_LIST;

  const content = useMemo(() => {
    if (type.endsWith("labels")) {
      return (
        <RegionLabels result={result}/>
      );
    } else if (type === "rating") {
      return (
        <>
          <Text>Rating: </Text>
          {mainValue}
        </>
      );
    } else if (type === "textarea" && !(from_name.perregion && isRegionList)) {
      return (
        <>
          <Text>Text: </Text>
          <Text mark >
            {mainValue.join("\n")}
          </Text>
        </>
      );
    } else if (type === "choices") {
      return (
        <>
          <Text>Choices: </Text>
          {mainValue.join(", ")}
        </>
      );
    }
  }, [type, from_name, mainValue]);

  return content ? (
    <Block name="region-meta">
      {content}
    </Block>
  ) : null;
});

export const RegionDetailsMain: FC<{region: any}> = observer(({
  region,
}) => {
  return (
    <Elem name="result">
      {(region?.results as any[]).map((res) => <ResultItem key={res.pid} result={res}/>)}
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
