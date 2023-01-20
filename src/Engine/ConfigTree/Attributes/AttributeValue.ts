import { TagController } from '@tags/Base/TagController';
import { ConfigTreeNode } from '../ConfigTreeNode';
import { AttributeWithParser, ComplexAttribute, RequiredAttribute, WithDefaultValue } from './Types';

class AttributeValue<Options extends (
  | ComplexAttribute
  | WithDefaultValue<ComplexAttribute>
)> {

  private options: Options | AttributeWithParser<Options['defaultValue'], any>;
  private _value: Options['defaultValue'];
  private name!: string;
  private node!: ConfigTreeNode;
  private controller!: any;

  constructor(options: AttributeWithParser<Options['defaultValue'], any>);
  constructor(options: Options);

  constructor(options: Options) {
    this.options = options;
    this._value = this.options.defaultValue;
  }

  get value() {
    return this.parsedValue ?? (this._value || this.options.defaultValue);
  }

  set value(value: Options['defaultValue']) {
    this.validate(value);
    this._value = value;
  }

  get defaultValue() {
    return this.options.defaultValue;
  }

  required() {
    type CurrentOptions = typeof this.options;
    type OptionsType = WithDefaultValue<CurrentOptions> & RequiredAttribute;

    return new AttributeValue<OptionsType>({
      ...this.options,
      required: true,
    } as OptionsType);
  }

  configure<Controller extends TagController>({
    value,
    name,
    configNode,
    controller,
  }: {
    value: Options['defaultValue'],
    name: string,
    configNode: ConfigTreeNode,
    controller: Controller,
  }) {
    this.value = value;
    this.name = name;
    this.node = configNode;
    this.controller = controller;
  }

  private get parsedValue() {
    if (!('parser' in this.options)) return;

    return this.options.parser({
      name: this.name,
      value: this._value,
      node: this.node,
      controller: this.controller,
    });
  }

  private validate(value: Options['defaultValue']) {
    this.checkRequired(value);
    this.checkOneOf(value);
  }

  private checkRequired(value: Options['defaultValue']) {
    if (!this.options.required) return;
    if (value) return;

    throw new Error(`Attribute ${this.name} is required`);
  }

  private checkOneOf(value: Options['defaultValue']) {
    if (!('oneOf' in this.options)) return;
    if (this.options.oneOf.includes(value as any)) return;

    throw new Error(`Value ${value} is not allowed for attribute ${this.name}`);
  }
}

export { AttributeValue };
