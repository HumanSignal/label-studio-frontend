import { TagController } from '@tags/Base/TagController';
import { ConfigTreeNode } from '../ConfigTreeNode';

export type AttributeParserParams<Controller extends TagController> = {
  value: string,
  name: string,
  node: ConfigTreeNode,
  controller: Controller,
};

export type AttributeParser<Result, Controller extends TagController> = (
  atribute: AttributeParserParams<Controller>
) => Result;

export type RequiredAttribute = {
  required: true,
}

export type StringAttribute = {
  type: 'string',
  defaultValue?: string,
} & Partial<RequiredAttribute>

export type BooleanAttribute = {
  type: 'boolean',
  defaultValue?: boolean,
} & Partial<RequiredAttribute>

export type UnionAttribute<
  O extends string[] = string[]
> = {
  type: 'union',
  oneOf: O,
  defaultValue?: O[number],
} & Partial<RequiredAttribute>

export type NumberAttribute = {
  type: 'number',
  min?: number,
  max?: number,
  defaultValue?: number,
} & Partial<RequiredAttribute>

export type AttributeWithParser<T, C extends TagController> = {
  parser: AttributeParser<T, C>,
  defaultValue?: T,
} & Partial<RequiredAttribute>

export type ComplexAttribute<
  UnionType extends string[] = string[],
> =
  | StringAttribute
  | BooleanAttribute
  | UnionAttribute<UnionType>
  | NumberAttribute
  | AttributeWithParser<any, any>;


type WithRequiredProperty<Type, Key extends keyof Type> = Type & {
  [Property in Key]-?: Type[Property];
};

export type WithDefaultValue<Type extends ComplexAttribute> = WithRequiredProperty<Type, 'defaultValue'>;

export type AttributeOptions = ComplexAttribute;
