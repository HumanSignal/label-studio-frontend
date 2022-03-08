class ResizeObserverFallback {
  observe() {

  }
  disconnect() {

  }
}

export default window.ResizeObserver ?? ResizeObserverFallback;