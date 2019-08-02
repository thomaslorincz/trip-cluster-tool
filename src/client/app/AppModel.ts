import Model from '../superclasses/Model';
import * as EventEmitter from 'eventemitter3';
import * as d3 from 'd3-fetch';
import FlowLine from '../lib/FlowLine';
import ODDatum from '../lib/ODDatum';

/** Model that stores and controls the app's data and state. */
export default class AppModel extends Model {
  private selectedLine: string = '';
  private geography: number = -1;
  private lineWeight: number = -1;
  private numFlowLines: number = 15;
  private boundary: string = 'district';
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

      this.dispatchControlsUpdated();
    });
  }

  public geographySelected(id: number, type: string): void {
    this.emitter.emit('removeClusters');
    this.selectedLine = '';
    this.lineWeight = -1;

    if (this.boundary === type && this.geography === id) {
      this.geography = -1;
      this.emitter.emit('removeFlowLines');
    } else {
      this.geography = id;
      this.processData(this.activeData, this.numFlowLines);
    }

    this.emitter.emit('selectedUpdated', this.geography);
    this.dispatchControlsUpdated();
  }

  public lineSelected(lineKey: string, lineWeight: number): void {
    this.emitter.emit('removeClusters');
    if (this.selectedLine === lineKey) {
      this.selectedLine = '';
      this.lineWeight = -1;
      this.splitIntoGroups();
    } else {
      this.selectedLine = lineKey;
      this.lineWeight = lineWeight;
      this.emitter.emit('addClusters', {
        lineKey,
        clusters: this.flowMatrixWithClusters[lineKey],
      });
    }

    this.dispatchControlsUpdated();
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
    this.geography = -1;
    this.boundary = boundary;
    this.emitter.emit('selectedUpdated', this.geography);
    this.dispatchControlsUpdated();
    this.emitter.emit('boundaryUpdated', this.boundary);
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

    if (this.boundary === 'district') {
      this.flowMatrix = dataMatrix.filter((datum: ODDatum): boolean => {
        return datum.destDistrict === this.geography;
      });
    } else if (this.boundary === 'zone') {
      this.flowMatrix = dataMatrix.filter((datum: ODDatum): boolean => {
        return datum.destZone === this.geography;
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
    for (let n = 0; n < 50; n++) {
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

  private dispatchControlsUpdated(): void {
    this.emitter.emit('controlsUpdated', {
      geography: this.geography,
      lineWeight: this.lineWeight,
      numFlowLines: this.numFlowLines,
      boundary: this.boundary,
      mode: this.mode,
    });
  }
}
