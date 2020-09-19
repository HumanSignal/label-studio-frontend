const _detect = region => {
  switch (region.type) {
    default:
      console.warn(`Unknown region type: ${region.type}`);
      return { x: 0, y: 0, width: 0, height: 0 };
    case "textrange":
      const bbox = region._spans[0].getBoundingClientRect();
      return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  }
};

export class BBoxDetector {
  static getBoundingBoxForRegionType(region) {
    const result = _detect(region);

    return Object.assign(
      {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      result,
    );
  }
}
