const button = document.getElementById('download-btn')
button.onclick = async function (event) {
  event.preventDefault()
  const urlElem = document.getElementById('url')
  const courseNameElem = document.getElementById('course_name')
  const api = localStorage.getItem('api') + '/downloads'

  await fetch(api, {
    method: 'POST',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify({
      url: urlElem.value,
      course_name: courseNameElem.value
    })
  })

  urlElem.value = ''
  courseNameElem.value = ''

  alert('Success')
}