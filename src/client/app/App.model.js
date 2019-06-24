import Model from '../superclasses/Model';
import * as d3 from 'd3-fetch';
import FlowLine from '../lib/FlowLine';

/**
 * Model that stores and controls the app's data and state.
 */
export default class AppModel extends Model {
  // eslint-disable-next-line
  constructor() {
    super();

    this.controlPanel = {
      district: -1,
      iteration: 0,
      autoIterate: false,
      numFlowLines: 10,
      boundary: 'district',
      mode: 'total',
      purpose: 'W',
    };

    this.maxFlowLines = 30;

    this.totalDataMatrix = {};
    this.transitDataMatrix = {};

    Promise.all([
      d3.csv('assets/data/result_total.csv'),
      d3.csv('assets/data/result_transit.csv'),
    ]).then(([totalData, transitData]) => {
      for (let i = 0; i < transitData.length; i++) {
        const transitDatum = transitData[i];
        if (!(transitDatum['purpose'] in this.transitDataMatrix)) {
          this.transitDataMatrix[transitDatum['purpose']] = [];
        }

        this.transitDataMatrix[transitDatum['purpose']].push({
          originX: parseFloat(transitDatum['origin_x']),
          originY: parseFloat(transitDatum['origin_y']),
          destX: parseFloat(transitDatum['dest_x']),
          destY: parseFloat(transitDatum['dest_y']),
          weight: parseInt(transitDatum['weight']),
          originZone: parseInt(transitDatum['origin_zone']),
          destZone: parseInt(transitDatum['dest_zone']),
          originDistrict: parseInt(transitDatum['origin_district']),
          destDistrict: parseInt(transitDatum['dest_district']),
        });
      }

      for (let i = 0; i < totalData.length; i++) {
        const totalDatum = totalData[i];
        if (!(totalDatum['purpose'] in this.totalDataMatrix)) {
          this.totalDataMatrix[totalDatum['purpose']] = [];
        }

        this.totalDataMatrix[totalDatum['purpose']].push({
          originX: parseFloat(totalDatum['origin_x']),
          originY: parseFloat(totalDatum['origin_y']),
          destX: parseFloat(totalDatum['dest_x']),
          destY: parseFloat(totalDatum['dest_y']),
          weight: parseInt(totalDatum['weight']),
          originZone: parseInt(totalDatum['origin_zone']),
          destZone: parseInt(totalDatum['dest_zone']),
          originDistrict: parseInt(totalDatum['origin_district']),
          destDistrict: parseInt(totalDatum['dest_district']),
        });
      }

      document.dispatchEvent(new CustomEvent('controlsUpdated', {
        detail: this.controlPanel,
      }));
    });

    /** @type {FlowLine[]} */
    this.flowLines = [];

    this.flowMatrix = [];

    this.flowMatrixWithClusters = {};

    this.autoIterateInterval = null;
  }

  /**
   * @param {number} districtId
   */
  geographySelected(districtId) {
    document.dispatchEvent(new CustomEvent('removeClusters'));
    if (this.controlPanel.district === districtId) {
      this.controlPanel.district = -1;
      this.controlPanel.iteration = 0;
      document.dispatchEvent(new CustomEvent('removeFlowLines'));
    } else {
      this.controlPanel.district = districtId;
      this.controlPanel.iteration = 1;
      if (this.controlPanel.mode === 'total') {
        this.processData(
            this.totalDataMatrix,
            this.controlPanel.purpose,
            this.controlPanel.numFlowLines
        );
      } else {
        this.processData(
            this.transitDataMatrix,
            this.controlPanel.purpose,
            this.controlPanel.numFlowLines
        );
      }
    }

    document.dispatchEvent(new CustomEvent('selectedUpdated', {
      detail: this.controlPanel.district,
    }));
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
  }

  /**
   * @param {string} lineKey
   */
  lineSelected(lineKey) {
    document.dispatchEvent(new CustomEvent('removeClusters'));
    document.dispatchEvent(new CustomEvent('addClusters', {
      detail: this.flowMatrixWithClusters[lineKey],
    }));
  }

  /**
   * Runs an iteration of the k-means clustering algorithm.
   */
  nextIteration() {
    this.controlPanel.iteration++;
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
    this.splitIntoGroups();
  }

  /**
   * Continuously runs new iterations while thr auto-iterate toggle switch is
   * toggled on.
   */
  autoIterate() {
    this.controlPanel.autoIterate = !this.controlPanel.autoIterate;
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));

    if (this.controlPanel.autoIterate) {
      this.autoIterateInterval = setInterval(() => {
        this.controlPanel.iteration++;
        document.dispatchEvent(new CustomEvent('controlsUpdated', {
          detail: this.controlPanel,
        }));
        this.splitIntoGroups();
      }, 100);
    } else {
      clearInterval(this.autoIterateInterval);
    }
  }

  /**
   * Decreases the number of flow lines by 1
   */
  decrementFlowLines() {
    if (this.controlPanel.numFlowLines > 1) {
      this.controlPanel.numFlowLines--;
      this.controlPanel.iteration = 1;
      if (this.controlPanel.mode === 'total') {
        this.processData(
            this.totalDataMatrix,
            this.controlPanel.purpose,
            this.controlPanel.numFlowLines
        );
      } else {
        this.processData(
            this.transitDataMatrix,
            this.controlPanel.purpose,
            this.controlPanel.numFlowLines
        );
      }
      document.dispatchEvent(new CustomEvent('controlsUpdated', {
        detail: this.controlPanel,
      }));
    }
  }

  /**
   * Increases the number of flow lines by 1
   */
  incrementFlowLines() {
    if (this.controlPanel.numFlowLines !== this.maxFlowLines) {
      this.controlPanel.numFlowLines++;
      this.controlPanel.iteration = 1;
      if (this.controlPanel.mode === 'total') {
        this.processData(
            this.totalDataMatrix,
            this.controlPanel.purpose,
            this.controlPanel.numFlowLines
        );
      } else {
        this.processData(
            this.transitDataMatrix,
            this.controlPanel.purpose,
            this.controlPanel.numFlowLines
        );
      }
      document.dispatchEvent(new CustomEvent('controlsUpdated', {
        detail: this.controlPanel,
      }));
    }
  }

  /**
   * @param {string} boundary
   */
  updateBoundary(boundary) {
    this.controlPanel.district = -1;
    this.controlPanel.iteration = 0;
    this.controlPanel.boundary = boundary;
    document.dispatchEvent(new CustomEvent('selectedUpdated', {
      detail: this.controlPanel.district,
    }));
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
  }

  /**
   * @param {string} mode
   */
  updateMode(mode) {
    this.controlPanel.iteration = 0;
    this.controlPanel.mode = mode;
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
    if (this.controlPanel.mode === 'total') {
      this.processData(
          this.totalDataMatrix,
          this.controlPanel.purpose,
          this.controlPanel.numFlowLines
      );
    } else {
      this.processData(
          this.transitDataMatrix,
          this.controlPanel.purpose,
          this.controlPanel.numFlowLines
      );
    }
  }

  /**
   * @param {string} purpose
   */
  updatePurpose(purpose) {
    this.controlPanel.iteration = 0;
    this.controlPanel.purpose = purpose;
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
    if (this.controlPanel.mode === 'total') {
      this.processData(
          this.totalDataMatrix,
          this.controlPanel.purpose,
          this.controlPanel.numFlowLines
      );
    } else {
      this.processData(
          this.transitDataMatrix,
          this.controlPanel.purpose,
          this.controlPanel.numFlowLines
      );
    }
  }

  /**
   * K-means initialization. This is different from traditional K-means.
   * It gives a higher possibility to lines with a higher weight to be chosen as
   * an initial cluster center.
   * @see https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
   * @param {[]} dataMatrix
   * @param {string} purpose
   * @param {number} numFlowLines
   */
  processData(dataMatrix, purpose, numFlowLines) {
    let totalWeight = 0;
    this.flowMatrix = [];

    const purposeArray = dataMatrix[purpose];
    for (let i = 0; i < purposeArray.length; i++) {
      if (purposeArray[i].destDistrict === this.controlPanel.district) {
        this.flowMatrix.push(purposeArray[i]);
      }
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
      /** @type {FlowLine} */
      const datum = this.flowMatrix[i];
      let group = 0;
      let minDist = Number.POSITIVE_INFINITY;
      for (let j = 0; j < this.flowLines.length; j++) {
        /** @type {FlowLine} */
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
    AppModel.redrawFlowLines(this.flowLines);
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
        /** @type {FlowLine} */
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

  /**
   * @param {FlowLine[]} flowLines
   */
  static redrawFlowLines(flowLines) {
    let minValue = Number.MAX_VALUE;
    let maxValue = 0;
    for (let i = 0; i < flowLines.length; i++) {
      maxValue = Math.max(flowLines[i].weight, maxValue);
      minValue = Math.min(flowLines[i].weight, minValue);
    }

    document.dispatchEvent(new CustomEvent('removeFlowLines'));
    document.dispatchEvent(new CustomEvent('addFlowLines', {
      detail: {
        lines: flowLines,
        min: minValue,
        max: maxValue,
      },
    }));
  }
}
