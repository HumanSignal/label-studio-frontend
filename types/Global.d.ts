import { ComponentClass, FC, FunctionComponent, ReactHTML, ReactSVG } from "react";

declare type AnyComponent = FC<any> | keyof ReactHTML | keyof ReactSVG | ComponentClass<unknown, unknown> | FunctionComponent<unknown> | string
