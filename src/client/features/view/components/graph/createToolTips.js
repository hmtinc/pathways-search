//Get html template for the tooltip
export function loadHtmlTemplate(cy, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', './toolTipTemplate.html', true);
  xhr.onreadystatechange = function () {
    if (this.readyState !== 4) return;
    if (this.status !== 200) return; // or whatever error handling you want
    callback(cy, this.responseText);
  };
  xhr.send();
}

//Create a tippy object for each node
export function bindTippyToElements(cy, htmlTemplate) {
  cy.elements().each(function (element, i) {

    //Get node name
    var name = getNodeDataField(element, 'label');

    if (name) {
      //Create a DOM reference object for tippy
      var tippyReference = document.createElement('div');
      tippyReference.id = 'tippy-obj' + element.id();

      //Insert node details 
      var modifiedTemplate = formatHTML(htmlTemplate, {name : name});

      //Set tooltip contents
      var innerHTMLSelector = 'something' + tippyReference.id;
      tippyReference.innerHTML = '<div id=\"' + innerHTMLSelector + '\">' + modifiedTemplate + '</div>';
      document.body.appendChild(tippyReference);

      //Create tippy object 
      var tip = element.tippy('#' + tippyReference.id, {
        html: document.querySelector('#' + innerHTMLSelector),
        arrow: false,
        animation: 'fade',
        position: 'top',
        duration: 500
      });
    }
  });
}

//Replace placeholders with actual values
function formatHTML(htmlTemplate, values){

  var maxHeadingLength = 16;

  //Insert the node name
  values.name = values.name.substring(0, maxHeadingLength);
  htmlTemplate = htmlTemplate.replace('GeneNameGoesHere', values.name);

  return htmlTemplate;
}

//Get a data field from a node
function getNodeDataField(element, selector) {
  return element.data(selector);
}