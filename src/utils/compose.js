export default function (middleWares) {
    if (!Array.isArray(middleWares)) {
        throw new Error('入参必须为一个数组')
    }
    if (!middlewares.every(middleWare => typeof middleWare === 'function')) {
        throw new Error('数组元素都要是函数')
    }
    return function (context, next) {
        let index = -1
        function dispatch(i) {
            if (i <= index) return Promise.reject('next() 只能调用一次')
            index = i
            const fn = middleWares[i]
            if (i == middlewares.length) fn = next
            if (!fn) return Promise.resolve()
            try {
                return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
            } catch (err) {
                return Promise.reject(err)
            }
        }
        return dispatch(0)
    }
}