const socket = io()

socket.on("connect", () => {

  socket.on("downloaded", data => {
    const progressBar = document.getElementById(data.videoID)
    const bar = progressBar.children[0].children[0]
    const currentValue = Math.round(data.currentPercent)
    bar.style.width = data.currentPercent + "%"
    bar.textContent = currentValue + "%"
    if (currentValue >= 100) {
      progressBar.remove()
    }
  })

  socket.on("download_finish", ({ file }) => {
    const videoAll = document.getElementById('video-all')
    const aHref = document.createElement('a')
    aHref.href = `${window.location.origin}/down/${file}`
    aHref.target = '__blank'
    aHref.style.color = '#fff'
    aHref.style.textDecoration = 'none'

    const fileElemBtn = document.createElement('button')
    fileElemBtn.setAttribute('type', 'button')
    fileElemBtn.classList = 'btn btn-primary'
    fileElemBtn.style.marginRight = '16px'
    fileElemBtn.style.marginBottom = '16px'
    fileElemBtn.style.marginBottom = '16px'
    fileElemBtn.textContent = file.substring(0, file.lastIndexOf('_')) + file.substring(file.lastIndexOf('.'), file.length)

    aHref.appendChild(fileElemBtn)

    videoAll.appendChild(aHref)
  })
})
