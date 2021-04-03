import React from "react";
import styles from "./SidebarToggle.module.scss";

export const SidebarToggle = () => {
  return (
    <div className={styles.container}>
      <div className={[styles.button, styles.active].join(" ")}>Annotation</div>
      <div className={styles.button}>Comments</div>
    </div>
  );
};
