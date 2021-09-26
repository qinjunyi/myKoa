<!--
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2021-02-18 11:03:03
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-02-18 17:44:07
-->

# myKoa

随着大前端的兴起，作为一名前端 coder，工作之余学习了解一些后端知识体系是有一定必要的。项目组中部分项目为了不完全受控于后端，在一些纯前端项目中嵌入了隶属于前端的服务，用来实现性能监控、日志记录等非业务性的功能，而其中就利用了 koa 作为载体去实现。koa 的源码特别精简，总计不超过 2k 行代码，代码目录结构也特别清楚，核心代码主要分为 application、context、request、response 四个模块。

参考代码：[koa](https://github.com/koajs/koa)

仿写一个 koa，首先得理解原作者的实现思路，通过源码分析，不难得出实现 koa 主要分为以下几个模块：

-   封装 http server 服务
-   封装 request、response、context 对象
-   实现中间件调用机制
-   异常捕获

---

## <a id="1">封装 http server 服务</a>

原生 node 实现 server 服务器的代码：

```js
const http = require('http')

const server = http.createServer((req, res) => {
    res.writeHead(200)
    res.end('hello world')
})

server.listen(3000, () => {
    console.log('server start at 3000')
})
```

利用 http 模块便很容易就实现了一个服务器。

再对比看下 koa 实现一个服务器：

```js
const Koa = require('koa')
const app = new Koa()

app.use(async (ctx, next) => {
    console.log('1')
    await next()
    console.log('2')
})

app.use(async (ctx, next) => {
    console.log('3')
    ctx.status = 200
    ctx.body = 'Hello World'
    console.log('4')
})

app.listen(3000)

// 最后输出内容：
// 1
// 3
// 4
// 2
```

对比两者，主要有两个不同点:  
1.创建服务的回调函数的表现形式  
2.回调函数的参数

相对于原生 node 创建服务，koa 采用中间件的机制完成一次 http 请求的处理，并且使用 async/await 的语法糖使异步流程更易受控。在 koa 创建服务后的回调函数中使用 ctx 代理了原生中的 req、res 对象，这样做的目的可以使开发者避免解除太多底层的对象，可以通过代理访问以及设置属性。  
仿照源码实现 koa 封装 http server 是在 application.js 中，核心流程为`创建服务=>注册回调=>监听端口=>代理请求、响应对象到ctx`。这一流程并不是一个从前到后的同步过程，此处只是用了同步的一个展示方式列出来。

---

## 封装 request、response、context 对象

request 和 response 对象的封装本质是利用 es6 的 get 和 set 对原生的 this.req 和 this.res 进行了一层封装。context 对象的核心则是代理 request 和 response。

context 源码中代理 request 和 response 用到了 delegate 的概念，这个模块的源码也比较易懂，功能是将某个对象的子对象属性代理至该对象上，核心是利用`Object.__defineGetter__(),Object.__defineSetter__`动态设置属性，源码可参考[delegate](https://github.com/qinjunyi/myKoa/blob/master/src/utils/delegates.js)

此处需要注意的是 context 真正注入是在 application.js 中的 createContext 中进行的。该函数执行时机是在创建服务后的回调中执行。其用意很明确，就是代理。利用`Object.create()`去创建对象，是通过原型链继承原有属性，避免污染原有对象。

```js
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
```

---

## 实现中间件调用机制

koa 的精髓个人觉得就体现在其中间件的实现机制。核心涉及到一个`compose`到概念，字面意思为组合。koa 会将所有中间件函数通过`compose`模块组合然后按照一定的规则执行中间件。什么规则呢？可参照[第一部分](#1)中 koa 的示例 demo，就是从 A 中间件执行到 B 中间件，B 中间件执行完成以后，仍然可以再次回到 A 中间件。这其实就是洋葱模型的一种实践。

compose 源码也是非常精简，但很巧妙地利用了高阶、递归以及 Promise

```js
function myCompose(middleWares) {
    if (!Array.isArray(middleWares)) {
        throw new Error('入参必须为一个数组')
    }
    if (!middlewares.every((middleWare) => typeof middleWare === 'function')) {
        throw new Error('数组元素都要是函数')
    }
    return function (context, next) {
      let index = -1
        function dispatch(i) {
            // 一个中间件里多次调用next，抛异常
            if (i <= index) return Promise.reject('next() 只能调用一次')
            index = i
            // fn为当前中间件
            const fn = middleWares[i]
            if (i == middlewares.length) fn = next
            if (!fn) return Promise.resolve() // 没有中间件，直接返回成功
            /**
             * 将中间件返回的结果Promise化
             * dispatch.bind(null, i + 1)就是中间件函数参数中的next，调用它就可以进入下一个中间件
             * 而因为每个中间件返回都被Promise化了，所以可以通过async/await语法糖方便地控制执行顺序
             * 也就是说第i个中间件执行时若执行了next()即执行了dispatch.bind(null, i + 1)，并通过await阻断了next()后续的逻辑
             * 那么就会等待第i+1个中间件执行完后再执行第i个中间件中next()后续的逻辑，多个中间件执行机制也就以此类推
             */
            try {
                return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
            } catch (err) {
                // 中间件是async的函数，报错不会走这里，直接在fnMiddleware的catch中捕获
                // 捕获中间件是普通函数时的报错
                return Promise.reject(err)
            }
        }
        return dispatch(0)
    }
}
```

---

## 异常捕获

源码中异常捕获主要表现在两个地方：  
1.中间件异常捕获  
2.框架异常捕获

前者因为中间件通过`compose`组合函数返回的是`Promise`对象，因此可以通过`catch`捕获对应异常，具体可参考`application.js`中的`handleRequest()`

后者因为是框架层面的异常捕获，可以让`Application`继承原生的`Emitter`，从而实现`error`监听，具体可参考`context.js`中的`onerror()`
