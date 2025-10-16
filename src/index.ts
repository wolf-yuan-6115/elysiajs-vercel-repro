import { Elysia } from "elysia";
import superDuperString from "./subfolder/string";

export default new Elysia().get("/", () => "Hello Elysia").get("/subfolder", () => superDuperString);
