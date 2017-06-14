const app = (function() {
  const getPageHeight = () => {
    const body = document.body;
    const html = document.documentElement;
    return Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
  }

  const getPageWidth = () => {
    const width = window.innerWidth ||
      document.documentElement.clientWidth ||
      document.body.clientWidth ||
      document.body.offsetWidth;
    return width;
  }

  const getElementId = (el) => {
    return el ? el.getAttribute('data-element-id') : null;
  }

  const setElementId = (el, id) => {
    el.setAttribute('data-element-id', id);
  }

  const getPosition = (el) => {
    const box = el.getBoundingClientRect();

    const body = document.body;
    const docElem = document.documentElement;

    const scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    const scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

    const clientTop = docElem.clientTop || body.clientTop || 0;
    const clientLeft = docElem.clientLeft || body.clientLeft || 0;

    const top  = box.top +  scrollTop - clientTop;
    const left = box.left + scrollLeft - clientLeft;

    return {
      'y': Math.round(top),
      'x': Math.round(left)
    };
  }

  const getDimensions = (el) => {
    return {
      'width': el.offsetWidth,
      'height': el.offsetHeight
    };
  }

  const getElementData = (el) => {
    return {
      'dimensions': getDimensions(el),
      'parent': el.parentElement,
      'position': getPosition(el),
      'tag': el.tagName.toLowerCase(),
      'children': []
    };
  }

  const getPageElements = () => {
    const elementMap = {}
    const stack = [document.body];
    let id = 0;

    while (stack.length !== 0) {
      const el = stack.pop();
      setElementId(el, id);

      for (let child of el.children) {
        stack.push(child);
      }

      const elementData = getElementData(el);
      elementData.id = id;
      elementMap[id++] = elementData;
      const parentData = elementMap[getElementId(elementData.parent)];

      if (parentData) {
        elementData.depth = parentData.depth + 1;
        parentData.children.push(elementData);
        elementData.parent =  {
          'dimensions': parentData.dimensions,
          'position': parentData.position,
          'tag': parentData.tag,
        };
      } else {
        // Initialize root
        elementData.depth = 0;
      }
    }

    // Return root
    return elementMap[0];
  }

  const getPageData = () => {
    return {
      'elements': getPageElements(),
      'pageHeight': getPageHeight(),
      'pageWidth': getPageWidth(),
      'pageTitle': document.title
    }
  }

  return {
    getPageData: getPageData
  }
})();

return app.getPageData();
