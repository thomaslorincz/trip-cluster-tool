import Model from '../superclasses/Model';
import totalDataPath from '../../../data/result_total_sort_by_purpose.csv';
import transitDataPath from '../../../data/result_transit_sort_by_purpose.csv';
import * as d3 from 'd3';

/**
 * Model that stores and controls the app's data and state.
 */
export default class AppModel extends Model {
  // eslint-disable-next-line
  constructor() {
    super();

    this.dataLoaded = false;

    this.selected = null;

    this.controlPanel = {
      district: '',
      iteration: 0,
      autoIterate: false,
      clusters: 30,
      dataset: 'total',
      purpose: 'work',
    };

    this.totalDataMatrix = {};
    this.transitDataMatrix = {};

    // Total selected by default
    this.selectedMatrix = this.totalDataMatrix;

    Promise.all([
      d3.csv(totalDataPath),
      d3.csv(transitDataPath),
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

      const uniqueTripTypes = [transitData[0].Purpose_Category];

      let thisTravelType = uniqueTripTypes[0];
      let dataOfThisTravelType = [];
      for (let j = 0; j < transitData.length; j++) {
        if (transitData[j].Purpose_Category !== thisTravelType) {
          this.transitDataMatrix[thisTravelType] = dataOfThisTravelType;
          thisTravelType = transitData[j].Purpose_Category;
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
        if (totalData[j].Purpose_Category !== thisTravelType) {
          this.totalDataMatrix[thisTravelType] = dataOfThisTravelType;
          thisTravelType = totalData[j].Purpose_Category;
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

      console.log(this.transitDataMatrix);
      console.log(this.totalDataMatrix);

      this.dataLoaded = true;
    }).catch((error) => {
      console.log(error);
    });

    this.newCentroid = [];
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
  updateSelected(districtId) {
    this.selected = districtId;
    this.controlPanel.district = districtId.toString();
    document.dispatchEvent(new CustomEvent('selectedUpdated', {
      detail: this.selected,
    }));
    document.dispatchEvent(new CustomEvent('controlsUpdated', {
      detail: this.controlPanel,
    }));
  }

  /**
   * K-means initialization. This is different from traditional K-means.
   * It gives a higher possibility to lines with a higher weight to be chosen as
   * an initial cluster center the algorithm is based on
   * https://medium.com/@peterkellyonline/weighted-random-selection-3ff222917eb6
   */
  processData() {
    // const matrix = this.controlPanel.purpose;
    // const numClusted = this.controlPanel.clusters;

    let totalWeight = 0;
    let transitArray = [];

    if (this.controlPanel.district === 'all') {
      transitArray = this.selectedMatrix[this.controlPanel.purpose];
    } else {
      const purposeArray = this.selectedMatrix[this.controlPanel.purpose];
      for (let i = 0; i < purposeArray.length; i++) {
        if (Number(purposeArray[i][8] === Number(this.controlPanel.district))) {
          transitArray.push(purposeArray[i]);
        }
      }
    }

    for (let i = 0; i < transitArray.length; i++) {
      totalWeight += transitArray[i][4];
    }

    let currentSum = 0;
    const transitArraySums = new Array(transitArray.length);
    for (let i = 0; i < transitArray.length; i++) {
      currentSum += transitArray[i][4];
      transitArraySums[i] = currentSum;
    }

    this.newCentroid = [];
    if (transitArray.length < this.controlPanel.clusters) {
      this.newCentroid = transitArray;
    } else {
      this.newCentroid = new Array(this.controlPanel.clusters);
      for (let i = 0; i < this.newCentroid.length; i++) {
        const randomWeight = Math.floor(Math.random() * totalWeight);
        for (let j = 0; j < transitArray.length; j++) {
          if (transitArraySums[j] >= randomWeight
              && this.newCentroid.indexOf(transitArray[j]) < 0) {
            this.newCentroid[i] = transitArray[j];
            break;
          }
        }
      }

      // Delete falsy elements ('', 0, NaN, null, undefined, false)
      this.newCentroid = this.newCentroid.filter(Boolean);
    }

    if (transitArray.length > 0) {
      result = this.splitIntoGroups();
    }
  }
}
