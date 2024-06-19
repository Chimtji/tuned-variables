# Tuned Variables

A <a href="https://www.figma.com">Figma</a> plugin for creating simple mathmatical expressions with local variables

<a href="https://www.figma.com/community/plugin/1382806347243306968/tuned-variables">Figma Community Link</a>

### 🔥 Features:

- Create values based on simple mathmatical expressions
- Use other variables as values for an expression
- Reference variables from other groups
- Reference variables from other collections

### 🚀 How to use:

1. In a variable, update its description with an expression like so: `{{ 2 + 2 }}`
2. In the menu bar, click on the plugin, and it will run through all your variables and update their values if an expression is set.
3. To use other variables as values reference them like so: `{{ $base * 2 }}`. This will take the value from the value with the name `base`
4. To use nested variables simply use their name: `{{ $Font/Size/base * 2}}`. This will take the value `base` from the group `Size` inside the group `Font`
5. To use variables from other collections prepend the variable name with the collection name. Example: If you have a collection called `primitives` then write it like so `$primitives/Font/Size/base` - this will get the variable `Font/Size/base` inside the `primitives` collection

### 🚧 Limitations:

- Only Number variables at the moment
- Modes are isolated, so you can't use a variable value from another mode.
- Only simple operators are supported: `*`, `/`, `+`, `-`

### 🎁 Contribute:

If you want to improve the plugin, then you are very welcome to create a PR

### 🤝 License:

This will stay forever free and you are welcome to use this in personal and business use.

### 💎 Need more advanced featues?

I don't have plans to make this plugin more advanced, so if you need more advanced features i would recommend you to check out the <a href="https://www.figma.com/community/plugin/1365339609215368041/dynamic-variables">Dynamic Variables</a> by <a href="https://www.figma.com/@neelts">@neelts</a>.
