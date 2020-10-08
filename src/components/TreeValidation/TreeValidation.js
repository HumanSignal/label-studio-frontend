import React from "react";
import { PropTypes } from "prop-types";
import { getEnv } from "mobx-state-tree";
import { inject, observer } from "mobx-react";

import styles from "./TreeValidation.module.scss";

export const TreeValidation = inject("store")(
  observer(({ store, errors }) => {
    console.log(styles);

    return (
      <div className="ls-errors">
        {errors.map((error, index) => {
          return (
            <code
              key={`error-${index}`}
              className={styles["ls-error"]}
              dangerouslySetInnerHTML={{ __html: getEnv(store).messages[error.error](error) }}
            />
          );
        })}
      </div>
    );
  }),
);

TreeValidation.propTypes = {
  errors: PropTypes.array.isRequired,
};
