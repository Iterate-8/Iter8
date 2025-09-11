import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const root = process.cwd();
    const pkgPath = path.join(root, 'package.json');
    const tsconfigPath = path.join(root, 'tsconfig.json');
    const tailwindConfig1 = path.join(root, 'tailwind.config.js');
    const tailwindConfig2 = path.join(root, 'tailwind.config.cjs');
    const tailwindConfig3 = path.join(root, 'tailwind.config.ts');

    let pkg: any = {};
    if (fs.existsSync(pkgPath)) {
      pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    }

    const deps = { ...pkg.dependencies, ...pkg.devDependencies } || {};
    const hasNext = typeof deps['next'] !== 'undefined';
    const nextVersion = hasNext ? String(deps['next']) : null;
    const hasReact = typeof deps['react'] !== 'undefined';
    const hasTypeScript = fs.existsSync(tsconfigPath) || typeof deps['typescript'] !== 'undefined';
    const hasTailwind = typeof deps['tailwindcss'] !== 'undefined' || fs.existsSync(tailwindConfig1) || fs.existsSync(tailwindConfig2) || fs.existsSync(tailwindConfig3);
    const tailwindVersion = typeof deps['tailwindcss'] !== 'undefined' ? String(deps['tailwindcss']) : null;
    const hasSupabase = typeof deps['@supabase/supabase-js'] !== 'undefined';

    return NextResponse.json({
      hasNext,
      nextVersion,
      hasReact,
      hasTypeScript,
      hasTailwind,
      tailwindVersion,
      hasSupabase
    });
  } catch (e) {
    return NextResponse.json({ error: 'STACK_DETECTION_FAILED' }, { status: 200 });
  }
}


