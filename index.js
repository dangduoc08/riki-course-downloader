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

const app = express()

const chunkRegex = new RegExp(/\index(.*?)(ts|m3u8)/, 'g')

const txt = courseName => courseName + '.txt'
const rmCMD = (dir, filename) => `rm -rf ${__dirname}/${dir}/*${filename}*`
const concatVideoCMD = (fileTXT, courseName, outputPath) => `ffmpeg -safe 0 -f concat -i ${fileTXT} -c copy ${outputPath}/${courseName}_${new Date().getTime()}.${VIDEO_EXT}`

const getChunks = async url => {
  const { data: chunkFilenames } = await axios.get(url)
  const original = url.replace(chunkRegex, '')
  return chunkFilenames.match(chunkRegex).map(filename => original + filename)
}

const download = (courseName, chunkFilenames = [], event) => {
  let counter = 0
  return chunkFilenames
    .map((chunkURL, index) => {
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
            console.log(courseName, counter)
            if (counter === chunkFilenames.length - 1) {
              event.emit(DOWNLOAD_FINISH_EVENT)
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

    const chunkFilenames = await getChunks(url)

    const fileTXT = txt(courseName)
    fs.openSync(fileTXT, 'w')

    const finish = new EventEmitter()
    Promise.all(download(courseName, chunkFilenames, finish))

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
      total_chunks: chunkFilenames.length
    })
  } catch (err) {
    res.json({
      message: err.message
    })
  }
})

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`))