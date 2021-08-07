/**
 * Class for register View
 */
class _Registry {
  constructor () {
    this.tags = [];
    this.models = {};
    this.views = {};
    this.regions = [];
    this.objects = [];
    // list of available areas per object type
    this.areas = new Map();

    this.views_models = {};

    this.tools = {};

    this.perRegionViews = {};
  }

  addTag (tag, model, view) {
    this.tags.push(tag);
    this.models[tag] = model;
    this.views[tag] = view;
    this.views_models[model.name] = view;
  }

  addRegionType (type, object, detector) {
    this.regions.push(type);
    if (detector) type.detectByValue = detector;
    const areas = this.areas.get(object);

    if (areas) areas.push(type);
    else this.areas.set(object, [type]);
  }

  regionTypes () {
    return this.regions;
  }

  addObjectType (type) {
    this.objects.push(type);
  }

  objectTypes () {
    return this.objects;
  }

  modelsArr () {
    return Object.values(this.models);
  }

  getViewByModel (modelName) {
    const view = this.views_models[modelName];

    if (!view) throw new Error("No view for model: " + modelName);

    return view;
  }

  getViewByTag (tag) {
    return this.views[tag];
  }

  getAvailableAreas (object, value) {
    const available = this.areas.get(object);

    if (!available) return [];
    if (value) {
      for (let model of available) {
        if (model.detectByValue && model.detectByValue(value)) return [model];
      }
    }
    return available.filter(a => !a.detectByValue);
  }

  getTool (name) {
    const model = this.tools[name];

    if (!model) {
      const models = Object.keys(this.tools);

      throw new Error("No model registered for tool: " + name + "\nAvailable models:\n\t" + models.join("\n\t"));
    }

    return model;
  }

  addTool (name, model) {
    this.tools[name] = model;
  }

  /**
   * Get model
   * @param {string} tag
   * @return {import("mobx-state-tree").IModelType}
   */
  getModelByTag (tag) {
    const model = this.models[tag];

    if (!model) {
      const models = Object.keys(this.models);

      throw new Error("No model registered for tag: " + tag + "\nAvailable models:\n\t" + models.join("\n\t"));
    }

    return model;
  }

  addPerRegionView (tag, mode, view) {
    const tagViews = this.perRegionViews[tag] || {};

    tagViews[mode] = view;
    this.perRegionViews[tag] = tagViews;
  }

  getPerRegionView (tag, mode) {
    return this.perRegionViews[tag]?.[mode];
  }
}

const Registry = new _Registry();

Registry.getTool = Registry.getTool.bind(Registry);
Registry.getModelByTag = Registry.getModelByTag.bind(Registry);

export default Registry;
