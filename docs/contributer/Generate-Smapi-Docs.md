# Generate Smapi Docs

Smapi documentation is auto generated.

Generate docs and save to a file with the following command:

```
node scripts/smapi-docs.js [template-name] > filepath
```
template-name - optional parameter. If not specified 'github' template is used.
All templates are located in  the 'lib/commands/smapi/docs-templates'. 

Examples:

```
node scripts/smapi-docs.js > docs/concepts/Smapi-Command.md
```

```
node scripts/smapi-docs.js doc-site > Smapi-Command-Doc-Site.md
```