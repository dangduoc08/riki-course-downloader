fetch(window.location.origin + '/video/list', {
  method: 'GET',
  cache: 'no-cache',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json'
  },
  redirect: 'follow',
  referrerPolicy: 'no-referrer'
})
  .then(res => res.json())
  .then(datas => {
    const videoAll = document.getElementById('video-all')
    datas.files.forEach(file => {
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