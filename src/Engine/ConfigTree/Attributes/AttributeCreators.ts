import { TagController } from '@tags/Base/TagController';
import { parseValue } from 'src/utils/data';
import { AttributeValue } from './AttributeValue';
import { AttributeParser, AttributeWithParser, BooleanAttribute, ComplexAttribute, NumberAttribute, StringAttribute, UnionAttribute, WithDefaultValue } from './Types';

type FinalAttribute<
  Attr extends ComplexAttribute,
  DefaultValue,
> = DefaultValue extends undefined
  ? Attr
  : WithDefaultValue<Attr>;

export const stringAttribute = <
  DefaultValue extends string | undefined,
  Attribute extends FinalAttribute<StringAttribute, DefaultValue>,
>(
  defaultValue?: DefaultValue,
) => {
  const attr = new AttributeValue({
    type: 'string',
    defaultValue,
  } as Attribute);

  return attr;
};

const str = stringAttribute();

str.value;

export const booleanAttribute = <
  DefaultValue extends boolean | undefined,
  Attribute extends FinalAttribute<BooleanAttribute, DefaultValue>,
>(
  defaultValue?: DefaultValue,
) => {
  return new AttributeValue({
    type: 'boolean',
    defaultValue,
  } as Attribute);
};

export const numberAttribute = <
  DefaultValue extends number | undefined,
  Attribute extends FinalAttribute<NumberAttribute, DefaultValue>,
>(
  defaultValue?: DefaultValue,
  min?: number,
  max?: number,
) => {
  return new AttributeValue({
    type: 'number',
    defaultValue,
    min,
    max,
  } as Attribute);
};

export const oneOfAttribute = <
  T extends string,
  AcceptedValues extends T[],
  DefaultValue extends AcceptedValues[number] | undefined,
  Attribute extends FinalAttribute<UnionAttribute<AcceptedValues>, DefaultValue>,
>(
  acceptedValues: AcceptedValues,
  defaultValue?: DefaultValue,
) => {
  return new AttributeValue({
    type: 'union',
    oneOf: acceptedValues,
    defaultValue,
  } as Attribute);
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
  string: stringAttribute,
  boolean: booleanAttribute,
  number: numberAttribute,
  oneOf: oneOfAttribute,
  parser: parsedAttribute,
  dataValue<Result, Controller extends TagController = TagController>() {
    return parsedAttribute(
      (attribute) => {
        const controller = attribute.controller as Controller;

        const task = controller.sdk.data;

        return parseValue<Result>(attribute.value, task);
      },
    );
  },
};
