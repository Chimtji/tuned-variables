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
    // Validate the expression to ensure it only contains digits, operators, and spaces
    if (!/^[0-9+\-*/\s]+$/.test(expression)) {
        throw new Error("Invalid characters in the mathematical expression");
    }
    // Remove any spaces from the expression
    expression = expression.replace(/\s+/g, "");
    // Evaluate the expression using the Function constructor
    // This approach is safer because the input is validated
    try {
        const result = new Function(`return ${expression}`)();
        if (typeof result !== "number" || isNaN(result)) {
            throw new Error("Invalid mathematical expression");
        }
        return result;
    }
    catch (error) {
        console.error("Error evaluating expression:", error);
        throw new Error("Invalid mathematical expression");
    }
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
figma.on("run", () => __awaiter(void 0, void 0, void 0, function* () {
    GetAllVariables().then((variables) => {
        variables.forEach((variable) => {
            const { description } = variable;
            const firstMode = Object.keys(variable.valuesByMode)[0];
            // The variable is an expression
            if (description.includes("{{")) {
                const regex = /\{\{\s*(\$\w+)\s*\*\s*\d+\s*\}\}/g;
                let match;
                const matches = [];
                while ((match = regex.exec(description)) !== null) {
                    matches.push(match[1]);
                }
                let temporaryValue = variable.description
                    .replace("{{", "")
                    .replace("}}", "");
                matches.forEach((match) => {
                    const referencedVariable = variables.find((seeker) => seeker.name === match.replace("$", "") &&
                        seeker.variableCollectionId === variable.variableCollectionId);
                    if ((referencedVariable === null || referencedVariable === void 0 ? void 0 : referencedVariable.resolvedType) === "FLOAT") {
                        const referencedValue = referencedVariable === null || referencedVariable === void 0 ? void 0 : referencedVariable.valuesByMode[firstMode];
                        temporaryValue = temporaryValue.replace(match, referencedValue);
                    }
                    else {
                        console.error("You can only reference other number variables. The others won't work with expressions");
                    }
                });
                const calculatedValue = calculateExpression(temporaryValue);
                UpdateVariable(firstMode, calculatedValue, variable);
            }
        });
        // --- IMPORTANT ---
        // We need to close the plugin when done with our work
        // or else it will keep on spinning
        figma.closePlugin();
    });
}));
