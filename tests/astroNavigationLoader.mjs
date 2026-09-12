// Theme interaction tests mount the real palette. Only Astro's virtual
// navigation import is stubbed; accidentally navigating fails the test.
/** @type {import('node:module').ResolveHook} */
export function resolve(specifier, context, nextResolve) {
  if (specifier === 'astro:transitions/client') {
    return {
      url: 'data:text/javascript,' + encodeURIComponent('export function navigate() { throw new Error("Unexpected navigation in theme test"); }'),
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
