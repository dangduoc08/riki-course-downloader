const fs = require('fs')
const EventEmitter = require('events')
const ChildProcess = require('child_process')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const axios = require('axios')

const PORT = 3006
const TMP_DIR = 'tmp'
const SAVE_DIR = 'riki'
const VIDEO_EXT = 'mp4'
const DOWNLOAD_FINISH_EVENT = 'download_finish'
const TIMEOUT = 45000

const app = express()

const chunkRegex = new RegExp(/\index(.*?)(ts|m3u8)/, 'g')

const txt = courseName => courseName + '.txt'
const rmCMD = (dir, filename) => `rm -rf ${__dirname}/${dir}/*${filename}*`
const concatVideoCMD = (fileTXT, courseName, outputPath) => `ffmpeg -safe 0 -f concat -i ${fileTXT} -c copy ${outputPath}/${courseName}_${new Date().getTime()}.${VIDEO_EXT}`

const getChunks = async url => {
  const { data: chunkFilenames } = await axios.get(url)
  const original = url.replace(chunkRegex, '')
  const chunks = chunkFilenames.match(chunkRegex).reduce((prev, cur, index) => ({
    ...prev,
    [original + cur]: index
  }), {})

  return chunks
}

const download = (courseName, counter = 0, total = 0, chunkFilenames = {}, event) => {
  const start = new Date().getTime()

  const watcher = setInterval(() => {
    if (new Date().getTime() - start >= TIMEOUT && counter < total) {
      clearInterval(watcher)
      // retry
      download(courseName, counter, total, chunkFilenames, event)
    }
  }, 5000)

  return Object.keys(chunkFilenames)
    .map(chunkURL => {
      const index = chunkFilenames[chunkURL]

      return axios({
        method: 'GET',
        url: chunkURL,
        responseType: 'stream'
      })
        .then(({ data }) => {
          const localTmpFilePath = `/${TMP_DIR}/${courseName}_${index}.${VIDEO_EXT}`
          const writeToTmp = fs.createWriteStream('.' + localTmpFilePath)
          data.pipe(writeToTmp)
          data.on('end', () => {
            const localTmpFilePathWillWrite = `/${TMP_DIR}/${courseName}_${counter}.${VIDEO_EXT}`
            fs.appendFileSync(txt(courseName), `file ${__dirname}${localTmpFilePathWillWrite}\n`)
            writeToTmp.end()
            counter++
            delete chunkFilenames[chunkURL]

            if (counter === total) {
              event.emit(DOWNLOAD_FINISH_EVENT)
              clearInterval(watcher)
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
  .use(express.static('public'))
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

    const chunks = await getChunks(url)

    const fileTXT = txt(courseName)
    fs.openSync(fileTXT, 'w')

    const finish = new EventEmitter()
    const total = Object.keys(chunks).length
    Promise.all(download(courseName, 0, total, chunks, finish))

    finish.once(DOWNLOAD_FINISH_EVENT, (a) => {
      console.log('1 >>> chunks was downloaded')
      const concatCMD = concatVideoCMD(fileTXT, courseName, SAVE_DIR)
      console.log('2 >>> ' + concatCMD)

      ChildProcess.exec(concatCMD, (err, stdout, sdterr) => {
        if (err) {
          console.log(err.message)
        }
        if (sdterr) {
          console.log('sdterr', sdterr)
        }
        console.log('stdout', stdout)
        console.log(`3 >>> ${courseName} was merged`)
        ChildProcess.exec(rmCMD(TMP_DIR, courseName), err => {
          if (err) {
            console.log(err.message)
          }
          console.log(`4 >>> temp ${courseName} was deleted`)
          fs.unlinkSync(fileTXT)
          console.log(`5 >>> ${fileTXT} was deleted`)
        })
      })
    })

    res.json({
      total_chunks: total
    })
  } catch (err) {
    res.json({
      message: err.message
    })
  }
})

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))