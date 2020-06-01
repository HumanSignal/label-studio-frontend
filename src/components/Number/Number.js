import React from "react";
import styles from "./Number.module.scss";

export const Number = ({ number, className, ...props }) => (
  <div className={[styles.badge, className].filter(Boolean).join(" ")} {...props}>
    {number}
  </div>
);
