import OpenInNew from 'material-ui-icons/OpenInNew';
import PictureAsPdf from 'material-ui-icons/PictureAsPdf';
import $ from 'jquery';

const queryString = require('query-string');
const React = require('react');
const ReactDOM = require('react-dom');

//PopperJs Tooltips
export class ToolTip extends React.Component {
  render() {

    //Keep record of elements to render
    var renderedArray = [];
    var count = 0;
    var i = 0;

    for (i = 0; i < this.props.cy.elements().length; i++) {
      var element = this.props.cy.elements()[i];
      //this.props.cy.elements().forEach(function (element, i) {

      //Get node name
      var name = getNodeDataField(element, 'label');
      var maxHeadingLength = 16;
      count++;

      if (name) {
        //Trim Name
        name = name.substring(0, maxHeadingLength);

        //Create a DOM reference object for tippy
        var id = 'tippy-obj' + element.id();
        var innerHTMLSelector = 'inner-' + id;

        //Create the tooltip
        renderedArray.push(<div key={count} id={id}><div id={innerHTMLSelector}>
          <div className="tooltip-image">
            <img src="img/tooltip/tooltip.png" alt="" />
            <div className="tooltip-heading"> {name} </div>
            <OpenInNew className='tooltip-button-show' />
            <PictureAsPdf className='tooltip-button-pdf' />
            <div className="tooltip-internal">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse sagittis, sem non pharetra dictum, eros turpis condimentum
                sem, ut sagittis mi elit a elit. Duis dignissim, augue a hendrerit venenatis, dolor metus sagittis nisi, vitae tempus
                lectus risus vel lacus. Proin dictum, metus in accumsan condimentum, tortor diam porta tellus, et accumsan elit ex
                a libero</div>
          </div></div></div>);
      }
    }

    //Render all the tooltips
    return <div>{renderedArray}</div>;
  }
}

//Create a tippy object for each node
export function bindTippyToElements(cy) {

  //Create a placeholder for tooltips
  var tippyReference = document.createElement('div');
  tippyReference.id = 'tooltips';
  document.body.appendChild(tippyReference);

  //Create Popper Elements for Tippy
  ReactDOM.render(<ToolTip cy={cy} />, document.getElementById('tooltips'));

  //Get query 
  var q = queryString.parse(window.location.hash.substring(6));
  var uri = q.uri;
  var url = 'https://www.pathwaycommons.org/pc2/get?format=BIOPAX&uri=' + uri + '&user=pathwaycommons-js-lib%3Apathways-search';

  //Get SIF File 
  $.ajax({
    type: 'GET',
    url: url,
    dataType: 'text',
    success: function (data) { biopax(data, cy); },
  });

  var j = 0;
  for (j = 0; j < cy.nodes().length; j++) {
    var element = cy.nodes()[j];
    var name = getNodeDataField(element, 'label');
    //if (name) console.log(element.id());
  }

  //create a tippy element for each cytoscape element
  var i = 0;
  for (i = 0; i < cy.elements().length; i++) {
    //cy.elements().forEach(function (element, i) {

    //Get node name
    var element = cy.elements()[i];
    var name = getNodeDataField(element, 'label');

    //Only Create a tippy object if there is a name
    if (name) {
      //var tippyReference = document.createElement('div')

      var id = 'tippy-obj' + element.id();
      var innerHTMLSelector = 'inner-' + id;

      //Create tippy object 
      var tip = element.tippy('#' + id, {
        html: document.querySelector('#' + innerHTMLSelector),
        arrow: false,
        animation: 'fade',
        position: 'top',
        duration: 500
      });
    }
  }
}

//Get a data field from a node
function getNodeDataField(element, selector) {
  return element.data(selector);
}

//Filters the given array to those which when passed into matcher return true
Array.prototype.where = function (matcher) {
  var result = [];
  for (var i = 0; i < this.length; i++) {
    if (matcher(this[i])) {
      result.push(this[i]);
    }
  }
  return result;
};

function GetElementsByAttribute(tag, attr, attrValue, doc) {
  //Get elements and convert to array
  var elems = Array.prototype.slice.call(doc.getElementsByTagName(tag), 0);

  //Matches an element by its attribute and attribute value
  var matcher = function (el) {
    return el.getAttribute(attr) == attrValue;
  };

  return elems.where(matcher);
}

function biopax(data, cy) {
  //Parse XML Data 
  var parser = new DOMParser();
  var xmlDoc = parser.parseFromString(data, 'text/xml');
  var i = 0;

  //Loop through all nodes
  for (i = 0; i < cy.nodes().length; i++) {

    //Get Element Values
    var element = cy.nodes()[i];
    var id = element.id();

    //Temp Values
    var tempArray;
    var baseData;

    //Get BaseData Object 
    if (id.includes('Protein')) {
      baseData = GetElementsByAttribute('bp:Protein', 'rdf:ID', id, xmlDoc)[0];
      console.log(baseData.childNodes);
    }


    //Get All Children nodes
 



  }
}