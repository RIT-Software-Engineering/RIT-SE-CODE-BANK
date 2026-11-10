Back to [SE-CODE-BANK Overview](../../../README.md)

# Workflows Ecosystem Overview

The Workflows Ecosystem is a package of systems that aim to aid the integration of Workflows into projects. It's main parts are the builder, context, and component systems, which create, process, and render your workflows, respectively.

For a recipe on project integration, see [this guide](./docs/ecosystem-integration-recipe.md).

For information on the builder, see [here](./docs/builder.md).

For information on the technical details of the component system, see [this guide](./docs/visual-abstraction/visual-abstraction.md).

If you are looking to edit the components package, see this [maintainers guide](./docs/components-maintenance.md)

# Using this package

To install the package, check the package documentation in the se-code-bank Google Drive. When importing things from this package, keep this distinction in mind:
- The root path ("@se-code-bank/ecosystem") is for mostly backend-focused things
- The "components" path ("@se-code-bank/ecosystem/components") is foor mostly frontend-focused things

Auto importing should help you here, but this is just in case.

## Importing Types

Importing types can be annoying or ugly. If you try to auto-import a type, you'll likely find it adds an ugly inline `import("../../../long/file/path").Symbol`. But, its not all that bad. If you copy-paste the file path into a block comment at the top of the file like this:

```jsx
/**
 * @import { } from "../../../long/file/path"
 */
```

Then, you go back to the unimported symbol and auto-import again, it will now update the block comment import statement! Yay! If it still doesn't, then press `ctrl` + `.` on the unimported symbol, and select the code action that says "update import" or something like that.

Alternatively, never import types! But sometimes they are quite helpful. You can also copy-paste types from projects that already use them, like CMT.

# Typescript

This package leverages Typescript type checking heavily, and you would likely benefit from it a lot too. When looking at the source code of this package, Typescript should work. This is because there is a tsconfig.json in the root. But if your project is missing this, then when you go to integrate this into your project, you will be missing autocomplete + red squiggly lines.

A quick copy-paste into your project's root should work. If this introduces too many squiggly red lines, consider turning `checkJs` to false while not working with these packages and set it to true while you are.

# Example Server

It's pretty crummy but there is a small dev server that should spin up when you run `npm run example` in this directory. It will show you an example workflow being rendered. It might be useful if you want to customize your renderers, but don't yet have the rest of the workflows pipeline set up yet.