(function ($, undefined) {

    // Some refs to Kendo constructs---------------------------------------------------------------
    var dataviz = kendo.dataviz;
    var Widget = kendo.ui.Widget;
    var ELEMENT_NODE = 1;
    var ATTRIBUTE_NODE = 2;
    var TEXT_NODE = 3;
    var CDATA_SECTION_NODE = 4;
    var ENTITY_REFERENCE_NODE = 5;
    var ENTITY_NODE = 6;
    var PROCESSING_INSTRUCTION_NODE = 7;
    var COMMENT_NODE = 8;
    var DOCUMENT_NODE = 9;
    var DOCUMENT_TYPE_NODE = 10;
    var DOCUMENT_FRAGMENT_NODE = 11;
    var NOTATION_NODE = 12;
    var VIEW_MARGIN = 10;
    var SIZE_BUFFER = 50;

    // Global utils--------------------------------------------------------------------------------
    var parsePoint = function (pos) {
        if (pos)
            if (pos.x)
                return pos;
            else {
                var points = pos.split(";");
                return { x: points[0], y: points[1] };
            }
        else
            return { x: 0, y: 0 };
    };

    // let's call this an extension method to the Array object
    Array.prototype.contains = function (obj) {
        var i = this.length;
        while (i--) {
            if (this[i] === obj) {
                return true;
            }
        }
        return false;
    };

    dataviz.SVGView.prototype.createMarker = function (options) {
        return new SVGMarker(options);
    };

    var SVGMarker = dataviz.ViewElement.extend({
        init: function (options) {
            var marker = this;
            dataviz.ViewElement.fn.init.call(marker, options);
            switch (options.captype) {
                case 'ArrowStart':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'   refX='50' refY='50' " +
	                     "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#' >" +
	                     " <path stroke-width='10' d='m0,50l100,40l-30,-40l30,-40l-100,40z' stroke='#= d.options.stroke#' fill='#= d.options.stroke#'/>" +
	                    "</marker>");
                    break;
                case 'ArrowEnd':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'  refX='50' refY='50' " +
	                    "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#' >" +
	                     " <path stroke-width='10' d='m100,50l-100,40l30,-40l-30,-40z' stroke='#= d.options.stroke#' fill='#= d.options.stroke#'/>" +
	                    "</marker>");
                    break;
                case 'OpenArrowStart':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'   refX='50' refY='50' " +
	                     "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#' >" +
	                     " <path stroke-width='10' d='m0,50l100,40l-30,-40l30,-40l-100,40z' stroke='#= d.options.stroke#' fill='none'/>" +
	                    "</marker>");
                    break;
                case 'OpenArrowEnd':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'   refX='50' refY='50' " +
	                     "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#' >" +
	                     " <path stroke-width='10' d='m100,50l-100,40l30,-40l-30,-40z' stroke='#= d.options.stroke#' fill='none'/>" +
	                    "</marker>");
                    break;
                case 'FilledCircle':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'  refX='50' refY='50' " +
	                    "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#'>" +
	                    "<circle stroke-width='10' stroke='#= d.options.stroke#' fill='#= d.options.stroke#' cy='50' cx='50' r='30'/>" +
	                    "</marker>");
                    break;
                case 'Circle':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'  refX='50' refY='50' " +
	                    "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#' >" +
	                    "<circle stroke-width='10' stroke='#= d.options.stroke#' fill='none' cy='50' cx='50' r='30'/>" +
	                    "</marker>");
                    break;
                case 'FilledDiamond':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'  refX='50' refY='50' " +
	                    "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#' >" +
	                    " <path transform='rotate(45, 50, 50)' stroke-width='10' stroke='#= d.options.stroke#' fill='#= d.options.stroke#' d='m20,20l0,60l60,0l0,-60l-60,0z'/>" +
	                    "</marker>");
                    break;
                case 'Diamond':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'  refX='50' refY='50' " +
	                    "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#' >" +
	                    " <path transform='rotate(45, 50, 50)' stroke-width='10' stroke='#= d.options.stroke#' fill='none' d='m20,20l0,60l60,0l0,-60l-60,0z'/>" +
	                    "</marker>");
                    break;
                case 'WedgeStart':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'  refX='50' refY='50' " +
	                    "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#'>" +
	                    "<path d='m0,50l100,40l-94,-40l94,-40l-100,40z' fill='none'  stroke='#= d.options.stroke#' stroke-width='10'/>" +
	                    "</marker>");
                    break;
                case 'WedgeEnd':
                    marker.template = dataviz.ViewElement.template = dataviz.renderTemplate(
                    "<marker id='#= d.options.id #'  refX='50' refY='50' " +
	                    "#= d.renderAttr(\"markerHeight\", d.options.height) #" +
	                     "#= d.renderAttr(\"markerWidth\", d.options.width) #" +
	                    "  viewBox='0 0 100 100' orient='#= d.options.orient#' >" +
	                    "<path transform='rotate(180, 50, 50)' d='m0,50l100,40l-94,-40l94,-40l-100,40z' fill='#= d.options.stroke#' stroke='#= d.options.stroke#' stroke-width='10'/>" +
	                    "</marker>");
                    break;

                default:
                    alert(options.captype);

            }

        },
        options: {}
    });

    /// SVG diagram shape;
    /// the 'props' param expects the 'props.geometry' of type string (supposedly respresenting string geometry) and 'props.position' as a '{x:,y:}' object.
    /// Other properties of interest are fill, fillOpacity, stroke, rotation, strokeWidth, title, width, height.
    var SVGDiagramShape = dataviz.SVGPath.extend({
        init: function (props) {
            var shape = this;
            dataviz.SVGPath.fn.init.call(shape, props);
            shape.template = dataviz.SVGPath.template = dataviz.renderTemplate(
                    "<g #= d.renderAttr(\"id\", 'g-' + d.options.id) # class='diagramShapeGroup'><path #=d.renderAttr(\"id\", 'path-'+ d.options.id)#" +
                    "#= d.renderDataAttributes() # " +
                    "d='#= d.renderPoints() #' " +
                    "#= d.renderAttr(\"stroke\", d.options.stroke) # " +
                    "#= d.renderAttr(\"stroke-width\", d.options.strokeWidth) #" +
                    "#= d.renderDashType() # " +
                    "stroke-linecap='#= d.renderLinecap() #' " +
                    "stroke-linejoin='round' " +
					 "class='diagramShape' " +
                    "fill-opacity='#= d.options.fillOpacity #' " +
                    "stroke-opacity='#= d.options.strokeOpacity #' " +
                    "stroke-width='#= d.options.strokeWidth #' " +
                    "fill='#= d.renderFill() #'></path>"
			/*+ "<foreignObject x='0'  width='#= d.options.width #px' height='#= d.options.height #px' ><p align='center' style='vertical-align:middle; color:#= d.options.fontfill #; font-family: #= d.options.fontfamily#; font-size:#= d.options.fontsize #px' xmlns='http://www.w3.org/1999/xhtml'>#= d.options.title || '' #</p></foreignObject>"*/

	                  + "<text style='text-anchor:middle;dominant-baseline:central' font-family='#= d.options.fontfamily #'  #=d.renderAttr(\"id\", 'content-'+ d.options.id)#"
							+ "fill='#= d.options.fontfill #' font-size='#= d.options.fontsize #' x='#= d.options.width/2 #' y ='#= d.options.height/2 #'>#= d.options.title || '' #</text>"
	                 + "</g>"
                );
            shape.d = props.geometry; //supposedly the string geometry
        },
        translate: function () {
            return this.options.position ? "transform='translate(" + this.options.position.x + "," + this.options.position.y + ")'" : "";
        },
        renderPoints: function () {
            /// <summary>
            /// Overrides the SVGPath method which returns the (string) path geometry.
            /// </summary>
            return this.d;
        }
    });

    /// SVG diagram connection;
    /// the props param expects 'props.source' and 'props.target' of type SVGDiagramShape
    var SVGDiagramStraightConnection = dataviz.SVGPath.extend({
        init: function (props) {
            var connection = this;
            dataviz.SVGPath.fn.init.call(connection, props);

            connection.template = dataviz.SVGPath.template = dataviz.renderTemplate(
                    "<g #= d.renderAttr(\"id\", d.options.id) # class='diagramConnectionGroup'><path " +
                    "#= d.renderDataAttributes() # " +
                    "d='#= d.renderPoints() #' " +
                    "#= d.renderAttr(\"stroke\", d.options.stroke) # " +
                    "#= d.renderAttr(\"stroke-width\", d.options.strokeWidth) #" +
                    "#= d.renderAttr(\"marker-end\", d.options.endmarker) #" +
	                 "#= d.renderAttr(\"marker-start\", d.options.startmarker) #" +
                    "#= d.renderDashType() # " +
                    "stroke-linecap='#= d.renderLinecap() #' " +
                    "stroke-linejoin='round' " +
					 "class='diagramConnection' " +
                    "fill-opacity='#= d.options.fillOpacity #' " +
                    "stroke-opacity='#= d.options.strokeOpacity #' " +
                    "stroke-width='#= d.options.strokeWidth #' " +
                    "stroke-dasharray='#= d.options.strokedasharray #' " +
                    "fill='#= d.renderFill() #'></path></g>"
                );
            connection.d = props.geometry; //supposedly the string geometry
            connection.source = props.source;
            connection.target = props.target;
        },
        renderPoints: function () {
            var firstPoint = parsePoint(this.options.startpoint);
            var secondPoint = parsePoint(this.options.endpoint);
            var x1 = parseFloat(firstPoint.x);
            var y1 = parseFloat(firstPoint.y);
            var x2 = parseFloat(secondPoint.x);
            var y2 = parseFloat(secondPoint.y);

            if (this.options.type == "Straight") {
                return "M" + x1 + "," + y1 + "L" + x2 + "," + y2;
            }
            else ////if (this.options.type == "Bezier") 
            {
                var bx1 = x1;
                var by1 = y1 + (y2 - y1) / 2;
                var bx2 = x2;
                var by2 = by1;

                return "M" + x1 + "," + y1 + "C" + bx1 + "," + by1 + " " + bx2 + "," + by2 + " " + x2 + "," + y2;
            }
            return "";
        }
    });

    // Diagram Widget--------------------------------------------------------------------------------
    var Diagram = Widget.extend({
        /// <summary>
        /// Initializes the diagram widget.
        /// </summary>
        init: function (element, userOptions) {
            var diagram = this;
            Widget.fn.init.call(diagram, element);
            diagram.element = element;
            // merge the options
            $.extend(diagram.options, userOptions);

            if (diagram.options.XML) {
                var xmlDoc = null;
                if (window.DOMParser) {
                    parser = new DOMParser();
                    xmlDoc = parser.parseFromString(diagram.options.XML, "text/xml");
                }
                else //// older versions of Internet Explorer
                {
                    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                    xmlDoc.async = false;
                    xmlDoc.loadXML(diagram.options.XML);
                }
                this.loadDiagram(xmlDoc);
            }
            else if (diagram.options.url) {
                this.loadXML(diagram.options.url, "text/xml");
            }
        },
         
        getId: function (doc) {
            return doc.Properties.id;
        },
        getWidth: function (d, allowAuto) {
            var raw = d.Properties.size;
            if (raw) {
                var parts = raw.split(';');
                if (allowAuto || parts[0] != 'Auto')
                    return parts[0]
                else
                    return 100;
            }
            return 100;
        },
        getHeight: function (d, allowAuto) {
            var raw = d.Properties.size;
            if (raw) {
                var parts = raw.split(';');
                if (allowAuto || parts[1] != 'Auto')
                    return parts[1]
                else
                    return 100;
            }
            return 100;
        },
        getBBox: function (item) {
            return item.getBBox();
        },
        getFontSize: function (d) {
            var raw = d.Properties.fontsize;
            if (raw) {
                return raw;
            }
            return 11;
        },
        getFontFamily: function (d) {
            var raw = d.Properties.fontfamily;
            if (raw) {
                return raw;
            }
            return 'Segoe UI';
        },
        getTitle: function (d) {
            return d.Properties.content;
            /*var raw = d.Properties.Content;
			return raw ? raw : null;*/
        },
        getPosition: function (d) {
            var raw = d.Properties.position;
            /*if (raw)
			{
			return "translate(" + raw.X + "," + raw.Y + ")";
			}
			return "";*/
            return parsePoint(raw);
        },
        getGeometry: function (d) {
            var raw = d.Properties.geometry;
            //console.log('Found geometry: ' + raw);
            if (raw && raw.indexOf("F1") == 0)
                raw = raw.substring(2);

            return raw ? raw : "";
        },
        getRotation: function (d) {
            var raw = d.Properties.rotationangle;
            return raw ? raw : 0.0;
        },
        getBackground: function (d) {
            return this.getColor(d, "background", "#CCCCCC");
        },
        getForeground: function (d) {
            return this.getColor(d, "foreground", "#525252");
        },
        getStroke: function (d) {
            return this.getColor(d, "stroke", "#888888");
        },
        getBorderBrush: function (d) {
            return this.getColor(d, "borderbrush", "#888888");
        },
        getStrokeWidth: function (d) {
            var raw = d.Properties.strokethickness;
            return raw ? raw : 1.0;
        },
        getFillOpacity: function (d) {
            var alpha = 1.0;
            if (d.Properties.Background) {
                var rx = /^#([0-9a-f]{2})[0-9a-f]{6}$/i;
                var m = d.Properties.Background.match(rx);
                if (m) {
                    alpha = parseInt(m[1], 16) / 255;
                }
            }
            return alpha;
        },
        getSourceId: function (d) {
            var raw = d.Properties.source;
            return raw ? raw : null;
        },
        getTargetId: function (d) {
            var raw = d.Properties.target;
            return raw ? raw : null;
        },
        getStartPoint: function (d) {
            var raw = d.Properties.startpoint;
            return raw ? raw : null;
        },
        getEndPoint: function (d) {
            var raw = d.Properties.endpoint;
            return raw ? raw : null;
        },
        getConnectionType: function (d) {
            var raw = d.Properties.connectiontype;
            return raw ? raw : null;
        },
        getDashArray: function (d) {
            var raw = d.Properties.strokedasharray;
            return raw ? raw : null;
        },
        getSourceCapSize: function (d) {
            var raw = d.Properties.sourcecapsize;
            if (raw) {
                var split = raw.split(';');
                return { w: split[0], h: split[1] };
            }
            return { w: 0, h: 0 };
        },
        getTargetCapSize: function (d) {
            var raw = d.Properties.targetcapsize;
            if (raw) {
                var split = raw.split(';');
                return { w: split[0], h: split[1] };
            }
            return { w: 0, h: 0 };
        },
        getSourceCapReference: function (d, props) {
            return this.getCap(d, this.view, props, true);
        },
        getTargetCapReference: function (d, props) {
            return this.getCap(d, this.view, props, false);
        },
        getColor: function (d, property, defaultColor) {
            var raw = d.Properties[property];
            if (raw)
                return "#" + raw.substring(3, 9);
            else {
                if (d.Items && d.Items.length > 0) {
                    for (var i = 0; i < d.Items.length; i++) {
                        if (d.Items[i].Tag == property) {
                            var b = d.Items[i];
                            if (b.Items.length > 0) {
                                if (b.Items[0].Tag == "solidcolorbrush") {
                                    var p = b.Items[0].Properties.color;
                                    return "#" + p.substring(3, 9);
                                }
                                else if (b.Items[0].Tag == "lineargradientbrush") {
                                    var lingrad = b.Items[0];
                                    var stops = [];
                                    var startPoint = parsePoint(lingrad.Properties.startpoint);
                                    var endPoint = parsePoint(lingrad.Properties.endpoint);
                                    var angle = 180 * Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) / Math.PI;
                                    for (var j = 0; j < lingrad.Items.length; j++) {
                                        var gradstop = lingrad.Items[j];
                                        stops.push({
                                            offset: gradstop.Properties.offset,
                                            color: '#' + gradstop.Properties.color.substring(3, 9),
                                            opacity: 1 //should convert the first two chars of the color
                                        });
                                    }
                                    stops.sort(function (x, y) {
                                        return x.offset - y.offset;
                                    });
                                    var graddef = { angle: angle, stops: stops, type: "linear" };

                                    return graddef;
                                }
                                else if (b.Items[0].Tag == "radialgradientbrush") {
                                    var lingrad = b.Items[0];
                                    var stops = [];
                                    var origin = parsePoint(lingrad.Properties.origin);
                                    var radiusX = parseFloat(lingrad.Properties.radiusx);
                                    var radiusY = parseFloat(lingrad.Properties.radiusy);
                                    for (var j = 0; j < lingrad.Items.length; j++) {
                                        var gradstop = lingrad.Items[j];
                                        stops.push({
                                            offset: gradstop.Properties.offset,
                                            color: '#' + gradstop.Properties.color.substring(3, 9),
                                            opacity: 1 //should convert the first two chars of the color
                                        });
                                    }
                                    stops.sort(function (x, y) {
                                        return x.offset - y.offset;
                                    });
                                    var graddef = { origin: origin, stops: stops, r: (radiusX + radiusY) * 50, type: "radial" };

                                    return graddef;
                                }

                            }
                            break;
                        }
                    }
                }
            }
            return defaultColor;
        },
        getCap: function (d, view, props, isSource) {
            var direction = isSource ? 'Source' : 'Target';
            var directionCapType = isSource ? 'sourcecaptype' : 'targetcaptype';
            var directionCapSize = isSource ? 'sourcecaptype' : 'targetcaptype';
            var getName = function (name) {
                return name + '-' + direction + '-' + id;
            };
            var raw = d.Properties[directionCapType];
            if (raw) {
                if (raw == 'None')
                    return null;
                else {
                    var id = d.Properties.id;
                    var w = isSource ? props.sourcecapsize ? props.sourcecapsize.w : 0 : props.targetcapsize ? props.targetcapsize.w : 0;
                    var h = isSource ? props.sourcecapsize ? props.sourcecapsize.h : 0 : props.targetcapsize ? props.targetcapsize.h : 0;
                    var orient = 0;
                    if (!isSource)
                        orient = this.calculateMarkerAngle(d.Properties.startpoint, d.Properties.endpoint);
                    else
                        orient = this.calculateMarkerAngle(d.Properties.endpoint, d.Properties.startpoint);
                    var name;
                    switch (raw) {
                        case 'Arrow1':
                            name = getName('Arrow1')
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'OpenArrowStart', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow1Filled':
                            name = getName('Arrow1Filled');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'ArrowStart', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow2':
                            name = getName('Arrow2');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'OpenArrowStart', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow2Filled':
                            name = getName('Arrow2Filled');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'ArrowStart', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow3':
                            name = getName('Arrow3');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'WedgeStart', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow4':
                            name = getName('Arrow4');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'OpenArrowStart', width: w, height: h, orient: orient }); return 'url(#' + name + ')';
                        case 'Arrow4Filled':
                            name = getName('Arrow4Filled');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'ArrowStart', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow5': // open diamond
                            name = getName('Arrow5');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'Diamond', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow5Filled': //filled diamond
                            name = getName('Arrow5Filled');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'FilledDiamond', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow6': // open circle
                            name = getName('Arrow6');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'Circle', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        case 'Arrow6Filled': // filled circle
                            name = getName('Arrow6Filled');
                            view.definitions[name] = view.createMarker({ id: name, stroke: props.stroke, captype: 'FilledCircle', width: w, height: h, orient: orient });
                            return 'url(#' + name + ')';
                        default:
                    }
                    return raw;
                }
            }
            return null;
        },
        calculateMarkerAngle: function (startPoint, endPoint) {
            var distante = this.calculateDistance(startPoint, endPoint);

            if (startPoint.x <= endPoint.x && startPoint.y <= endPoint.y) {
                return 180 + (Math.asin((endPoint.y - startPoint.y) / distante) * 180 / Math.PI);
            }
            else if (startPoint.x > endPoint.x && startPoint.y < endPoint.y) {
                return 270 + (Math.asin((startPoint.x - endPoint.x) / distante) * 180 / Math.PI);
            }
            else if (startPoint.x >= endPoint.x && startPoint.y > endPoint.y) {
                return Math.asin((startPoint.y - endPoint.y) / distante) * 180 / Math.PI;
            }
            else {
                return 90 + Math.asin((endPoint.x - startPoint.x) / distante) * 180 / Math.PI;
            }
        },
        calculateDistance: function (startPoint, endPoint) {
            return Math.sqrt((startPoint.x - endPoint.x) * (startPoint.x - endPoint.x) + (startPoint.y - endPoint.y) * (startPoint.y - endPoint.y));
        },
        findMinRotatedPosition: function (props) {
            var point1 = this.rotate(0, 0, props.width, props.height, props.rotation);
            var point2 = this.rotate(props.width, 0, props.width, props.height, props.rotation);
            var point3 = this.rotate(0, props.height, props.width, props.height, props.rotation);
            var point4 = this.rotate(props.width, props.height, props.width, props.height, props.rotation);

            return { x: Math.min(point1.newX, point2.newX, point3.newX, point4.newX), y: Math.min(point1.newY, point2.newY, point3.newY, point4.newY) };
        },
        findMaxRotatedPosition: function (props) {
            var point1 = this.rotate(0, 0, props.width, props.height, props.rotation);
            var point2 = this.rotate(props.width, 0, props.width, props.height, props.rotation);
            var point3 = this.rotate(0, props.height, props.width, props.height, props.rotation);
            var point4 = this.rotate(props.width, props.height, props.width, props.height, props.rotation);

            return { x: Math.max(point1.newX, point2.newX, point3.newX, point4.newX), y: Math.max(point1.newY, point2.newY, point3.newY, point4.newY) };
        },
        rotate: function (pointX, pointY, rectWidth, rectHeight, angle) {
            // convert angle to radians
            angle = angle * Math.PI / 180.0
            // calculate center of rectangle
            var centerX = rectWidth / 2.0;
            var centerY = rectHeight / 2.0;
            // get coordinates relative to center
            var dx = pointX - centerX;
            var dy = pointY - centerY;
            // calculate angle and distance
            var a = Math.atan2(dy, dx);
            var dist = Math.sqrt(dx * dx + dy * dy);
            // calculate new angle
            var a2 = a + angle;
            // calculate new coordinates
            var dx2 = Math.cos(a2) * dist;
            var dy2 = Math.sin(a2) * dist;
            // return coordinates relative to top left corner
            return { newX: dx2 + centerX, newY: dy2 + centerY };
        },
        view: {},
        model: {},
        options: { name: "Diagram" },

        /// <summary>
        /// Loading of XML data.
        /// </summary>
        loadXML: function (url, mime) {
            if (arguments.length < 2) {
                mime = null;
            }

            this.xmlHandler(url, mime);
        },

        /// <summary>
        /// Async fetching of XML data.
        /// </summary>
        xmlHandler: function (url, mime) {

            var diagram = this;
            var req = new XMLHttpRequest;
            if (mime && req.overrideMimeType)
                req.overrideMimeType(mime);
            req.open("GET", url, true);
            if (mime)
                req.setRequestHeader("Accept", mime);

            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    if ((req.status >= 200 && req.status < 300 || req.status === 304) && req.responseXML)
                        diagram.loadDiagram(req.responseXML)
                }
            };
            req.send(null);
        },

        /// <summary>
        /// Loads the XML document in the diagram widget.
        /// </summary>
        loadDiagram: function (xml) {
            this.model = this.xmlToJson(xml);
            this.redraw();
        },

        /// <summary>
        /// Converts the given XML document to a JS literal object.
        /// </summary>
        xmlToJson: function (xml) {
            var obj = {};
            var pointLikeProps = ["Position", "StartPoint", "EndPoint"];
            if (xml.nodeType == ELEMENT_NODE) {
                obj["Tag"] = xml.nodeName.toLowerCase();
                // do attributes
                if (xml.attributes.length > 0) {
                    obj["Properties"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes.item(j);
                        if (pointLikeProps.contains(attribute.nodeName)) {
                            var parts = attribute.nodeValue.split(';');
                            obj["Properties"][attribute.nodeName.toLowerCase()] = { x: parseFloat(parts[0]), y: parseFloat(parts[1]) };
                        }
                        else
                            obj["Properties"][attribute.nodeName.toLowerCase()] = attribute.nodeValue;
                    }
                    if (!obj["Properties"].hasOwnProperty("content"))
                        obj["Properties"]["content"] = null;
                }
                if (xml.hasChildNodes()) {
                    obj["Items"] = [];
                    for (var k = 0; k < xml.childNodes.length; k++) {
                        var item = xml.childNodes.item(k);
                        if (item.nodeType != ELEMENT_NODE) continue;
                        obj["Items"].push(this.xmlToJson(item));
                    }
                }
            }
            else if (xml.nodeType == DOCUMENT_NODE) {
                var children = xml.documentElement.childNodes;
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (child.nodeType != TEXT_NODE) {
                        var name = child.nodeName.toLowerCase();
                        obj[name] = this.xmlToJson(child);
                        //console.log(name);
                    }
                }
            }

            return obj;
        },

        /// <summary>
        /// Repaints the diagram widget.
        /// </summary>
        redraw: function () {
            var el = this.element;
            var svg = this.getSVG();
            if (svg == null) return;

            this.renderSVG(el, svg);

            var shapes = this.model.shapes.Items;
            if (shapes == undefined || shapes == null)
                return;

            // postprocessing of size because the initial size is only known after it's drawn
            for (var i = 0; i < shapes.length; i++) {
                var shape = shapes[i];
                var w = this.getWidth(shape, true);
                var h = this.getHeight(shape, true);
                var p = this.getPosition(shape);
                var r = this.getRotation(shape); // * Math.PI/180;
                var item = document.getElementById('path-' + shape.Properties.id); //gets the path, not the layer since the text will bias the values!
                var textContent = document.getElementById('content-' + shape.Properties.id); //gets the text content.
                var parentLayer = document.getElementById('g-' + shape.Properties.id);
                var bb = this.getBBox(item); //bounding box
                if (textContent) {
                    if (w == 'Auto')
                        textContent.setAttribute("x", bb.width / 2);
                    if (h == 'Auto')
                        textContent.setAttribute("y", bb.height / 2);
                }
                var layerMatrix = "translate(" + p.x + "," + p.y + ")" + "rotate(" + r + "," + ((w == 'Auto' ? 100 : w) / 2) + "," + ((h == 'Auto' ? 100 : h) / 2) + ")";
                var shapeMatrix = "scale(" + (w != 'Auto' ? w : bb.width) / bb.width + "," + (h != 'Auto' ? h : bb.height) / bb.height + ")";
                parentLayer.setAttribute("transform", layerMatrix);
                item.setAttribute("transform", shapeMatrix);
            }

            $(this.element).trigger("completed");
        },

        /// <summary>
        /// Returns the SVG of this diagram widget.
        /// </summary>
        getSVG: function () {
            if (!this.model || this.model == {})
                return null;

            this.view = new dataviz.SVGView();

            var mainLayer = this.view.createGroup();
            mainLayer.template = dataviz.SVGGroup.template =
                dataviz.renderTemplate(
                    "<g #= d.renderAttr(\"id\", d.options.id) #" +
                    "#= d.renderDataAttributes() #" +
                    "#= d.renderAttr(\"clip-path\", d.options.clipPath) #" +
                    "#= d.renderAttr(\"transform\", d.options.transform) #>" +
                    "#= d.renderContent() #</g>"
                );

            mainLayer.options.id = "mainLayer";

            var shapeLayer = this.view.createGroup();
            shapeLayer.options.id = "shapeLayer";
            mainLayer.children.push(shapeLayer);

            var connectionLayer = this.view.createGroup();
            connectionLayer.options.id = "connectionLayer";
            mainLayer.children.push(connectionLayer);

            var shapes = this.model.shapes.Items;
            if (shapes) {
                shapes.sort(function (a, b) {
                    return a.Properties.zindex - b.Properties.zindex;
                });
            }
            var shapeIds = [];
            var getShape = function (id) {
                return shapeIds[id];
            };

            var minX = Infinity;
            var maxX = -Infinity;

            var minY = Infinity;
            var maxY = -Infinity;

            if (shapes) {
                for (var k = 0; k < shapes.length; k++) {
                    var shape = shapes[k];
                    var shapeProps = {
                        position: this.getPosition(shape),
                        geometry: this.getGeometry(shape),
                        fillOpacity: this.getFillOpacity(shape),
                        id: this.getId(shape),
                        stroke: this.getBorderBrush(shape),
                        rotation: this.getRotation(shape),
                        strokeWidth: this.getStrokeWidth(shape),
                        title: this.getTitle(shape),
                        width: this.getWidth(shape),
                        height: this.getHeight(shape),
                        fontsize: this.getFontSize(shape),
                        fontfill: this.getForeground(shape),
                        fontfamily: this.getFontFamily(shape)
                    };

                    var minRotatedPosition = undefined;
                    var maxRotatedPosition = undefined;
                    if (shapeProps.rotation != 0 && shapeProps.rotation != 180) {
                        minRotatedPosition = this.findMinRotatedPosition(shapeProps);
                        maxRotatedPosition = this.findMaxRotatedPosition(shapeProps);
                    }

                    var newMinPos = minRotatedPosition ? { x: parseInt(shapeProps.position.x) + parseInt(minRotatedPosition.x), y: parseInt(shapeProps.position.y) + parseInt(minRotatedPosition.y) } : shapeProps.position;
                    var newMaxPos = maxRotatedPosition ? { x: parseInt(shapeProps.position.x) + parseInt(maxRotatedPosition.x), y: parseInt(shapeProps.position.y) + parseInt(maxRotatedPosition.y) } :
																 { x: parseInt(shapeProps.position.x) + parseInt(shapeProps.width), y: parseInt(shapeProps.position.y) + parseInt(shapeProps.height) };

                    minX = Math.min(minX, newMinPos.x);
                    maxX = Math.max(maxX, newMaxPos.x);

                    minY = Math.min(minY, newMinPos.y);
                    maxY = Math.max(maxY, newMaxPos.y);

                    var bg = this.getBackground(shape);
                    if (typeof (bg) == 'string') {
                        shapeProps.fill = bg;
                    } else //// a gradient definition object
                    {
                        var gradname = 'gr-' + shapeProps.id;
                        var refname = '#' + gradname;
                        shapeProps.fill = "url(" + refname + ")";
                        var gr = undefined;
                        if (bg.type == "linear")
                            gr = this.view.createGradient({ id: gradname, stops: bg.stops, rotation: bg.angle, type: "linear" });
                        else
                            gr = this.view.createGradient({ id: gradname, cx: bg.origin.x * 100, cy: bg.origin.y * 100, r: bg.r, fx: bg.origin.x * 100, fy: bg.origin.y * 100, stops: bg.stops, type: "radial" });

                        this.view.definitions[refname] = gr;
                    }

                    var diagramShape = new SVGDiagramShape(shapeProps);
                    shapeLayer.children.push(diagramShape);
                    shapeIds[shapeProps.id] = diagramShape;
                }
            }
            var connections = this.model.connections.Items;
            if (connections) {
                for (var i = 0; i < connections.length; i++) {
                    var connection = connections[i];
                    var connectionProps = {
                        stroke: this.getStroke(connection),
                        source: getShape(this.getSourceId(connection)),
                        target: getShape(this.getTargetId(connection)),
                        strokeWidth: this.getStrokeWidth(connection),
                        type: this.getConnectionType(connection),
                        startpoint: this.getStartPoint(connection),
                        endpoint: this.getEndPoint(connection),
                        strokedasharray: this.getDashArray(connection),
                        sourcecapsize: this.getSourceCapSize(connection),
                        targetcapsize: this.getTargetCapSize(connection)
                    };

                    var startP = parsePoint(connectionProps.startpoint);
                    var endP = parsePoint(connectionProps.endpoint);

                    minX = Math.min(minX, Math.min(startP.x, endP.x));
                    maxX = Math.max(maxX, Math.max(startP.x, endP.x));

                    minY = Math.min(minY, Math.min(startP.y, endP.y));
                    maxY = Math.max(maxY, Math.max(startP.y, endP.y));

                    connectionProps.startmarker = this.getSourceCapReference(connection, connectionProps);
                    connectionProps.endmarker = this.getTargetCapReference(connection, connectionProps);

                    var con = new SVGDiagramStraightConnection(connectionProps);
                    connectionLayer.children.push(con);
                }
            }

            mainLayer.options.transform = "translate(" + (VIEW_MARGIN - minX) + "," + (VIEW_MARGIN - minY) + ")";

            var width = Math.abs(maxX - minX);
            this.view.options.width = width + (2 * SIZE_BUFFER);

            var height = Math.abs(maxY - minY);
            this.view.options.height = height + (2 * SIZE_BUFFER);

            this.view.children = [mainLayer];

            return this.view.render();
        },    

        /// <summary>
        /// Renders the SVG island into the given jQuery selection.
        /// </summary>
        renderSVG: function (container, svg) {
            container.innerHTML = svg;
        }
    });

    // turn all this into a Kendo API element
    dataviz.ui.plugin(Diagram);
})(jQuery);
