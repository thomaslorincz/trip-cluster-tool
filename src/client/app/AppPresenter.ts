import Presenter from '../superclasses/Presenter';
import AppModel from './AppModel';
import View from '../superclasses/View';
import * as EventEmitter from 'eventemitter3';
import MapView from '../components/map/MapView';
import MapPresenter from '../components/map/MapPresenter';
import ControlPanelView from '../components/control-panel/ControlPanelView';
import ControlPanelPresenter
  from '../components/control-panel/ControlPanelPresenter';

export default class AppPresenter extends Presenter<AppModel, View> {
  private readonly mapView: MapView;
  private readonly controlPanelView: ControlPanelView;

  public constructor(model: AppModel, view: View, emitter: EventEmitter) {
    super(model, view, emitter);

    this.mapView = new MapView(document.getElementById('map'), this.emitter);
    new MapPresenter(this.model, this.mapView, this.emitter);

    this.emitter.on('selectedUpdated', (selected: number): void => {
      this.mapView.updateSelected(selected);
    });

    this.emitter.on('boundaryUpdated', (boundary: string): void => {
      this.mapView.updateBoundary(boundary);
    });

    this.emitter.on('removeFlowLines', (): void => {
      this.mapView.removeFlowLines();
    });
    this.emitter.on('addFlowLines', ({lines, min, max}): void => {
      this.mapView.addFlowLines(lines, min, max);
    });

    this.emitter.on('removeClusters', (): void => {
      this.mapView.removeClusters();
    });
    this.emitter.on('addClusters', ({lineKey, clusters}): void => {
      this.mapView.addClusters(lineKey, clusters);
    });

    this.controlPanelView = new ControlPanelView(
        document.getElementById('control-panel'),
        this.emitter
    );
    new ControlPanelPresenter(this.model, this.controlPanelView, this.emitter);

    this.emitter.on(
        'controlsUpdated',
        ({geography, lineWeight, numFlowLines, boundary, mode}): void => {
          this.controlPanelView.draw(
              geography, lineWeight, numFlowLines, boundary, mode
          );
        }
    );
  }
}
