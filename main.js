// 내 혜택 캘린더 데스크탑 앱: web/index.html을 창에 띄우고, 업데이트를 확인한다.
const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const path = require('path');

const REPO = 'mmmmmjjjjj26-cmd/benefit-calendar'; // GitHub 저장소 만든 뒤 교체 (package.json의 publish도 같이)

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 860,
    minWidth: 380,
    minHeight: 560,
    title: '내 혜택 캘린더',
    backgroundColor: '#f6f5f4',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.loadFile(path.join(__dirname, 'web', 'index.html'));

  // 공고 원문 링크는 앱 안이 아니라 기본 브라우저로 연다
  const openOutside = (url) => {
    if (url.startsWith('https://')) shell.openExternal(url);
  };
  win.webContents.setWindowOpenHandler(({ url }) => { openOutside(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file://')) { e.preventDefault(); openOutside(url); }
  });
  return win;
}

// 업데이트: Windows는 자동 설치, Mac은 서명 없이는 자동 설치가 안 돼서 새 버전 안내만 한다
async function checkUpdates(win) {
  if (!app.isPackaged || REPO.startsWith('YOUR_ID')) return;
  if (process.platform === 'win32') {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    return;
  }
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`);
    if (!r.ok) return;
    const rel = await r.json();
    const latest = String(rel.tag_name || '').replace(/^v/, '');
    if (latest && isNewer(latest, app.getVersion())) {
      const { response } = await dialog.showMessageBox(win, {
        type: 'info',
        buttons: ['다운로드 페이지 열기', '나중에'],
        defaultId: 0,
        message: `새 버전 ${latest}이 나왔어`,
        detail: '다운로드 페이지에서 새 버전을 받아 기존 앱을 덮어쓰면 돼. 입력한 정보는 그대로 남아.',
      });
      if (response === 0) shell.openExternal(rel.html_url);
    }
  } catch { /* 오프라인이면 다음 실행 때 다시 확인 */ }
}
function isNewer(a, b) {
  const pa = a.split('.').map(Number), pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) { if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0); }
  return false;
}

app.whenReady().then(() => {
  if (process.platform !== 'darwin') Menu.setApplicationMenu(null);
  const win = createWindow();
  win.webContents.once('did-finish-load', () => setTimeout(() => checkUpdates(win), 3000));
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
