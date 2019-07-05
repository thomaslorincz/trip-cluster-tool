/** Model superclass */
export default class Model {
  /** @param {EventEmitter} emitter */
  constructor(emitter) {
    this.emitter = emitter;
  }
}
