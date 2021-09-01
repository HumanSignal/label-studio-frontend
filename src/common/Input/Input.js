import React, { forwardRef } from "react";
import { cn } from "../../utils/bem";
import Label from "../Label/Label";
import "./Input.styl";

const Input = forwardRef(({ label, className, required, labelProps, ghost, ...props }, ref) => {
  const classList = [
    cn('input').mod({ ghost }),
    className,
  ].join(" ").trim();

  const input = <input {...props} ref={ref} className={classList}/>;

  return label ? (
    <Label
      {...(labelProps ?? {})}
      text={label}
      required={required}
    >{input}</Label>
  ) : input;
});

export default Input;
