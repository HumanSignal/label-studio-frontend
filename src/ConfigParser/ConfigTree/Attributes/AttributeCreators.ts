import { BaseTagController } from '@tags/Base/Base/BaseTagController';
import { parseValue } from 'src/utils/data';
import { AttributeValue } from './AttributeValue';
import { AttributeParser, AttributeWithParser, BooleanAttribute, NumberAttribute, StringAttribute, UnionAttribute } from './Types';

export const stringAttribute = (
  defaultValue?: string,
) => {
  const attr = new AttributeValue<StringAttribute>({
    type: 'string',
    defaultValue,
  });

  attr.value;

  return attr;
};

export const booleanAttribute = (
  defaultValue?: boolean,
) => {
  return new AttributeValue<BooleanAttribute>({
    type: 'boolean',
    defaultValue,
  });
};

export const numberAttribute = (
  defaultValue?: number,
  min?: number,
  max?: number,
) => {
  return new AttributeValue<NumberAttribute>({
    type: 'number',
    defaultValue,
    min,
    max,
  });
};

export const oneOfAttribute = <
  T extends string,
  AcceptedValues extends T[]
>(
  acceptedValues: AcceptedValues,
  defaultValue?: AcceptedValues[number],
) => {
  return new AttributeValue<UnionAttribute<AcceptedValues>>({
    type: 'union',
    oneOf: acceptedValues,
    defaultValue,
  });
};

export const parsedAttribute = function<
  Parser extends AttributeParser<any, any>,
  R extends ReturnType<Parser>,
>(
  parser: Parser,
  defaultValue?: R,
) {
  type AttributeType = AttributeWithParser<R, any>;

  return new AttributeValue<AttributeType>({
    parser,
    defaultValue,
  });
};

export const attr = {
  oneOf: oneOfAttribute,
  boolean: booleanAttribute,
  number: numberAttribute,
  string: stringAttribute,
  parser: parsedAttribute,
  dataValue<Controller extends BaseTagController>() {
    return parsedAttribute(
      (attribute) => {
        const controller = attribute.controller as Controller;

        const task = controller.sdk.data;

        return parseValue(attribute.value, task);
      },
    );
  },
};
