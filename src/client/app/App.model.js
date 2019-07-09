import Model from '../superclasses/Model';
import * as d3 from 'd3-fetch';
import FlowLine from '../lib/FlowLine';

/** Model that stores and controls the app's data and state. */
export default class AppModel extends Model {
  /** @param {EventEmitter} emitter */
  constructor(emitter) {
    super(emitter);

    this.selectedLine = '';

    this.controlPanel = {
      geography: -1,
      lineWeight: -1,
      iteration: 0,
      autoIterate: false,
      numFlowLines: 15,
      boundary: 'district',
      mode: 'X', // Modes: X for All, A for Auto, T for Transit, V for Active
    };

    this.maxFlowLines = 30;

    this.totalData = [];

    Promise.all([
      d3.csv('assets/data/od_xy.csv'),
    ]).then(([totalData]) => {
      for (let i = 0; i < totalData.length; i++) {
        const totalDatum = totalData[i];

        this.totalData.push({
          originZone: parseInt(totalDatum['origin_zone']),
          destZone: parseInt(totalDatum['dest_zone']),
          originDistrict: parseInt(totalDatum['origin_district']),
          destDistrict: parseInt(totalDatum['dest_district']),
          mode: totalDatum['mode_category'],
          originX: parseFloat(totalDatum['origin_x']),
          originY: parseFloat(totalDatum['origin_y']),
          destX: parseFloat(totalDatum['dest_x']),
          destY: parseFloat(totalDatum['dest_y']),
          weight: parseInt(totalDatum['count']),
        });
      }

      this.activeData = this.totalData.filter((datum) => {
        return this.controlPanel.mode === 'X'
            || datum.mode === this.controlPanel.mode;
      });

      this.emitter.emit('controlsUpdated', this.controlPanel);
    });

    /* @type {FlowLine[]} */
    this.flowLines = [];

    this.flowMatrix = [];

    this.flowMatrixWithClusters = {};

    this.autoIterateInterval = null;
  }

  /**
   * @param {number} id
   * @param {'district'|'zone'} type
   */
  geographySelected(id, type) {
    this.emitter.emit('removeClusters');
    this.selectedLine = '';
    this.controlPanel.lineWeight = -1;

    if (this.controlPanel.boundary === type
        && this.controlPanel.geography === id) {
      this.controlPanel.geography = -1;
      this.controlPanel.iteration = 0;
      this.emitter.emit('removeFlowLines');
    } else {
      this.controlPanel.geography = id;
      this.controlPanel.iteration = 1;
      this.processData(this.activeData, this.controlPanel.numFlowLines);
    }

    this.emitter.emit('selectedUpdated', this.controlPanel.geography);
    this.emitter.emit('controlsUpdated', this.controlPanel);
  }

  /**
   * @param {string} lineKey
   * @param {number} lineWeight
   */
  lineSelected(lineKey, lineWeight) {
    this.emitter.emit('removeClusters');
    if (this.selectedLine === lineKey) {
      this.selectedLine = '';
      this.controlPanel.lineWeight = -1;
      this.splitIntoGroups();
    } else {
      this.selectedLine = lineKey;
      this.controlPanel.lineWeight = lineWeight;
      this.emitter.emit('addClusters', {
        lineKey,
        clusters: this.flowMatrixWithClusters[lineKey],
      });
    }

    this.emitter.emit('controlsUpdated', this.controlPanel);
  }

  /**
   * Runs an iteration of the k-means clustering algorithm.
   */
  nextIteration() {
    this.emitter.emit('removeClusters');
    this.controlPanel.iteration++;
    this.emitter.emit('controlsUpdated', this.controlPanel);
    this.splitIntoGroups();
  }

  /**
   * Continuously runs new iterations while thr auto-iterate toggle switch is
   * toggled on.
   */
  autoIterate() {
    this.emitter.emit('removeClusters');
    this.controlPanel.autoIterate = !this.controlPanel.autoIterate;
    this.emitter.emit('controlsUpdated', this.controlPanel);

    if (this.controlPanel.autoIterate) {
      this.autoIterateInterval = setInterval(() => {
        this.controlPanel.iteration++;
        this.emitter.emit('controlsUpdated', this.controlPanel);
        this.splitIntoGroups();
      }, 100);
    } else {
      clearInterval(this.autoIterateInterval);
    }
  }

  /** Decreases the number of flow lines by 1 */
  decrementFlowLines() {
    this.emitter.emit('removeClusters');
    if (this.controlPanel.numFlowLines > 1) {
      this.controlPanel.numFlowLines--;
      this.controlPanel.iteration = 1;
      this.processData(this.activeData, this.controlPanel.numFlowLines);
      this.emitter.emit('controlsUpdated', this.controlPanel);
    }
  }

  /** Increases the number of flow lines by 1 */
  incrementFlowLines() {
    this.emitter.emit('removeClusters');
    if (this.controlPanel.numFlowLines !== this.maxFlowLines) {
      this.controlPanel.numFlowLines++;
      this.controlPanel.iteration = 1;
      this.processData(this.activeData, this.controlPanel.numFlowLines);
      this.emitter.emit('controlsUpdated', this.controlPanel);
    }
  }

  /** @param {string} boundary */
  updateBoundary(boundary) {
    this.emitter.emit('removeFlowLines');
    this.emitter.emit('removeClusters');
    this.controlPanel.geography = -1;
    this.controlPanel.iteration = 0;
    this.controlPanel.boundary = boundary;
    this.emitter.emit('selectedUpdated', this.controlPanel.geography);
    this.emitter.emit('controlsUpdated', this.controlPanel);
    this.emitter.emit('boundaryUpdated', this.controlPanel.boundary);
  }

  /** @param {string} mode */
  updateMode(mode) {
    this.emitter.emit('removeClusters');
    this.controlPanel.iteration = 0;
    this.controlPanel.mode = mode;
    this.activeData = this.totalData.filter((datum) => {
      return this.controlPanel.mode === 'X'
          || datum.mode === this.controlPanel.mode;
    });
    this.emitter.emit('controlsUpdated', this.controlPanel);
    this.processData(this.activeData, this.controlPanel.numFlowLines);
  }

  /**
   * K-means initialization. This is different from traditional K-means.
   * It gives a higher possibility to lines with a higher weight to be chosen as
   * an initial cluster center.
   * @see https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
   * @param {[]} dataMatrix
   * @param {number} numFlowLines
   */
  processData(dataMatrix, numFlowLines) {
    let totalWeight = 0;
    this.flowMatrix = [];

    if (this.controlPanel.boundary === 'district') {
      this.flowMatrix = dataMatrix.filter((datum) => {
        return datum.destDistrict === this.controlPanel.geography;
      });
    } else if (this.controlPanel.boundary === 'zone') {
      this.flowMatrix = dataMatrix.filter((datum) => {
        return datum.destZone === this.controlPanel.geography;
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
      this.flowLines = this.flowLines.filter((e) => e);
    }

    if (this.flowMatrix.length > 0) {
      this.splitIntoGroups();
    }
  }

  /**
   * Calculate the distance between each line end and each cluster center. Split
   * lines into a number of cluster groups.
   */
  splitIntoGroups() {
    this.flowMatrixWithClusters = {};
    for (let i = 0; i < this.flowLines.length; i++) {
      this.flowMatrixWithClusters[i] = [];
    }

    const result = new Array(this.flowMatrix.length);
    for (let i = 0; i < this.flowMatrix.length; i++) {
      /* @type {FlowLine} */
      const datum = this.flowMatrix[i];
      let group = 0;
      let minDist = Number.POSITIVE_INFINITY;
      for (let j = 0; j < this.flowLines.length; j++) {
        /* @type {FlowLine} */
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
    this.redrawFlowLines(this.flowLines);
  }

  /**
   * @param {{string: FlowLine[]}} flowMatrixWithClusters
   * @return {FlowLine[]}
   */
  static calcNewFlowLines(flowMatrixWithClusters) {
    const newFlowLines = [];
    for (const [key] of Object.entries(flowMatrixWithClusters)) {
      const flowLines = flowMatrixWithClusters[key];
      let weight = 0;
      let destX = 0;
      let destY = 0;
      let originX = 0;
      let originY = 0;
      for (let i = 0; i < flowLines.length; i++) {
        /* @type {FlowLine} */
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
  redrawFlowLines(flowLines) {
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
}
