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
function OnLoaded()
{
    var App = new DiagramApplication.Application();
    App.OnLoaded();

    var undoButton = document.getElementById("UndoButton");
    undoButton.onclick = function () { App.Undo(); };

    var redoButton = document.getElementById("RedoButton");
    redoButton.onclick = function () { App.Redo(); };

    var deleteButton = document.getElementById("DeleteButton");
    deleteButton.onclick = function () { App.Delete(); };

    var selectAllButton = document.getElementById("SelectAllButton");
    selectAllButton.onclick = function () { App.SelectAll(); };

}

module DiagramApplication
{
    import space = module(RadDiagram)
    import SVGSpace = module(RadSVG)

    export class Application
    {
        private diagram: space.Diagram;
        public OnLoaded()
        {

            var hostdiv = <HTMLDivElement>document.getElementById('canvas');
            if (hostdiv == null) throw "The DIV with name 'canvas' is missing.";
            this.diagram = new space.Diagram(hostdiv);

            // just a simple diagram to get you started
            Samples.SimpleDiagram(this.diagram);
        }
        public Undo()
        {
            this.diagram.Undo();
        }

        public SelectAll()
        {
            this.diagram.SelectAll();
        }

        public Delete()
        {
            this.diagram.Delete(true);
        }

        public Redo()
        {
            this.diagram.Redo();
        }

        public get Diagram()
        {
            return this.diagram;
        }
    }

    export class Samples
    {

        private static AddShape(diagram: space.Diagram, p: svg.Point = svg.Point.Empty, shape: space.IShapeTemplate = space.Shapes.Rectangle, id: string = null)
        {
            shape.Position = p;
            shape.Width = 200;
            shape.Height = 100;
            shape.Id = id;
            shape.Background = "#778899";
            return diagram.AddShape(shape);

        }

        private static AddCircle(canvas: svg.Canvas, p: svg.Point, radius: number = 25)
        {
            var circ = new SVGSpace.Circle();
            circ.Position = p;
            circ.Radius = radius;
            circ.Background = "Orange";
            canvas.Append(circ);
            return circ;
        }

        private static AddConnection(diagram: space.Diagram, from: space.Connector, to: space.Connector)
        {
            return diagram.AddConnection(from, to);
        }

        /**
         * A simple diagram to demonstrate the current features.
         * @param diagram The diagram in which the sample should be generated.
         */
        public static SimpleDiagram(diagram: space.Diagram)
        {
            var shape1 = this.AddShape(diagram, new svg.Point(100, 100), space.Shapes.SequentialData);
            shape1.Width = 100;
            shape1.Height = 100;
            shape1.Title = "Sequential Data."
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
        }
    }
}