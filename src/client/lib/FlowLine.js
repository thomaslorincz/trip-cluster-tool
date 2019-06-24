/**
 * A class that represents a flow line. A flow line shows a trend in
 * transportation from a centroid of a cluster of origins to a centroid of a
 * cluster of destinations.
 * */
export default class FlowLine {
  /**
   * @param {string} key - The ID of the bounding geometry.
   * @param {number} originX
   * @param {number} originY
   * @param {number} destX
   * @param {number} destY
   * @param {number} weight - The magnitude of the flow line.
   */
  constructor(key, originX, originY, destX, destY, weight) {
    this.key = key;
    this.originX = originX;
    this.originY = originY;
    this.destX = destX;
    this.destY = destY;
    this.weight = weight;
  }
}
