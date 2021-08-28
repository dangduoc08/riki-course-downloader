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
    const videoWrapper = document.createElement('div')
    videoWrapper.classList = 'video-wrapper'

    const video = document.createElement('video')
    video.style.width = '350px'
    video.style.height = '280px'
    video.setAttribute('controls', true)
    const source = document.createElement('source')
    source.src = file
    video.appendChild(source)
    videoWrapper.appendChild(video)

    const title = document.createElement('div')
    title.textContent = file.substring(0, file.lastIndexOf('_'))
    title.classList = 'video-title'
    videoWrapper.appendChild(title)

    const aHref = document.createElement('a')
    aHref.href = `${window.location.origin}/down/${file}`
    aHref.target = '__blank'
    aHref.style.color = '#fff'
    aHref.style.textDecoration = 'none'

    const fileElemBtn = document.createElement('button')
    fileElemBtn.setAttribute('type', 'button')
    fileElemBtn.classList = 'btn btn-warning btn-download'
    fileElemBtn.style.marginRight = '16px'
    fileElemBtn.style.marginBottom = '16px'
    fileElemBtn.style.marginBottom = '16px'
    fileElemBtn.innerHTML = `<svg color="black" xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-file-earmark-arrow-down" viewBox="0 0 16 16">
      <path d="M8.5 6.5a.5.5 0 0 0-1 0v3.793L6.354 9.146a.5.5 0 1 0-.708.708l2 2a.5.5 0 0 0 .708 0l2-2a.5.5 0 0 0-.708-.708L8.5 10.293V6.5z"/>
      <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
    </svg><span style="padding-left: 5px; color: black">Tải về</span>`

    aHref.appendChild(fileElemBtn)
    videoWrapper.appendChild(aHref)

    videoAll.appendChild(videoWrapper)
  })
})
