# FPES Frontend
The Frontend for the portal is a React.js application mainly using elements from the Material UI library. Another key library of the project is React Hook Form. This is the main way this portal handles form state and input validation.

## Material UI
A large portion of the elements for the current build of the website come from Material UI. This library was chosen for not only its layout elements, but its decent selection of easy to implement input components. While there has been some problems integrating them with React Hook Form, they have been fairly minor.

[Material UI Docs](https://mui.com/)

## React Hook Form
React Hook Form was choosen to reduce the strain of manually handling all of the state management and validation that would be required for all of the forms of the portal. Not only are these forms significantly longer than average, they are also dynamic in multiple places with users being able to add an indeterminant number of course sections and grants. Ultimately this made React Hook Form a logical choice for handling form state. React Hook Form was originally designed in mind with handling basic html input, however the library does provide additional components for managing Material UI components. See the <Controller> component in the React Hook Form Docs.

[React Hook Form Docs](https://react-hook-form.com/)

## Highlights Form Page
This page allows the Faculty Member to see all of their completed Highlights Forms as well as create a new one for that calender year.

### Create New Highlights Form
The Highlights Form is divided into multiple steps. Currently each step has its own designated component. The Highlights Form component is where the form information is stored using React Hook Form. The control for the form is passed down to each step component. 



# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
