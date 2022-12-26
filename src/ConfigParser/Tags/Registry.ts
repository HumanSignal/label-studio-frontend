class Registry {
  private static instance: Registry;
  private tags: any;

  private constructor() {
    this.tags = {};
  }

  public static getInstance(): Registry {
    if (!Registry.instance) {
      Registry.instance = new Registry();
    }

    return Registry.instance;
  }

  public register(tag: any) {
    this.tags[tag.name] = tag;
  }

  public get(name: string) {
    return this.tags[name];
  }
}

export { Registry };
