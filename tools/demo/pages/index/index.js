const data = require('./data.js')

const list = data.data

Page({
  data: {
    list,
    option: ''
  },
  onLoad() {
    setTimeout(() => {
      list.splice(0, 1)
      this.setData({
        list
      })
    }, 2000)
  },
  select() {
    this.setData({
      option: 'download'
    })
  },
  finish() {
    this.setData({
      list,
      option: 'normal'
    })
  },
  like(e) {
    console.log(e.detail.img)
  }
})
