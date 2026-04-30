# RIT-SE-CODE-BANK

This monorepo hosts several projects and shared components. Most documentation can be found in the appropriate Google Drive folders/drives.

# Reading these docs

These docs are best read inside of Github, because links look better and images work, but if you want to read them in VSCode, you can get
an extension that can render markdown files as Github markdown files.

# High Level Documentation

High level documentation can be found in the shared [se-code-bank drive](https://drive.google.com/drive/u/1/folders/1eDbtGrgsCikuy221MIa72kXh0j31CQ5K)

It is reccomended that you read this [overview of how npm](https://docs.google.com/document/d/1zm7hI2R7Hz0tgCx5eHXF9r4FrxAF3QfVFQjCfUWRb9g/edit?tab=t.0#heading=h.rquxpzgjogju) is used in this monorepo, as it is notably different than single-project repos. 

### npm Warning

All projects need to be on React 19 until `npm i --install-strategy=linked` is fixed. Migrating to pnpm may also fix this. If a critical situation arises, you can use `npm i --install-strategy=nested` which should work. Remember to run `npm i` at the repository root.

# Directory

These links go to the README files for shared components and other projects. Even if it is not listed here, a README may still exist in the project folder.

[Workflows Ecosystem Documentation](./apps/workflow/ecosystem/README.md)
