"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const calculateExpression = (expression) => {
    try {
        if (!/^[0-9+\-*/\s.,]+$/.test(expression)) {
            console.error("You are using invalid characters in your expressions. We only support: '+', '-', '*', '/', '.', ','");
            throw new Error("You are using invalid characters in your expressions. We only support: '+', '-', '*', '/', '.', ','");
        }
        // Remove any spaces from the expression
        expression = expression.replace(/\s+/g, "");
        // Evaluate the expression using the Function constructor
        // This approach is safer because the input is validated
        try {
            const result = new Function(`return ${expression}`)();
            if (typeof result !== "number" || isNaN(result)) {
                console.error("The expression is invalid:", expression);
                throw new Error("Invalid mathematical expression");
            }
            return result;
        }
        catch (error) {
            console.error("Error evaluating expression:", expression);
            throw new Error("Invalid mathematical expression");
        }
    }
    catch (_a) {
        console.error("An error happened trying to calculate the expression:", expression);
        figma.closePlugin();
    }
    // Validate the expression to ensure it only contains digits, operators, and spaces
};
const GetAllVariables = () => __awaiter(void 0, void 0, void 0, function* () {
    const localVariables = yield figma.variables.getLocalVariablesAsync("FLOAT");
    return localVariables;
});
const UpdateVariable = (mode, value, variable) => {
    if (typeof value !== "number") {
        console.error("Couldn't convert the description expression to a number");
        return;
    }
    variable.setValueForMode(mode, value);
};
const FindReferencesInDescription = (description) => {
    let match;
    const regex = /\$([a-zA-Z0-9_/-]+)/g;
    const matches = [];
    while ((match = regex.exec(description)) !== null) {
        matches.push("$" + match[1]);
    }
    return matches;
};
const ConvertDescriptionToExpression = (description, references, variables, variable, mode) => {
    let result = description.replace("{{", "").replace("}}", "");
    references.forEach((match) => {
        const referencedVariable = variables.find((seeker) => seeker.name === match.replace("$", "") &&
            seeker.variableCollectionId === variable.variableCollectionId);
        if ((referencedVariable === null || referencedVariable === void 0 ? void 0 : referencedVariable.resolvedType) === "FLOAT") {
            const referencedValue = referencedVariable === null || referencedVariable === void 0 ? void 0 : referencedVariable.valuesByMode[mode];
            result = result.replace(match, referencedValue);
        }
        else {
            console.error("You can only reference other number variables. The others won't work with expressions");
        }
    });
    return result;
};
figma.on("run", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        GetAllVariables().then((variables) => {
            variables.forEach((variable) => {
                const { description } = variable;
                if (!description.includes("{{")) {
                    // Variable is not dynamic, so we won't do magic
                    return;
                }
                const references = FindReferencesInDescription(description);
                Object.keys(variable.valuesByMode).forEach((mode) => {
                    const expression = ConvertDescriptionToExpression(description, references, variables, variable, mode);
                    const calculatedValue = calculateExpression(expression);
                    if (calculatedValue) {
                        UpdateVariable(mode, calculatedValue, variable);
                    }
                });
            });
            figma.closePlugin();
        });
    }
    catch (_a) {
        console.error("An Unexpected Error Happened");
        figma.closePlugin();
    }
}));
