    //Get html template for the tooltip
  export function loadHtmlTemplate(cy, callback) {
    var xhr= new XMLHttpRequest();
    xhr.open('GET', './toolTipTemplate.html', true);
    xhr.onreadystatechange= function() {
        if (this.readyState!==4) return;
        if (this.status!==200) return; // or whatever error handling you want
       callback(cy, this.responseText);
    };
    xhr.send();
  }

  //Create a tippy object for each node
  export function bindTippyToElements(cy, htmlTemplate){
    cy.elements().each(function (element, i) {
      //Create a DOM reference object for tippy
      var tippyReference = document.createElement('div');
      tippyReference.id = 'tippy-obj' + element.id();

      //Set tooltip contents
      var innerHTMLSelector = 'something' + tippyReference.id;
      tippyReference.innerHTML = '<div id=\"' + innerHTMLSelector + '\">' + htmlTemplate + '</div>';
      document.body.appendChild(tippyReference);

      //Create tippy object
      var tip = element.tippy('#' + tippyReference.id, {
        html: document.querySelector('#' + innerHTMLSelector),
        arrow: false,
        animation: 'fade',
        position: 'top',
        duration: 500
      });
    });
  }