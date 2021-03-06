#!/usr/bin/env node
var fs = require('fs')
var GitHubSlugger = require('github-slugger')
var markybars = require('./lib/markybars.js')
var path = require('path')
var pullOrClone = require('./lib/pull-or-clone.js')
var join = path.join
var sh = require('shelljs')
var resolve = require('path').resolve

var awesomePath = join('tmp/awesome-standard')
var buildPath = 'build'
var logoPath = join(buildPath, 'docs')
var demoPath = join('tmp/standard-demo')
var mdPath = join('tmp/markdown')
var stdPath = join('tmp/standard')
var stdDocsPath = join('tmp/standard/docs')
var page = join('layout/page.html')
var demoPage = join('layout/demo.html')

var partials = {
  'toc': join('layout/partials/toc.html'),
  'ga': join('layout/partials/ga.html')
}

var slugger = new GitHubSlugger()

if (!sh.which('git')) {
  sh.echo('Sorry, this script requires git')
  sh.exit(1)
}

pullOrClone('https://github.com/feross/standard', stdPath)
pullOrClone('https://github.com/feross/awesome-standard', awesomePath)
pullOrClone('https://github.com/flet/standard-demo', demoPath)

sh.rm('-rf', buildPath)
sh.rm('-rf', mdPath)

sh.mkdir(buildPath)
sh.mkdir('-p', logoPath)
sh.mkdir(mdPath)
sh.mkdir(mdPath)

sh.cp('-f', join('markdown/*.md'), mdPath)
sh.cp('-f', join(stdPath, '*.md'), mdPath)
sh.cp('-f', join(stdDocsPath, '*.md'), mdPath)
sh.cp('-f', join(awesomePath, 'README.md'), join(mdPath, 'awesome.md'))
sh.cp('-R', join(stdDocsPath, 'logos'), logoPath)
var genPage = markybars.compile(page, partials)
var genDemo = markybars.compile(demoPage, partials)

var files = sh.ls(mdPath)
files.forEach(function (file) {
  var fileData = fs.readFileSync(join(mdPath, file), 'utf8')
  var name = path.parse(file).name
  var gen = name === 'demo' ? genDemo : genPage

  var htmlData = gen({data: fileData})
  var fileName = slugger.slug(name) + '.html'

  fs.writeFileSync(join(buildPath, fileName), htmlData, 'utf8')
})

// replace all RULES.md instances in links with rules.html
sh.sed('-i', /RULES(.*)\.md/g, 'rules.html', join(buildPath, 'readme.html'))
sh.sed('-i', /".*docs\/RULES(.*)\.md/g, '"rules$1.html', join(buildPath, 'readme.html'))
sh.sed('-i', /".*docs\/README(.*)\.md/g, '"readme$1.html', join(buildPath, 'readme.html'))
sh.sed('-i', /".*docs\/webstorm\.md"/g, '"webstorm.html"', join(buildPath, 'readme.html'))

sh.sed('-i', /".*docs\/RULES(.*)\.md/g, '"rules$1.html', join(buildPath, 'rules.html'))

// rename files to be internet friendly
sh.mv('-f', join(buildPath, 'readme.html'), join(buildPath, 'index.html'))

// once everything is built, copy it to root
sh.rm('../*.html')
sh.cp('-R', buildPath + '/', resolve(__dirname, '..'))

// copy standard-demo bundle.js to root
sh.cp('-f', join(demoPath, 'bundle.js'), resolve(__dirname, '..', 'standard-demo.js'))
