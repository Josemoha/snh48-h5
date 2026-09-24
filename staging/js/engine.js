/* ============================================================================
   engine.js — 游戏引擎（状态 / 行动 / 月度结算 / 主线判定 / 存档）
   ----------------------------------------------------------------------------
   《塞纳河打工人生》核心循环：
     月初 monthStart()  →  行动×3（doAction / pickCity）  →  月末 endMonth()
       →  UI 依次播放 endMonth 返回的 steps（结算表 / 事件 / 大事件结果）
       →  advanceMonth() 进入下一个月
   引擎不直接操作 DOM；它只改状态并产出「步骤(steps)」描述，由 ui.js 播放。
   ----------------------------------------------------------------------------
   数值口径（0-100 的资源）：
     money  资金（万）        heat   热度（口碑/话题）
     morale 全团士气          train  训练度（影响公演收入与大赏评分）
     burden 叶盛的负担（过高触发负面事件，走访/值班可降低）
   主线三条：
     ① 分团筹备 branch.stage 1→5（会谈→选址→剧场→招商→招募），4月20日判定官宣
     ② 年度活动：7月总选举（gePlan 影响战绩）/ 12月金曲大赏（rtPlan 影响评分）
     ③ 成员沟通：bond 羁绊体系，同时决定叶盛负担的消长
============================================================================ */

"use strict";

const Game = {

  SAVE_KEY: "snh48_h5_save_v1",
  BACKUP_KEY: "snh48_h5_save_bak",   // 双 key 互备（主档被单独清理时兜底）
  SAVE_VERSION: 1,

  /* ============================ 新开局 ============================ */

  newGame(playerName, styleId, era) {
    era = era || "2016";
    const is26 = era === "2026";
    /* 2026 线初始盘面：营业额大不如前 → 资金薄、士气低、负担重 */
    const st = {
      saveVersion: this.SAVE_VERSION,
      playerName: playerName || "总监",
      era: era,
      month: 1,
      ap: 3,
      money: is26 ? 380 : 600,
      heat: is26 ? 30 : 35,
      morale: is26 ? 62 : 72,
      train: is26 ? 32 : 30,
      burden: is26 ? 65 : 55,
      debt: 0,                       // 连续/累计赤字次数（≥2 触发破产结局）
      branch: { stage: 0, city: null, announce: false, announceMonth: 0 },   // 2016：分团筹备
      cgt: { stage: 0, open: false, openMonth: 0, closed: false, settled: 0, settleDone: false },  // 2026：CGT48 重建（或解散安置，见序章 cgtPath）
      elim: { executed: 0, defied: 0, transferred: 0, warned: false },       // 2026：末位淘汰（executed 执行 / defied 缓刑 / transferred 调往CGT）
      rtCancelled: false,                                                    // 2026：营业不佳 → 金曲大赏取消
      gePlan: 0, geStrategy: null, geDone: false, geResult: null,
      rtPlan: 0, rtDone: false, rtScore: 0,
      members: [],                   // 运行时成员卡（见 buildRoster）
      log: [],                       // {month, text, tone}
      flags: {},                     // 剧情旗标（免费宣传等）
      decisions: {},                 // 【决策标签】剧情选项的登记表（tag→value），供后续剧情与 2026 线回收
    };
    this.st = st;

    // 初始化成员卡（深拷贝 DATA / DATA2026，绑定羁绊 bond）
    this.buildRoster(st);
    const baseBond = is26 ? 15 : 20;   // 2026 新总监初来乍到，羁绊更低
    for (const id in st.members) st.members[id].bond = baseBond;

    // 序章风格加成（styleId 也可为空，序章播完后由 applyStyle 补加）
    if (styleId) this.applyStyle(styleId);

    this.addLog(st, 1, is26
      ? "你正式出任 SNH48 制作总监。陶总的首份文件已经送达——四条主线，无一轻松。"
      : "你正式出任 SNH48 制作总监，三条主线任务摆在桌上。", "main");
    return st;
  },

  /* 序章选择的管理风格 → 初始加成（在序章播放中途调用；按 era 取对应序章配置） */
  applyStyle(styleId) {
    const st = this.st;
    const pro = st.era === "2026" ? STORY.prologue26 : STORY.prologue;
    const style = pro.styles.find(s => s.id === styleId);
    if (style) { style.apply(st); st.startStyle = styleId; }
  },

  /* 成员卡结构：{ id, name, team, gen, pop, bond, status: 'active'|'left'|'rest'|'branch',
                   branchTeam?, branchLabel?（2026 分团成员的完整队伍标注） } */
  buildRoster(st) {
    if (st.era === "2026") {
      /* 2026：本部各队完整建卡；分团成员为简卡（status='branch'，无人气/羁绊，
         仅在成员页对应分团标签页展示「姓名+队伍」） */
      st.members = DATA2026.members.map(m => m.team === "branch"
        ? {
            id: m.id, name: m.name, team: m.branchTeam, gen: m.gen,
            pop: 0, bond: 0, status: "branch", branchTeam: m.branchTeam, branchLabel: m.branchLabel || "",
          }
        : {
            id: m.id, name: m.name, team: m.team, gen: m.gen,
            pop: m.pop, bond: 15, status: "active",
            captain: !!m.captain, vice: !!m.vice,
          });
      return;
    }
    st.members = DATA.members.map(m => ({
      id: m.id, name: m.name, team: m.team, gen: m.gen,
      pop: m.pop, bond: 20, status: "active",
      captain: !!m.captain, vice: !!m.vice,
    }));
  },

  /* ============================ 存档 ============================ */

  save() {
    try {
      const raw = JSON.stringify(this.st);
      localStorage.setItem(this.SAVE_KEY, raw);
      /* 双 key 互备：主档被单独清理时可从备份恢复 */
      try { localStorage.setItem(this.BACKUP_KEY, raw); } catch (e2) {}
      return true;
    } catch (e) { console.error("存档失败", e); return false; }
  },

  /* 内部：字段兜底（读主档/备份档共用） */
  _normalize(st) {
    if (!st.decisions) st.decisions = {};
    if (!st.camp26) st.camp26 = { tao: 0, wang: 0 };
    if (!st.era) st.era = "2016";
    if (!st.cgt) st.cgt = { stage: 0, open: false, openMonth: 0, closed: false, settled: 0, settleDone: false };
    if (st.cgt.closed === undefined) st.cgt.closed = false;
    if (st.cgt.settled === undefined) st.cgt.settled = 0;
    if (st.cgt.settleDone === undefined) st.cgt.settleDone = false;
    if (!st.elim) st.elim = { executed: 0, defied: 0, transferred: 0, warned: false };
    if (st.rtCancelled === undefined) st.rtCancelled = false;
    return st;
  },

  load() {
    try {
      let raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) raw = localStorage.getItem(this.BACKUP_KEY);   // 主档缺失/被清 → 备份恢复
      if (!raw) return null;
      const st = JSON.parse(raw);
      if (st.saveVersion !== this.SAVE_VERSION) return null;
      this.st = this._normalize(st);
      return this.st;
    } catch (e) { console.error("读档失败", e); return null; }
  },

  /* 【存档码】把当前存档导出为可复制的文本（base64），用于跨目录/跨浏览器/换机恢复。
     file:// 下 localStorage 按「文件完整路径」隔离（部分浏览器如 360 尤其严格），
     压缩包内直接双击还会每次解压到随机临时目录——存档码是纯前端唯一可靠的兜底。 */
  exportCode() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY) || localStorage.getItem(this.BACKUP_KEY);
      if (!raw) return null;
      return "SG48V1." + btoa(unescape(encodeURIComponent(raw)));
    } catch (e) { console.error("导出存档码失败", e); return null; }
  },

  importCode(code) {
    try {
      if (!code || code.indexOf("SG48V1.") !== 0) return { ok: false, msg: "存档码格式不正确（应以 SG48V1. 开头）。" };
      const raw = decodeURIComponent(escape(atob(code.slice(7).trim())));
      return this.importSaveText(raw, "存档码导入成功");
    } catch (e) { return { ok: false, msg: "存档码无法解析（可能复制不完整）。" }; }
  },

  /* 【存档文件】实测 360 浏览器以「本地文件」方式打开时，关闭后 localStorage 不保留
     （同路径也不保留，刷新仅会话内有效）——浏览器安全策略，代码无法强制持久化。
     因此提供「保存进度到文件 / 从文件恢复」：下载 .sg48save 文件 + FileReader 读回，
     file:// 下完全可用，与存档码并列双保险。 */
  exportSaveFile() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY) || localStorage.getItem(this.BACKUP_KEY);
      if (!raw) return null;
      const st = JSON.parse(raw);
      const name = "塞纳河打工人生_存档_" + st.era + "年" + st.month + "月.sg48save";
      return { name: name, text: raw };
    } catch (e) { return null; }
  },

  importSaveText(text, okPrefix) {
    try {
      const st = JSON.parse(text);
      if (st.saveVersion !== this.SAVE_VERSION) return { ok: false, msg: "存档文件版本与当前游戏不匹配。" };
      localStorage.setItem(this.SAVE_KEY, text);
      try { localStorage.setItem(this.BACKUP_KEY, text); } catch (e2) {}
      this.st = this._normalize(st);
      return { ok: true, msg: (okPrefix || "进度已从文件恢复") + "：" + st.era + "线 · " + st.year + "年" + st.month + "月。", st: this.st };
    } catch (e) { return { ok: false, msg: "存档文件无法解析（可能选错了文件）。" }; }
  },

  hasSave() { return !!localStorage.getItem(this.SAVE_KEY); },
  clearSave() { localStorage.removeItem(this.SAVE_KEY); },

  /* ============================ 工具 ============================ */

  clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); },
  rnd(lo, hi) { return lo + Math.floor(Math.random() * (hi - lo + 1)); },

  activeMembers(st) { return st.members.filter(m => m.status === "active"); },

  /* 复刻路线判定（跨洋会议选「完全照搬日本模式」）；旧档兼容 st.jpMode 直存字段 */
  isReplicate(st) {
    st = st || this.st;
    return ((st.decisions && st.decisions.jpMode) || st.jpMode) === "replicate";
  },

  /* 【2017 分团线伏笔】开拓者点将（下一站兼任 SHY48/CKG48 后触发）：
     六名现役成员明年随总监移籍。
     规则：BEJ48/GNZ48 成员（status='branch'）无影响；
          本部成员 pop<60 视作新机会（羁绊+2）；
          本部成员 pop≥60（高人气）不满——羁绊-15，按人气档位有概率提出离团
          （≥85:35% / ≥70:22% / ≥60:12%），离团者不计入开拓者名单。
     名单登记：decisions.pioneerList（成功）/ pioneerRefused（离团）。 */
  pioneerPick(ids) {
    const st = this.st;
    const picked = (ids || []).map(id => st.members.find(m => m.id === id)).filter(Boolean);
    if (picked.length !== 6) return { text: "名单无效（需选择六名成员）" };
    const joined = [], refused = [];
    let moraleHit = 0;
    for (const m of picked) {
      if (m.status === "branch") { joined.push(m.name); continue; }   // 分团成员：无影响
      if (m.pop >= 60) {
        m.bond = this.clamp(m.bond - 15, 0, 100);
        const chance = m.pop >= 85 ? 0.35 : m.pop >= 70 ? 0.22 : 0.12;
        if (Math.random() < chance) {
          m.status = "left";
          refused.push(m.name);
          moraleHit++;
          this.addLog(st, st.month, m.name + "（人气" + m.pop + "）得知移籍名单后提出离团，经挽留无效。（羁绊-15）", "bad");
        } else {
          joined.push(m.name);
          this.addLog(st, st.month, m.name + "（人气" + m.pop + "）对移籍名单颇有微词，最终选择同行。（羁绊-15）", "normal");
        }
      } else {
        m.bond = this.clamp(m.bond + 2, 0, 100);
        joined.push(m.name);
      }
    }
    if (moraleHit) st.morale = this.clamp(st.morale - 3 * moraleHit, 0, 100);
    this.recordDecision("pioneerList", joined);
    this.recordDecision("pioneerRefused", refused);
    this.addLog(st, st.month, "开拓者名单公布（" + st.decisions.branchPost + "）：" + joined.join("、") + (refused.length ? "。" + refused.join("、") + "最终未能同行。" : "。六人整装，一月出发。"), "main");
    this.save();
    const head = refused.length
      ? "名单公布的那一刻，后台安静了几秒——" + refused.join("、") + "红着眼提出离团，谁也没能留下她。\n\n"
      : "";
    return { text: head + "开拓者六人（" + joined.join("、") + "）：明年一月，随你一起去" + (st.decisions.branchPost === "SHY48" ? "沈阳" : "重庆") + "打头阵。" +
      (refused.length ? "（全团士气-" + 3 * moraleHit + "）" : "") };
  },

  /* 复刻路线限定：宫泽佐江毕业公演赴日名单（Team SII 五人点将）。
     生效：五人羁绊+10 人气+3；名单记入 decisions.miyazawaInvite 供后续剧情回收。 */
  miyazawaInvite(ids) {
    const st = this.st;
    const picked = (ids || [])
      .map(id => st.members.find(m => m.id === id))
      .filter(m => m && m.status === "active" && m.team === "SII");
    if (picked.length !== 5) return { text: "名单无效（需 Team SII 在籍成员五人）" };
    const names = picked.map(m => m.name);
    for (const m of picked) {
      m.bond = this.clamp(m.bond + 10, 0, 100);
      m.pop = this.clamp(m.pop + 3, 0, 100);
    }
    this.recordDecision("miyazawaInvite", names);
    this.addLog(st, st.month, "赴日名单公布：" + names.join("、") + " ——随宫泽佐江赴东京参加毕业公演。（羁绊+10 人气+3）", "main");
    this.save();
    return { text: "东京的镜头对准了她们：" + names.join("、") + "。毕业公演的合唱环节，两队人马唱的是同一首歌。（五人羁绊+10 人气+3）" };
  },

  /* 【决策标签登记】剧情选项带 tag/value 时调用（UI 在选项生效时触发）。
     decisions 表是「玩家改写故事」的锚点：后续剧情与 2026 线按它分叉。
     例：jpMode（跨洋会议运营模式）、akbSplit（6月对AKS声明的回应）。
     另：命中 STORY.camp26Map 的选项会计入 2026 线「理念阵营」计数
     （st.camp26 = { tao, wang }），12月年末盘点结算 camp26Final。 */
  recordDecision(tag, value) {
    const st = this.st;
    if (!tag) return;
    st.decisions = st.decisions || {};
    st.decisions[tag] = value;
    const map = (typeof STORY !== "undefined" && STORY.camp26Map) ? STORY.camp26Map[tag] : null;
    if (map && map[value] !== undefined) {
      st.camp26 = st.camp26 || { tao: 0, wang: 0 };
      st.camp26[map[value]] += 1;
    }
    this.save();
  },

  addLog(st, month, text, tone) {
    if (!text) return;                       // 空文本（如待弹窗的中转结果）不入日志
    st.log.unshift({ month, text, tone: tone || "normal" });
    if (st.log.length > 120) st.log.pop();
  },

  /* 文本模板：{name} → 玩家名 */
  fmt(text, extra) {
    let out = text.replace(/\{name\}/g, this.st.playerName);
    if (extra) for (const k in extra) out = out.replace(new RegExp("\\{" + k + "\\}", "g"), extra[k]);
    return out;
  },

  /* ============================ 月初 ============================ */

  /* 返回需要 UI 播放的步骤（告别小剧场等），随后玩家开始行动。
     幂等：同一月份只处理一次（flags.monthStarted 记录），
     这样「月初处理后中途退出」的存档重进时不会重复入/离团。 */
  monthStart() {
    const st = this.st;
    if (st.month > 12) return [];
    if (st.flags.monthStarted === st.month) return [];
    st.flags.monthStarted = st.month;

    const steps = [];
    st.ap = 3;

    // ① 新成员入队（2016：六期生3月 / 七期生9、10月；2026：二十四期生5月）
    const joinSrc = st.era === "2016" ? DATA.joining2016 : DATA2026.joining2026;
    for (const j of joinSrc) {
      if (j.month === st.month) {
        st.members.push({
          id: "j" + j.name, name: j.name, team: j.team, gen: j.gen,
          pop: st.era === "2016" ? this.rnd(16, 30) : this.rnd(8, 14),
          bond: st.era === "2016" ? 15 : 8, status: "active",
          note: j.note,
        });
        this.addLog(st, st.month, "新成员入队：" + j.name + "（" + j.team + " · " + j.gen + "）", "good");
      }
    }

    // ② 离团/移籍生效（2016 线专用；2026 线的人员退出走末位淘汰事件）
    //    移籍分团（type 以「移籍」开头）→ status='branch'，进 BEJ48/GNZ48 标签页而非已离团
    for (const lv of (st.era === "2016" ? DATA.leaving2016 : [])) {
      if (lv.month !== st.month) continue;
      /* 复刻路线：与日方关系良好，铃木玛莉亚的兼任延续至明年（不退团） */
      if (lv.name === "铃木玛莉亚" && this.isReplicate(st)) {
        this.addLog(st, st.month, "AKB48方面确认：铃木玛莉亚的兼任将延续到明年。", "good");
        continue;
      }
      /* 赵嘉敏：6月「学业与舞台」已选 解约/学业暂休 → 本处不再处理（史实暂休路线仍走原时间线） */
      if (lv.name === "赵嘉敏" && st.decisions && st.decisions.zhaoMin && st.decisions.zhaoMin !== "rest") continue;
      const m = st.members.find(x => x.name === lv.name);
      if (m) {
        if (lv.type.indexOf("移籍") === 0) { m.status = "branch"; m.branchTeam = lv.branchTeam || "BEJ48"; }
        else m.status = lv.type === "暂休" ? "rest" : "left";
      }
      this.addLog(st, st.month, lv.name + " " + lv.type + (lv.type.indexOf("移籍") === 0 ? "——成为分团创始成员" : "（" + lv.team + "）"), lv.type.indexOf("移籍") === 0 ? "main" : "bad");
      if (lv.story && !STORY.farewell.skip.includes(lv.name)) {
        steps.push({ type: "vn", title: "告别", pages: STORY.farewell.pages(lv) });
      }
    }

    // ③ 分团成立后的固定月收益提示（2016 线，5月起在结算体现，这里只提示首月）
    if (st.era === "2016" && st.branch.announce && st.month === st.branch.announceMonth + 1) {
      this.addLog(st, st.month, "分团进入稳定运营期，每月为总账带来 35 万收入。", "gold");
    }
    return steps;
  },

  /* ============================ 行动定义 ============================ */

  /* 返回本月可用行动（含可用性检查），UI 据此渲染按钮 */
  listActions() {
    const st = this.st;

    /* ============ 2026 线：行动①为「推进CGT48重建」或「安置CGT48前成员」（解散路线） ============ */
    if (st.era === "2026") {
      if (st.cgt.closed) {
        return [
          { id: "settle", main: true, name: "安置CGT48前成员", desc: (st.cgt.settled >= 3 ? "安置工作已全部完成，前成员们有了新的去处" : "第" + (st.cgt.settled + 1) + "批点将：名额 上海3 · 广州2 · 重庆2，其余协商离团 · 安置进度 " + st.cgt.settled + "/3"),
            disabled: st.cgt.settleDone },
          { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月总选前，筹备度+18）",
            disabled: st.month < 2 || st.month > 6 || st.geDone },
          { id: "rt", main: true, name: "筹备金曲大赏", desc: st.rtCancelled ? "金曲大赏已被取消" : "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
            disabled: st.rtCancelled || st.month < 10 || st.month > 12 || st.rtDone },
          { id: "visit", main: true, name: "走访成员", desc: "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
          { id: "duty", name: "替叶盛值班", desc: "接手一轮成员事务：叶盛负担-15" },
          { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
          { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
          { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万" },
          { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
        ];
      }
      const cgtDesc = {
        0: "赴成都与地方公司、前CGT48成员对接，接管重启手续",
        1: "面向全集团招募重建志愿者并举办选拔（需士气≥55）",
        2: "剧场翻新与设备更换（需资金≥180万，投入160万）",
        3: "首演彩排与出道曲打磨（需训练度≥50）",
        4: "重建就绪，静待重启首演",
      };
      const canCgtStage = () => {
        if (st.cgt.stage === 1) return st.morale >= 55;
        if (st.cgt.stage === 2) return st.money >= 180;
        if (st.cgt.stage === 3) return st.train >= 50;
        return true;
      };
      return [
        { id: "cgt", main: true, name: "推进CGT48重建", desc: cgtDesc[st.cgt.stage],
          disabled: st.cgt.stage >= 4 || !canCgtStage(),
          disabledTip: st.cgt.stage === 1 ? "士气不足（需≥55），先安抚人心" :
                       st.cgt.stage === 2 ? "资金不足（需≥180万）" :
                       st.cgt.stage === 3 ? "训练度不足（需≥50），先全团特训" : "" },
        { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月总选前，筹备度+18）",
          disabled: st.month < 2 || st.month > 6 || st.geDone },
        { id: "rt", main: true, name: "筹备金曲大赏", desc: st.rtCancelled ? "金曲大赏已被取消" : "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
          disabled: st.rtCancelled || st.month < 10 || st.month > 12 || st.rtDone },
        { id: "visit", main: true, name: "走访成员", desc: "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
        { id: "duty", name: "替叶盛值班", desc: "接手一轮成员事务：叶盛负担-15" },
        { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
        { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
        { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万" },
        { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
      ];
    }

    /* ============ 2016 线（原版行动） ============ */
    const branchDesc = {
      0: "与AKB48方经纪顾问山本学确认协作框架，分团企划正式启动",
      1: "奔赴候选城市实地考察，拍板分团落脚点",
      2: "剧场租赁与改造（需资金≥220万，投入200万）",
      3: "带着热度与口碑谈冠名赞助（需热度≥50）",
      4: "分团成员招募与出道集训（需士气≥55）",
      5: "筹备已全部完成，静待官宣" ,
    };
    const canBranchStage = () => {
      if (st.branch.stage === 2) return st.money >= 220;
      if (st.branch.stage === 3) return st.heat >= 50;
      if (st.branch.stage === 4) return st.morale >= 55;
      return true;
    };
    return [
      { id: "branch", main: true, name: "推进分团筹备", desc: branchDesc[st.branch.stage],
        disabled: st.branch.stage >= 5 || !canBranchStage(),
        disabledTip: st.branch.stage === 2 ? "资金不足（需≥220万）" :
                     st.branch.stage === 3 ? "热度不足（需≥50），先宣传造势/公演" :
                     st.branch.stage === 4 ? "士气不足（需≥55），多走访成员" : "" },
      { id: "ge", main: true, name: "筹备总选举", desc: "打投组织、物料与拉票（7月总选前，筹备度+18）",
        disabled: st.month < 2 || st.month > 6 || st.geDone },
      { id: "rt", main: true, name: "筹备金曲大赏", desc: "舞台编排与新歌打磨（12月大赏前，筹备度+20）",
        disabled: st.month < 10 || st.month > 12 || st.rtDone },
      { id: "visit", main: true, name: "走访成员", desc: "与一名成员谈心：羁绊↑ 士气↑ 叶盛负担↓" },
      { id: "duty", name: "替叶盛值班", desc: "接手一轮成员事务：叶盛负担-15" },
      { id: "show", name: "剧场公演", desc: "稳定票仓：资金↑ 热度↑ 士气↓" },
      { id: "business", name: "商务合作", desc: "接代言与商演：资金↑↑ 热度↓ 叶盛负担↑" },
      { id: "train", name: "全团特训", desc: "提升训练度（影响公演收入与大赏评分）：花费15万" },
      { id: "promo", name: "宣传造势", desc: "投放物料与线下活动：热度+10（花费20万）" },
    ];
  },

  /* 执行行动（payload 供 visit 使用）。返回 {text, tone} 给 UI 提示与记日志 */
  doAction(id, payload) {
    const st = this.st;
    if (st.ap <= 0) return null;
    let res = { text: "", tone: "normal" };

    switch (id) {
      case "branch": {
        // 引擎层门控（与按钮 disabled 双保险；不满足时不消耗行动点）
        const blocked = this.branchBlockReason();
        if (blocked) return { text: "分团筹备暂无法推进：" + blocked, tone: "blocked" };
        res = this.advanceBranch();
        break;
      }
      case "cgt": {
        const cgtBlocked = this.cgtBlockReason();
        if (cgtBlocked) return { text: "CGT48重建暂无法推进：" + cgtBlocked, tone: "blocked" };
        res = this.advanceCgt();
        break;
      }
      case "settle": {
        /* 解散路线：分批安置 CGT48 前成员（三批，每批名额 上海3/广州2/重庆2）。
           首批先播放「联络各总监」剧情，随后由 UI 弹出分批点将窗；实际落地在 settleBatch() */
        if (!st.cgt.closed) return { text: "CGT48 未解散，无需安置。", tone: "blocked" };
        if (st.cgt.settleDone) return { text: "安置工作已全部完成。", tone: "blocked" };
        const batch = this.settleBatchList();
        if (!batch.length) { st.cgt.settleDone = true; return { text: "安置工作已全部完成。", tone: "blocked" }; }
        const pick = { text: "", tone: "settlePick", batchList: batch.map(m => m.id) };
        if (st.cgt.settled === 0) pick.vn = STORY.settleIntro;   // 首批：先播联络总监剧情
        return pick;                                             // 直接返回（不消耗 AP，落地在 settleBatch）
      }
      case "ge": {
        if (st.month < 2 || st.month > 6 || st.geDone)
          return { text: "当前不在总选举筹备期（2-6月）。", tone: "blocked" };
        st.gePlan = this.clamp(st.gePlan + 18, 0, 100);
        st.money -= 25;
        res = { text: "总选举筹备推进：打投组、物料组就位。筹备度+18，资金-25万。", tone: "main" };
        break;
      }
      case "rt": {
        if (st.month < 10 || st.month > 12 || st.rtDone)
          return { text: "当前不在金曲大赏筹备期（10-12月）。", tone: "blocked" };
        st.rtPlan = this.clamp(st.rtPlan + 20, 0, 100);
        st.money -= 25;
        res = { text: "金曲大赏筹备推进：舞台与新歌编排加练。筹备度+20，资金-25万。", tone: "main" };
        break;
      }
      case "visit": {
        const m = st.members.find(x => x.id === payload.memberId);
        if (!m || m.status !== "active") return null;
        m.bond = this.clamp(m.bond + 12, 0, 100);
        st.morale = this.clamp(st.morale + 3, 0, 100);
        st.burden = this.clamp(st.burden - 8, 0, 100);
        const lines = [
          "你在排练间隙和{name}聊了很久，从舞蹈细节聊到家常。",
          "你去看了一眼{name}的公演，散场后在后台递上了一瓶水。",
          "你把{name}拉进茶水间，听她把最近的委屈倒了个干净。",
        ];
        res = { text: lines[this.rnd(0, lines.length - 1)].replace("{name}", m.name) + "（羁绊+12 士气+3 负担-8）", tone: "main" };
        /* 首次走访：播放该成员的小剧场（模板通用，避免对真实成员作性格演绎） */
        if (!m.visited) {
          m.visited = true;
          const tpl = STORY.visitScenes[m.name.split("").reduce((s, c) => s + c.charCodeAt(0), 0) % STORY.visitScenes.length];
          const sub = t => t.replace(/\{name\}/g, m.name);
          res.vn = { label: sub("与{name}的一次谈话"), pages: tpl.map(p => ({ ...p, t: sub(p.t) })) };
        }
        break;
      }
      case "duty": {
        st.burden = this.clamp(st.burden - 15, 0, 100);
        res = { text: "你把今天所有成员事务的签字权抢了过来，叶盛难得准点下了班。（负担-15）", tone: "normal" };
        break;
      }
      case "show": {
        const income = Math.round(45 + st.heat * 0.3 + st.train * 0.5);
        st.money += income;
        st.heat = this.clamp(st.heat + 4, 0, 100);
        st.morale = this.clamp(st.morale - 4, 0, 100);
        res = { text: "剧场公演满座，票房 +"+income+" 万，应援声浪持续到深夜。（热度+4 士气-4）", tone: "good" };
        break;
      }
      case "business": {
        const gain = Math.round(60 + st.heat * 0.8);
        st.money += gain;
        st.heat = this.clamp(st.heat - 2, 0, 100);
        st.burden = this.clamp(st.burden + 5, 0, 100);
        res = { text: "商务合作签约落定，进账 " + gain + " 万。（热度-2 叶盛负担+5）", tone: "good" };
        break;
      }
      case "train": {
        st.money -= 15;
        st.train = this.clamp(st.train + 12, 0, 100);
        st.morale = this.clamp(st.morale - 2, 0, 100);
        res = { text: "全团特训一天，整齐度提升明显。（训练度+12 资金-15 士气-2）", tone: "normal" };
        break;
      }
      case "promo": {
        st.money -= 20;
        st.heat = this.clamp(st.heat + 10, 0, 100);
        if (st.flags.freePromo) { st.money += 20; delete st.flags.freePromo; res.text += "（造势派启动资金抵扣了本次预算！）"; }
        res = { text: "宣传物料铺满三城地铁，话题度上涨。（热度+10 资金-20）" + (res.text || ""), tone: "normal" };
        break;
      }
    }

    st.ap -= 1;
    this.addLog(st, st.month, res.text, res.tone);
    this.save();
    return res;
  },

  /* 分团当前阶段的门控检查：返回null=可推进，否则返回原因文本 */
  branchBlockReason() {
    const st = this.st, s = st.branch.stage;
    if (s === 2 && st.money < 220) return "资金不足（需≥220万）";
    if (s === 3 && st.heat < 50) return "热度不足（需≥50）";
    if (s === 4 && st.morale < 55) return "士气不足（需≥55）";
    return null;
  },

  /* CGT48 重建阶段门控（2026 线） */
  cgtBlockReason() {
    const st = this.st, s = st.cgt.stage;
    if (s === 1 && st.morale < 55) return "士气不足（需≥55）";
    if (s === 2 && st.money < 180) return "资金不足（需≥180万）";
    if (s === 3 && st.train < 50) return "训练度不足（需≥50）";
    return null;
  },

  /* CGT48 重建推进（2026 线，阶段场景见 STORY.scenesCgt） */
  /* 【解散路线】待安置批次名单：尚未处理的 CGT48 成员，每批最多 13 人（37人 = 13+12+12） */
  settleBatchList() {
    const st = this.st;
    return st.members.filter(m => m.team === "CGT48" && m.status === "branch").slice(0, 13);
  },

  /* 【解散路线】落地一批安置：dest = { sh:[3], gz:[2], cq:[2] }（成员 id）。
     上海→本部预备生（PREP）；广州/重庆→对应分团预备生；未分配者自动离团（备注「解散安置」）。
     消耗 1 点行动点；三批全部完成后 settleDone=true。 */
  settleBatch(dest) {
    const st = this.st;
    if (!st.cgt.closed || st.cgt.settleDone) return { text: "当前没有需要安置的批次。", tone: "blocked" };
    const batch = this.settleBatchList();
    const pick = list => (list || []).map(id => batch.find(m => m.id === id)).filter(Boolean);
    const sh = pick(dest && dest.sh), gz = pick(dest && dest.gz), cq = pick(dest && dest.cq);
    if (sh.length !== 3 || gz.length !== 2 || cq.length !== 2)
      return { text: "名额不符：本批须分配 上海 3 人、广州 2 人、重庆 2 人。" };
    const all = sh.concat(gz, cq);
    if (new Set(all.map(m => m.id)).size !== 7) return { text: "有成员被重复分配，请检查名单。" };
    /* 上海：转入本部预备生 */
    for (const m of sh) {
      m.status = "active"; m.team = "PREP"; m.branchTeam = null; m.branchLabel = "";
      m.gen = "CGT48移籍"; if (!m.pop || m.pop < 10) m.pop = 10; if (!m.bond) m.bond = 12;
    }
    /* 广州 / 重庆：转入分团预备生（简卡；team 同步改为分团，避免下批名单重复捞回） */
    for (const m of gz) { m.team = "GNZ48"; m.branchTeam = "GNZ48"; m.branchLabel = "预备生"; }
    for (const m of cq) { m.team = "CKG48"; m.branchTeam = "CKG48"; m.branchLabel = "预备生"; }
    /* 其余：解约离团 */
    const placedIds = new Set(all.map(m => m.id));
    const leftNames = batch.filter(m => !placedIds.has(m.id)).map(m => { m.status = "left"; m.note = "解散安置"; return m.name; });
    st.cgt.settled += 1;
    st.ap = Math.max(0, st.ap - 1);
    st.money = Math.max(0, st.money - 10);
    st.morale = this.clamp(st.morale + 2, 0, 100);
    st.burden = this.clamp(st.burden + 4, 0, 100);
    let text = "第" + st.cgt.settled + "批安置完成——上海·预备生：" + sh.map(m => m.name).join("、") +
      "；广州·预备生：" + gz.map(m => m.name).join("、") +
      "；重庆·预备生：" + cq.map(m => m.name).join("、") +
      "；其余 " + leftNames.length + " 人协商解约离团（解散安置）。";
    if (st.cgt.settled >= 3) {
      st.cgt.settleDone = true;
      st.heat = this.clamp(st.heat + 4, 0, 100);
      st.morale = this.clamp(st.morale + 2, 0, 100);
      text = "第三批安置完成。三批三十七人——二十一人换上了新队服，十六人带着安置补偿体面转身。粉丝圈罕见地夸了一次运营：「有始有终。」\n\n（安置全部完成：资金-10 士气+4 热度+4 叶盛负担+4）";
    } else {
      text += "\n\n（安置进度 " + st.cgt.settled + "/3 资金-10 士气+2 叶盛负担+4）";
    }
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main" };
  },

  /* 二十三期预备生升格（2026 年 2 月）：assign = { [memberId]: "SII"|"NII"|"HII"|"X" }。
     池内为二十三期 16 人 + 22 期应籽言（排除 CGT48 移籍预备生——她们走 5 月联动升格）。
     升格后预备生池只剩尚未入队的后期预备生（5 月二十四期再补入）。 */
  promoteTeams23(assign) {
    const st = this.st;
    const targets = st.members.filter(m => m.team === "PREP" && m.status === "active" && m.gen !== "CGT48移籍");
    if (!targets.length) return { text: "当前没有待升格的预备生。", tone: "blocked" };
    const TEAM = ["SII", "NII", "HII", "X"];
    for (const m of targets) {
      const t = assign ? assign[m.id] : null;
      if (!t || TEAM.indexOf(t) < 0) return { text: "还有成员未分配队伍（SII / NII / HII / X）。" };
    }
    const by = { SII: [], NII: [], HII: [], X: [] };
    for (const m of targets) {
      m.team = assign[m.id];
      m.pop = this.clamp(m.pop + 3, 0, 100);
      m.bond = this.clamp(m.bond + 3, 0, 100);
      by[m.team].push(m.name);
    }
    st.flags.p23Promoted = true;
    const text = "二十三期升格名单公布——Team SII：" + by.SII.join("、") + "；Team NII：" + by.NII.join("、") +
      "；Team HII：" + by.HII.join("、") + "；Team X：" + by.X.join("、") +
      "（22 期应籽言一并转正）。预备生池清零——五月，又会有新的一页。（人气+3 羁绊+3）";
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main" };
  },

  /* 【解散路线】CGT48 移籍预备生升格：assign = { [memberId]: "SII"|"NII"|"HII"|"X" }。
     升格后转入对应正式队伍，人气+4 羁绊+4；gen 改为「CGT48移籍·升格」（升格事件不再触发）。 */
  promoteCgt(assign) {
    const st = this.st;
    const targets = st.members.filter(m => m.gen === "CGT48移籍" && m.team === "PREP" && m.status === "active");
    if (!targets.length) return { text: "当前没有待升格的移籍预备生。", tone: "blocked" };
    const TEAM = ["SII", "NII", "HII", "X"];
    for (const m of targets) {
      const t = assign ? assign[m.id] : null;
      if (!t || TEAM.indexOf(t) < 0) return { text: "还有成员未分配队伍（SII / NII / HII / X）。" };
    }
    const by = { SII: [], NII: [], HII: [], X: [] };
    for (const m of targets) {
      m.team = assign[m.id];
      m.gen = "CGT48移籍·升格";
      m.pop = this.clamp(m.pop + 4, 0, 100);
      m.bond = this.clamp(m.bond + 4, 0, 100);
      by[m.team].push(m.name);
    }
    st.flags.cgtPromoted = true;
    const text = "升格名单公布——Team SII：" + by.SII.join("、") + "；Team NII：" + by.NII.join("、") +
      "；Team HII：" + by.HII.join("、") + "；Team X：" + by.X.join("、") +
      "。从今天起，她们的介绍里不再有「前CGT48」三个字。（人气+4 羁绊+4）";
    this.addLog(st, st.month, text, "main");
    this.save();
    return { text: text, tone: "main" };
  },

  advanceCgt() {
    const st = this.st;
    const s = st.cgt.stage;
    if (s === 0) {
      st.cgt.stage = 1;
      return { text: "与成都方面完成对接：剧场资产移交协议草签，前CGT48成员的联络网交到你手上。", tone: "main", vn: STORY.scenesCgt.connect };
    }
    if (s === 1) {
      st.cgt.stage = 2;
      return { text: "重建志愿者选拔落幕：一批不甘心的姑娘拿到了新河的入场券。", tone: "main", vn: STORY.scenesCgt.audition };
    }
    if (s === 2) {
      st.money -= 160; st.cgt.stage = 3;
      return { text: "成都剧场翻新开工：舞台、灯光、地板全部更换。（资金-160万）", tone: "main", vn: STORY.scenesCgt.theater };
    }
    if (s === 3) {
      st.cgt.stage = 4;
      return { text: "首演彩排开始，出道曲敲定——CGT48 重启进入倒计时！", tone: "main", vn: STORY.scenesCgt.rehearsal };
    }
    return { text: "", tone: "none" };
  },

  /* 分团主线推进（stage1 选址走 pickCity）。
     每阶段返回 {text, tone, vn?}：vn 为该阶段的专属剧情场景，
     UI 先播放场景（含选项），结束后再提示结算文本/弹选址框。 */
  advanceBranch() {
    const st = this.st;
    const s = st.branch.stage;
    if (s === 0) {
      st.branch.stage = 1;
      /* 伏笔：王子杰在会议后单独留下总监谈「原创曲库」（2026 线回收） */
      st.flags.originalSongs = true;
      return { text: "与山本学完成首轮跨洋会谈：日方共享名古屋/大阪的筹备手册，选址考察排上下周。", tone: "main", vn: STORY.actionScenes.branchMeet };
    }
    if (s === 1) return { text: "", tone: "pickCity", vn: STORY.actionScenes.branchScout };   // UI 播完场景后弹城市选择
    if (s === 2) {
      st.money -= 200; st.branch.stage = 3;
      return { text: "剧场租约签订，改造队进场：灯光、音响、应援色墙一应俱全。（资金-200万）", tone: "main", vn: STORY.actionScenes.branchTheater };
    }
    if (s === 3) {
      st.branch.stage = 4; st.money += 40;
      return { text: "冠名与首批赞助敲定，招商款 40 万入账——热度换来真金白银。", tone: "main", vn: STORY.actionScenes.branchBiz };
    }
    if (s === 4) {
      st.branch.stage = 5;
      return { text: "分团首批成员名单敲定，出道集训开营。筹备全部完成，只待官宣！", tone: "main", vn: STORY.actionScenes.branchRecruit };
    }
    return { text: "", tone: "none" };
  },

  /* 行动剧情中的选项落地：追加日志并存档（由 UI 在选项生效后调用） */
  logChoice(text) {
    this.addLog(this.st, this.st.month, text, "main");
    this.save();
  },

  /* 选址决定（UI 从 STORY.branchCities 渲染选项后回调） */
  pickCity(cityId) {
    const st = this.st;
    const c = STORY.branchCities.find(x => x.id === cityId);
    if (!c || st.branch.stage !== 1) return null;
    st.branch.city = c.name;
    st.money += c.cost + c.moneyBonus;
    st.heat = this.clamp(st.heat + c.heatBonus, 0, 100);
    st.branch.stage = 2;
    this.addLog(st, st.month, "分团选址定在「" + c.name + "」。" + c.desc, "main");
    this.save();
    return { text: "选址拍板：「" + c.name + "」！考察组连夜返沪汇报。（资金" + (c.cost + c.moneyBonus >= 0 ? "+" : "") + (c.cost + c.moneyBonus) + "万 热度" + (c.heatBonus >= 0 ? "+" : "") + c.heatBonus + "）", tone: "main" };
  },

  /* ============================ 月末结算 ============================ */

  /* 汇总本月收支（供结算表展示） */
  settle(st) {
    if (st.era === "2026") {
      const income = Math.round(40 + st.heat * 0.5 + st.train * 0.25 + (st.cgt.open ? 25 : 0));
      const expense = 52;
      return { income, expense, net: income - expense };
    }
    const income = Math.round(45 + st.heat * 0.5 + st.train * 0.25 + (st.branch.announce ? 35 : 0));
    const expense = 55;
    return { income, expense, net: income - expense };
  },

  /* 月末主流程：产出 UI 步骤队列（结算表→事件→大事件结果→…→结局） */
  endMonth() {
    const st = this.st;
    const steps = [];

    /* ① 收支结算 */
    const s = this.settle(st);
    st.money += s.net;
    steps.push({
      type: "settle", income: s.income, expense: s.expense, net: s.net,
      money: st.money,
    });

    /* ② 赤字检查 */
    if (st.money < 0) {
      st.money = 0;
      st.debt += 1;
      st.morale = this.clamp(st.morale - 10, 0, 100);
      this.addLog(st, st.month, "本月出现赤字，董事会震怒！（士气-10）", "bad");
      if (st.debt >= 2) {
        steps.push({ type: "ending", grade: "bankrupt" });
        return steps;   // 直接终局
      }
      steps.push({ type: "vn", title: STORY.debtWarning.title, pages: STORY.debtWarning.pages });
    }

    /* ③ 叶盛负担与士气检定 */
    st.burden = this.clamp(st.burden + 6, 0, 100);
    if (st.burden >= 80) {
      st.morale = this.clamp(st.morale - 6, 0, 100);
      steps.push({ type: "vn", title: "事务积压", pages: [
        { nar: true, t: "叶盛的桌上的待办堆积成山——有成员的投诉被拖了一周才回，排练室的怨气藏不住了。（负担≥80：士气-6）\n\n叶盛揉着太阳穴对你说了四个字：「救救孩子，也救救我。」" },
      ]});
    } else if (st.burden <= 25) {
      st.morale = this.clamp(st.morale + 2, 0, 100);
    }
    if (st.morale < 40) this.addLog(st, st.month, "全团士气低迷，成员的笑变少了……", "bad");

    /* ④ 官宣判定（2016 线：4月起，筹备完成即官宣；4月官宣有加成） */
    if (st.era === "2016" && !st.branch.announce && st.branch.stage >= 5 && st.month >= 4) {
      st.branch.announce = true;
      st.branch.announceMonth = st.month;
      const onTime = st.month === 4;
      st.money += onTime ? 120 : 100;
      st.heat = this.clamp(st.heat + (onTime ? 12 : 8), 0, 100);
      this.addLog(st, st.month, "分团正式官宣成立" + (st.branch.city ? "（" + st.branch.city + "）" : "") + "！" + (onTime ? "赶上4·20节点，热度大增。" : ""), "main");
      if (!onTime) steps.push({ type: "vn", title: "补办官宣", pages: [
        { nar: true, t: st.month + "月，分团终于官宣成立——比原计划晚了些，但两座星梦剧院的灯，到底还是亮起来了。（资金+100万 热度+8）" },
      ]});
      // 移籍生效：21 名五期生转入分团（status='branch'，成员页单独标签页展示）
      const movers = DATA.branchMovers.BEJ.concat(DATA.branchMovers.GNZ);
      for (const name of movers) {
        const m = st.members.find(x => x.name === name);
        if (m) { m.status = "branch"; m.branchTeam = DATA.branchMovers.BEJ.includes(name) ? "BEJ48" : "GNZ48"; }
      }
      this.addLog(st, st.month, movers.length + " 名成员移籍分团（BEJ48/GNZ48），成为分团创始成员。", "main");
      /* 选址为沈阳/重庆时：官宣后追加「第二座支流」宣布事件（2017 分团线伏笔，
         并登记 st.decisions.nextBranch 供后续剧情回收）。
         配对关系：沈阳=SHY48，重庆=CKG48（2026-09-18 用户修正：直接配对，不交叉） */
      if (st.branch.city === "沈阳" || st.branch.city === "重庆") {
        const nextTeam = st.branch.city === "沈阳" ? "SHY48" : "CKG48";
        this.recordDecision("nextBranch", nextTeam);
        steps.push({ type: "vn", title: "第二座支流 · " + nextTeam + "（2017）",
          pages: STORY.branchNextAnnounce[st.branch.city](st).map(p => ({ ...p, t: this.fmt(p.t) })) });
      }
    }

    /* ④·五 CGT48 重启首演判定（2026 线：重建完成后当月月末举行首演） */
    if (st.era === "2026" && !st.cgt.open && st.cgt.stage >= 4) {
      st.cgt.open = true;
      st.cgt.openMonth = st.month;
      st.money += 80;
      st.heat = this.clamp(st.heat + 10, 0, 100);
      this.addLog(st, st.month, "CGT48 重启首演落幕！成都的灯重新亮起，此后每月为总账带来 25 万收入。", "main");
      steps.push({ type: "vn", title: "CGT48 重启首演", pages: STORY.scenesCgt.debut(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
    }

    /* ④·六 金曲大赏取消判定（2026 线：9月末盘点，营业不佳则陶莺取消大赏） */
    if (st.era === "2026" && st.month === 9 && !st.rtCancelled && (st.money < 80 || st.heat < 30)) {
      st.rtCancelled = true;
      st.rtDone = true;   // 主线①的大赏部分按已了结处理（以取消收场）
      this.addLog(st, st.month, "陶莺宣布：因营业状况不佳，本年度金曲大赏取消。", "bad");
      steps.push({ type: "vn", title: "金曲大赏 · 取消", pages: STORY.rtCancelEvent(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
    }

    /* ⑤ 月度脚本事件或随机事件（按 era 取源）。
       月度事件以 chain 惰性下发：UI 播放每个事件前才评估 gate——
       这样同一月末里「前置事件的选择」可以解锁后续事件
       （如 5月：下一站选 SHY48/CKG48 → 解锁开拓者点将）。 */
    const monthlySrc = st.era === "2026" ? STORY.monthly26 : STORY.monthly;
    const randomSrc = st.era === "2026" ? STORY.randomPool26 : STORY.randomPool;
    const monthlies = monthlySrc[st.month] || [];
    if (monthlies.length) {
      steps.push({ type: "chain", events: monthlies });
    } else if (Math.random() < 0.6) {
      const pool = randomSrc.filter(ev => !ev.gate || ev.gate(st));   // 随机事件也可声明 gate（如分家后日方事件退场）
      const ev = pool[this.rnd(0, pool.length - 1)];
      if (ev) steps.push(this.buildEventStep(ev, st));
    }

    /* ⑥ 七月：总选举结算 */
    if (st.month === 7 && !st.geDone) {
      steps.push(this.resolveGE(st));
      /* 【荣誉殿堂】2026 线：杨冰怡连霸总选第一 → 依规则升堂，转入影视部 */
      if (st.era === "2026" && st.geResult && st.geResult.top1 === "杨冰怡" && !st.flags.bingyiHall) {
        st.flags.bingyiHall = true;
        const by = st.members.find(m => m.name === "杨冰怡");
        if (by) {
          by.hall = true; by.team = "HALL"; by.note = "连续两届总决选第一名 · 升入荣誉殿堂";
        }
        st.morale = this.clamp(st.morale + 3, 0, 100);
        st.heat = this.clamp(st.heat + 3, 0, 100);
        steps.push({ type: "vn", title: "荣誉殿堂 · 升堂仪式", pages: STORY.hallAscension(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
      }
    }

    /* ⑦ 十二月：金曲大赏结算（2026 线若被取消则改为年末总结会）+ 年度结局 */
    if (st.month === 12) {
      if (st.era === "2026" && st.rtCancelled) {
        steps.push({ type: "vn", title: "年末总结会", pages: STORY.rtCancelledClose(st).map(p => ({ ...p, t: this.fmt(p.t) })) });
      } else {
        steps.push(this.resolveRT(st));
      }
      steps.push({ type: "ending", grade: this.computeGrade(st) });
      return steps;   // 一年终局，不再 advance
    }

    return steps;
  },

  /* 把事件对象转成 UI 可播放的 step（pages 支持函数；文本做 {name} 替换） */
  buildEventStep(ev, st) {
    const pages = typeof ev.pages === "function" ? ev.pages(st) : ev.pages;
    return {
      type: "vn", title: ev.title,
      pages: pages.map(p => ({ ...p, t: this.fmt(p.t) })),
      after: (ev.after || []).map(p => ({ ...p, t: this.fmt(p.t) })),   // 选项结算后追加的公共剧情
      choices: ev.choices ? ev.choices.map(c => ({
        label: c.label, hint: c.hint || "",
        gate: c.gate ? c.gate(st) : true,
        tag: c.tag, value: c.value,          // 决策标签透传给 UI
        pickMode: c.pickMode,                // 特殊交互模式（如 sii5：Team SII 五人选将）
        run: () => { if (c.tag) this.recordDecision(c.tag, c.value !== undefined ? c.value : c.tag); return c.effect(this.st); },
      })) : null,
    };
  },

  /* 总选举结算：生成排名 + 叙事 + 奖励 */
  resolveGE(st) {
    st.geDone = true;
    // 策略效果
    if (st.geStrategy === "focus") {
      const top = this.activeMembers(st).sort((a, b) => b.pop - a.pop)[0];
      if (top) { top.geBoost = 25; st.morale = this.clamp(st.morale - 6, 0, 100); }
    } else if (st.geStrategy === "balance") {
      for (const m of this.activeMembers(st)) if (m.bond >= 40) m.geBoost = (m.geBoost || 0) + 6;
      st.morale = this.clamp(st.morale + 8, 0, 100);
    }
    // 计分排名：SNH48 在籍成员 + 分团成员（官宣后参选；史实：分团首次参加，各选 TOP7）
    // 赵嘉敏不参选（史实：二届冠军未报名三届总选；6月「学业与舞台」事件无论何选均不参加）
    const pool = this.activeMembers(st).concat(
      st.branch.announce ? st.members.filter(m => m.status === "branch") : []
    ).filter(m => m.name !== "赵嘉敏" && m.team !== "HALL");   // 荣誉殿堂/影视部成员不参选
    const ranked = pool
      .map(m => ({ m, score: m.pop * 1.5 + m.bond * 0.8 + st.gePlan * 0.3 + st.heat * 0.25 + (m.geBoost || 0) + this.rnd(0, 12) }))
      .sort((a, b) => b.score - a.score);
    const top48 = ranked.slice(0, 48).map((r, i) => ({
      rank: i + 1,
      name: r.m.name,
      team: r.m.status === "branch" ? r.m.branchTeam : r.m.team,   // 分团成员显示分团队徽
      votes: Math.round(r.score * 1200),                            // 展示用票数（同人设定）
    }));
    st.geResult = {
      top1: top48[0].name,
      top48,
      strategy: st.geStrategy,
      // 分团内部 TOP7（未官宣则无分团参选）
      bejTop7: st.branch.announce ? ranked.filter(r => r.m.status === "branch" && r.m.branchTeam === "BEJ48").slice(0, 7).map(r => r.m.name) : null,
      gnzTop7: st.branch.announce ? ranked.filter(r => r.m.status === "branch" && r.m.branchTeam === "GNZ48").slice(0, 7).map(r => r.m.name) : null,
    };
    for (const m of st.members) delete m.geBoost;

    const money = Math.round(120 + st.heat * 0.8);
    st.money += money;
    st.heat = this.clamp(st.heat + (st.geStrategy === "focus" ? 15 : 12), 0, 100);
    this.addLog(st, 7, "总选举落幕，第一名：" + ranked[0].m.name + "。全团话题度暴涨。", "gold");

    const narr = st.geStrategy === "balance" ? STORY.geNarrative.balance : STORY.geNarrative.good;
    const crownPages = STORY.geNarrative.crown.map(p => ({
      ...p, s: p.s === "{top1}" ? ranked[0].m.name : p.s, t: this.fmt(p.t),
    }));
    return {
      type: "geResult", top48: st.geResult.top48, bejTop7: st.geResult.bejTop7, gnzTop7: st.geResult.gnzTop7, money,
      title: st.era === "2026" ? "SNH48 年度人气总决选 · 结果" : "「比翼齐飞」第三届总决选 · 结果",
      pagesAfter: [...crownPages, ...narr.map(p => ({ ...p, t: this.fmt(p.t) })),
        ...(st.era === "2016" ? STORY.geAftermath(st) : STORY.geAftermath26).map(p => ({ ...p, t: this.fmt(p.t) }))],
    };
  },

  /* 金曲大赏结算 */
  resolveRT(st) {
    st.rtDone = true;
    const score = Math.round(st.rtPlan * 0.5 + st.train * 0.25 + st.morale * 0.25 + this.rnd(0, 10));
    st.rtScore = score;
    let tier, money, heat;
    if (score >= 85)      { tier = "great";  money = 150; heat = 15; }
    else if (score >= 65) { tier = "good";   money = 100; heat = 10; }
    else                  { tier = "normal"; money = 60;  heat = 4;  }
    st.money += money;
    st.heat = this.clamp(st.heat + heat, 0, 100);
    this.addLog(st, 12, "年度金曲大赏落幕（评价：" + tier + "）。资金+" + money + "万。", "gold");
    return {
      type: "rtResult", tier, score, money,
      title: "年度金曲大赏 · 收官",
      pagesAfter: STORY.rtNarrative[tier === "great" ? "great" : "normal"].map(p => ({ ...p, t: this.fmt(p.t) })),
    };
  },

  /* ============================ 年度评分与结局 ============================ */

  computeGrade(st) {
    if (st.era === "2026") return this.computeGrade26(st);
    let score = 0;
    // ① 分团（30）
    if (st.branch.announce) score += st.branch.announceMonth === 4 ? 30 : 20;
    else if (st.branch.stage >= 3) score += 8;
    else if (st.branch.stage >= 1) score += 4;
    // ② 总选举（25）
    if (st.geDone) {
      score += 20;
      const t1 = st.members.find(m => m.name === st.geResult.top1);
      if (t1 && t1.bond >= 60) score += 5;
    }
    // ③ 金曲大赏（18）
    if (st.rtScore >= 85) score += 18;
    else if (st.rtScore >= 65) score += 12;
    else if (st.rtDone) score += 6;
    // ④ 资源面
    score += Math.round(st.heat / 4);      // ≤25
    score += Math.round(st.morale / 10);   // ≤10
    score += Math.min(10, Math.floor(st.money / 60));
    if (st.debt >= 1) score -= 10;

    if (score >= 95) return "S";
    if (score >= 75) return "A";
    if (score >= 55) return "B";
    return "C";
  },

  /* 2026 线年度评分：
     CGT48(30) + 总选(20) + 大赏(15，取消则0) + 末位淘汰(15) + 热度/4(≤25)
     + 士气/10(≤10) + 资金/50(≤10) − 赤字10 − 陶莺积怨(defied 每次扣4) */
  computeGrade26(st) {
    let score = 0;
    // ① CGT48：重建路线（30）/ 解散安置路线（24）
    if (st.cgt.closed) {
      const n = st.cgt.settled || 0;
      score += n >= 3 ? 24 : n >= 1 ? 10 : 0;             // 安置 3 批全完成 → 24 分
    } else if (st.cgt.open) score += st.cgt.openMonth <= 10 ? 30 : 20;
    else if (st.cgt.stage >= 3) score += 15;
    else if (st.cgt.stage >= 1) score += 6;
    // ② 总选举（20）
    if (st.geDone) {
      score += 15;
      const t1 = st.members.find(m => m.name === st.geResult.top1);
      if (t1 && t1.bond >= 60) score += 5;
    }
    // ③ 金曲大赏（15；取消 = 0，但若取消后热度/士气仍高，玩家在别处已挣回场面）
    if (!st.rtCancelled) {
      if (st.rtScore >= 85) score += 15;
      else if (st.rtScore >= 65) score += 10;
      else score += 5;
    }
    // ④ 末位淘汰执行度（15）：3 次评审，执行/调往CGT 计满，缓刑打折，积怨扣分
    score += Math.round(15 * Math.min(3, st.elim.executed + st.elim.transferred) / 3);
    if (st.elim.defied >= 3) score -= 8;
    else score -= st.elim.defied * 4;
    // ⑤ 资源面
    score += Math.round(st.heat / 4);
    score += Math.round(st.morale / 10);
    score += Math.min(10, Math.floor(st.money / 50));
    if (st.debt >= 1) score -= 10;

    if (score >= 90) return "S";
    if (score >= 70) return "A";
    if (score >= 50) return "B";
    return "C";
  },

  /* 进入下一个月（UI 播放完月末步骤后调用） */
  advanceMonth() {
    const st = this.st;
    st.month += 1;
    st.ap = 3;
    this.save();
  },

  /* 当前月份显示 */
  dateLabel() {
    const st = this.st;
    return st.era + "年" + st.month + "月";
  },
};
