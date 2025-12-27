import { execSync } from 'child_process';
import { existsSync } from 'fs';

const SWAGGER_PATH = 'swagger.json';
const OUTPUT_PATH = 'src/types/api.d.ts';

if (!existsSync(SWAGGER_PATH)) {
  console.error(`Error: ${SWAGGER_PATH} not found`);
  console.log(
    'Make sure to export swagger.json from Xano before running this script'
  );
  process.exit(1);
}

console.log('Generating API types from swagger.json...');
execSync(`npx openapi-typescript ${SWAGGER_PATH} -o ${OUTPUT_PATH}`, {
  stdio: 'inherit',
});
console.log(`Types generated successfully: ${OUTPUT_PATH}`);
