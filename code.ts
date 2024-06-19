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
  const result = await figma.variables.getLocalVariablesAsync("FLOAT");
  return result;
};
const GetAllCollections = async (): Promise<VariableCollection[]> => {
  const result = await figma.variables.getLocalVariableCollectionsAsync();
  return result;
};

const UpdateVariable = (
  modeIndex: number,
  value: number,
  variable: Variable
) => {
  if (typeof value !== "number") {
    console.error("Couldn't convert the description expression to a number");
    return;
  }

  const modeId = Object.keys(variable.valuesByMode)[modeIndex];

  variable.setValueForMode(modeId, value);
};

const FindAllReferences = (text: string): string[] => {
  let match;
  // Updated regex to allow spaces in the reference
  const regex = /\$([a-zA-Z0-9_/\- ]+)/g;
  const matches: string[] = [];

  while ((match = regex.exec(text)) !== null) {
    matches.push("$" + match[1].trim());
  }

  return matches;
};

const GetVariableValue = (
  id: string,
  variables: Variable[],
  modeIndex: number
): string => {
  const match = variables.find((variable) => variable.id === id);

  if (!match) {
    console.error("Couldn't find referenced variable value");
    return "";
  }

  const modeId = Object.keys(match?.valuesByMode)[modeIndex];

  if (typeof match?.valuesByMode[modeId] !== "object") {
    return match?.valuesByMode[modeId] as string;
  }

  return GetVariableValue(
    (match.valuesByMode[modeId] as VariableAlias).id,
    variables,
    modeIndex
  );
};

const isReferenceFromAnotherCollection = (
  name: string,
  collections: VariableCollection[]
): { result: boolean; collection?: VariableCollection } => {
  if (name.includes("/")) {
    const match = collections.find(
      (collection) => collection.name === name.split("/")[0]
    );
    if (match) {
      return { result: true, collection: match };
    } else {
      return { result: false };
    }
  } else {
    return { result: false };
  }
};

const ConvertDescriptionToExpression = (
  description: string,
  references: string[],
  variables: Variable[],
  variable: Variable,
  modeIndex: number,
  collections: VariableCollection[]
): string => {
  let result = description.replace("{{", "").replace("}}", "");

  references.forEach((reference) => {
    let collection = variable.variableCollectionId;
    let match = reference.replace("$", "");

    const fromAnotherCollection = isReferenceFromAnotherCollection(
      match,
      collections
    );

    if (fromAnotherCollection.result) {
      collection = fromAnotherCollection.collection?.id as string;
      match = reference.replace(
        `$${fromAnotherCollection.collection?.name}/`,
        ""
      );
    }

    const referencedVariable = variables.find(
      (test) => test.name === match && test.variableCollectionId === collection
    );

    if (referencedVariable?.resolvedType === "FLOAT") {
      let referencedValue = GetVariableValue(
        referencedVariable.id,
        variables,
        modeIndex
      );

      if (fromAnotherCollection.result) {
        result = result.replace(
          `$${fromAnotherCollection.collection?.name}/` + match,
          referencedValue
        );
      } else {
        result = result.replace("$" + match, referencedValue);
      }
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
    const variables = await GetAllVariables();
    const collections = await GetAllCollections();

    variables.forEach((variable) => {
      const { description } = variable;

      // Variable is not dynamic, so we won't do magic
      if (!description.includes("{{")) {
        return;
      }

      const references = FindAllReferences(description);

      Object.keys(variable.valuesByMode).forEach((id, index) => {
        const expression = ConvertDescriptionToExpression(
          description,
          references,
          variables,
          variable,
          index,
          collections
        );

        const calculatedValue = calculateExpression(expression);
        if (calculatedValue) {
          UpdateVariable(index, calculatedValue, variable);
        }
      });
    });

    figma.closePlugin();
  } catch (error) {
    console.error(
      "An Unexpected Error Happened. This is most likely a problem in the plugin",
      error
    );
    figma.closePlugin();
  }
});
