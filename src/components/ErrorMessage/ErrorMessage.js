import React from "react";
import styles from "./ErrorMessage.module.scss";
console.log({ styles });

export const ErrorMessage = ({ error }) => {
  console.log("ErrorMessage", error);
  if (typeof error === "string") {
    return <div className={styles.error} dangerouslySetInnerHTML={{ __html: error }} />;
  }
  const body = error instanceof Error ? error.message : error;
  return <div className={styles.error}>{body}</div>;
};
