/*
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2021-02-04 15:25:56
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-02-04 15:33:55
 */
const delegates = require('../utils/delegates')

const origin = {
    a: 1,
    b: 2,
    c: {
        d: 3,
        e: 4,
        fn: function () {
            console.log(this.a)
        },
    },
}
const extra = {
    f: 5,
    g: 6,
    fn1: function () {
        console.log(this.a)
    },
}
delegates(origin, 'c').method('fn')
console.log(origin.fn)
