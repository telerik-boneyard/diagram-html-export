/**
 * Copyright Telerik.
 *
 * Disclaimer:
 * The TypeScript and SVG libraries allow a fully interactive diagramming
 * experience, but are not released or supported as such yet.
 * The only part supported for now is the export/import to/from XAML/XML.
 *
 */

///<reference path='../RadSVG/RadSVG.ts' />

import svg = module(RadSVG)
module RadDiagram {
    /**
     * The SVG namespace (http://www.w3.org/2000/svg).
     */
    export var NS = "http://www.w3.org/2000/svg";

    /**
     * The actual diagramming surface.
     */
    export class Diagram {
        /**
         * The hosting DIV element.
         */
        private div: HTMLDivElement;

        /**
         * The root SVG canvas.
         */
        private canvas: svg.Canvas;
        private mainLayer: svg.Group;
        private theme: ITheme;
        private currentPosition: svg.Point = new svg.Point(0, 0);
        private isShiftPressed: bool = false;
        private pan = svg.Point.Empty;
        private isPanning = false;
        private panStart: svg.Point;
        private panDelta: svg.Point;
        private panOffset: svg.Point;
        private zoomRate = 1.1;  // Increase for faster zooming (i.e., less granularity).
        private undoRedoService: UndoRedoService = new UndoRedoService();
        /**
         * The collection of items contained within this diagram.
         */
        private shapes: Shape[] = [];
        private connections: Connection[] = [];
        private lastUsedShapeTemplate: IShapeTemplate = null;
        private hoveredItem: IFrameworkElement = null;
        private newItem: Shape = null;
        private newConnection: Connection = null;
        private selector: Selector = null;
        private isManipulating: bool = false;
        private keyCodeTable: any;
        private isFirefox: bool;
        private isSafari: bool;
        private currentZoom = 1.0;
        private MouseDownHandler: (e: MouseEvent) => void;
        private MouseUpHandler: (e: MouseEvent) => void;
        private MouseMoveHandler: (e: MouseEvent) => void;
        private _doubleClickHandler: (e: MouseEvent) => void;
        private _touchStartHandler: (e: TouchEvent) => void;
        private _touchEndHandler: (e: TouchEvent) => void;
        private _touchMoveHandler: (e: TouchEvent) => void;
        private KeyDownHandler: (e: KeyboardEvent) => void;
        private KeyPressHandler: (e: KeyboardEvent) => void;
        private KeyUpHandler: (e: KeyboardEvent) => void;

        /**
         * The collection of items contained within this diagram.
         */
        public get Shapes() {
            return this.shapes;
        }

        public get Connections() {
            return this.connections;
        }

        //TODO: note to Swa: ensure you delete this after the importer is working!!
        public get Canvas() {
            return this.canvas;
        }

        public get Zoom() { return this.currentZoom; }
        public set Zoom(v: number) {
            if (this.mainLayer == null) throw "The 'mainLayer' is not present.";
            //around 0.5 something exponential happens...!?
            this.currentZoom = Math.min(Math.max(v, 0.55), 2.0);

            this.mainLayer.Native.setAttribute("transform", "translate(" + this.pan.X + "," + this.pan.Y + ")scale(" + this.currentZoom + "," + this.currentZoom + ")");
        }
        public get Pan() {
            return this.pan;
        }
        public set Pan(v: svg.Point) {
            this.pan = v;
            this.mainLayer.Native.setAttribute("transform", "translate(" + this.pan.X + "," + this.pan.Y + ")scale(" + this.currentZoom + "," + this.currentZoom + ")");
        }
        public get MainLayer() {
            return this.mainLayer;
        }

        constructor(div: HTMLDivElement) {
            // the hosting div element
            this.div = div;

            // the root SVG Canvas
            this.canvas = new svg.Canvas(div);
            // the main layer
            this.mainLayer = new svg.Group();
            this.mainLayer.Id = "mainLayer";

            this.canvas.Append(this.mainLayer);
            // the default theme
            this.theme = {
                background: "#fff",
                connection: "#000",
                selection: "#ff8822",
                connector: "#31456b",
                connectorBorder: "#fff",
                connectorHoverBorder: "#000",
                connectorHover: "#0c0"
            };
            // some switches 
            this.isSafari = typeof navigator.userAgent.split("WebKit/")[1] != "undefined";
            this.isFirefox = navigator.appVersion.indexOf('Gecko/') >= 0 || ((navigator.userAgent.indexOf("Gecko") >= 0) && !this.isSafari && (typeof navigator.appVersion != "undefined"));

            this.MouseDownHandler = (e: MouseEvent) => {
                this.MouseDown(e);
            };
            this.MouseUpHandler = (e: MouseEvent) => {
                this.MouseUp(e);
            };
            this.MouseMoveHandler = (e: MouseEvent) => {
                this.MouseMove(e);
            };
            this._doubleClickHandler = (e: MouseEvent) => {
                this.doubleClick(e);
            };
            this._touchStartHandler = (e: TouchEvent) => {
                this.touchStart(e);
            }
            this._touchEndHandler = (e: TouchEvent) => {
                this.touchEnd(e);
            }
            this._touchMoveHandler = (e: TouchEvent) => {
                this.touchMove(e);
            }
            this.KeyDownHandler = (e: KeyboardEvent) => {
                this.KeyDown(e);
            }
            this.KeyPressHandler = (e: KeyboardEvent) => {
                this.KeyPress(e);
            }
            this.KeyUpHandler = (e: KeyboardEvent) => {
                this.keyUp(e);
            }

            this.canvas.MouseMove = this.MouseMoveHandler;
            this.canvas.MouseDown = this.MouseDownHandler;
            this.canvas.MouseUp = this.MouseUpHandler;
            this.canvas.KeyDown = this.KeyDownHandler;
            this.canvas.KeyPress = this.KeyPressHandler;
            //this.todelete.addEventListener("touchstart", this._touchStartHandler, false);
            //this.todelete.addEventListener("touchend", this._touchEndHandler, false);
            //this.todelete.addEventListener("touchmove", this._touchMoveHandler, false);
            //this.todelete.addEventListener("dblclick", this._doubleClickHandler, false);
            //this.todelete.addEventListener("keydown", this.KeyDownHandler, false);
            //this.todelete.addEventListener("KeyPress", this.KeyPressHandler, false);
            //this.todelete.addEventListener("keyup", this.KeyUpHandler, false);
            this.selector = new Selector(this);
            this.listToWheel(this);
        }
        private listToWheel(self) {
            var mousewheelevt = (/Firefox/i.test(navigator.userAgent)) ? "DOMMouseScroll" : "mousewheel" //FF doesn't recognize mousewheel as of FF3.x
            var handler = e => {
                var evt = window.event || e;
                if (evt.preventDefault) evt.preventDefault();
                else evt.returnValue = false;
               
                self.zoomViaMouseWheel(evt, self);
                return;
            };
            if (self.div.attachEvent) //if IE (and Opera depending on user setting)
                self.div.attachEvent("on" + mousewheelevt, handler)
            else if (self.div.addEventListener) //WC3 browsers
                self.div.addEventListener(mousewheelevt, handler, false)
        }
        private zoomViaMouseWheel(mouseWheelEvent, diagram) {
            var evt = window.event || mouseWheelEvent;
            var delta = evt.detail ? evt.detail * (-120) : evt.wheelDelta
            var z = diagram.Zoom;;
            if (delta > 0)
                z *= this.zoomRate;
            else
                z /= this.zoomRate;

            diagram.Zoom = z;
            /* When the mouse is over the webpage, don't let the mouse wheel scroll the entire webpage: */
            mouseWheelEvent.cancelBubble = true;
            return false;
        }

        public Focus() {
            this.canvas.Focus();
        }

        public get Theme(): ITheme {
            return this.theme;
        }

        public Delete(undoable: bool = false) {
            this.DeleteCurrentSelection(undoable);
            this.Refresh();
            this.UpdateHoveredItem(this.currentPosition);
            this.UpdateCursor();
        }

        public get Selection(): IDiagramItem[] {
            return this.getCurrentSelection();
        }

        /**
             * Clears the current diagram and the undo-redo stack.
             */
        public Clear() {
            this.currentZoom = 1.0;
            this.pan = svg.Point.Empty;
            this.shapes = [];
            this.connections = [];
            this.canvas.Clear();
            this.mainLayer = new svg.Group();
            this.mainLayer.Id = "mainLayer";
            this.canvas.Append(this.mainLayer);
            this.undoRedoService = new UndoRedoService();
        }

        private getCurrentSelection(): IDiagramItem[] {
            var selection: IDiagramItem[] = [];
            for (var i = 0; i < this.shapes.length; i++) {
                var shape = this.shapes[i];
                if (shape.IsSelected) selection.push(shape);

                for (var j = 0; j < shape.Connectors.length; j++) {
                    var connector = shape.Connectors[j];
                    for (var k = 0; k < connector.Connections.length; k++) {
                        var connection: Connection = connector.Connections[k];
                        if (connection.IsSelected) selection.push(connection);
                    }
                }
            }
            return selection;
        }

        public set Theme(value: ITheme) {
            this.theme = value;
        }

        public get elements(): Shape[] {
            return this.shapes;
        }
        /**
         * Adds the given connection to the diagram.
         * @param con The connection to add.
         */
        public AddConnection(con: Connection): Connection;

        /**
         * Creates a connection between the given connectors.
         * @param from The connector where the connection starts.
         * @param to The connector where the connection ends.
         */
        public AddConnection(from: Connector, to: Connector): Connection;

        /**
         * Creates a connection between the given connectors.
         */
        public AddConnection(item: any, sink?: Connector): Connection {
            var connection: Connection = null;
            var source: Connector = null;
            if (item instanceof Connection) {
                if (sink != null) throw "Connection and sink cannot be specified simultaneously.";
                connection = <Connection>item;
                source = connection.From;
                sink = connection.To;
            }
            else {
                if (item instanceof Connector) {
                    source = <Connector>item;
                    connection = new Connection(source, sink);
                }
                else throw "Parameter combination.";
            }

            source.Connections.push(connection);

            if (sink != null) // happens when drawing a new connection
            {
                sink.Connections.push(connection);
            }
            this.mainLayer.Append(connection.Visual);
            connection.Diagram = this;
            connection.Invalidate();
            this.connections.push(connection);
            return connection;
        }

        public AddShape(template: IShapeTemplate): Shape {
            this.lastUsedShapeTemplate = template;
            var item = new Shape(template, template.Position);
            return this.AddItem(item);
        }

        public AddItem(shape: Shape) {
            this.shapes.push(shape);
            shape.Diagram = this;
            this.mainLayer.Append(shape.Visual);

            return shape;
        }
        public AddMarker(marker: svg.Marker) {
            this.canvas.AddMarker(marker);
        }

        public Undo() {
            this.undoRedoService.Undo();
            this.Refresh();
            this.UpdateHoveredItem(this.currentPosition);
            this.UpdateCursor();
        }

        public SelectAll() {
            this.undoRedoService.begin();
            var selectionUndoUnit = new SelectionUndoUnit();
            this.selectAll(selectionUndoUnit, null);
            this.undoRedoService.Add(selectionUndoUnit);
            this.Refresh();
            this.UpdateHoveredItem(this.currentPosition);
            this.UpdateCursor();
        }

        public Redo() {
            this.undoRedoService.Redo();
            this.Refresh();
            this.UpdateHoveredItem(this.currentPosition);
            this.UpdateCursor();
        }

        public RecreateLastUsedShape() {
            var shape = new Shape(this.lastUsedShapeTemplate, this.currentPosition);
            var unit = new AddShapeUnit(shape, this);
            this.undoRedoService.Add(unit);
        }

        /**
         * Removes the given connection from the diagram.
         */
        public RemoveConnection(con: Connection) {
            con.IsSelected = false;
            con.From.Connections.remove(con);
            if (con.To != null) con.To.Connections.remove(con);
            con.Diagram = null;
            this.Connections.remove(con);
            this.mainLayer.Remove(con.Visual);
        }

        public RemoveShape(shape: Shape) {
            shape.Diagram = null;
            shape.IsSelected = false;
            this.shapes.remove(shape);
            this.mainLayer.Remove(shape.Visual);
        }

        public setElementContent(element: Shape, content: any) {
            this.undoRedoService.Add(new ContentChangedUndoUnit(element, content));
            this.Refresh();
        }

        public DeleteCurrentSelection(undoable: bool = true) {
            if (undoable) this.undoRedoService.begin();

            var deletedConnections: Connection[] = [];
            for (var i = 0; i < this.shapes.length; i++) {
                var shape = this.shapes[i];
                for (var j = 0; j < shape.Connectors.length; j++) {
                    var connector = shape.Connectors[j];
                    for (var k = 0; k < connector.Connections.length; k++) {
                        var connection = connector.Connections[k];
                        if ((shape.IsSelected || connection.IsSelected) && (!deletedConnections.contains(connection))) {
                            if (undoable) this.undoRedoService.AddCompositeItem(new DeleteConnectionUnit(connection));
                            deletedConnections.push(connection);
                        }
                    }
                }
            }
            //if not undoable; cannot alter the collection or the loop will be biased
            if (!undoable && deletedConnections.length > 0) {
                for (var i = 0; i < deletedConnections.length; i++) {
                    var connection = deletedConnections[i];
                    this.RemoveConnection(connection);
                }
            }

            for (var i = 0; i < this.shapes.length; i++) {
                var shape: Shape = this.shapes[i];
                if (shape.IsSelected) {
                    if (undoable) this.undoRedoService.AddCompositeItem(new DeleteShapeUnit(shape));
                    else this.RemoveShape(shape);
                }
            }
            if (undoable) this.undoRedoService.commit();
        }

        /**
         * The mouse down logic.
         */
        private MouseDown(e: MouseEvent) {
            this.Focus();
            e.preventDefault();
            this.UpdateCurrentPosition(e);
            if (e.button === 0) {
                // alt+click allows fast creation of element using the active template
                if ((this.newItem === null) && (e.altKey)) this.RecreateLastUsedShape();
                else this.Down(e);
            }
        }

        /**
         * The mouse up logic.
         */
        private MouseUp(e: MouseEvent) {
            e.preventDefault();
            this.UpdateCurrentPosition(e);
            if (e.button === 0) this.Up();
        }

        /**
         * The mouse MoveTo logic.
         */
        private MouseMove(e: MouseEvent) {
            e.preventDefault();
            this.UpdateCurrentPosition(e);
            this.Move();
        }

        private doubleClick(e: MouseEvent) {
            e.preventDefault();
            this.UpdateCurrentPosition(e);

            if (e.button === 0) // left-click
            {
                var point: svg.Point = this.currentPosition;

                this.UpdateHoveredItem(point);
                if ((this.hoveredItem != null) && (this.hoveredItem instanceof Shape)) {
                    var item = <Shape> this.hoveredItem;
                    if ((item.Template != null) && ("edit" in item.Template)) {
                        item.Template.Edit(item, this.canvas, point);
                        this.Refresh();
                    }
                }
            }
        }

        private touchStart(e: TouchEvent) {
            if (e.touches.length == 1) {
                e.preventDefault();
                this.UpdateCurrentTouchPosition(e);
                this.Down(e);
            }
        }

        private touchEnd(e: TouchEvent) {
            e.preventDefault();
            this.Up();
        }

        private touchMove(e: TouchEvent) {
            if (e.touches.length == 1) {
                e.preventDefault();
                this.UpdateCurrentTouchPosition(e);
                this.Move();
            }
        }

        /**
         * The actual mouse down logic.
         */
        private Down(e) {
            var p = this.currentPosition;

            if (this.newItem != null) {
                this.undoRedoService.begin();

                this.newItem.Rectangle = new svg.Rect(p.X, p.Y, this.newItem.Rectangle.Width, this.newItem.Rectangle.Height);
                this.newItem.Invalidate();
                this.undoRedoService.AddCompositeItem(new AddShapeUnit(this.newItem, this));
                this.undoRedoService.commit();
                this.newItem = null;
            }
            else {
                this.selector.End();
                this.UpdateHoveredItem(p);
                if (this.hoveredItem === null) {
                    var ev = window.event || e;
                    if (ev.ctrlKey == true) {
                        //pan
                        this.isPanning = true;
                        this.panStart = this.Pan;
                        this.panOffset = p;// new svg.Point(p.X - this.panStart.X, p.Y + this.panStart.Y);
                        this.panDelta = svg.Point.Empty;//relative to root
                    }
                    else {
                        // Start selection
                        this.selector.Start(p);
                    }

                }
                else {
                    // Start connection
                    if ((this.hoveredItem instanceof Connector) && (!this.isShiftPressed)) {
                        var connector = <Connector> this.hoveredItem;
                        //console.log("Starting a new connection from " + connector.Template.Name);
                        if (connector.CanConnectTo(null)) {
                            this.newConnection = this.AddConnection(connector, null);
                            this.newConnection.UpdateEndPoint(p);
                        }
                    }
                    else {
                        // select object
                        var item: IDiagramItem = <IDiagramItem> this.hoveredItem;
                        if (!item.IsSelected) {
                            this.undoRedoService.begin();
                            var selectionUndoUnit: SelectionUndoUnit = new SelectionUndoUnit();
                            if (!this.isShiftPressed) this.DeselectAll(selectionUndoUnit);
                            selectionUndoUnit.select(item);
                            this.undoRedoService.AddCompositeItem(selectionUndoUnit);
                            this.undoRedoService.commit();
                        }
                        else if (this.isShiftPressed) {
                            this.undoRedoService.begin();
                            var deselectUndoUnit: SelectionUndoUnit = new SelectionUndoUnit();
                            deselectUndoUnit.deselect(item);
                            this.undoRedoService.AddCompositeItem(deselectUndoUnit);
                            this.undoRedoService.commit();
                        }

                        // seems we are transforming things
                        var hit = new svg.Point(0, 0);
                        if (this.hoveredItem instanceof Shape) {
                            var element: Shape = <Shape> this.hoveredItem;
                            hit = element.Adorner.HitTest(p);
                        }
                        for (var i = 0; i < this.shapes.length; i++) {
                            var shape = this.shapes[i];
                            if (shape.Adorner != null) shape.Adorner.Start(p, hit);
                        }
                        this.isManipulating = true;
                    }
                }
            }

            this.Refresh();
            this.UpdateCursor();
        }

        /**
         * The actual mouse MoveTo logic.
         */
        private Move() {
            var p = this.currentPosition;

            if (this.newItem != null) {
                // placing new element
                this.newItem.Rectangle = new svg.Rect(p.X, p.Y, this.newItem.Rectangle.Width, this.newItem.Rectangle.Height);
                this.newItem.Invalidate();
            }
            if (this.isPanning) {
                this.panDelta = new svg.Point(this.panDelta.X + p.X - this.panOffset.X, this.panDelta.Y + p.Y - this.panOffset.Y);
                this.Pan = new svg.Point(this.panStart.X + this.panDelta.X, this.panStart.Y + this.panDelta.Y);
                this.Canvas.Cursor = Cursors.MoveTo;
                return;
            }
            if (this.isManipulating) {
                // moving IsSelected elements
                for (var i = 0; i < this.shapes.length; i++) {
                    var shape = this.shapes[i];
                    if (shape.Adorner != null) {
                        shape.Adorner.MoveTo(p);
                        // this will also repaint the visual
                        shape.Rectangle = shape.Adorner.Rectangle;
                    }
                }
            }

            if (this.newConnection != null) {
                // connecting two connectors               
                this.newConnection.UpdateEndPoint(p);
                this.newConnection.Invalidate();
            }

            if (this.selector != null) this.selector.updateCurrentPoint(p);

            this.UpdateHoveredItem(p);
            this.Refresh();
            this.UpdateCursor();
        }

        /**
         * The actual mouse up logic.
         */
        private Up() {
            var point: svg.Point = this.currentPosition;
            if (this.isPanning) {
                this.isPanning = false;
                this.Canvas.Cursor = Cursors.arrow;
                var unit = new PanUndoUnit(this.panStart, this.Pan, this);
                this.undoRedoService.Add(unit);
                return;
            }
            if (this.newConnection != null) {
                this.UpdateHoveredItem(point);
                this.newConnection.Invalidate();
                if ((this.hoveredItem != null) && (this.hoveredItem instanceof Connector)) {
                    var connector = <Connector> this.hoveredItem;
                    if ((connector != this.newConnection.From) && (connector.CanConnectTo(this.newConnection.From))) {
                        this.newConnection.To = connector;
                        this.undoRedoService.Add(new AddConnectionUnit(this.newConnection, this.newConnection.From, connector));
                        console.log("Connection established.");
                    }
                    else
                        this.RemoveConnection(this.newConnection); //remove temp connection
                }
                else
                    this.RemoveConnection(this.newConnection);
                this.newConnection = null;
            }

            if (this.selector.IsActive) {
                this.undoRedoService.begin();
                var selectionUndoUnit: SelectionUndoUnit = new SelectionUndoUnit();
                var rectangle = this.selector.Rectangle;
                var selectable: IDiagramItem = <IDiagramItem> this.hoveredItem;
                if (((this.hoveredItem === null) || (!selectable.IsSelected)) && !this.isShiftPressed) this.DeselectAll(selectionUndoUnit);
                if ((rectangle.Width != 0) || (rectangle.Height != 0)) this.selectAll(selectionUndoUnit, rectangle);
                this.undoRedoService.AddCompositeItem(selectionUndoUnit);
                this.undoRedoService.commit();
                this.selector.End();
            }

            if (this.isManipulating) {
                this.undoRedoService.begin();
                for (var i = 0; i < this.shapes.length; i++) {
                    var shape = this.shapes[i];
                    if (shape.Adorner != null) {
                        shape.Adorner.Stop();
                        shape.Invalidate();
                        var r1 = shape.Adorner.InitialState;
                        var r2 = shape.Adorner.FinalState;
                        if ((r1.X != r2.X) || (r1.Y != r2.Y) || (r1.Width != r2.Width) || (r1.Height != r2.Height))
                            this.undoRedoService.AddCompositeItem(new TransformUnit(shape, r1, r2));

                    }
                }

                this.undoRedoService.commit();
                this.isManipulating = false;
                this.UpdateHoveredItem(point);
            }

            this.Refresh();
            this.UpdateCursor();
        }

        private KeyDown(e: KeyboardEvent) {
            if (!this.isFirefox) this.ProcessKey(e, e.keyCode);
        }

        private KeyPress(e: KeyboardEvent) {
            //if (this.isFirefox)
            {
                if (typeof this.keyCodeTable === "undefined") {
                    this.keyCodeTable = [];
                    var charCodeTable: any = {
                        32: ' ',
                        48: '0',
                        49: '1',
                        50: '2',
                        51: '3',
                        52: '4',
                        53: '5',
                        54: '6',
                        55: '7',
                        56: '8',
                        57: '9',
                        59: ';',
                        61: '=',
                        65: 'a',
                        66: 'b',
                        67: 'c',
                        68: 'd',
                        69: 'e',
                        70: 'f',
                        71: 'g',
                        72: 'h',
                        73: 'i',
                        74: 'j',
                        75: 'k',
                        76: 'l',
                        77: 'm',
                        78: 'n',
                        79: 'o',
                        80: 'p',
                        81: 'q',
                        82: 'r',
                        83: 's',
                        84: 't',
                        85: 'u',
                        86: 'v',
                        87: 'w',
                        88: 'x',
                        89: 'y',
                        90: 'z',
                        107: '+',
                        109: '-',
                        110: '.',
                        188: ',',
                        190: '.',
                        191: '/',
                        192: '`',
                        219: '[',
                        220: '\\',
                        221: ']',
                        222: '\"'
                    }

                    for (var keyCode in charCodeTable) {
                        var key: string = charCodeTable[keyCode];
                        this.keyCodeTable[key.charCodeAt(0)] = keyCode;
                        if (key.toUpperCase() != key) this.keyCodeTable[key.toUpperCase().charCodeAt(0)] = keyCode;
                    }
                }

                this.ProcessKey(e, (this.keyCodeTable[e.charCode] != null) ? this.keyCodeTable[e.charCode] : e.keyCode);
            }
        }

        private keyUp(e: KeyboardEvent) {
            this.UpdateCursor();
        }

        private ProcessKey(e: KeyboardEvent, keyCode: number) {
            if ((e.ctrlKey || e.metaKey) && !e.altKey) // ctrl or option
            {
                if (keyCode == 65) // A: select all
                {
                    this.SelectAll();
                    this.stopEvent(e);
                }

                if ((keyCode == 90) && (!e.shiftKey)) // Z: undo
                {
                    this.Undo();
                    this.stopEvent(e);
                }

                if (((keyCode == 90) && (e.shiftKey)) || (keyCode == 89)) // Y: redo
                {
                    this.Redo();
                    this.stopEvent(e);
                }
            }

            if ((keyCode == 46) || (keyCode == 8)) // del: deletion
            {
                this.Delete(true)
                this.stopEvent(e);
            }

            if (keyCode == 27) // ESC: stop any action
            {
                this.newItem = null;
                if (this.newConnection != null) {
                    this.RemoveConnection(this.newConnection);
                    this.newConnection = null;
                }
                this.isManipulating = false;
                for (var i = 0; i < this.shapes.length; i++) {
                    var element = this.shapes[i];
                    if (element.Adorner != null) element.Adorner.Stop();
                }

                this.Refresh();
                this.UpdateHoveredItem(this.currentPosition);
                this.UpdateCursor();
                this.stopEvent(e);
            }
        }

        private stopEvent(e: Event) {
            e.preventDefault();
            e.stopPropagation();
        }

        /**
         * Selects all items of the diagram.
         */
        private selectAll(selectionUndoUnit: SelectionUndoUnit, r: svg.Rect) {
            for (var i = 0; i < this.shapes.length; i++) {
                var element: Shape = this.shapes[i];
                if ((r === null) || (element.HitTest(r))) selectionUndoUnit.select(element);
                for (var j = 0; j < element.Connectors.length; j++) {
                    var connector: Connector = element.Connectors[j];
                    for (var k = 0; k < connector.Connections.length; k++) {
                        var connection: Connection = connector.Connections[k];
                        if ((r === null) || (connection.HitTest(r))) selectionUndoUnit.select(connection);
                    }
                }
            }
        }

        /**
         * Unselects all items.
         */
        private DeselectAll(selectionUndoUnit: SelectionUndoUnit) {
            for (var i = 0; i < this.shapes.length; i++) {
                var item = this.shapes[i];
                selectionUndoUnit.deselect(item);

                for (var j = 0; j < item.Connectors.length; j++) {
                    var connector: Connector = item.Connectors[j];
                    for (var k = 0; k < connector.Connections.length; k++) selectionUndoUnit.deselect(connector.Connections[k]);
                }
            }
        }

        /**
         * Refreshed the current hovered item given the current location of the cursor.
         */
        private UpdateHoveredItem(p: svg.Point) {
            var hitObject = this.HitTest(p);
            if (hitObject != this.hoveredItem) {
                if (this.hoveredItem != null) this.hoveredItem.IsHovered = false;
                this.hoveredItem = hitObject;
                if (this.hoveredItem != null) this.hoveredItem.IsHovered = true;
            }
            //if (this.hoveredItem != null)
            //    console.log("hoveredItem:" + this.hoveredItem.toString());
        }

        /**
         * Detects the item underneath the given location.
         */
        private HitTest(point: svg.Point): IFrameworkElement {
            var rectangle = new svg.Rect(point.X, point.Y, 0, 0);

            // connectors
            for (var i = 0; i < this.shapes.length; i++) {
                var item: Shape = this.shapes[i];
                for (var j = 0; j < item.Connectors.length; j++) {
                    var connector = item.Connectors[j];
                    if (connector.HitTest(rectangle)) return connector;
                }
            }

            // shapes
            for (var i = 0; i < this.shapes.length; i++) {
                var item: Shape = this.shapes[i];
                if (item.HitTest(rectangle)) return item;
            }

            // connections
            for (var i = 0; i < this.shapes.length; i++) {
                var item: Shape = this.shapes[i];
                for (var j: number = 0; j < item.Connectors.length; j++) {
                    var connector: Connector = item.Connectors[j];
                    for (var k = 0; k < connector.Connections.length; k++) {
                        var connection: Connection = connector.Connections[k];
                        if (connection.HitTest(rectangle)) return connection;
                    }
                }
            }
            return null;
        }

        /**
         * Sets the cursors in function of the currently hovered item.
         */
        private UpdateCursor() {
            if (this.newConnection != null) {
                this.canvas.Cursor = ((this.hoveredItem != null) && (this.hoveredItem instanceof Connector)) ? this.hoveredItem.GetCursor(this.currentPosition) : Cursors.cross;
            }
            else {
                this.canvas.Cursor = (this.hoveredItem != null) ? this.hoveredItem.GetCursor(this.currentPosition) : Cursors.arrow;
            }
        }

        /*
         * Update the current position of the mouse to the local coordinate system.
         */
        private UpdateCurrentPosition(e: MouseEvent) {
            this.isShiftPressed = e.shiftKey;
            this.currentPosition = new svg.Point(e.pageX - this.pan.X, e.pageY - this.pan.Y);
            var node: HTMLElement = this.div;
            // wished there was an easier way to do this
            while (node != null) {
                this.currentPosition.X -= node.offsetLeft;
                this.currentPosition.Y -= node.offsetTop;
                node = <HTMLElement> node.offsetParent;
            }
            this.currentPosition.X /= this.Zoom;
            this.currentPosition.Y /= this.Zoom;
            //console.log(this.currentPosition.toString());
        }

        private UpdateCurrentTouchPosition(e: TouchEvent) {
            this.isShiftPressed = false;
            this.currentPosition = new svg.Point(e.touches[0].pageX, e.touches[0].pageY);
            var node: HTMLElement = this.div;
            while (node != null) {
                this.currentPosition.X -= node.offsetLeft;
                this.currentPosition.Y -= node.offsetTop;
                node = <HTMLElement> node.offsetParent;
            }
        }

        private Refresh() {
            var connections: Connection[] = [];
            for (var i = 0; i < this.shapes.length; i++) {
                var item: Shape = this.shapes[i];
                for (var j = 0; j < item.Connectors.length; j++) {
                    var connector: Connector = item.Connectors[j];
                    for (var k = 0; k < connector.Connections.length; k++) {
                        var connection: Connection = connector.Connections[k];
                        if (!connections.contains(connection)) {
                            connection.paint(this.canvas);
                            connections.push(connection);
                        }
                    }
                }
            }
            for (var i = 0; i < this.shapes.length; i++) this.shapes[i].paint(this.canvas);
            for (var i = 0; i < this.shapes.length; i++) {
                var item = this.shapes[i];
                for (var j = 0; j < item.Connectors.length; j++) {
                    var connector: Connector = item.Connectors[j];
                    var IsHovered: bool = false;
                    for (var k = 0; k < connector.Connections.length; k++)
                        if (connector.Connections[k].IsHovered) IsHovered = true;
                    if ((item.IsHovered) || (connector.IsHovered) || IsHovered) connector.Invalidate((this.newConnection != null) ? this.newConnection.From : null);
                    else if ((this.newConnection != null) && (connector.CanConnectTo(this.newConnection.From))) connector.Invalidate(this.newConnection.From);
                }
            }

            if (this.newItem != null) this.newItem.paint(this.canvas);
            if (this.newConnection != null) this.newConnection.paintAdorner(this.canvas);
            if (this.selector.IsActive) this.selector.paint(this.canvas);
        }
    }

    /**
     * Mapping of logical cursors to actual cursors.
     */
    export class Cursors {
        static arrow: string = "default";
        static grip: string = "pointer";
        static cross: string = "pointer";
        static add: string = "pointer";
        static MoveTo: string = "move";
        static select: string = "pointer";
    }


    /**
     * Defines basic Control properties.
     */
    export interface IFrameworkElement {
        IsHovered: bool;
        GetCursor(point: svg.Point): string;
    }

    /**
     * Defines an element participating in the diagram logic.
     */
    export interface IDiagramItem extends IFrameworkElement {
        IsSelected: bool;
        Diagram: Diagram;
    }

    /**
     * Defines an undo-redo unit.
     */
    export interface IUndoUnit {
        Title: string;
        Undo(): void;
        Redo(): void;
        IsEmpty: bool;
    }

    /**
     * Defines a shape.
     */
    export interface IShapeTemplate {
        Id: string;
        IsResizable: bool;
        Width: number;
        Height: number;
        Rotation: number;
        Background: string;
        DefaultContent: any;
        ConnectorTemplates: IConnectorTemplate[];
        Edit(element: Shape, canvas: svg.Canvas, point: svg.Point);
        Clone(): IShapeTemplate;
        Geometry: string;
        Stroke: string;
        Position: svg.Point;
        StrokeThickness: number;

    }

    /**
     * Defines a connector.
     */
    export interface IConnectorTemplate {
        Name: string;
        Type: string;
        Description: string;
        GetConnectorPosition(element: Shape): svg.Point;
        CanConnectTo(other: Connector): bool;
    }

    export interface ITheme {
        background: string;
        connection: string;
        selection: string;
        connector: string;
        connectorBorder: string;
        connectorHover: string;
        connectorHoverBorder: string;
    }

    /**
     * The diagramming connection.
     */
    export class Connection implements IDiagramItem {
        private fromConnector: Connector;
        private toConnector: Connector;
        private toPoint: svg.Point = null;
        private isSelected: bool;
        private isHovered: bool;
        private visual: svg.Group;
        private line: svg.Line;
        public Diagram: Diagram;
        private endCap: svg.Marker;
        private startCap: svg.Marker;
        private unselectedColor: string;
        private contentVisual: svg.Visual;

        public get Visual() {
            return this.visual;
        }

        public set Content(v: any) {
            if (v == null) this.removeContent();
            var tb = new svg.TextBlock();
            tb.dy = -5;
            tb.Text = v.toString();
            this.contentVisual = tb;
            this.visual.Append(this.contentVisual);
            this.Invalidate();
        }

        private removeContent() {
            if (this.contentVisual == null) return;
            this.visual.Remove(this.contentVisual);
            this.contentVisual = null;
        }

        constructor(from: Connector, to: Connector) {
            this.fromConnector = from;
            this.toConnector = to;
            this.createVisual();
        }

        private createVisual() {
            var g = new svg.Group; //the group contains the line and the label
            this.line = new svg.Line();
            this.line.Stroke = "Green";
            g.Append(this.line);
            this.visual = g;
            this.updateCoordinates();
            this.unselectedColor = this.line.Stroke;
            this.line.StrokeThickness = 1;
        }

        private updateCoordinates() {
            if (this.toConnector == null) {
                // means we are dragging a new connection
                if (this.toPoint == null || isNaN(this.toPoint.X) || isNaN(this.toPoint.Y)) return;
                var globalSourcePoint = this.fromConnector.Parent.GetConnectorPosition(this.fromConnector);
                var globalSinkPoint = this.toPoint;
                var bounds = svg.Rect.FromPoints(globalSourcePoint, globalSinkPoint);
                var localSourcePoint = globalSourcePoint.Minus(bounds.TopLeft);
                var localSinkPoint = globalSinkPoint.Minus(bounds.TopLeft);
                this.line.From = localSourcePoint; //local coordinate!
                this.line.To = localSinkPoint; //local coordinate!
                this.visual.Position = bounds.TopLeft;//global coordinates!
                return;
            }
            var globalSourcePoint = this.fromConnector.Parent.GetConnectorPosition(this.fromConnector);
            var globalSinkPoint = this.toConnector.Parent.GetConnectorPosition(this.toConnector);
            var bounds = svg.Rect.FromPoints(globalSourcePoint, globalSinkPoint);
            var localSourcePoint = globalSourcePoint.Minus(bounds.TopLeft);
            var localSinkPoint = globalSinkPoint.Minus(bounds.TopLeft);
            this.line.From = localSourcePoint; //local coordinate!
            this.line.To = localSinkPoint; //local coordinate!
            this.visual.Position = bounds.TopLeft;//global coordinates!

            if (this.contentVisual != null) {
                var m = svg.Point.MiddleOf(localSourcePoint, localSinkPoint);
                this.contentVisual.Position = m;
                var p = localSinkPoint.Minus(localSourcePoint);
                var tr = this.contentVisual.Native.ownerSVGElement.createSVGTransform();
                tr.setRotate(p.ToPolar(true).Angle, m.X, m.Y);
                var tb = <SVGTextElement>this.contentVisual.Native;
                if (tb.transform.baseVal.numberOfItems == 0)
                    tb.transform.baseVal.appendItem(tr);
                else
                    tb.transform.baseVal.replaceItem(tr, 0);

            }

        }

        private updateVisual() {
            this.updateCoordinates();
            if (this.isSelected) {
                this.line.Stroke = "Orange";
                this.line.StrokeThickness = 2;
                if (this.EndCap != null) this.EndCap.Color = "Orange";
                if (this.StartCap != null) this.StartCap.Color = "Orange";

            }
            else {
                this.line.Stroke = this.unselectedColor;
                this.line.StrokeThickness = 1;
                if (this.EndCap != null) this.EndCap.Color = this.unselectedColor;
                if (this.StartCap != null) this.StartCap.Color = this.unselectedColor;
            }
        }

        private updateContent() {

        }

        public set EndCap(marker: svg.Marker) {
            if (marker == null) throw "Given Marker is null.";
            if (marker.Id == null) throw "Given Marker has no Id.";
            marker.Color = this.Stroke;
            this.Diagram.AddMarker(marker);
            this.line.MarkerEnd = marker;
            this.endCap = marker;
        }

        public get EndCap() {
            return this.endCap;
        }

        public set StartCap(marker: svg.Marker) {
            if (marker == null) throw "Given Marker is null.";
            if (marker.Id == null) throw "Given Marker has no Id.";
            marker.Color = this.Stroke;
            this.Diagram.AddMarker(marker);
            this.line.MarkerStart = marker;
            this.startCap = marker;
        }

        public get StartCap() {
            return this.startCap;
        }

        public set Stroke(value: string) {
            this.line.Stroke = value;
            this.unselectedColor = value;
        }

        public get Stroke(): string {
            return this.line.Stroke;
        }

        public set StrokeDash(value: string) {
            this.line.StrokeDash = value;
        }

        public get StrokeDash(): string {
            return this.line.StrokeDash;
        }

        /**
         *  Gets the source connector.
         */
        public get From(): Connector {
            return this.fromConnector;
        }

        /**
         * Sets the source connector.
         */
        public set From(v: Connector) {
            this.fromConnector = v;
        }

        /**
         *  Gets the sink connector.
         */
        public get To(): Connector {
            return this.toConnector;
        }

        /**
         * Sets the target connector.
         */
        public set To(v: Connector) {
            this.toConnector = v;
        }

        /**
         *  Gets whether this connection is selected.
         */
        public get IsSelected(): bool {
            return this.isSelected;
        }

        /**
         *  Sets whether this connection is selected.
         */
        public set IsSelected(value: bool) {
            this.isSelected = value;
            this.Invalidate();
        }

        /**
         *  Gets whether this connection is hovered.
         */
        public get IsHovered(): bool {
            return this.isHovered;
        }

        /**
         *  Sets whether this connection is hovered.
         */
        public set IsHovered(value: bool) {
            this.isHovered = value;
        }

        public UpdateEndPoint(toPoint: svg.Point) {
            this.toPoint = toPoint;
            this.updateCoordinates();
        }

        public GetCursor(point: svg.Point): string {
            return Cursors.select;
        }

        public HitTest(rectangle: svg.Rect): bool {
            if ((this.From != null) && (this.To != null)) {
                var p1: svg.Point = this.From.Parent.GetConnectorPosition(this.From);
                var p2: svg.Point = this.To.Parent.GetConnectorPosition(this.To);
                if ((rectangle.Width != 0) || (rectangle.Width != 0)) return (rectangle.Contains(p1) && rectangle.Contains(p2));

                var p: svg.Point = rectangle.TopLeft;

                // p1 must be the leftmost point
                if (p1.X > p2.X) {
                    var temp = p2;
                    p2 = p1;
                    p1 = temp;
                }

                var r1 = new svg.Rect(p1.X, p1.Y, 0, 0);
                var r2 = new svg.Rect(p2.X, p2.Y, 0, 0);
                r1.Inflate(3, 3);
                r2.Inflate(3, 3);

                if (r1.Union(r2).Contains(p)) {
                    if ((p1.X == p2.X) || (p1.Y == p2.Y)) return true;
                    else if (p1.Y < p2.Y) {
                        var o1 = r1.X + (((r2.X - r1.X) * (p.Y - (r1.Y + r1.Height))) / ((r2.Y + r2.Height) - (r1.Y + r1.Height)));
                        var u1 = (r1.X + r1.Width) + ((((r2.X + r2.Width) - (r1.X + r1.Width)) * (p.Y - r1.Y)) / (r2.Y - r1.Y));
                        return ((p.X > o1) && (p.X < u1));
                    }
                    else {
                        var o2 = r1.X + (((r2.X - r1.X) * (p.Y - r1.Y)) / (r2.Y - r1.Y));
                        var u2 = (r1.X + r1.Width) + ((((r2.X + r2.Width) - (r1.X + r1.Width)) * (p.Y - (r1.Y + r1.Height))) / ((r2.Y + r2.Height) - (r1.Y + r1.Height)));
                        return ((p.X > o2) && (p.X < u2));
                    }
                }
            }
            return false;
        }

        public Invalidate() {
            this.updateVisual();
        }

        public paint(context: svg.Canvas) {
            //context.strokeStyle = this.From.Parent.graph.theme.connection;
            //context.lineWidth = (this.isHovered) ? 2 : 1;
            //this.paintLine(context, this.isSelected);
        }

        public paintAdorner(context: svg.Canvas) {
            //context.strokeStyle = this.From.Parent.graph.theme.connection;
            //context.lineWidth = 1;
            this.paintLine(context, true);
        }

        public paintLine(context: svg.Canvas, dashed: bool) {
            if (this.From != null) {
                var Start: svg.Point = this.From.Parent.GetConnectorPosition(this.From);
                var end: svg.Point = (this.To != null) ? this.To.Parent.GetConnectorPosition(this.To) : this.toPoint;
                //if ((Start.X != end.X) || (Start.Y != end.Y))
                //{
                //    context.beginPath();
                //    if (dashed)
                //    {
                //        LineHelper.dashedLine(context, Start.X, Start.Y, end.X, end.Y);
                //    }
                //    else
                //    {
                //        context.moveTo(Start.X - 0.5, Start.Y - 0.5);
                //        context.lineTo(end.X - 0.5, end.Y - 0.5);
                //    }
                //    context.closePath();
                //    context.stroke();
                //}
            }
        }
    }

    /**
     * The intermediate between a shape and a connection, aka port.
     */
    export class Connector implements IFrameworkElement {
        private parent: Shape;
        private template: IConnectorTemplate;
        private connections: Connection[] = [];
        private isHovered: bool = false;
        public Visual: svg.IVisual;

        constructor(parent: Shape, template: IConnectorTemplate) {
            this.parent = parent;
            this.template = template;
        }

        public get Parent(): Shape {
            return this.parent;
        }

        /*
         * Gets the template of this connector
         */
        public get Template(): IConnectorTemplate {
            return this.template;
        }

        public get Connections(): Connection[] {
            return this.connections;
        }

        public set Background(value) {
            this.Visual.Native.setAttribute("fill", value);
        }

        public get IsHovered(): bool {
            return this.isHovered;
        }

        public set IsHovered(value: bool) {
            this.isHovered = value;
            this.IsVisible = value;
            this.Background = value ? "Green" : "Black";
        }

        public GetCursor(point: svg.Point): string {
            return Cursors.grip;
        }

        public HitTest(r: svg.Rect): bool {
            if ((r.Width === 0) && (r.Height === 0)) return this.Rectangle.Contains(r.TopLeft);
            return r.Contains(this.Rectangle.TopLeft);
        }

        public get IsVisible() {
            return (this.Visual.Native.attributes["visibility"] == null) ? true : this.Visual.Native.attributes["visibility"].value == "visible";
        }

        public set IsVisible(value: bool) {
            if (value) this.Visual.Native.setAttribute("visibility", "visible");
            else this.Visual.Native.setAttribute("visibility", "hidden");
        }

        public Invalidate(other?: Connector) {
            var r = this.Rectangle;
            var strokeStyle: string = this.parent.Diagram.Theme.connectorBorder;
            var fillStyle: string = this.parent.Diagram.Theme.connector;
            if (this.isHovered) {
                strokeStyle = this.parent.Diagram.Theme.connectorHoverBorder;
                fillStyle = this.parent.Diagram.Theme.connectorHover;
                if (other != null && !this.CanConnectTo(other)) fillStyle = "#f00";
            }
            this.Visual.Native.setAttribute("fill", fillStyle);
        }

        public CanConnectTo(other: Connector): bool {
            if (other === this) return false;
            if (other == null) return true;
            return this.Template.CanConnectTo(other);
            //var t1: string[] = this.template.Type.split(' ');
            //if (!t1.contains("[array]") && (this.connections.length == 1)) return false;
            //if (connector instanceof Connector)
            //{
            //    var t2: string[] = connector.template.Type.split(' ');
            //    if ((t1[0] != t2[0]) ||
            //        (this.parent == connector.parent) ||
            //        (t1.contains("[in]") && !t2.contains("[out]")) ||
            //        (t1.contains("[out]") && !t2.contains("[in]")) ||
            //        (!t2.contains("[array]") && (connector.connections.length == 1)))
            //    {
            //        return false;
            //    }
            //}


        }

        public toString() {
            return "Connector";
        }

        private get Rectangle(): svg.Rect {
            var point = this.parent.GetConnectorPosition(this);
            var rectangle = new svg.Rect(point.X, point.Y, 0, 0);
            rectangle.Inflate(3, 3);
            return rectangle;
        }
    }

    export class CompositeUnit implements IUndoUnit {

        constructor(unit: IUndoUnit = null) {
            if (unit != null) this.units.push(unit);
        }

        private units: IUndoUnit[] = [];

        public add(undoUnit: IUndoUnit) {
            this.units.push(undoUnit);
        }

        public Undo() {
            for (var i = 0; i < this.units.length; i++) this.units[i].Undo();
        }

        public Redo() {
            for (var i = 0; i < this.units.length; i++) this.units[i].Redo();
        }

        public get Title() {
            return "Composite unit";
        }

        public get IsEmpty() {
            if (this.units.length > 0) {
                for (var i = 0; i < this.units.length; i++) {
                    if (!this.units[i].IsEmpty) {
                        return false;
                    }
                }
            }
            return true;
        }
    }


    export interface Touch {
        identifier: number;
        target: EventTarget;
        screenX: number;
        screenY: number;
        clientX: number;
        clientY: number;
        pageX: number;
        pageY: number;
    }


    export interface TouchList {
        length: number;
        item(index: number): Touch;
        identifiedTouch(identifier: number): Touch;
    }


    export interface TouchEvent extends UIEvent {
        touches: TouchList;
        targetTouches: TouchList;
        changedTouches: TouchList;
        altKey: bool;
        metaKey: bool;
        ctrlKey: bool;
        shiftKey: bool;
        initTouchEvent(type: string, canBubble: bool, cancelable: bool, view: AbstractView, detail: number, ctrlKey: bool, altKey: bool, shiftKey: bool, metaKey: bool, touches: TouchList, targetTouches: TouchList, changedTouches: TouchList);
    }
    ;

    export declare var TouchEvent: {
        prototype: TouchEvent;
        new (): TouchEvent;
    }

    export class ContentChangedUndoUnit implements IUndoUnit {
        public get Title() {
            return "Content Editing";
        }

        private item: Shape;
        private _undoContent: any;
        private _redoContent: any;

        constructor(element: Shape, content: any) {
            this.item = element;
            this._undoContent = element.Content;
            this._redoContent = content;
        }

        public Undo() {
            this.item.Content = this._undoContent;
        }

        public Redo() {
            this.item.Content = this._redoContent;
        }

        public get IsEmpty(): bool {
            return false;
        }
    }

    /**
     * An undo-redo unit handling the deletion of a connection.
     */
    export class DeleteConnectionUnit implements IUndoUnit {
        private connection: Connection;
        private from: Connector;
        private to: Connector;
        private diagram: Diagram;

        public get Title() {
            return "Delete connection";
        }


        constructor(connection: Connection) {
            this.connection = connection;
            this.diagram = connection.Diagram;
            this.from = connection.From;
            this.to = connection.To;
        }

        public Undo() {
            this.diagram.AddConnection(this.connection);
        }

        public Redo() {
            this.diagram.RemoveConnection(this.connection);
        }

        public get IsEmpty(): bool {
            return false;
        }
    }

    /**
     * An undo-redo unit handling the deletion of a diagram element.
     */
    export class DeleteShapeUnit implements IUndoUnit {
        public get Title() {
            return "Deletion";
        }

        private shape: Shape;
        private diagram: Diagram;

        constructor(shape: Shape) {
            this.shape = shape;
            this.diagram = shape.Diagram;
        }

        public Undo() {
            this.diagram.AddItem(this.shape);
            this.shape.IsSelected = false;
        }

        public Redo() {
            this.shape.IsSelected = false;
            this.diagram.RemoveShape(this.shape);
        }

        public get IsEmpty(): bool {
            return false;
        }
    }

    /**
     * An undo-redo unit handling the transformation of a diagram element.
     */
    export class TransformUnit implements IUndoUnit {
        public get Title() {
            return "Transformation";
        }

        private shape: Shape;
        private undoRectangle: svg.Rect;
        private redoRectangle: svg.Rect;

        constructor(shape: Shape, undoRectangle: svg.Rect, redoRectangle: svg.Rect) {
            this.shape = shape;
            this.undoRectangle = undoRectangle.Clone();
            this.redoRectangle = redoRectangle.Clone();
        }

        public Undo() {
            // if (this.shape.IsSelected) this.shape.Adorner.Rectangle = this.undoRectangle;
            this.shape.Rectangle = this.undoRectangle;
            this.shape.Invalidate();
        }

        public Redo() {
            //if (this.shape.IsSelected)
            //{
            //    this.shape.Adorner.Rectangle = this.redoRectangle;
            //    this.shape.Adorner.paint
            //}
            this.shape.Rectangle = this.redoRectangle;
            this.shape.Invalidate();

        }

        public get IsEmpty(): bool {
            return false;
        }
    }

    /**
     * An undo-redo unit handling the addition of a connection.
     */
    export class AddConnectionUnit implements IUndoUnit {
        private connection: Connection;
        private from: Connector;
        private to: Connector;

        public get Title() {
            return "New connection";
        }

        private diagram: Diagram;

        constructor(connection: Connection, from: Connector, to: Connector) {
            this.connection = connection;
            this.diagram = connection.Diagram;
            this.from = from;
            this.to = to;
        }

        public Undo() {
            this.diagram.RemoveConnection(this.connection);
        }

        public Redo() {
            this.diagram.AddConnection(this.connection);
        }

        public get IsEmpty(): bool {
            return false;
        }
    }

    /**
     * An undo-redo unit handling the addition of diagram item.
     */
    export class AddShapeUnit implements IUndoUnit {
        private shape: Shape;
        private diagram: Diagram;

        public get Title() {
            return "Insert";
        }

        constructor(shape: Shape, diagram: Diagram) {
            this.shape = shape;
            this.diagram = diagram;
        }

        public Undo() {
            this.diagram.RemoveShape(this.shape);
        }

        public Redo() {
            this.diagram.AddItem(this.shape);
        }

        public get IsEmpty(): bool {
            return false;
        }
    }

    /**
     * An undo-redo unit handling the selection of items.
     */
    export class SelectionUndoUnit implements IUndoUnit {
        private shapeStates: any[] = [];

        public get Title() {
            return "Selection Unit";
        }

        public Undo() {
            for (var i: number = 0; i < this.shapeStates.length; i++) this.shapeStates[i].Item.IsSelected = this.shapeStates[i].undo;
        }

        public Redo() {
            for (var i: number = 0; i < this.shapeStates.length; i++) this.shapeStates[i].Item.IsSelected = this.shapeStates[i].redo;
        }

        public get IsEmpty(): bool {
            for (var i = 0; i < this.shapeStates.length; i++)
                if (this.shapeStates[i].undo != this.shapeStates[i].redo) return false;
            return true;
        }

        public select(item: IDiagramItem) {
            this.Refresh(item, item.IsSelected, true);
        }

        public deselect(Item: IDiagramItem) {
            this.Refresh(Item, Item.IsSelected, false);
        }

        private Refresh(item: IDiagramItem, undo: bool, redo: bool) {
            for (var i = 0; i < this.shapeStates.length; i++) {
                if (this.shapeStates[i].Item == item) {
                    this.shapeStates[i].redo = redo;
                    return;
                }
            }
            this.shapeStates.push({ Item: item, undo: undo, redo: redo });
        }
    }
    /**
        * An undo-redo unit handling the selection of items.
        */
    export class PanUndoUnit implements IUndoUnit {
        private initial: svg.Point;
        private final: svg.Point;
        private diagram: Diagram;
        constructor(initial: svg.Point, final: svg.Point, diagram: Diagram) {
            this.initial = initial;
            this.final = final;
            this.diagram = diagram;
        }
        public get Title() {
            return "Pan Unit";
        }

        public Undo() {
            this.diagram.Pan = this.initial;
        }

        public Redo() {
            this.diagram.Pan = this.final;
        }

        public get IsEmpty(): bool {
            return false;
        }
    }

    /*
     * The node or shape.
     */
    export class Shape implements IDiagramItem {
        private template: IShapeTemplate;
        private rectangle: svg.Rect;

        private _content;
        private isHovered: bool = false;
        private isSelected: bool = false;
        private adorner: ResizingAdorner = null;
        private connectors: Connector[] = [];
        public Diagram: Diagram;
        private visual: svg.Group;
        private mainVisual: svg.Visual;
        private rotation: svg.Rotation = new svg.Rotation(0);
        private translation: svg.Translation = new svg.Translation(0, 0);

        /*
         * Gets whether this shape is visible.
         */
        public get IsVisible() {
            return (this.Visual.Native.attributes["visibility"] == null) ? true : this.Visual.Native.attributes["visibility"].value == "visible";
        }

        /*
         * Sets whether this shape is visible.
         */
        public set IsVisible(value: bool) {
            if (value) this.Visual.Native.setAttribute("visibility", "visible");
            else this.Visual.Native.setAttribute("visibility", "hidden");
        }

        /*
         * Gets SVG visual this shape represents.
         */
        public get Visual(): svg.IVisual {
            return this.visual;
            ;
        }

        /*
         * Instantiates a new Shape.
         */
        constructor(template: IShapeTemplate, point: svg.Point) {
            this.template = template;
            this._content = template.DefaultContent;
            this.rectangle = svg.Rect.Create(point.X, point.Y, Math.floor(template.Width), Math.floor(template.Height));
            this.createVisual();
        }

        private getTemplateVisual(): svg.Visual {
            if (this.template == null) throw "Template is not set.";
            if (this.template.Geometry == null) throw "Geometry is not set in the template.";
            var v: svg.Visual = null;
            if (this.template.Geometry.toLowerCase() == "rectangle") {
                v = new svg.Rectangle();
            }
            else {
                var path = new svg.Path();
                path.Data = this.template.Geometry;
                v = path;
            }
            v.Stroke = this.template.Stroke;
            v.StrokeThickness = this.template.StrokeThickness;
            v.Background = this.template.Background;
            v.Width = this.template.Width;
            v.Height = this.template.Height;
            if (this.template.Rotation != 0) {
                var r = this.template.Rotation;
                //                if(r == 90 || r == 270 || r == 83)
                //                {
                //                   v.Height = v.Width;
                //                   v.Width = v.Height;
                //                   console.log(v.Id);
                //                }
            }
            return v;
        }

        public get Width() {
            return this.Rectangle.Width;
        }

        public set Width(v: number) {
            this.Rectangle.Width = v;
            this.Invalidate();
        }

        public get Height() {
            return this.Rectangle.Height;
        }

        public set Height(v: number) {
            this.Rectangle.Height = v;
            this.Invalidate();
        }

        /**
         * Gets the CSS class of this shape.
         */
        public set Class(v: string) {
            this.visual.Class = v;
        }

        /**
         * Sets the CSS class of this shape.
         */
        public get Class(): string {
            return this.visual.Class;
        }

        /*
         * Creates the underlying SVG hierarchy for this shape on the basis of the set IShapeTemplate.
         */
        private createVisual() {
            var g = new svg.Group();
            g.Id = this.template.Id;
            g.Position = this.rectangle.TopLeft;

            var vis = this.getTemplateVisual();
            vis.Position = svg.Point.Empty;
            g.Append(vis);
            this.mainVisual = vis; //in order to update
            g.Title = (g.Id == null || g.Id.length == 0) ? "Shape" : g.Id;
            if (this.template.ConnectorTemplates.length > 0) {
                for (var i = 0; i < this.template.ConnectorTemplates.length; i++) {
                    var ct = this.template.ConnectorTemplates[i];
                    var connector = new Connector(this, ct);
                    var c = new svg.Rectangle();
                    c.Width = 7;
                    c.Height = 7;
                    var relative = ct.GetConnectorPosition(this);
                    c.Position = new svg.Point(relative.X - 3, relative.Y - 3);
                    connector.Visual = c;
                    connector.IsVisible = false;
                    connector.Parent = this;
                    var text = (ct.Description == null || ct.Description.length == 0) ? ct.Name : ct.Description;
                    c.Title = text;
                    g.Append(c);
                    this.Connectors.push(connector);
                }
            }
            //if (this.template.Rotation != 0)
            //{
            //    var rot = new svg.Rotation(this.template.Rotation);
            //    g.PrePendTransform(rot);
            //}
            this.visual = g;
        }


        /**
         * Sets the title of this visual.
         */
        public get Title(): string {
            return this.visual.Title;
        }

        /**
         * Gets the title of this visual.
         */
        public set Title(v: string) {
            this.visual.Title = v;
        }

        /*
         * Gets the identifier of this shape.
         */
        public get Id() {
            return this.Template.Id;
        }

        /*
         * Gets the bounding rectangle of this shape.
         */
        public get Rectangle(): svg.Rect {
            return ((this.adorner != null)) ? this.adorner.Rectangle : this.rectangle;//&& (this.adorner.IsManipulation)
        }

        /*
         * Sets the bounding rectangle of this shape.
         */
        public set Rectangle(r: svg.Rect) {
            this.rectangle = r;
            if (this.adorner != null) this.adorner.UpdateRectangle(r);
            this.Invalidate();
        }

        /*
         * Gets the shape template.
         */
        public get Template(): IShapeTemplate {
            return this.template;
        }

        /*
         * Gets the connectors of this shape.
         */
        public get Connectors(): Connector[] {
            return this.connectors;
        }

        /*
         * Gets the resizing adorner of this shape.
         */
        public get Adorner(): ResizingAdorner {
            return this.adorner;
        }

        /*
         * Gets whether this shape is selected.
         */
        public get IsSelected(): bool {
            return this.isSelected;
        }

        /*
         * Sets whether this shape is selected.
         */
        public set IsSelected(value: bool) {
            if (this.isSelected != value) {
                this.isSelected = value;

                if (this.isSelected) {
                    this.adorner = new ResizingAdorner(this.Rectangle, this.template.IsResizable);
                    this.Diagram.MainLayer.Append(this.adorner.Visual);
                    this.Invalidate();
                }
                else {
                    this.Invalidate();
                    this.Diagram.MainLayer.Remove(this.adorner.Visual);
                    this.adorner = null;
                }
            }
        }

        /*
         * Gets whether the mouse pointer is currently over this shape.
         */
        public get IsHovered(): bool {
            return this.isHovered;
        }

        /*
         * Sets whether the mouse pointer is currently over this shape.
         */
        public set IsHovered(value: bool) {
            this.isHovered = value;
            if (this.Connectors.length > 0)
                for (var i = 0; i < this.Connectors.length; i++) this.Connectors[i].IsVisible = value;

        }

        public paint(context: svg.Canvas) {
            //this.template.paint(this, context);
            if (this.isSelected) this.adorner.paint(context);
        }
        public set Position(value: svg.Point) {
            this.translation.X = value.X;
            this.translation.Y = value.Y;
            this.visual.Native.setAttribute("transform", this.translation.toString() + this.rotation.toString());
        }
        public Invalidate() {
            this.Position = this.Rectangle.TopLeft;
            this.mainVisual.Width = this.Rectangle.Width;
            this.mainVisual.Height = this.Rectangle.Height;
            if (this.Connectors.length > 0) {
                var cons = [];
                for (var i = 0; i < this.Connectors.length; i++) {
                    var c = this.Connectors[i];
                    var ct = this.Template.ConnectorTemplates[i];
                    var relative = ct.GetConnectorPosition(this);
                    c.Visual.Position = new svg.Point(relative.X - 3, relative.Y - 3);
                    if (c.Connections.length > 0) {
                        for (var j = 0; j < c.Connections.length; j++)
                            if (!cons.contains(c.Connections[j])) cons.push(c.Connections[j]);
                    }
                }
                cons.forEach((con: Connection) => con.Invalidate());
            }
        }

        public toString() {
            return (this.Template == null) ? "Shape" : ("Shape '" + this.Template.Id) + "'";
        }

        /**
         * Hit testing of this item with respect to the given rectangle.
         * @param r The rectangle to test.
         */
        public HitTest(r: svg.Rect): bool {
            if ((r.Width === 0) && (r.Height === 0)) {
                if (this.Rectangle.Contains(r.TopLeft)) return true;
                if ((this.adorner != null)) {
                    var h = this.adorner.HitTest(r.TopLeft);
                    if ((h.X >= -1) && (h.X <= +1) && (h.Y >= -1) && (h.Y <= +1)) return true;
                }
                for (var i = 0; i < this.connectors.length; i++)
                    if (this.connectors[i].HitTest(r)) return true;

                return false;
            }
            return r.Contains(this.Rectangle.TopLeft);
        }

        public GetCursor(point: svg.Point): string {
            if (this.adorner != null) {
                var cursor = this.adorner.GetCursor(point);
                if (cursor != null) return cursor;
            }
            if (window.event.shiftKey) return Cursors.add;
            return Cursors.select;
        }

        public GetConnector(name: string): Connector {
            for (var i: number = 0; i < this.connectors.length; i++) {
                var connector = this.connectors[i];
                if (connector.Template.Name == name) return connector;
            }
            return null;
        }

        public GetConnectorPosition(connector: Connector): svg.Point {
            var r = this.Rectangle;
            var point: svg.Point = connector.Template.GetConnectorPosition(this);
            point.X += r.X;
            point.Y += r.Y;
            return point;
        }

        public setContent(content: any) {
            this.Diagram.setElementContent(this, content);
        }

        public get Content(): any {
            return this._content;
        }

        public set Content(value: any) {
            this._content = value;
        }
    }

    /**
     * The service handling the undo-redo stack.
     */
    export class UndoRedoService {
        private composite: CompositeUnit = null;
        private stack: CompositeUnit[] = [];
        private index: number = 0;

        /**
         * Starts a new composite unit which can be either cancelled or committed.
         */
        public begin() {
            this.composite = new CompositeUnit();
        }

        public Cancel() {
            this.composite = null;
        }

        public commit() {
            if (!this.composite.IsEmpty) {
                // throw away anything beyond this point if this is a new branch
                this.stack.splice(this.index, this.stack.length - this.index);
                this.stack.push(this.composite);
                this.Redo();
            }
            this.composite = null;
        }

        /**
         * Adds the given undoable unit to the current composite. Use the simple add() method if you wish to do things in one swing.
         * @param undoUnit The undoable unit to add.
         */
        public AddCompositeItem(undoUnit: IUndoUnit) {
            if (this.composite == null) throw "Use begin() to initiate and then add an undoable unit.";
            this.composite.add(undoUnit);
        }

        /**
         * Adds the given undoable unit to the stack and executes it.
         * @param undoUnit The undoable unit to add.
         */
        public Add(undoUnit: IUndoUnit) {
            if (undoUnit == null) throw "No undoable unit supplied."
            // throw away anything beyond this point if this is a new branch
            this.stack.splice(this.index, this.stack.length - this.index);
            this.stack.push(new CompositeUnit(undoUnit));
            this.Redo();
        }

        /**
         * Returns the number of composite units in this undo-redo stack.
         */
        public count() {
            return this.stack.length;
        }

        public Undo() {
            if (this.index != 0) {
                this.index--;
                this.stack[this.index].Undo();
            }
        }

        public Redo() {
            if ((this.stack.length != 0) && (this.index < this.stack.length)) {
                this.stack[this.index].Redo();
                this.index++;
            }
            else {
                throw "Reached the end of the undo-redo stack.";
            }
        }
    }
    interface PointVisualMap {
        [p: string]: svg.Rectangle;
    }

    /**
     * The adorner supporting the scaling of items.
     */
    export class ResizingAdorner {
        private rectangle: svg.Rect;
        private isresizable: bool;
        private isManipulating: bool = false;
        private currentHandle: svg.Point;
        private currentPoint: svg.Point;
        private map: PointVisualMap = {};
        private visual: svg.Group;
        private text: svg.TextBlock;

        public get Visual() {
            return this.visual;
        }

        private initialState: svg.Rect = null;
        private finalState: svg.Rect = null;

        public get InitialState() {
            return this.initialState;
        }

        public get FinalState() {
            return this.finalState;
        }

        constructor(rectangle: svg.Rect, resizable: bool) {
            this.rectangle = rectangle.Clone();
            this.isresizable = resizable;
            this.createVisuals();
        }

        public get Rectangle(): svg.Rect {
            return this.rectangle;
        }

        private createVisuals() {
            var g = new svg.Group();
            for (var x: number = -1; x <= +1; x++) {
                for (var y: number = -1; y <= +1; y++) {
                    if ((x != 0) || (y != 0)) {
                        var r = this.GetHandleBounds(new svg.Point(x, y));
                        var visual = new svg.Rectangle();
                        visual.Position = r.TopLeft;
                        visual.Width = 7;
                        visual.Height = 7;
                        visual.Background = "DimGray";

                        this.map[x.toString() + y.toString()] = visual;
                        g.Append(visual);
                    }
                }
            }
            g.Position = this.rectangle.TopLeft;
            g.IsVisible = true;
            this.text = new svg.TextBlock();
            this.text.FontSize = 10;
            this.text.Position = new svg.Point(0, this.rectangle.Height + 20);
            this.text.Text = "Width: " + this.rectangle.Width + ", Height: " + this.rectangle.Height;
            g.Append(this.text);
            this.visual = g;
        }

        private updateVisual() {
            for (var x = -1; x <= +1; x++) {
                for (var y = -1; y <= +1; y++) {
                    if ((x != 0) || (y != 0)) {
                        var v = this.map[x.toString() + y.toString()];
                        var r = this.GetHandleBounds(new svg.Point(x, y));
                        v.Position = r.TopLeft;
                    }
                }
            }
            this.text.Position = new svg.Point(0, this.rectangle.Height + 20);
            this.text.Text = "Width: " + this.rectangle.Width + ", Height: " + this.rectangle.Height;
            this.visual.Position = this.rectangle.TopLeft;
        }

        public HitTest(point: svg.Point): svg.Point {
            // (0, 0) element, (-1, -1) top-left, (+1, +1) bottom-right
            if (this.isresizable) {
                for (var x = -1; x <= +1; x++) {
                    for (var y = -1; y <= +1; y++) {
                        if ((x != 0) || (y != 0)) {
                            var hit = new svg.Point(x, y);
                            var r = this.GetHandleBounds(hit);//local coordinates
                            r.Offset(this.rectangle.X, this.rectangle.Y);
                            if (r.Contains(point)) return hit;
                        }
                    }
                }
            }

            if (this.rectangle.Contains(point)) return new svg.Point(0, 0);
            return new svg.Point(-2, -2);
        }

        public GetHandleBounds(p: svg.Point): svg.Rect {
            var r = new svg.Rect(0, 0, 7, 7);
            if (p.X < 0) {
                r.X = -7;
            }
            if (p.X === 0) {
                r.X = Math.floor(this.rectangle.Width / 2) - 3;
            }
            if (p.X > 0) {
                r.X = this.rectangle.Width + 1.0;
            }
            if (p.Y < 0) {
                r.Y = -7;
            }
            if (p.Y === 0) {
                r.Y = Math.floor(this.rectangle.Height / 2) - 3;
            }
            if (p.Y > 0) {
                r.Y = this.rectangle.Height + 1.0;
            }
            return r;
        }

        public GetCursor(point: svg.Point): string {
            var hit = this.HitTest(point);
            if ((hit.X === 0) && (hit.Y === 0)) return (this.isManipulating) ? Cursors.MoveTo : Cursors.select;
            if ((hit.X >= -1) && (hit.X <= +1) && (hit.Y >= -1) && (hit.Y <= +1) && this.isresizable) {
                if (hit.X === -1 && hit.Y === -1) {
                    return "nw-resize";
                }
                if (hit.X === +1 && hit.Y === +1) {
                    return "se-resize";
                }
                if (hit.X === -1 && hit.Y === +1) {
                    return "sw-resize";
                }
                if (hit.X === +1 && hit.Y === -1) {
                    return "ne-resize";
                }
                if (hit.X === 0 && hit.Y === -1) {
                    return "n-resize";
                }
                if (hit.X === 0 && hit.Y === +1) {
                    return "s-resize";
                }
                if (hit.X === +1 && hit.Y === 0) {
                    return "e-resize";
                }
                if (hit.X === -1 && hit.Y === 0) {
                    return "w-resize";
                }
            }
            return null;
        }

        public Start(point: svg.Point, handle: svg.Point) {
            if ((handle.X >= -1) && (handle.X <= +1) && (handle.Y >= -1) && (handle.Y <= +1)) {
                this.currentHandle = handle;
                this.initialState = this.rectangle;
                this.finalState = null;
                this.currentPoint = point;
                this.isManipulating = true;
            }
        }

        public Stop() {
            this.finalState = this.rectangle;
            this.isManipulating = false;
        }

        public get IsManipulation(): bool {
            return this.isManipulating;
        }

        public MoveTo(p: svg.Point) {
            var h = this.currentHandle;
            var a = svg.Point.Empty;
            var b = svg.Point.Empty;
            if ((h.X == -1) || ((h.X === 0) && (h.Y === 0))) {
                a.X = p.X - this.currentPoint.X;
            }
            if ((h.Y == -1) || ((h.X === 0) && (h.Y === 0))) {
                a.Y = p.Y - this.currentPoint.Y;
            }
            if ((h.X == +1) || ((h.X === 0) && (h.Y === 0))) {
                b.X = p.X - this.currentPoint.X;
            }
            if ((h.Y == +1) || ((h.X === 0) && (h.Y === 0))) {
                b.Y = p.Y - this.currentPoint.Y;
            }
            var tl = this.rectangle.TopLeft;
            var br = new svg.Point(this.rectangle.X + this.rectangle.Width, this.rectangle.Y + this.rectangle.Height);
            tl.X += a.X;
            tl.Y += a.Y;
            br.X += b.X;
            br.Y += b.Y;
            //if (a.X != 0 || a.Y != 0) console.log("a: (" + a.X + "," + a.Y + ")");
            //if (b.X != 0 || b.Y != 0) console.log("b: (" + b.X + "," + b.Y + ")");

            //cut-off
            if (Math.abs(br.X - tl.X) <= 4 || Math.abs(br.Y - tl.Y) <= 4) return;
            this.rectangle.X = tl.X;
            this.rectangle.Y = tl.Y;
            this.rectangle.Width = Math.floor(br.X - tl.X);
            this.rectangle.Height = Math.floor(br.Y - tl.Y);
            this.currentPoint = p;
            this.updateVisual();
        }

        public UpdateRectangle(r: svg.Rect) {
            this.rectangle = r.Clone();
            this.updateVisual();
        }

        public paint(context: svg.Canvas) {

        }
    }

    /**
     * The service handling the undo-redo stack.
     */
    export class Selector {
        private startPoint: svg.Point;
        private currentPoint: svg.Point;
        private visual: svg.Rectangle;
        private diagram: Diagram;
        public IsActive: bool = false;

        public get Visual(): svg.Rectangle {
            return this.visual;
        }

        constructor(diagram: Diagram) {
            this.visual = new svg.Rectangle();
            //this.visual.Background = "#778899";
            this.visual.Stroke = "#778899";
            this.visual.StrokeThickness = 1;
            this.visual.StrokeDash = "2,2";
            this.visual.Opacity = 0.0;
            this.diagram = diagram;
            //this.visual.IsVisible = false;
        }

        public Start(startPoint: svg.Point) {
            this.startPoint = startPoint;
            this.currentPoint = startPoint;
            this.visual.IsVisible = true;
            this.visual.Position = startPoint;
            this.diagram.MainLayer.Append(this.visual);
            this.IsActive = true;
            //console.log(this.startPoint.toString());
        }

        public End() {
            if (!this.IsActive) return;
            //console.log(this.currentPoint.toString());
            this.startPoint = null;
            this.currentPoint = null;
            this.visual.IsVisible = false;
            this.diagram.MainLayer.Remove(this.visual);
            this.IsActive = false;
        }

        public get Rectangle(): svg.Rect {
            var r = new svg.Rect(
                (this.startPoint.X <= this.currentPoint.X) ? this.startPoint.X : this.currentPoint.X,
                (this.startPoint.Y <= this.currentPoint.Y) ? this.startPoint.Y : this.currentPoint.Y,
                this.currentPoint.X - this.startPoint.X,
                this.currentPoint.Y - this.startPoint.Y);
            if (r.Width < 0) r.Width *= -1;
            if (r.Height < 0) r.Height *= -1;
            return r;
        }

        public updateCurrentPoint(p: svg.Point) {
            this.currentPoint = p;
        }

        public paint(context: svg.Canvas) {
            var r = this.Rectangle;
            this.visual.Position = r.TopLeft;
            this.visual.Width = r.Width + 1;
            this.visual.Height = r.Height + 1;
        }
    }

    /**
     * Defines a standard shape template with four connectors.
     */
    export class ShapeTemplateBase implements IShapeTemplate {
        public IsResizable = true;
        public DefaultContent = "";
        public Geometry: string;
        public Stroke: string;
        public StrokeThickness: number;
        public Background: string;
        public Id: string;
        public Width: number;
        public Height: number;
        public Rotation: number;
        public Position: svg.Point;
        public ConnectorTemplates = [
            {
                Name: "Top",
                Type: "Data [in]",
                Description: "Top Connector",
                GetConnectorPosition: function (parent) {
                    return new svg.Point(Math.floor(parent.Rectangle.Width / 2), 0);
                },
                CanConnectTo: function (other: Connector) {
                    return other.Template.Name == "Top";
                }
            },
            {
                Name: "Right",
                Type: "Data [in]",
                Description: "Right Connector",
                GetConnectorPosition: function (parent) {
                    return new svg.Point(Math.floor(parent.Rectangle.Width), Math.floor(parent.Rectangle.Height / 2));
                },
                CanConnectTo: function (other: Connector) {
                    return other.Template.Name == "Left";
                }
            },
            {
                Name: "Bottom",
                Type: "Data [out] [array]",
                Description: "Bottom Connector",
                GetConnectorPosition: function (parent) {
                    return new svg.Point(Math.floor(parent.Rectangle.Width / 2), parent.Rectangle.Height);
                },
                CanConnectTo: function (other) {
                    return other.Template.Name == "Bottom";
                }
            },
            {
                Name: "Left",
                Type: "Data [in]",
                Description: "Left Connector",
                GetConnectorPosition: function (parent) {
                    return new svg.Point(0, Math.floor(parent.Rectangle.Height / 2));
                },
                CanConnectTo: function (other: Connector) {
                    return other.Template.Name == "Right";
                }
            }
        ];

        public Edit(element: Shape, canvas: svg.Canvas, point: svg.Point) {
            // will do later on
        }

            ;

                constructor(id: string = null) {
                this.Id = id;
                this.Width = 150;
                this.Height = 80;
                this.Position = svg.Point.Empty;
                this.Stroke = "Silver";
                this.StrokeThickness = 0;
                this.Background = "#1e90ff";
            }

        public Clone(): ShapeTemplateBase {
            var clone = new ShapeTemplateBase();
            clone.Id = this.Id;
            clone.Width = this.Width;
            clone.Height = this.Height;
            clone.Position = this.Position;
            clone.Background = this.Background;
            return clone;
        }
    }

    /**
     * A collection of pre-defined shapes.
     */
    export class Shapes {
        static get Rectangle() {
            var shape = new ShapeTemplateBase();
            shape.Geometry = "Rectangle";
            return shape;
        }

        static get Triangle() {
            var shape = new ShapeTemplateBase();
            shape.Geometry = "m2.5,109.24985l61,-106.74985l61,106.74985l-122,0z";
            return shape;
        }

        static get SequentialData() {
            var shape = new ShapeTemplateBase();
            shape.Geometry = "m50.21875,97.4375l0,0c-26.35457,0 -47.71875,-21.25185 -47.71875,-47.46875l0,0c0,-26.21678 21.36418,-47.46875 47.71875,-47.46875l0,0c12.65584,0 24.79359,5.00155 33.74218,13.90339c8.94862,8.90154 13.97657,20.97617 13.97657,33.56536l0,0c0,12.58895 -5.02795,24.66367 -13.97657,33.56542l13.97657,0l0,13.90333l-47.71875,0z";
            return shape;
        }

        static get Data() {
            var shape = new ShapeTemplateBase();
            shape.Geometry = "m2.5,97.70305l19.07013,-95.20305l76.27361,0l-19.0702,95.20305l-76.27354,0z";
            return shape;
        }

        static get Wave() {
            var shape = new ShapeTemplateBase();
            shape.Geometry = "m2.5,15.5967c31.68356,-45.3672 63.37309,45.3642 95.05661,0l0,81.65914c-31.68353,45.36404 -63.37305,-45.36732 -95.05661,0l0,-81.65914z";
            return shape;
        }

    }

    /**
     * Node types used when parsing XML.
     */
    export enum NodeTypes {
        ElementNode = 1,
        AttributeNode = 2,
        TextNode = 3,
        CDataNode = 4,
        EntityReferenceNode = 5,
        EntityNode = 6,
        ProcessingInstructionNode = 7,
        CommentNode = 8,
        DocumentNode = 9,
        DocumentTypeNode = 10,
        DocumentFragmentNode = 11,
        NotationNode = 12,
    }


    /**
     * RadDiagram XML importer.
     */
    export class RDImporter {
        private diagram: Diagram;
        private canvas: svg.Canvas;
        private ViewMargin = 10;
        private BufferSize = 50;

        /**
         * Keeps together the combination of shape id, shape properties defined in the XML, the resulting SVG (for SVG export) and the diagram element (if loaded into a diagram).
         */
        private shapeCatalog: IRDTriple[] = [];

        /**
         * Keeps together the combination of connection id, shape properties defined in the XML, the resulting SVG (for SVG export) and the diagram element (if loaded into a diagram).
         */
        private connectionCatalog: IRDTriple[] = [];

        /**
         * If set to true, only SVG objects will be created and not TypeScript diagram elements.
         */
        private generateSVGOnly: bool;

        /**
         * The collection of shapes and connection properties which have been discovered from the incoming XML file.
         */
        private discovered: IRDDiscovery;

        /**
         * Instantiates a new RadDiagram XML importer.
         * @param diagram the RadDiagram surface into which the XML should be imported.
         */
        constructor(diagram: Diagram) {
            this.diagram = diagram;
            //TODO: note to Swa; remove this after debugging
            this.canvas = diagram.Canvas;
            this.discovered = null;
        }

        /**
         * Returns the collection of shapes and connection properties which have been discovered from the incoming XML file.
         */
        public get Discovered(): IRDDiscovery {
            return this.discovered;
        }

        private parsePoint(pos) {
            if (pos == null) return { x: 0, y: 0 };
            if (pos.x)
                return pos;
            else {
                var points = pos.split(";");
                return { x: points[0], y: points[1] };
            }
        }

        private getId(doc) {
            return doc.Properties.id;
        }

        private getIsCollapsed(d) {
            var raw = d.Properties.iscollapsed;
            if (raw == null) return false;
            if (raw == "true") return true;
            return false
        }

        private getContainerItems(d):string[] {
            var raw = d.Properties.items;
            if (raw == null) return [];
            return raw.split(';');
        }

        private getWidth(d, allowAuto = false): number {
            var raw = d.Properties.size;
            if (raw) {
                var parts = raw.split(';');
                if (allowAuto || parts[0] != 'Auto') return Math.floor(parseFloat(parts[0]));
                else return 100.0;
            }
            return 100.0;
        }

        private getHeight(d, allowAuto = false): number {
            var raw = d.Properties.size;
            if (raw == null) return 100.0;
            var parts = raw.split(';');
            if (allowAuto || parts[1] != 'Auto') return Math.floor(parseFloat(parts[1]));
            else return 100.0;
        }

        private getBBox(item) {
            if (item == null) return null;
            return item.getBBox();
        }

        private getFontSize(d) {
            var raw = d.Properties.fontsize;
            if (raw != null) return raw;
            return 11;
        }

        private getFontFamily(d) {
            var raw = d.Properties.fontfamily;
            if (raw) return raw;
            return 'Segoe UI';
        }

        private getTitle(d) {
            return d.Properties.content;
            /*var raw = d.Properties.Content;
             return raw ? raw : null;*/
        }

        private getPosition(d) {
            var raw = d.Properties.position;
            if (raw == null) return null;
            return this.parsePoint(raw);
        }

        private getRotation(d): number {
            var raw = d.Properties.rotationangle;
            return raw == null ? 0.0 : parseFloat(raw);
        }

        private getBackground(d) {
            return this.getColor(d, "background", "#CCCCCC");
        }

        private getForeground(d) {
            return this.getColor(d, "foreground", "#525252");
        }

        private getGeometry(d) {
            var raw = d.Properties.geometry;
            //console.log('Found geometry: ' + raw);
            if (raw && raw.indexOf("F1") == 0)
                raw = raw.substring(2);

            return raw ? raw : "";
        }

        private getStroke(d) {
            return this.getColor(d, "stroke", "#888888");
        }

        private getBorderBrush(d) {
            return this.getColor(d, "borderbrush", "#888888");
        }

        private getStrokeWidth(d) {
            var raw = d.Properties.strokethickness;
            return raw ? raw : 1.0;
        }

        private getFillOpacity(d) {
            var alpha = 1.0;
            if (d.Properties.Background) {
                var rx = /^#([0-9a-f]{2})[0-9a-f]{6}$/i;
                var m = d.Properties.Background.match(rx);
                if (m) {
                    alpha = parseInt(m[1], 16) / 255;
                }
            }
            return alpha;
        }

        private getSourceId(d) {
            var raw = d.Properties.source;
            return raw ? raw : null;
        }

        private getTargetId(d) {
            var raw = d.Properties.target;
            return raw ? raw : null;
        }

        private getStartPoint(d) {
            var raw = d.Properties.startpoint;
            return raw ? raw : null;
        }

        private getConnectionPoints(d) :svg.Point[] {
            var raw = d.Properties.connectionpoints;
            if (raw == null || raw.length==0) return null;
            var pts = raw.toString().split(';');
            var list: svg.Point[] = [];
            for (var i = 0; i < pts.length; i += 2) list.push(new svg.Point( pts[i], pts[i + 1]));
            return list;
        }

        private getEndPoint(d) {
            var raw = d.Properties.endpoint;
            return raw ? raw : null;
        }

        private getConnectionType(d) {
            var raw = d.Properties.connectiontype;
            return raw ? raw : null;
        }

        private getDashArray(d) {
            var raw = d.Properties.strokedasharray;
            return raw ? raw : null;
        }

        private getSourceCapSize(d) {
            var raw = d.Properties.sourcecapsize;
            if (raw) {
                var split = raw.split(';');
                return { w: split[0], h: split[1] };
            }
            return { w: 0, h: 0 };
        }

        private getTargetCapSize(d) {
            var raw = d.Properties.targetcapsize;
            if (raw) {
                var split = raw.split(';');
                return { w: split[0], h: split[1] };
            }
            return { w: 0, h: 0 };
        }

        private getSourceCap(d) {
            return this.getCap(d, true);
        }

        private getTargetCap(d) {
            return this.getCap(d, false);
        }

        private getCap(d, isSource) {
            var direction = isSource ? 'Source' : 'Target';
            var directionCapType = isSource ? 'sourcecaptype' : 'targetcaptype';
            var directionCapSize = isSource ? 'sourcecaptype' : 'targetcaptype';
            var sourcecapsize = this.getSourceCapSize(d);
            var targetcapsize = this.getTargetCapSize(d);
            var getName = function (name) {
                return name + '-' + direction + '-' + id;
            };
            var raw = d.Properties[directionCapType];
            if (raw) {
                if (raw == 'None')
                    return null;
                else {
                    var id = d.Properties.id;
                    var w = isSource ? (sourcecapsize == null ? sourcecapsize.w : 0) : (targetcapsize == null ? targetcapsize.w : 0);
                    var h = isSource ? (sourcecapsize == null ? sourcecapsize.h : 0) : (targetcapsize == null ? targetcapsize.h : 0);
                    var orient = 0;
                    if (!isSource)
                        orient = this.calculateMarkerAngle(d.Properties.startpoint, d.Properties.endpoint);
                    else
                        orient = this.calculateMarkerAngle(d.Properties.endpoint, d.Properties.startpoint);
                    var name;
                    switch (raw) {
                        case 'Arrow1':
                            name = getName('Arrow1')
                            var m = isSource ? svg.Markers.OpenArrowStart : svg.Markers.OpenArrowEnd;
                            m.Id = name;
                            return m;
                        case 'Arrow1Filled':
                            name = getName('Arrow1Filled');
                            var m = isSource ? svg.Markers.ArrowStart : svg.Markers.ArrowEnd;
                            m.Id = name;
                            return m;
                        case 'Arrow2':
                            name = getName('Arrow2');
                            var m = isSource ? svg.Markers.OpenArrowStart : svg.Markers.OpenArrowEnd;
                            m.Id = name;
                            return m;
                        case 'Arrow2Filled':
                            name = getName('Arrow2Filled');
                            var m = isSource ? svg.Markers.ArrowStart : svg.Markers.ArrowEnd;
                            m.Id = name;
                            return m;
                        case 'Arrow3':
                            name = getName('Arrow3');
                            var m = isSource ? svg.Markers.WedgeStart : svg.Markers.WedgeEnd;
                            m.Id = name;
                            return m;
                        case 'Arrow4':
                            name = getName('Arrow4');
                            var m = isSource ? svg.Markers.OpenArrowStart : svg.Markers.OpenArrowEnd;
                            m.Id = name;
                            return m;
                        case 'Arrow4Filled':
                            name = getName('Arrow4Filled');
                            var m = isSource ? svg.Markers.ArrowStart : svg.Markers.ArrowEnd;
                            m.Id = name;
                            return m;
                        case 'Arrow5': // open diamond
                            name = getName('Arrow5');
                            var m = svg.Markers.Diamond;
                            m.Id = name;
                            return m;
                        case 'Arrow5Filled': //filled diamond
                            name = getName('Arrow5Filled');
                            var m = svg.Markers.FilledDiamond;
                            m.Id = name;
                            return m;
                        case 'Arrow6': // open circle
                            name = getName('Arrow6');
                            var m = svg.Markers.Circle;
                            m.Id = name;
                            return m;
                        case 'Arrow6Filled': // filled circle
                            name = getName('Arrow6Filled');
                            var m = svg.Markers.FilledCircle;
                            m.Id = name;
                            return m;
                        default:
                        }
                    return raw;
                }
            }
            return null;
        }

        private getColor(d, property, defaultColor) {
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
                                    var startPoint = this.parsePoint(lingrad.Properties.startpoint);
                                    var endPoint = this.parsePoint(lingrad.Properties.endpoint);
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
                                    var graddef = { angle: angle, stops: stops, type: "linear", startPoint: startPoint, endPoint: endPoint };

                                    return graddef;
                                }
                                else if (b.Items[0].Tag == "radialgradientbrush") {
                                    var lingrad = b.Items[0];
                                    var stops = [];
                                    var origin = this.parsePoint(lingrad.Properties.origin);
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
                                    var graddef = null; //TODO: { origin: origin, stops: stops, r: (radiusX + radiusY) * 50, type: "radial" };

                                    return graddef;
                                }

                            }
                            break;
                        }
                    }
                }
            }
            return defaultColor;
        }

        private calculateMarkerAngle(startPoint, endPoint) {
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
        }

        private calculateDistance(startPoint, endPoint) {
            return Math.sqrt((startPoint.x - endPoint.x) * (startPoint.x - endPoint.x) + (startPoint.y - endPoint.y) * (startPoint.y - endPoint.y));
        }

        private findMinRotatedPosition(props) {
            var point1 = this.rotate(0, 0, props.width, props.height, props.rotation);
            var point2 = this.rotate(props.width, 0, props.width, props.height, props.rotation);
            var point3 = this.rotate(0, props.height, props.width, props.height, props.rotation);
            var point4 = this.rotate(props.width, props.height, props.width, props.height, props.rotation);

            return { x: Math.min(point1.newX, point2.newX, point3.newX, point4.newX), y: Math.min(point1.newY, point2.newY, point3.newY, point4.newY) };
        }

        private findMaxRotatedPosition(props) {
            var point1 = this.rotate(0, 0, props.width, props.height, props.rotation);
            var point2 = this.rotate(props.width, 0, props.width, props.height, props.rotation);
            var point3 = this.rotate(0, props.height, props.width, props.height, props.rotation);
            var point4 = this.rotate(props.width, props.height, props.width, props.height, props.rotation);

            return { x: Math.max(point1.newX, point2.newX, point3.newX, point4.newX), y: Math.max(point1.newY, point2.newY, point3.newY, point4.newY) };
        }

        private rotate(pointX, pointY, rectWidth, rectHeight, angle) {
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
        }

        private mapShapeId(id: string): IRDTriple {
            for (var i = 0; i < this.shapeCatalog.length; i++)
                if (this.shapeCatalog[i].id == id) return this.shapeCatalog[i];
            return null;
        }

        private mapConnectionId = function (id) {
            for (var i = 0; i < this.connectionCatalog.length; i++)
                if (this.connectionCatalog[i].id == id) return this.connectionCatalog[i];
            return null;
        };

        private extractShapeProperties(shape): IRDShapeProperties {
            return {
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
                fontfamily: this.getFontFamily(shape),
                isContainer: (shape.Tag == "raddiagramcontainershape"),
                fill: "",
                iscollapsed: this.getIsCollapsed(shape),
                containerItems : this.getContainerItems(shape)
            };
        }

        private extractConnectionProperties(connection): IRDConnectionProperties {
            var sourceId = this.getSourceId(connection);
            var targeteId = this.getSourceId(connection);
            var sourceProps = sourceId == null ? null : this.mapShapeId(this.getSourceId(connection)).props;
            var targetProps = targeteId == null ? null : this.mapShapeId(this.getTargetId(connection)).props;
            return {
                id: this.getId(connection),
                stroke: this.getStroke(connection),
                source: sourceProps,
                target: targetProps,
                strokeWidth: this.getStrokeWidth(connection),
                type: this.getConnectionType(connection),
                startpoint: this.getStartPoint(connection),
                endpoint: this.getEndPoint(connection),
                strokedasharray: this.getDashArray(connection),
                sourcecapsize: this.getSourceCapSize(connection),
                targetcapsize: this.getTargetCapSize(connection),
                sourcecap: this.getSourceCap(connection),
                targetcap: this.getTargetCap(connection),
                connectionpoints: this.getConnectionPoints(connection)
            };
        }

        /**
         * Converts the given diagram model to SVG.
         */
        private createVisuals(model) {
            if (model == null) return null;
            this.discovered = {
                ShapeProperties: [],
                ConnectionProperties: []
            }

            //var mainLayer = new svg.Group();
            //this.canvas.Append(mainLayer);
            //mainLayer.Id = "mainLayer";

            //var shapeLayer = new svg.Group();
            //shapeLayer.Id = "shapeLayer";
            //mainLayer.Append(shapeLayer);

            //var connectionLayer = new svg.Group();
            //connectionLayer.Id = "connectionLayer";
            //mainLayer.Append(connectionLayer);

            var shapes = model.shapes.Items;
            // sort the shapes by ZIndex
            if (shapes != null) {
                shapes.sort(function (a, b) {
                    return a.Properties.zindex - b.Properties.zindex;
                });
            }
            this.createShapes(shapes);

            var connections = model.connections.Items;
            this.createConnections(connections);

            //mainLayer.options.transform = "translate(" + (this.ViewMargin - minX) + "," + (this.ViewMargin - minY) + ")";

            //var width = Math.abs(maxX - minX);
            //this.view.options.width = width + (2 * this.BufferSize);

            //var height = Math.abs(maxY - minY);
            //this.view.options.height = height + (2 * this.BufferSize);

            //this.view.children = [mainLayer];

            //return this.view.render();
        }

        private createShapes(shapes) {
            if (shapes == null) return;

            var minX = Infinity;
            var maxX = -Infinity;

            var minY = Infinity;
            var maxY = -Infinity;
            var collapsedShapes: string[] = [];

            for (var k = 0; k < shapes.length; k++) {
                var shape = shapes[k];

                var shapeProps = this.extractShapeProperties(shape);
                this.discovered.ShapeProperties.push(shapeProps);
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
                if (bg != null) {
                    if (typeof (bg) == 'string') {
                        shapeProps.fill = bg;
                    }
                    else //// a gradient definition object
                    {
                        if (bg.type == "linear") {
                            var gr = new svg.LinearGradient();
                            gr.Id = "gradient-" + shapeProps.id;
                            if (bg.startPoint != null) gr.From = new svg.Point(bg.startPoint.x, bg.startPoint.y);
                            if (bg.endPoint != null) gr.To = new svg.Point(bg.endPoint.x, bg.endPoint.y);
                            var stops = bg.stops;
                            for (var i = 0; i < stops.length; i++) {
                                var gradStop = stops[i];
                                var color = new svg.Color(gradStop.color);
                                var offset = gradStop.offset;
                                var opacity = gradStop.opacity;
                                var s = new svg.GradientStop(color, offset);
                                gr.AddGradientStop(s);
                            }

                            this.diagram.Canvas.AddGradient(gr);
                            shapeProps.fill = gr;
                        }
                        else {
                            //  gr = this.view.createGradient({ id: gradname, cx: bg.origin.x * 100, cy: bg.origin.y * 100, r: bg.r, fx: bg.origin.x * 100, fy: bg.origin.y * 100, stops: bg.stops, type: "radial" });
                            shapeProps.fill = "Gray";
                        }

                        //this.view.definitions[refname] = gr;
                        //throw "Gradients are not supported yet in RadSVG";

                    }
                }
                else {
                    shapeProps.fill = "gray";
                }
                if (this.generateSVGOnly) {
                    var svgShape = null;
                    if (shape.Tag == "raddiagramcontainershape") {
                        if (shapeProps.iscollapsed)
                        {
                            svgShape = new svg.Path();
                            svgShape.Data = "M0,0 0,100 100,100 100,0z";
                            svgShape.Position = new svg.Point(shapeProps.position.x, shapeProps.position.y);
                            svgShape.Background = shapeProps.fill;
                            svgShape.Width = shapeProps.width;
                            svgShape.Height = 0;
                            svgShape.Id = shapeProps.id;
                            svgShape.Opacity=0
                            this.diagram.MainLayer.Append(svgShape);
                            var header = new svg.Rectangle();
                            header.Width = shapeProps.width;
                            header.Height = 25;
                            header.Position = new svg.Point(shapeProps.position.x, shapeProps.position.y);
                            header.Background = "transparent";
                            header.Stroke = "Black";
                            this.diagram.MainLayer.Append(header);
                            if (shapeProps.title != null) {
                                var text = new svg.TextBlock();

                                text.Text = shapeProps.title.trim();
                                text.Native.setAttribute("style", "text-anchor: middle; dominant-baseline: central;");
                                text.dy = 15;
                                text.Position = new svg.Point(header.Position.X + (header.Width / 2), header.Position.Y);
                                text.Background = shapeProps.fontfill;
                                this.diagram.MainLayer.Append(text);
                            }
                            if (shapeProps.containerItems != null && shapeProps.containerItems.length > 0) {

                                for (var i = 0; i < shapeProps.containerItems.length; i++) {
                                    collapsedShapes.push(shapeProps.containerItems[i]);
                                }
                            }
                        }
                        else // non-collapsed container
                        {
                            svgShape = new svg.Path();
                            svgShape.Data = "M0,0 0,100 100,100 100,0z";
                            svgShape.Position = new svg.Point(shapeProps.position.x, shapeProps.position.y);
                            svgShape.Background = shapeProps.fill;
                            svgShape.Width = shapeProps.width;
                            svgShape.Height = shapeProps.height + 30;
                            svgShape.Id = shapeProps.id;
                            this.diagram.MainLayer.Append(svgShape);
                            var header = new svg.Rectangle();
                            header.Width = shapeProps.width;
                            header.Height = 25;
                            header.Position = new svg.Point(shapeProps.position.x, shapeProps.position.y);
                            header.Background = "transparent";
                            header.Stroke = "Black";
                            this.diagram.MainLayer.Append(header);
                            if (shapeProps.title != null) {
                                var text = new svg.TextBlock();

                                text.Text = shapeProps.title.trim();
                                text.Native.setAttribute("style", "text-anchor: middle; dominant-baseline: central;");
                                text.dy = 15;
                                text.Position = new svg.Point(svgShape.Position.X + (shapeProps.width / 2), svgShape.Position.Y);
                                text.Background = shapeProps.fontfill;
                                this.diagram.MainLayer.Append(text);
                            }
                        }
                    }
                    else // not a container
                    {
                        if (collapsedShapes.contains(shapeProps.id)) continue;
                        svgShape = new svg.Path();
                        if (shapeProps.geometry == null || shapeProps.geometry.length == 0) shapeProps.geometry = "M0,0 100,0 100,100 0,100";
                        svgShape.Data = shapeProps.geometry;
                        svgShape.Position = new svg.Point(shapeProps.position.x, shapeProps.position.y);
                        svgShape.Background = shapeProps.fill;
                        svgShape.Width = shapeProps.width;
                        svgShape.Height = shapeProps.height;
                        svgShape.Id = shapeProps.id;
                        this.diagram.MainLayer.Append(svgShape);
                        if (shapeProps.title != null) {
                            var text = new svg.TextBlock();
                            if (shapeProps.title.indexOf("\n") > -1) {
                                var parts = shapeProps.title.trim().split("\n");
                                var y = 0;
                                for (var i = 0; i < parts.length; i++) {
                                    if (parts[i].trim().length == 0) continue;
                                    var span = <SVGTSpanElement> document.createElementNS(NS, "tspan");
                                    span.textContent = parts[i];
                                    y += 15;
                                    span.setAttribute("x", (shapeProps.position.x + 5).toString());
                                    span.setAttribute("y", (shapeProps.position.y + y).toString());
                                    text.Native.appendChild(span);
                                }
                            }
                            else {
                                text.Text = shapeProps.title.trim();
                                text.dx = 5;
                                if (shapeProps.isContainer)
                                    text.Position = new svg.Point(svgShape.Position.X, svgShape.Position.Y);
                                else
                                    text.Position = new svg.Point(svgShape.Position.X, svgShape.Position.Y + (shapeProps.height / 2));
                            }

                            text.Background = shapeProps.fontfill;
                            this.diagram.MainLayer.Append(text);

                        }
                    }
                     
                        this.shapeCatalog.push(
                            {
                                id: shapeProps.id,
                                original: shape,
                                props: shapeProps,
                                visual: svgShape
                            });
                    
                }
                else {
                    var template = new ShapeTemplateBase();
                    template.Geometry = shapeProps.geometry;
                    template.Position = new svg.Point(Math.floor(shapeProps.position.x), Math.floor(shapeProps.position.y));
                    template.Background = shapeProps.fill;
                    template.Width = Math.floor(shapeProps.width);
                    template.Height = Math.floor(shapeProps.height);
                    template.Stroke = shapeProps.stroke;
                    template.StrokeThickness = shapeProps.strokeWidth;
                    template.Id = shapeProps.id;
                    template.Rotation = shapeProps.rotation;
                    var newShape = this.diagram.AddShape(template);

                    this.shapeCatalog.push(
                        {
                            id: shapeProps.id,
                            original: shape,
                            props: shapeProps,
                            visual: newShape
                        });
                }
            }

        }

        private createConnections(connections) {
            if (connections == null) return;
            var minX = Infinity;
            var maxX = -Infinity;

            var minY = Infinity;
            var maxY = -Infinity;

            for (var i = 0; i < connections.length; i++) {
                var connection = connections[i];
                var connectionProps = this.extractConnectionProperties(connection);
                this.discovered.ConnectionProperties.push(connectionProps);

                var startP = this.parsePoint(connectionProps.startpoint);
                var endP = this.parsePoint(connectionProps.endpoint);

                minX = Math.min(minX, Math.min(startP.x, endP.x));
                maxX = Math.max(maxX, Math.max(startP.x, endP.x));

                minY = Math.min(minY, Math.min(startP.y, endP.y));
                maxY = Math.max(maxY, Math.max(startP.y, endP.y));
                if (this.generateSVGOnly) {

                    var svgConnection = new svg.Polyline();
                    var points = [];
                    points.push( new svg.Point(connectionProps.startpoint.x, connectionProps.startpoint.y));
                    if (connectionProps.connectionpoints != null) {
                        for (var i = 0; i < connectionProps.connectionpoints.length; i++) {
                            var p = connectionProps.connectionpoints[i];
                            points.push(p);
                        }                        
                    }
                    points.push(new svg.Point(connectionProps.endpoint.x, connectionProps.endpoint.y));
                    svgConnection.Points = points;
                    svgConnection.Stroke = connectionProps.stroke;
                    svgConnection.StrokeThickness = connectionProps.strokeWidth;
                    if (connectionProps.targetcap != null) {
                        this.diagram.AddMarker(connectionProps.targetcap)
                        svgConnection.MarkerEnd = connectionProps.targetcap;
                    }
                    if (connectionProps.sourcecap != null) {
                        this.diagram.AddMarker(connectionProps.sourcecap)
                        svgConnection.MarkerStart = connectionProps.sourcecap;
                    }
                    this.diagram.MainLayer.Append(svgConnection);
                }
                else {
                    var from = <Shape>this.mapShapeId(connectionProps.source.id).visual;
                    var to = <Shape>this.mapShapeId(connectionProps.target.id).visual;
                    var fromc = from.Connectors[2];
                    var toc = to.Connectors[2];
                    this.diagram.AddConnection(fromc, toc);
                }

                //connectionProps.startmarker = this.getSourceCapReference(connection, connectionProps);
                //connectionProps.endmarker = this.getTargetCapReference(connection, connectionProps);

                //var con = new Connection(connectionProps);
                //connectionLayer.Append(con);
            }

        }

        /**
         * Loads the RadDiagram model into the TS diagram (and hence SVG).
         */
        private loadModel(model: any) {
            if (model == null) throw "Given model is null";
            this.createVisuals(model);
            this.fixSizes();
        }

        private fixSizes() {
            // postprocessing of size because the initial size is only known after it's drawn/added to SVG
            for (var i = 0; i < this.shapeCatalog.length; i++) {
                var shapeProps = <IRDShapeProperties>this.shapeCatalog[i].props;
                if (shapeProps.iscollapsed) continue;
                var w = shapeProps.width;
                var h = shapeProps.height;
                var p = shapeProps.position;
                var r = shapeProps.rotation; // in degrees!;
                var item = this.shapeCatalog[i].visual; // if generateSVGOnly this is SVG otherwise it's a Shape

                //var textContent = document.getElementById('content-' + shapeProps.Properties.id); //gets the text content.
                //var parentLayer = document.getElementById('g-' + shapeProps.Properties.id);
                //if (textContent)
                //{
                //    if (w == 'Auto')
                //        textContent.setAttribute("x", (bb.width / 2).toString());
                //    if (h == 'Auto')
                //        textContent.setAttribute("y", (bb.height / 2).toString());
                //}
                //parentLayer.setAttribute("transform", layerMatrix);
                if (this.generateSVGOnly) {
                    var bb = this.getBBox(item.Native); //bounding box
                    var matrix = "translate(" + p.x + "," + p.y + ")" + "rotate(" + r + "," + ((w == 'Auto' ? 100 : w) / 2) + "," + ((h == 'Auto' ? 100 : h) / 2) + ")";
                    matrix += "scale(" + (w != 'Auto' ? w : bb.width) / bb.width + "," + (h != 'Auto' ? h : bb.height) / bb.height + ")";
                    item.Native.setAttribute("transform", matrix);
                }
                else {
                    //                    var shape = <Shape>item;
                    //                    shape.Height = h;
                    //                    shape.Width = w;
                    //                    if (r != 0)
                    //                    {
                    //                        if(r == 90 || r == 270 || r == 83){
                    //                            shape.Height = w;
                    //                            shape.Width = h;
                    //                            console.log(shape.Id);
                    //                        }
                    //                    }
                }


            }
            //var rb = this.diagram.MainLayer.Native.getBoundingClientRect();
            //this.diagram.Pan = new svg.Point(-rb.left, -rb.top);
        }

        /**
         * Loads the given url which supposedly is the address to a RadDiagram XML file.
         * @param url The URL to the serialized RadDiagram diagram.
         * @param mime The MIME type; this can only be 'text/xml' currently.
         * @param callback An action on the parsed JS object.
         */
        private loadURL(url: string, mime: string, callback: (json: any) => void , discovery: (obj: IRDDiscovery) => void ) {
            if (mime == null || mime.toLowerCase() != "text/xml") throw "Only 'text/xml' is supported for now.";
            var req = new XMLHttpRequest();
            req.open("GET", url, true);
            req.setRequestHeader("Accept", "text/xml");
            var r = this;
            req.onreadystatechange = function () {
                if (req.readyState === 4) {
                    if ((req.status >= 200 && req.status < 300 || req.status === 304) && req.responseXML) {
                        // converting to JS object model cause easier to manip than XML
                        var json = r.xmlToJson(req.responseXML);
                        if (callback != null) callback(json);
                        if (json != null) {
                            r.loadModel(json);

                            //mostly in function of unit test
                            if (discovery != null) discovery(r.discovered);
                        }
                        else console.log("Returned content model at '" + url + "' is null");
                    }
                }
            };
            req.send(null);
        }

        /**
         * Loads the given url which supposedly is the address to a RadDiagram XML file.
         * @param url The URL to the serialized RadDiagram diagram.
         * @param generateSVGOnly If set to true, only SVG objects will be created instead of interactive diagram elements.
         * @param callback An action on the parsed JS object.
         */
        public LoadURL(url: string, generateSVGOnly: bool = true, callback: (json: any) => void = null, discovery: (obj: IRDDiscovery) => void = null) {
            this.clearRuntimeObjects();
            this.generateSVGOnly = generateSVGOnly;
            var setDiscovered = (p: IRDDiscovery) => {
                if (discovery != null) discovery(p);
            };
            this.loadURL(url, "text/xml", callback, setDiscovered);
        }

        /**
         * Loads the given xml which supposedly a serialized RadDiagram diagram.
         * @param xml A serialized RadDiagram diagram.
         */
        public LoadXML(xml: string, generateSVGOnly: bool = true) {
            this.clearRuntimeObjects();
            this.generateSVGOnly = generateSVGOnly;
            var xmlDoc;
            var parser;
            var imp = <DOMParser><Object>window;
            if (imp != null) {
                parser = new DOMParser();
                xmlDoc = parser.parseFromString(xml, "text/xml");
            }
            else // Internet Explorer
            {
                xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
                xmlDoc.async = false;
                xmlDoc.loadXML(xml);
            }
            // converting to JS object model cause easier to manip than XML
            var json = this.xmlToJson(xmlDoc);
            if (json != null) {
                this.loadModel(json);
            }
            else console.log("Returned content model is null");
        }

        private clearRuntimeObjects() {
            this.discovered = null;
            this.shapeCatalog = [];
            this.connectionCatalog = [];
        }

        /**
         * Converts the given XML to a JavaScript literal object.
         * @param xml An XML node.
         */
        private xmlToJson(xml: Node) {
            var obj = {};
            var pointLikeProps = ["Position", "StartPoint", "EndPoint"];
            if (xml.nodeType == NodeTypes.ElementNode) {
                obj["Tag"] = xml.nodeName.toLowerCase();
                // do attributes
                if (xml.attributes.length > 0) {
                    obj["Properties"] = {};
                    for (var j = 0; j < xml.attributes.length; j++) {
                        var attribute = xml.attributes[j];
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
                        if (item.nodeType != NodeTypes.ElementNode) continue;
                        obj["Items"].push(this.xmlToJson(item));
                    }
                }
            }
            else if (xml.nodeType == NodeTypes.DocumentNode) {
                var children = (<Document>xml).documentElement.childNodes;
                for (var i = 0; i < children.length; i++) {
                    var child = children[i];
                    if (child.nodeType != NodeTypes.TextNode) {
                        var name = child.nodeName.toLowerCase();
                        obj[name] = this.xmlToJson(child);
                        //console.log(name);
                    }
                }
            }

            return obj;
        }


    }
    /**
     * Holds the diagram element properties when the RD importer is discovering the elements.
     */
    export interface IRDDiscovery {
        ShapeProperties: IRDShapeProperties[];
        ConnectionProperties: IRDConnectionProperties[];
    }

    /**
     * Holds the found connection properties when the RD importer is discovering the elements.
     */
    export interface IRDConnectionProperties {
        id;
        stroke;
        source;
        target;
        strokeWidth;
        type;
        startpoint;
        endpoint;
        strokedasharray;
        sourcecapsize;
        targetcapsize;
        sourcecap;
        targetcap;
        connectionpoints;
    }
    /**
     * Holds the found shape properties when the RD importer is discovering the elements.
     */
    export interface IRDShapeProperties {
        position;
        geometry;
        fillOpacity;
        id;
        stroke;
        rotation: number;
        strokeWidth;
        title: string;
        width;
        height;
        fontsize;
        fontfill;
        fontfamily;
        fill;
        isContainer: bool;
        iscollapsed: bool;
        containerItems: string[];
    }

    export interface IRDTriple {
        id;
        original;
        props;
        visual;
    }

}