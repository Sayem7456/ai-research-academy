import { getContentBySlug } from './src/lib/content.ts';
try {
  const result = await getContentBySlug('ml', 'ml-svm');
  console.log('OK, code length:', result.code.length);
} catch (e) {
  console.error('ERROR:', e.message);
  console.error(e.stack);
}
