// Markdown is rendered at article URLs, so resolve archived document links at
// build time without changing or executing its original source body.
import { site } from './site.mjs';
export function projectLinks() {
  return (tree) => {
    function visit(node) {
      if (node.type === 'raw') {
        node.value = node.value.replace(
          /(href|src)=(['"])(?:\.\.\/|\.\/)?assets\//g,
          `$1=$2${site.base}/assets/`,
        );
      }
      if (node.type === 'element') {
        for (const key of ['href', 'src']) {
          const value = node.properties?.[key];
          if (typeof value === 'string' && /^(?:\.\.\/|\.\/)?assets\//.test(value)) {
            node.properties[key] = site.base + '/' + value.replace(/^(\.\.\/|\.\/)/, '');
          }
        }
      }
      for (const child of node.children || []) visit(child);
    }
    visit(tree);
  };
}
