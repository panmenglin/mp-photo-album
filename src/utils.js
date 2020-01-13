

// rpx 换算
function transformRpx(rpx) {
  const systemInfo = wx.getSystemInfoSync()
  const px = rpx / 750 * systemInfo.windowWidth
  return px
}

// 防抖
function debounce(method, time) {
  let timer = null
  return function () {
    const context = this
    clearTimeout(timer)
    timer = setTimeout(function () {
      method.call(context)
    }, time)
  }
}

// 节流
function throttle(func, delay) {
  let prev = Date.now()
  return function (...args) {
    const context = this
    const now = Date.now()
    if (now - prev >= delay) {
      func.apply(context, ...args)
      prev = Date.now()
    }
  }
}

function sum(arr) {
  return arr.reduce(function (prev, cur) {
    return prev + cur
  }, 0)
}

function defineReactive(data, key, val, fn) {
  Object.defineProperty(data, key, {
    configurable: true,
    enumerable: true,
    get() {
      return val
    },
    set(newVal) {
      if (newVal === val) return
      if (fn) {
        fn(newVal)
      }
      val = newVal
    },
  })
}

function watch(ctx, obj) {
  Object.keys(obj).forEach(key => {
    defineReactive(ctx.properties, key, ctx.properties[key], (value) => {
      obj[key].call(ctx, value)
    })
  })
}

module.exports = {
  transformRpx,
  debounce,
  throttle,
  sum,
  watch
}
