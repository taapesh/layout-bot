var app = {
  
  isHidden: function(elem) {
    var style = window.getComputedStyle(elem);
    return style.visibility === 'hidden' || style.display === 'none';
  },

  getPageHeight: function() {
    var body = document.body;
    var html = document.documentElement;
    return Math.max(body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight);
  },

  getPageWidth: function() {
    var width = window.innerWidth ||
              document.documentElement.clientWidth ||
              document.body.clientWidth ||
              document.body.offsetWidth;
    return width;
  },

  getPosition: function(elem) {
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docElem = document.documentElement;

    var scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft;

    var clientTop = docElem.clientTop || body.clientTop || 0;
    var clientLeft = docElem.clientLeft || body.clientLeft || 0;

    var top  = box.top +  scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;

    return {
      'y': Math.round(top),
      'x': Math.round(left)
    };
  },

  getDimensions: function(elem) {
    return {
        'width': elem.offsetWidth,
        'height': elem.offsetHeight
      };
  },

  getElement: function(elem) {
    return {
      'dimensions': app.getDimensions(elem),
      'position': app.getPosition(elem),
      'tag': elem.tagName.toLowerCase(),
      'children': []
    };
  },

  getPageElements: function() {
    var elementMap = {}
    var stack = [document.body];
    var id = 0;

    while (stack.length !== 0) {
      var domElement = stack.pop();
      var children = domElement.children;
      domElement.setAttribute('data-element-id', id);

      for (var i = children.length; i--;) {
        stack.push(children[i]);
      }

      var element = app.getElement(domElement);
      elementMap[id++] = element;
      var parent = elementMap[domElement.parentElement.getAttribute('data-element-id')];

      if (parent) {
        element.depth = parent.depth + 1;
        parent.children.push(element);
        element.parent =  {
          'dimensions': parent.dimensions,
          'position': parent.position,
          'tag': parent.tag,
        };
      } else {
        // Initialize root
        element.depth = 0;
      }
    }

    // Return root
    return elementMap[0];
  },
};

var pageData = {
  'elements': app.getPageElements(),
  'pageHeight': app.getPageHeight(),
  'pageWidth': app.getPageWidth(),
  'pageTitle': document.title
}

return pageData;
