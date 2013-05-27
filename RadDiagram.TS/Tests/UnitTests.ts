/// <reference path="qunit.d.ts" />
/// <reference path="../RadSVG/RadSVG.ts" />
/// <reference path="../RadDiagram/RadDiagram.ts" />

import space = module(RadDiagram)
import SVGSpace = module(RadSVG)

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class Task implements space.IUndoUnit {
    public Count = 0;

    public Undo()
    {
        this.Count--;
    }

    public Title:string;

    constructor(title:string)
    {
        this.Title = title;
    }

    public Redo()
    {
        this.Count++;
    }

    public get IsEmpty():bool
    {
        return false;
    }
}
var lexicCount = function (c:number, name:string)
{
    switch (c)
    {
        case 0:
            return null;
        case 1:
            return "one " + name;
        default:
            return c + " " + name + "s";
    }
}
/*
 * Returns a summary of the found diagram objects in the given object.
 */
var CountObjects = function (obj)
{
    var items = [];
    if (obj.shapes && obj.shapes.Items) items.push(lexicCount(obj.shapes.Items.length, "shape"));
    if (obj.groups && obj.groups.Items) items.push(lexicCount(obj.groups.Items.length, "group"));
    if (obj.connections && obj.connections.Items) items.push(lexicCount(obj.connections.Items.length, "connection"));

    switch (items.length)
    {
        case 0:
            return "The XML contained an empty diagram.";
        case 1:
            return "Found " + items[0];
        case 2:
            return "Found " + items[0] + " and " + items[1];
        case 3:
            return "Found " + items[0] + ", " + items[1] + " and " + items[2];
    }

}
var Accuracy = 1E-6;
var AddShape = function (diagram:space.Diagram, p:svg.Point = svg.Point.Empty,
                         shape:space.IShapeTemplate = space.Shapes.Rectangle, id:string = null)
{
    shape.Position = p;
    shape.Width = 200;
    shape.Height = 100;
    shape.Id = id;
    shape.Background = "#778899";
    return diagram.AddShape(shape);

};
var AddCircle = function (canvas:svg.Canvas, p:svg.Point, radius:number = 25)
{
    var circ = new SVGSpace.Circle();
    circ.Position = p;
    circ.Radius = radius;
    circ.Background = "Orange";
    canvas.Append(circ);
    return circ;
}
var AddConnection = function (diagram:space.Diagram, from:space.Connector, to:space.Connector)
{
    return diagram.AddConnection(from, to);
};
/**
 * Get the root DIV and clears its contents.
 */
var GetRoot = function ()
{
    var root = <HTMLDivElement>document.getElementById('canvas');
    if (root == null) throw "The unit testing requires a DIV with name 'canvas'.";
    var children = root.childNodes;
    if (children.length > 0)
        for (var i = 0; i < children.length; i++)    root.removeChild(children[i]);
    return root;

};
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Utilities tests");
test("Range test", function ()
{
    var r = new svg.Range(10, 20);
    ok(r.length == 10, "Should have length 10.");
    r = new svg.Range(10, 20, 2);
    ok(r.length == 5, "Should have length 5.");
    r = new svg.Range(20, 10, -2);
    ok(r.length == 5, "Should have length 5.");
    r = new svg.Range(10, 20, .5);
    ok(r.length == 20, "Should have length 20.");

});

test("Flatten Array", function ()
{
    var ar = [
        [1],
        [2, 3],
        [4],
        [1],
        []
    ];
    var res = ar.flatten();
    ok(res.length == 5, "Should have length 4.");
    ok(res[0] == 1 && res[1] == 2 && res[2] == 3 && res[3] == 4 && res[4] == 1, "Should be merged to a flattened array.");
});

test("Distinct array", function ()
{
    var ar = [1, 2, 1, 3, 5, 4, 4];
    var d = ar.distinct();
    ok(d.length == 5, "Should have been reduced to distinct elements.");
});

test("Normal Distribution", function ()
{
    var n = svg.Random.NormalVariable();
    var r = svg.Range.Create(0, 100).map(i => n());
    ok(true, "Have to think about how to unit test the normal distribution...");
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("UndoRedo tests");
test("UndoRedoService basic", function ()
{
    // trying out a composite
    var ur = new space.UndoRedoService();
    var unit = new Task("Counting unit.");
    ur.begin();
    ur.AddCompositeItem(unit);
    ur.commit();
    ok(unit.Count == 1, "Unit was executed");
    ur.Undo();
    ok(ur.count() > 0, "The units are still there.")
    QUnit.equal(unit.Count, 0, "Unit undo was executed");
    ur.Redo();
    ok(unit.Count == 1, "Unit was executed");
    QUnit.raises(function ()
    {
        ur.Redo();
    }, "Supposed to raise an exception since we are passed the length of the stack.");
    ur.Undo();
    ok(unit.Count == 0, "Unit was executed");

    // immediate addition
    ur = new space.UndoRedoService();
    unit = new Task("Counting unit.");
    ur.Add(unit);
    ok(unit.Count == 1, "Unit was executed");
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Canvas tests");
test("Add Canvas", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);
    var found = document.getElementById('SVGRoot');
    ok(found != null, "The Canvas should add an <SVG/> element with name 'SVGRoot'.");

    root = GetRoot();
    var options = new SVGSpace.CanvasOptions();
    options.Width = 865;
    options.Height = 287;
    options.BackgroundColor = "#121217"
    var canvas = new SVGSpace.Canvas(root, options);
    var found = document.getElementById('SVGRoot');
    ok(parseFloat(found.style.width) == 865, "The width should be 865.");
    ok(parseFloat(found.style.height) == 287, "The height should be 287.");
    ok(found.style.backgroundColor == "rgb(18, 18, 23)");
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Rectangle tests");
test("Add Circle", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);

    var rec = new SVGSpace.Rectangle(canvas);
    rec.Position = new SVGSpace.Point(100, 121);
    rec.Width = 150;
    rec.Height = 88;
    rec.Background = "Red";
    rec.Id = "MyRectangle";

    canvas.Append(rec);

    var found = document.getElementById("MyRectangle");
    ok(found != null, "A SVG rectangle with name 'MyRectangle' should be in the HTML tree.");
    ok(found.attributes["width"].value == 150, "The width should be 150.");
    ok(found.attributes["height"].value == 88, "The height should be 287.");
    ok(found.style.fill == "#ff0000");
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Marker tests");
test("Add/Remove/Clear Marker", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);
    // add a dummy to check the defs tag is added as the first child
    AddCircle(canvas, new svg.Point(100, 120));
    var marker = new svg.Marker();
    marker.MarkerHeight = 21;
    marker.MarkerWidth = 44;
    marker.ViewBox = new svg.Rect(10, 20, 33, 55);
    marker.Id = "ArrowHead";
    marker.Orientation = svg.MarkerOrientation.Auto;
    canvas.AddMarker(marker);
    var found = document.getElementById("ArrowHead");
    ok(found != null, "Marker element should be there.");
    ok(found.attributes["viewBox"] != null, "The viewBox should be there");
    ok(found.attributes["orient"] != null && found.attributes["orient"].value == "auto", "The orientation should be there");
    var path = new svg.Path();
    path.Id = "SimpleDiagram";
    marker.Path = path;
    found = document.getElementById("SimpleDiagram");
    ok(found != null, "The path should be there.");
    path = new svg.Path();
    path.Id = "Second";
    marker.Path = path;
    found = document.getElementById("Second");
    ok(found != null, "The second path should be there.");
    var m = document.getElementById("ArrowHead");
    ok(m.childNodes.length == 1, "The path should have been replaced.");
    var line = new svg.Line();
    line.Id = "Line1";
    canvas.Append(line);
    line.MarkerEnd = marker;
    found = document.getElementById("Line1");
    ok(found.attributes["marker-end"] != null && found.attributes["marker-end"].value == "url(#ArrowHead)", "The end marker should be present.");
    var returnedMarker = line.MarkerEnd;
    ok(returnedMarker != null, "The marker was not found");
    ok(returnedMarker.Id == "ArrowHead", "Not the correct Id.");

    canvas.ClearMarkers();
    var defs = document.getElementsByTagName("defs");
    ok(defs != null && defs.length == 1, "Defs tag should still be there.");
    ok(defs[0].childNodes.length == 0, "All markers should be gone now.");

    canvas.Clear();
    var arrow = svg.Markers.ArrowEnd;
    arrow.Id = "Arrow1";
    canvas.AddMarker(arrow);
    found = document.getElementById("Arrow1");
    ok(found != null, "Marker element should be there.");
    canvas.RemoveMarker(arrow);
    found = document.getElementById("Arrow1");
    ok(found == null, "Marker element should not be there.");
    canvas.AddMarker(arrow);
    var line = new svg.Line();
    line.Id = "Line1";
    line.Stroke = "Red";
    arrow.Color = "Red";
    line.From = new svg.Point(100, 100);
    line.To = new svg.Point(300, 100);
    canvas.Append(line);
    line.MarkerEnd = arrow;
    canvas.ClearMarkers();
    ok(canvas.Markers.length == 0, "All markers gone now.");
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Circle tests");
test("Add Circle", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);

    var circ = new SVGSpace.Circle();
    circ.Position = new SVGSpace.Point(100, 121);
    circ.Radius = 150;
    circ.Background = "#345656";
    circ.Id = "MyCirc";
    circ.Position = new SVGSpace.Point(200, 200);
    canvas.Append(circ);

    var found = document.getElementById("MyCirc");
    ok(found != null, "A SVG circle with name 'MyCirc' should be in the HTML tree.");
    ok(found.attributes["r"].value == 150, "The radius should be 150.");
    ok(found.attributes["cx"].value == 350, "The center X value should be 200+150.");
    ok(found.style.fill == "#345656");
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Text tests");
test("Add Text", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);

    var text = new SVGSpace.TextBlock(canvas);
    text.Position = new SVGSpace.Point(100, 121);
    text.Text = "<<|Telerik|>>";
    text.Id = "MyText";
    text.Position = new SVGSpace.Point(234, 256);
    canvas.Append(text);

    var found = <SVGTextElement><Object>document.getElementById("MyText");
    ok(found != null, "A SVG text with name 'MyText' should be in the HTML tree.");
    ok(found.textContent == "<<|Telerik|>>", "The text should be '<< | Telerik | >>'.");
    ok(found.attributes["x"].value == 234, "The x should be 234.");
    ok(found.attributes["y"].value == 256, "The y should be 256.");
    text.Text = "changed";
    ok(found.textContent == "changed", "Text has changed.");

});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Group tests");
test("Add group", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);

    var g = new SVGSpace.Group();
    g.Position = new SVGSpace.Point(100, 100);
    g.Id = "G1";
    canvas.Append(g);

    var found = <SVGGElement><Object>document.getElementById("G1");
    ok(found != null, "A SVG group with name 'G1' should be in the HTML tree.");

    var rec = new SVGSpace.Rectangle(canvas);
    rec.Width = 50;
    rec.Height = 50;
    rec.Background = "Red";
    rec.Id = "MyRectangle";
    g.Append(rec);

});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Transformation tests");

test("Matrix calculus", function ()
{
    var m = SVGSpace.Matrix.Parse("matrix(1,2,3,4,5,6)");
    ok(m != null);
    ok(m.a == 1);
    ok(m.b == 2);
    ok(m.c == 3);
    ok(m.d == 4);
    ok(m.e == 5);
    ok(m.f == 6);

    m = SVGSpace.Matrix.Parse("matrix(1 2 3 4 5 6)");
    ok(m != null);
    ok(m.a == 1);
    ok(m.b == 2);
    ok(m.c == 3);
    ok(m.d == 4);
    ok(m.e == 5);
    ok(m.f == 6);

    m = SVGSpace.Matrix.Parse("(1,2,3,4,5,6)");
    ok(m != null);
    ok(m.a == 1);
    ok(m.b == 2);
    ok(m.c == 3);
    ok(m.d == 4);
    ok(m.e == 5);
    ok(m.f == 6);

    m = SVGSpace.Matrix.Parse("1,2,3,4,5,6");
    ok(m != null);
    ok(m.a == 1);
    ok(m.b == 2);
    ok(m.c == 3);
    ok(m.d == 4);
    ok(m.e == 5);
    ok(m.f == 6);

    m = RadSVG.Matrix.FromList([1, 2, 3, 4, 5, 6]);
    ok(m != null);
    ok(m.a == 1);
    ok(m.b == 2);
    ok(m.c == 3);
    ok(m.d == 4);
    ok(m.e == 5);
    ok(m.f == 6);

    m = RadSVG.Matrix.Translation(55, 66);
    ok(m != null);
    ok(m.a == 1);
    ok(m.b == 0);
    ok(m.c == 0);
    ok(m.d == 1);
    ok(m.e == 55);
    ok(m.f == 66);

    m = RadSVG.Matrix.Scaling(478, 2.5);
    ok(m != null);
    ok(m.a == 478);
    ok(m.b == 0);
    ok(m.c == 0);
    ok(m.d == 2.5);
    ok(m.e == 0);
    ok(m.f == 0);

    m = RadSVG.Matrix.FromMatrixVector(new RadSVG.MatrixVector(66, 55, 44, 33, 22, 11));
    ok(m != null);
    ok(m.a == 66);
    ok(m.b == 55);
    ok(m.c == 44);
    ok(m.d == 33);
    ok(m.e == 22);
    ok(m.f == 11);

    var a = RadSVG.Matrix.FromList([2.3, 4, 5, 0.6, 8.7, 7.01]);
    var b = RadSVG.Matrix.FromList([24.2, 48, 1, 0, 0, 71]);
    m = a.Times(b);
    ok(m != null);
    ok(m.a == 295.65999999999997);
    ok(m.b == 125.6);
    ok(m.c == 2.3);
    ok(m.d == 4);
    ok(m.e == 363.7);
    ok(m.f == 49.61);

    a = RadSVG.Matrix.Parse("Matrix(2.3, 4, 5, 0.6, 8.7, 7.01)");
    b = RadSVG.Matrix.Parse("matrix(24.2, 48, 1, 0, 0, 71)");
    m = a.Times(b);
    ok(m != null);
    ok(m.a == 295.65999999999997);
    ok(m.b == 125.6);
    ok(m.c == 2.3);
    ok(m.d == 4);
    ok(m.e == 363.7);
    ok(m.f == 49.61);
});
test("Translation", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);

    var rec = new SVGSpace.Rectangle(canvas);
    rec.Width = 50;
    rec.Height = 50;
    rec.Background = "Red";
    rec.Id = "MyRectangle";
    canvas.Append(rec);
    var trans = new SVGSpace.Translation(20, 25);
    rec.Transform(trans);

    var found = <SVGGElement><Object>document.getElementById("MyRectangle");
    ok(found != null, "A rectangle with name 'MyRectangle' should be in the HTML tree.");
    var matrix = found.getCTM();
    ok(matrix.e == 20);
    ok(matrix.f == 25);
    trans.Normalize();
    ok(Math.round(trans.Length) == 1);
    var trans2 = new SVGSpace.Translation(20, 25);
    rec.Transform(trans2);
    matrix = found.getCTM();
    ok(matrix.e == 40);
    ok(matrix.f == 50);

    rec = new SVGSpace.Rectangle(canvas);
    rec.Id = "123";
    canvas.Append(rec);
    found = <SVGGElement><Object>document.getElementById("123");
    found.setAttribute("transform", "translate(0 10) translate(20 30)");
    matrix = found.getCTM();
    ok(matrix.e == 20);
    ok(matrix.f == 40);

});

test("Scaling", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);

    var rec = new SVGSpace.Rectangle(canvas);
    rec.Width = 50;
    rec.Height = 50;
    rec.Background = "Red";
    rec.Id = "MyRectangle";
    canvas.Append(rec);
    var scaling = new SVGSpace.Scale(20, 25);
    rec.Transform(scaling);

    var found = <SVGGElement><Object>document.getElementById("MyRectangle");
    ok(found != null, "A rectangle with name 'MyRectangle' should be in the HTML tree.");
    var matrix = found.getCTM();
    ok(matrix.a == 20);
    ok(matrix.d == 25);

    rec = new SVGSpace.Rectangle(canvas);
    rec.Id = "123";
    canvas.Append(rec);
    found = <SVGGElement><Object>document.getElementById("123");
    found.setAttribute("transform", "scale(1 10) scale(20 3)");
    matrix = found.getCTM();
    ok(matrix.a == 20);
    ok(matrix.d == 30);
});

test("Rotation", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);

    var rec = new SVGSpace.Rectangle(canvas);
    rec.Width = 50;
    rec.Height = 50;
    rec.Background = "Red";
    rec.Id = "MyRectangle";
    canvas.Append(rec);
    var rot = new SVGSpace.Rotation(20);
    rec.Transform(rot);

    var found = <SVGGElement><Object>document.getElementById("MyRectangle");
    ok(found != null, "A rectangle with name 'MyRectangle' should be in the HTML tree.");
    var matrix = found.getCTM();
    ok(Math.abs(matrix.a - Math.cos(20 * Math.PI / 180)) < Accuracy);
    ok(Math.abs(matrix.b - Math.sin(20 * Math.PI / 180)) < Accuracy);

    rec = new SVGSpace.Rectangle(canvas);
    rec.Id = "123";
    canvas.Append(rec);
    found = <SVGGElement><Object>document.getElementById("123");
    found.setAttribute("transform", "rotate(10) rotate(20)");
    matrix = found.getCTM();
    ok(Math.abs(matrix.a - Math.cos(30 * Math.PI / 180)) < Accuracy);
    ok(Math.abs(matrix.b - Math.sin(30 * Math.PI / 180)) < Accuracy);
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Rect tests");
test("Basic tests", function ()
{
    var r = new svg.Rect(122, 155);
    ok(isNaN(r.Width), "Undefine width should be OK");
    raises(function ()
    {
        r.Contains(new SVGSpace.Point(150, 160))
    }, "No dimensions means Contains is undefined.");
    r.Width = 120;
    r.Height = 150;
    ok(r.Contains(new SVGSpace.Point(150, 160)), "Specifying the dimensions renders the result.");
    raises(function ()
    {
        r.Contains(new SVGSpace.Point(NaN, 160))
    }, "No dimensions of the given point means Contains is undefined.");
    ok(!r.Contains(new SVGSpace.Point(550, 160)), "Points outside should not be contained, obviously.");
    r = new svg.Rect(100, 100, 150, 150);
    r.Inflate(5);
    ok(r.Width == 161);
    var rr = r.Clone();
    ok(rr.X == r.X && rr.Y == r.Y && rr.Width == r.Width && rr.Height == r.Height, "Clones should be identical.");

});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Color tests");
test("Predefined", function ()
{
    var someColors = ["Violet", "Wheat", "Sienna", "Brown"];
    for (var i = 0; i < someColors.length; i++)
    {
        var c = new svg.Color(someColors[i]);
        var known:svg.Color = svg.Colors[someColors[i]];
        equal(c.AsHex6, known.AsHex6);
        equal(c.R, known.R, "R:" + someColors[i]);
        equal(c.G, known.G, "G:" + someColors[i]);
        equal(c.B, known.B, "B:" + someColors[i]);
    }

    var c = new svg.Color("Pink");
    var hex = "#" + svg.Colors.knownColors["pink"].toUpperCase();
    equal(c.AsHex6, hex);
    c = new svg.Color("#666633");
    equal(c.R, 102);
    equal(c.G, 102);
    equal(c.B, 51);

    c = new svg.Color("99FF66");
    equal(c.R, 153);
    equal(c.G, 255);
    equal(c.B, 102);

    c = new svg.Color(10, 255, 14, 0.44);
    equal(c.R, 10);
    equal(c.G, 255);
    equal(c.B, 14);
    equal(c.A, 0.44);
    equal(c.AsHex6, "#0AFF0E");


});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("Diagram tests");
test("Basic tests", function ()
{
    var div = GetRoot();
    var diagram = new space.Diagram(div);
    var found = document.getElementById('SVGRoot');
    ok(found != null, "The Diagram should add an <SVG/> element with name 'SVGRoot'.");
});

test("Adding shape tests", function ()
{
    var div = GetRoot();
    var diagram = new space.Diagram(div);
    var shape = space.Shapes.Rectangle;
    shape.Position = new svg.Point(100, 120);
    shape.Width = 200;
    shape.Height = 100;
    shape.Id = "TestShape";
    shape.Background = "#778899";
    diagram.AddShape(shape);
    var found = document.getElementById("TestShape");
    ok(found != null, "A SVG shape with name 'TestShape' should be in the HTML tree.");
    //ok(found.attributes["x"].value == 100 && found.attributes["y"].value == 120, "Should be located at (100,120).");
    //ok(found.attributes["width"].value == 155 && found.attributes["height"].value == 233, "Should have size (155,233).");
    //ok(found.style.fill == "#ed54ff", "Should have fill '#ED54FF'.");

    ok(diagram.Shapes.length == 1, "Items count should be incremented.");
    var item = diagram.Shapes[0];
    ok(item.Connectors.length == 4, "Item should have two connectors.");
    ok(item.Id == "TestShape", "The Id should be passed across the hierarchy.");
    item.IsVisible = false;
    ok(found.attributes["visibility"].value == "hidden", "The visibility should be 'collapsed' now.");
    item.IsVisible = true;
    ok(found.attributes["visibility"].value == "visible", "The visibility should be 'visible' now.");
    item.IsSelected = true;

    var shape2 = space.Shapes.Rectangle;
    shape2.Position = new svg.Point(350, 120);
    shape2.Width = 200;
    shape2.Height = 100;
    shape2.Id = "TestShape";
    shape2.Background = "#778899";
    diagram.AddShape(shape2);
    diagram.Shapes[1].IsSelected = true;
});

test("Adding connections", function ()
{
    var div = GetRoot();
    var diagram = new space.Diagram(div);
    var shape1 = AddShape(diagram, new svg.Point(100, 120), space.Shapes.SequentialData);
    shape1.Width = 80;
    shape1.Height = 80;
    shape1.Title = "Sequential Data."
    var shape2 = AddShape(diagram, new svg.Point(100, 400));
    var shape3 = AddShape(diagram, new svg.Point(370, 400), space.Shapes.Wave);
    var topCor = shape2.GetConnector("Top");
    var topCor2 = shape3.GetConnector("Top");
    var bottomCor = shape1.GetConnector("Bottom");
    var con = AddConnection(diagram, bottomCor, topCor);
    con.EndCap = svg.Markers.ArrowStart;
    con.StartCap = svg.Markers.FilledCircle;
    var con2 = AddConnection(diagram, bottomCor, topCor2);
    con2.Content = "Connection Label";
    ok(topCor.Connections.length == 1, "Shape2#Top should have one connection.");
    ok(bottomCor.Connections.length == 2, "Shape1#Bottom should have two connections.");
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
QUnit.module("XML Loading tests");

//asyncTest("Checking shape properties", function ()
//{
//    var div = GetRoot();
//    var diagram = new space.Diagram(div);
//    var loader = new space.RDImporter(diagram);
//    var url = "/SampleDiagrams/TwoShapes.xml";
//    loader.LoadURL(url, null, p => {

//        ok(p.ShapeProperties.length == 2);

//        var props1 = p.ShapeProperties[0];
//        equal(props1.id, "10df2022-7bf2-4ed1-a066-df0f86f07721");
//        equal(props1.stroke, "#AB6200");
//        equal(props1.fill, "#F19720");
//        equal(props1.height, 100);
//        equal(props1.geometry, "M14.248657,39.417725C14.248657,39.417725 14,29.667244 21.3302,24.000578 28.663574,18.333912 39.328003,20.250563 39.328003,20.250563 39.328003,20.250563 43.494385,0.5 63.741943,0.5 82.739746,0.5 87.655762,19.750601 87.655762,19.750601 87.655762,19.750601 100.32007,16.000544 108.31909,24.750582 114.66797,31.695599 112.90283,40.4174 112.90283,40.4174 112.90283,40.4174 123.16272,45.471794 120.81873,58.500729 117.81824,75.179268 98.904663,74.25106 98.904663,74.25106L18.581177,74.25106C18.581177,74.25106 0.5,73.084129 0.5,57.750725 0.5,42.417324 14.248657,39.417725 14.248657,39.417725z");
//        equal(props1.position.x, 456.166564941406);
//        equal(props1.position.y, 133.286482493083);

//        var props2 = p.ShapeProperties[1];
//        equal(props2.id, "b814191b-82ab-4d3b-9cef-fbed99077fa8");
//        equal(props2.stroke, "#517464");
//        equal(props2.fill, "#84BAA2");
//        equal(props2.height, 135);
//        equal(props2.width, 260);
//        equal(props2.geometry, "M40,0.5L51.13,17.24 71.7,15.15 64.99,33.92 79.5,48.08 60.02,54.78 57.59,74.5 40,64.07 22.41,74.5 19.98,54.78 0.5,48.08 15.01,33.92 8.3,15.15 28.87,17.24z");
//        equal(props2.position.x, 427);
//        equal(props2.position.y, 260.166666666667);
//        start();
//    });
//});
//asyncTest("Checking connection properties", function ()
//{
//    var div = GetRoot();
//    var diagram = new space.Diagram(div);
//    var loader = new space.RDImporter(diagram);
//    var url = "/SampleDiagrams/SomeConnections.xml";
//    loader.LoadURL(url, null, p => {

//        ok(p.ConnectionProperties.length == 2);

//        var props1 = p.ConnectionProperties[0];
//        equal(props1.id, "39eae3c9-98b3-4437-868c-86bd4586d0df");
//        equal(props1.stroke, "#005011");
//        //equal(props1.source, "c3c55cfb-80c8-4c61-bf86-0e5c3af41b17");
//        //equal(props1.target, "90767bed-685e-4083-9e82-bd682a789488");

//        var props2 = p.ConnectionProperties[1];
//        equal(props2.id, "acf6bb8a-315a-4eac-87a9-12ec71ba2b2f");
//        equal(props2.stroke, "#888888");

//        start();
//    });
//});

test("Scaling", function ()
{
    var root = GetRoot();
    var canvas = new SVGSpace.Canvas(root);
    var group = new SVGSpace.Group();

    var refRec = new SVGSpace.Rectangle(canvas);
    refRec.Width = 50;
    refRec.Height = 50;
    refRec.Stroke = "Green";
    refRec.StrokeThickness=1;
    refRec.Background = "Transparent";
    refRec.Position=new SVGSpace.Point(0,0);
    refRec.Id = "TheReference";

    var rec = new SVGSpace.Rectangle(canvas);
    rec.Width = 50;
    rec.Height = 50;
    rec.Background = "Red";
    rec.Position=new SVGSpace.Point(0,0);
    rec.Id = "TheRec";
    group.Append(rec);

//    var second = new SVGSpace.Rectangle(canvas);
//    second.Width = 50;
//    second.Height = 50;
//    second.Background = "Orange";
//    second.Position=new SVGSpace.Point(0,0);
//    second.Id = "Second";
//    group.Append(second);

    canvas.Append(group);
    group.Position = new SVGSpace.Point(100,100);
    group.Append(refRec);

//    var found = <SVGGElement><Object>document.getElementById("Second");
//    ok(found != null, "A rectangle with name 'TheRec' should be in the HTML tree.");

    //found.setAttribute("transform"," matrix(0,0,0,0,10,10) rotate(15) translate(10,10)");
    var trans = new SVGSpace.Translation(25, 25);
    rec.Transform(trans);
    var scale = new SVGSpace.Scale(2.0,1.0);
    //rec.Transform(scale);

    var rot = new SVGSpace.Rotation(5);
    rec.Transform(rot);
    rec.Transform(scale);
    //rec.Transform(trans);
    //rec.Native.transform.baseVal.consolidate();
//    var trans2 = new SVGSpace.Translation(50, 50);
//    rec.Transform(trans2);
    //refRec.Native.setAttribute("transform","rotate(180)");
//    var matrix = found.getCTM();
//    ok(matrix.a == 20);
//    ok(matrix.d == 25);
//
//    rec = new SVGSpace.Rectangle(canvas);
//    rec.Id = "123";
//    canvas.Append(rec);
//    found = <SVGGElement><Object>document.getElementById("123");
//    found.setAttribute("transform", "scale(1 10) scale(20 3)");
  //var matrix = found.getCTM();
ok(true);
//    ok(matrix.a == 20);
//    ok(matrix.d == 30);
});
