import { observe } from "mobx";
import { observer } from "mobx-react";
import { getType, IAnyType, isLiteralType, isOptionalType, isPrimitiveType, isUnionType, types } from "mobx-state-tree";
import { number } from "mobx-state-tree/dist/internal";
import { ChangeEvent, FC, HTMLInputTypeAttribute, InputHTMLAttributes, KeyboardEvent, useCallback, useEffect, useMemo, useState } from "react";
import { IconPropertyAngle } from "../../../assets/icons";
import { Block, Elem, useBEM } from "../../../utils/bem";
import "./RegionEditor.styl";

interface RegionEditorProps {
  region: any;
}

const getPrimitiveType = (type: IAnyType) => {
  if (isOptionalType(type)) {
    const subtype = (type as any).getSubTypes();

    return isPrimitiveType(subtype) ? subtype.name : null;
  }

  return isPrimitiveType(type) ? (type as any).name : null;
};

const getInputType = (type: any) => {
  const primitive = getPrimitiveType(type);

  switch (primitive) {
    case "number": return "number";
    case "string": return "text";
    default: return "text";
  }
};

const IconMapping = {
  angle: IconPropertyAngle,
};

const RegionEditorComponent: FC<RegionEditorProps> = ({
  region,
}) => {
  const fields: any[] = region.editableFields ?? [];

  return (
    <Block name="region-editor" mod={{ disabled: !region.editable }}>
      <Elem name="wrapper">
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
      </Elem>
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

  const onChangeHandler = useCallback((value) => {
    try {
      region.setProperty(property, value);
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
          onChange={(e) => onChangeHandler(e.target.checked)}
        />
      ) : isPrimitive ? (
        <RegionInput
          type={getInputType(propertyType)}
          step="0.01"
          value={value}
          onChange={(v) => onChangeHandler(v)}
        />
      ) : options ? (
        <select
          value={value}
          onChange={(e) => onChangeHandler(e.target.value)}
          className={block?.elem("select").toClassName()}
        >
          {options.map((value, i) => <option key={`${value}-${i}`} value={value}>{value}</option>)}
        </select>
      ) : null}
      <PropertyLabel label={label}/>
    </Elem>
  );
};

interface RegionInputProps extends InputHTMLAttributes<HTMLInputElement>  {
  type: HTMLInputTypeAttribute;
  onChange?: (newValue: any) => void;
}

const RegionInput: FC<RegionInputProps> = ({
  onChange,
  type,
  value,
  ...props
}) => {
  const normalizeValue = (value: any, type: HTMLInputTypeAttribute) =>{
    if (type === "number") return Number(Number(value ?? 0).toFixed(2));
    return value;
  };

  const block = useBEM();
  const [currentValue, setValue] = useState(normalizeValue(value, type));

  const updateValue = useCallback((value, safeValue = true) => {
    const newValue = safeValue ? normalizeValue(value, type) : value;

    setValue(newValue);
    if (safeValue) onChange?.(newValue);
  }, [onChange, type]);

  const onChangeHandler = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    let safeValue = true;

    if (type === "number" && !value.match(/^([0-9,.]*)$/ig)) {
      safeValue = false;
    }

    if (type === "number" && value.match(/(,|\.)$/)){
      value = value.replace(/,/, '.');
      safeValue = false;
    }

    updateValue(value, safeValue);
  }, [updateValue, type]);

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (type !== 'number') return;

    if (e.key === "ArrowUp" || e.key === 'ArrowDown') {
      e.preventDefault();
      console.log('arrow');

      const step = (e.altKey && e.shiftKey) ? 0.01 : e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      let newValue = Number(currentValue);

      if (e.key === 'ArrowUp') {
        newValue += step;
      } else {
        newValue -= step;
      }

      updateValue(parseFloat(newValue.toFixed(2)));
    }
  }, [currentValue, type, props.step]);

  useEffect(() => {
    updateValue(value);
  }, [value]);

  return (
    <input
      {...props}
      className={block?.elem("input").toClassName()}
      type="text"
      step="0.01"
      onChange={onChangeHandler}
      onKeyDown={onKeyDown}
      value={currentValue}
    />
  );
};

const PropertyLabel: FC<{label: string}> = ({ label }) => {
  const IconComponent = useMemo(() => {
    if (label.startsWith('icon:')) {
      const iconName = label.split(":")[1] as keyof typeof IconMapping;

      return IconMapping[iconName] ?? null;
    }

    return null;
  }, [label]);

  return (
    <Elem name="text" tag="span">{IconComponent ? <IconComponent/> : label}</Elem>
  );
};

export const RegionEditor = observer(RegionEditorComponent);
