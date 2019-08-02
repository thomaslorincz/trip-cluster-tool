import Presenter from '../../superclasses/Presenter';
import ControlPanelView from './ControlPanelView';
import AppModel from '../../app/AppModel';
import * as EventEmitter from 'eventemitter3';

export default class ControlPanelPresenter
  extends Presenter<AppModel, ControlPanelView> {
  public constructor(model: AppModel, view: ControlPanelView,
      emitter: EventEmitter) {
    super(model, view, emitter);

    this.emitter.on('decrementClicked', (): void => {
      this.model.decrementFlowLines();
    });

    this.emitter.on('incrementClicked', (): void => {
      this.model.incrementFlowLines();
    });

    this.emitter.on('boundaryClicked', (boundary: string): void => {
      this.model.updateBoundary(boundary);
    });

    this.emitter.on('modeClicked', (mode: string): void => {
      this.model.updateMode(mode);
    });
  }
}
