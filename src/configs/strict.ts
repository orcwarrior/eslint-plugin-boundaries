import { recommended } from "./recommended";

const strict = {
  ...recommended,
  rules: {
    ...recommended.rules,
    "boundaries/no-ignored": 2,
    "boundaries/no-unknown-files": 2,
    "boundaries/no-unknown": 2,
  },
};

export { strict };
