#!/usr/bin/env node
const gitRawCommits = require('git-raw-commits')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv
const exec = require('child_process').execSync
const fs = require('fs')
const path = require('path')

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
  return fs.existsSync(path.join(dirname, '.git'))
}

// 输出
const output = fs.createWriteStream((argv.output || new Date().getTime() + '.md'), {
  encoding: 'utf-8'
})

console.log('==> current', __dirname, isGit(__dirname))

gitRawCommits({
  since: argv.since || '2021-05-12 00:00:00',
  until: argv.until || '2021-05-12 12:00:00',
  author: argv.author || getAuthor()
}).pipe(output)
console.log('hello yxoa')

// 获取git的作者名