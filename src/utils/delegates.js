/*
 * @Description:
 * @Version:
 * @Autor: qinjunyi
 * @Date: 2021-02-04 11:04:22
 * @LastEditors: qinjunyi
 * @LastEditTime: 2021-02-19 10:52:11
 */
/**
 * @description 将某个对象的子对象属性代理至该根对象上
 * @param {Object} proto
 * @param {String} target 子对象key值
 */
function Delegates(proto, target) {
  if (!(this instanceof Delegates)) return new Delegates(proto, target)
  this.proto = proto
  this.target = target
  this.methods = []
  this.getters = []
  this.setters = []
  this.fluents = []
}
Delegates.auto = function (proto, targetProto, targetName) {
  const delegate = Delegates(proto, targetName)
  const properties = Object.getOwnPropertyNames(targetProto)
  properties.forEach((property) => {
    const descriptor = Object.getOwnPropertyDescriptors(targetProto, property)
    if (descriptor.set) {
      delegate.setter(property)
    }
    if (descriptor.get) {
      delegate.getter(property)
    }
    if (descriptor.hasProperty('value')) {
      const val = descriptor.value
      if (typeof val === 'function') {
        delegate.method(property)
      } else {
        delegate.getter(property)
      }
    }
  })
}

Delegates.prototype.method = function (fnName) {
  const target = this.target
  const proto = this.proto
  this.methods.push(fnName)
  proto[fnName] = function () {
    return this[target][fnName].apply(this[target], arguments)
  }
  return this
}
// delegates 原理就是__defineGetter__和__defineSetter__

// method是委托方法，getter委托getter,access委托getter和setter。
Delegates.prototype.setter = function (key) {
  var proto = this.proto
  var target = this.target
  this.setters.push(key)
  //当属性的值被赋值时，所绑定的函数就会被调用，在真正拥有该属性的对象中给该属性进行赋值。
  proto.__defineSetter__(key, function (val) {
    return (this[target][key] = val)
  })

  return this
}
Delegates.prototype.getter = function (key) {
  var proto = this.proto
  var target = this.target
  this.setters.push(key)
  //当属性的值被读取时，所绑定的函数就会被调用，将target上指定的属性添加到proto对象上。
  proto.__defineGetter__(key, function () {
    return this[target][key]
  })

  return this
}
Delegates.prototype.access = function (key) {
  return this.getter(key).setter(key)
}
//类似于jquery的val()取值和val(xxx)设置值有相同的味道，有则get没有则set。
Delegates.prototype.fluents = function (key) {
  var proto = this.proto
  var target = this.target
  this.fluents.push(key)
  proto[key] = function (val) {
    if (typeof val !== 'undefined') {
      return (this[target][key] = val)
    } else {
      return this[target][key]
    }
  }
  return this
}
module.exports = Delegates
