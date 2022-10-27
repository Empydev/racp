import * as zod from "zod";
import { ZodOptionalType, ZodRawShape, ZodTypeAny } from "zod";
import { TSRDefinition } from "./tsr";
import { PathParams } from "./PathParams";

export class RouteBuilderMethods<Def extends RouteDefinition = any> {
  readonly definition: Readonly<Def>;

  constructor(definition: Def) {
    this.definition = definition;
  }

  path<Path extends string>(path: Path, matchOptions?: RouteMatchOptions) {
    return new Route({
      ...this.definition,
      path,
      matchOptions,
    } as RouteDefinition<Def["tsr"], Path, Def["params"], Def["children"]>);
  }

  params<ParamsType extends RouteParamsTypeFor<Def["path"]>>(
    params: ParamsType
  ) {
    return new Route({ ...this.definition, params } as RouteDefinition<
      Def["tsr"],
      Def["path"],
      ParamsType,
      Def["children"]
    >);
  }

  meta(meta: Def["meta"]) {
    return new Route<Def>({ ...this.definition, meta });
  }

  renderer(renderer: Def["renderer"]): Route<Def> {
    return new Route<Def>({ ...this.definition, renderer });
  }

  use(
    ...additionalMiddlewares: Array<
      RouteMiddleware<
        InferRouteParams<Def["params"]>,
        Def["tsr"]["renderResult"]
      >
    >
  ): Route<Def> {
    return new Route<Def>({
      ...this.definition,
      middlewares: [...this.definition.middlewares, ...additionalMiddlewares],
    });
  }

  children<Children extends RouteMap<Def["tsr"]>>(children: Children) {
    return new Route({ ...this.definition, children } as RouteDefinition<
      Def["tsr"],
      Def["path"],
      Def["params"],
      Children
    >);
  }
}

export class Route<
  Def extends RouteDefinition = any
> extends RouteBuilderMethods<Def> {
  readonly render: Def["renderer"] = this.definition.middlewares.reduce(
    (renderer, next) => next(renderer),
    this.definition.renderer
  );
}

export type RouterLocation = "NominalString<RouterLocation>";

export interface RouteDefinition<
  TSRDef extends TSRDefinition = TSRDefinition,
  Path extends string = any,
  ParamsType extends RouteParamsTypeFor<Path> = any,
  Children extends RouteMap<TSRDef> = any
> {
  tsr: TSRDef;
  path: Path;
  params: ParamsType;
  meta: TSRDef["meta"];
  renderer: RouteRenderer<InferRouteParams<ParamsType>, TSRDef["renderResult"]>;
  children: Children;
  middlewares: Array<
    RouteMiddleware<InferRouteParams<ParamsType>, TSRDef["renderResult"]>
  >;
  matchOptions?: RouteMatchOptions;
}

export type RouteMiddleware<Params = any, RenderResult = any> = (
  nextRenderer: RouteRenderer<Params, RenderResult>
) => RouteRenderer<Params, RenderResult>;

export interface RouteRendererProps<Params, RenderResult> {
  params: Params;
  children?: RenderResult;
}

export type RouteRenderer<Params, RenderResult> = (
  props: RouteRendererProps<Params, RenderResult>
) => RenderResult;

export type RouteMap<TSRDef extends TSRDefinition = TSRDefinition> = Record<
  string,
  Route<RouteDefinition<TSRDef>>
>;

export type RouteParams<T extends Route | RouteDefinition> = InferRouteParams<
  (T extends Route<infer Def> ? Def : T)["params"]
>;

export type RouteParamsType = ZodRawShape;

export type RouteParamsTypeFor<Path extends string> = {
  [K in keyof PathParams<Path>]: IsOptional<PathParams<Path>[K]> extends true
    ? ZodOptionalType<any>
    : ZodTypeAny;
};

type IsOptional<T> = undefined extends T ? true : false;

export type InferRouteParams<T extends RouteParamsType> = zod.objectOutputType<
  T,
  ZodTypeAny
>;

export type RouteMatchOptions = {
  strict?: boolean;
  exact?: boolean;
};
