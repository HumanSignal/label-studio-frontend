import color from "chroma-js";
import { Block } from "../../utils/bem";
import { colors } from "../../utils/namedColors";
import "./Tag.styl";

const prepareColor = (colorString, solid) => {
  const baseColor = color(colorString);

  return solid ? {
    color: color.contrast(baseColor, '#fff') > 4.5 ? '#fff' : '#000',
    background: baseColor,
    "shadow-color": baseColor.darken(0.22),
  } : {
    color: baseColor,
    background: baseColor.desaturate(2).brighten(2.2),
    "shadow-color": baseColor.desaturate(1).brighten(1.22),
  };
};

const getColor = colorString => {
  if (colorString) {
    return colors[colorString] ?? colorString;
  } else {
    return colors.blue;
  }
};

export const Tag = ({ className, style, size, color, solid = false, children }) => {
  const finalColor = Object.entries(prepareColor(getColor(color), solid)).reduce(
    (res, [key, color]) => ({ ...res, [`--${key}`]: color }),
    {},
  );

  const styles = { ...(style ?? {}), ...finalColor };

  return (
    <Block tag="span" name="tag" mod={{ size }} mix={className} style={styles}>
      {children}
    </Block>
  );
};
