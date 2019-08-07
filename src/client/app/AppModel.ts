import Model from '../superclasses/Model';
import * as EventEmitter from 'eventemitter3';
import * as d3 from 'd3-fetch';
import FlowLine from '../lib/FlowLine';
import ODDatum from '../lib/ODDatum';

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
  private mode: string = 'All';
  private readonly maxFlowLines: number = 30;
  private readonly totalData: ODDatum[] = [];
  private activeData: ODDatum[] = [];
  private flowLines: FlowLine[] = [];
  private flowMatrix = [];
  private flowMatrixWithClusters = {};

  public constructor(emitter: EventEmitter) {
    super(emitter);

    Promise.all([
      d3.csv('assets/data/od_xy.csv'),
    ]).then(([totalData]): void => {
      for (let i = 0; i < totalData.length; i++) {
        const totalDatum = totalData[i];

        this.totalData.push(new ODDatum(
            parseInt(totalDatum['origin_zone']),
            parseInt(totalDatum['dest_zone']),
            parseInt(totalDatum['origin_district']),
            parseInt(totalDatum['dest_district']),
            totalDatum['mode_category'],
            parseFloat(totalDatum['origin_x']),
            parseFloat(totalDatum['origin_y']),
            parseFloat(totalDatum['dest_x']),
            parseFloat(totalDatum['dest_y']),
            parseInt(totalDatum['count'])
        ));
      }

      this.activeData = this.totalData.filter((datum: ODDatum): boolean => {
        return this.mode === 'All' || datum.mode === this.mode;
      });

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
      this.geographyWeight = this.activeData
          .filter((datum): boolean => {
            if (this.geographyType === 'district') {
              return datum.destDistrict === this.geographyId;
            } else {
              return datum.destZone === this.geographyId;
            }
          })
          .map((datum): number => datum.weight)
          .reduce((acc, val): number => acc + val);
      this.processData(this.activeData, this.numFlowLines);
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
      this.emitter.emit('addClusters', {
        lineKey,
        clusters: this.flowMatrixWithClusters[lineKey],
      });
    }

    this.dispatchSelectionUpdated();
  }

  /** Decreases the number of flow lines by 1 */
  public decrementFlowLines(): void {
    this.emitter.emit('removeClusters');
    if (this.numFlowLines > 1) {
      this.numFlowLines--;
      this.processData(this.activeData, this.numFlowLines);
      this.dispatchControlsUpdated();
    }
  }

  /** Increases the number of flow lines by 1 */
  public incrementFlowLines(): void {
    this.emitter.emit('removeClusters');
    if (this.numFlowLines !== this.maxFlowLines) {
      this.numFlowLines++;
      this.processData(this.activeData, this.numFlowLines);
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
    this.activeData = this.totalData.filter((datum: ODDatum): boolean => {
      return this.mode === 'All' || datum.mode === this.mode;
    });
    this.dispatchControlsUpdated();
    this.processData(this.activeData, this.numFlowLines);
  }

  /**
   * K-means initialization. This is different from traditional K-means.
   * It gives a higher possibility to lines with a higher weight to be chosen as
   * an initial cluster center.
   * @see https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
   */
  private processData(dataMatrix: ODDatum[], numFlowLines: number): void {
    let totalWeight = 0;
    this.flowMatrix = [];

    if (this.geographyType === 'district') {
      this.flowMatrix = dataMatrix.filter((datum: ODDatum): boolean => {
        return datum.destDistrict === this.geographyId;
      });
    } else if (this.geographyType === 'zone') {
      this.flowMatrix = dataMatrix.filter((datum: ODDatum): boolean => {
        return datum.destZone === this.geographyId;
      });
    }

    for (let i = 0; i < this.flowMatrix.length; i++) {
      totalWeight += this.flowMatrix[i].weight;
    }

    let currentSum = 0;
    const transitArraySums = new Array(this.flowMatrix.length);
    for (let i = 0; i < this.flowMatrix.length; i++) {
      currentSum += this.flowMatrix[i].weight;
      transitArraySums[i] = currentSum;
    }

    this.flowLines = [];
    if (this.flowMatrix.length < numFlowLines) {
      this.flowLines = [...this.flowMatrix];
    } else {
      this.flowLines = new Array(numFlowLines);
      for (let i = 0; i < this.flowLines.length; i++) {
        const randomWeight = Math.floor(Math.random() * totalWeight);
        for (let j = 0; j < this.flowMatrix.length; j++) {
          if (transitArraySums[j] >= randomWeight
              && this.flowLines.indexOf(this.flowMatrix[j]) === -1) {
            this.flowLines[i] = this.flowMatrix[j];
            break;
          }
        }
      }

      // Delete falsy elements ('', 0, NaN, null, undefined, false)
      this.flowLines = this.flowLines.filter((f: FlowLine): boolean => {
        return Boolean(f);
      });
    }

    if (this.flowMatrix.length > 0) {
      this.splitIntoGroups();
    }
  }

  /**
   * Calculate the distance between each line end and each cluster center. Split
   * lines into a number of cluster groups.
   */
  private splitIntoGroups(): void {
    for (let n = 0; n < 100; n++) {
      this.flowMatrixWithClusters = {};
      for (let i = 0; i < this.flowLines.length; i++) {
        this.flowMatrixWithClusters[i] = [];
      }

      const result = new Array(this.flowMatrix.length);
      for (let i = 0; i < this.flowMatrix.length; i++) {
        const datum = this.flowMatrix[i];
        let group = 0;
        let minDist = Number.POSITIVE_INFINITY;
        for (let j = 0; j < this.flowLines.length; j++) {
          const flowLine = this.flowLines[j];

          // Euclidean distance
          const currentDist = Math.sqrt(
              Math.pow(datum.originX - flowLine.originX, 2)
              + Math.pow(datum.originY - flowLine.originY, 2)
              + Math.pow(datum.destX - flowLine.destX, 2)
              + Math.pow(datum.destY - flowLine.destY, 2)
          );

          if (currentDist < minDist) {
            group = j;
            minDist = currentDist;
          }
        }

        result[i] = group;
      }

      for (let i = 0; i < this.flowMatrix.length; i++) {
        this.flowMatrixWithClusters[result[i]].push(this.flowMatrix[i]);
      }
      this.flowLines = AppModel.calcNewFlowLines(this.flowMatrixWithClusters);
    }

    this.redrawFlowLines(this.flowLines);
  }

  /**
   * @param {{string: FlowLine[]}} flowMatrixWithClusters
   * @return {FlowLine[]}
   */
  private static calcNewFlowLines(flowMatrixWithClusters: {}): FlowLine[] {
    const newFlowLines: FlowLine[] = [];
    for (const [key] of Object.entries(flowMatrixWithClusters)) {
      const flowLines = flowMatrixWithClusters[key];
      let weight = 0;
      let destX = 0;
      let destY = 0;
      let originX = 0;
      let originY = 0;
      for (let i = 0; i < flowLines.length; i++) {
        const flowLine = flowLines[i];
        if (flowLine.weight === 0) {
          continue;
        }

        const newWeight = weight + flowLine.weight;
        originX = (originX * weight + flowLine.originX * flowLine.weight)
            / newWeight;
        originY = (originY * weight + flowLine.originY * flowLine.weight)
            / newWeight;
        destX = (destX * weight + flowLine.destX * flowLine.weight)
            / newWeight;
        destY = (destY * weight + flowLine.destY * flowLine.weight)
            / newWeight;
        weight = newWeight;
      }

      newFlowLines.push(
          new FlowLine(key, originX, originY, destX, destY, weight)
      );
    }
    return newFlowLines;
  }

  /** @param {FlowLine[]} flowLines */
  private redrawFlowLines(flowLines: FlowLine[]): void {
    let minValue = Number.MAX_VALUE;
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

  private dispatchSelectionUpdated(): void {
    this.emitter.emit('selectionUpdated', {
      geographyType: this.geographyType,
      geographyId: this.geographyId,
      geographyWeight: this.geographyWeight,
      lineId: this.lineId,
      lineWeight: this.lineWeight,
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
