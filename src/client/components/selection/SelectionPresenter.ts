import Presenter from '../../superclasses/Presenter';
import SelectionView from './SelectionView';
import AppModel from '../../app/AppModel';
import * as EventEmitter from 'eventemitter3';

export default class SelectionPresenter
  extends Presenter<AppModel, SelectionView> {
  public constructor(model: AppModel, view: SelectionView,
      emitter: EventEmitter) {
    super(model, view, emitter);
  }
}
