import { ConfigValidator } from "./ConfigValidator";

const VALIDATORS = {
  config: ConfigValidator,
};

export class DataValidator {
  static validate(validatorName, data) {
    const validator = VALIDATORS[validatorName];

    if (validator) {
      const errors = validator.validate(data);
    } else {
      console.error(`Unknown validator: ${validatorName}`);
    }
  }
}
