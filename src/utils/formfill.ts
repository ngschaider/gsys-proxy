export default "dummy";

// import { IncomingMessage, ServerResponse } from "http";
// import express from "express";

// export type Interceptor = (
//     buffer: Buffer, 
//     proxyRes: IncomingMessage, 
//     req: IncomingMessage, 
//     res: ServerResponse
// ) => Promise<Buffer|string>;

// export type FormFillStep = {
//     action: FormFillAction,
//     query: string;
//     queryIndex?: number;
//     value?: string;
//     delayBefore?: number;
//     delayAfter?: number;
// }

// export type FormFillAction = "setValue" | "click";

// export default (steps: FormFillStep[]): Interceptor => {
//     const inject = `
//         <script>
//             (async () => {
//                 ` + steps.map(getStepExpression).join("\n") + `
//             })();
//         </script>
//     `;

//     return async (responseBuffer, proxyRes, req, res) => {
//         let response = responseBuffer.toString();
//         response += inject;
//         return response;
//     };
// }

// const getStepExpression = (step: FormFillStep) => {
//     return `
//         ` + getDelayExpression(step.delayBefore) + `

//         ` + getStepExecutionExpression(step)  + `

//         ` + getDelayExpression(step.delayAfter) + `
//     `;
// }

// const getStepExecutionExpression = (step: FormFillStep): string => {
//     if(step.action === "setValue") {
//         if(!step.value) {
//             throw new Error("You must specify a value when using the setValue action");
//         }
//         return getElementQueryExpression(step) + ".value='" + step.value + "';";
//     } else if(step.action === "click") {
//         return getElementQueryExpression(step) + ".click()";
//     } else {
//         throw new Error("Unknown FormFillAction '" + step.action + "'");
//     }
// };

// const getElementQueryExpression = (step: FormFillStep): string => {
//     if(step.query.startsWith("#")) {
//         const id = step.query.substring(1);
//         return "document.getElementById('" + id + "')";
//     } else if(step.query.startsWith(".")) {
//         if(!step.queryIndex) {
//             throw new Error("queryIndex is required when querying using class names.");
//         }
//         const className = step.query.substring(1);
//         return "document.getElementByClassName('" + className + "')[" + step.queryIndex + "]";
//     } else {
//         if(!step.queryIndex) {
//             throw new Error("queryIndex is required when querying using tag name");
//         }
//         return "document.getElementByTagName('" + step.query + "')[" + step.queryIndex + "]";
//     }
// }


// const getDelayExpression = (delay: number|undefined): string => {
//     if(!delay) return "";
//     return "await new Promise(resolve => setTimeout(resolve, " + delay + "));";
// };