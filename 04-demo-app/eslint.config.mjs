import tseslint from 'typescript-eslint';
export default tseslint.config(...tseslint.configs.recommended,{ignores:['.next/**','node_modules/**','src/data/site-data.json','lint-output.txt']});
