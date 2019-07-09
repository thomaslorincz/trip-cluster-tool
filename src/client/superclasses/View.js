/** View superclass that defines a class representation of a DOM element. */
export default class View {
  /**
   * @param {HTMLElement} container
   * @param {EventEmitter} emitter
   */
  constructor(container, emitter) {
    this.container = container;
    this.emitter = emitter;
  }
}
