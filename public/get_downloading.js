const api = window.location.origin + '/download/list'
fetch(api, {
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
    datas.downloading.forEach(data => createProgressBar(data))
  })