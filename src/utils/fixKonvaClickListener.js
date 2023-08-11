let lastPointerDownTarget;
let lastPointerDownTime;
let lastPointerDownPos;
let lastClickTime;
let lastClickPos;
let nextdoubleClickAction;
const DOUBLE_CLICK_MS_WINDOW = 400;
const MAX_CLICK_POS_DEVIATION = 5;

export const fixKonvaClickListener = ({ onClick, onDoubleClick }) => {
  return {
    onPointerDown(e) {
      lastPointerDownTime = e.evt.timeStamp;
      lastPointerDownTarget = e.target;
      lastPointerDownPos = {
        x: e.evt.offsetX,
        y: e.evt.offsetY,
      };
    },
    onPointerUp(e) {
      if (lastPointerDownTarget.attrs.name !== e.target.attrs.name) {
        debugger;
        return;
      }

      const currentTime = e.evt.timeStamp;

      if (lastClickTime && (currentTime - lastClickTime < DOUBLE_CLICK_MS_WINDOW) &&
        (lastClickPos && Math.abs(lastClickPos.x - e.evt.offsetX) < MAX_CLICK_POS_DEVIATION && Math.abs(lastClickPos.y - e.evt.offsetY) < MAX_CLICK_POS_DEVIATION)) {
        lastClickTime = undefined;
        setTimeout(()=>onDoubleClick?.(e));
        e.cancelBubble = true;
      } else if (
        lastPointerDownPos &&
        Math.abs(lastPointerDownPos.x - e.evt.offsetX) < MAX_CLICK_POS_DEVIATION
        && Math.abs(lastPointerDownPos.y - e.evt.offsetY) < MAX_CLICK_POS_DEVIATION
      ) {
        lastClickTime = e.evt.timeStamp;
        lastClickPos = {
          x: e.evt.offsetX,
          y: e.evt.offsetY,
        };
        nextdoubleClickAction = onDoubleClick;
        setTimeout(()=>onClick?.(e));
        e.cancelBubble = true;
      }
    },
    onClick: onClick ? (e) => {
      e.cancelBubble = true;
    } : onClick,
    onDoubleClick: onDoubleClick ? (e) => {
      e.cancelBubble = true;
    } : onDoubleClick,
  };
};

export const isPartOfProcessingAction = (e) => {
  const currentTime = e.evt.timeStamp;

  if (lastPointerDownTime && lastPointerDownTime === currentTime) {
    return true;
  }

  return false;
};

export const stageSecondClickCatcher = (e) => {
  const currentTime = e.evt.timeStamp;

  if (lastClickTime && currentTime !== lastClickTime && (currentTime - lastClickTime < DOUBLE_CLICK_MS_WINDOW)) {
    if (lastClickPos && Math.abs(lastClickPos.x - e.evt.offsetX) < MAX_CLICK_POS_DEVIATION && Math.abs(lastClickPos.y - e.evt.offsetY) < MAX_CLICK_POS_DEVIATION) {
      lastPointerDownTarget = undefined;
      lastClickTime = undefined;
      setTimeout(() => {
        nextdoubleClickAction?.(e);
      });
      return true;
    }
  }

  return false;
};