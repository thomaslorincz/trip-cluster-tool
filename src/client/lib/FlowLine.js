/**
 * A class that represents a flow line. A flow line shows a trend in
 * transportation from a centroid of a cluster of origins to a centroid of a
 * cluster of destinations.
 * */
export default class FlowLine {
  /**
   * @param {string} key - The ID of the bounding geometry.
   * @param {number} originLon
   * @param {number} originLat
   * @param {number} destLon
   * @param {number} destLat
   * @param {number} weight - The magnitude of the flow line.
   */
  constructor(key, originLon, originLat, destLon, destLat, weight) {
    this.key = key;
    this.originLon = originLon;
    this.originLat = originLat;
    this.destLon = destLon;
    this.destLat = destLat;
    this.weight = weight;
  }
}
