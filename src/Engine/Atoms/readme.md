Atoms folder holds the information about atoms, models, types, and model hooks used in the app.

`Inputs` – set of types for the input data of the LSF such as tasks, annotations, predictions, etc. Inputs are the raw data that is enriched and transformed by the app.

`Models` – data models used internally in the app. Each model is represented by:
  - Atom – place for the atom configs and the atom logic. The atom is following the "Big Atom" pattern meaning that there's only one root atom for every model and every other atom is a derived state of the root.
  - Hooks – custom React hooks specific to a certain model
  - Types – typescript types for the model
  - Model – the model itself. It holds the logic of hydration, validation, and transformation of the data.
  - InitialState – initial state of the root atom of the model
