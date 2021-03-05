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
  const annotations = task && task.annotations ? task.annotations : null;
  const predictions = task && task.predictions ? task.predictions : null;

  return {
    annotations: annotations,
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
  const osCB = params.submitAnnotation || params.onSubmitAnnotation;
  const ouCB = params.updateAnnotation || params.onUpdateAnnotation;
  const odCB = params.deleteAnnotation || params.onDeleteAnnotation;

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
    onSubmitAnnotation: params.onSubmitAnnotation ? osCB : External.onSubmitAnnotation,
    onUpdateAnnotation: params.onUpdateAnnotation ? ouCB : External.onUpdateAnnotation,
    onDeleteAnnotation: params.onDeleteAnnotation ? odCB : External.onDeleteAnnotation,
    onSkipTask: params.onSkipTask ? params.onSkipTask : External.onSkipTask,
    onSubmitDraft: params.onSubmitDraft || External.onSubmitDraft,
    onTaskLoad: params.onTaskLoad || External.onTaskLoad,
    onLabelStudioLoad: params.onLabelStudioLoad || External.onLabelStudioLoad,
    onEntityCreate: params.onEntityCreate || External.onEntityCreate,
    onEntityDelete: params.onEntityDelete || External.onEntityDelete,
    onGroundTruth: params.onGroundTruth || External.onGroundTruth,
    onSelectAnnotation: params.onSelectAnnotation || External.onSelectAnnotation,
  };

  return options;
}

export default { getData, getState, rootElement, configureApplication };
