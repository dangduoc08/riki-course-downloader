// // const ChildProcess = require('child_process')

// // let cmd = "ffmpeg -safe 0 -f concat -i video.txt -c copy merged_video.mp4"
// // ChildProcess.exec(cmd, function (err, stdout, stderr) {
// //   if (err) console.log(err)
// //   else console.log("Done!")
// // })

// const axios = require('axios')
// const fs = require('fs')
// const url = 'https://vn.riki.edu.vn/online/Data/upload/files/Video/N3Junbi/NguPhap/N3JB-nguphap-2-1.ts.hls/1080p/index0.ts'


// const video = 'https://vn.riki.edu.vn/online/Data/upload/files/Video/N3Junbi/NguPhap/N3JB-nguphap-2-1.ts.hls/1080p/'
// async function download() {
//   const res = await axios.get(
//     'https://vn.riki.edu.vn/online/Data/upload/files/Video/N3Junbi/NguPhap/N3JB-nguphap-2-1.ts.hls/1080p/index.m3u8'
//   )
//   const list = res.data
//   const matched = list.match(/\index(.*?)ts/g)

//   const mapped = matched.map(elem => {
//     const download = video + elem
//     return axios({
//       method: "get",
//       url: download,
//       responseType: "stream"
//     })
//     // const writer = fs.createWriteStream(`./dir/${elem}.mp4`);

//     // return res.data.pipe(writer)
//   })

//   const alls = await Promise.all(mapped)
//   console.log(alls.length)
//   alls.forEach((elem, index) => {
//     console.log(elem.data)
//     const writer = fs.createWriteStream(`./${index}.mp4`);

//     return elem.data.pipe(writer)
//   })
// }

// download()