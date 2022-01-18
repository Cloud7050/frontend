import { KonvaEventObject } from 'konva/lib/Node';
import { Arrow as KonvaArrow, Group as KonvaGroup, Path as KonvaPath } from 'react-konva';

import { Config, ShapeDefaultProps } from '../../EnvVisualizerConfig';
import { Layout } from '../../EnvVisualizerLayout';
import { Hoverable, StepsArray, Visible } from '../../EnvVisualizerTypes';
import { setHoveredStyle, setUnhoveredStyle } from '../../EnvVisualizerUtils';

/** this class encapsulates an arrow to be drawn between 2 points */
export class GenericArrow implements Visible, Hoverable {
  readonly x: number;
  readonly y: number;
  height: number = 0;
  width: number = 0;
  points: number[] = [];
  from: Visible;
  target: Visible | undefined;

  constructor(from: Visible) {
    this.from = from;
    this.x = from.x;
    this.y = from.y;
  }

  to(to: Visible) {
    this.target = to;
    this.width = Math.abs(to.x - this.from.x);
    this.height = Math.abs(to.y - this.from.y);
    return this;
  }

  /**
   * Calculates the steps that this arrows takes.
   * The arrow is decomposed into numerous straight line segments, each of which we
   * can consider as a step of dx in the x direction and of dy in the y direction.
   * The line segment is thus defined by 2 points (x, y) and (x + dx, y + dy)
   * where (x, y) is the ending coordinate of the previous line segment.
   * This function returns an array of such steps, represented by an array of functions
   *  [ (x, y) => [x + dx1, y + dy1], (x, y) => [x + dx2, y + dy2], ... ].
   * From this, we can retrieve the points that make up the arrow as such:
   * (from.x from.y), (from.x + dx1, from.y + dy1), (from.x + dx1 + dx2, from.y + dy1 + dy2), ..
   *
   * Note that the functions need not be of the form (x, y) => [x + dx, y + dy];
   * (x, y) => [to.x, to.y] is valid as well, and is used to specify a step to the ending coordinates
   *
   * @return an array of steps represented by functions
   */
  protected calculateSteps(): StepsArray {
    const to = this.target;
    if (!to) return [];
    return [(x, y) => [to.x, to.y]];
  }

  onMouseEnter = ({ currentTarget }: KonvaEventObject<MouseEvent>) => {
    setHoveredStyle(currentTarget, {
      strokeWidth: Number(Config.ArrowHoveredStrokeWidth)
    });
  };

  onMouseLeave = ({ currentTarget }: KonvaEventObject<MouseEvent>) => {
    setUnhoveredStyle(currentTarget, {
      strokeWidth: Number(Config.ArrowStrokeWidth)
    });
  };

  draw() {
    const points = this.calculateSteps().reduce<Array<number>>(
      (points, step) => [...points, ...step(points[points.length - 2], points[points.length - 1])],
      [this.from.x, this.from.y]
    );
    points.splice(0, 2); 

    return (
      <KonvaGroup
        key={Layout.key++}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
      >
      <KonvaPath
        {...ShapeDefaultProps}
        points={points}
        fill={Config.SA_WHITE.toString()}
        stroke={Config.SA_WHITE.toString()}
        strokeWidth={Number(Config.ArrowStrokeWidth)}
        hitStrokeWidth={Number(Config.ArrowHitStrokeWidth)}
        // drawing a custom shape
        sceneFunc={(ctx,shape) => {
          ctx.beginPath();
          // move to the starting point
          ctx.moveTo(points[0], points[1]);
          if (points.length === 4) {
            // if the line only has starting coordinates and ending coordinates, there is
            // no need to draw a curve
            ctx.lineTo(points[2], points[3]);
          } else {
            // changes how much the corner curves
            const cornerRadius = 40;
            let n = 0;
            while (n < points.length - 4) {
                const dx1 = (points[n + 2] - points[n + 0]);
                const dy1 = (points[n + 3] - points[n + 1]);
                const br1 = Math.min(cornerRadius, Math.max(Math.abs(dx1 / 2), Math.abs(dy1 / 2)));
  
                const dx2 = (points[n + 2 + 2] - points[n + 0 + 2]);
                const dy2 = (points[n + 3 + 2] - points[n + 1 + 2]);
                const br2 = Math.min(cornerRadius, Math.max(Math.abs(dx2 / 2), Math.abs(dy2 / 2)));
  
                const br = Math.min(br1, br2);
  
                const x1 = points[n + 0] + (Math.abs(dx1) - br) * Math.sign(dx1);
                const y1 = points[n + 1] + (Math.abs(dy1) - br) * Math.sign(dy1);
  
                ctx.lineTo(x1, y1);
                n+=2;
                const x2 = points[n + 0] + br * Math.sign(dx2);
                const y2 = points[n + 1] + br * Math.sign(dy2);
                // draw a quadratic curve over the corner
                ctx.quadraticCurveTo(points[n + 0], points[n + 1], x2, y2);
              }
              // connect the curved line to the ending coordinates
              ctx.lineTo(points[points.length - 2], points[points.length - 1]);     
          }
          ctx.strokeShape(shape);
      }}
      /> 
      <KonvaArrow
        {...ShapeDefaultProps}
        points={points}
        fill={Config.SA_WHITE.toString()}
        stroke={Config.SA_WHITE.toString()}
        strokeWidth={0}
        hitStrokeWidth={0}
        />
        </KonvaGroup>
    );
  }
}
