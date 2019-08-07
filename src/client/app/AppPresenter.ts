import Presenter from '../superclasses/Presenter';
import AppModel from './AppModel';
import View from '../superclasses/View';
import * as EventEmitter from 'eventemitter3';
import MapView from '../components/map/MapView';
import MapPresenter from '../components/map/MapPresenter';
import ControlPanelView from '../components/control-panel/ControlPanelView';
import ControlPanelPresenter
  from '../components/control-panel/ControlPanelPresenter';
import SelectionView from '../components/selection/SelectionView';
import SelectionPresenter from '../components/selection/SelectionPresenter';

export default class AppPresenter extends Presenter<AppModel, View> {
  private readonly mapView: MapView;
  private readonly selectionView: SelectionView;
  private readonly controlPanelView: ControlPanelView;

  public constructor(model: AppModel, view: View, emitter: EventEmitter) {
    super(model, view, emitter);

    this.mapView = new MapView(document.getElementById('map'), this.emitter);
    new MapPresenter(this.model, this.mapView, this.emitter);

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

    this.selectionView = new SelectionView(
        document.getElementById('selection-panel'),
        this.emitter
    );
    new SelectionPresenter(this.model, this.selectionView, this.emitter);

    this.emitter.on(
        'selectionUpdated',
        ({geographyType, geographyId, geographyWeight, lineId,
          lineWeight}): void => {
          this.mapView.updateSelected(geographyId);
          this.mapView.updateBoundary(geographyType);

          this.selectionView.draw(
              geographyType,
              geographyId,
              geographyWeight,
              lineId,
              lineWeight
          );
        }
    );

    this.controlPanelView = new ControlPanelView(
        document.getElementById('control-panel'),
        this.emitter
    );
    new ControlPanelPresenter(this.model, this.controlPanelView, this.emitter);

    this.emitter.on(
        'controlsUpdated',
        ({numFlowLines, geographyType, mode}): void => {
          this.controlPanelView.draw(numFlowLines, geographyType, mode);
        }
    );
  }
}
