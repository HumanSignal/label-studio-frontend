import { BaseTagController } from '@tags/Base/Base/BaseTagController';
import { ConfigTreeNode } from '../ConfigTreeNode';

export type AttributeParserParams<Controller extends BaseTagController> = {
  value: string,
  name: string,
  node: ConfigTreeNode,
  controller: Controller,
};

export type AttributeParser<Result, Controller extends BaseTagController> = (
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

export type AttributeWithParser<T, C extends BaseTagController> = {
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

export type AttributeOptions = ComplexAttribute;
