import * as promClient from "prom-client";
import * as express from "express";

export const client: typeof promClient;
export declare function instrument (server: express.Express, options?): void;
