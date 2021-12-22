import Tree from "../../core/Tree";
import { isAlive } from "mobx-state-tree";
import { useEffect } from "react";

export function Annotation({ annotation, root }) {
  useEffect(()=>{
    return ()=>{
      if (annotation && isAlive(annotation)) {
        annotation.resetReady();
      }
    };
  }, [annotation.pk, annotation.id]);
  return root ? Tree.renderItem(root) : null;
}