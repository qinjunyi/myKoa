/*
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2020-11-19 10:29:35
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-02-05 11:29:25
 */
const delegate = require('../utils/delegates')

const proto = (module.exports = {
    // context自身的方法
    toJSON() {
        return {
            request: this.request.toJSON(),
            response: this.response.toJSON(),
            app: this.app.toJSON(),
            originalUrl: this.originalUrl,
            req: '<original node req>',
            res: '<original node res>',
            socket: '<original node socket>',
        }
    },
    onerror(err) {
        if (null == err) return

        // delegate
        this.app.emit('error', err, this)
        // 中间件报错捕获
        const { res } = this

        if ('ENOENT' == err.code) {
            err.status = 404
        } else {
            err.status = 500
        }
        this.status = err.status
        res.end(err.message || 'Internal error')
    },
})

// proto.status === proto.response.status
delegate(proto, 'response').access('status').access('body')

// proto.url === proto.request.url
delegate(proto, 'request').access('url').getter('header')
