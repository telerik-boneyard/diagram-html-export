/**
 * Copyright Telerik.
 *
 * Disclaimer:
 * The TypeScript and SVG libraries allow a fully interactive diagramming
 * experience, but are not released or supported as such yet.
 * The only part supported for now is the export/import to/from XAML/XML.
 *
 */

module RadSVG {
    /**
     * Base class for all visuals participating in an SVG drawing.
     */
    export class Visual implements IVisual {
        private title: SVGTitleElement;
        private native: SVGElement;

        /**
         * Occurs when the mouse is pressed on this visual.
         */
        public MouseDown: (ev: MouseEvent) => any;

        /**
         * Occurs when the mouse is moved over this visual.
         */
        public MouseMove: (ev: MouseEvent) => any;

        /**
         * Occurs when the mouse is released after a MouseDown press.
         */
        public MouseUp: (ev: MouseEvent) => any;

        /**
         * Gets the native SVG element which this visual wraps.
         */
        public get Native(): SVGElement {
            return this.native;
        }

        /**
         * Gets the Canvas to which this visual belongs.
         */
        public Canvas: Canvas;

        /**
         * Gets the data context of this visual.
         */
        public DataContext: any;

        /**
         * Gets or sets the position of this visual.
         */
        public Width: number;
        public Height: number;
        public StrokeThickness: number;
        public Position: Point;
        public Stroke: string;
        public Background: string;

        /**
         * Returns the identifier.
         */
        public get Id(): string {
            return this.Native == null ? null : this.Native.id;
        }

        /**
         * Sets the identifier.
         */
        public set Id(value: string) {
            this.Native.id = value;
        }

        /**
         * Gets the CSS class of this visual.
         */
        public set Class(v: string) {
            if (v == null) this.Native.removeAttribute("class");
            else this.Native.setAttribute("class", v);
        }

        /**
         * Sets the title of this visual.
         */
        public get Title(): string {
            return this.title.textContent;
        }

        /**
         * Gets the title of this visual.
         */
        public set Title(v: string) {
            if (this.title == null) {
                this.title = <SVGTitleElement>document.createElementNS(NS, "title");
                this.native.appendChild(this.title);
            }

            this.title.textContent = v;
        }

        /**
         * Sets the CSS class of this visual.
         */
        public get Class(): string {
            if (this.Native.attributes["class"] == null) return null;
            return this.Native.attributes["class"].value;
        }

        /**
         * Instanstiates a new visual.
         */
        constructor() {
        }

        /**
         * Part of the inheritance chain, this assigns the SVG element defined by the inheriting class and the canvas to which this element belongs.
         * The 'super' has to be parameterless, hence the necessity of this Initializer.
         */
        Initialize(native: SVGElement) {
            if (native == null) throw "The native SVG element cannot be null.";
            this.native = native;
            this.ListenToEvents();
        }

        /**
         * Rewires the native events to API events.
         */
        private ListenToEvents() {
            this.Native.onmousedown = e => this.onMouseDown(e);
            this.Native.onmousemove = e => this.onMouseMove(e);
            this.Native.onmouseup = e => this.onMouseUp(e);
        }

        /**
         * Detaches the event listeners from the native SVG element.
         */
        public StopListeningToEvents() {
            this.Native.onmousedown = null;
            this.Native.onmousemove = null;
            this.Native.onmouseup = null;
        }

        public get IsVisible(): bool {
            if (this.Native.attributes["visibility"] == null) return true;
            return this.Native.attributes["visibility"].value == "visible"
        }

        public set IsVisible(value: bool) {
            this.Native.setAttribute("visibility", (value ? "visible" : "hidden"));
        }


        private onMouseDown(e: MouseEvent) {
            if (this.MouseDown) this.MouseDown(e);
        }

        private onMouseMove(e: MouseEvent) {
            if (this.MouseMove) this.MouseMove(e);
        }

        private onMouseUp(e: MouseEvent) {
            if (this.MouseUp) this.MouseUp(e);
        }

        //private onKeyDown(e: KeyboardEvent) { if (this.KeyDown) this.KeyDown(e); }
        //private onKeyPress(e: KeyboardEvent) { if (this.KeyPress) this.KeyPress(e); }
        public PrePendTransform(transform: Transformation) {
            var current = this.Native.attributes["transform"] == null ? "" : <string>this.Native.attributes["transform"].value;
            this.Native.setAttribute("transform", transform.toString() + current);
        }

        public Transform(...transforms: Transformation[]) {
            var current = this.Native.attributes["transform"] == null ? "" : <string>this.Native.attributes["transform"].value;
            var s = current;
            for (var i = 0; i < transforms.length; i++) s += transforms[i].toString();
            this.Native.setAttribute("transform", s.toString());
            return;
            if (current != null) {
                //                var loc = <SVGLocatable><Object>this.Native.parentNode;
                //                //var m = svg.Matrix.Parse(current);
                //                if (loc != null)
                //                {
                //                    var mm= loc.getTransformToElement(this.Native).inverse();
                //                    var m = Matrix.FromSVGMatrix(mm);
                //                    for (var i = 0; i < transforms.length; i++) m = m.Times(transforms[i].ToMatrix());
                //                    this.Native.setAttribute("transform", m.toString());
                //                }
                //                else
                //                {
                //                    throw "The current transform could not be fetched. The Native element is not SVGLocatable.";
                //                }
                var s = current;
                for (var i = 0; i < transforms.length; i++) s += transforms[i].toString();
                this.Native.setAttribute("transform", s.toString());
            }
            else {
                var m = Matrix.Unit;
                for (var i = 0; i < transforms.length; i++) m = m.Times(transforms[i].ToMatrix());
                this.Native.setAttribute("transform", m.toString());
            }

        }
    }

    /**
     * Defines an SVG transformation.
     */
    export interface Transformation {
        /**
         *
         * Returns the Matrix of this transformation.
         */
        ToMatrix(): Matrix;
    }
    /**
     * A scaling transformation.
     */
    export class Scale implements Transformation {
        public ScaleX: number;
        public ScaleY: number;

        /**
         * Instantiates a new scaling transformation.
         * @param x The horizontal scaling.
         * @param y The vertical scaling.
         */
        constructor(x: number = null, y: number = null) {
            if (x != null) this.ScaleX = x;
            if (y != null) this.ScaleY = y;
        }

        public ToMatrix() {
            return Matrix.Scaling(this.ScaleX, this.ScaleY);
        }

        public toString() {
            return "scale(" + this.ScaleX + "," + this.ScaleY + ")";
        }
    }
    /**
     * Represent an SVG translation.
     */
    export class Translation implements Transformation {
        private x: number;
        private y: number;

        public get X(): number {
            return this.x;
        }

        public set X(v: number) {
            this.x = v;
        }

        public get Y(): number {
            return this.y;
        }

        public set Y(v: number) {
            this.y = v;
        }

        constructor(x: number = null, y: number = null) {
            if (x != null) this.X = x;
            if (y != null) this.Y = y;
        }

        public ToMatrixVector(): MatrixVector {
            return new MatrixVector(0, 0, 0, 0, this.X, this.Y);
        }

        public ToMatrix() {
            return Matrix.Translation(this.X, this.Y);
        }

        public toString() {
            return "translate(" + this.X + "," + this.Y + ")";
        }

        public Plus(delta: Translation) {
            this.X += delta.X;
            this.Y += delta.Y;
        }

        public Times(factor: number) {
            this.X *= factor;
            this.Y *= factor;
        }

        /**
         * Returns the size of this translation considered as a 2D vector.
         */
        public get Length(): number {
            return Math.sqrt(this.X * this.X + this.Y * this.Y);
        }

        /**
         * Normalizes the length of this translation to one.
         */
        public Normalize() {
            if (this.Length == 0) return;
            this.Times(1 / this.Length);
        }
    }
    /**
     * Represent an SVG rotation.
     */
    export class Rotation implements Transformation {
        public X: number;
        public Y: number;
        public Angle: number;

        /**
         * Instantiates a new rotation.
         * @param angle The rotation angle in degrees.
         * @param x The rotation center's X coordinate.
         * @param y The rotation center's Y coordinate.
         */
        constructor(angle: number = null, x: number = null, y: number = null) {
            if (x != null) this.X = x;
            if (y != null) this.Y = y;
            if (angle != null) this.Angle = angle;
        }

        public toString() {
            if (this.X != null || this.Y != null)
                return "rotate(" + this.Angle + "," + this.X + "," + this.Y + ")";
            else
                return "rotate(" + this.Angle + ")";
        }


        public ToMatrix() {
            if (this.X == 0 && this.Y == 0) return Matrix.Rotation(this.Angle);
            else {
                // T*R*T^-1
                return Matrix.Rotation(this.Angle, this.X, this.Y);
            }
        }
    }

    /**
     * A text block visual.
     */
    export class TextBlock extends Visual {
        private native = <SVGTextElement>document.createElementNS(NS, "text");

        constructor(canvas: Canvas = null) {
            super();
            this.Initialize(this.native);
            this.dx = 0;
            this.dy = 3;
            this.FontFamily = "Verdana";
            this.FontVariant = FontVariants.Normal;
            this.Stroke = "steelblue";
            this.FontWeight = FontWeights.Normal;
            this.StrokeThickness = 0;
            this.FontSize = 10;

        }

        public set Background(v: string) {
            this.Native.setAttribute("fill", v);
        }

        public set StrokeThickness(value: number) {
            this.Native.setAttribute("stroke-width", value.toString());
        }

        public get StrokeThickness(): number {
            if (this.Native.attributes["stroke-width"] == null) return 0.0;
            return parseFloat(this.Native.attributes["stroke-width"].value);
        }

        /**
         * Gets the position of this text block.
         */
        get Position(): Point {
            return new Point(this.native.x.baseVal.getItem(0).value, this.native.y.baseVal.getItem(0).value);
        }

        /**
         * Sets the position of this text block.
         */
        set Position(p: Point) {
            this.native.setAttribute("x", p.X.toString());
            this.native.setAttribute("y", p.Y.toString());
        }

        public set Stroke(value: string) {
            this.Native.setAttribute("stroke", value);
        }

        public get Stroke(): string {
            if (this.Native.attributes["stroke"] == null) return null;
            return this.Native.attributes["stroke"].value;
        }

        /**
         * Gets the text of this text block.
         */
        get Text(): string {
            return this.native.textContent;
        }

        /**
         * Sets the text of this text block.
         */
        set Text(v: string) {
            this.native.textContent = v;
        }

        /**
         * Gets the font-family of this text block.
         */
        get FontFamily(): string {
            if (this.native.attributes["font-family"] == null) return null;
            return this.native.attributes["font-family"].value;
        }

        /**
         * Sets the font-family of this text block.
         */
        set FontFamily(v: string) {
            this.native.setAttribute("font-family", v);
        }

        /**
         * Gets the font-family of this text block.
         */
        get FontVariant(): FontVariants {
            if (this.native.attributes["font-variant"] == null) return null;
            return TextBlock.ParseFontVariant(this.native.attributes["font-variant"].value);
        }

        /**
         * Sets the font-family of this text block.
         */
        set FontVariant(v: FontVariants) {
            var s = TextBlock.FontVariantString(v);
            if (s != null) this.native.setAttribute("font-variant", s);
        }

        /**
         * Gets the font-size of this text block.
         */
        get FontSize(): number {
            if (this.native.attributes["font-size"] == null) return null;
            return parseFloat(this.native.attributes["font-size"].value);
        }

        /**
         * Sets the font-size of this text block.
         */
        set FontSize(v: number) {
            this.native.setAttribute("font-size", v.toString());
        }

        /**
         * Gets the font-size of this text block.
         */
        get FontWeight(): FontWeights {
            if (this.native.attributes["font-weight"] == null) return FontWeights.NotSet;
            return TextBlock.ParseFontWeight(this.native.attributes["font-weight"].value);
        }

        /**
         * Sets the font-size of this text block.
         */
        set FontWeight(v: FontWeights) {
            var s = TextBlock.FontWeightString(v);
            if (s != null) this.native.setAttribute("font-weight", s);
        }

        /**
         * Gets the anchor of this text block.
         */
        get Anchor(): number {
            if (this.native.attributes["text-anchor"] == null) return null;
            return parseFloat(this.native.attributes["text-anchor"].value);
        }

        /**
         * Sets the anchor of this text block.
         */
        set Anchor(v: number) {
            this.native.setAttribute("text-anchor", v.toString());
        }

        /**
         * Gets the dx offset of this text block.
         */
        get dx(): number {
            if (this.native.attributes["dx"] == null) return null;
            return parseFloat(this.native.attributes["dx"].value);
        }

        /**
         * Sets the dx offset of this text block.
         */
        set dx(v: number) {
            this.native.setAttribute("dx", v.toString());
        }

        /**
         * Gets the dy offset of this text block.
         */
        get dy(): number {
            if (this.native.attributes["dy"] == null) return null;
            return parseFloat(this.native.attributes["dy"].value);
        }

        /**
         * Sets the dy offset of this text block.
         */
        set dy(v: number) {
            this.native.setAttribute("dy", v.toString());
        }

        /**
         * Parses the given string and attempts to convert it to a FontWeights member.
         * @param v A string representing a FontWeights.
         */
        static ParseFontWeight(v: string): FontWeights {
            if (v == null) return FontWeights.NotSet;
            switch (v.toLowerCase()) {
                case "normal":
                    return FontWeights.Normal;
                case "bold":
                    return FontWeights.Bold;
                case "bolder":
                    return FontWeights.Bolder;
                case "lighter":
                    return FontWeights.Lighter;
                case "100":
                    return FontWeights.W100;
                case "200":
                    return FontWeights.W200;
                case "300":
                    return FontWeights.W300;
                case "400":
                    return FontWeights.W400;
                case "500":
                    return FontWeights.W500;
                case "600":
                    return FontWeights.W600;
                case "700":
                    return FontWeights.W700;
                case "800":
                    return FontWeights.W800;
                case "900":
                    return FontWeights.W900;
                case "inherit":
                    return FontWeights.Inherit;
            }
            throw "String '" + v + "' could not be parsed to a FontWeights member.";
        }

        /**
         * Returns a string representation of the given FontWeights value.
         * @param value A FontWeights member.
         */
        static FontWeightString(value: FontWeights): string {
            switch (value) {
                case 0:
                    return "normal";
                case 1:
                    return "bold";
                case 2:
                    return "bolder";
                case 3:
                    return "lighter";
                case 4:
                    return "100";
                case 5:
                    return "200";
                case 6:
                    return "300";
                case 7:
                    return "400";
                case 8:
                    return "500";
                case 9:
                    return "600";
                case 10:
                    return "700";
                case 11:
                    return "800";
                case 12:
                    return "900";
                case 13:
                    return "inherit";
                case 14:
                    return null;
            }
            throw "Unexpected FontWeight";
        }

        static ParseFontVariant(v: string) {
            if (v == null) return FontVariants.NotSet;
            switch (v.toLowerCase()) {
                case "normal":
                    return FontVariants.Normal;
                case "small-caps":
                    return FontVariants.SmallCaps;
            }

        }

        static FontVariantString(value: FontVariants) {
            switch (value) {
                case 0:
                    return "normal";
                case 1:
                    return "small-caps";
                case 2:
                    return null;
            }
        }
    }

    /**
     * The values the FontWeight accepts.
     */
    export enum FontWeights {
        Normal = 0,
        Bold = 1,
        Bolder = 2,
        Lighter = 3,
        W100 = 4,
        W200 = 5,
        W300 = 6,
        W400 = 7,
        W500 = 8,
        W600 = 9,
        W700 = 10,
        W800 = 11,
        W900 = 12,
        Inherit = 13,
        NotSet = 14
    }

    /**
     * The FontVariant values.
     */
    export enum FontVariants {
        Normal = 0,
        SmallCaps = 1,
        Inherit = 2,
        NotSet = 3
    }

    /**
     * A rectangle visual.
     */
    export class Rectangle extends Visual {

        private native = <SVGRectElement>document.createElementNS(NS, "rect");

        /**
         * Instantiates a new rectangle.
         */
        constructor(canvas: Canvas = null) {
            super();
            this.Initialize(this.native);
        }

        /**
         * Gets the width of this rectangle.
         */
        get Width(): number {
            return this.native.width.baseVal.value;
        }

        /**
         * Sets the width of this rectangle.
         */
        set Width(value: number) {
            this.native.width.baseVal.value = value;
        }

        /**
         * Gets the height of this rectangle.
         */
        get Height(): number {
            return this.native.height.baseVal.value;
        }

        /**
         * Sets the height of this rectangle.
         */
        set Height(value: number) {
            this.native.height.baseVal.value = value;
        }


        /**
         * Gets the fill of this rectangle.
         */
        public get Background() {
            return this.native.style.fill;
        }

        /**
         * Sets the fill of this rectangle.
         */
        public set Background(v: any) {
            if (typeof (v) == "string") this.native.style.fill = v;
            if (typeof (v) == "object") {
                var gr = <LinearGradient>v;
                if (gr != null) {
                    if (gr.Id == null) throw "The gradient needs an Id.";
                    this.native.style.fill = "url(#" + gr.Id + ")";
                }
            }
        }

        /**
         * Gets the corner radius of this rectangle.
         */
        get CornerRadius(): number {
            return this.native.rx.baseVal.value;
        }

        /**
         * Sets the corner radius of this rectangle.
         */
        set CornerRadius(v: number) {
            this.native.rx.baseVal.value = v;
            this.native.ry.baseVal.value = v;
        }

        public set Opacity(value: number) {
            if (value > 1) value = 1.0;
            if (value < 0) value = 0.0;
            this.Native.setAttribute("fill-opacity", value.toString());
        }

        /**
         * Gets the opacity.
         */
        public get Opacity(): number {
            if (this.Native.attributes["fill-opacity"] == null) return 1.0;
            return parseFloat(this.Native.attributes["fill-opacity"].value);
        }

        /**
         * Gets the position of this rectangle.
         */
        get Position(): Point {
            return new Point(this.native.x.baseVal.value, this.native.y.baseVal.value);
        }

        /**
         * Sets the position of this rectangle.
         */
        set Position(p: Point) {
            this.native.x.baseVal.value = p.X;
            this.native.y.baseVal.value = p.Y;
        }

        public set StrokeThickness(value: number) {
            this.Native.setAttribute("stroke-width", value.toString());
        }

        public get StrokeThickness(): number {
            if (this.Native.attributes["stroke-width"] == null) return 0.0;
            return parseFloat(this.Native.attributes["stroke-width"].value);
        }

        public set Stroke(value: string) {
            this.Native.setAttribute("stroke", value);
        }

        public get Stroke(): string {
            if (this.Native.attributes["stroke"] == null) return null;
            return this.Native.attributes["stroke"].value;
        }

        public set StrokeDash(value: string) {
            this.Native.setAttribute("stroke-dasharray", value);
        }

        public get StrokeDash(): string {
            if (this.Native.attributes["stroke-dasharray"] == null) return null;
            return this.Native.attributes["stroke-dasharray"].value;
        }


    }

    /**
     * A path.
     */
    export class Path extends Visual {
        private native = <SVGPathElement>document.createElementNS(NS, "path");
        private xf = 1;
        private yf = 1;
        private position: Point;

        /**
         * Instantiates a new path.
         */
        constructor() {
            super();
            this.Initialize(this.native);
            this.Background = "Black";
            this.Stroke = "Black";
        }

        public set StrokeThickness(value: number) {
            this.Native.setAttribute("stroke-width", value.toString());
        }

        public get StrokeThickness(): number {
            if (this.Native.attributes["stroke-width"] == null) return 0.0;
            return parseFloat(this.Native.attributes["stroke-width"].value);
        }

        public set Stroke(value: string) {
            this.Native.setAttribute("stroke", value);
        }

        public get Stroke(): string {
            if (this.Native.attributes["stroke"] == null) return null;
            return this.Native.attributes["stroke"].value;
        }

        public set StrokeDash(value: string) {
            this.Native.setAttribute("stroke-dasharray", value);
        }

        public get StrokeDash(): string {
            if (this.Native.attributes["stroke-dasharray"] == null) return null;
            return this.Native.attributes["stroke-dasharray"].value;
        }

        public set Data(value: string) {
            this.native.setAttribute("d", value);
        }

        /**
         * Gets the position of this group.
         */
        get Position(): Point {
            return this.position;
        }

        /**
         * Sets the position of this group.
         */
        set Position(p: Point) {
            this.position = p;
            try {
                if (this.native.ownerSVGElement == null) return;
            } catch (err) { return; }

            var tr = this.native.ownerSVGElement.createSVGTransform();
            tr.setTranslate(p.X, p.Y);
            if (this.native.transform.baseVal.numberOfItems == 0)
                this.native.transform.baseVal.appendItem(tr);
            else
                this.native.transform.baseVal.replaceItem(tr, 0);
        }

        public get Data(): string {
            if (this.Native.attributes["d"] == null) return null;
            return this.Native.attributes["d"].value;
        }

        /**
         * Gets the fill of this rectangle.
         */
        get Background(): string {
            return this.native.style.fill;
        }

        /**
         * Sets the fill of this rectangle.
         */
        set Background(v: any) {
            if (typeof (v) == "string") this.native.style.fill = v;
            if (typeof (v) == "object") {
                var gr = <LinearGradient>v;
                if (gr != null) {
                    if (gr.Id == null) throw "The gradient needs an Id.";
                    this.native.style.fill = "url(#" + gr.Id + ")";
                }
            }
        }

        /**
         * Gets the width of this rectangle.
         */
        get Width(): number {
            try {
                return this.native.getBBox().width;
            } catch (err) { return 0; }
        }

        /**
         * Sets the width of this rectangle.
         */
        set Width(value: number) {
            if (this.Width == 0) {
                //means most probably that the path is not yet added to the canvas.
                //console.log("Warning: current path bounding box is nil, assuming that the path's geometry is scaled at 100x100.");
                this.xf = value / 100;
            }
            else
                this.xf = value / this.Width;
            this.native.setAttribute("transform", "scale(" + this.xf + "," + this.yf + ")");
        }

        /**
         * Gets the height of this rectangle.
         */
        get Height(): number {
            try {
                return this.native.getBBox().height;
            } catch (err) { return 0; }
        }

        /**
         * Sets the height of this rectangle.
         */
        set Height(value: number) {
            if (this.Height == 0) {
                //means most probably that the path is not yet added to the canvas.
                console.log("Warning: current path bounding box is nil, assuming that the path's geometry is scaled at 100x100.");
                this.yf = value / 100;
            }
            else
                this.yf = value / this.Height;
            this.native.setAttribute("transform", "scale(" + this.xf + "," + this.yf + ")");
        }

        /**
         * Attempts to convert the given Node to a Path.
         * @param A Node.
         */
        static ParseNode(node: Node): Path {
            if (node == null) return null;
            if (node.localName != "path") return null;
            var path = new Path();
            path.Data = node.attributes["d"] == null ? null : node.attributes["d"].value;
            path.StrokeThickness = node.attributes["stroke-width"] == null ? 0 : parseFloat(node.attributes["stroke-width"].value);
            path.Stroke = node.attributes["stroke"] == null ? null : node.attributes["stroke"].value;
            path.Background = node.attributes["fill"] == null ? null : node.attributes["fill"].value;
            return path;
        }


    }


    /**
     * A marker
     */
    export class Marker extends Visual {
        private native = <SVGMarkerElement>document.createElementNS(NS, "marker");
        private path: Visual;

        /**
         * Instantiates a new marker.
         */
        constructor() {
            super();
            this.Initialize(this.native);
        }

        /**
         * Gets the refX of this marker.
         */
        get RefX(): number {
            if (this.native.attributes["refX"] == null) return 0;
            return parseFloat(this.native.attributes["refX"].value);
        }

        /**
         * Sets the refX of this marker.
         */
        set RefX(value: number) {
            this.native.refX.baseVal.value = value;
        }

        /**
         * Gets the refY of this marker.
         */
        get RefY(): number {
            if (this.native.attributes["refY"] == null) return 0;
            return parseFloat(this.native.attributes["refY"].value);
        }

        /**
         * Sets the refX of this marker.
         */
        set RefY(value: number) {
            this.native.refY.baseVal.value = value;
        }


        /**
         * Gets the refX and refY of this marker.
         */
        get Ref(): Point {
            return new Point(this.RefX, this.RefY);
        }

        /**
         * Sets the refX and refY of this marker.
         */
        set Ref(value: Point) {
            this.RefX = value.X;
            this.RefY = value.Y;
        }

        /**
         * Gets the width of this marker.
         */
        get MarkerWidth(): number {
            if (this.native.attributes["markerWidth"] == null) return 0;
            return parseFloat(this.native.attributes["markerWidth"].value);
        }

        /**
         * Sets the width of this marker.
         */
        set MarkerWidth(value: number) {
            this.native.markerWidth.baseVal.value = value;
        }

        /**
         * Gets the height of this marker.
         */
        get MarkerHeight(): number {
            if (this.native.attributes["markerHeight"] == null) return 0;
            return parseFloat(this.native.attributes["markerHeight"].value);
        }

        /**
         * Sets the height of this marker.
         */
        set MarkerHeight(value: number) {
            this.native.markerHeight.baseVal.value = value;
        }

        /**
         * Gets the size of this marker.
         */
        get Size(): Size {
            return new Size(this.MarkerWidth, this.MarkerHeight);
        }

        /**
         * Sets the size of this marker.
         */
        set Size(value: Size) {
            this.MarkerWidth = value.Width;
            this.MarkerHeight = value.Height;
        }

        /**
         * Gets the size of this marker.
         */
        get ViewBox(): Rect {
            if (this.native.viewBox == null) return Rect.Empty;
            return new Rect(this.native.viewBox.baseVal.x, this.native.viewBox.baseVal.y, this.native.viewBox.baseVal.width, this.native.viewBox.baseVal.height);
        }

        /**
         * Sets the size of this marker.
         */
        set ViewBox(value: Rect) {
            this.native.viewBox.baseVal.height = value.Height;
            this.native.viewBox.baseVal.width = value.Width;
            this.native.viewBox.baseVal.x = value.X;
            this.native.viewBox.baseVal.y = value.Y;
        }

        get Orientation(): MarkerOrientation {
            if (this.native.orientType == null) return MarkerOrientation.NotSet;
            return Marker.ParseOrientation(this.native.orientType.baseVal.toString());
        }

        set Orientation(value: MarkerOrientation) //value is actually an int
        {
            if (value == MarkerOrientation.NotSet) return; // not so sure about this one
            var s = Marker.OrientationString(value);
            if (s != null) this.native.setAttribute("orient", s);
        }

        get Path(): Visual {
            return this.path;
        }

        set Path(value: Visual) {
            if (value == this.path) return;
            this.path = value;
            if (this.native.firstChild != null) this.native.removeChild(this.native.firstChild);
            this.native.appendChild(value.Native);
        }

        get MarkerUnits(): MarkerUnits {
            if (this.native.orientType == null) return MarkerUnits.NotSet;
            return Marker.ParseMarkerUnits(this.native.orientType.baseVal.toString());
        }

        set MarkerUnits(value: MarkerUnits) {
            if (value == MarkerUnits.NotSet) return; // not so sure about this one
            var s = Marker.MarkerUnitsString(value);
            if (s != null) this.native.setAttribute("markerUnits", s);
        }

        /**
         * Parses the orientation attribute.
         * @param v The value of the 'orient' attribute.
         */
        static ParseOrientation(v: string): MarkerOrientation {
            if (v == null) return MarkerOrientation.NotSet;
            if (v.toLowerCase() == "auto") return MarkerOrientation.Auto;
            if (v.toLowerCase() == "angle") return MarkerOrientation.Angle;
            throw "Unexpected value '" + v + "' cannot be converted to a MarkerOrientation.";
        }

        /**
         * Returns a string representation of the given MarkerOrientation.
         * @param value A MarkerOrientation member.
         */
        static OrientationString(value: MarkerOrientation): string {
            switch (value) {
                case 0:
                    return "auto";
                case 1:
                    return "angle";
                case 2:
                    return null;
            }
            throw "Unexpected MarkerOrientation value '" + value + "'.";
        }

        /**
         * Attempts to convert the given string to a MarkerUnits.
         * @param v A string to convert.
         */
        static ParseMarkerUnits(v: string): MarkerUnits {
            if (v == null) return MarkerUnits.NotSet;
            if (v.toLowerCase() == "strokewidth") return MarkerUnits.StrokeWidth;
            if (v.toLowerCase() == "userspaceonuse") return MarkerUnits.UserSpaceOnUse;
            throw "Unexpected MarkerUnits value '" + v + "'.";
        }

        static MarkerUnitsString(value: MarkerUnits) {
            switch (value) {
                case 0:
                    return "strokewidth";
                case 1:
                    return "userspaceonuse";
                case 2:
                    return null;
            }
            throw "Unexpected MarkerUnits value '" + value + "'.";
        }

        /**
         * Sets the stroke color of the underlying path.
         */
        public set Stroke(value: string) {
            if (this.Path != null) this.Path.Stroke = value;
        }

        /**
         * Gets the stroke color of the underlying path.
         */
        public get Stroke(): string {
            if (this.Path == null) return null;
            return this.Path.Stroke;
        }

        /**
         * Sets the fill color of the underlying path.
         */
        public set Background(value: string) {
            if (value == null) value = "none";
            if (this.Path != null) this.Path.Background = value;
        }

        /**
         * Sets the fill and stroke color of the underlying path in one go.
         * You can set the values separately by accessing the Path property of this marker if needed.
         */
        public set Color(value: string) {
            if (this.Path != null) {
                this.Path.Background = value;
                this.Path.Stroke = value;
            }
        }

        public get Background(): string {
            if (this.Path == null) return null;
            return this.Path.Background;
        }


    }

    /**
     * The possible marker orientation values.
     */
    export enum MarkerOrientation {
        Auto = 0,
        Angle = 1,
        NotSet = 2
    }

    /**
     * The possible marker unit values.
     */
    export enum MarkerUnits {
        StrokeWidth = 0,
        UserSpaceOnUse = 1,
        NotSet = 2
    }

    /**
     * A linear gradient.
     */
    export class LinearGradient {
        private native = <SVGLinearGradientElement>document.createElementNS(NS, "linearGradient");
        private from: Point;
        private to: Point;

        private canvas: Canvas;
        private stops: GradientStop[] = [];

        public get Native() {
            return this.native;
        }

        public get GradientStops() {
            return this.stops;
        }

        /**
         * Instantiates a new Line.
         */
        constructor(canvas: Canvas = null, from: Point = null, to: Point = null) {
            this.canvas = canvas;
            this.from = from;
            this.to = to;
        }

        public get Id() {
            return this.Native == null ? null : this.Native.id;
        }

        public set Id(value) {
            this.Native.id = value;
        }

        /**
         * Gets the point where the gradient starts.
         */
        public get From() {
            return this.from;
        }

        /**
         * Sets the point where the gradient starts. The value should be in the [0,1] interval.
         */
        public set From(value) {
            if (this.from != value) {
                this.Native.setAttribute("x1", (value.X * 100).toString() + "%");
                this.Native.setAttribute("y1", (value.Y * 100).toString() + "%");
                this.from = value;
            }
        }

        /**
         * Gets the point where the gradient ends.
         */
        public get To() {
            return this.to;
        }

        /**
         * Sets the point where the gradient ends.The value should be in the [0,1] interval.
         */
        public set To(value) {
            if (this.to != value) {
                this.Native.setAttribute("x2", (value.X * 100).toString() + "%");
                this.Native.setAttribute("y2", (value.Y * 100).toString() + "%");
                this.to = value;
            }
        }

        public AddGradientStops(...stops: GradientStop[]) {
            for (var i = 0; i < stops.length; i++) this.AddGradientStop(stops[i]);
        }

        public AddGradientStop(stop: GradientStop) {
            if (stop == null) throw "The given GradientStop is null.";
            this.stops.push(stop);
            this.Native.appendChild(stop.Native);
        }

        public RemoveGradientStop(stop: GradientStop) {
            if (stop == null) throw "The given GradientStop is null.";
            if (!this.stops.contains(stop)) return;
            this.stops.remove(stop);
            this.Native.removeChild(stop.Native);
        }
    }

    /**
     * Represents a gradient stop.
     */
    export class GradientStop {
        private native = <SVGStopElement>document.createElementNS(NS, "stop");
        private color: Color = Colors.White;

        constructor(color: Color = null, offset: number = null) {
            if (color == null) this.Color = Colors.White;
            else this.Color = color;
            if (offset == null) this.Offset = 0.0;
            else this.Offset = offset;
        }

        public get Native() {
            return this.native;
        }

        public get Offset(): number {
            if (this.native.attributes["offset"] == null) return 0.0;
            return parseFloat(this.native.attributes["offset"].value);
        }

        /**
         * Sets the offset where this gradient stop starts.The value should be in the [0,1] interval.
         */
        public set Offset(value: number) {
            this.native.setAttribute("offset", (value * 100.0).toString() + "%");
        }

        public get Color(): Color {
            return this.color;
        }

        public set Color(value: Color) {
            if (value == null) throw "The color cannot be null.";
            this.color = value;
            this.native.style.stopColor = value.AsCSS1Color;
            this.native.style.stopOpacity = value.A == null ? "1.0" : value.A.toString();
        }


    }

    /**
     * Represents an SVG color.
     */
    export class Color {
        private r: number = 0.0;
        private g: number = 0.0;
        private b: number = 0.0;
        private a: number = 1.0;

        public get R(): number {
            return this.r;
        }

        public get G(): number {
            return this.g;
        }

        public get B(): number {
            return this.b;
        }

        public get A(): number {
            return this.a;
        }

        constructor();

        constructor(hexvalue: string);

        constructor(r: number, g: number, b: number);

        constructor(r: number, g: number, b: number, a: number);

        constructor(r: any = null, g: number = null, b: number = null, a: number = null) {
            if (r == null) return;
            if (typeof (r) == "string") {
                var s = <string>r;
                if (s.substring(0, 1) == "#") s = s.substr(1);
                //try predefined ones
                var known = Colors.Parse(s.toLowerCase());
                if (known != null) {
                    this.r = known.R;
                    this.g = known.G;
                    this.b = known.B;
                    return;
                }
                var c = Color.Parse(s.toUpperCase());
                if (c != null) {
                    this.r = c.R;
                    this.g = c.G;
                    this.b = c.B;
                    return;
                }
                else throw "The string '" + r + "' could not be converted to a color value.";
            }
            if (typeof (r) == "number") {
                this.r = parseFloat(r);
                this.g = g;
                this.b = b;
                if (a != null) this.a = a;
                this.FixValues();
            }

        }

        static Parse(s: string): Color {
            if (s == null || s.length == 0) throw "Empty string";
            s = s.trim();
            var defs = ColorConverters.All;
            for (var i = 0; i < defs.length; i++) {
                var re = new RegExp(defs[i].RegEx);
                var processor = defs[i].Parse;
                var bits = re.exec(s);
                if (bits) {
                    var channels = processor(bits);
                    return new Color(channels[0], channels[1], channels[2]);
                }
            }
        }

        public get AsCSS1() {
            return 'fill:rgb(' + this.R + ', ' + this.G + ', ' + this.B + '); fill-opacity:' + this.a + ';';
        }

        public get AsCSS1Color() {
            return 'rgb(' + this.R + ', ' + this.G + ', ' + this.B + ')';
        }

        public get AsCSS3() {
            return 'fill:rgba(' + this.R + ', ' + this.G + ', ' + this.B + ', ' + this.a + ')';
        }

        public get AsHex6() {
            return ColorConverters.RgbToHex(this.r, this.g, this.b).toUpperCase();
        }

        private FixValues() {
            this.r = (this.r < 0 || isNaN(this.r)) ? 0 : ((this.r > 255) ? 255 : this.r);
            this.g = (this.g < 0 || isNaN(this.g)) ? 0 : ((this.g > 255) ? 255 : this.g);
            this.b = (this.b < 0 || isNaN(this.b)) ? 0 : ((this.b > 255) ? 255 : this.b);
            this.a = (this.a < 0 || isNaN(this.a)) ? 0 : ((this.a > 255) ? 255 : this.a);
        }

    }

    /**
     * Collects Color conversion utils.
     */
    export class ColorConverters {

        /**
         * Returns an array of all color conversion methods.
         */
        public static get All() {
            return [ColorConverters.HEX6, ColorConverters.HEX3, ColorConverters.RGB];
        }

        private static componentToHex(c) {
            var hex = c.toString(16);
            return hex.length == 1 ? "0" + hex : hex;
        }

        /**
         * Converts the given RGB values to an hexadecimal representation.
         */
        public static RgbToHex(r, g, b): string {
            return "#" + ColorConverters.componentToHex(r) + ColorConverters.componentToHex(g) + ColorConverters.componentToHex(b);
        }

        /**
         * Returns the hexadecimal (six characters) converter.
         */
        public static get HEX6(): IColorConverter {
            return {
                RegEx: "^(\\w{2})(\\w{2})(\\w{2})$",
                Parse: function (bits) {
                    return [
                        parseInt(bits[1], 16),
                        parseInt(bits[2], 16),
                        parseInt(bits[3], 16)
                    ];
                }
            }
        }

        /**
         * Returns the hexadecimal (three characters) converter.
         */
        static get HEX3(): IColorConverter {
            return {
                RegEx: "^(\\w{1})(\\w{1})(\\w{1})$",
                Parse: function (bits) {
                    return [
                        parseInt(bits[1] + bits[1], 16),
                        parseInt(bits[2] + bits[2], 16),
                        parseInt(bits[3] + bits[3], 16)
                    ];
                }
            }
        }

        /**
         * Returns the RGB converter.
         */
        static get RGB(): IColorConverter {
            return {
                RegEx: "^rgb\((\\d{1,3}),\\s*(\\d{1,3}),\\s*(\\d{1,3})\)$",
                Parse: function (bits) {
                    return [
                        parseInt(bits[1]),
                        parseInt(bits[2]),
                        parseInt(bits[3])
                    ];
                }
            }
        }
    }

    export interface IColorConverter {
        RegEx: string;
        Parse(bits: RegExpExecArray): number[];
    }

    /**
     * A collection of predefined colors.
     */
    export class Colors {
        private static knownColors = {
            aliceblue: 'f0f8ff',
            antiquewhite: 'faebd7',
            aqua: '00ffff',
            aquamarine: '7fffd4',
            azure: 'f0ffff',
            beige: 'f5f5dc',
            bisque: 'ffe4c4',
            black: '000000',
            blanchedalmond: 'ffebcd',
            blue: '0000ff',
            blueviolet: '8a2be2',
            brown: 'a52a2a',
            burlywood: 'deb887',
            cadetblue: '5f9ea0',
            chartreuse: '7fff00',
            chocolate: 'd2691e',
            coral: 'ff7f50',
            cornflowerblue: '6495ed',
            cornsilk: 'fff8dc',
            crimson: 'dc143c',
            cyan: '00ffff',
            darkblue: '00008b',
            darkcyan: '008b8b',
            darkgoldenrod: 'b8860b',
            darkgray: 'a9a9a9',
            darkgreen: '006400',
            darkkhaki: 'bdb76b',
            darkmagenta: '8b008b',
            darkolivegreen: '556b2f',
            darkorange: 'ff8c00',
            darkorchid: '9932cc',
            darkred: '8b0000',
            darksalmon: 'e9967a',
            darkseagreen: '8fbc8f',
            darkslateblue: '483d8b',
            darkslategray: '2f4f4f',
            darkturquoise: '00ced1',
            darkviolet: '9400d3',
            deeppink: 'ff1493',
            deepskyblue: '00bfff',
            dimgray: '696969',
            dodgerblue: '1e90ff',
            feldspar: 'd19275',
            firebrick: 'b22222',
            floralwhite: 'fffaf0',
            forestgreen: '228b22',
            fuchsia: 'ff00ff',
            gainsboro: 'dcdcdc',
            ghostwhite: 'f8f8ff',
            gold: 'ffd700',
            goldenrod: 'daa520',
            gray: '808080',
            green: '008000',
            greenyellow: 'adff2f',
            honeydew: 'f0fff0',
            hotpink: 'ff69b4',
            indianred: 'cd5c5c',
            indigo: '4b0082',
            ivory: 'fffff0',
            khaki: 'f0e68c',
            lavender: 'e6e6fa',
            lavenderblush: 'fff0f5',
            lawngreen: '7cfc00',
            lemonchiffon: 'fffacd',
            lightblue: 'add8e6',
            lightcoral: 'f08080',
            lightcyan: 'e0ffff',
            lightgoldenrodyellow: 'fafad2',
            lightgrey: 'd3d3d3',
            lightgreen: '90ee90',
            lightpink: 'ffb6c1',
            lightsalmon: 'ffa07a',
            lightseagreen: '20b2aa',
            lightskyblue: '87cefa',
            lightslateblue: '8470ff',
            lightslategray: '778899',
            lightsteelblue: 'b0c4de',
            lightyellow: 'ffffe0',
            lime: '00ff00',
            limegreen: '32cd32',
            linen: 'faf0e6',
            magenta: 'ff00ff',
            maroon: '800000',
            mediumaquamarine: '66cdaa',
            mediumblue: '0000cd',
            mediumorchid: 'ba55d3',
            mediumpurple: '9370d8',
            mediumseagreen: '3cb371',
            mediumslateblue: '7b68ee',
            mediumspringgreen: '00fa9a',
            mediumturquoise: '48d1cc',
            mediumvioletred: 'c71585',
            midnightblue: '191970',
            mintcream: 'f5fffa',
            mistyrose: 'ffe4e1',
            moccasin: 'ffe4b5',
            navajowhite: 'ffdead',
            navy: '000080',
            oldlace: 'fdf5e6',
            olive: '808000',
            olivedrab: '6b8e23',
            orange: 'ffa500',
            orangered: 'ff4500',
            orchid: 'da70d6',
            palegoldenrod: 'eee8aa',
            palegreen: '98fb98',
            paleturquoise: 'afeeee',
            palevioletred: 'd87093',
            papayawhip: 'ffefd5',
            peachpuff: 'ffdab9',
            peru: 'cd853f',
            pink: 'ffc0cb',
            plum: 'dda0dd',
            powderblue: 'b0e0e6',
            purple: '800080',
            red: 'ff0000',
            rosybrown: 'bc8f8f',
            royalblue: '4169e1',
            saddlebrown: '8b4513',
            salmon: 'fa8072',
            sandybrown: 'f4a460',
            seagreen: '2e8b57',
            seashell: 'fff5ee',
            sienna: 'a0522d',
            silver: 'c0c0c0',
            skyblue: '87ceeb',
            slateblue: '6a5acd',
            slategray: '708090',
            snow: 'fffafa',
            springgreen: '00ff7f',
            steelblue: '4682b4',
            tan: 'd2b48c',
            teal: '008080',
            thistle: 'd8bfd8',
            tomato: 'ff6347',
            turquoise: '40e0d0',
            violet: 'ee82ee',
            violetred: 'd02090',
            wheat: 'f5deb3',
            white: 'ffffff',
            whitesmoke: 'f5f5f5',
            yellow: 'ffff00',
            yellowgreen: '9acd32'
        };

        static Parse(name: string): Color {
            for (var key in Colors.knownColors) {
                if (name == key) return new Color(Colors.knownColors[key]);
            }
            return null;
        }

        static get AliceBlue() {
            return new Color("F0F8FF");
        }

        static get AntiqueWhite() {
            return new Color("FAEBD7");
        }

        static get Aqua() {
            return new Color("00FFFF");
        }

        static get Aquamarine() {
            return new Color("7FFFD4");
        }

        static get Azure() {
            return new Color("F0FFFF");
        }

        static get Beige() {
            return new Color("F5F5DC");
        }

        static get Bisque() {
            return new Color("FFE4C4");
        }

        static get Black() {
            return new Color("000000");
        }

        static get BlanchedAlmond() {
            return new Color("	FFEBCD");
        }

        static get Blue() {
            return new Color("0000FF");
        }

        static get BlueViolet() {
            return new Color("8A2BE2");
        }

        static get Brown() {
            return new Color("A52A2A");
        }

        static get BurlyWood() {
            return new Color("DEB887");
        }

        static get CadetBlue() {
            return new Color("5F9EA0");
        }

        static get Chartreuse() {
            return new Color("7FFF00");
        }

        static get Chocolate() {
            return new Color("D2691E");
        }

        static get Coral() {
            return new Color("FF7F50");
        }

        static get CornflowerBlue() {
            return new Color("	6495ED");
        }

        static get Cornsilk() {
            return new Color("FFF8DC");
        }

        static get Crimson() {
            return new Color("DC143C");
        }

        static get Cyan() {
            return new Color("00FFFF");
        }

        static get DarkBlue() {
            return new Color("00008B");
        }

        static get DarkCyan() {
            return new Color("008B8B");
        }

        static get DarkGoldenRod() {
            return new Color("	B8860B");
        }

        static get DarkGray() {
            return new Color("A9A9A9");
        }

        static get DarkGreen() {
            return new Color("006400");
        }

        static get DarkKhaki() {
            return new Color("BDB76B");
        }

        static get DarkMagenta() {
            return new Color("8B008B");
        }

        static get DarkOliveGreen() {
            return new Color("	556B2F");
        }

        static get Darkorange() {
            return new Color("FF8C00");
        }

        static get DarkOrchid() {
            return new Color("9932CC");
        }

        static get DarkRed() {
            return new Color("8B0000");
        }

        static get DarkSalmon() {
            return new Color("E9967A");
        }

        static get DarkSeaGreen() {
            return new Color("8FBC8F");
        }

        static get DarkSlateBlue() {
            return new Color("	483D8B");
        }

        static get DarkSlateGray() {
            return new Color("	2F4F4F");
        }

        static get DarkTurquoise() {
            return new Color("	00CED1");
        }

        static get DarkViolet() {
            return new Color("9400D3");
        }

        static get DeepPink() {
            return new Color("FF1493");
        }

        static get DeepSkyBlue() {
            return new Color("00BFFF");
        }

        static get DimGray() {
            return new Color("696969");
        }

        static get DimGrey() {
            return new Color("696969");
        }

        static get DodgerBlue() {
            return new Color("1E90FF");
        }

        static get FireBrick() {
            return new Color("B22222");
        }

        static get FloralWhite() {
            return new Color("FFFAF0");
        }

        static get ForestGreen() {
            return new Color("228B22");
        }

        static get Fuchsia() {
            return new Color("FF00FF");
        }

        static get Gainsboro() {
            return new Color("DCDCDC");
        }

        static get GhostWhite() {
            return new Color("F8F8FF");
        }

        static get Gold() {
            return new Color("FFD700");
        }

        static get GoldenRod() {
            return new Color("DAA520");
        }

        static get Gray() {
            return new Color("808080");
        }

        static get Green() {
            return new Color("008000");
        }

        static get GreenYellow() {
            return new Color("ADFF2F");
        }

        static get HoneyDew() {
            return new Color("F0FFF0");
        }

        static get HotPink() {
            return new Color("FF69B4");
        }

        static get IndianRed() {
            return new Color("CD5C5C");
        }

        static get Indigo() {
            return new Color("4B0082");
        }

        static get Ivory() {
            return new Color("FFFFF0");
        }

        static get Khaki() {
            return new Color("F0E68C");
        }

        static get Lavender() {
            return new Color("E6E6FA");
        }

        static get LavenderBlush() {
            return new Color("	FFF0F5");
        }

        static get LawnGreen() {
            return new Color("7CFC00");
        }

        static get LemonChiffon() {
            return new Color("FFFACD");
        }

        static get LightBlue() {
            return new Color("ADD8E6");
        }

        static get LightCoral() {
            return new Color("F08080");
        }

        static get LightCyan() {
            return new Color("E0FFFF");
        }

        static get LightGoldenRodYellow() {
            return new Color("	FAFAD2");
        }

        static get LightGray() {
            return new Color("D3D3D3");
        }

        static get LightGreen() {
            return new Color("90EE90");
        }

        static get LightPink() {
            return new Color("FFB6C1");
        }

        static get LightSalmon() {
            return new Color("FFA07A");
        }

        static get LightSeaGreen() {
            return new Color("	20B2AA");
        }

        static get LightSkyBlue() {
            return new Color("87CEFA");
        }

        static get LightSlateGray() {
            return new Color("	778899");
        }

        static get LightSteelBlue() {
            return new Color("	B0C4DE");
        }

        static get LightYellow() {
            return new Color("FFFFE0");
        }

        static get Lime() {
            return new Color("00FF00");
        }

        static get LimeGreen() {
            return new Color("32CD32");
        }

        static get Linen() {
            return new Color("FAF0E6");
        }

        static get Magenta() {
            return new Color("FF00FF");
        }

        static get Maroon() {
            return new Color("800000");
        }

        static get MediumAquaMarine() {
            return new Color("	66CDAA");
        }

        static get MediumBlue() {
            return new Color("0000CD");
        }

        static get MediumOrchid() {
            return new Color("BA55D3");
        }

        static get MediumPurple() {
            return new Color("9370DB");
        }

        static get MediumSeaGreen() {
            return new Color("	3CB371");
        }

        static get MediumSlateBlue() {
            return new Color("	7B68EE");
        }

        static get MediumSpringGreen() {
            return new Color("	00FA9A");
        }

        static get MediumTurquoise() {
            return new Color("	48D1CC");
        }

        static get MediumVioletRed() {
            return new Color("	C71585");
        }

        static get MidnightBlue() {
            return new Color("191970");
        }

        static get MintCream() {
            return new Color("F5FFFA");
        }

        static get MistyRose() {
            return new Color("FFE4E1");
        }

        static get Moccasin() {
            return new Color("FFE4B5");
        }

        static get NavajoWhite() {
            return new Color("FFDEAD");
        }

        static get Navy() {
            return new Color("000080");
        }

        static get OldLace() {
            return new Color("FDF5E6");
        }

        static get Olive() {
            return new Color("808000");
        }

        static get OliveDrab() {
            return new Color("6B8E23");
        }

        static get Orange() {
            return new Color("FFA500");
        }

        static get OrangeRed() {
            return new Color("FF4500");
        }

        static get Orchid() {
            return new Color("DA70D6");
        }

        static get PaleGoldenRod() {
            return new Color("	EEE8AA");
        }

        static get PaleGreen() {
            return new Color("98FB98");
        }

        static get PaleTurquoise() {
            return new Color("	AFEEEE");
        }

        static get PaleVioletRed() {
            return new Color("	DB7093");
        }

        static get PapayaWhip() {
            return new Color("FFEFD5");
        }

        static get PeachPuff() {
            return new Color("FFDAB9");
        }

        static get Peru() {
            return new Color("CD853F");
        }

        static get Pink() {
            return new Color("FFC0CB");
        }

        static get Plum() {
            return new Color("DDA0DD");
        }

        static get PowderBlue() {
            return new Color("B0E0E6");
        }

        static get Purple() {
            return new Color("800080");
        }

        static get Red() {
            return new Color("FF0000");
        }

        static get RosyBrown() {
            return new Color("BC8F8F");
        }

        static get RoyalBlue() {
            return new Color("4169E1");
        }

        static get SaddleBrown() {
            return new Color("8B4513");
        }

        static get Salmon() {
            return new Color("FA8072");
        }

        static get SandyBrown() {
            return new Color("F4A460");
        }

        static get SeaGreen() {
            return new Color("2E8B57");
        }

        static get SeaShell() {
            return new Color("FFF5EE");
        }

        static get Sienna() {
            return new Color("A0522D");
        }

        static get Silver() {
            return new Color("C0C0C0");
        }

        static get SkyBlue() {
            return new Color("87CEEB");
        }

        static get SlateBlue() {
            return new Color("6A5ACD");
        }

        static get SlateGray() {
            return new Color("708090");
        }

        static get Snow() {
            return new Color("FFFAFA");
        }

        static get SpringGreen() {
            return new Color("0FF7F");
        }

        static get SteelBlue() {
            return new Color("4682B4");
        }

        static get Tan() {
            return new Color("D2B48C");
        }

        static get Teal() {
            return new Color("008080");
        }

        static get Thistle() {
            return new Color("D8BFD8");
        }

        static get Tomato() {
            return new Color("FF6347");
        }

        static get Turquoise() {
            return new Color("40E0D0");
        }

        static get Violet() {
            return new Color("EE82EE");
        }

        static get Wheat() {
            return new Color("F5DEB3");
        }

        static get White() {
            return new Color("FFFFFF");
        }

        static get WhiteSmoke() {
            return new Color("F5F5F5");
        }

        static get Yellow() {
            return new Color("FFFF00");
        }

        static get YellowGreen() {
            return new Color("9ACD32");
        }


    }

    export class Gradients {
        public static get BlueWhite() {
            var g = new LinearGradient();
            g.Id = "BlueWhite";
            var b = new GradientStop(Colors.SteelBlue, 0);
            var w = new GradientStop(Colors.White, 1);
            g.AddGradientStops(b, w);
            return g;
        }

    }

    /**
     * A line visual.
     */
    export class Line extends Visual {
        private native = <SVGLineElement>document.createElementNS(NS, "line");
        private from: Point;
        private to: Point;

        /**
         * Instantiates a new Line.
         */
        constructor(from: Point = null, to: Point = null) {
            super();
            this.Initialize(this.native);
            this.From = from;
            this.To = to;
        }

        /**
         * Gets the point where the line starts.
         */
        public get From() {
            return this.from;
        }

        /**
         * Sets the point where the line starts.
         */
        public set From(value) {
            if (this.from != value) {
                this.Native.setAttribute("x1", value.X.toString());
                this.Native.setAttribute("y1", value.Y.toString());
                this.from = value;
            }
        }

        /**
         * Gets the point where the line ends.
         */
        public get To() {
            return this.to;
        }

        /**
         * Sets the point where the line ends.
         */
        public set To(value) {
            if (this.to != value) {
                this.Native.setAttribute("x2", value.X.toString());
                this.Native.setAttribute("y2", value.Y.toString());
                this.to = value;
            }
        }

        /**
         * Gets the opacity.
         */
        public get Opacity(): number {
            if (this.Native.attributes["fill-opacity"] == null) return 1.0;
            return parseFloat(this.Native.attributes["fill-opacity"].value);
        }

        /**
         * Sets the opacity.
         */
        public set Opacity(value: number) {
            if (value < 0 || value > 1.0) throw "The opacity should be in the [0,1] interval.";
            this.Native.setAttribute("fill-opacity", value.toString());
        }

        public set StrokeThickness(value: number) {
            this.Native.setAttribute("stroke-width", value.toString());
        }

        public get StrokeThickness(): number {
            if (this.Native.attributes["stroke-width"] == null) return 0.0;
            return parseFloat(this.Native.attributes["stroke-width"].value);
        }

        public set Stroke(value: string) {
            this.Native.setAttribute("stroke", value);
        }

        public get Stroke(): string {
            if (this.Native.attributes["stroke"] == null) return null;
            return this.Native.attributes["stroke"].value;
        }

        public set StrokeDash(value: string) {
            this.Native.setAttribute("stroke-dasharray", value);
        }

        public get StrokeDash(): string {
            if (this.Native.attributes["stroke-dasharray"] == null) return null;
            return this.Native.attributes["stroke-dasharray"].value;
        }

        public set MarkerEnd(value: Marker) {
            if (value.Id == null) throw "The Marker needs an Id.";
            var s = "url(#" + value.Id + ")";
            this.Native.setAttribute("marker-end", s);
        }

        public get MarkerEnd(): Marker {
            if (this.Native.attributes["marker-end"] == null) return null;
            var s = <string>this.Native.attributes["marker-end"].value.toString();
            var id = s.substr(5, s.length - 6);
            var markers = this.Canvas.Markers;
            for (var i = 0; i < markers.length; i++)
                if (markers[i].Id == id) return markers[i];
            throw "Marker '" + id + "' could not be found in the <defs> collection.";
        }

        public set MarkerStart(value: Marker) {
            if (value.Id == null) throw "The Marker needs an Id.";
            var s = "url(#" + value.Id + ")";
            this.Native.setAttribute("marker-start", s);
        }

        public get MarkerStart(): Marker {
            if (this.Native.attributes["marker-start"] == null) return null;
            var s = <string>this.Native.attributes["marker-start"].value.toString();
            var id = s.substr(5, s.length - 6);
            var markers = this.Canvas.Markers;
            for (var i = 0; i < markers.length; i++)
                if (markers[i].Id == id) return markers[i];
            throw "Marker '" + id + "' could not be found in the <defs> collection.";
        }

    }


    /**
     * A polyline visual.
     */
    export class Polyline extends Visual {
        private native = <SVGPolylineElement>document.createElementNS(NS, "polyline");
        private points: Point[];

        /**
         * Instantiates a new Line.
         */
        constructor(points: Point[] = null) {
            super();
            this.Initialize(this.native);
            if (points != null) this.Points = points;
            else this.points = [];
            this.Stroke = "Black";
            this.StrokeThickness = 2;
            this.Background = "none";
        }
        /**
      * Gets the fill of the polyline.
      */
        get Background() {
            return this.native.style.fill;
        }

        /**
         * Sets the fill of the polyline.
         */
        set Background(v: any) {
            if (typeof (v) == "string") this.native.style.fill = v;
            if (typeof (v) == "object") {
                var gr = <LinearGradient>v;
                if (gr != null) {
                    if (gr.Id == null) throw "The gradient needs an Id.";
                    this.native.style.fill = "url(#" + gr.Id + ")";
                }
            }
        }
        /**
         * Gets the points of the polyline.
         */
        public get Points(): Point[] {
            return this.points;
        }

        /**
         * Sets the points of the polyline.
         */
        public set Points(value: Point[]) {
            if (this.points != value) {
                if (value == null || value.length == 0) this.Native.setAttribute("points", null);
                else {
                    var s = "";
                    for (var i = 0; i < value.length; i++) s += " " + value[i].X + "," + value[i].Y;
                    s = s.trim();
                    this.Native.setAttribute("points", s);
                }
                this.points = value;
            }
        }

        /**
         * Gets the opacity.
         */
        public get Opacity(): number {
            if (this.Native.attributes["fill-opacity"] == null) return 1.0;
            return parseFloat(this.Native.attributes["fill-opacity"].value);
        }

        /**
         * Sets the opacity.
         */
        public set Opacity(value: number) {
            if (value < 0 || value > 1.0) throw "The opacity should be in the [0,1] interval.";
            this.Native.setAttribute("fill-opacity", value.toString());
        }

        public set StrokeThickness(value: number) {
            this.Native.setAttribute("stroke-width", value.toString());
        }

        public get StrokeThickness(): number {
            if (this.Native.attributes["stroke-width"] == null) return 0.0;
            return parseFloat(this.Native.attributes["stroke-width"].value);
        }

        public set Stroke(value: string) {
            this.Native.setAttribute("stroke", value);
        }

        public get Stroke(): string {
            if (this.Native.attributes["stroke"] == null) return null;
            return this.Native.attributes["stroke"].value;
        }

        public set StrokeDash(value: string) {
            this.Native.setAttribute("stroke-dasharray", value);
        }

        public get StrokeDash(): string {
            if (this.Native.attributes["stroke-dasharray"] == null) return null;
            return this.Native.attributes["stroke-dasharray"].value;
        }

        public set MarkerEnd(value: Marker) {
            if (value.Id == null) throw "The Marker needs an Id.";
            var s = "url(#" + value.Id + ")";
            this.Native.setAttribute("marker-end", s);
        }

        public get MarkerEnd(): Marker {
            if (this.Native.attributes["marker-end"] == null) return null;
            var s = <string>this.Native.attributes["marker-end"].value.toString();
            var id = s.substr(5, s.length - 6);
            var markers = this.Canvas.Markers;
            for (var i = 0; i < markers.length; i++)
                if (markers[i].Id == id) return markers[i];
            throw "Marker '" + id + "' could not be found in the <defs> collection.";
        }

        public set MarkerStart(value: Marker) {
            if (value.Id == null) throw "The Marker needs an Id.";
            var s = "url(#" + value.Id + ")";
            this.Native.setAttribute("marker-start", s);
        }

        public get MarkerStart(): Marker {
            if (this.Native.attributes["marker-start"] == null) return null;
            var s = <string>this.Native.attributes["marker-start"].value.toString();
            var id = s.substr(5, s.length - 6);
            var markers = this.Canvas.Markers;
            for (var i = 0; i < markers.length; i++)
                if (markers[i].Id == id) return markers[i];
            throw "Marker '" + id + "' could not be found in the <defs> collection.";
        }

    }

    /**
     * A group visual.
     */
    export class Group extends Visual {

        private native = <SVGGElement>document.createElementNS(NS, "g");
        private position: Point;

        /**
         * Instantiates a new group.
         */
        constructor() {
            super();
            this.Initialize(this.native);
            this.position = new Point(0, 0);
        }

        /**
         * Gets the position of this group.
         */
        get Position(): Point {
            return this.position;
        }

        /**
         * Sets the position of this group.
         */
        set Position(p: Point) {
            this.position = p;
            try {
                if (this.native.ownerSVGElement == null) {
                    this.native.setAttribute("transform", "translate(" + p.X + "," + p.Y + ")");
                    return;
                }
            } catch (err) { return; }
            var tr = this.native.ownerSVGElement.createSVGTransform();
            tr.setTranslate(p.X, p.Y);
            if (this.native.transform.baseVal.numberOfItems == 0)
                this.native.transform.baseVal.appendItem(tr);
            else
                this.native.transform.baseVal.replaceItem(tr, 0);
        }


        /**
         * Appends a visual to this group.
         */
        public Append(visual: IVisual) {
            this.Native.appendChild(visual.Native);
            visual.Canvas = this.Canvas;
        }

        public Remove(visual: IVisual) {
            this.Native.removeChild(visual.Native);
        }
    }

    /**
     * Defines a rectangular region.
     */
    export class Rect {
        public X: number;
        public Y: number;
        public Width: number;
        public Height: number;

        /**
         * Instantiates a new rectangle.
         * @param x The horizontal coordinate of the upper-left corner.
         * @param y The vertical coordinate of the upper-left corner.
         * @param width The width of the rectangle.
         * @param height The height of the rectangle.
         */
        constructor(x: number = NaN, y: number = NaN, width: number = NaN, height: number = NaN) {
            this.X = x;
            this.Y = y;
            this.Width = width;
            this.Height = height;
        }

        /**
         * Determines whether the given point is contained inside this rectangle.
         */
        public Contains(point: Point) {
            if (isNaN(this.X) || isNaN(this.Y) || isNaN(this.Width) || isNaN(this.Height)) throw "This rectangle is not fully specified and containment is hence undefined.";
            if (isNaN(point.X) || isNaN(point.Y)) throw "The point is not fully specified (NaN) and containment is hence undefined.";
            return ((point.X >= this.X) && (point.X <= (this.X + this.Width)) && (point.Y >= this.Y) && (point.Y <= (this.Y + this.Height)));
        }

        /**
         * Inflates this rectangle with the given amount.
         * @param dx The horizontal inflation which is also the vertical one if the vertical inflation is not specified.
         * @param dy The vertical inflation.
         */
        public Inflate(dx: number, dy: number = null) {
            if (dy == null) dy = dx;
            this.X -= dx;
            this.Y -= dy;
            this.Width += dx + dx + 1;
            this.Height += dy + dy + 1;
            return this;
        }

        /**
         * Offsets this rectangle with the given amount.
         * @param dx The horizontal offset which is also the vertical one if the vertical offset is not specified.
         * @param dy The vertical offset.
         */
        public Offset(dx: number, dy: number = NaN) {
            if (isNaN(dy)) dy = dx;
            this.X += dx;
            this.Y += dy;
        }

        /**
         * Returns the union of the current rectangle with the given one.
         * @param r The rectangle to union with the current one.
         */
        public Union(r: Rect) {
            var x1 = Math.min(this.X, r.X);
            var y1 = Math.min(this.Y, r.Y);
            var x2 = Math.max((this.X + this.Width), (r.X + r.Width));
            var y2 = Math.max((this.Y + this.Height), (r.Y + r.Height));
            return new Rect(x1, y1, x2 - x1, y2 - y1);
        }

        /**
         * Get the upper-left corner position of this rectangle.
         */
        public get TopLeft(): Point {
            return new Point(this.X, this.Y);
        }

        /**
         * Get the bottom-right corner position of this rectangle.
         */
        public get BottomRight() {
            return new Point(this.X + this.Width, this.Y + this.Height);
        }

        /**
         * Returns a clone of this rectangle.
         */
        public Clone(): Rect {
            return new Rect(this.X, this.Y, this.Width, this.Height);
        }

        static Create(x, y, w, h) {
            return new Rect(x, y, w, h);
        }

        static get Empty() {
            return new Rect(0, 0, 0, 0);
        }

        static FromPoints(p: Point, q: Point) {
            if (isNaN(p.X) || isNaN(p.Y) || isNaN(q.X) || isNaN(q.Y)) throw "Some values are NaN.";
            return new Rect(Math.min(p.X, q.X), Math.min(p.Y, q.Y), Math.abs(p.X - q.X), Math.abs(p.Y - q.Y));
        }
    }

    /**
     * The Point structure.
     */
    export class Point {
        X: number;
        Y: number;

        constructor(x: number, y: number) {
            this.X = x;
            this.Y = y;
        }

        static get Empty() {
            return new Point(0, 0);
        }

        public Plus(p: Point): Point {
            return new Point(this.X + p.X, this.Y + p.Y);
        }

        public Minus(p: Point): Point {
            return new Point(this.X - p.X, this.Y - p.Y);
        }

        public Times(s: number): Point {
            return new Point(this.X * s, this.Y * s);
        }

        public Normalize(): Point {
            if (this.Length == 0) return Point.Empty;
            return this.Times(1 / this.Length);
        }

        public get Length(): number {
            return Math.sqrt(this.X * this.X + this.Y * this.Y);
        }

        public toString() {
            return "(" + this.X + "," + this.Y + ")";
        }

        public get LengthSquared(): number {
            return (this.X * this.X + this.Y * this.Y);
        }

        static MiddleOf(p: Point, q: Point) {
            return new Point(q.X - p.X, q.Y - p.Y).Times(0.5).Plus(p);
        }

        public ToPolar(useDegrees: bool = false) {
            var factor = 1;
            if (useDegrees) factor = 180 / Math.PI;
            var a = Math.atan2(Math.abs(this.Y), Math.abs(this.X));
            var halfpi = Math.PI / 2;
            if (this.X == 0) {
                // note that the angle goes down and not the usual mathematical convention
                if (this.Y == 0) return new Polar(0, 0);
                if (this.Y > 0) return new Polar(this.Length, factor * halfpi);
                if (this.Y < 0) return new Polar(this.Length, factor * 3 * halfpi);
            }
            else if (this.X > 0) {
                if (this.Y == 0) return new Polar(this.Length, 0);
                if (this.Y > 0) return new Polar(this.Length, factor * a);
                if (this.Y < 0) return new Polar(this.Length, factor * (4 * halfpi - a));
            }
            else {
                if (this.Y == 0) return new Polar(this.Length, 2 * halfpi);
                if (this.Y > 0) return new Polar(this.Length, factor * (2 * halfpi - a));
                if (this.Y < 0) return new Polar(this.Length, factor * (2 * halfpi + a));
            }
        }
    }

    export class Polar {
        public Angle: number;
        public R: number;

        constructor(r: number = null, a: number = null) {
            this.R = r;
            this.Angle = a;
        }
    }

    export class Matrix {
        /*
         Schema is as follows

         | a  c  e |
         |b  d  f  |
         |0  0  1 |

         and elements are thus (a, b, c, d, e, f).
         */
        public a: number;
        public b: number;
        public c: number;
        public d: number;
        public e: number;
        public f: number;

        constructor(a: number = null, b: number = null, c: number = null, d: number = null, e: number = null,
            f: number = null) {
            if (a != null) this.a = a;
            if (b != null) this.b = b;
            if (c != null) this.c = c;
            if (d != null) this.d = d;
            if (e != null) this.e = e;
            if (f != null) this.f = f;
        }

        public Plus(m: Matrix) {
            this.a += m.a;
            this.b += m.b;
            this.c += m.c;
            this.d += m.d;
            this.e += m.e;
            this.f += m.f;
        }

        public Minus(m: Matrix) {
            this.a -= m.a;
            this.b -= m.b;
            this.c -= m.c;
            this.d -= m.d;
            this.e -= m.e;
            this.f -= m.f;
        }

        public Times(m: Matrix) {
            return Matrix.FromList([
                this.a * m.a + this.c * m.b,
                this.b * m.a + this.d * m.b,
                this.a * m.c + this.c * m.d,
                this.b * m.c + this.d * m.d,
                this.a * m.e + this.c * m.f + this.e,
                this.b * m.e + this.d * m.f + this.f
            ]);

        }

        public Apply(p: Point) {
            return new Point(
                this.a * p.X + this.c * p.Y + this.e,
                this.b * p.X + this.d * p.Y + this.f
            );
        }

        static FromSVGMatrix(vm: SVGMatrix): Matrix {
            var m = new Matrix();
            m.a = vm.a;
            m.b = vm.b;
            m.c = vm.c;
            m.d = vm.d;
            m.e = vm.e;
            m.f = vm.f;
            return m;
        }

        static FromMatrixVector(v: MatrixVector): Matrix {
            var m = new Matrix();
            m.a = v.a;
            m.b = v.b;
            m.c = v.c;
            m.d = v.d;
            m.e = v.e;
            m.f = v.f;
            return m;
        }

        static FromList(v: any[]): Matrix {
            if (v.length != 6) throw "The given list should consist of six elements.";
            var m = new Matrix();
            m.a = v[0];
            m.b = v[1];
            m.c = v[2];
            m.d = v[3];
            m.e = v[4];
            m.f = v[5];
            return m;
        }

        static Translation(x: number, y: number) {
            var m = new Matrix();
            m.a = 1;
            m.b = 0;
            m.c = 0;
            m.d = 1;
            m.e = x;
            m.f = y;
            return m;
        }

        static get Unit() {
            return Matrix.FromList([1, 0, 0, 1, 0, 0]);
        }

        public toString() {
            return "matrix(" + this.a + " " + this.b + " " + this.c + " " + this.d + " " + this.e + " " + this.f + ")";
        }

        /*
         * Returns the rotation matrix for the given angle.
         * @param angle The angle in radians.
         */
        static Rotation(angle: number, x: number = 0, y: number = 0): Matrix {
            var m = new Matrix();
            m.a = Math.cos(angle * Math.PI / 180);
            m.b = Math.sin(angle * Math.PI / 180);
            m.c = -m.b;
            m.d = m.a;
            m.e = x - x * m.a + y * m.b;
            m.f = y - y * m.a - x * m.b;
            return m;
        }

        /*
         * Returns the scaling matrix for the given factor.
         * @param factor The scaling factor.
         */
        static Scaling(scaleX: number, scaleY: number = null) {
            if (scaleY == null) scaleY = scaleX;
            var m = new Matrix();
            m.a = scaleX;
            m.b = 0;
            m.c = 0;
            m.d = scaleY;
            m.e = 0;
            m.f = 0;
            return m;
        }

        static Parse(v: string): Matrix {
            if (v == null) return null;
            v = v.trim();
            // of the form "matrix(...)"
            if (v.slice(0, 6).toLowerCase() == "matrix") {
                var nums = v.slice(7, v.length - 1).trim();
                var parts = nums.split(",");
                if (parts.length == 6) return Matrix.FromList(parts.map(p => parseFloat(p)));
                parts = nums.split(" ");
                if (parts.length == 6) return Matrix.FromList(parts.map(p => parseFloat(p)));
            }
            // of the form "(...)"
            if (v.slice(0, 1) == "(" && v.slice(v.length - 1) == ")") v = v.substr(1, v.length - 1);
            if (v.indexOf(",") > 0) {
                var parts = v.split(",");
                if (parts.length == 6) return Matrix.FromList(parts.map(p => parseFloat(p)));
            }

            if (v.indexOf(" ") > 0) {
                var parts = v.split(" ");
                if (parts.length == 6) return Matrix.FromList(parts.map(p => parseFloat(p)));
            }
            return null;
        }
    }

    export class MatrixVector {
        public a: number;
        public b: number;
        public c: number;
        public d: number;
        public e: number;
        public f: number;

        //constructor();
        constructor(a: number = null, b: number = null, c: number = null, d: number = null, e: number = null,
            f: number = null) {
            if (a != null) this.a = a;
            if (b != null) this.b = b;
            if (c != null) this.c = c;
            if (d != null) this.d = d;
            if (e != null) this.e = e;
            if (f != null) this.f = f;
        }

        /**
         * Returns a MatrixVector from the given Matrix values.
         * @param m A Matrix.
         */
        static FromMatrix(m: Matrix) {
            var v = new MatrixVector();
            v.a = m.a;
            v.b = m.b;
            v.c = m.c;
            v.d = m.d;
            v.e = m.e;
            v.f = m.f;
            return v;
        }
    }

    /**
     * The Size structure.
     */
    export class Size {
        Width: number;
        Height: number;

        constructor(width: number, height: number = null) {
            if (height == null) height = width;
            this.Width = width;
            this.Height = height;
        }

        static get Empty() {
            return new Size(0);
        }
    }

    /**
     * Tagging interface for all visuals.
     */
    export interface IVisual {
        Id: string;
        Native: Element;
        Position: Point;
        Canvas: Canvas;
        Transform(...transforms: Transformation[]);
    }

    /**
     * An SVG circle element.
     */
    export interface ICircle extends IVisual {
        Radius: number;
        Center: Point;
    }

    /**
     * Defines the SVG root.
     */
    export interface ICanvas extends IVisual {
        Append: (shape: IVisual) => ICanvas;
    }

    /**
     * The SVG namespace (http://www.w3.org/2000/svg).
     */
    export var NS = "http://www.w3.org/2000/svg";

    /**
     * A range of values.
     */
    export class Range {
        constructor(start, stop = null, step = null) {
            if (step == null) {
                step = 1;
                if (stop == null) {
                    stop = start;
                    start = 0;
                }
            }
            if ((stop - start) / step === Infinity) throw "Infinite range defined.";
            var range: number[] = [];
            var i = -1;
            var j: number;
            var k = this.RangeIntegerScale(Math.abs(step));
            start *= k;
            stop *= k;
            step *= k;
            if (step < 0) while ((j = start + step * ++i) > stop) range.push(j / k);
            else while ((j = start + step * ++i) < stop) range.push(j / k);
            return range;
        }

        private RangeIntegerScale(x) {
            var k = 1;
            while (x * k % 1) k *= 10;
            return k;
        }

        static Create(start, stop = null, step = null) {
            return new Range(start, stop, step);
        }
    }

    /**
     * Utilities related to stochastic variables.
     */
    export class Random {
        static NormalVariable(mean = 0, deviation = 1) {
            return function () {
                var x, y, r;
                do {
                    x = Math.random() * 2 - 1;
                    y = Math.random() * 2 - 1;
                    r = x * x + y * y;
                } while (!r || r > 1);
                return mean + deviation * x * Math.sqrt(-2 * Math.log(r) / r);
            };
        }

        static get RandomId() {
            return Math.floor((1 + Math.random()) * 0x1000000).toString(16).substring(1);
        }
    }

    /**
     * A circle visual.
     */
    export class Circle extends Visual implements ICircle {

        private native = <SVGCircleElement>document.createElementNS(NS, "circle");

        /**
         * Instantiates a new circle.
         */
        constructor() {
            super();
            this.Initialize(this.native);
        }

        public set Stroke(value: string) {
            this.Native.setAttribute("stroke", value);
        }

        public get Stroke(): string {
            if (this.Native.attributes["stroke"] == null) return null;
            return this.Native.attributes["stroke"].value;
        }

        public set StrokeThickness(value: number) {
            this.Native.setAttribute("stroke-width", value.toString());
        }

        public set Opacity(value: number) {
            if (value > 1) value = 1.0;
            if (value < 0) value = 0.0;
            this.Native.setAttribute("fill-opacity", value.toString());
        }

        public get Opacity(): number {
            if (this.Native.attributes["fill-opacity"] == null) return 1.0;
            return parseFloat(this.Native.attributes["fill-opacity"].value);
        }

        public get StrokeThickness(): number {
            if (this.Native.attributes["stroke-width"] == null) return 0.0;
            return parseFloat(this.Native.attributes["stroke-width"].value);
        }

        /**
         * Gets the radius of the circle.
         */
        get Radius(): number {
            return this.native.r.baseVal.value;
        }

        /**
         * Sets the radius of the circle.
         */
        set Radius(value: number) {
            this.native.r.baseVal.value = value;
        }

        /**
         * Gets the center of the circle.
         */
        get Center(): Point {
            return new Point(this.native.cx.baseVal.value, this.native.cy.baseVal.value)
        }

        /**
         * Sets the center of the circle.
         */
        set Center(value: Point) {
            this.native.cx.baseVal.value = value.X;
            this.native.cy.baseVal.value = value.Y;
        }

        /**
         * Gets the position of the top-left of the circle.
         */
        get Position(): Point {
            return new Point(this.Center.X - this.Radius, this.Center.Y - this.Radius);
        }

        /**
         * Sets the position of the top-left of the circle.
         */
        set Position(p: Point) {
            this.Center = new Point(p.X + this.Radius, p.Y + this.Radius);
        }

        /**
         * Gets the fill of the circle.
         */
        get Background() {
            return this.native.style.fill;
        }

        /**
         * Sets the fill of the circle.
         */
        set Background(v: any) {
            if (typeof (v) == "string") this.native.style.fill = v;
            if (typeof (v) == "object") {
                var gr = <LinearGradient>v;
                if (gr != null) {
                    if (gr.Id == null) throw "The gradient needs an Id.";
                    this.native.style.fill = "url(#" + gr.Id + ")";
                }
            }
        }

    }

    /**
     * Defines the options when instantiating a new SVG Canvas.
     */
    export class CanvasOptions {
        public Width = 1024;
        public Height = 768;
        public BackgroundColor = "White";
    }

    /**
     * Defines the root SVG surface inside which all visual things happen.
     */
    export class Canvas extends Visual implements ICanvas {
        //public MouseDown: (ev: MouseEvent) => any;
        private HostElement: HTMLDivElement;
        public Position: Point;
        private markers: Marker[] = [];
        private gradients: LinearGradient[] = [];
        private native = <SVGSVGElement>document.createElementNS(NS, "svg");
        private defsNode = <SVGDefsElement>document.createElementNS(NS, "defs");
        private defsPresent: bool = false;
        public Visuals: IVisual[] = [];

        /// defining this on the Visual level is somewhat problematic; SVG doesn't play well with the keyboard
        public set KeyPress(f: (ev: KeyboardEvent) => any) {
            this.HostElement.addEventListener("keypress", f);
            //this.HostElement.addEventListener("keypress", function (e: KeyboardEvent) { console.log("Pressed; " + e.charCode); });

        }

        public set KeyDown(f: (ev: KeyboardEvent) => any) {
            this.HostElement.addEventListener("keydown", f);
            //this.HostElement.addEventListener("keydown", function (e: KeyboardEvent) { console.log("Down; " + e.charCode); });
        }

        constructor(host: HTMLDivElement, options?: CanvasOptions = new CanvasOptions()) {
            super();
            this.Initialize(this.native);
            this.HostElement = host;
            this.InsertSVGRootElement(options);
            this.native.style.background = options.BackgroundColor;
            //this.ListenToEvents();
            this.Canvas = this;
            //this.HostElement.onkeydown = function (e: KeyboardEvent) { alert('there you go'); };
            //ensure tabindex so the the canvas receives key events
            this.HostElement.setAttribute("tabindex", "0");
            this.HostElement.focus();
        }

        public Focus() {
            this.HostElement.focus();
        }

        ///<summary>Inserts the actual SVG element in the HTML host.</summary>
        private InsertSVGRootElement(options: CanvasOptions) {
            this.HostElement.style.width = options.Width.toString();
            this.HostElement.style.height = options.Height.toString();
            this.native.style.width = options.Width.toString();
            this.native.style.height = options.Height.toString();
            this.native.setAttribute("width",options.Width.toString());
            this.native.setAttribute("height",options.Height.toString());             
            this.native.id = "SVGRoot";
            this.HostElement.appendChild(this.native);
        }

        Append(shape: IVisual) {
            this.native.appendChild(shape.Native);
            shape.Canvas = this;
            this.Visuals.push(shape);
            // in case the shape position was assigned before the shape was appended to the canvas.
            shape.Position = shape.Position;

            return this;
        }

        Remove(visual: IVisual): Canvas {
            if (this.Visuals.indexOf(visual) >= 0) {
                this.native.removeChild(visual.Native);
                visual.Canvas = null;
                this.Visuals.remove(visual);
                return this;
            }
            return null;
        }

        InsertBefore(visual: IVisual, beforeVisual: IVisual) {
            this.native.insertBefore(visual.Native, beforeVisual.Native);
            visual.Canvas = this;
            this.Visuals.push(visual);
            return this;
        }

        GetTransformedPoint(x: number, y: number) {
            var p = this.native.createSVGPoint();
            p.x = x;
            p.y = y;
            return p.matrixTransform(this.native.getScreenCTM().inverse());
        }

        public set Cursor(value: string) {
            (<SVGSVGElement> this.Native).style.cursor = value;
        }

        public get Cursor(): string {
            return (<SVGSVGElement> this.Native).style.cursor;
        }

        /**
         * Returns the markers defined in this canvas.
         */
        public get Markers() {
            return this.markers;
        }

        /**
         * Returns the gradients defined in this canvas.
         */
        public get Gradients() {
            return this.gradients;
        }

        private ensureDefsNode() {
            if (this.defsPresent) return;
            if (this.native.childNodes.length > 0) this.native.insertBefore(this.defsNode, this.native.childNodes[0]);
            else this.native.appendChild(this.defsNode);
            this.defsPresent = true;
        }

        /**
         * Adds a marker to the definitions.
         */
        public AddMarker(marker: Marker) {
            this.ensureDefsNode();
            this.defsNode.appendChild(<SVGMarkerElement>marker.Native);
            this.markers.push(marker);
        }

        /**
         * Removes a marker from the definitions.
         */
        public RemoveMarker(marker: Marker) {
            if (marker == null) throw "The given Marker is null";
            if (!this.markers.contains(marker)) throw "The given Marker is not part of the Canvas";
            this.defsNode.removeChild(<SVGMarkerElement>marker.Native);
            this.markers.remove(marker);
        }

        /**
         * Removes a gradient from the definitions.
         */
        public RemoveGradient(gradient: LinearGradient) {
            if (gradient == null) throw "The given Gradient is null";
            if (!this.gradients.contains(gradient)) throw "The given Gradient is not part of the Canvas";
            this.defsNode.removeChild(<SVGLinearGradientElement>gradient.Native);
            this.gradients.remove(gradient);
        }

        /**
         * Adds a gradient to the definitions.
         */
        public AddGradient(gradient: LinearGradient) {
            this.ensureDefsNode();
            this.defsNode.appendChild(<SVGLinearGradientElement>gradient.Native);
            this.gradients.push(gradient);
        }

        public ClearMarkers() {
            if (this.markers.length == 0) return;
            //var toremove = [];
            //for (var i = 0; i < this.defsNode.childNodes.length; i++)
            //{
            //    var item = this.defsNode.childNodes[i];
            //    if (item.nodeName.toLowerCase() == "marker") toremove.push(item);
            //}
            //for (var i = 0; i < toremove.length; i++) this.defsNode.removeChild(toremove[i]);

            for (var i = 0; i < this.markers.length; i++)this.defsNode.removeChild(this.markers[i].Native);
            this.markers = [];
        }

        public ClearGradients() {
            if (this.gradients.length == 0) return;
            //var toremove = [];
            //for (var i = 0; i < this.defsNode.childNodes.length; i++)
            //{
            //    var item = this.defsNode.childNodes[i];
            //    if (item.nodeName.toLowerCase() == "linearGradient") toremove.push(item);
            //}
            //for (var i = 0; i < toremove.length; i++) this.defsNode.removeChild(toremove[i]);
            for (var i = 0; i < this.gradients.length; i++)this.defsNode.removeChild(this.gradients[i].Native);
            this.gradients = [];
        }

        public Clear() {
            this.ClearMarkers();
            this.ClearGradients();
            while (this.Visuals.length > 0) {
                this.Remove(this.Visuals[0]);
            }
        }

    }

    /**
     * A collection of predefined markers.
     */
    export class Markers {
        /**
         * Gets a standard (sharp) arrow head marker pointing to the left.
         */
        public static get ArrowStart(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m0,50l100,40l-30,-40l30,-40z";
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "Arrow" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets a standard (sharp) arrow head marker pointing to the right.
         */
        public static get ArrowEnd(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m100,50l-100,40l30,-40l-30,-40z";
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "Arrow" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets a standard closed circle arrow head marker.
         */
        public static get FilledCircle(): Marker {
            var marker = new Marker();
            var circle = new RadSVG.Circle();
            circle.Radius = 30;
            circle.Center = new Point(50, 50);
            circle.StrokeThickness = 10;
            marker.Path = circle;
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "FilledCircle" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets a standard circle arrow head marker.
         */
        public static get Circle(): Marker {
            var marker = new Marker();
            var circle = new RadSVG.Circle();
            circle.Radius = 30;
            circle.Center = new Point(50, 50);
            circle.StrokeThickness = 10;
            marker.Path = circle;
            marker.Background = "none";
            circle.Stroke = "Black";
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "Circle" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets an open start arrow marker.
         */
        public static get OpenArrowStart(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m0,50l100,40l-30,-40l30,-40l-100,40z";
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.Background = "none";
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "OpenArrowStart" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets an open end arrow marker.
         */
        public static get OpenArrowEnd(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m100,50l-100,40l30,-40l-30,-40z";
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.Background = "none";
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "OpenArrowEnd" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }


        /**
         * Gets a filled diamond marker.
         */
        public static get FilledDiamond(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m20,20l0,60l60,0l0,-60l-60,0z";
            path.Transform(new Rotation(45, 50, 50));
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "FilledDiamond" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets a diamond marker.
         */
        public static get Diamond(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m20,20l0,60l60,0l0,-60l-60,0z";
            path.Transform(new Rotation(45, 50, 50));
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.Background = "none";
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "Diamond" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets a wedge start marker.
         */
        public static get WedgeStart(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m0,50l100,40l-94,-40l94,-40l-100,40z";
            // path.Transform(new Rotation(45, 50, 50));
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "WedgeStart" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets a wedge end marker.
         */
        public static get WedgeEnd(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m0,50l100,40l-94,-40l94,-40l-100,40z";
            path.Transform(new Rotation(180, 50, 50));
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "WedgeEnd" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

        /**
         * Gets a square end marker.
         */
        public static get Square(): Marker {
            var marker = new Marker();
            var path = new Path();
            path.Data = "m20,20l0,60l60,0l0,-60z";
            path.StrokeThickness = 10;
            marker.Path = path;
            marker.ViewBox = new Rect(0, 0, 100, 100);
            marker.Size = new Size(10, 10);
            marker.Id = "Square" + Random.RandomId;
            marker.Ref = new Point(50, 50);
            marker.Orientation = MarkerOrientation.Auto;
            marker.MarkerUnits = MarkerUnits.StrokeWidth;
            return marker;
        }

    }

}


interface Array {
    remove(obj: any);
    contains(obj: any): bool;
    flatten(): Array;
    distinct(): Array;
    //any(f:(i:any)=>bool): bool;
}

//Array.prototype.any = function (f: (i: any) => bool =null)
//{
//    var l = this;  
//    if (f != null) l = this.map(f);    
//    return l.length > 0;
//}
Array.prototype.remove = function () {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
}

Array.prototype.flatten = function () {
    return Array.prototype.concat.apply([], this);
}

Array.prototype.distinct = function () {
    var a = <Array>this;
    var r = [];
    for (var i = 0; i < a.length; i++) if (r.indexOf(a[i]) < 0) r.push(a[i]);
    return <Array> <any>r; // bug in TypeScript really
}
Array.prototype.contains = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] == obj) return true;
    }
    return false;
}

