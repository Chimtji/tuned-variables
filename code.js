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
    const result = yield figma.variables.getLocalVariablesAsync("FLOAT");
    return result;
});
const GetAllCollections = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield figma.variables.getLocalVariableCollectionsAsync();
    return result;
});
const UpdateVariable = (modeIndex, value, variable) => {
    if (typeof value !== "number") {
        console.error("Couldn't convert the description expression to a number");
        return;
    }
    const modeId = Object.keys(variable.valuesByMode)[modeIndex];
    variable.setValueForMode(modeId, value);
};
const FindAllReferences = (text) => {
    let match;
    // Updated regex to allow spaces in the reference
    const regex = /\$([a-zA-Z0-9_/\- ]+)/g;
    const matches = [];
    while ((match = regex.exec(text)) !== null) {
        matches.push("$" + match[1].trim());
    }
    return matches;
};
const GetVariableValue = (id, variables, modeIndex) => {
    const match = variables.find((variable) => variable.id === id);
    if (!match) {
        console.error("Couldn't find referenced variable value");
        return "";
    }
    const modeId = Object.keys(match === null || match === void 0 ? void 0 : match.valuesByMode)[modeIndex];
    if (typeof (match === null || match === void 0 ? void 0 : match.valuesByMode[modeId]) !== "object") {
        return match === null || match === void 0 ? void 0 : match.valuesByMode[modeId];
    }
    return GetVariableValue(match.valuesByMode[modeId].id, variables, modeIndex);
};
const isReferenceFromAnotherCollection = (name, collections) => {
    if (name.includes("/")) {
        const match = collections.find((collection) => collection.name === name.split("/")[0]);
        if (match) {
            return { result: true, collection: match };
        }
        else {
            return { result: false };
        }
    }
    else {
        return { result: false };
    }
};
const ConvertDescriptionToExpression = (description, references, variables, variable, modeIndex, collections) => {
    let result = description.replace("{{", "").replace("}}", "");
    references.forEach((reference) => {
        var _a, _b, _c;
        let collection = variable.variableCollectionId;
        let match = reference.replace("$", "");
        const fromAnotherCollection = isReferenceFromAnotherCollection(match, collections);
        if (fromAnotherCollection.result) {
            collection = (_a = fromAnotherCollection.collection) === null || _a === void 0 ? void 0 : _a.id;
            match = reference.replace(`$${(_b = fromAnotherCollection.collection) === null || _b === void 0 ? void 0 : _b.name}/`, "");
        }
        const referencedVariable = variables.find((test) => test.name === match && test.variableCollectionId === collection);
        if ((referencedVariable === null || referencedVariable === void 0 ? void 0 : referencedVariable.resolvedType) === "FLOAT") {
            let referencedValue = GetVariableValue(referencedVariable.id, variables, modeIndex);
            if (fromAnotherCollection.result) {
                result = result.replace(`$${(_c = fromAnotherCollection.collection) === null || _c === void 0 ? void 0 : _c.name}/` + match, referencedValue);
            }
            else {
                result = result.replace("$" + match, referencedValue);
            }
        }
        else {
            console.error("You can only reference other number variables. The others won't work with expressions");
        }
    });
    return result;
};
figma.on("run", () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const variables = yield GetAllVariables();
        const collections = yield GetAllCollections();
        variables.forEach((variable) => {
            const { description } = variable;
            // Variable is not dynamic, so we won't do magic
            if (!description.includes("{{")) {
                return;
            }
            const references = FindAllReferences(description);
            Object.keys(variable.valuesByMode).forEach((id, index) => {
                const expression = ConvertDescriptionToExpression(description, references, variables, variable, index, collections);
                const calculatedValue = calculateExpression(expression);
                if (calculatedValue) {
                    UpdateVariable(index, calculatedValue, variable);
                }
            });
        });
        figma.closePlugin();
    }
    catch (error) {
        console.error("An Unexpected Error Happened. This is most likely a problem in the plugin", error);
        figma.closePlugin();
    }
}));
