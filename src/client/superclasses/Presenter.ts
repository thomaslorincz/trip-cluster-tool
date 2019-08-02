import Model from './Model';
import View from './View';
import * as EventEmitter from 'eventemitter3';

export default class Presenter<M extends Model, V extends View> {
  protected readonly model: M;
  protected readonly view: V;
  protected readonly emitter: EventEmitter;

  public constructor(model, view, emitter) {
    this.model = model;
    this.view = view;
    this.emitter = emitter;
  }
}
