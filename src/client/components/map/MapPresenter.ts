import Presenter from '../../superclasses/Presenter';
import MapView from './MapView';
import AppModel from '../../app/AppModel';
import * as EventEmitter from 'eventemitter3';

export default class MapPresenter extends Presenter<AppModel, MapView> {
  public constructor(model: AppModel, view: MapView, emitter: EventEmitter) {
    super(model, view, emitter);

    this.emitter.on('initialDraw', (): void => {
      this.model.setMapLoaded(true);
      this.model.initialDraw();
    });

    this.emitter.on('districtClicked', (id: number): void => {
      this.model.geographySelected(id, 'district');
    });

    this.emitter.on('zoneClicked', (id: number): void => {
      this.model.geographySelected(id, 'zone');
    });

    this.emitter.on('lineClicked', (key: string, weight: number): void => {
      this.model.lineSelected(key, weight);
    });
  }
}
