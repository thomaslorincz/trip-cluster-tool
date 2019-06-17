import Model from '../superclasses/Model';
import * as d3 from 'd3-fetch';

/**
 * Model that stores and controls the app's data and state.
 */
export default class AppModel extends Model {
  // eslint-disable-next-line
  constructor() {
    super();

    this.selected = null;

    this.controlPanel = {
      district: '',
      iteration: 0,
      autoIterate: false,
      clusters: 10,
      dataset: 'total',
      purpose: 'W',
    };

    this.totalDataMatrix = {};
    this.transitDataMatrix = {};

    Promise.all([
      d3.csv('data/result_total.csv'),
      d3.csv('data/result_transit.csv'),
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
    }).catch((error) => {
      console.log(error);
    });

    this.newCentroid = [];
    this.result = [];
    this.transitArray = [];

    // Total selected by default
    this.selectedMatrix = this.totalDataMatrix;

    this.autoIterateInterval = null;
  }

  /**
   * @param {object} settings
   * @param {string} settings.district
   * @param {number} settings.iteration
   * @param {boolean} settings.autoIterate
   * @param {number} settings.clusters
   * @param {string} settings.dataset
   * @param {string} settings.purpose
   */
  updateControlPanel(settings) {
    this.controlPanel = {...settings};
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
  }

  /**
   * @param {number} districtId
   */
  geographySelected(districtId) {
    this.selected = districtId;
    this.controlPanel.district = districtId.toString();
    document.dispatchEvent(new CustomEvent('selectedUpdated', {
      detail: this.selected,
    }));

    this.controlPanel.iteration = 1;
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
    this.processData(this.controlPanel.purpose, this.controlPanel.clusters);
  }

  /**
   * Continuously runs new iterations while thr auto-iterate toggle switch is
   * toggled on.
   */
  autoIterate() {
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
   * K-means initialization. This is different from traditional K-means.
   * It gives a higher possibility to lines with a higher weight to be chosen as
   * an initial cluster center. The algorithm is based on
   * https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
   * @param {string} purpose
   * @param {number} numClusters
   */
  processData(purpose, numClusters) {
    let totalWeight = 0;
    this.transitArray = [];

    if (this.controlPanel.district === 'all') {
      this.transitArray = this.selectedMatrix[purpose];
    } else {
      const purposeArray = this.selectedMatrix[purpose];
      for (let i = 0; i < purposeArray.length; i++) {
        if (Number(purposeArray[i][8]) === Number(this.controlPanel.district)) {
          this.transitArray.push(purposeArray[i]);
        }
      }
    }

    for (let i = 0; i < this.transitArray.length; i++) {
      totalWeight += this.transitArray[i][4];
    }

    let currentSum = 0;
    const transitArraySums = new Array(this.transitArray.length);
    for (let i = 0; i < this.transitArray.length; i++) {
      currentSum += this.transitArray[i][4];
      transitArraySums[i] = currentSum;
    }

    this.newCentroid = [];
    if (this.transitArray.length < numClusters) {
      this.newCentroid = this.transitArray;
    } else {
      this.newCentroid = new Array(numClusters);
      for (let i = 0; i < this.newCentroid.length; i++) {
        const randomWeight = Math.floor(Math.random() * totalWeight);
        for (let j = 0; j < this.transitArray.length; j++) {
          if (transitArraySums[j] >= randomWeight
              && this.newCentroid.indexOf(this.transitArray[j]) < 0) {
            this.newCentroid[i] = this.transitArray[j];
            break;
          }
        }
      }

      // Delete falsy elements ('', 0, NaN, null, undefined, false)
      this.newCentroid = this.newCentroid.filter((e) => e);
    }

    if (this.transitArray.length > 0) {
      this.result = this.splitIntoGroups();
    }
  }

  /**
   * Calculate the distance between each line and each cluster center. Split
   * lines into a number of cluster groups cluster groups.
   */
  splitIntoGroups() {
    const transitArrayWithClusters = {};
    for (let i = 0; i < this.newCentroid.length; i++) {
      transitArrayWithClusters[i] = [];
    }

    this.result = new Array(this.transitArray.length);
    for (let i = 0; i < this.transitArray.length; i++) {
      let group = 0;
      let minDist = Number.POSITIVE_INFINITY;
      for (let j = 0; j < this.newCentroid.length; j++) {
        // Euclidean distance
        const currentDist = Math.sqrt(
            Math.pow(this.transitArray[i][0] - this.newCentroid[j][0], 2) +
            Math.pow(this.transitArray[i][1] - this.newCentroid[j][1], 2) +
            Math.pow(this.transitArray[i][2] - this.newCentroid[j][2], 2) +
            Math.pow(this.transitArray[i][3] - this.newCentroid[j][3], 2)
        );

        if (currentDist < minDist) {
          group = j;
          minDist = currentDist;
        }
      }

      this.result[i] = group;
    }

    for (let i = 0; i < this.transitArray.length; i++) {
      transitArrayWithClusters[this.result[i]].push(this.transitArray[i]);
    }
    this.findNewCentroid(transitArrayWithClusters);
    this.redrawClusters(this.newCentroid);
  }

  /**
   * @param {{}} transitArrayWithClusters
   */
  findNewCentroid(transitArrayWithClusters) {
    this.newCentroid = [];
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
      this.newCentroid.push([origX, origY, destX, destY, weight, key]);
    }
  }

  /**
   * @param {[]} centroid
   */
  redrawClusters(centroid) {
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
