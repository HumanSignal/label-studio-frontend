import External from "../core/External";
import Messages from "../utils/messages";

function getData(task) {
  if (task && task.data) {
    return {
      ...task,
      data: JSON.stringify(task.data),
    };
  }

  return task;
}

function getState(task) {
  const completions = task && task.completions ? task.completions : null;
  const predictions = task && task.predictions ? task.predictions : null;

  return {
    completions: completions,
    predictions: predictions,
  };
}

/**
 * LS will render in this part
 */
function rootElement(element) {
  const el = document.createElement("div");

  let root;

  if (typeof element === "string") {
    root = document.getElementById(element);
  } else {
    root = element;
  }

  root.innerHTML = "";
  root.appendChild(el);

  return el;
}

/**
 * Function to configure application with callbacks
 * @param {object} params
 */
function configureApplication(params) {
  // callbacks for back compatibility
  const osCB = params.submitCompletion || params.onSubmitCompletion;
  const ouCB = params.updateCompletion || params.onUpdateCompletion;
  const odCB = params.deleteCompletion || params.onDeleteCompletion;

  const options = {
    // communication with the server
    // fetch: params.fetch || Requests.fetcher,
    // patch: params.patch || Requests.patch,
    // post: params.post || Requests.poster,
    // remove: params.remove || Requests.remover,

    // communication with the user
    alert: m => console.log(m), // Noop for demo: window.alert(m)
    messages: { ...Messages, ...params.messages },

    // callbacks and event handlers
    onSubmitCompletion: params.onSubmitCompletion ? osCB : External.onSubmitCompletion,
    onUpdateCompletion: params.onUpdateCompletion ? ouCB : External.onUpdateCompletion,
    onDeleteCompletion: params.onDeleteCompletion ? odCB : External.onDeleteCompletion,
    onSkipTask: params.onSkipTask ? params.onSkipTask : External.onSkipTask,
    onSubmitDraft: params.onSubmitDraft || External.onSubmitDraft,
    onTaskLoad: params.onTaskLoad || External.onTaskLoad,
    onLabelStudioLoad: params.onLabelStudioLoad || External.onLabelStudioLoad,
    onEntityCreate: params.onEntityCreate || External.onEntityCreate,
    onEntityDelete: params.onEntityDelete || External.onEntityDelete,
    onGroundTruth: params.onGroundTruth || External.onGroundTruth,
    onSelectCompletion: params.onSelectCompletion || External.onSelectCompletion,
  };

  return options;
}

export default { getData, getState, rootElement, configureApplication };
