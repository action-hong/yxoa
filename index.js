#!/usr/bin/env node
const gitRawCommits = require('git-raw-commits')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const exec = require('child_process').execSync
const fs = require('fs')
const path = require('path')

// TODO: 使用配置文件
const BLACK = [
  'svn',
  'MiHomePluginSDK',
  'rfid_zcgl_frontend',
  'cl-website',
  'AliStory',
  'SMCCloud',
  'tecent-yun-lock',
  'hz_dvr_frontend',
  'live',
  'ad_management_frontend',
  'cloudlocksystem_frontend',
  'rfid_zcgl_frontend_corelink',
  'miot-plugin-sdk-master_new',
  'jianfeng-admin',
  'miot-plugin-sdk-xiaoou',
  'miot-plugin-sdk-master'
]

// 获取地址
function getAuthor () {
  let name='';
  let email='';

  try {
      name = exec('git config --get user.name');
      email = exec('git config --get user.email');
  } catch (e) {
      console.log(e);
  }

  name = name && JSON.stringify(name.toString().trim()).slice(1, -1);
  email = email && (' <' + email.toString().trim() + '>');
  return (name || '') + (email || '');
}

// 判断是否是一个仓库
function isGit (dirname) {
  const name = path.join(dirname, '.git')
  // console.log('==> name', name)
  return fs.existsSync(name)
}

function parseTime(time, cFormat) {
  if (arguments.length === 0 || !time) {
    return null
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}'
  let date
  if (typeof time === 'object') {
    date = time
  } else {
    if ((typeof time === 'string')) {
      if ((/^[0-9]+$/.test(time))) {
        // support "1548221490638"
        time = parseInt(time)
      } else {
        // support safari
        // https://stackoverflow.com/questions/4310953/invalid-date-in-safari
        time = time.replace(new RegExp(/-/gm), '/')
      }
    }

    if ((typeof time === 'number') && (time.toString().length === 10)) {
      time = time * 1000
    }
    date = new Date(time)
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay()
  }
  const time_str = format.replace(/{([ymdhisa])+}/g, (result, key) => {
    const value = formatObj[key]
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') { return ['日', '一', '二', '三', '四', '五', '六'][value ] }
    return value.toString().padStart(2, '0')
  })
  return time_str
}

// 输出
const output = fs.createWriteStream((argv.output || new Date().getTime() + '.md'), {
  encoding: 'utf-8',
  flags: 'a'
})

// 当前目录
const dirname = path.resolve('./')

function read(name) {
  return new Promise((resolve, reject) => {
    const today = new Date()
    today.setHours(0)
    today.setMinutes(0)
    today.setSeconds(0)
    const since = parseTime(today)
    const until = parseTime(today.setDate(today.getDate() + 1))
    console.log('range', since, until)
    const readSteam = gitRawCommits({
      since: argv.since || since,
      until: argv.until || until,
      author: argv.author || getAuthor()
    })
    // 读一次就行，然后用来写入标题
    readSteam.once('data', chunk => {
      console.log(`==> read ${name} has ${chunk.length}`)
      if (chunk.length > 0) {
        output.write(`---\n\n${name}\n\n`)
      }
    })
    readSteam.pipe(output, {
      end: false
    })
    readSteam.once('end', _ => {
      // console.log('==> 结束啦')
      resolve()
    })
  })
  
}

async function readAll (dirname) {
  console.log('==> current', dirname)
  if (isGit(dirname)) {
    await read(path.basename(dirname))
  } else {
    const children = fs.readdirSync(dirname)
    for (let i = 0; i < children.length; i++) {
      if (BLACK.some(val => children[i].includes(val))) {
        continue
      }
      const childname = path.join(dirname, children[i])
      if (fs.statSync(childname).isDirectory()) {
        process.chdir(childname)
        await readAll(childname)
      }
    }
  }
}

async function main () {
  readAll(dirname)
}

main()

console.log('hello yxoa')

// 获取git的作者名