import { motion } from "framer-motion";
import { useGameState } from './hooks/useGameState';
import { LandingPage } from './pages/LandingPage';
import { JoinRoomPage } from './pages/JoinRoomPage';
import { PickRolePage } from './pages/PickRolePage';
import { NameSetupPage } from './pages/NameSetupPage';
import { ConfigSetupPage } from './pages/ConfigSetupPage';
import { GamePage } from './pages/GamePage';
import { BASE_ROLES } from './utils/constants';
import { dbCheckUsername, dbRegisterUsername, getDeviceId } from './lib/supabase';

export default function MahjongApp() {
  const g = useGameState();

  const confirmHandlers = {
    onConfirm: () => { g.confirmConfig.onConfirm(); g.closeConfirm(); },
    onCancel: g.closeConfirm,
  };

  if (g.view === 'landing') return (
    <LandingPage
      loading={g.loading}
      confirmConfig={g.confirmConfig}
      settingsOpen={g.settingsOpen}
      tempName={g.tempName}
      defaultNameSetting={g.defaultNameSetting}
      vibrationEnabled={g.vibrationEnabled}
      onCreateRoom={g.handleCreateRoom}
      onJoinRoom={() => { g.hapticClick(); g.setView('joinRoom'); }}
      onSinglePlayer={() => { g.hapticClick(); g.setIsSinglePlayer(true); g.setView('pickRole'); }}
      onOpenSettings={() => { g.hapticClick(); g.setTempName(g.defaultNameSetting); g.setSettingsOpen(true); }}
      onCloseSettings={() => { g.hapticClick(); g.setSettingsOpen(false); }}
      onSaveSettings={() => {
        g.hapticClick();
        if (g.tempName !== g.defaultNameSetting) {
          g.triggerConfirm('確認修改預設名稱嗎？', async () => {
            const deviceId = getDeviceId();
            const isTaken = await dbCheckUsername(g.tempName, deviceId);
            if (isTaken) {
              // 名字被使用，不儲存（LandingPage 那邊已有錯誤顯示）
              return;
            }
            await dbRegisterUsername(g.tempName, deviceId);
            g.setDefaultNameSetting(g.tempName);
            g.setSettingsOpen(false);
          });
        } else {
          g.setSettingsOpen(false);
        }
      }}
      onTempNameChange={g.setTempName}
      onVibrationToggle={() => {
        const next = !g.vibrationEnabled;
        g.setVibrationEnabled(next);
        if (next && navigator.vibrate) navigator.vibrate(50);
      }}
      {...confirmHandlers}
    />
  );

  if (g.view === 'joinRoom') return (
    <JoinRoomPage
      joinInput={g.joinInput}
      joinError={g.joinError}
      loading={g.loading}
      confirmConfig={g.confirmConfig}
      onJoinInputChange={val => { g.setJoinInput(val); g.setJoinError(''); }}
      onJoinRoom={g.handleJoinRoom}
      onBack={() => { g.hapticClick(); g.setJoinError(''); g.setView('landing'); }}
      {...confirmHandlers}
    />
  );

  if (g.view === 'pickRole') return (
    <PickRolePage
      myRole={g.myRole}
      isSinglePlayer={g.isSinglePlayer}
      roomId={g.roomId}
      players={g.players}
      confirmConfig={g.confirmConfig}
      onSelectRole={g.handleSelectSeat}
      onConfirmRole={() => {
        g.hapticClick();
        g.setMyName(g.defaultNameSetting);
        g.setView('nameSetup');
      }}
      onBack={async () => {
        g.hapticClick();
        if (g.isSinglePlayer) { g.setView('landing'); return; }
        await g.handleBackFromSetup();
      }}
      {...confirmHandlers}
    />
  );

  if (g.view === 'nameSetup') return (
    <NameSetupPage
      myRole={g.myRole}
      myName={g.myName}
      isSinglePlayer={g.isSinglePlayer}
      customNames={g.customNames}
      confirmConfig={g.confirmConfig}
      onMyNameChange={g.setMyName}
      onOtherNameChange={(idx, val) => {
        const n = [...g.customNames];
        n[idx] = val;
        g.setCustomNames(n);
      }}
      onNext={() => {
        g.hapticClick();
        const n = [...g.customNames];
        n[g.myRole] = g.myName || BASE_ROLES[g.myRole];
        g.setCustomNames(n);
        g.setView('configSetup');
      }}
      onBack={() => { g.hapticClick(); g.setView('pickRole'); }}
      {...confirmHandlers}
    />
  );

  if (g.view === 'configSetup') {
    return (
      <ConfigSetupPage
        roomId={g.roomId}
        base={g.base}
        taiValue={g.taiValue}
        isSinglePlayer={g.isSinglePlayer}
        isJoiner={g.isJoiner}
        players={g.players}
        loading={g.loading}
        copied={g.copied}
        confirmConfig={g.confirmConfig}
        onBaseChange={g.setBase}
        onTaiChange={g.setTaiValue}
        onCopyRoomId={() => {
          g.hapticClick();
          navigator.clipboard?.writeText(g.roomId);
          g.setCopied(true);
          setTimeout(() => g.setCopied(false), 2000);
        }}
        onStart={() => {
          g.hapticClick();
          if (g.isSinglePlayer) {
            const n = [...g.customNames];
            n[g.myRole] = g.myName || BASE_ROLES[g.myRole];
            g.setCustomNames(n);
            g.setView('app');
          } else {
            if (g.isJoiner) {
              g.handleStartGame(true);
            } else {
              g.triggerConfirm(
                '確定開始遊戲嗎？',
                () => g.handleStartGame(false),
                <p className="text-xs text-red-500 font-bold">⚠️ 確認後進入遊戲將無法更改底台</p>
              );
            }
          }
        }}
        onBack={() => { g.hapticClick(); g.setView('nameSetup'); }}
        {...confirmHandlers}
      />
    );
  }

  return (
    <GamePage
      customNames={g.customNames}
      myRole={g.myRole}
      roomId={g.roomId}
      isSinglePlayer={g.isSinglePlayer}
      base={g.base}
      taiValue={g.taiValue}
      dealerIdx={g.dealerIdx}
      renZhuang={g.renZhuang}
      winnerIdx={g.winnerIdx}
      loserIdx={g.loserIdx}
      huTai={g.huTai}
      history={g.history}
      activeTab={g.activeTab}
      totalScores={g.totalScores}
      loserKing={g.loserKing}
      selfDrawKing={g.selfDrawKing}
      confirmConfig={g.confirmConfig}
      onDealerChange={g.handleDealerChange}
      onRenZhuangChange={g.handleRenZhuangChange}
      onWinnerChange={g.setWinnerIdx}
      onLoserChange={g.setLoserIdx}
      onHuTaiChange={g.setHuTai}
      onSaveRecord={g.saveRecord}
      onUndoLast={g.handleUndoLast}
      onReset={g.handleReset}
      onBackToHome={g.handleBackToHome}
      onTabChange={g.setActiveTab}
      hapticClick={g.hapticClick}
      hapticSlide={g.hapticSlide}
      triggerConfirm={g.triggerConfirm}
      {...confirmHandlers}
    />
  );
}
