import EventEmitter from 'eventemitter3';
import AppModel from './app/AppModel';
import AppPresenter from './app/AppPresenter';
import './style.css';

const emitter = new EventEmitter();
new AppPresenter(new AppModel(emitter), null, emitter);
