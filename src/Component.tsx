// import { Component } from 'react';
// import { App } from './App';
// import { configureStore } from './configureStore';
// import { registerPanels } from './registerPanels';
// import { LSOptions } from './Types/LabelStudio/LabelStudio';

// export class LabelStudio extends Component<LSOptions> {
//   state = {
//     initialized: false,
//   };

//   store: any;

//   componentDidMount() {
//     configureStore(this.props).then(({ store }) => {
//       this.store = store;
//       window.Htx = this.store;
//       this.setState({ initialized: true });
//     });
//   }

//   componentDidUpdate(prevProps) {
//     if (this.props.task !== prevProps.task) {
//       this.store.resetState();
//       this.store.assignTask(this.props.task);
//       this.store.initializeStore(this.props.task);
//     }
//   }

//   render() {
//     return this.state.initialized ? (
//       <App
//         store={this.store}
//         panels={registerPanels(this.props.panels) ?? []}
//       />
//     ) : null;
//   }
// }
