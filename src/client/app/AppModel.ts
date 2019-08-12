import Model from '../superclasses/Model';
import * as EventEmitter from 'eventemitter3';
import * as d3 from 'd3-fetch';
import FlowLine from '../lib/FlowLine';
import ODPair from '../lib/ODPair';
import Point from '../lib/Point';

/** Model that stores and controls the app's data and state. */
export default class AppModel extends Model {
  private dataLoaded: boolean = false;
  private mapLoaded: boolean = false;
  private initialDrawCompleted: boolean = false;
  private lineId: number = -1;
  private geographyId: number = -1;
  private geographyWeight: number = -1;
  private lineWeight: number = -1;
  private numFlowLines: number = 15;
  private geographyType: string = 'district';
  private mode: string = 'all';
  private readonly maxFlowLines: number = 30;
  private readonly totalData: ODPair[] = [];
  private selectedData: ODPair[] = [];
  private flowLines: FlowLine[] = [];
  private flowLineToData: Map<string, ODPair[]> = new Map<string, ODPair[]>();

  public constructor(emitter: EventEmitter) {
    super(emitter);

    Promise.all([
      d3.csv('assets/data/od_xy.csv'),
    ]).then(([totalData]): void => {
      for (let i = 0; i < totalData.length; i++) {
        this.totalData.push(new ODPair(
            new Point(
                parseInt(totalData[i]['origin_zone']),
                parseInt(totalData[i]['origin_district']),
                parseFloat(totalData[i]['origin_x']),
                parseFloat(totalData[i]['origin_y']),
                parseInt(totalData[i]['auto'])
                + parseInt(totalData[i]['transit'])
                + parseInt(totalData[i]['active'])
            ),
            new Point(
                parseInt(totalData[i]['dest_zone']),
                parseInt(totalData[i]['dest_district']),
                parseFloat(totalData[i]['dest_x']),
                parseFloat(totalData[i]['dest_y']),
                parseInt(totalData[i]['auto'])
                + parseInt(totalData[i]['transit'])
                + parseInt(totalData[i]['active'])
            ),
            parseInt(totalData[i]['auto']),
            parseInt(totalData[i]['transit']),
            parseInt(totalData[i]['active'])
        ));
      }

      this.dataLoaded = true;
      this.initialDraw();
    });
  }

  public setMapLoaded(loaded: boolean): void {
    this.mapLoaded = loaded;
  }


  public initialDraw(): void {
    if (this.dataLoaded && this.mapLoaded && !this.initialDrawCompleted) {
      this.dispatchSelectionUpdated();
      this.dispatchControlsUpdated();
      this.initialDrawCompleted = true;
    }
  }

  public geographySelected(id: number, type: string): void {
    this.emitter.emit('removeClusters');
    this.lineId = -1;
    this.lineWeight = -1;

    if (this.geographyType === type && this.geographyId === id) {
      this.geographyId = -1;
      this.geographyWeight = -1;
      this.emitter.emit('removeFlowLines');
    } else {
      this.geographyId = id;
      this.updateGeographyWeight();
      this.processData();
    }

    this.dispatchSelectionUpdated();
  }

  public lineSelected(lineKey: string, lineWeight: number): void {
    this.emitter.emit('removeClusters');
    if (this.lineId === parseInt(lineKey)) {
      this.lineId = -1;
      this.lineWeight = -1;
      this.splitIntoGroups();
    } else {
      this.lineId = parseInt(lineKey);
      this.lineWeight = lineWeight;
      const [origins, destinations]
          = this.combineClusterPoints(this.flowLineToData.get(lineKey));
      this.emitter.emit('addClusters', {
        lineKey,
        origins,
        destinations,
      });
    }

    this.dispatchSelectionUpdated();
  }

  /** Decreases the number of flow lines by 1 */
  public decrementFlowLines(): void {
    this.emitter.emit('removeClusters');
    if (this.numFlowLines > 1) {
      this.numFlowLines--;
      this.processData();
      this.dispatchControlsUpdated();
    }
  }

  /** Increases the number of flow lines by 1 */
  public incrementFlowLines(): void {
    this.emitter.emit('removeClusters');
    if (this.numFlowLines !== this.maxFlowLines) {
      this.numFlowLines++;
      this.processData();
      this.dispatchControlsUpdated();
    }
  }

  public updateBoundary(boundary: string): void {
    this.emitter.emit('removeFlowLines');
    this.emitter.emit('removeClusters');
    this.geographyId = -1;
    this.geographyType = boundary;
    this.lineId = -1;
    this.dispatchSelectionUpdated();
    this.dispatchControlsUpdated();
  }

  public updateMode(mode: string): void {
    this.emitter.emit('removeClusters');
    this.mode = mode;
    this.processData();
    this.updateGeographyWeight();
    this.dispatchSelectionUpdated();
    this.dispatchControlsUpdated();
  }

  /**
   * K-means initialization. This is different from traditional K-means.
   * Lines with a higher weight are given priority to be initial cluster
   * centers.
   */
  private processData(): void {
    this.selectedData = [];
    if (this.geographyType === 'district') {
      this.selectedData = this.totalData.filter((pair: ODPair): boolean => {
        return pair.destination.district === this.geographyId;
      });
    } else if (this.geographyType === 'zone') {
      this.selectedData = this.totalData.filter((pair: ODPair): boolean => {
        return pair.destination.zone === this.geographyId;
      });
    }

    this.selectedData.sort((first, second): number => {
      return second[this.mode] - first[this.mode];
    });

    this.flowLines = [];
    for (let i = 0; i < this.numFlowLines; i++) {
      const datum = this.selectedData[i];
      if (datum) {
        this.flowLines.push(new FlowLine(
            i.toString(),
            datum.origin.x,
            datum.origin.y,
            datum.destination.x,
            datum.destination.y,
            datum[this.mode]
        ));
      }
    }

    this.splitIntoGroups();
  }

  /**
   * Calculate the distance between each line end and each cluster center. Split
   * lines into a number of cluster groups.
   */
  private splitIntoGroups(): void {
    this.flowLineToData = new Map<string, ODPair[]>();
    for (let i = 0; i < this.flowLines.length; i++) {
      this.flowLineToData.set(this.flowLines[i].key, []);
    }

    // 50 k-means iterations
    const datumToClosestFlowLine = {};
    for (let n = 0; n < 100; n++) {
      for (let i = 0; i < this.selectedData.length; i++) {
        const pair = this.selectedData[i];
        let closestFlowLine = null;
        let minDist = Number.POSITIVE_INFINITY;
        for (let j = 0; j < this.flowLines.length; j++) {
          const flowLine = this.flowLines[j];

          // Euclidean distance
          const dist = Math.sqrt(
              Math.pow(pair.origin.x - flowLine.originX, 2)
              + Math.pow(pair.origin.y - flowLine.originY, 2)
              + Math.pow(pair.destination.x - flowLine.destX, 2)
              + Math.pow(pair.destination.y - flowLine.destY, 2)
          );

          if (dist < minDist) {
            closestFlowLine = flowLine.key;
            minDist = dist;
          }
        }

        datumToClosestFlowLine[i] = closestFlowLine;
      }
    }

    for (let i = 0; i < this.selectedData.length; i++) {
      this.flowLineToData.get(datumToClosestFlowLine[i])
          .push(this.selectedData[i]);
    }
    this.flowLines = this.calcNewFlowLines();
    this.redrawFlowLines(this.flowLines);
  }

  private calcNewFlowLines(): FlowLine[] {
    const newFlowLines: FlowLine[] = [];
    this.flowLineToData.forEach((cluster, key): void => {
      let weight = 0;
      let destX = 0;
      let destY = 0;
      let originX = 0;
      let originY = 0;
      for (let i = 0; i < cluster.length; i++) {
        const pair = cluster[i];
        const pairWeight = pair[this.mode];

        const newWeight = weight + pairWeight;
        originX = (originX * weight + pair.origin.x * pairWeight)
            / newWeight;
        originY = (originY * weight + pair.origin.y * pairWeight)
            / newWeight;
        destX = (destX * weight + pair.destination.x * pairWeight)
            / newWeight;
        destY = (destY * weight + pair.destination.y * pairWeight)
            / newWeight;
        weight = newWeight;
      }

      newFlowLines.push(
          new FlowLine(key, originX, originY, destX, destY, weight)
      );
    });

    return newFlowLines;
  }

  private redrawFlowLines(flowLines: FlowLine[]): void {
    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = 0;
    for (let i = 0; i < flowLines.length; i++) {
      maxValue = Math.max(flowLines[i].weight, maxValue);
      minValue = Math.min(flowLines[i].weight, minValue);
    }

    this.emitter.emit('removeFlowLines');
    this.emitter.emit('addFlowLines', {
      lines: flowLines,
      min: minValue,
      max: maxValue,
    });
  }

  private updateGeographyWeight(): void {
    this.geographyWeight = this.totalData
        .filter((pair): boolean => {
          if (this.geographyType === 'district') {
            return pair.destination.district === this.geographyId;
          } else {
            return pair.destination.zone === this.geographyId;
          }
        })
        .map((pair): number => pair[this.mode])
        .reduce((acc, val): number => acc + val);
  }

  private combineClusterPoints(cluster: ODPair[]): [Point[], Point[]] {
    const originZoneToPoint = new Map<number, Point>();
    const destZoneToPoint = new Map<number, Point>();

    cluster.forEach((pair): void => {
      if (originZoneToPoint.has(pair.origin.zone)) {
        originZoneToPoint.get(pair.origin.zone).weight += pair[this.mode];
      } else {
        originZoneToPoint.set(pair.origin.zone, new Point(
            pair.origin.zone,
            pair.origin.district,
            pair.origin.x,
            pair.origin.y,
            pair[this.mode],
        ));
      }

      if (destZoneToPoint.has(pair.destination.zone)) {
        destZoneToPoint.get(pair.destination.zone).weight += pair[this.mode];
      } else {
        destZoneToPoint.set(pair.destination.zone, new Point(
            pair.destination.zone,
            pair.destination.district,
            pair.destination.x,
            pair.destination.y,
            pair[this.mode],
        ));
      }
    });

    const originPoints = Array.from(originZoneToPoint.values());
    const destinationPoints = Array.from(destZoneToPoint.values());
    return [originPoints, destinationPoints];
  }

  private dispatchSelectionUpdated(): void {
    this.emitter.emit('selectionUpdated', {
      geographyType: this.geographyType,
      geographyId: this.geographyId,
      geographyWeight: this.geographyWeight,
      lineId: this.lineId,
      lineWeight: this.lineWeight,
      mode: this.mode,
    });
  }

  private dispatchControlsUpdated(): void {
    this.emitter.emit('controlsUpdated', {
      numFlowLines: this.numFlowLines,
      geographyType: this.geographyType,
      mode: this.mode,
    });
  }
}
