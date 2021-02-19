/*
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2020-11-19 10:29:36
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-02-05 10:55:09
 */
module.exports = {
  get status() {
    return this.res.statusCode
  },

  set status(code) {
    this.res.statusCode = code
  },

  get body() {
    return this._body
  },

  set body(val) {
    // 源码里有对val类型的各种判断，这里省略
    /* 可能的类型
      1. string
      2. Buffer
      3. Stream
      4. Object
      */
    this._body = val
  }
}
