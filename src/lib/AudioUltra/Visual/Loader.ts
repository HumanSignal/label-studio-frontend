export class Loader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          width: 100%;
          height: 100%;
          position: absolute;
          top: 0;
          left: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.1);
          justify-content: center;
          align-items: center;
        }
        :host([hidden]) {
          display: none;
        }
        .loader {
          background-image: repeating-linear-gradient(-63.43deg,hsla(0,0%,100%,.2) 3px,#09f 2px,#09f 13px,hsla(0,0%,100%,.2) 13px,hsla(0,0%,100%,.2) 20px);
          background-size: 37px 100%;
          border-radius: 8px;
          height: 8px;
          opacity: 0.6;
          pointer-events: none;
          width: 70%;
          animation: loading 0.7s linear infinite;
        }
        @keyframes loading {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 37px 0;
          }
        }
      </style>
      <div class="loader"></div>
    `;
  }
}

customElements.define('audio-ultra-loader', Loader);
