// Mac 앱 전체에 임시 서명(ad-hoc)을 넣는다. 개발자 인증서가 없어도 Apple 실리콘에서 실행되게 하려는 것.
const { execFileSync } = require('child_process');
exports.default = async (ctx) => {
  if (ctx.electronPlatformName !== 'darwin') return;
  const app = `${ctx.appOutDir}/${ctx.packager.appInfo.productFilename}.app`;
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
};
