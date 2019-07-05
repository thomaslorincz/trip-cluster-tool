import 'core-js';
import 'regenerator-runtime/runtime';
import EventEmitter from 'eventemitter3';
import AppModel from './app/App.model';
import AppPresenter from './app/App.presenter';
import './style.css';

// Needed for Hot Module Replacement
if (typeof(module.hot) !== 'undefined') {
  module.hot.accept();
}

// Initiate the app
const emitter = new EventEmitter();
new AppPresenter(new AppModel(emitter), null, emitter);
