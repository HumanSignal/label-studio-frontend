export const NodeView = ({
  name,
  icon,
  altIcon = null,
  getContent = () => {},
} = {}) => {
  if (altIcon instanceof Function) {
    [getContent, altIcon] = [altIcon, null];
  }

  return { name, icon, altIcon, getContent };
};
