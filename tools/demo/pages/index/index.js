const data = require('./data.js')

const list = data.data.picDoList.map(item => ({
  src: item.url,
  previewSrc: `${item.url}_1280`,
  listSrc: `${item.url}_200`,
}))


Page({
  data: {
    list,
  }
})
