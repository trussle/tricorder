import * as promClient from "prom-client";
import * as express from "express";

// TODO: this shoudl be all of promClient
// not sure how to get that to work in a declaration file
export const client: any; 
export declare function instrument (server: express.Express): void;