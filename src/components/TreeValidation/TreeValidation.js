import React from "react";
import { PropTypes } from "prop-types";
import { getEnv } from "mobx-state-tree";
import { inject, observer } from "mobx-react";

export const TreeValidation = inject("store")(
  observer(({ store, errors }) => {
    return (
      <>
        {errors.map((error, index) => {
          return (
            <code
              key={`error-${index}`}
              dangerouslySetInnerHTML={{ __html: getEnv(store).messages[error.error](error) }}
            />
          );
        })}
      </>
    );
  }),
);

TreeValidation.propTypes = {
  errors: PropTypes.array.isRequired,
};
