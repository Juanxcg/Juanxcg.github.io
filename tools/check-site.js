const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const sourceDir = path.join(rootDir, 'source')
const postsDir = path.join(sourceDir, '_posts')
const publicDir = path.join(rootDir, 'public')
const issues = []

function walkFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return []

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkFiles(fullPath, predicate)
    return predicate(fullPath) ? [fullPath] : []
  })
}

function relativeToRoot(filePath) {
  return path.relative(rootDir, filePath).split(path.sep).join('/')
}

function isInside(directory, target) {
  const relative = path.relative(directory, target)
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
}

function safeDecode(value) {
  try {
    return decodeURI(value)
  } catch {
    return value
  }
}

function existsWithExactCase(filePath) {
  const absolutePath = path.resolve(filePath)
  const parsed = path.parse(absolutePath)
  const segments = absolutePath.slice(parsed.root.length).split(path.sep).filter(Boolean)
  let current = parsed.root

  for (const segment of segments) {
    if (!fs.existsSync(current)) return false
    const entries = fs.readdirSync(current)
    if (!entries.includes(segment)) return false
    current = path.join(current, segment)
  }

  return fs.existsSync(current)
}

function isExternalReference(reference) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference)
}

function cleanReference(reference) {
  const withoutTitle = reference.trim().replace(/^<|>$/g, '').split(/\s+["']/)[0]
  return safeDecode(withoutTitle.split(/[?#]/)[0])
}

function checkSourceReference(owner, reference) {
  const cleaned = cleanReference(reference)
  if (!cleaned || isExternalReference(cleaned)) return

  const extension = path.extname(cleaned)
  const isAsset = cleaned.startsWith('/image/')
    || cleaned.startsWith('/downloads/')
    || cleaned.startsWith('/img/')
    || (extension && extension !== '.html')

  if (!isAsset) return

  const target = cleaned.startsWith('/')
    ? path.resolve(sourceDir, `.${cleaned}`)
    : path.resolve(path.dirname(owner), cleaned)

  if (!isInside(sourceDir, target) || !existsWithExactCase(target)) {
    issues.push(`${relativeToRoot(owner)} references missing source file: ${reference}`)
  }
}

function checkSourceContent() {
  const markdownFiles = walkFiles(sourceDir, file => file.endsWith('.md'))

  for (const markdownFile of markdownFiles) {
    const content = fs.readFileSync(markdownFile, 'utf8')
    const frontMatter = content.match(/^---\s*\r?\n([\s\S]*?)\r?\n---(?:\s*\r?\n|$)/)

    if (!frontMatter) {
      issues.push(`${relativeToRoot(markdownFile)} has invalid or missing front matter`)
      continue
    }

    if (!/^title:\s*\S+/m.test(frontMatter[1])) {
      issues.push(`${relativeToRoot(markdownFile)} is missing a title`)
    }
    if (!/^date:\s*\S+/m.test(frontMatter[1])) {
      issues.push(`${relativeToRoot(markdownFile)} is missing a date`)
    }

    for (const match of content.matchAll(/!?\[[^\]]*]\(([^)]+)\)/g)) {
      checkSourceReference(markdownFile, match[1])
    }
    for (const match of content.matchAll(/\b(?:href|src|data-src|data-fallback)=["']([^"']+)["']/gi)) {
      checkSourceReference(markdownFile, match[1])
    }
    for (const match of frontMatter[1].matchAll(/^(?:cover|top_img):\s*(.+)$/gm)) {
      checkSourceReference(markdownFile, match[1])
    }
  }

  const htmlFiles = walkFiles(sourceDir, file => file.endsWith('.html'))
  for (const htmlFile of htmlFiles) {
    const content = fs.readFileSync(htmlFile, 'utf8')
    for (const match of content.matchAll(/\b(?:href|src|data-src|data-fallback)=["']([^"']+)["']/gi)) {
      checkSourceReference(htmlFile, match[1])
    }
  }

  const dataFiles = walkFiles(path.join(sourceDir, '_data'), file => /\.ya?ml$/i.test(file))
  for (const dataFile of dataFiles) {
    const content = fs.readFileSync(dataFile, 'utf8')
    for (const match of content.matchAll(/\/(?:image|downloads|img)\/[^\s'"]+/g)) {
      checkSourceReference(dataFile, match[0])
    }
  }
}

function publicCandidates(owner, reference) {
  const cleaned = cleanReference(reference)
  if (!cleaned || isExternalReference(cleaned)) return []

  const target = cleaned.startsWith('/')
    ? path.resolve(publicDir, `.${cleaned}`)
    : path.resolve(path.dirname(owner), cleaned)

  if (!isInside(publicDir, target)) return []

  const candidates = [target]
  if (cleaned.endsWith('/')) {
    candidates.push(path.join(target, 'index.html'))
  } else if (!path.extname(cleaned)) {
    candidates.push(`${target}.html`, path.join(target, 'index.html'))
  }
  return candidates
}

function checkGeneratedSite() {
  if (!fs.existsSync(publicDir)) {
    issues.push('public/ is missing; run npm run build first')
    return
  }

  const htmlFiles = walkFiles(publicDir, file => file.endsWith('.html'))
  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8')
    for (const match of html.matchAll(/\b(?:href|src|data-src)=["']([^"']+)["']/gi)) {
      const candidates = publicCandidates(htmlFile, match[1])
      if (candidates.length > 0 && !candidates.some(existsWithExactCase)) {
        issues.push(`${relativeToRoot(htmlFile)} references missing generated file: ${match[1]}`)
      }
    }
  }
}

checkSourceContent()
checkGeneratedSite()

if (issues.length > 0) {
  console.error(`Site check failed with ${issues.length} issue(s):`)
  for (const issue of issues) console.error(`- ${issue}`)
  process.exitCode = 1
} else {
  const postCount = walkFiles(postsDir, file => file.endsWith('.md')).length
  const pageCount = walkFiles(publicDir, file => file.endsWith('.html')).length
  console.log(`Site check passed: ${postCount} posts and ${pageCount} generated HTML files checked.`)
}
