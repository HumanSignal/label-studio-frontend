const svgChildren = new WeakMap();

export function cutFibers(object) {
  const objects = [object];
  let obj;

  while ((obj = objects.pop())) {
    const keys = Object.keys(obj);
    const descriptors = Object.getOwnPropertyDescriptors(obj);

    for (const key of keys) {
      const prop = obj[key];
      const isWritable = descriptors[key].writable;
      const isSvgRelated = obj.elementType === 'svg' || svgChildren.has(obj);

      if (isSvgRelated) {
        console.log('!> SvgRelated', obj);
      }
      if (prop && isWritable) {
        if (key !== '_debugOwner' && typeof prop === 'object' && {}.hasOwnProperty.call(prop, 'stateNode')) {
          objects.push(obj[key]);
          if (isSvgRelated) {
            svgChildren.set(obj[key], true);
          }
        }
        if (typeof prop === 'object' || typeof prop === 'function') {
          obj[key] = null;
        }
      }
      if (isSvgRelated) {
        svgChildren.delete(obj);
      }
    }
  }
}

export function findReactKey(node) {
  const keys = Object.keys(node);

  for (const key of keys) {
    const match = RegExp(/^__reactProps(\$[^$]+)$/).exec(key);

    if (match) {
      return match[1];
    }
  }
  return '';
}

export function cleanDomAfterReact(nodes, reactKey) {
  for (const node of nodes) {
    if (node.isConnected) return;
    const reactPropKeys = (Object.keys(node)).filter(key => key.startsWith('__react') && (!RegExp(/^(?:__reactProps|__reactFiber)/).exec(key) || RegExp(new RegExp(`\\${reactKey}$`)).exec(key)));

    if (reactPropKeys.length) {
      for (const key of reactPropKeys) {
        cutFibers(node[key]);
        node[key] = null;
      }
      if (node.childNodes) {
        cleanDomAfterReact(node.childNodes, reactKey);
      }
    }
  }
}

const globalCache = new WeakMap();

function createCleaner() {
  let ref = null;

  return (node) => {
    if (node) {
      ref = node;
    } else {
      if (ref) {
        const lastRef = ref;
        const reactKey = findReactKey(lastRef);

        ref = null;
        setTimeout(() => {
          cleanDomAfterReact([lastRef], reactKey);
        });
      }
    }
  };
}

export function reactCleaner(object, key = 'default') {
  if (!globalCache.has(object)) {
    globalCache.set(object, new Map());
  }
  const cache = globalCache.get(object);

  if (!cache.has(key)) {
    cache.set(key, createCleaner());
  }

  return cache.get(key);
}
