/**
 * Presenter superclass that defines a connection between a model and a view.
 */
export default class Presenter {
  /**
   * @param {Model} model
   * @param {View} view
   * @param {EventEmitter} emitter
   */
  constructor(model, view, emitter) {
    this.model = model;
    this.view = view;
    this.emitter = emitter;
  }
}
