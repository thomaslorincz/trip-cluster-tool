import Presenter from '../../superclasses/Presenter';

/**
 * A presenter that converts events from the ControlPanelView into actions in
 * the AppModel.
 */
export default class ControlPanelPresenter extends Presenter {
  /**
   * @param {AppModel} model
   * @param {ControlPanelView} view
   * @param {EventEmitter} emitter
   */
  constructor(model, view, emitter) {
    super(model, view, emitter);

    this.emitter.on('nextIterationClicked', () => {
      this.model.nextIteration();
    });

    this.emitter.on('autoIterateClicked', () => {
      this.model.autoIterate();
    });

    this.emitter.on('decrementClicked', () => {
      this.model.decrementFlowLines();
    });

    this.emitter.on('incrementClicked', () => {
      this.model.incrementFlowLines();
    });

    this.emitter.on('boundaryClicked', (boundary) => {
      this.model.updateBoundary(boundary);
    });

    this.emitter.on('modeClicked', (mode) => {
      this.model.updateMode(mode);
    });
  }
}
