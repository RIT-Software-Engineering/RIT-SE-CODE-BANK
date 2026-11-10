Back to [Ecosystem Overview](../../README.md)

# Visual Abstraction Overview

Shared frontend components are great for factoring out shared logic but often are very coupled to the visuals. In order to "flavor" these components, they must be visually abstracted in some way. While there are several ways to do this (See [Design Considerations](#design-considerations)), the method listed here seems to be the most powerful and is worthwhile, if complex.

# The Recipe

The recipe can be succinctly described as follows:

1. Identify branch points and arrays in your rendering logic.
2. Parameterize everything from the top down to those branch points/arrays. 
    - Whatever remains after parameterization is your renderer. Everything else is your logic component.
3. Make each branch of a branch point or element of an array a new component.
4. Repeat 1-4 With those components.

## Examples

Examples are great, and probably show intent better. For more examples than just this, look at the Workflows Components system.

[Example 1](./example1.md) shows a simple and kind of tedious example with very few, if none, substantial branch points. It's basically just parameterization.

[Example 2](example2.md) walks though a complex example from the Workflows Components system.

# Design Considerations

## Typing

The type patterns used here can be thought of as cumbersome, but foolproof and therefore worthwhile. By seperating information and renderer props, I hope to have created a system that is at least observable and can be learned from. I believe it is open to improvements. Example 2 is a decent introduction to them, but the source code is also a great place to learn.

## Other patterns

The only other viable pattern that was considered was including CSS classes inside the shared component which would be referenced by the project's css file. 

At best, this is limiting as custom behavior is impossible. It also seems very tedious for a project that most likely has has it's own set of components and standards built up in components and non-css styling to then need to rewrite a ton of CSS classes. Also, this does not support multiple component libraries.