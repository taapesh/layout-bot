const webdriverio = require('webdriverio');
const co          = require('co');
const fs          = require('fs');
const cheerio     = require('cheerio');

const writeFileAsync = (name, text) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(name, text, (err) => {
      err ? reject(err) : resolve(null);
    });
  });
}

const readFileAsync = (name) => {
  return new Promise((resolve, reject) => {
    fs.readFile(name, 'utf8', (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}

function* elementIterator(root) {
  let q = [];
  q.push(root);

  while (q.length) {
    let element = q.pop();

    for (let child of element.children) {
      q.push(child);
    }

    yield element;
  }
}

const readFileSync = (name) => {
  return fs.readFileSync(name).toString();
}

const options = {
  desiredCapabilities: {
    browserName: 'firefox'
  }
};

const getMaxDepth = (data) => {
  let maxDepth = 0;

  for (let element of elementIterator(data.elements)) {
    maxDepth = Math.max(maxDepth, element.depth);
  }

  return maxDepth;
}

const processPageData = (data) => {
  const maxDepth = getMaxDepth(data);
  const colors = readFileSync('colors.txt').split('\n').map(color => '#' + color);
  const numColors = colors.length;

  let $ = cheerio.load('<!doctype html><html><head></head><body></body></html>');
  let html = '';

  for (let element of elementIterator(data.elements)) {
    const colorIndex = parseInt((numColors - 1) * (1.0 * element.depth / maxDepth));

    const e = $('<div></div>');

    e.css({
      position: 'absolute',
      background: colors[colorIndex],
      zIndex: element.depth,
      width: element.dimensions.width + 'px',
      height: element.dimensions.height + 'px',
      left: element.position.x + 'px',
      top: element.position.y + 'px'
    });

    html += $('<div>').append(e).clone().html();
  }

  $(html).appendTo('body');

  writeFileAsync('compiled.html', $.html())
    .catch(err => console.log(err));
}

co(function* () {
  const driver = webdriverio.remote(options).init();
  yield driver.url('https://www.google.com');

  var result = yield driver.execute(readFileSync('page-data.js'));

  driver.end();

  if (result.state === 'success') {
    processPageData(result.value);
  }
})
.catch(err => console.log(err));
