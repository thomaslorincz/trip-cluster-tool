import * as EventEmitter from 'eventemitter3';

export default class View {
  protected readonly container: Element;
  protected readonly emitter: EventEmitter;

  public constructor(container: Element, emitter: EventEmitter) {
    this.container = container;
    this.emitter = emitter;
  }
}
