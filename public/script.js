function createProgressBar(data) {
  const percent = document.getElementById('percent')
  const currentValue = Math.round(data.currentPercent)

  const elem1 = document.createElement('div')
  elem1.id = data.videoID
  elem1.style.paddingBottom = '16px'

  const elem2 = document.createElement('div')
  elem2.classList = "progress"


  const elem3 = document.createElement('div')
  elem3.classList = "progress-bar"
  elem3.style.width = currentValue + "%"
  elem3.textContent = currentValue + "%"
  elem3.setAttribute("role", "progressbar")
  elem3.setAttribute("aria-valuenow", currentValue)
  elem3.setAttribute("aria-valuemax", 100)

  const elem4 = document.createElement('div')
  elem4.textContent = data.courseName

  elem2.appendChild(elem3)

  elem1.appendChild(elem2)
  elem1.appendChild(elem4)

  // sample: 
  //   percent.innerHTML = `
  //   <div id="${data.videoID}">
  //     <div class="progress">
  //       <div class="progress-bar" role="progressbar" style="width: ${currentValue}%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
  //       ${currentValue}%
  //       </div>
  //     </div>
  //     <div>${data.courseName}</div>
  // </div>`

  percent.appendChild(elem1)
}

const button = document.getElementById('download-btn')
button.onclick = async function (event) {
  event.preventDefault()
  const urlElem = document.getElementById('url')
  const courseNameElem = document.getElementById('course_name')
  const api = window.location.origin + '/downloads'

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
    .then(res => res.json())
    .then(data => {
      createProgressBar(data)
    })

  urlElem.value = ''
  courseNameElem.value = ''
}