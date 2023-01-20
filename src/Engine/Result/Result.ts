import { TagType } from '@tags/Base/TagController';
import { guidGenerator } from 'src/utils/unique';
import { ConfigTree } from '../ConfigTree/ConfigTree';
import { ResultValueBase } from './ResultValueBase';

type OutputValue<T> = T extends ResultValueBase<infer Output> ? Output : never;

type ResultValue<T> = {
  id: string,
  from_name: string,
  to_name: string,
  type: TagType,
  value: T,
};

export class Result<
  Value extends ResultValueBase = ResultValueBase,
  Result extends ResultValue<OutputValue<Value>> = any,
> {
  private configTree: ConfigTree;

  id = guidGenerator();
  fromName: string;
  toName: string;
  type: TagType;
  value!: Value;

  constructor(options: {
    configTree: ConfigTree,
    id?: string,
    fromName: string,
    toName: string,
    type: TagType,
    value?: Value,
  }) {
    this.id = options.id ?? this.id;
    this.fromName = options.fromName;
    this.toName = options.toName;
    this.type = options.type;
    this.value = options.value ?? this.value;
    this.configTree = options.configTree;
  }

  get object() {
    const configNode = this.configTree.findNodeByName(this.toName);

    return this.configTree.findActiveController(configNode!);
  }

  get control() {
    const configNode = this.configTree.findNodeByName(this.fromName);

    return this.configTree.findActiveController(configNode!);
  }

  setValue(value: Value) {
    this.value = value;
  }

  toJSON() {
    return {
      id: this.id,
      from_name: this.fromName,
      to_name: this.toName,
      type: this.type,
      value: this.value.toJSON(),
    } as Result;
  }
}
