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

const getMaxDepth = (data) => {
  let maxDepth = 0;

  for (let element of elementIterator(data.elements)) {
    maxDepth = Math.max(maxDepth, element.depth);
  }

  return maxDepth;
}

const shadeColor = (color, percent) => {   
    const f = parseInt(color.slice(1),16);
    const t = percent < 0 ? 0 : 255;
    const p = percent < 0 ? percent * -1 : percent;
    const R = f >> 16;
    const G = f >> 8 & 0x00FF
    const B = f & 0x0000FF;
    return '#' + (0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

const processPageData = (data) => {
  const maxDepth = getMaxDepth(data);
  const colors = readFileSync('colors.txt').split('\n').map(color => '#' + color);
  const numColors = colors.length;

  let $ = cheerio.load('<!doctype html><html><head></head><body></body></html>');
  let html = '';

  //$('<style>div:hover{border:1px solid black}</style>').appendTo('head');

  for (let element of elementIterator(data.elements)) {
    const colorIndex = parseInt((numColors - 1) * (1.0 * element.depth / maxDepth));

    const e = $('<div></div>');
    e.attr('data-id', element.id);

    const lightColor = shadeColor(colors[colorIndex], 0.5);
    
    const style = $('<style></style>');
    let styleText = '[data-id="' + element.id + '"]:hover{background:' + lightColor + ' !important}';
    style.text(styleText);
    $('head').append(style);

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

  co(function* () {
    yield writeFileAsync('build/compiled.html', $.html());
  })
  .catch(err => console.log(err));
}

co(function* () {
  const options = {
    desiredCapabilities: {
      browserName: 'firefox'
    }
  };

  const driver = webdriverio.remote(options).init();
  yield driver.url('https://about.gitlab.com');

  const result = yield driver.execute(readFileSync('scripts/main.js'));

  driver.end();

  if (result.state === 'success') {
    processPageData(result.value);
  }
})
.catch(err => console.log(err));
