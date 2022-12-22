type Attribute = {
  type: string | string[],
  defaultValue: string,
}

export abstract class BaseTagAttributes {
  attributes!: Record<string, Attribute>;
}
