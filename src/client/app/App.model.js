import Model from '../superclasses/Model';
import * as d3 from 'd3-fetch';

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
      flowLines: 10,
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
      const csvHeaders = {
        origin_zone: 'OriginZoneTAZ1669EETP',
        origin_district: 'OriginZoneDistrictTAZ1669EETP',
        origin_x: 'Origin_XCoord',
        origin_y: 'Origin_YCoord',
        dest_zone: 'DestZoneTAZ1669EETP',
        dest_district: 'DestZoneDistrictTAZ1669EETP',
        dest_x: 'Dest_XCoord',
        dest_y: 'Dest_YCoord',
        weight: 'Total',
      };

      const uniqueTripTypes = [transitData[0]['Purpose_Category']];

      let thisTravelType = uniqueTripTypes[0];
      let dataOfThisTravelType = [];
      for (let j = 0; j < transitData.length; j++) {
        if (transitData[j]['Purpose_Category'] !== thisTravelType) {
          this.transitDataMatrix[thisTravelType] = dataOfThisTravelType;
          thisTravelType = transitData[j]['Purpose_Category'];
          uniqueTripTypes.push(thisTravelType);
          dataOfThisTravelType = [];
        }
        const thisDataArray = [
          Number(transitData[j][csvHeaders.origin_x]),
          Number(transitData[j][csvHeaders.origin_y]),
          Number(transitData[j][csvHeaders.dest_x]),
          Number(transitData[j][csvHeaders.dest_y]),
          Number(transitData[j][csvHeaders.weight]),
          transitData[j][csvHeaders.origin_zone],
          transitData[j][csvHeaders.dest_zone],
          transitData[j][csvHeaders.origin_district],
          transitData[j][csvHeaders.dest_district],
        ];
        dataOfThisTravelType.push(thisDataArray);
      }
      this.transitDataMatrix[thisTravelType] = dataOfThisTravelType;

      thisTravelType = uniqueTripTypes[0];
      dataOfThisTravelType = [];
      for (let j = 0; j < totalData.length; j++) {
        if (totalData[j]['Purpose_Category'] !== thisTravelType) {
          this.totalDataMatrix[thisTravelType] = dataOfThisTravelType;
          thisTravelType = totalData[j]['Purpose_Category'];
          dataOfThisTravelType = [];
        }
        const thisDataArray = [
          Number(totalData[j][csvHeaders.origin_x]),
          Number(totalData[j][csvHeaders.origin_y]),
          Number(totalData[j][csvHeaders.dest_x]),
          Number(totalData[j][csvHeaders.dest_y]),
          Number(totalData[j][csvHeaders.weight]),
          totalData[j][csvHeaders.origin_zone],
          totalData[j][csvHeaders.dest_zone],
          totalData[j][csvHeaders.origin_district],
          totalData[j][csvHeaders.dest_district],
        ];
        dataOfThisTravelType.push(thisDataArray);
      }
      this.totalDataMatrix[thisTravelType] = dataOfThisTravelType;

      document.dispatchEvent(new CustomEvent('controlsUpdated', {
        detail: this.controlPanel,
      }));
    }).catch((error) => {
      console.log(error);
    });

    this.centroid = [];
    this.transitMatrix = [];

    // Total selected by default
    this.selectedMatrix = this.totalDataMatrix;

    this.autoIterateInterval = null;
  }

  /**
   * @param {number} districtId
   */
  geographySelected(districtId) {
    if (this.controlPanel.district === districtId) {
      this.controlPanel.district = -1;
      this.controlPanel.iteration = 0;
      document.dispatchEvent(new CustomEvent('removeFlowLines'));
    } else {
      this.controlPanel.district = districtId;
      this.controlPanel.iteration = 1;
      this.processData(this.controlPanel.purpose, this.controlPanel.flowLines);
    }

    document.dispatchEvent(new CustomEvent('selectedUpdated', {
      detail: this.controlPanel.district,
    }));
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
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
    if (this.controlPanel.flowLines > 1) {
      this.controlPanel.flowLines--;
      this.controlPanel.iteration = 1;
      this.processData(this.controlPanel.purpose, this.controlPanel.flowLines);
      document.dispatchEvent(new CustomEvent('controlsUpdated', {
        detail: this.controlPanel,
      }));
    }
  }

  /**
   * Increases the number of flow lines by 1
   */
  incrementFlowLines() {
    if (this.controlPanel.flowLines !== this.maxFlowLines) {
      this.controlPanel.flowLines++;
      this.controlPanel.iteration = 1;
      this.processData(this.controlPanel.purpose, this.controlPanel.flowLines);
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
    this.processData(
        this.controlPanel.purpose,
        this.controlPanel.flowLines
    );
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
    this.processData(
        this.controlPanel.purpose,
        this.controlPanel.flowLines
    );
  }

  /**
   * K-means initialization. This is different from traditional K-means.
   * It gives a higher possibility to lines with a higher weight to be chosen as
   * an initial cluster center. The algorithm is based on
   * https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
   * @param {string} purpose
   * @param {number} numClusters
   */
  processData(purpose, numClusters) {
    let totalWeight = 0;
    this.transitMatrix = [];

    const purposeArray = this.selectedMatrix[purpose];
    for (let i = 0; i < purposeArray.length; i++) {
      if (Number(purposeArray[i][8]) === this.controlPanel.district) {
        this.transitMatrix.push(purposeArray[i]);
      }
    }

    for (let i = 0; i < this.transitMatrix.length; i++) {
      totalWeight += this.transitMatrix[i][4];
    }

    let currentSum = 0;
    const transitArraySums = new Array(this.transitMatrix.length);
    for (let i = 0; i < this.transitMatrix.length; i++) {
      currentSum += this.transitMatrix[i][4];
      transitArraySums[i] = currentSum;
    }

    this.centroid = [];
    if (this.transitMatrix.length < numClusters) {
      this.centroid = this.transitMatrix;
    } else {
      this.centroid = new Array(numClusters);
      for (let i = 0; i < this.centroid.length; i++) {
        const randomWeight = Math.floor(Math.random() * totalWeight);
        for (let j = 0; j < this.transitMatrix.length; j++) {
          if (transitArraySums[j] >= randomWeight
              && this.centroid.indexOf(this.transitMatrix[j]) < 0) {
            this.centroid[i] = this.transitMatrix[j];
            break;
          }
        }
      }

      // Delete falsy elements ('', 0, NaN, null, undefined, false)
      this.centroid = this.centroid.filter((e) => e);
    }

    if (this.transitMatrix.length > 0) {
      this.splitIntoGroups();
    }
  }

  /**
   * Calculate the distance between each line and each cluster center. Split
   * lines into a number of cluster groups.
   */
  splitIntoGroups() {
    const transitArrayWithClusters = {};
    for (let i = 0; i < this.centroid.length; i++) {
      transitArrayWithClusters[i] = [];
    }

    const result = new Array(this.transitMatrix.length);
    for (let i = 0; i < this.transitMatrix.length; i++) {
      let group = 0;
      let minDist = Number.POSITIVE_INFINITY;
      for (let j = 0; j < this.centroid.length; j++) {
        // Euclidean distance
        const currentDist = Math.sqrt(
            Math.pow(this.transitMatrix[i][0] - this.centroid[j][0], 2) +
            Math.pow(this.transitMatrix[i][1] - this.centroid[j][1], 2) +
            Math.pow(this.transitMatrix[i][2] - this.centroid[j][2], 2) +
            Math.pow(this.transitMatrix[i][3] - this.centroid[j][3], 2)
        );

        if (currentDist < minDist) {
          group = j;
          minDist = currentDist;
        }
      }

      result[i] = group;
    }

    for (let i = 0; i < this.transitMatrix.length; i++) {
      transitArrayWithClusters[result[i]].push(this.transitMatrix[i]);
    }
    this.centroid = AppModel.findNewCentroid(transitArrayWithClusters);
    AppModel.redrawFlowLines(this.centroid);
  }

  /**
   * @param {{}} transitArrayWithClusters
   * @return {[]}
   */
  static findNewCentroid(transitArrayWithClusters) {
    const newCentroid = [];
    for (const [key] of Object.entries(transitArrayWithClusters)) {
      let weight = 0;
      let destX = 0;
      let destY = 0;
      let origX = 0;
      let origY = 0;
      const groupMember = transitArrayWithClusters[key];
      for (let n = 0; n < groupMember.length; n++) {
        if (groupMember[n][4] !== 0) {
          const oldWeight = groupMember[n][4];
          const newWeight = weight + oldWeight;
          origX = (origX * weight + groupMember[n][0] * oldWeight) / newWeight;
          origY = (origY * weight + groupMember[n][1] * oldWeight) / newWeight;
          destX = (destX * weight + groupMember[n][2] * oldWeight) / newWeight;
          destY = (destY * weight + groupMember[n][3] * oldWeight) / newWeight;
          weight = newWeight;
        }
      }
      newCentroid.push([origX, origY, destX, destY, weight, key]);
    }
    return newCentroid;
  }

  /**
   * @param {[]} centroid
   */
  static redrawFlowLines(centroid) {
    let minValue = Number.MAX_VALUE;
    let maxValue = 0;
    for (let i = 0; i < centroid.length; i++) {
      maxValue = Math.max(centroid[i][4], maxValue);
      minValue = Math.min(centroid[i][4], minValue);
    }

    document.dispatchEvent(new CustomEvent('removeFlowLines'));
    for (let j = 0; j < centroid.length; j++) {
      document.dispatchEvent(new CustomEvent('addFlowLine', {
        detail: {
          line: centroid[j],
          min: minValue,
          max: maxValue,
        },
      }));
    }
  }
}
