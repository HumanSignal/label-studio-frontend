export class TagRegistry {
  private static instance: TagRegistry;
  private tags: any;

  private constructor() {
    this.tags = {};
  }

  public static getInstance(): TagRegistry {
    if (!TagRegistry.instance) {
      TagRegistry.instance = new TagRegistry();
    }

    return TagRegistry.instance;
  }

  public register(tag: any) {
    this.tags[tag.name] = tag;
  }

  public get(name: string) {
    return this.tags[name];
  }
}
