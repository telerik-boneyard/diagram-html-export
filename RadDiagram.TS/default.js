/// <reference path="RadSVG/RadSVG.ts" />
/// <reference path="RadDiagram/RadDiagram.ts" />
/**
* Disclaimer:
* The TypeScript and SVG libraries allow a fully interactive diagramming
* experience, but are not released or supported as such yet.
* The only part supported for now is the export/import to/from XAML/XML.
* See the "Importer.html" file.
*/
/**
* Called when the body of the page is loaded.
*/
function OnLoaded() {
    var App = new DiagramApplication.Application();
    App.OnLoaded();
    var undoButton = document.getElementById("UndoButton");
    undoButton.onclick = function () {
        App.Undo();
    };
    var redoButton = document.getElementById("RedoButton");
    redoButton.onclick = function () {
        App.Redo();
    };
    var deleteButton = document.getElementById("DeleteButton");
    deleteButton.onclick = function () {
        App.Delete();
    };
    var selectAllButton = document.getElementById("SelectAllButton");
    selectAllButton.onclick = function () {
        App.SelectAll();
    };
}
var DiagramApplication;
(function (DiagramApplication) {
    var space = RadDiagram;
    var SVGSpace = RadSVG;
    var Application = (function () {
        function Application() { }
        Application.prototype.OnLoaded = function () {
            var hostdiv = document.getElementById('canvas');
            if(hostdiv == null) {
                throw "The DIV with name 'canvas' is missing.";
            }
            this.diagram = new space.Diagram(hostdiv);
            // just a simple diagram to get you started
            Samples.SimpleDiagram(this.diagram);
        };
        Application.prototype.Undo = function () {
            this.diagram.Undo();
        };
        Application.prototype.SelectAll = function () {
            this.diagram.SelectAll();
        };
        Application.prototype.Delete = function () {
            this.diagram.Delete(true);
        };
        Application.prototype.Redo = function () {
            this.diagram.Redo();
        };
        Object.defineProperty(Application.prototype, "Diagram", {
            get: function () {
                return this.diagram;
            },
            enumerable: true,
            configurable: true
        });
        return Application;
    })();
    DiagramApplication.Application = Application;    
    var Samples = (function () {
        function Samples() { }
        Samples.AddShape = function AddShape(diagram, p, shape, id) {
            if (typeof p === "undefined") { p = svg.Point.Empty; }
            if (typeof shape === "undefined") { shape = space.Shapes.Rectangle; }
            if (typeof id === "undefined") { id = null; }
            shape.Position = p;
            shape.Width = 200;
            shape.Height = 100;
            shape.Id = id;
            shape.Background = "#778899";
            return diagram.AddShape(shape);
        };
        Samples.AddCircle = function AddCircle(canvas, p, radius) {
            if (typeof radius === "undefined") { radius = 25; }
            var circ = new SVGSpace.Circle();
            circ.Position = p;
            circ.Radius = radius;
            circ.Background = "Orange";
            canvas.Append(circ);
            return circ;
        };
        Samples.AddConnection = function AddConnection(diagram, from, to) {
            return diagram.AddConnection(from, to);
        };
        Samples.SimpleDiagram = /**
        * A simple diagram to demonstrate the current features.
        * @param diagram The diagram in which the sample should be generated.
        */
        function SimpleDiagram(diagram) {
            var shape1 = this.AddShape(diagram, new svg.Point(100, 100), space.Shapes.SequentialData);
            shape1.Width = 100;
            shape1.Height = 100;
            shape1.Title = "Sequential Data.";
            var shape2 = this.AddShape(diagram, new svg.Point(100, 400));
            var shape3 = this.AddShape(diagram, new svg.Point(370, 400), space.Shapes.Wave);
            var shape4 = this.AddShape(diagram, new svg.Point(250, 600));
            var topCor = shape2.GetConnector("Top");
            var topCor2 = shape3.GetConnector("Top");
            var bottomCor = shape1.GetConnector("Bottom");
            var con = this.AddConnection(diagram, bottomCor, topCor);
            con.EndCap = svg.Markers.ArrowEnd;
            con.StartCap = svg.Markers.FilledCircle;
            var con2 = this.AddConnection(diagram, bottomCor, topCor2);
            con2.Content = "Connection Label";
        };
        return Samples;
    })();
    DiagramApplication.Samples = Samples;    
})(DiagramApplication || (DiagramApplication = {}));
//@ sourceMappingURL=default.js.map
