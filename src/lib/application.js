import Emmiter from 'events'
import request from "./request";
import response from "./response";
import context from "./context";
import http from "http";
import compose from "../utils/compose";
import Stream from 'stream'

export default class myKoa extends Emmiter {
    constructor(options = {}) {
        super()
        this.middleWare = []
        this.request = Object.create(request)
        this.response = Object.create(response)
        this.context = Object.create(context)
    }

    listen(...args) {
        return http.createServer(this.callback()).listen(...args)
    }

    use(fn) {
        if (typeof fn !== 'function') throw new Error('中间件必须为函数类型')
        this.middleWare.push(fn)
        return this
    }

    callback() {
        // 订阅请求响应过程中抛出的异常
        this.on('error', this.onError)
        //合成中间件
        const fn = compose(this.middleWare)
        handleRequest = (req, res) => {
            const ctx = this.createContext(req, res)
            return this.handleRequest(ctx, fn)
        }
        return handleRequest
    }

    createContext(req, res) {
        const context = Object.create(this.context)
        context.request = Object.create(this.request)
        context.response = Object.create(this.response)
        context.app = context.request.app = context.response.app = this
        context.req = context.request.req = context.response.req = req
        context.res = context.request.res = context.response.res = res
        context.request.response = context.response
        context.response.request = context.request
        return context
    }

    handleRequest(ctx, fn) {
        //源码中对body检验更加详细，此处只做了简单校验
        finalHandle = () => {
            if (ctx.body === null) {
                return ctx.res.end('Not Found')
            } else if (typeof ctx.body === 'string' || typeof ctx.body === 'object') {
                return ctx.res.end(ctx.body)
            } else if (ctx.body instanceof Stream) {
                return body.pipe(res);
            } else {
                return ctx.res.end(JSON.stringify(ctx.body))
            }
        }
        return fn(ctx)
            .then(finalHandle)
            .catch((err) => {
                this.onError(Err)
            })
    }

    onError(err) {
        const msg = err.stack || err.toString()
        console.error('发生错误:' + msg)
    }
}