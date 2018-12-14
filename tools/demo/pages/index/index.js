const data = require('./data.js')

const list = data.data

Page({
  data: {
    list,
    option: ''
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
  }
})
