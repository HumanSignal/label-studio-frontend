import Tree from "../../core/Tree";
import { isAlive } from "mobx-state-tree";
import { useEffect } from "react";

export function Annotation({ annotation, root }) {
  useEffect(()=>{
    return ()=>{
      if (annotation && isAlive(annotation)) {
        console.log(`resetReady`, annotation.pk, annotation.id);
        annotation.resetReady();
      }
    };
  }, [annotation.pk, annotation.id]);
  return root ? Tree.renderItem(root) : null;
}