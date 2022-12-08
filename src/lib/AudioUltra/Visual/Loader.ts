export class Loader extends HTMLElement {
  _value: number;

  constructor() {
    super();
    this._value = 0;

    this.attachShadow({ mode: 'open' });
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          width: 100%;
          height: var(--ls-loader-height, calc(100% - var(--ls-loader-offset, 34px)));
          position: absolute;
          top: var(--ls-loader-offset, 34px);
          left: 0;
          z-index: 9999;
          justify-content: center;
          align-items: center;
          background-color: var(--ls-loader-background-color, #fafafa);
        }
        :host([hidden]) {
          display: none;
        }
        .progress {
          background-color: var(--ls-loader-color, rgba(65, 60, 74, 0.08));
          border-radius: var(--ls-loader-progress-border-radius, 8px);
          height: var(--ls-loader-progress-height, 8px);
          pointer-events: none;
          overflow: hidden;
          width: 70%;
        }
        .progress-bar {
          width: 100%;
          height: 100%;
          background-color: var(--ls-loader-progress-color, rgba(105, 192, 255, 1));
          transition: transform 0.15s ease;
          transform-origin: left;
          transform: translateX(var(--ls-loader-position, -100%));
        }
        .progress-bar-indeterminate {
          animation: shimmer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes shimmer {
          50% {
            opacity: 0.5;
          }
        }
      </style>
      <div class="progress">
        <div class="progress-bar"></div>
      </div>
    `;
  }

  get value() {
    return this._value;
  }

  set value(value: number) {
    this._value = value;
    this.update();
  }

  update() {
    if (!this.shadowRoot) return;
    const bar = this.shadowRoot.querySelector('.progress-bar') as HTMLElement;

    if (!bar) return;
    bar.style.transform = `translateX(${this._value - 100}%)`;

    if (this._value === 100) {
      bar.classList.add('progress-bar-indeterminate');
    }
  }

  static get observedAttributes() {
    return ['hidden'];
  }
}

customElements.define('loading-progress-bar', Loader);
