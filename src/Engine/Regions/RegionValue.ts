import { Store } from '@atoms/Store';
import { TagController } from '@tags/Base/TagController';
import { atom, PrimitiveAtom, useAtom, useAtomValue } from 'jotai';
import { SetStateAction } from 'jotai/vanilla';
import { defaultStyle } from 'src/core/Constants';
import { ConfigTree } from 'src/Engine/ConfigTree/ConfigTree';

export enum ResultValueType {
  text = 'labels',
  hypertext = 'hypertextlabels',
}

type WithInitialValue<Value> = {
  init: Value,
};

type RegionStyle = {
  strokeColor: string,
  strokeWidth: number,
  fillColor: string,
  fillOpacity: number,
  opacity: number,
}

type ResultPropertyMap<Properties extends {}, Keys extends keyof Properties> = {
  [key in Keys]: PrimitiveAtom<Properties[key]> & WithInitialValue<Properties[key]>;
}

export class RegionValue<
  Properties extends {} = {},
  PropKeys extends keyof Properties = keyof Properties,
> extends Store {

  #atomProps!: ResultPropertyMap<Properties, PropKeys>;
  #configTree: ConfigTree;
  #fromName: string;
  #tag!: TagController;

  properties!: Properties;

  get tag() {
    return this.#tag ?? (this.#tag = this.controllers[0]);
  }

  get backgroundColor() {
    return (
      this.tag.getAttribute('background') as string | null
    ) ?? defaultStyle.fillcolor;
  }

  get fillColor() {
    return this.backgroundColor ?? defaultStyle.fillcolor;
  }

  get fillOpacity() {
    return (
      this.tag.getAttribute('fillOpacity') as number | null
    ) ?? defaultStyle.opacity;
  }

  get strokeColor() {
    return this.backgroundColor ?? defaultStyle.strokecolor;
  }

  get strokeWidth() {
    return (
      this.tag.getAttribute('strokeWidth') as number | null
    ) ?? defaultStyle.strokewidth;
  }

  get opacity() {
    return (
      this.tag.parent?.getAttribute('opacity') as number | null
    ) ?? defaultStyle.opacity;
  }

  get style(): RegionStyle | null {
    if (!this.tag) return null;

    return {
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      fillColor: this.fillColor,
      fillOpacity: this.fillOpacity,
      opacity: this.opacity,
    };
  }

  get atoms() {
    return this.#atomProps;
  }

  get controllers() {
    const tree = this.#configTree;
    const node = tree.findNodeByName(this.#fromName);

    if (!node) throw new Error(`Node with name "${this.#fromName}" not found`);

    if (node.children.size === 0) {
      return [
        tree.findActiveController(node)!,
      ];
    }

    const key = Object
      .keys(this.properties)
      .find(k => k.match(/labels|choices/));

    if (!key) throw new Error(`Can't find controller for region "${this.#fromName}"`);

    const value = this.properties[key as PropKeys] as any;

    return Array
      .from(node.children)
      .filter(child => value.includes(child.getAttribute('value')))
      .map(child => {
        const configNode = tree.getNodeForElement(child)!;

        return tree.findActiveController(configNode)!;
      });
  }

  constructor(
    fromName: string,
    properties: Properties,
    configTree: ConfigTree,
  ) {
    super();

    this.#fromName = fromName;
    this.#configTree = configTree;
    this.defineProperties(properties);
  }

  defineProperties(properties: Properties) {
    this.#atomProps = Object.entries(properties).reduce((res, entry) => {
      const key = entry[0] as PropKeys;
      const value = entry[1] as Properties[PropKeys];
      const atomConfig = atom(value);

      return { ...res, [key]: atomConfig };
    }, {} as ResultPropertyMap<Properties, PropKeys>);

    this.properties = new Proxy(properties, {
      get: (target, key) => {
        this.#defineIfEmpty(key as PropKeys);

        return this.getProperty(key as PropKeys);
      },
      set: (target, key, value) => {
        this.#defineIfEmpty(key as PropKeys);

        this.setProperty(key as PropKeys, value);

        return true;
      },
    });
  }

  getProperty<Property extends PropKeys>(
    key: Property,
  ): Properties[Property] {
    return this.get(this.#atomProps[key]);
  }

  setProperty<
    Property extends PropKeys,
  >(
    key: Property,
    value: SetStateAction<Properties[Property]>,
  ) {
    const prop = this.#atomProps[key];

    this.set(prop, value);
  }

  /** React-specific methods to access atomic values */
  useProperty(prop: PropKeys) {
    return useAtom(this.#atomProps[prop]);
  }

  usePropertyValue(prop: PropKeys) {
    return useAtomValue(this.#atomProps[prop]);
  }

  export() {
    return Object.entries(this.properties).reduce((res, entry) => {
      const key = entry[0] as PropKeys;
      const value = entry[1] as Properties[PropKeys];

      return { ...res, [key]: value };
    }, {} as Properties);
  }

  #defineIfEmpty(key: PropKeys) {
    if (!(key in this.#atomProps)) {
      this.#atomProps[key] = atom(null) as any;
    }
  }
}

export type ExtractResultType<T> = T extends RegionValue<infer Output> ? Output : never;
