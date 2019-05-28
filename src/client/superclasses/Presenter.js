/**
 * Presenter superclass that defines a connection between a model and a view.
 */
export default class Presenter {
  /**
   * @param {Model} model
   * @param {View} view
   */
  constructor(model, view) {
    this.model = model;
    this.view = view;
  }
}
