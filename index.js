const fs = require('fs')
const EventEmitter = require('events')
const ChildProcess = require('child_process')
const http = require('http')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const axios = require('axios')
const { v4 } = require('uuid')
const CronJob = require('cron').CronJob

function nonAccentVietnamese(str) {
  str = str.toLowerCase()
  //     We can also use this instead of from line 11 to line 17
  //     str = str.replace(/\u00E0|\u00E1|\u1EA1|\u1EA3|\u00E3|\u00E2|\u1EA7|\u1EA5|\u1EAD|\u1EA9|\u1EAB|\u0103|\u1EB1|\u1EAF|\u1EB7|\u1EB3|\u1EB5/g, "a")
  //     str = str.replace(/\u00E8|\u00E9|\u1EB9|\u1EBB|\u1EBD|\u00EA|\u1EC1|\u1EBF|\u1EC7|\u1EC3|\u1EC5/g, "e")
  //     str = str.replace(/\u00EC|\u00ED|\u1ECB|\u1EC9|\u0129/g, "i")
  //     str = str.replace(/\u00F2|\u00F3|\u1ECD|\u1ECF|\u00F5|\u00F4|\u1ED3|\u1ED1|\u1ED9|\u1ED5|\u1ED7|\u01A1|\u1EDD|\u1EDB|\u1EE3|\u1EDF|\u1EE1/g, "o")
  //     str = str.replace(/\u00F9|\u00FA|\u1EE5|\u1EE7|\u0169|\u01B0|\u1EEB|\u1EE9|\u1EF1|\u1EED|\u1EEF/g, "u")
  //     str = str.replace(/\u1EF3|\u00FD|\u1EF5|\u1EF7|\u1EF9/g, "y")
  //     str = str.replace(/\u0111/g, "d")
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a")
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e")
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i")
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o")
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u")
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y")
  str = str.replace(/đ/g, "d")
  // Some system encode vietnamese combining accent as individual utf-8 characters
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "") // Huyền sắc hỏi ngã nặng 
  str = str.replace(/\u02C6|\u0306|\u031B/g, "") // Â, Ê, Ă, Ơ, Ư
  return str
}

const PORT = 3006
const TMP_DIR = 'tmp'
const SAVE_DIR = 'riki'
const VIDEO_EXT = 'mp4'
const TXT_EXT = 'txt'
const DOWNLOAD_FINISH_EVENT = 'download_finish'
const sockets = []
const app = express()
const server = http.createServer(app)
const io = require("socket.io")(server, {
  cors: {
    origin: `http://localhost:${PORT}`,
  },
})
io.on("connection", socket => sockets.push(socket))

// Database
global.videos = {}

const chunkRegex = new RegExp(/\index(.*?)(ts|m3u8)/, 'g')

const txt = (courseName, time) => `${courseName}_${time}.${TXT_EXT}`
const concatVideoCMD = (fileTXT, courseName, outputPath, time) => `ffmpeg -safe 0 -f concat -i ${fileTXT} -c copy ${outputPath}/${courseName}_${time}.${VIDEO_EXT}`

const getChunks = async url => {
  const { data: chunkFilenames } = await axios.get(url)
  const original = url.replace(chunkRegex, '')
  const chunks = chunkFilenames.match(chunkRegex).reduce((prev, cur, index) => ({
    ...prev,
    [original + cur]: index
  }), {})

  return chunks
}

const download = (courseName, counter = 0, total = 0, videoID, time, chunkFilenames = {}, event) => {
  let watcher = 0
  let cloneCounter = -1

  const liveKeeper = setInterval(() => {
    if (cloneCounter === counter) {
      ++watcher
    } else {
      watcher = 0
    }

    cloneCounter = counter

    // download stun about 6 * 10000
    if (watcher >= 6) {
      clearInterval(liveKeeper)
      // retry
      download(courseName, counter, total, videoID, time, chunkFilenames, event)
    }
  }, 10000)

  return Object.keys(chunkFilenames)
    .map(chunkURL => {
      const index = chunkFilenames[chunkURL]

      return axios({
        method: 'GET',
        url: chunkURL,
        responseType: 'stream'
      })
        .then(({ data }) => {
          const localTmpFilePath = `/${TMP_DIR}/${courseName}_${index}_${time}.${VIDEO_EXT}`
          const writeToTmp = fs.createWriteStream('.' + localTmpFilePath)
          data.pipe(writeToTmp)
          data.on('end', () => {
            const localTmpFilePathWillWrite = `/${TMP_DIR}/${courseName}_${counter}_${time}.${VIDEO_EXT}`
            fs.appendFileSync(txt(courseName, time), `file ${__dirname}${localTmpFilePathWillWrite}\n`)
            writeToTmp.end()
            counter++
            delete chunkFilenames[chunkURL]
            const currentPercent = (counter / total) * 100
            global.videos[videoID].currentPercent = currentPercent

            sockets.forEach(socket => {
              socket.emit('downloaded', {
                videoID,
                currentPercent: currentPercent
              })
            })

            if (counter === total) {
              event.emit(DOWNLOAD_FINISH_EVENT)
              clearInterval(liveKeeper)
            }
          })

          return data
        })
        .catch(err => {
          console.log(err.message)
        })
    })
}

app
  .use(express.json())
  .use(express.urlencoded({ extended: false }))
  .use(morgan('dev'))
  .use(express.static('public'), express.static('riki'))
  .use(cors())

app.post('/downloads', async (req, res) => {
  try {
    let {
      url,
      course_name: courseName
    } = req.body

    if (!url) {
      throw new Error('url is required')
    }

    if (!courseName) {
      throw new Error('course_name is required')
    }

    url = url.trim()
    courseName = courseName.trim()
    courseName = nonAccentVietnamese(courseName)
    courseName = courseName.replace(/\s/g, '-')

    const chunks = await getChunks(url)
    const now = new Date().getTime()

    const fileTXT = txt(courseName, now)
    fs.openSync(fileTXT, 'w')

    const finish = new EventEmitter()
    const total = Object.keys(chunks).length
    const uuidv4 = v4()
    global.videos[uuidv4] = {
      currentPercent: 0,
      courseName,
      videoID: uuidv4,
      timestamp: now
    }

    Promise.all(download(courseName, 0, total, uuidv4, now, chunks, finish))

    finish.once(DOWNLOAD_FINISH_EVENT, (a) => {
      const concatCMD = concatVideoCMD(fileTXT, courseName, SAVE_DIR, now)
      ChildProcess.exec(concatCMD, (err, stdout, sdterr) => {
        if (err) {
          return console.log(err.message)
        }
        console.log(`${courseName} has downloaded`)
        delete global.videos[uuidv4]
        sockets.forEach(socket => {
          socket.emit(DOWNLOAD_FINISH_EVENT, {
            file: `${courseName}_${now}.${VIDEO_EXT}`
          })
        })
      })
    })

    res.json({
      currentPercent: 0,
      courseName,
      videoID: uuidv4
    })
  } catch (err) {
    res.json({
      message: err.message
    })
  }
})

app.get('/download/list', (req, res) => {
  res.json({
    downloading: Object.values(global.videos)
  })
})

app.get('/video/list', async (req, res) => {
  fs.readdir('riki', (err, files) => {
    if (err) {
      res.json({
        error: err.message
      })
    } else {
      files.sort((a, b) => {
        const aTimestamp = +a.substring(a.lastIndexOf('_') + 1, a.lastIndexOf('.'))
        const bTimestamp = +b.substring(b.lastIndexOf('_') + 1, b.lastIndexOf('.'))
        return aTimestamp - bTimestamp
      })

      res.json({
        files
      })
    }

  })
})

app.get('/down/:video', async (req, res) => {
  res.download(`riki/${req.params.video}`)
})

// remove txt
new CronJob(
  '* */5 * * * *',
  function () {
    const exceptFiles = Object.values(global.videos).map(videoFile => `${videoFile.courseName}_${videoFile.timestamp}.${TXT_EXT}`)
    fs.readdir('.', (err, files) => {
      if (err) {
        console.error(err)
      } else {
        files.forEach(file => {
          if (
            file.substring(file.lastIndexOf('.') + 1, file.length) === TXT_EXT
            && !exceptFiles.includes(file)
          ) {
            fs.unlinkSync(file)
          }
        })
      }
    })
  },
  null,
  true
)

// remove tmp
new CronJob(
  '* */5 * * * *',
  function () {
    const exceptTimestampFiles = Object.values(global.videos).map(videoFile => `${videoFile.timestamp}`)

    fs.readdir(TMP_DIR, (err, files) => {
      if (err) {
        console.error(err)
      } else {
        files.forEach(file => {
          const willDeleteFile = file.substring(file.lastIndexOf('_') + 1, file.lastIndexOf('.'))
          if (!exceptTimestampFiles.includes(willDeleteFile)) {
            fs.unlinkSync(TMP_DIR + '/' + file)
          }
        })
      }
    })
  },
  null,
  true
)

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`))