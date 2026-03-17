import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const dev = process.env.ROLLUP_WATCH;

export default {
  input: 'src/juice-patrol-panel.js',
  output: {
    file: 'custom_components/juice_patrol/frontend/juice_patrol_panel.js',
    format: 'es',
    inlineDynamicImports: true,
  },
  plugins: [
    nodeResolve(),
    commonjs(),
    !dev && terser(),
  ].filter(Boolean),
};
