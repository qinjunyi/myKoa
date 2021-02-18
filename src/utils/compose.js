/*
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2020-11-19 10:29:40
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-02-18 17:43:12
 */
export default function (middleWares) {
    if (!Array.isArray(middleWares)) {
        throw new Error('入参必须为一个数组')
    }
    if (!middlewares.every((middleWare) => typeof middleWare === 'function')) {
        throw new Error('数组元素都要是函数')
    }
    return function (context, next) {
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
