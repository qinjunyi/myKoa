/*
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2020-11-19 10:29:37
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-02-05 11:19:51
 */
module.exports = {
  get header() {
    return this.req.headers
  },

  set header(val) {
    this.req.headers = val
  },

  get url() {
    return this.req.url
  },

  set url(val) {
    this.req.url = val
  }
}
