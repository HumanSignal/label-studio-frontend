import { isLiteral } from "@babel/types";
import { observe } from "mobx";
import { getType, isLiteralType, isOptionalType, isPrimitiveType, isType, isUnionType, types } from "mobx-state-tree";
import { ChangeEvent, FC, useCallback, useEffect, useMemo, useState } from "react";
import { Block, Elem, useBEM } from "../../../utils/bem";
import "./RegionEditor.styl";

interface RegionEditorProps {
  region: any;
}

export const RegionEditor: FC<RegionEditorProps> = ({
  region,
}) => {
  const fields: any[] = region.editableFields ?? [];

  return (
    <Block name="region-editor">
      {region.editorEnabled && fields.map((field: any, i) => {
        return (
          <RegionProperty
            key={`${field.property}-${i}`}
            property={field.property}
            label={field.label}
            region={region}
          />
        );
      })}
    </Block>
  );
};

interface RegionPropertyProps {
  property: string;
  label: string;
  region: any;
}

const RegionProperty: FC<RegionPropertyProps> = ({
  property,
  label,
  region,
}) => {
  const block = useBEM();
  const [value, setValue] = useState(region.getProperty(property));

  const propertyType = useMemo(() => {
    const regionType = getType(region);

    return (regionType as any).properties[property];
  }, [region, property]);

  const isPrimitive = useMemo(() => {
    return isPrimitiveType(propertyType);
  }, [propertyType]);

  const options = useMemo(() => {
    if (isPrimitive) return null;

    let result: any[] | null = null;
    const isEnum = isUnionType(propertyType);

    if (isEnum) {
      const isOptional = isOptionalType(propertyType) as boolean;
      const valuesList = isOptional ? propertyType.getSubTypes().getSubTypes() : propertyType.getSubTypes();
      const hasOptions = valuesList.some((t: any) => isLiteralType(t) || isPrimitiveType(t));

      result = hasOptions ? (valuesList as any[]).map((t: any) => t.value) : null;
    }

    return result;
  }, [propertyType, isPrimitive]);

  const isBoolean = useMemo(() => {
    if (!isPrimitive) return false;

    const coreType = isOptionalType(propertyType)
      ? propertyType.getSubTypes()
      : propertyType;

    return coreType === types.boolean;
  }, [propertyType, isPrimitive]);

  const onChangeHandler = useCallback((e: ChangeEvent) => {
    const target = e.target as any;

    try {
      const newValue = isBoolean
        ? target.checked
        : convertValue((target as any).value, propertyType);

      region.setProperty(property, newValue);
    } catch (err) {
      console.error(err);
    }
  }, [propertyType, isBoolean]);

  useEffect(() => {
    const cancelObserve = observe(region, property, ({ newValue }) => {
      setValue(newValue.storedValue);
    });

    return () => cancelObserve();
  }, [region]);

  return (
    <Elem name="property" tag="label">
      { isBoolean ? (
        <input
          className={block?.elem("input").toClassName()}
          type="checkbox"
          checked={value}
          onChange={onChangeHandler}
        />
      ) : isPrimitive ? (
        <input
          className={block?.elem("input").toClassName()}
          type="text"
          value={value}
          onChange={onChangeHandler}
        />
      ) : options ? (
        <select
          value={value}
          onChange={onChangeHandler}
          className={block?.elem("select").toClassName()}
        >
          {options.map((value, i) => <option key={`${value}-${i}`} value={value}>{value}</option>)}
        </select>
      ) : null}
      <Elem name="text" tag="span">{label}</Elem>
    </Elem>
  );
};

const convertValue = (value: any, type: any) => {
  let result: any;

  switch(type.name) {
    case "number":
      result = Number(value);
      if (isNaN(result)) throw new Error("Type mistmatch");
      break;
    default:
      result = value;
      break;
  }

  return result;
};
