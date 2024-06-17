const calculateExpression = (expression: string): number | undefined => {
  try {
    if (!/^[0-9+\-*/\s.,]+$/.test(expression)) {
      console.error(
        "You are using invalid characters in your expressions. We only support: '+', '-', '*', '/', '.', ','"
      );
      throw new Error(
        "You are using invalid characters in your expressions. We only support: '+', '-', '*', '/', '.', ','"
      );
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
    } catch (error) {
      console.error("Error evaluating expression:", expression);
      throw new Error("Invalid mathematical expression");
    }
  } catch {
    console.error(
      "An error happened trying to calculate the expression:",
      expression
    );
    figma.closePlugin();
  }
  // Validate the expression to ensure it only contains digits, operators, and spaces
};

const GetAllVariables = async (): Promise<Variable[]> => {
  const localVariables = await figma.variables.getLocalVariablesAsync("FLOAT");
  return localVariables;
};

const UpdateVariable = (mode: string, value: number, variable: Variable) => {
  if (typeof value !== "number") {
    console.error("Couldn't convert the description expression to a number");
    return;
  }

  variable.setValueForMode(mode, value);
};

const FindReferencesInDescription = (description: string): string[] => {
  let match;
  const regex = /\$([a-zA-Z0-9_/-]+)/g;
  const matches = [];

  while ((match = regex.exec(description)) !== null) {
    matches.push("$" + match[1]);
  }

  return matches;
};

const ConvertDescriptionToExpression = (
  description: string,
  references: string[],
  variables: Variable[],
  variable: Variable,
  mode: string
): string => {
  let result = description.replace("{{", "").replace("}}", "");

  references.forEach((match) => {
    const referencedVariable = variables.find(
      (seeker) =>
        seeker.name === match.replace("$", "") &&
        seeker.variableCollectionId === variable.variableCollectionId
    );

    if (referencedVariable?.resolvedType === "FLOAT") {
      const referencedValue = referencedVariable?.valuesByMode[mode] as string;

      result = result.replace(match, referencedValue);
    } else {
      console.error(
        "You can only reference other number variables. The others won't work with expressions"
      );
    }
  });

  return result;
};

figma.on("run", async () => {
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
          const expression = ConvertDescriptionToExpression(
            description,
            references,
            variables,
            variable,
            mode
          );

          const calculatedValue = calculateExpression(expression);
          if (calculatedValue) {
            UpdateVariable(mode, calculatedValue, variable);
          }
        });
      });

      figma.closePlugin();
    });
  } catch {
    console.error("An Unexpected Error Happened");
    figma.closePlugin();
  }
});
