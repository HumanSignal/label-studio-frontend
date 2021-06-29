import chroma from "chroma-js";
import { Block, Elem } from "../../utils/bem";
import "./Label.styl";
import { useMemo } from "react";
import { asVars } from "../../utils/styles";

export const Label = ({ className, style, color, empty = false, hidden = false, selected = false, margins=false, onClick, children, hotkey }) => {
  const styles = useMemo(() => {
    if (!color) return null;
    const background = chroma(color).alpha(0.15);
    return {
      ...(style ?? {}), ...asVars({
        color,
        background,
      }),
    };
  }, [color]);

  return (
    <Block tag="span" name="label" mod={{ empty, hidden, selected, clickable: !!onClick, margins }} mix={className} style={styles} onClick={onClick}>
      <Elem tag="span" name="text">{children}</Elem>
      {hotkey ? <Elem tag="span" name="hotkey">{hotkey}</Elem> : null}
    </Block>
  );
};
