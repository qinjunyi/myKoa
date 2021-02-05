/*
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2020-11-19 10:29:37
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-02-05 10:54:48
 */
module.exports = {
    get header() {
        return this.request.headers
    },

    set header(val) {
        this.request.headers = val
    },

    get url() {
        return this.request.url
    },

    set url(val) {
        this.request.url = val
    },
}
