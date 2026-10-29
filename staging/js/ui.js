/* ============================================================================
   ui.js — 界面渲染与交互
   ----------------------------------------------------------------------------
   屏幕流：标题 → 开局 → 序章(VN) → 经营主界面 →(月末步骤队列)→ 结局
   引擎联动：
     - Game.monthStart() 返回的 steps 先播（告别等），再交给玩家行动
     - 玩家 AP 用完（或主动）触发 endMonth()，steps 队列依次播放：
       settle 结算表 → vn 事件 → geResult/rtResult 大事件 → ending 结局
     - 播放完 Game.advanceMonth() + Game.monthStart() 进入新月
   所有弹窗复用 modal-root；VN 页面结构见 data_story.js 头部约定。
============================================================================ */

"use strict";

/* 成员立绘白名单（v0.11.11：与 Maker 移植线共用同一套素材）。
   文件位于 assets/image/portraits/<文件名>.jpg，值=文件名（可与成员 id 不同）。 */
const PORTRAITS = {
  zhaojiamin: "zhaojiamin",   // 赵嘉敏
  jujingyi: "jujingyi",       // 鞴婧祎
  tanganqi: "tanganqi",       // 唐安琪
  zhangyi: "zhangyi",         // 张怡
  suzukimaria: "suzukimaria", // 铃木玛莉亚
  yangbingyi: "yangbingyi",   // 杨冰怡（2026 线 yangbingyi26 复用）
};

const UI = {

  /* ---------------- 基础工具 ---------------- */

  $(id) { return document.getElementById(id); },

  /* 便捷建元素：<tag class=cls>text</tag>
     text 可为：字符串 / Node / 数组（字符串与 Node 混合均可）。
     注意：不能用 textContent 直接赋值非字符串，否则会得到
     "[object HTMLSpanElement]" 之类的占位文本。 */
  el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined && text !== null) {
      const items = Array.isArray(text) ? text : [text];
      for (const it of items) {
        if (it instanceof Node) e.appendChild(it);
        else e.appendChild(document.createTextNode(String(it)));
      }
    }
    return e;
  },

  showScreen(id) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    this.$(id).classList.remove("hidden");
  },

  toast(msg, ms) {
    const t = this.$("toast");
    t.textContent = msg;
    t.classList.remove("hidden");
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.add("hidden"), ms || 2400);
  },

  /* ---------------- 弹窗系统 ---------------- */

  /* show: (card) => void，card 为 .modal-card 元素；返回关闭函数 */
  modal(card) {
    const root = this.$("modal-root");
    root.innerHTML = "";
    root.classList.remove("hidden");
    root.appendChild(card);
    return () => this.closeModal();
  },

  closeModal() {
    const root = this.$("modal-root");
    root.classList.add("hidden");
    root.innerHTML = "";
    /* 【成员详情窗】清掉可能残留的遮罩点击关闭监听（避免泄漏到后续弹窗） */
    if (this._modalBackdrop) {
      root.removeEventListener("click", this._modalBackdrop);
      this._modalBackdrop = null;
    }
  },

  /* 构建通用弹窗卡片 */
  card(title, sub) {
    const c = this.el("div", "modal-card");
    if (title) c.appendChild(this.el("div", "modal-title", title));
    if (sub) c.appendChild(this.el("div", "modal-sub", sub));
    return c;
  },

  /* ---------------- 步骤队列播放器 ---------------- */

  /* 依次播放 steps（月末/月初流程），全部结束后回调 */
  playSteps(steps, onDone) {
    let i = 0;
    const next = () => {
      if (i >= steps.length) { if (onDone) onDone(); return; }
      const step = steps[i++];
      this.playStep(step, next);
    };
    next();
  },

  playStep(step, next) {
    switch (step.type) {
      case "settle": this.stepSettle(step, next); break;
      case "vn": this.stepVN(step, next); break;
      case "chain": this.stepChain(step.events, next); break;
      case "geResult": this.stepGEResult(step, next); break;
      case "rtResult": this.stepRTResult(step, next); break;
      case "ending": this.showEnding(step.grade); break;   // 终局不再回调
      default: next();
    }
  },

  /* 月末结算表 */
  /* 存档码弹窗：textarea 呈现/粘贴存档码。cfg = { title, sub, code, readonly, confirmLabel, onConfirm(ta, close) } */
  showCodeModal(cfg) {
    const c = this.card(cfg.title, cfg.sub);
    const ta = this.el("textarea", "code-area");
    ta.value = cfg.code || "";
    ta.readOnly = !!cfg.readOnly;
    ta.setAttribute("spellcheck", "false");
    c.appendChild(ta);
    const btn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    btn.onclick = () => cfg.onConfirm(ta, () => this.closeModal());
    c.appendChild(btn);
    this.modal(c);
  },

  /* 月度事件惰性链：播放每个事件前才评估其 gate——
     同一月末里，前置事件的选择可以解锁后续事件（如 下一站选SHY48/CKG48 → 开拓者点将） */
  stepChain(events, done) {
    const queue = (events || []).slice();
    const playNext = () => {
      let ev;
      while (queue.length) {
        const e = queue.shift();
        if (!e.gate || e.gate(Game.st)) { ev = e; break; }
      }
      if (!ev) { if (done) done(); return; }
      this.stepVN(Game.buildEventStep(ev, Game.st), playNext);
    };
    playNext();
  },

  /* 月末结算表 */
  stepSettle(step, next) {
    const st = Game.st;
    const c = this.card("月末结算 · " + Game.dateLabel(), "剧场的灯每晚都亮着，账本也是");
    const d = step.detail || {};
    const rows = [
      ["经营收入（公演/商务/分团）", "+" + step.income + " 万", "sr-plus"],
    ];
    /* 经济系统 v2：支出分项展示（工资随人头变动） */
    if (d.salary != null) {
      rows.push(["本部工资（" + d.hqCount + " 人 × 0.5 万，暂休不计）", "-" + d.salary + " 万", "sr-minus"]);
      if (d.top7Count > 0) rows.push(["总选TOP7分成（" + d.top7Count + " 人）", "-" + d.top7 + " 万", "sr-minus"]);
      if (d.branchCost > 0) rows.push(["分团维系·分团工资（" + d.brCount + " 人）", "-" + d.branchCost + " 万", "sr-minus"]);
      rows.push(["固定运营支出", "-" + d.fixed + " 万", "sr-minus"]);
    } else {
      rows.push(["固定运营支出", "-" + step.expense + " 万", "sr-minus"]);
    }
    rows.push(
      ["本月净收支", (step.net >= 0 ? "+" : "") + step.net + " 万", step.net >= 0 ? "sr-plus" : "sr-minus"],
      ["账面资金", step.money + " 万", ""],
    );
    for (const [k, v, cls] of rows) {
      const r = this.el("div", "settle-row");
      r.appendChild(this.el("span", "", k));
      const val = this.el("span", "sr-val " + cls, v);
      r.appendChild(val);
      c.appendChild(r);
    }
    if (step.money <= 60) c.appendChild(this.el("p", "modal-text", "⚠ 资金见底了——再这样下去，董事会要请你喝茶了。"));
    const btn = this.el("button", "btn btn-primary modal-close", "知道了");
    btn.onclick = () => { this.closeModal(); next(); };
    c.appendChild(btn);
    this.modal(c);
  },

  /* 通用 VN 事件弹窗（含 choices 分支）：逐页点击推进，末页出选项/继续 */
  stepVN(step, next) {
    const pages = step.pages.slice();
    const c = this.card(step.title || "", "");
    const body = this.el("div", "vn-body");
    body.style.minHeight = "auto";
    body.style.padding = "0 0 6px";
    c.appendChild(body);
    this.modal(c);

    let idx = 0;
    const finish = () => { this.closeModal(); if (next) next(); };

    const showEnd = () => {
      body.innerHTML = "";
      body.onclick = null;
      if (step.choices && step.choices.length) {
        const box = this.el("div", "vn-choices");
        for (const ch of step.choices) {
          if (ch.gate === false) continue;
          /* hint 支持函数形式（动态文本，如 2016 团建链按磨合度点名队伍） */
          const hintTxt = typeof ch.hint === "function" ? ch.hint(Game.st) : (ch.hint || "");
          const b = this.el("button", "vn-choice", ch.label + (hintTxt ? "　—— " + hintTxt : ""));
          b.onclick = (e) => {
            e.stopPropagation();
            /* 特殊交互：pickMode="sii5" → Team SII 五人选将窗（宫泽佐江毕业公演）
                          pickMode="sii5m" → Team SII 五人选将窗（玛莉亚东京毕业公演）
                          pickMode="pioneer6" → 开拓者六人点将窗（2017 移籍名单） */
            if (ch.pickMode === "zhumeng16") {
              this.closeModal();
              this.showZhumeng16Picker(finish);   // 《纯洁心灵·逐梦演艺圈》MV 队伍点将窗（2016·3月）
              return;
            }
            if (ch.pickMode === "sii5") {
              this.closeModal();
              this.showSIIInvitePicker(finish);
              return;
            }
            if (ch.pickMode === "sii5m") {
              this.closeModal();
              this.showMariaInvitePicker(finish);
              return;
            }
            if (ch.pickMode === "pioneer6") {
              this.closeModal();
              this.showPioneerPicker(finish);
              return;
            }
            if (ch.pickMode === "kohaku5") {
              this.closeModal();
              this.showKohakuPicker(finish);
              return;
            }
            if (ch.pickMode === "kitahara5") {
              this.closeModal();
              this.showKitaharaPicker(finish);   // 北原里英东京毕业公演赴日名单（2018 复刻路线专属）
              return;
            }
            if (ch.pickMode === "show19both") {
              this.closeModal();
              this.showShow19Picker("T", null, pickedT => {
                this.showShow19Picker("I", pickedT.ids || [], pickedI => {
                  const res = Game.show19Finalize("both", pickedT, pickedI);
                  this.renderGame();
                  this.toast(res.text);
                  if (finish) finish();
                });
              });
              return;
            }
            if (ch.pickMode === "show19one") {
              this.closeModal();
              this.showShow19OnePicker(finish);
              return;
            }
            if (ch.pickMode === "asiafest7") {
              this.closeModal();
              this.showAsiaFest19Picker(finish);   // AKB48亚洲盛典（2019 复刻线）：曼谷远征七人名单
              return;
            }
            if (ch.pickMode === "guofeng18") {
              this.closeModal();
              this.showGuofeng18Picker(finish);   // 《国风美少年》（2018）：内推名额单人点将
              return;
            }
            if (ch.pickMode === "ho2pick") {
              this.closeModal();
              this.showUnit18Picker("HO2", finish);
              return;
            }
            if (ch.pickMode === "bluevpick") {
              this.closeModal();
              this.showUnit18Picker("BlueV", finish);
              return;
            }
            if (ch.pickMode === "demoonpick") {
              this.closeModal();
              this.showDemoon19Picker(finish);   // DEMOON 成军点将窗（2019 通用·官方钦点，七人）
              return;
            }
            if (ch.pickMode === "unitFill20") {
              this.closeModal();
              this.showUnitFill20Picker(finish); // 小分队补员链式点将窗（2020 通用·疫情固粉）
              return;
            }
            if (ch.pickMode === "aw9pick") {
              this.closeModal();
              this.showAW9Picker(finish);        // 电商女团浪彩少女AW9 预备役点将窗（2020·9月）
              return;
            }
            if (ch.pickMode === "ranye20") {
              this.closeModal();
              this.showRanyePicker(ch.value === "cast2" ? 2 : 1, finish);   // 《燃野少年的天空》选角窗（2020·11月，cast2=争取到 2 个配角 / cast1=龙套历练 1 人）
              return;
            }
            if (ch.pickMode === "bej20") {
              this.closeModal();
              this.showBej20Picker(finish);      // BEJ48 解散编号·逐人拍板窗（2020·9月）
              return;
            }
            if (ch.pickMode === "gnzreorg20") {
              this.closeModal();
              this.showGnzReorg20Picker(finish); // GNZ48 首次分团内大重组窗（2020·10月）
              return;
            }
            if (ch.pickMode === "ge20branch1") {
              this.closeModal();
              this.showGe20Branch1Picker(finish); // 2020总选新机制：分团TOP1兼任本部安排窗
              return;
            }
            if (ch.pickMode === "ge20idft") {
              this.closeModal();
              this.showGe20IdftPicker(finish);    // 2020总选新机制：入榜IDFT升格移籍拍板窗
              return;
            }
            if (ch.pickMode === "reorg18") {
              this.closeModal();
              this.showReorg18Picker(finish);   // 组阁编制会（2018 主线①，两阶段）
              return;
            }
            if (ch.pickMode === "reorg19") {
              this.closeModal();
              this.showReorg19Picker(finish);   // 二次组阁编制会（2019 主线②，两阶段）
              return;
            }
            if (ch.pickMode === "recruit19") {
              this.closeModal();
              this.showRecruit19Picker(finish); // 年度招新拍板窗（2019 主线③）
              return;
            }
            if (ch.pickMode === "cgtPromote") {
              this.closeModal();
              this.showCgtPromotePicker(finish);
              return;
            }
            if (ch.pickMode === "p23Promote") {
              this.closeModal();
              this.showP23PromotePicker(finish);
              return;
            }
            if (ch.pickMode === "prepStagePromote") {
              this.closeModal();
              this.showPrepStagePromotePicker(finish);
              return;
            }
            if (ch.pickMode === "reorg20") {
              this.closeModal();
              this.showReorg20Picker();
              return;
            }
            const resultText = ch.run();
            // 选择结果作为一段旁白接着播放（再接事件 after 公共剧情），播完再结束本事件
            Game.logTermChoice(step.title, ch.label);   // 总结任期：抉择记录（事件名 + 所选项）
            this.closeModal();
            this.stepVN({ title: "——", pages: [{ nar: true, t: Game.fmt(resultText) }].concat(step.after || []) }, finish);
          };
          box.appendChild(b);
        }
        body.appendChild(box);
      } else {
        const btn = this.el("button", "btn btn-primary modal-close", "继续");
        btn.onclick = finish;
        body.appendChild(btn);
      }
    };

    const renderPage = () => {
      body.innerHTML = "";
      const p = pages[idx];
      if (p.nar) {
        body.appendChild(this.el("div", "vn-text narration", p.t));
      } else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      body.appendChild(this.el("div", "vn-hint", idx < pages.length - 1 ? "点击继续 ▼" : ""));
      body.onclick = () => {
        if (idx < pages.length - 1) { idx++; renderPage(); }
        else showEnd();
      };
    };
    renderPage();
  },

  /* 总选举结果 */
  stepGEResult(step, next) {
    const c = this.card(step.title, "打投、应援与一年的经营，都压在这串名字上");

    /* 单行排名：名次 + 队徽 + 姓名 + （展示用）票数 */
    const mkRow = r => {
      const row = this.el("div", "settle-row");
      row.appendChild(this.el("span", "", "第" + r.rank + "名"));
      const right = this.el("span", "sr-val" + (r.rank === 1 ? " sr-plus" : ""), "");
      right.appendChild(this.el("span", "team-badge tb-" + r.team, r.team));
      right.appendChild(document.createTextNode(r.name));
      right.appendChild(this.el("span", "ge-votes", "　" + (r.votes / 10000).toFixed(1) + " 万票"));
      row.appendChild(right);
      return row;
    };

    /* 完整 TOP48 总名单（滚动） */
    c.appendChild(this.el("p", "ge-sub", "═══ TOP48 总名单 ═══"));
    const list = this.el("div", "ge-list");
    step.top48.forEach(r => list.appendChild(mkRow(r)));
    c.appendChild(list);

    /* 分团 TOP7（史实：2016 分团首次参加总选，各选 TOP7） */
    if (step.bejTop7 && step.bejTop7.length) {
      c.appendChild(this.el("p", "ge-sub", "BEJ48 TOP7"));
      const b = this.el("div", "ge-top7");
      step.bejTop7.forEach((n, i) => b.appendChild(this.el("span", "ge-chip", (i + 1) + ". " + n)));
      c.appendChild(b);
    }
    if (step.gnzTop7 && step.gnzTop7.length) {
      c.appendChild(this.el("p", "ge-sub", "GNZ48 TOP7"));
      const g = this.el("div", "ge-top7");
      step.gnzTop7.forEach((n, i) => g.appendChild(this.el("span", "ge-chip", (i + 1) + ". " + n)));
      c.appendChild(g);
    }

    c.appendChild(this.el("p", "modal-text", "打投与门票为账面带来 " + step.money + " 万收入，全团热度大涨。"));
    const btn = this.el("button", "btn btn-primary modal-close", "见证这一夜");
    btn.onclick = () => {
      this.closeModal();
      this.stepVN({ title: "总选举之夜", pages: step.pagesAfter }, next);
    };
    c.appendChild(btn);
    this.modal(c);
  },

  /* 金曲大赏结果 */
  stepRTResult(step, next) {
    const tierText = { great: "大成功 —— 全场手机灯海，年度舞台没有之一", good: "成功 —— 稳稳的收官，口碑票房双收", normal: "平淡 —— 有惊无险地唱到了最后" }[step.tier];
    const c = this.card(step.title, "舞台质量评价：" + step.score + " / 100");
    c.appendChild(this.el("p", "modal-text", tierText + "\n\n门票与周边为账面带来 " + step.money + " 万。"));
    /* 【2016~2019】年度金曲榜单（前三锁史实；4名以外按人气生成；2019 为前8+队歌第一） */
    const gs = step.gold || Game.st.goldSongs;
    if (gs && gs.list) {
      const rows = gs.list.slice().sort((a, b) => (a.last ? 1 : 0) - (b.last ? 1 : 0) || a.rank - b.rank);
      const box = this.el("div", "modal-text");
      box.appendChild(this.el("p", "", "—— 年度金曲榜单 ——"));
      for (const e of rows) {
        box.appendChild(this.el("p", "", e.rank + ".《" + e.song + "》" + Game.goldCastText(e.cast) + (e.tag ? "（" + e.tag + "）" : "")));
      }
      c.appendChild(box);
    }
    const btn = this.el("button", "btn btn-primary modal-close", "落幕");
    btn.onclick = () => {
      this.closeModal();
      this.stepVN({ title: "——", pages: step.pagesAfter }, next);
    };
    c.appendChild(btn);
    this.modal(c);
  },

  /* 年度结算页——金曲榜首摘要（2016~2019） */
  goldTopText(st) {
    if (!st.goldSongs) return "—";
    const t = st.goldSongs.list.find(e => e.rank === 1) || st.goldSongs.list[0];
    return "《" + t.song + "》" + Game.goldCastText(t.cast) + (t.tag ? "（" + t.tag + "）" : "");
  },

  /* ---------------- 标题 / 开局 ---------------- */

  initTitle() {
    this.$("btn-new").onclick = () => this.showStart();
    /* 读档入口：有存档时显示存档详情卡（年代/进度/资金），点击载入 */
    const cont = this.$("btn-continue");
    let info = null;
    try {
      let raw = localStorage.getItem(Game.SAVE_KEY);
      if (!raw) raw = localStorage.getItem(Game.BACKUP_KEY);   // 主档缺失 → 备份
      if (raw) info = JSON.parse(raw);
    } catch (e) { info = null; }
    const eraName = info && info.era === "2027" ? "大河新篇"
      : info && info.era === "2026" ? "革新征程"
      : info && info.era === "2017" ? "本部新章" : "开辟分团";
    const ok = !!info && Game.hasSave();
    cont.classList.toggle("hidden", !ok);
    if (ok) {
      this.$("sc-line1").textContent = "读取存档 · " + info.era + "「" + eraName + "」线";
      this.$("sc-line2").textContent = info.year + "年" + info.month + "月 · 资金 " + info.money + " 万 · 热度 " + info.heat + " · 士气 " + info.morale;
    }
    cont.onclick = () => {
      const st = Game.load();
      if (!st) { this.toast("存档读取失败（版本不符或已损坏）"); return; }
      this.enterGame(false);
    };
    /* 「从存档码导入」常驻（无存档时它是找回进度的入口之一） */
    const imp = this.$("btn-import-title");
    imp.classList.remove("hidden");
    imp.onclick = () => {
      this.showCodeModal({
        title: "导入存档码",
        sub: "粘贴之前导出的存档码（以 SG48V1. 开头），确认后即可从标题页读档。",
        code: "",
        readonly: false,
        confirmLabel: "确认导入",
        onConfirm: (ta, close) => {
          const r = Game.importCode(ta.value);
          this.toast(r.msg);
          if (r.ok) { close(); this.showTitle(); }   // 重新初始化标题页，读档卡随即出现
        },
      });
    };
    /* 「从文件恢复进度」常驻（实测 360 本地打开不保留 localStorage，文件是最可靠兜底） */
    this.$("btn-file-title").classList.remove("hidden");
    this.$("btn-file-title").onclick = () => this.pickSaveFile(() => { this.showTitle(); this.toast("进度已从文件恢复，请点「读取存档」继续"); });
  },

  /* 保存进度为文件（触发浏览器下载 .sg48save）；file:// 下可用 */
  downloadSaveFile() {
    const f = Game.exportSaveFile();
    if (!f) { this.toast("还没有可导出的存档"); return; }
    try {
      const blob = new Blob([f.text], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.toast("已下载存档文件：" + f.name + "（请勿改名后缀）");
    } catch (e) { this.toast("下载失败，请改用「导出存档码」"); }
  },

  /* 弹出文件选择器并读回存档文件；done 在成功后回调 */
  pickSaveFile(done) {
    const input = this.$("save-file-input");
    input.onchange = () => {
      const file = input.files && input.files[0];
      input.value = "";   // 允许重复选择同一文件
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const r = Game.importSaveText(String(reader.result), "进度已从文件恢复");
        this.toast(r.msg);
        if (r.ok && done) done();
      };
      reader.readAsText(file);
    };
    input.click();
  },

  showStart() {
    this.showScreen("screen-start");
    this._pickedEra = null;
    this.$("btn-start-game").disabled = true;
    this.$("btn-start-game").onclick = () => this.startPrologue();
    this.$("btn-back-title").onclick = () => this.showTitle();
    this.$("input-name").value = "";
    /* 三个开局入口：2016/2026 为完整线；「快速通道」为二级菜单（并入 2017/2018/2019/2027，v0.13.11） */
    const MAIN = ["2016", "2026"];
    const FAST_YEARS = ["2017", "2018", "2019", "2020", "2021", "2027"];
    const cards = {};
    for (const e of MAIN) {
      cards[e] = this.$("era-card-" + e);
      cards[e].classList.remove("selected");
      cards[e].onclick = () => pick(e);
    }
    cards.fast = this.$("era-card-fast");
    cards.fast.classList.remove("selected");
    cards.fast.onclick = () => this.showFastEraMenu(FAST_YEARS, pick);
    this.$("fast-track-warn").classList.add("hidden");
    const pick = era => {
      this._pickedEra = era;
      cards.fast.classList.toggle("selected", FAST_YEARS.indexOf(era) >= 0);
      for (const e of MAIN) cards[e].classList.toggle("selected", e === era);
      this.$("fast-track-warn").classList.toggle("hidden", FAST_YEARS.indexOf(era) < 0);
      this.$("btn-start-game").disabled = this.$("input-name").value.trim() === "";
    };
  },

  /* 【快速通道】二级菜单：并入所有快速通道年份（2017/2018/2019/2027，v0.13.11）。
     选定后回填主界面选中态（快速入口卡亮起 + 显示快速通道警示）；
     实际开局仍走 startPrologue → showFastTrackChoices 补选 → Game.newGameFast。 */
  showFastEraMenu(years, onPick) {
    const INFO = {
      "2017": { name: "本部新章", desc: "双团开设、卫视联动、原创公演。跳过 2016「开辟分团」的剧情。" },
      "2018": { name: "星阵重列", desc: "全团组阁、预备生汇报公演、鹅厂选秀。跳过 2016–2017 的剧情。" },
      "2019": { name: "双岸", desc: "TEB48 跨海筹建、二次组阁、限定团成团。跳过 2016–2018 的剧情。" },
      "2020": { name: "共渡", desc: "疫情停摆、分团安置、云公演、BEJ48 编号谢幕。跳过 2016–2019 的剧情。" },
      "2021": { name: "春潮", desc: "电商直播、疫苗接种、海外选秀、最佳拍档。跳过 2016–2020 的剧情。" },
      "2027": { name: "大河新篇", desc: "WHN48 武汉落地、影视部焕新。跳过 2026「革新征程」的剧情。" },
    };
    const c = this.card("快速通道 · 选择开局年份",
      "从中间年份开局将跳过此前年份的剧情——选定年份后，开局前还需补选影响当年的关键决策（按史实默认预选）。想完整体验请选 2016 / 2026 开局。");
    /* 快速通道风险警示（2026-10 用户口径）：花名册错乱/未知 bug 等，推荐从头经营 */
    c.appendChild(this.el("div", "fast-warn",
      "⚠ 使用快速通道可能导致花名册错乱、未知 bug 增加等情况——推荐玩家从头开始经营（2016 / 2026 开局），快速通道仅供作者实测与已通关前作的玩家使用。"));
    const box = this.el("div", "modal-choices ft-group");
    for (const y of years) {
      const info = INFO[y];
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>" + y + " · " + info.name + "</b><span>⚡ " + info.desc + "</span>";
      b.onclick = () => {
        this.closeModal();
        onPick(y);
      };
      box.appendChild(b);
    }
    c.appendChild(box);
    const cancel = this.el("button", "btn btn-ghost modal-close", "返回");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  startPrologue() {
    const name = this.$("input-name").value.trim();
    if (!name) { this.toast("先写下你的名字吧"); return; }
    const FAST = ["2017", "2018", "2019", "2020", "2021", "2027"];
    if (this._pickedEra !== "2016" && this._pickedEra !== "2026" && FAST.indexOf(this._pickedEra) < 0) {
      this.toast("请选择一个开局年代"); return;
    }
    /* 快速通道：开局前补选影响当年的关键决策（缺失决策按史实默认），再伪造年末实况交接 */
    if (FAST.indexOf(this._pickedEra) >= 0) {
      const era = this._pickedEra;
      this.showFastTrackChoices(era, choices => {
        Game.newGameFast(name, era, choices);
        this.showPrologue();
      });
      return;
    }
    Game.newGame(name, null, this._pickedEra);
    this.showPrologue();
  },

  /* 【快速通道】中途年份开局的决策补选窗：按年代列出影响当年的关键决策组，
     每组单选、按史实默认预选；确认后交 Game.newGameFast 伪造年末实况并走真实交接。 */
  showFastTrackChoices(era, onDone) {
    const GROUPS = {
      "2017": [
        { key: "branchPost", title: "2016 年末 · 你的下一站（分团兼任）", def: "none", opts: [
          { v: "none", label: "婉拒调任，专注上海总部", d: "不加兼任，先守好本部（默认）" },
          { v: "GNZ48", label: "出任 GNZ48（广州）运营总监", d: "解锁 2017 分团线·广州篇（周马交接）" },
          { v: "CKG48", label: "调任 CKG48（重庆）运营总监", d: "解锁 2017 分团线·重庆篇（孟波交接）" },
          { v: "BEJ48", label: "出任 BEJ48（北京）运营总监", d: "解锁 2017 分团线·北京篇" },
          { v: "SHY48", label: "出任 SHY48（沈阳）运营总监", d: "含开拓者六人（快速通道按人气自动点定）" },
        ] },
        { key: "zhaoMin", title: "2016 年 6 月 · 赵嘉敏的学业与舞台", def: "rest", opts: [
          { v: "rest", label: "保留合约，批准暂休", d: "史实路线（默认）：2017 年 9 月触发后续事件" },
          { v: "study", label: "支持她专注学业（延迟毕业年限）", d: "2017 年 9 月学成归队、恢复在籍" },
          { v: "terminate", label: "尊重她的学业，协商解除合约", d: "违约金+150万；赵嘉敏已离团" },
        ] },
        { key: "jpMode", title: "2016 年末 · 对日合作基调", def: "normal", opts: [
          { v: "normal", label: "正常合作（原创公演路线）", d: "默认：2017 主线⑥为四队原创公演" },
          { v: "replicate", label: "复刻模式（日方授权曲目）", d: "2017 主线⑥变为四套复刻公演；铃木玛莉亚兼任延续" },
        ] },
      ],
      "2018": [
        { key: "branchPost", title: "2016–2017 · 分团兼任（主线⑥分担对象）", def: "none", opts: [
          { v: "none", label: "无分团兼任", d: "主线⑥为「分担叶盛」（默认）" },
          { v: "BEJ48", label: "兼任 BEJ48（北京）", d: "主线⑥为「专注 BEJ48 事务」" },
          { v: "GNZ48", label: "兼任 GNZ48（广州）", d: "主线⑥为「专注 GNZ48 事务」" },
          { v: "SHY48", label: "兼任 SHY48（沈阳）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
          { v: "CKG48", label: "兼任 CKG48（重庆）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
        ] },
        { key: "xiiKeep18", title: "2018 年 1 月 · Team XII 的去留（张怡的请求）", def: "dissolve", opts: [
          { v: "dissolve", label: "取消 XII 编制", d: "史实路线（默认）：组阁三步完成；XII 成员全员重编；资金+20" },
          { v: "keep", label: "保留 XII 编制", d: "组阁多一步编制确认；XII 参与本次编组；士气+4" },
        ] },
        { key: "zhaoState", title: "赵嘉敏的现状（2016–2017 决策合成）", def: "freeze", opts: [
          { v: "freeze", label: "官司暂休（史实路线）", d: "2018 年 6 月合约期满毕业、专注影视" },
          { v: "study", label: "学业线：已学成归队", d: "在籍至 2020 年 10 月（后续年份实装离团）" },
          { v: "release", label: "2017 无责解约", d: "公司放弃违约金放人；已离团" },
          { v: "terminate", label: "2016 协商解约", d: "违约金已收；已离团" },
        ] },
        { key: "jpMode", title: "2016 年末 · 对日合作基调（2018 复刻路线专属内容的前提）", def: "normal", opts: [
          { v: "normal", label: "正常合作（原创公演路线）", d: "默认：2017 主线⑥为四队原创公演" },
          { v: "replicate", label: "复刻模式（日方授权曲目）", d: "解锁 2018 复刻路线专属：红白歌会中国预赛（4月）；2017 主线⑥为四套复刻公演；《双面偶像》复刻决议自动作废" },
        ] },
        { key: "shuangmian17", title: "2017 年 8 月 · 《双面偶像》复刻决议（对日基调为原创线时生效）", def: "plan", opts: [
          { v: "plan", label: "坚持复刻到本部", d: "开启 2018 主线④「复刻《双面偶像》」（默认）" },
          { v: "giveup", label: "放弃复刻", d: "2018 无复刻主线（复刻模式下此项自动作废）" },
        ] },
        { key: "gejiahui17", title: "2017 年 11 月 · 葛佳慧的辞呈", def: "promise", opts: [
          { v: "promise", label: "承诺音乐规划", d: "开启 2018 个人专辑行动；选秀自动占位（默认）" },
          { v: "release", label: "允许支付违约金解约", d: "葛佳慧已离团；无专辑线" },
        ] },
        { key: "ajiTalk", title: "2017 年 1 月 · 阿吉的方案（卫视资源）", def: "yes", opts: [
          { v: "yes", label: "和阿吉聊到深夜", d: "结识阿吉（卫视资源图谱）；2018 年 5 月他提出辞职时留任概率 75%（默认）" },
          { v: "no", label: "今天太累了，改天再约", d: "未结识阿吉；2018 年 5 月留任概率 50%" },
        ] },
      ],
      "2019": [
        { key: "branchPost", title: "2016–2018 · 分团兼任（主线⑥分担对象）", def: "none", opts: [
          { v: "none", label: "无分团兼任", d: "主线⑥为「分担叶盛」（默认）" },
          { v: "BEJ48", label: "兼任 BEJ48（北京）", d: "主线⑥为「专注 BEJ48 事务」" },
          { v: "GNZ48", label: "兼任 GNZ48（广州）", d: "主线⑥为「专注 GNZ48 事务」" },
          { v: "SHY48", label: "兼任 SHY48（沈阳）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
          { v: "CKG48", label: "兼任 CKG48（重庆）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
        ] },
        { key: "jpMode", title: "2016 年末 · 对日合作基调（决定 2019 复刻线/TEB48 选项）", def: "normal", opts: [
          { v: "normal", label: "正常合作（原创公演路线）", d: "2019 非复刻线：王婧主持会议、无 TEB48；保分团需年末资金 1/2" },
          { v: "replicate", label: "复刻模式（日方授权曲目）", d: "2019 复刻线：子杰主持、TEB48 提议可拍板；保分团只需年末资金 1/4（日方资助）" },
        ] },
        { key: "xiiKeep18", title: "2018 年 1 月 · Team XII 的去留（张怡的请求）", def: "dissolve", opts: [
          { v: "dissolve", label: "取消 XII 编制", d: "史实路线（默认）：2018 组阁三步完成；2019 二次组阁无 XII" },
          { v: "keep", label: "保留 XII 编制", d: "XII 参与两次编组；2019 二次组阁触发「马跃：排期爆了」文案分支" },
        ] },
        { key: "gejiahui17", title: "2017 年 11 月 · 葛佳慧的辞呈", def: "promise", opts: [
          { v: "promise", label: "承诺音乐规划", d: "2018 专辑自动发行；选秀自动占位；限定团不成团默认顺延（默认）" },
          { v: "release", label: "允许支付违约金解约", d: "葛佳慧已离团；无专辑线" },
        ] },
      ],
      "2020": [
        { key: "branchPost", title: "2016–2018 · 分团兼任（主线⑥分担对象）", def: "none", opts: [
          { v: "none", label: "无分团兼任", d: "主线⑥为「分担叶盛」（默认）" },
          { v: "BEJ48", label: "兼任 BEJ48（北京）", d: "主线⑥为「专注 BEJ48 事务」；2020-03 裁撤补偿金可拍板" },
          { v: "GNZ48", label: "兼任 GNZ48（广州）", d: "主线⑥为「专注 GNZ48 事务」；解锁 2020-10 GNZ48 大重组" },
          { v: "SHY48", label: "兼任 SHY48（沈阳）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
          { v: "CKG48", label: "兼任 CKG48（重庆）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
        ] },
        { key: "jpMode", title: "2016 年末 · 对日合作基调（决定 2020 主线④和平分手）", def: "normal", opts: [
          { v: "normal", label: "正常合作（原创公演路线）", d: "2020 无 TEB48 分手主线（默认）" },
          { v: "replicate", label: "复刻模式（日方授权曲目）", d: "解锁 2020 主线④「与日方和平分手」；2019 保分团只需年末资金 1/4" },
        ] },
        { key: "xiiKeep18", title: "2018 年 1 月 · Team XII 的去留（张怡的请求）", def: "dissolve", opts: [
          { v: "dissolve", label: "取消 XII 编制", d: "史实路线（默认）：2018/2019 组阁均无 XII" },
          { v: "keep", label: "保留 XII 编制", d: "XII 视同正常本部队伍参与 2020 安置/升格/编制" },
        ] },
        { key: "gejiahui17", title: "2017 年 11 月 · 葛佳慧的辞呈", def: "promise", opts: [
          { v: "promise", label: "承诺音乐规划", d: "2018 专辑已发行；限定团默认顺延（默认）" },
          { v: "release", label: "允许支付违约金解约", d: "葛佳慧已离团；无专辑线" },
        ] },
        { key: "branch19Keep", title: "2019 序章 · 分团撤资危机", def: "giveup", opts: [
          { v: "giveup", label: "放弃分团（史实路线）", d: "SHY48/CKG48 停运；未保旗成员移籍 IDFT；孟波保旗按兼任口径落定（默认）" },
          { v: "keep", label: "保住分团", d: "SHY48/CKG48 在册分团卡维持原状；2020 序章需安置两团成员（主线①）" },
        ] },
        { key: "teb19Push", title: "2019 主线 · TEB48 筹建（仅复刻模式生效）", def: "none", opts: [
          { v: "none", label: "不推进", d: "台北未开业；2020 无 TEB48 安置（非复刻线强制此项）" },
          { v: "go", label: "拍板推进（史实路线）", d: "台北星梦剧院 2019 年内开业，首批成员 16 人建卡；2020 主线④需先安置台北成员" },
        ] },
        { key: "fengXinDuo19", title: "2019 · 冯薪朵的请缨（可选）", def: "none", opts: [
          { v: "none", label: "未触发请缨事件", d: "2020-01 恋爱风波事件不触发（默认）" },
          { v: "bej", label: "同意——兼任 BEJ48，重心分团", d: "触发 2020-01 恋爱风波事件（依例执行/当面恳谈）" },
          { v: "hq", label: "婉拒——留任本部", d: "2020-01 恋爱风波事件不触发" },
        ] },
      ],
      "2021": [
        { key: "branchPost", title: "2016–2018 · 分团兼任（主线⑥分担对象）", def: "none", opts: [
          { v: "none", label: "无分团兼任", d: "主线⑥为「分担叶盛」（默认）" },
          { v: "BEJ48", label: "兼任 BEJ48（北京）", d: "主线⑥为「专注 BEJ48 事务」；2020-03 裁撤补偿金可拍板" },
          { v: "GNZ48", label: "兼任 GNZ48（广州）", d: "主线⑥为「专注 GNZ48 事务」；解锁 2020-10 GNZ48 大重组" },
          { v: "SHY48", label: "兼任 SHY48（沈阳）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
          { v: "CKG48", label: "兼任 CKG48（重庆）", d: "含开拓者六人已随开业进驻（快速通道自动处理）" },
        ] },
        { key: "jpMode", title: "2016 年末 · 对日合作基调（决定 2020 主线④和平分手）", def: "normal", opts: [
          { v: "normal", label: "正常合作（原创公演路线）", d: "2020 无 TEB48 分手主线（默认）" },
          { v: "replicate", label: "复刻模式（日方授权曲目）", d: "解锁 2020 主线④「与日方和平分手」；2019 保分团只需年末资金 1/4" },
        ] },
        { key: "xiiKeep18", title: "2018 年 1 月 · Team XII 的去留（张怡的请求）", def: "dissolve", opts: [
          { v: "dissolve", label: "取消 XII 编制", d: "史实路线（默认）：2018/2019 组阁均无 XII" },
          { v: "keep", label: "保留 XII 编制", d: "XII 视同正常本部队伍参与 2020 安置/升格/编制与 2021 各窗口" },
        ] },
        { key: "gejiahui17", title: "2017 年 11 月 · 葛佳慧的辞呈", def: "promise", opts: [
          { v: "promise", label: "承诺音乐规划", d: "2018 专辑已发行；限定团默认顺延（默认）" },
          { v: "release", label: "允许支付违约金解约", d: "葛佳慧已离团；无专辑线" },
        ] },
        { key: "branch19Keep", title: "2019 序章 · 分团撤资危机", def: "giveup", opts: [
          { v: "giveup", label: "放弃分团（史实路线）", d: "SHY48/CKG48 停运；未保旗成员移籍 IDFT；孟波保旗按兼任口径落定（默认）" },
          { v: "keep", label: "保住分团", d: "SHY48/CKG48 在册分团卡维持原状；2021 分团旗号延续（CKG48 五期照常入册）" },
        ] },
        { key: "teb19Push", title: "2019 主线 · TEB48 筹建（仅复刻模式生效）", def: "none", opts: [
          { v: "none", label: "不推进", d: "台北未开业；2020 无 TEB48 安置（非复刻线强制此项）" },
          { v: "go", label: "拍板推进（史实路线）", d: "台北星梦剧院 2019 年内开业，首批成员 16 人建卡；2021 台北收入延续" },
        ] },
        { key: "fengXinDuo19", title: "2019 · 冯薪朵的请缨（可选）", def: "none", opts: [
          { v: "none", label: "未触发请缨事件", d: "2020-01 恋爱风波事件不触发（默认）" },
          { v: "bej", label: "同意——兼任 BEJ48，重心分团", d: "触发 2020-01 恋爱风波事件（依例执行/当面恳谈）" },
          { v: "hq", label: "婉拒——留任本部", d: "2020-01 恋爱风波事件不触发" },
        ] },
        { key: "gen1", title: "2020 主线⑤ · 一期生合约安置（快速默认）", def: "renew", opts: [
          { v: "renew", label: "全员续约留任", d: "快速通道默认：一期生全部留任（正常游玩为逐人拍板）" },
          { v: "grad", label: "全员谢幕毕业", d: "一期生全员毕业（荣誉毕业生，不再在籍）" },
        ] },
      ],
      "2027": [
        { key: "camp26Final", title: "2026 年末 · 理念阵营结算", def: "balance", opts: [
          { v: "balance", label: "平票（平衡派）", d: "王婧拍板主线一「WHN48 年内落地」（默认）" },
          { v: "wang", label: "王婧遗志派占上风", d: "主线一「WHN48 年内落地」确立" },
          { v: "tao", label: "陶莺实权派占上风", d: "武汉今年不立项（无主线一，守成路线）" },
        ] },
        { key: "cgtPath", title: "2026 年 · 成都 CGT48 的命运", def: "rebuild", opts: [
          { v: "rebuild", label: "重建成效", d: "成都剧院重启，每月继续创收（默认）" },
          { v: "dissolve", label: "解散安置", d: "前成员妥善安置；2027 叙事按「安置收尾」口径分叉" },
        ] },
        { key: "jjyEnd", title: "2026 年 6 月 · 鞠婧祎合约官司结局", def: "cinema", opts: [
          { v: "cinema", label: "重新签约·转入影视部", d: "荣誉殿堂·影视部；2027 影视部主线的谈话对象（默认）" },
          { v: "buyout", label: "违约金解约，好聚好散", d: "资金+200万；2027 影视部主线对象为孙珍妮、陆婷玉" },
          { v: "lose", label: "公司败诉，合作关系终止", d: "2027 影视部主线对象为孙珍妮、陆婷玉" },
        ] },
      ],
    };
    const groups = GROUPS[era] || [];
    const state = {};
    for (const g of groups) state[g.key] = g.def;
    const c = this.card("快速通道 · 补选关键决策（" + era + " 年开局）",
      "从中间年份开局将跳过此前年份的剧情——以下是影响 " + era + " 年剧情走向的关键决策，已按史实默认预选，可自行调整后开工。");
    c.appendChild(this.el("div", "fast-warn",
      "⚠ 使用快速通道可能导致花名册错乱、未知 bug 增加等情况——推荐玩家从头开始经营。"));
    const wrap = this.el("div", "");
    for (const g of groups) {
      const title = this.el("div", "ft-group-title", g.title);
      wrap.appendChild(title);
      const box = this.el("div", "modal-choices ft-group");
      for (const o of g.opts) {
        const b = this.el("button", "ft-opt" + (state[g.key] === o.v ? " on" : ""), "");
        b.innerHTML = "<b>" + o.label + "</b><span>" + o.d + "</span>";
        b.onclick = () => {
          state[g.key] = o.v;
          for (const x of box.children) x.classList.remove("on");
          b.classList.add("on");
        };
        box.appendChild(b);
      }
      wrap.appendChild(box);
    }
    c.appendChild(wrap);
    const confirm = this.el("button", "btn btn-primary modal-close", "确认补选，进入 " + era + " 序章 →");
    confirm.onclick = () => {
      this.closeModal();
      onDone(state);
    };
    c.appendChild(confirm);
    this.modal(c);
  },

  showPrologue() {
    this.showScreen("screen-vn");
    /* 按 era 取对应序章（2016 任职会议 / 2017 本部新章 / 2018 星阵重列 / 2019 双岸 / 2026 临危受命 / 2027 年度决策会议） */
    const pro = Game.st.era === "2027" ? STORY.prologue27
      : Game.st.era === "2026" ? STORY.prologue26
      : Game.st.era === "2021" ? STORY.prologue21
      : Game.st.era === "2020" ? STORY.prologue20
      : Game.st.era === "2019" ? STORY.prologue19
      : Game.st.era === "2018" ? STORY.prologue18
      : Game.st.era === "2017" ? STORY.prologue17
      : STORY.prologue;
    const rawPages = typeof pro.pages === "function" ? pro.pages(Game.st) : pro.pages;   // 序章页面支持按状态定制（2017 分团线交接）
    const pages = rawPages.map(p => ({ ...p, t: Game.fmt(p.t), s: p.s ? Game.fmt(p.s) : p.s }));
    const label = this.$("vn-scene-label");
    label.textContent = pro.sceneLabel;
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let idx = 0;

    const renderPage = () => {
      body.innerHTML = "";
      footer.innerHTML = "";
      const p = pages[idx];
      const hint = this.el("div", "vn-hint", "点击画面继续 ▼");
      if (p.nar) {
        body.appendChild(this.el("div", "vn-text narration", p.t));
      } else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(hint);
    };

    const startClosing = () => {
      /* closing 支持数组或函数（2026 线按会后抉择分支） */
      const rawClosing = typeof pro.closing === "function" ? pro.closing(Game.st) : pro.closing;
      const closing = rawClosing.map(p => ({ ...p, t: Game.fmt(p.t) }));
      this.playVNFull(closing, pro.sceneLabel, () => this.enterGame(true));
    };

    /* 序章后的「路线抉择」：支持单轮（pro.pathChoice，2026/2027 旧格式）与多轮队列
       （pro.pathChoices，2019：TEB48 去留 + 分团撤资危机；每轮可声明 gate 整轮跳过）。
       2016 线无此环节。 */
    const runPathChoices = (queue) => {
      const pc = queue && queue.length ? queue[0] : null;
      if (!pc) { startClosing(); return; }
      const rest = queue.slice(1);
      if (pc.gate && !pc.gate(Game.st)) { runPathChoices(rest); return; }   // 整轮 gate（2019 TEB48 仅复刻线）
      body.onclick = null;
      const after = (pc.after || []).map(p => ({ ...p, t: Game.fmt(p.t) }));
      const renderChoices = () => {
        footer.innerHTML = "";
        const box = this.el("div", "vn-choices");
        let any = false;
        for (const c of pc.choices) {
          if (c.gate && !c.gate(Game.st)) continue;   // 单个选项也可声明 gate
          any = true;
          const hintTxt = typeof c.hint === "function" ? c.hint(Game.st) : (c.hint || "");
          const b = this.el("button", "vn-choice", c.label + "　—— " + hintTxt);
          b.onclick = (e) => {
            e.stopPropagation();
            if (c.tag) Game.recordDecision(c.tag, c.value !== undefined ? c.value : c.id);
            Game.logTermChoice((typeof pc.sceneLabel === "function" ? pc.sceneLabel(Game.st) : (pc.sceneLabel || (typeof pro.sceneLabel === "function" ? pro.sceneLabel(Game.st) : pro.sceneLabel))) , c.label);   // 总结任期：抉择记录
            const rt = c.apply(Game.st);
            const resultPages = [{ nar: true, t: rt }].concat(after);
            this.playVNFull(resultPages, pro.sceneLabel, () => runPathChoices(rest));
          };
          box.appendChild(b);
        }
        if (!any) { runPathChoices(rest); return; }   // 全部选项被 gate 掉 → 跳过本轮
        footer.appendChild(box);
      };
      /* 本轮抉择的引入页（可选） */
      if (pc.pages) {
        const pcPages = (typeof pc.pages === "function" ? pc.pages(Game.st) : pc.pages).map(p => ({ ...p, t: Game.fmt(p.t), s: p.s ? Game.fmt(p.s) : p.s }));
        this.playVNFull(pcPages, (typeof pc.sceneLabel === "function" ? pc.sceneLabel(Game.st) : (pc.sceneLabel || pro.sceneLabel)), renderChoices);
      } else renderChoices();
    };

    const showStyleChoice = () => {
      footer.innerHTML = "";
      body.onclick = null;
      const box = this.el("div", "vn-choices");
      for (const s of pro.styles) {
        const b = this.el("button", "vn-choice", s.label + "　—— " + s.hint);
        b.onclick = (e) => {
          e.stopPropagation();
          Game.applyStyle(s.id);
          runPathChoices(pro.pathChoices ? pro.pathChoices.slice() : (pro.pathChoice ? [pro.pathChoice] : []));
        };
        box.appendChild(b);
      }
      footer.appendChild(box);
    };

    body.onclick = () => {
      if (idx < pages.length - 1) { idx++; renderPage(); }
      else showStyleChoice();
    };
    renderPage();
  },

  /* 全屏 VN 播放器（序章后半 / 复用屏幕三） */
  playVNFull(pages, sceneLabel, onDone) {
    this.showScreen("screen-vn");
    this.$("vn-scene-label").textContent = sceneLabel || "";
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let idx = 0;
    const render = () => {
      body.innerHTML = ""; footer.innerHTML = "";
      const p = pages[idx];
      if (p.nar) body.appendChild(this.el("div", "vn-text narration", p.t));
      else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(this.el("div", "vn-hint", "点击画面继续 ▼"));
    };
    body.onclick = () => {
      if (idx < pages.length - 1) { idx++; render(); }
      else { body.onclick = null; if (onDone) onDone(); }
    };
    render();
  },

  /* 行动剧情场景播放器（分团主线各阶段、走访小剧场共用）。
     scene 结构：{ label, pages, choices?, after? }
       pages  先播放；播完若有 choices 显示选项（apply(st) 返回结算文本，
              会记入日志），结算文本作为旁白页接在 after 页之前播放。
     播放完毕自动回到经营界面再回调 onDone。 */
  playScene(scene, onDone) {
    const st = Game.st;
    /* 2027 线状态无 st.branch（分团筹备是 2016 线字段），取值兜底 */
    const fmt = t => Game.fmt(t, { city: (st.branch && st.branch.city) || "目的地" });
    const rawPages = typeof scene.pages === "function" ? scene.pages(st) : (scene.pages || []);
    const main = rawPages.map(p => ({ ...p, t: fmt(p.t), s: p.s ? fmt(p.s) : p.s }));
    const after = (scene.after || []).map(p => ({ ...p, t: fmt(p.t), s: p.s ? fmt(p.s) : p.s }));
    this.showScreen("screen-vn");
    this.$("vn-scene-label").textContent = scene.label ? fmt(scene.label) : "";
    const body = this.$("vn-body");
    const footer = this.$("vn-footer");
    let queue = main, idx = 0;

    const render = () => {
      body.innerHTML = ""; footer.innerHTML = "";
      const p = queue[idx];
      if (p.nar) body.appendChild(this.el("div", "vn-text narration", p.t));
      else {
        const wrap = this.el("div", "vn-page");
        wrap.appendChild(this.el("span", "vn-speaker " + (p.cls || ""), p.s));
        wrap.appendChild(this.el("div", "vn-text", p.t));
        body.appendChild(wrap);
      }
      footer.appendChild(this.el("div", "vn-hint", "点击画面继续 ▼"));
      body.onclick = () => {
        if (idx < queue.length - 1) { idx++; render(); return; }
        if (queue === main && scene.choices && scene.choices.length) { showChoices(); return; }
        if (queue === main && after.length) { queue = after; idx = 0; render(); return; }
        this.showScreen("screen-game");
        if (onDone) onDone();
      };
    };
    const showChoices = () => {
      body.onclick = null; footer.innerHTML = "";
      const box = this.el("div", "vn-choices");
      for (const ch of scene.choices) {
        /* hint 支持函数形式（动态文本） */
        const hintTxt = typeof ch.hint === "function" ? ch.hint(Game.st) : (ch.hint || "");
        const b = this.el("button", "vn-choice", ch.label + (hintTxt ? "　—— " + hintTxt : ""));
        b.onclick = (e) => {
          e.stopPropagation();
          if (ch.tag) Game.recordDecision(ch.tag, ch.value !== undefined ? ch.value : ch.id);   // 决策标签登记
          Game.logTermChoice(typeof scene.label === "function" ? scene.label(st) : scene.label, ch.label);   // 总结任期：抉择记录
          const rt = ch.apply(Game.st);   // 选项效果落地
          Game.logChoice(rt);             // 结算文本记入当月日志
          queue = [{ nar: true, t: rt }, ...after];
          idx = 0;
          render();
        };
        box.appendChild(b);
      }
      footer.appendChild(box);
    };
    render();
  },

  /* ---------------- 经营主界面 ---------------- */

  enterGame(isNew) {
    this.showScreen("screen-game");
    this._memberFilter = "all";
    /* monthStart 有幂等保护：新开局/推进到新月/中途读档三种进入方式都安全 */
    const steps = Game.monthStart();
    this.playSteps(steps, () => this.renderGame());
  },

  renderGame() {
    const st = Game.st;
    this.renderHUD();
    this.renderBoard();
    this.renderMembers();
    this.renderLog();
    this.switchTab("board");
  },

  renderHUD() {
    const st = Game.st;
    this.$("hud-date").textContent = Game.dateLabel();
    // 行动点
    let apHtml = "";
    for (let i = 0; i < 3; i++) apHtml += i < st.ap ? '<span class="ap-on">●</span>' : '<span class="ap-off">○</span>';
    this.$("hud-ap").innerHTML = "行动 " + apHtml;
    // 资源
    const chips = [
      { label: "资金", val: st.money + "万", cls: "v-money", warn: st.money <= 60 },
      { label: "热度", val: st.heat, cls: "v-heat", warn: false },
      { label: "士气", val: st.morale, cls: "v-morale", warn: st.morale < 40 },
      { label: "叶盛负担", val: st.burden, cls: "v-burden", warn: st.burden >= 80 },
      { label: "训练度", val: st.train, cls: "v-train", warn: false },
    ];
    if (st.era === "2017" || st.era === "2027") chips.push({ label: "平均实力", val: Game.avgPwr(st), cls: "v-train", warn: false });
    this.$("hud-res").innerHTML = chips.map(c =>
      '<div class="res-chip"><div class="res-label">' + c.label + '</div><div class="res-value ' + c.cls + (c.warn ? " warn" : "") + '">' + c.val + "</div></div>"
    ).join("");
  },

  renderBoard() {
    const st = Game.st;
    const box = this.$("quest-cards");
    box.innerHTML = "";

    /* 【全线通用】公演站位看板提示（用户口径 2026-10-26）：总选后显示拍板进度 */
    if (st.geDone && st.flags.stageSettled !== st.era && Game.stageTeams(st).length) {
      const teams = Game.stageTeams(st);
      const stg = Game.stageInit(st);
      const doneN = teams.filter(t => stg.done[t]).length;
      const c = this.el("div", "quest-card");
      const head = this.el("div", "quest-head", this.el("span", "quest-name", "公演站位调整"));
      head.appendChild(this.el("span", "quest-tag " + (doneN >= teams.length ? "q-done" : "q-open"), doneN >= teams.length ? "已完成" : "进行中"));
      c.appendChild(head);
      c.appendChild(this.el("div", "quest-detail",
        "已拍板 " + doneN + " / " + teams.length + " 队" +
        (teams.length - doneN > 0 ? "，还有 " + (teams.length - doneN) + " 队未拍板（每队 1 行动点；年末未拍板队伍将按总选成绩自动排站）" : "（可重排，每队 1 行动点）")));
      box.appendChild(c);
    }

    /* ============ 2026 线：四条主线看板 ============ */
    if (st.era === "2026") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① 年度活动（总选举 + 金曲大赏，营业不佳会取消） */
      const b1 = this.el("div", "quest-desc",
        (st.geDone ? "总选举 ✔（第一名：" + st.geResult.top1 + "）" : "总选举 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtCancelled ? "金曲大赏 ✘ 已被陶莺取消" : st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线① · 年度活动策划",
        st.geDone && (st.rtDone || st.rtCancelled) ? "✔ 已了结" : "进行中",
        st.geDone && (st.rtDone || st.rtCancelled) ? "q-done" : "q-open", b1));
      /* 主线② 分担叶盛 */
      const b2bar = this.el("div", "mc-bar bond"); b2bar.innerHTML = "<i style=\"width:" + (100 - st.burden) + "%\"></i>";
      const b2 = this.el("div", "");
      b2.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
      b2.appendChild(b2bar);
      box.appendChild(mkCard("主线② · 分担叶盛",
        st.burden <= 30 ? "✔ 负担已减至低位" : st.burden >= 80 ? "⚠ 负担过重" : "进行中",
        st.burden <= 30 ? "q-done" : st.burden >= 80 ? "q-open" : "", b2));
      /* 主线③ 末位淘汰（陶莺机制） */
      const done3 = st.elim.executed + st.elim.transferred;
      const b3 = this.el("div", "quest-desc",
        "已执行 " + st.elim.executed + " 次 · 调往CGT48 " + st.elim.transferred + " 人 · 缓刑 " + st.elim.defied + " 次"
        + (st.elim.defied >= 2 ? "　⚠ 陶莺的耐心正在耗尽" : ""));
      box.appendChild(mkCard("主线③ · 执行末位淘汰",
        done3 >= 3 ? "✔ 陶总认可" : "评审 ×" + Math.max(0, 3 - done3) + " 待执行", done3 >= 3 ? "q-done" : "q-open", b3));
      /* 主线④ CGT48 重建（解散路线变更为「安置前成员」） */
      if (st.cgt.closed) {
        const n4 = st.cgt.settled || 0;
        const bar4b = this.el("div", "mc-bar bond"); bar4b.innerHTML = "<i style=\"width:" + Math.round(n4 / 3 * 100) + "%\"></i>";
        const b4b = this.el("div", "");
        b4b.appendChild(bar4b);
        b4b.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "安置进度（3批）"), this.el("span", "", n4 + "/3")]));
        b4b.appendChild(this.el("div", "quest-detail",
          st.cgt.settleDone ? "✔ 前成员已全部妥善安置" : "通过「安置CGT48前成员」行动，为前成员安排转型与本部考核"));
        box.appendChild(mkCard("主线④ · 安置CGT48前成员",
          st.cgt.settleDone ? "✔ 安置完成" : "进行中", st.cgt.settleDone ? "q-done" : "q-open", b4b));
        this.renderActions();
        return;
      }
      const dots4 = this.el("div", "quest-progress");
      for (let i = 1; i <= 4; i++) dots4.appendChild(this.el("div", "p-dot" + (st.cgt.stage >= i ? " on" : "")));
      const b4 = this.el("div", "");
      b4.appendChild(dots4);
      b4.appendChild(this.el("div", "quest-detail",
        st.cgt.open ? "✔ 重启首演已于 " + st.cgt.openMonth + " 月落幕" : st.cgt.stage >= 4 ? "重建就绪，本月末重启首演！" : "目标：年内让成都的剧场重新亮灯"));
      box.appendChild(mkCard("主线④ · CGT48 重建",
        st.cgt.open ? "✔ 已重启" : st.cgt.stage >= 4 ? "待首演" : "目标：重启首演", st.cgt.open ? "q-done" : "q-open", b4));
      this.renderActions();
      return;
    }

    /* ============ 2027 线（大河新篇）：五条主线看板 ============ */
    if (st.era === "2027") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① WHN48·武汉（仅王婧派/平衡派：flags.wh27Main） */
      if (st.flags.wh27Main) {
        const dots27 = this.el("div", "quest-progress");
        for (let i = 1; i <= 3; i++) dots27.appendChild(this.el("div", "p-dot" + (st.branch27.stage >= i ? " on" : "")));
        const b1 = this.el("div", "");
        b1.appendChild(this.el("div", "quest-detail",
          st.branch27.open ? "✔ " + st.branch27.openMonth + " 月首演亮灯（每月+25万收入）" :
          st.branch27.stage === 0 ? "立项启动 → 剧场改造（需资金≥220万）→ 招募集训（需士气≥55）" :
          st.branch27.stage === 1 ? "剧场改造中（需资金≥220万，投入200万）" :
          st.branch27.stage === 2 ? "招募集训中（需士气≥55）" : "筹备就绪，本月末首演亮灯！"));
        b1.appendChild(dots27);
        box.appendChild(mkCard("主线① · WHN48 年内落地",
          st.branch27.open ? "✔ 江城的灯亮了" : st.branch27.stage >= 3 ? "待首演" : "进行中",
          st.branch27.open ? "q-done" : "q-open", b1));
      } else {
        const b0 = this.el("div", "quest-detail",
          "今年没有新团立项（陶总拍板：把已有的灯守亮）——武汉的档案袋，在王总办公室里留到了下一年");
        box.appendChild(mkCard("主线① · 年度基调 · 守成", "陶莺路线", "q-open", b0));
      }
      /* 主线② 影视部焕新 */
      const filmStageTxt = st.film.done ? "✔ 项目已播出（" + st.film.doneMonth + " 月开播）"
        : st.film.stage === 3 ? "已杀青，本月末开播！" :
        st.film.stage === 2 ? "开机拍摄中（需资金≥120万，投入100万）" :
        st.film.stage === 1 ? "项目遴选（冲奖大制作 60万 / 网剧快跑 30万）" : "立项会谈（谈话对象：" + Game.filmLeadName(st) + "）";
      const b2 = this.el("div", "quest-detail", filmStageTxt);
      box.appendChild(mkCard("主线② · 影视部焕新",
        st.film.done ? "✔ 重新点亮" : st.film.stage >= 3 ? "待开播" : "进行中",
        st.film.done ? "q-done" : "q-open", b2));
      /* 主线③ 提升团队实力 */
      const growth27 = Game.avgPwr(st) - (st.pwrBase || 0);
      const bar3b = this.el("div", "mc-bar pop"); bar3b.innerHTML = "<i style=\"width:" + Game.avgPwr(st) + "%\"></i>";
      const b3 = this.el("div", "");
      b3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "全团平均实力"), this.el("span", "", Game.avgPwr(st) + "（较年初 " + (growth27 >= 0 ? "+" : "") + growth27 + "）")]));
      b3.appendChild(bar3b);
      box.appendChild(mkCard("主线③ · 提升团队实力",
        growth27 >= 5 ? "✔ 淬炼有成" : "进行中", growth27 >= 5 ? "q-done" : "q-open", b3));
      /* 主线④ 分担叶盛 */
      const bar4b = this.el("div", "mc-bar bond"); bar4b.innerHTML = "<i style=\"width:" + (100 - st.burden) + "%\"></i>";
      const b4 = this.el("div", "");
      b4.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
      b4.appendChild(bar4b);
      box.appendChild(mkCard("主线④ · 分担叶盛",
        st.burden <= 30 ? "✔ 负担已减至低位" : st.burden >= 80 ? "⚠ 负担过重" : "进行中",
        st.burden <= 30 ? "q-done" : "q-open", b4));
      /* 主线⑤ 年度活动 */
      const b5 = this.el("div", "quest-desc",
        (st.geDone ? "总决选 ✔（第一名：" + st.geResult.top1 + "）" : "总决选 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtCancelled ? "金曲大赏 ✘ 已被取消" : st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线⑤ · 年度活动筹备",
        st.geDone && (st.rtDone || st.rtCancelled) ? "✔ 已了结" : "进行中",
        st.geDone && (st.rtDone || st.rtCancelled) ? "q-done" : "q-open", b5));
      this.renderActions();
      return;
    }

    /* ============ 2017 线（本部新章）：六条主线看板 ============ */
    if (st.era === "2017") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① 双团开设 */
      const b17 = st.branch17;
      const ckgReady = b17.ckg >= 3 && !b17.ckgOpen;   // 筹备完成、按史实节奏等 10 月开业
      const dots17 = this.el("div", "quest-progress");
      for (let i = 1; i <= 3; i++) dots17.appendChild(this.el("div", "p-dot" + (b17.ckg >= i || ckgReady ? " on" : "")));
      const b1 = this.el("div", "");
      b1.appendChild(this.el("div", "quest-detail",
        "SHY48（沈阳）：" + (b17.shyOpen ? "✔ " + b17.shyOpenMonth + " 月开业首演" : b17.shy >= 1 ? "筹备就绪，月末开业" : "剧场筹备中（目标：1月首演）")));
      b1.appendChild(dots17);
      b1.appendChild(this.el("div", "quest-detail",
        "CKG48（重庆）：" + (b17.ckgOpen ? "✔ " + b17.ckgOpenMonth + " 月开业首演"
        : ckgReady ? "✔ 筹备完成——按史实节奏 10 月末开业首演，静待档期"
        : "筹备阶段 " + b17.ckg + "/3（目标：10月末首演）")));
      box.appendChild(mkCard("主线① · 双团开设",
        b17.shyOpen && b17.ckgOpen ? "✔ 四城灯已亮" : ckgReady ? "待开业（10月）" : "进行中",
        b17.shyOpen && b17.ckgOpen ? "q-done" : "q-open", b1));
      /* 主线② 年度活动 */
      const b2 = this.el("div", "quest-desc",
        (st.geDone ? "总决选 ✔（第一名：" + st.geResult.top1 + "）" : "总决选 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线② · 年度大活动",
        st.geDone && st.rtDone ? "✔ 已了结" : "进行中", st.geDone && st.rtDone ? "q-done" : "q-open", b2));
      /* 主线③ 成员实力 */
      const growth = Game.avgPwr(st) - (st.pwrBase || 0);
      const bar3 = this.el("div", "mc-bar pop"); bar3.innerHTML = "<i style=\"width:" + Game.avgPwr(st) + "%\"></i>";
      const b3 = this.el("div", "");
      b3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "全团平均实力"), this.el("span", "", Game.avgPwr(st) + "（较年初 " + (growth >= 0 ? "+" : "") + growth + "）")]));
      b3.appendChild(bar3);
      box.appendChild(mkCard("主线③ · 提升成员实力",
        growth >= 5 ? "✔ 淬炼有成" : "进行中", growth >= 5 ? "q-done" : "q-open", b3));
      /* 主线④ 分担叶盛（分团线：专注对应分团事务） */
      const dutyPost = Game.branchDutyPost(st);
      const bar4 = this.el("div", "mc-bar bond"); bar4.innerHTML = "<i style=\"width:" + (100 - st.burden) + "%\"></i>";
      const b4 = this.el("div", "");
      b4.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", dutyPost ? dutyPost + "的事务压力" : "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
      b4.appendChild(bar4);
      box.appendChild(mkCard(dutyPost ? "主线④ · 专注" + dutyPost + "事务" : "主线④ · 分担叶盛",
        st.burden <= 30 ? "✔ 负担已减至低位" : st.burden >= 80 ? "⚠ 负担过重" : "进行中",
        st.burden <= 30 ? "q-done" : "", b4));
      /* 主线⑤ 团体影响力 */
      const marks = [
        st.flags.tvCny ? "卫视春晚×" + st.flags.tvCny : null,
        st.flags.s7 ? "7SENSES" : null,
        st.flags.aji ? "阿吉资源线" : null,
        st.heat >= 80 ? "热度长红" : null,
      ].filter(Boolean);
      const b5 = this.el("div", "quest-detail", "当前热度 " + st.heat + " / 100" + (marks.length ? "　|　里程碑：" + marks.join(" · ") : "　|　提示：会后找工作人员阿吉谈谈"));
      box.appendChild(mkCard("主线⑤ · 提高团体影响力",
        st.heat >= 80 ? "✔ 影响力出圈" : "进行中", st.heat >= 80 ? "q-done" : "q-open", b5));
      /* 主线⑥ 原创公演（复刻模式：四套新复刻公演） */
      const rep17 = Game.isReplicate(st);
      const b6 = this.el("div", "quest-detail",
        ["SII", "NII", "HII", "X"].map(t => (st.orig[t] ? "✔ " : "○ ") + t).join("　")
        + "　|　已完成 " + Game.origCount(st) + "/4 套（" + (rep17 ? "山本学：让它们像自己的舞台一样立起来" : "王子杰：自己的歌，才是根") + "）");
      box.appendChild(mkCard(rep17 ? "主线⑥ · 四套新复刻公演" : "主线⑥ · 四队原创公演",
        Game.origCount(st) >= 4 ? "✔ 全部首演" : "进行中", Game.origCount(st) >= 4 ? "q-done" : "q-open", b6));
      this.renderActions();
      return;
    }

    /* ============ 2018 线（星阵重列）：六条主线看板 ============ */
    if (st.era === "2018") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      const r18 = st.reorg18;
      const kept18 = !!st.flags.xiiKept18;
      /* 主线① 全团大重组（保留XII为四步，取消为三步） */
      const steps18 = kept18 ? 4 : 3;
      const dots18 = this.el("div", "quest-progress");
      for (let i = 1; i <= steps18; i++) dots18.appendChild(this.el("div", "p-dot" + (r18.stage >= i ? " on" : "")));
      const b1 = this.el("div", "");
      b1.appendChild(this.el("div", "quest-detail", r18.done
        ? "✔ 新编制名单已公布——" + (kept18 ? "Team XII 保留" : "Team XII 完成历史使命") + " · Team FT 成立，星阵重列"
        : r18.stage >= 2
        ? "编制会待开：逐人定队（每队13~20人）+ 队长队副任命，确认后公布名单"
        : (kept18 ? "编制对象：SII / NII / HII / X / XII / FT / 预备生（含 XII 编制确认）" : "编制对象：SII / NII / HII / X / FT / 预备生")));
      b1.appendChild(dots18);
      box.appendChild(mkCard("主线① · 全团大重组", r18.done ? "✔ 组阁落地" : kept18 ? "保留XII" : "XII谢幕", r18.done ? "q-done" : "q-open", b1));
      /* 主线② 预备生汇报公演 */
      const p18 = st.prep18;
      box.appendChild(mkCard("主线② · 预备生汇报公演",
        p18.promoted >= 5 ? "✔ 新星升格" : p18.sys ? "制度运行中" : "待推行",
        p18.promoted >= 5 ? "q-done" : "q-open",
        this.el("div", "quest-detail", "舞台总监马跃每四个月汇报公演情况：表现优异的预备生由总监定队升格（含分团上调）——年内升格 " + p18.promoted + " / 5 人")));
      /* 主线③ 年度活动筹备 */
      const geTip = "（任意成员完成总选连霸，即升入荣誉殿堂）";
      const b18_3 = this.el("div", "");
      b18_3.appendChild(this.el("div", "quest-desc",
        (st.geDone ? "总决选 ✔（第一名：" + st.geResult.top1 + "）" : "总决选 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100")));
      if (!st.geDone || !st.rtDone) {
        const bar18ge = this.el("div", "mc-bar pop"); bar18ge.innerHTML = "<i style=\"width:" + (st.geDone ? 100 : st.gePlan) + "%\"></i>";
        b18_3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "总决选筹备度"), this.el("span", "", st.geDone ? "✔" : st.gePlan + "/100")]));
        b18_3.appendChild(bar18ge);
        const bar18rt = this.el("div", "mc-bar bond"); bar18rt.innerHTML = "<i style=\"width:" + (st.rtDone ? 100 : st.rtPlan) + "%\"></i>";
        b18_3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "金曲大赏筹备度"), this.el("span", "", st.rtDone ? "✔" : st.rtPlan + "/100")]));
        b18_3.appendChild(bar18rt);
      }
      b18_3.appendChild(this.el("div", "quest-detail", "总选举（7月「砥砺前行」）+ 金曲大赏（12月）" + geTip));
      box.appendChild(mkCard("主线③ · 年度活动筹备",
        st.geDone && st.rtDone ? "✔ 双活动收官" : st.geDone ? "总选已落幕" : "进行中", st.geDone && st.rtDone ? "q-done" : "q-open",
        b18_3));
      /* 主线④ 复刻双面偶像（仅 shuangmian17=plan） */
      if (st.decisions.shuangmian17 === "plan") {
        const sm = st.sm18;
        box.appendChild(mkCard("主线④ · 复刻《双面偶像》", sm.done ? "✔ 首演落幕" : sm.team ? "承办：" + sm.team : "待立项", sm.done ? "q-done" : "q-open",
          this.el("div", "quest-detail", sm.done ? "✔ " + sm.team + " 承办复刻成功——广州的舞台在上海重生" : sm.team ? "排练推进中（队伍平均实力 " + Game.avgTeamPwr(st, sm.team) + " 影响效果）" : "选定承办队伍后立项（队伍平均实力影响复刻效果）")));
      }
      /* 主线⑤ 备战鹅厂选秀 */
      const s18 = st.show18;
      box.appendChild(mkCard("主线⑤ · 备战鹅厂选秀",
        s18.done && (!st.decisions.gejiahui17 || st.decisions.gejiahui17 !== "promise" || s18.album) ? (st.decisions.gejiahui17 === "promise" ? "✔ 出征+专辑" : "✔ 首轮录制") : s18.done ? "录制完成" : s18.squad ? "集训中" : "待点将",
        s18.done && (st.decisions.gejiahui17 !== "promise" || s18.album) ? "q-done" : "q-open",
        this.el("div", "quest-detail", s18.done
          ? "✔ 派遣 " + (s18.squad ? s18.squad.length : 0) + " 人完成首轮录制" + (st.decisions.gejiahui17 === "promise" && !s18.album ? "——别忘了个人的约定：为葛佳慧发行专辑" : "")
          : s18.squad ? "封闭集训推进中" : "派遣至少 11 人出征" + (st.decisions.gejiahui17 === "promise" ? "（葛佳慧自动占一席）" : ""))));
      /* 主线⑥ 分担叶盛/分担分团 */
      const dutyPost18 = Game.branchDutyPost(st);
      box.appendChild(mkCard(dutyPost18 ? "主线⑥ · 分担分团（" + dutyPost18 + "）" : "主线⑥ · 分担叶盛",
        "常设", "q-open", this.el("div", "quest-detail", dutyPost18 ? "分团巡访与事务值班：兼顾" + dutyPost18 + "的日常" : "走访成员与替叶盛值班，给大管家松绑")));
      this.renderActions();
      return;
    }

    /* ============ 2020 线（共渡）：疫情年看板 ============ */
    /* ============ 2021 线（春潮）：四条主线看板 ============ */
    if (st.era === "2021") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      const dots = (n, cur) => {
        const d = this.el("div", "quest-progress");
        for (let i = 1; i <= n; i++) d.appendChild(this.el("div", "p-dot" + (cur >= i ? " on" : "")));
        return d;
      };
      /* 经济态势 */
      box.appendChild(mkCard("经济态势 · 春潮", st.month <= 3 ? "疫情收尾" : "全面恢复", "q-open",
        this.el("div", "quest-detail", st.month <= 3 ? "1~3 月：收益八折（支出正常）——剧场灯亮了，但账要慢半拍" : "4 月起：线上线下双轨全面恢复")));
      /* 主线① 电商领域 */
      const aw = st.aw9shop21;
      const bAw = this.el("div", "");
      bAw.appendChild(this.el("div", "quest-detail", aw.done ? "✔ AW9 电商直播常态化运营（每月 +15 万）" : "三段：直播间搭建 → 首播 → 常态化运营"));
      if (!aw.done) bAw.appendChild(dots(3, aw.stage));
      bAw.appendChild(this.el("div", "quest-detail", "AW9 满员机制：正式成员 " + (st.decisions.unitsAW9 || []).length + " 人 / 预备役 " + (st.decisions.unitsAW9R || []).length + " 人——正式成员不在籍时预备役最高人气顶上"));
      box.appendChild(mkCard("主线① · 拓展电商领域", aw.done ? "✔ 常态化运营" : "进行中", aw.done ? "q-done" : "q-open", bAw));
      /* 主线② 疫苗 */
      const vac = st.vaccine21;
      const bVac = this.el("div", "");
      bVac.appendChild(this.el("div", "quest-detail", vac.done ? "✔ 全团两针接种 100%——后续月度疫情文案分叉已开" : "两针：集体预约接种 → 第二针收官"));
      if (!vac.done) bVac.appendChild(dots(2, vac.stage));
      box.appendChild(mkCard("主线② · 注射疫苗", vac.done ? "✔ 全员两针" : "进行中", vac.done ? "q-done" : "q-open", bVac));
      /* 主线③ 海外选秀 */
      const gp = st.gp21;
      const bGp = this.el("div", "");
      bGp.appendChild(this.el("div", "quest-detail", gp.done ? "✔ 出征集训完成（" + (st.decisions.gp21Squad || []).join("、") + "）" : gp.stage === 0 ? "名额传达：5 个名额，总监点将" : "出征集训"));
      if (!gp.done) bGp.appendChild(dots(2, gp.stage));
      box.appendChild(mkCard("主线③ · 备战海外选秀", gp.done ? "✔ 征训完成" : "进行中", gp.done ? "q-done" : "q-open", bGp));
      /* 主线④ 年度活动筹备 */
      const ep = st.eventplan21;
      box.appendChild(mkCard("主线④ · 年度活动筹备（邓森林）", ep.done ? "✔ 风险预案与排期定稿" : "待推进", ep.done ? "q-done" : "q-open",
        this.el("div", "quest-detail", ep.done ? "✔ 年度活动风险预案与筹备排期已定稿" : "会后与邓森林商议：风险预案 → 筹备排期")));
      /* 年度活动（总选/金曲/最佳拍档组队） */
      const b21act = this.el("div", "");
      const mode21 = st.decisions.geMode21 === "partner" ? "《最佳拍档》改造总选（组队制，8月开榜·公开前33名）"
        : st.decisions.geMode21 === "classic" ? "传统总选「投票给作品」+《最佳拍档》独立综艺（6月开榜·前五）" : "年度活动方案未拍板";
      b21act.appendChild(this.el("div", "quest-detail",
        mode21 + "　|　" +
        (st.geDone ? "总决选 ✔（第一名：" + (st.geResult && st.geResult.top1 || "——") + "）" : st.decisions.geMode21 === "partner" ? "总决选 8 月开榜" : "总决选 8 月开榜")
        + "　|　" +
        (st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月")));
      if (st.decisions.geMode21) {
        const picked = (st.decisions.gePicked21 || []).length;
        const auto = (st.decisions.geAutoPairs21 || []).length;
        const singles = Game.bp21RemainingSingles ? Game.bp21RemainingSingles(st).length : 0;
        b21act.appendChild(this.el("div", "quest-detail", st.flags.b21Filled21
          ? "最佳拍档拍档名单 ✔（共 " + (st.decisions.gePairs21 || []).length + " 组"
            + ((st.decisions.geB21Dropped || []).length ? "；剔除：" + st.decisions.geB21Dropped.join("、") : "") + "）"
          : "组队：钦点 " + picked + "/5 组 · 自动组队 " + auto + " 组 · 单身赛道 " + singles + " 人（补配期限 " + (st.decisions.geMode21 === "partner" ? "7" : "5") + " 月）"));
      }
      if (!st.geDone || !st.rtDone) {
        if (!st.geDone) {
          const bar21ge = this.el("div", "mc-bar pop"); bar21ge.innerHTML = "<i style=\"width:" + st.gePlan + "%\"></i>";
          b21act.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "总决选筹备度"), this.el("span", "", st.gePlan + "/100")]));
          b21act.appendChild(bar21ge);
        }
        if (!st.rtDone) {
          const bar21rt = this.el("div", "mc-bar bond"); bar21rt.innerHTML = "<i style=\"width:" + st.rtPlan + "%\"></i>";
          b21act.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "金曲大赏筹备度"), this.el("span", "", st.rtPlan + "/100")]));
          b21act.appendChild(bar21rt);
        }
      }
      box.appendChild(mkCard("主线 · 年度活动",
        st.geDone && st.rtDone ? "✔ 双活动收官" : "进行中", st.geDone && st.rtDone ? "q-done" : "q-open", b21act));
      /* 分团态势 */
      const brFlags = ["SHY48", "CKG48", "TEB48"].filter(t => st.members.some(m => m.status === "branch" && m.branchTeam === t));
      box.appendChild(mkCard("分团态势", brFlags.length ? "旗号延续" : "无分团在册", "q-open",
        this.el("div", "quest-detail", brFlags.length
          ? brFlags.join("、") + " 在册（" + st.members.filter(m => m.status === "branch").length + " 人）；2021 分团新期生照常入册"
          : "无分团在册（IDFT 训练生池 " + st.members.filter(m => m.status === "idft").length + " 人）")));
      this.renderActions();
      return;
    }

    if (st.era === "2020") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 经济态势 */
      const eco20 = st.month <= 3
        ? "1~3 月：收益停止、支出减半（剧场停摆，公司半速运转）"
        : "4 月起：支出恢复正常、收益减半（上座受限，云公演补位）";
      box.appendChild(mkCard("经济态势 · 疫情年", st.month <= 3 ? "停摆中" : "半速运转", st.month <= 3 ? "q-open" : "q-open",
        this.el("div", "quest-detail", eco20)));
      /* 主线① 安置分团成员（仅去年保住分团时显示） */
      if (st.decisions.branch19Keep === "keep") {
        box.appendChild(mkCard("主线① · 安置分团成员", st.reorg20.done ? "✔ 全部归位" : "进行中", st.reorg20.done ? "q-done" : "q-open",
          this.el("div", "quest-detail", st.reorg20.done
            ? "✔ 上调本部/旗号留任/IDFT 全部归位——分团剧场已关停"
            : "CKG48/SHY48 解散：成员逐人拍板去向（上调本部每队13~20人" + (Game.keptBranchFlags20(st).length ? "；保留旗号的分团可留任16人" : "") + "；其余移入 IDFT）")));
      }
      /* 主线② 防疫与返工 */
      const c20 = st.covid20;
      const dotsC = this.el("div", "quest-progress");
      for (let i = 1; i <= 2; i++) dotsC.appendChild(this.el("div", "p-dot" + (c20.done || c20.stage >= i ? " on" : "")));
      const bC = this.el("div", "");
      bC.appendChild(this.el("div", "quest-detail", c20.done ? "✔ 全年零感染零事故——防疫台账归档" : "两段：防疫部署 → 返工安排"));
      bC.appendChild(dotsC);
      box.appendChild(mkCard("主线② · 防疫与返工", c20.done ? "✔ 体系建成" : "进行中", c20.done ? "q-done" : "q-open", bC));
      /* 主线③ 云公演 */
      const cl20 = st.cloud20;
      const dotsL = this.el("div", "quest-progress");
      for (let i = 1; i <= 3; i++) dotsL.appendChild(this.el("div", "p-dot" + (cl20.done || cl20.stage >= i ? " on" : "")));
      const bL = this.el("div", "");
      bL.appendChild(this.el("div", "quest-detail", cl20.done ? "✔ 云公演常态化运行（已开演 " + cl20.held + " 场）——「剧场公演」已替换为线上「云公演」" : "三段：策划案 → 技术测试 → 首场试播；4月起替代剧场公演"));
      bL.appendChild(dotsL);
      box.appendChild(mkCard("主线③ · 策划云公演", cl20.done ? "✔ 线上开演" : "进行中", cl20.done ? "q-done" : "q-open", bL));
      /* 主线④ 和平分手（仅复刻/日本模式） */
      if (Game.isReplicate(st)) {
        box.appendChild(mkCard("主线④ · 与日方和平分手", st.teb20.done ? "✔ 分手达成" : "待推进", st.teb20.done ? "q-done" : "q-open",
          this.el("div", "quest-detail", st.teb20.done
            ? "✔ TEB48 已交还日方，复刻体系授权一并了结——从此按自己的规矩走"
            : "以财政压力为由将 TEB48 还给日方并洽谈分手" + (st.teb19 && st.teb19.open ? "（台北成员需先安置）" : "（TEB48 未成立：婉拒接手并谈妥分手）"))));
      }
      /* 主线⑤ 一期生合约 */
      box.appendChild(mkCard("主线⑤ · 一期生合约", st.gen1.done ? "✔ 逐人拍板归位" : "待推进", st.gen1.done ? "q-done" : "q-open",
        this.el("div", "quest-detail", st.gen1.done
          ? "✔ 续约/毕业/转岗——半部历史的册页已合上"
          : "一期生合约年内全部到期：说服续约 / 影视约续约（需演技达标）/ 让其毕业 / 转为工作人员（赵嘉敏不在安置名单）")));
      /* 主线 · 年度活动筹备（总选8月线上开榜 + 金曲大赏12月线上举行）——筹备度必须展示 */
      const b20act = this.el("div", "");
      b20act.appendChild(this.el("div", "quest-detail",
        (st.geDone ? "总决选 ✔（8月线上开榜 · 第一名：" + (st.geResult && st.geResult.top1 || "——") + "）" : "总决选 8月 · 线上直播")
        + "　|　" +
        (st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 线上直播")));
      if (!st.geDone || !st.rtDone) {
        if (!st.geDone) {
          const bar20ge = this.el("div", "mc-bar pop"); bar20ge.innerHTML = "<i style=\"width:" + st.gePlan + "%\"></i>";
          b20act.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "总决选筹备度"), this.el("span", "", st.gePlan + "/100")]))
            ; b20act.appendChild(bar20ge);
        }
        if (!st.rtDone) {
          const bar20rt = this.el("div", "mc-bar bond"); bar20rt.innerHTML = "<i style=\"width:" + st.rtPlan + "%\"></i>";
          b20act.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "金曲大赏筹备度"), this.el("span", "", st.rtPlan + "/100")]))
            ; b20act.appendChild(bar20rt);
        }
        b20act.appendChild(this.el("div", "quest-detail", "「筹备总选举」2~7月可用 ·「筹备金曲大赏」10~12月可用（线上直播收费，收益减半）"));
      }
      box.appendChild(mkCard("主线 · 年度活动筹备",
        st.geDone && st.rtDone ? "✔ 双活动收官" : st.geDone ? "总选已开榜" : "进行中", st.geDone && st.rtDone ? "q-done" : "q-open",
        b20act));
      /* 分团态势 */
      const keptBr = Game.keptBranchFlags20(st);
      const br20Txt = st.reorg20.done
        ? (keptBr.length ? keptBr.join("、") + " 旗号保留（留任16人内，无剧场收入）" : "SHY48/CKG48 已全部解散")
        : st.decisions.branch19Keep === "keep" ? "没了投资方——今年必须解散，安置方案待定"
        : "去年已善后：无分团在册";
      box.appendChild(mkCard("分团态势 · 沈阳与重庆", st.reorg20.done ? "已安置" : "待安置", "q-open",
        this.el("div", "quest-detail", br20Txt)));
      this.renderActions();
      return;
    }

    /* ============ 2019 线（双岸）：五条主线看板 ============ */
    if (st.era === "2019") {
      const mkCard = (name, tag, tagCls, body) => {
        const c = this.el("div", "quest-card");
        const head = this.el("div", "quest-head", this.el("span", "quest-name", name));
        head.appendChild(this.el("span", "quest-tag " + tagCls, tag));
        c.appendChild(head);
        if (body) c.appendChild(body);
        return c;
      };
      /* 主线① 二次组阁（两条线共有） */
      const r19 = st.reorg19;
      box.appendChild(mkCard("主线① · 二次组阁", r19.done ? "✔ 新编制公布" : "进行中", r19.done ? "q-done" : "q-open",
        this.el("div", "quest-detail", r19.done ? "✔ 全团重排完成——本部每队13~20人，预备生≤16" : "全团重排：本部每队13~20人、预备生≤16；行动里随时可以启动编制会")));
      /* 主线② 筹建 TEB48（仅复刻线且序章拍板推进时显示） */
      if (st.decisions.teb19Push === "go") {
        const t19 = st.teb19;
        const dots19 = this.el("div", "quest-progress");
        for (let i = 1; i <= 4; i++) dots19.appendChild(this.el("div", "p-dot" + (t19.stage >= i ? " on" : "")));
        const bT = this.el("div", "");
        bT.appendChild(this.el("div", "quest-detail",
          t19.open ? "✔ " + t19.openMonth + " 月开业首演（每月+25万收入）" : "四步：台北选拔 → 剧场选址（投入200万）→ 招商 → 派遣移籍决定"));
        bT.appendChild(dots19);
        box.appendChild(mkCard("主线② · 筹建 TEB48",
          t19.open ? "✔ 台北的灯亮了" : t19.done ? "待开业" : "进行中", t19.open ? "q-done" : "q-open", bT));
      }
      /* 主线③ 年度招新 */
      const rc19 = st.recruit19;
      box.appendChild(mkCard("主线③ · 年度招新", rc19.done ? "✔ 逐人拍板归位" : "待开考", rc19.done ? "q-done" : "q-open",
        this.el("div", "quest-detail", rc19.done ? "✔ 新成员以预备生身份入池，归属已由总监拍板" : "候选池为 2019 年全部 18 位新入团成员——9 月由总监逐人拍板归属")));
      /* 主线④ 限定团 / 外务布局 */
      if (st.flags.unit19Formed || (st.show18 && Array.isArray(st.show18.squad) && st.show18.squad.length > 0)) {
        box.appendChild(mkCard("主线④ · 限定团", st.flags.unit19Formed ? "✔ 已成团" : "待成团", st.flags.unit19Formed ? "q-done" : "q-open",
          this.el("div", "quest-detail", st.flags.unit19Formed ? "✔ 实力前 3 派遣成员成团（暂休一年，不参加本年总选）——留守者获总选加成" : "总选年特例：2018 派遣成员实力前 3 成团（选秀成团在即）")));
      } else {
        box.appendChild(mkCard("主线④ · 借选秀余温布局外务", st.outreach19.done ? "✔ 打包签约" : "待推进", st.outreach19.done ? "q-done" : "q-open",
          this.el("div", "quest-detail", st.outreach19.done ? "✔ 团综、代言、晚会三线并进，进账落袋" : "打包谈判综艺/代言/晚会（一次性收益 60~90 万）")));
      }
      /* 主线⑤ 年度活动 */
      const b19ge = this.el("div", "quest-desc",
        (st.geDone ? "总决选 ✔（第一名：" + st.geResult.top1 + "）" : "总决选 7月 · 筹备度 " + st.gePlan + "/100")
        + "　|　" +
        (st.rtDone ? "金曲大赏 ✔（" + st.rtScore + "/100）" : "金曲大赏 12月 · 筹备度 " + st.rtPlan + "/100"));
      box.appendChild(mkCard("主线⑤ · 年度活动筹备",
        st.geDone && st.rtDone ? "✔ 双活动收官" : st.geDone ? "总选已落幕" : "进行中", st.geDone && st.rtDone ? "q-done" : "q-open", b19ge));
      /* 分团态势（撤资危机结果，动态文案） */
      const brTag = st.flags.branchesClosed19 ? "善后中" : st.flags.branchesKept19 ? "已保住" : "待决";
      const brTxt = st.flags.branchesClosed19
        ? "沈阳、重庆已停运——成员安置与二次组阁同步进行"
        : st.flags.branchesKept19
        ? "沈阳、重庆保住——维稳专户资金已划拨，月收入延续"
        : "撤资危机的处置结果，将决定沈阳、重庆的命运";
      box.appendChild(mkCard("分团态势 · 沈阳与重庆", brTag, "q-open",
        this.el("div", "quest-detail", brTxt)));
      this.renderActions();
      return;
    }

    /* ============ 2016 线（原版看板） ============ */

    /* 主线① 分团 */
    const q1 = this.el("div", "quest-card");
    q1.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线① · 分团筹备")));
    q1.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.branch.announce ? " q-done" : " q-open"),
      st.branch.announce ? "✔ 已官宣成立（" + st.branch.announceMonth + "月）" : "目标：4月20日官宣"));
    const dots = this.el("div", "quest-progress");
    for (let i = 1; i <= 5; i++) dots.appendChild(this.el("div", "p-dot" + (st.branch.stage >= i ? " on" : "")));
    q1.appendChild(dots);
    const stage = st.branch.stage === 0 ? "尚未启动" : (st.branch.stage >= 5 ? "筹备完成，静待官宣" : (STORY.branchStages[st.branch.stage - 1].stage <= st.branch.stage ? "已完成：" + STORY.branchStages[st.branch.stage - 1].title : ""));
    q1.appendChild(this.el("div", "quest-desc",
      (st.branch.city ? "选址：" + st.branch.city + " · " : "") + stage));
    box.appendChild(q1);

    /* 主线② 总选举 */
    const q2 = this.el("div", "quest-card");
    q2.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线② · 总选举")));
    q2.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.geDone ? " q-done" : " q-open"),
      st.geDone ? "✔ 第一名：" + st.geResult.top1 : "7月30日 · 比翼齐飞"));
    if (!st.geDone) {
      const bar = this.el("div", "mc-bar pop"); bar.innerHTML = "<i style=\"width:" + st.gePlan + "%\"></i>";
      q2.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "筹备度"), this.el("span", "", st.gePlan + "/100")]));
      q2.appendChild(bar);
    }
    box.appendChild(q2);

    /* 主线③ 金曲大赏 */
    const q3 = this.el("div", "quest-card");
    q3.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线③ · 金曲大赏")));
    q3.querySelector(".quest-head").appendChild(this.el("span", "quest-tag" + (st.rtDone ? " q-done" : " q-open"),
      st.rtDone ? "✔ 质量评价 " + st.rtScore : "12月30日 · BEST 50"));
    if (!st.rtDone && st.month >= 10) {
      const bar = this.el("div", "mc-bar pop"); bar.innerHTML = "<i style=\"width:" + st.rtPlan + "%\"></i>";
      q3.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "筹备度"), this.el("span", "", st.rtPlan + "/100")]));
      q3.appendChild(bar);
    }
    box.appendChild(q3);

    /* 主线④ 叶盛 */
    const q4 = this.el("div", "quest-card");
    q4.appendChild(this.el("div", "quest-head",
      this.el("span", "quest-name", "主线④ · 分担叶盛")));
    q4.querySelector(".quest-head").appendChild(this.el("span", "quest-tag",
      st.burden >= 80 ? "⚠ 事务积压" : st.burden <= 25 ? "运转顺畅" : "正常运转"));
    const bar4 = this.el("div", "mc-bar bond"); bar4.innerHTML = "<i style=\"width:" + st.burden + "%;background:var(--gold)\"></i>";
    q4.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "叶盛的负担"), this.el("span", "", st.burden + "/100")]));
    q4.appendChild(bar4);
    box.appendChild(q4);
    this.renderActions();
  },

  /* 行动区（两条线共用）：本月行动按钮 + 月末按钮 */
  renderActions() {
    const st = Game.st;
    const grid = this.$("action-grid");
    grid.innerHTML = "";
    for (const a of Game.listActions()) {
      const b = this.el("button", "action-btn" + (a.main ? " q-main" : "") + (st.ap <= 0 ? " ap-zero" : ""));
      b.appendChild(this.el("div", "action-name", a.name));
      b.appendChild(this.el("div", "action-desc", a.disabled && a.disabledTip ? "🔒 " + a.disabledTip : a.desc));
      b.disabled = a.disabled || st.ap <= 0;
      b.onclick = () => this.onAction(a.id);
      grid.appendChild(b);
    }
    this.$("ap-note").textContent = st.ap > 0 ? "（剩余 " + st.ap + " 点）" : "（本日工作已排满）";

    /* 月末按钮（每次重渲染时替换，避免重复追加） */
    const oldEnd = this.$("btn-month-end");
    if (oldEnd) oldEnd.remove();
    const endBtn = this.el("button", "btn " + (st.ap <= 0 ? "btn-primary" : "btn-ghost") + " btn-big");
    endBtn.id = "btn-month-end";
    endBtn.style.marginTop = "14px";
    endBtn.textContent = st.ap <= 0 ? "进入月末结算 →" : "提前进入月末（还有 " + st.ap + " 点行动力）";
    endBtn.onclick = () => this.onMonthEnd();
    grid.parentElement.appendChild(endBtn);
  },

  /* 【2020】疫情裁撤补偿拍板窗（layoff20Pick）：逐批拍板是否支付补偿金（15 万/人）；
     不支付：士气-4 热度-3，涉分团在册成员羁绊-4，涉本部在册成员羁绊-2。 */
  showLayoff20Picker(names) {
    const c = this.card("疫情裁撤 · 补偿金拍板",
      "待裁成员：" + names.join("、") + "。按合同补偿条款，补偿金为 15 万/人——支付，还是不支付？");
    const box = this.el("div", "modal-choices ft-group");
    const mk = (label, hint, pay) => {
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>" + label + "</b><span>" + hint + "</span>";
      b.onclick = () => {
        this.closeModal();
        const r = Game.applyLayoff20(names, pay);
        Game.st.flags.layoff20Choice = [];
        this.renderGame();
        this.toast(r.text);
      };
      box.appendChild(b);
    };
    mk("「按合同足额支付。」", "资金-" + names.length * 15 + " 万（15 万/人）；士气+2（体面转身）", true);
    mk("「今年没有这笔预算。」", "省下补偿金；士气-4 热度-3，涉分团在册成员羁绊-4，涉本部在册成员羁绊-2", false);
    c.appendChild(box);
    this.modal(c);
  },

  /* 【2021】成员精简补偿拍板窗（layoff21Pick，同 2020 线 layoff20Pick 设计）：
     逐批拍板是否支付补偿金（15 万/人，同 2020 口径）；
     不支付：士气-4 热度-3，涉分团在册成员羁绊-4，涉本部在册成员羁绊-2。 */
  showLayoff21Picker(names) {
    const c = this.card("成员精简 · 补偿金拍板",
      "待精简成员：" + names.join("、") + "。按补偿口径，补偿金为 15 万/人——支付，还是不支付？");
    const box = this.el("div", "modal-choices ft-group");
    const mk = (label, hint, pay) => {
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>" + label + "</b><span>" + hint + "</span>";
      b.onclick = () => {
        this.closeModal();
        const r = Game.applyLayoff21(names, pay);
        Game.st.flags.layoff21Choice = [];
        this.renderGame();
        this.toast(r.text);
      };
      box.appendChild(b);
    };
    mk("「按合同足额支付。」", "资金-" + names.length * 15 + " 万（15 万/人）；士气+2（体面转身）", true);
    mk("「今年没有这笔预算。」", "省下补偿金；士气-4 热度-3，涉分团在册成员羁绊-4，涉本部在册成员羁绊-2", false);
    c.appendChild(box);
    this.modal(c);
  },

  /* 【2017】名册精简补偿拍板窗（layoff17Pick）：逐批拍板是否支付补偿金（10 万/人，同 2016 线口径）；
     不支付：士气-4 热度-3，涉分团在册成员羁绊-4，涉本部在册成员羁绊-2。 */
  showLayoff17Picker(names) {
    const c = this.card("名册精简 · 补偿金拍板",
      "待裁成员：" + names.join("、") + "。按补偿口径，补偿金为 10 万/人——支付，还是不支付？");
    const box = this.el("div", "modal-choices ft-group");
    const mk = (label, hint, pay) => {
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>" + label + "</b><span>" + hint + "</span>";
      b.onclick = () => {
        this.closeModal();
        const r = Game.applyLayoff17(names, pay);
        Game.st.flags.layoff17Choice = [];
        this.renderGame();
        this.toast(r.text);
      };
      box.appendChild(b);
    };
    mk("「按补偿口径足额支付。」", "资金-" + names.length * 10 + " 万（10 万/人）；士气+2（体面转身）", true);
    mk("「公司没有义务再出这笔钱。」", "省下补偿金；士气-4 热度-3，涉分团在册成员羁绊-4，涉本部在册成员羁绊-2", false);
    c.appendChild(box);
    this.modal(c);
  },

  onAction(id) {
    if (id === "visit") { this.showMemberPicker(); return; }
    if (id === "coachVo" || id === "coachDa" || id === "coachMc") { this.showCoachPicker(id); return; }   // 特训三项（唱功/舞蹈/MC）：先选对象
    const res = Game.doAction(id);
    if (!res) return;
    this.renderGame();
    /* 安置点将（解散路线）：先播剧情（首批），再弹分批点将窗 */
    if (res.tone === "settlePick") {
      const ids = res.batchList;
      const openPicker = () => this.showSettleBatchPicker(ids);
      if (res.vn) this.playScene(res.vn, openPicker); else openPicker();
      return;
    }
    /* 原创公演（2017）：先弹队伍选择窗，选队后播放制作场景 */
    if (res.tone === "origPick") { this.showOrigPicker(); return; }
    /* 【2020】疫情裁撤补偿拍板：弹支付/不支付窗，落地在 Game.applyLayoff20(names, pay) */
    if (res.tone === "layoff20Pick") { this.showLayoff20Picker(res.names); return; }
    /* 【2017】名册精简补偿拍板：弹支付/不支付窗，落地在 Game.applyLayoff17(names, pay) */
    if (res.tone === "layoff17Pick") { this.showLayoff17Picker(res.names); return; }
    /* 【2021】成员精简补偿拍板：弹支付/不支付窗，落地在 Game.applyLayoff21(names, pay) */
    if (res.tone === "layoff21Pick") { this.showLayoff21Picker(res.names); return; }
    /* 【全线通用】公演站位调整：先弹队伍选择窗，选队后进入站位编辑窗 */
    if (res.tone === "stageTeamPick") { this.showStageTeamPicker(); return; }
    if (res.tone === "stageEdit") { this.showStageEditor(res.team); return; }
    /* 复刻《双面偶像》（2018）：先弹承办队伍选择窗 */
    if (res.tone === "pickTeam18") { this.showSm18TeamPicker(); return; }
    /* 队伍团建（全线通用）：弹队伍选择窗，选队后落地（Game.doAction('teamBld', {team})） */
    if (res.tone === "pickTeamBld") { this.showTeamBldPicker(); return; }
    /* 【成员属性系统 v2】培训成员守则：弹队伍选择窗，选队后落地（Game.doAction('dqTrain', {team})） */
    if (res.tone === "dqTeamPick") { this.showDqRulePicker(); return; }
    /* 【2016~2021 通用·影视投资】弹项目邁选窗，选项目后点将，落地 Game.doAction('filmInvest', {pid,lead,second}) */
    if (res.tone === "filmInvest") { this.showFilmProjectPicker(); return; }
    /* 组阁编制会（2018）：逐人定队 + 队长队副任命，落地在 Game.applyReorg18 */
    if (res.tone === "pickReorg18") { this.showReorg18Picker(); return; }
    /* 二次组阁编制会（2019）：逐人定队 + 队长队副任命，落地在 Game.applyReorg19 */
    if (res.tone === "pickReorg19") { this.showReorg19Picker(); return; }
    /* 分团安置（2020 主线①）：逐人定队/留任/IDFT，落地在 Game.applyReorg20 */
    if (res.tone === "pickReorg20") { this.showReorg20Picker(); return; }
    /* TEB48 成员安置（2020 主线④）：逐人定队/返回日本，落地在 Game.applyTeb20 */
    if (res.tone === "pickTeb20") { this.showTeb20Picker(); return; }
    /* 一期生合约（2020 主线⑤）：逐人续约/毕业/转岗，落地在 Game.applyGen1 */
    if (res.tone === "pickGen1") { this.showGen1Picker(); return; }
    /* TEB48 派遣移籍决定（2019 主线①第四段）：弹 0~5 人可选点将窗 */
    if (res.tone === "pickTeb19") { this.showTeb19Picker(); return; }
    /* 选秀派遣点将（2018）：弹十一人点将窗（葛佳慧承诺自动占位） */
    if (res.tone === "pickSquad18") { this.showShow18Picker(); return; }
    /* 【2021 主线③】海外选秀五人点将窗；落地在 Game.setGp21Squad */
    if (res.tone === "gp21pick") { this.showGp21Picker(); return; }
    /* 【2021·两线通用】《最佳拍档》组队窗（钦点 5 队 / 单身赛道补配）；落地在 Game.setGePicked21 / Game.setGeSupPairs21 */
    if (res.tone === "bp21pick") { this.showB21PickPicker(); return; }
    if (res.tone === "bp21singles") { this.showB21SinglesPicker(); return; }
    /* 【2021·方案一】《最佳拍档》组队窗（链式二人组队）；落地在 Game.setGePairs21 */
    if (res.tone === "gePairs21") { this.showGePairs21Picker(); return; }
    /* 【2021·AW9 满员机制】预备役补员点将窗（1 人）；落地在 Game.setAw9r21Pick */
    if (res.tone === "aw9r21pick") { this.showAw9r21Picker(); return; }
    /* 【2021 延续】分团 TOP1 兼任 / IDFT 升格：复用 2020 拍板窗 */
    if (res.tone === "ge20branch1") { this.showGe20Branch1Picker(() => { this.renderGame(); }); return; }
    if (res.tone === "ge20idft") { this.showGe20IdftPicker(() => { this.renderGame(); }); return; }
    /* 【全线通用·战略重组】选队窗 → 补员点将窗；落地在 Game.applyStrategicReorg */
    if (res.tone === "strategicReorgTeam") { this.showStrategicReorgTeamPicker(); return; }
    if (res.tone === "strategicReorgPick") { this.showStrategicReorgPicker(res.team); return; }
    /* 行动附带剧情场景：先播放场景，结束后再弹结算/选址 */
    if (res.vn) {
      this.playScene(res.vn, () => {
        this.renderGame();
        if (res.tone === "pickCity") this.showCityPicker();
        else if (res.text) this.toast(res.text);
      });
      return;
    }
    if (res.tone === "pickCity") { this.showCityPicker(); return; }
    this.toast(res.text);
  },

  showCityPicker() {
    const c = this.card("分团选址", "考察组列出了四座候选城市——这一笔，决定分团未来十年");
    const grid = this.el("div", "modal-choices");
    for (const city of STORY.branchCities) {
      const b = this.el("button", "vn-choice", "");
      b.innerHTML = "<b>" + city.name + "</b>　<span style=\"font-size:12px;color:var(--text-dim)\">" + city.desc + "</span><br><span style=\"font-size:11px;color:var(--gold)\">一次性：资金" + (city.cost + city.moneyBonus >= 0 ? "+" : "") + (city.cost + city.moneyBonus) + "万 · 热度" + (city.heatBonus >= 0 ? "+" : "") + city.heatBonus + "</span>";
      b.onclick = () => {
        const res = Game.pickCity(city.id);
        this.closeModal();
        if (res) { this.toast(res.text); this.renderGame(); }
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    this.modal(c);   // 不给关闭按钮——选址必须拍板
  },

  /* Team SII 五人选将窗（复刻路线：宫泽佐江毕业公演赴日名单）。
     多选模式：点选/取消，选满 5 人方可确认；生效逻辑在 engine.miyazawaInvite。 */
  /* 通用多选点将窗：cfg = { title, sub, pool, count, confirmLabel, cardInfo(m), onConfirm(ids) }
     （赴日五人 / 开拓者六人等「选 N 人」交互共用） */
  showMultiPick(cfg) {
    const picked = new Set();
    const c = this.card(cfg.title, cfg.sub);
    const counter = this.el("p", "modal-text", "已选 0 / " + cfg.count);
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = "已选 " + picked.size + " / " + cfg.count + (picked.size === cfg.count ? "　✔ 可以确认" : "　（点击卡片选择 / 取消）");
      confirmBtn.disabled = picked.size !== cfg.count;
    };
    for (const m of cfg.pool) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = m.name + '<span class="pb-team">' + cfg.cardInfo(m) + "</span>";
      b.onclick = () => {
        if (picked.has(m.id)) { picked.delete(m.id); b.classList.remove("on"); }
        else if (picked.size < cfg.count) { picked.add(m.id); b.classList.add("on"); }
        else { this.toast("最多" + cfg.count + "个人——先取消一位再选"); return; }
        refresh();
      };
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      this.closeModal();
      cfg.onConfirm([...picked]);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    /* 可选的「提前结束」按钮（cfg.alt = { label, sub, fn }，如最佳拍档钦点不点满 5 组） */
    if (cfg.alt) {
      const altBtn = this.el("button", "ft-opt", "");
      altBtn.innerHTML = "<b>" + cfg.alt.label + "</b><span>" + cfg.alt.sub + "</span>";
      altBtn.onclick = () => { this.closeModal(); cfg.alt.fn(); };
      c.appendChild(altBtn);
    }
    this.modal(c);   // 不给关闭按钮——必须点将才能继续
  },

  /* ========================================================================
     影视投资（2016~2021 线通用·月度行动「filmInvest」，用户口径 2026-XX）：
     8月事件只做「前年回款结算 + 引导」，投资在行动板上拍板：
     ① 项目邁选窗：列出剩余可投项目（点击即选，资金不足置灰）；
     ② 逐部点将：女主角（人气+3 演技+2 羁绊+2），设女二号的项目再点一位女二（+2/+1/+1）；
        荣誉殿堂/影视部（HALL）成员可点将；
     ③ 落地 Game.doAction('filmInvest',{pid,lead,second})：每部耗 1 行动点，无上限。
     低点击量：投 1 部 = 1 次项目点选 + 1~2 次点将，无逐人循环。 */
  showFilmProjectPicker() {
    const st = Game.st;
    const rem = Game.filmRemaining(st);
    const c = this.card("影视投资 · 年度项目邁选", "点击项目进入点将——每投资一部消耗 1 行动点（本月余 " + st.ap + "）");
    const grid = this.el("div", "pick-grid");
    for (const p of rem) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = "《" + p.title + "》" + '<span class="pb-team">' + p.type + " · 投资 " + p.cost + " 万 · " + (p.role2 ? "女主角 + 女二号" : "仅女主角") + "</span>";
      if (st.money < p.cost) { b.disabled = true; b.title = "资金不足"; }
      b.onclick = () => { this.closeModal(); this.castFilmProjects([p], 0, [], null); };
      grid.appendChild(b);
    }
    const cancelBtn = this.el("button", "btn modal-close", "先不投了");
    cancelBtn.onclick = () => this.closeModal();
    c.appendChild(grid);
    c.appendChild(cancelBtn);
    this.modal(c);
  },

  /* 影视点将递归：逐部点女主角（及女二号），全部点完后经 doAction 落地（每部耗 1 行动点） */
  castFilmProjects(projects, i, acc, onDone) {
    const st = Game.st;
    if (i >= projects.length) {
      const texts = [];
      for (const pk of acc) {
        const r = Game.doAction("filmInvest", pk);
        if (!r) { texts.push("（行动点不足——本月无法继续投资，下月再拍板。）"); break; }
        texts.push(r.text);
      }
      this.renderGame();
      this.toast(texts.join("\n\n"));
      if (onDone) onDone();
      return;
    }
    const p = projects[i];
    /* 点将池：本部/分团在册 + 荣誉殿堂/影视部（HALL，走影视方向）均可点 */
    const pool = () => st.members.filter(m => (m.status === "active" || m.status === "branch") && m.pop != null && m.status !== "left");
    const teamLabel = m => (m.hall || m.team === "HALL") ? "影视部" : (m.status === "branch" ? m.branchTeam : m.team);
    const pickRole = (roleKey, roleLabel, reward, exclude, next) => {
      this.showMultiPick({
        title: "《" + p.title + "》 · " + roleLabel + "点将（投资 " + p.cost + " 万）",
        sub: "被选中者 " + reward + "（荣誉殿堂/影视部成员亦可出演）",
        pool: pool().filter(m => m.name !== exclude),
        count: 1,
        confirmLabel: "「" + roleLabel + "」定了 →",
        cardInfo: m => teamLabel(m) + " · 人气" + m.pop + " 羁绊" + m.bond + (m.skills ? " 演技" + m.skills.ac : ""),
        onConfirm: ids => { next(ids[0]); },
      });
    };
    pickRole("lead", "女主角", "人气+3 演技+2 羁绊+2", null, leadName => {
      acc.push({ pid: p.pid, lead: leadName, second: null });
      if (!p.role2) { this.castFilmProjects(projects, i + 1, acc, onDone); return; }
      pickRole("second", "女二号", "人气+2 演技+1 羁绊+1", leadName, secondName => {
        acc[acc.length - 1].second = secondName;
        this.castFilmProjects(projects, i + 1, acc, onDone);
      });
    });
  },

  /* Team SII 五人选将窗（复刻路线：宫泽佐江毕业公演赴日名单） */
  showSIIInvitePicker(onDone) {
    this.showMultiPick({
      title: "赴日名单 · 点将五人",
      sub: "宫泽佐江的毕业公演——仅限 Team SII 在籍成员，被选中者羁绊+10 人气+3",
      pool: Game.st.members.filter(m => m.status === "active" && m.team === "SII"),
      count: 5,
      confirmLabel: "名单敲定，出发东京 →",
      cardInfo: m => m.team + " · 羁绊" + m.bond + " 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.miyazawaInvite(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* Team SII 五人选将窗（复刻模式：铃木玛莉亚东京毕业公演赴日名单）。
     生效逻辑在 engine.mariaInvite。 */
  showMariaInvitePicker(onDone) {
    this.showMultiPick({
      title: "铃木玛莉亚毕业公演 · 赴日名单",
      sub: "东京的毕业公演——仅限 Team SII 在籍成员（不含玛莉亚本人），被选中者羁绊+10 人气+3",
      pool: Game.st.members.filter(m => m.status === "active" && m.team === "SII" && m.name !== "铃木玛莉亚"),   // 排除寿星本人
      count: 5,
      confirmLabel: "名单敲定，出发东京 →",
      cardInfo: m => m.team + " · 羁绊" + m.bond + " 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.mariaInvite(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 开拓者六人点将窗（2017 分团线伏笔：六人随总监移籍 SHY48/CKG48） */
  /* 小分队成军点将窗（2018 通用·公司选取）：HO2 双人 / BlueV 五人，全团非殿堂成员皆可选；
     生效逻辑在 engine.setUnit18。 */
  showUnit18Picker(unit, onDone) {
    const st = Game.st;
    const count = unit === "HO2" ? 2 : 5;
    this.showMultiPick({
      title: "小分队 " + unit + " · 点将" + count + "人",
      sub: "7SENSES 模式延续——" + unit + "（" + count + " 人）名单由公司（你）指定，全团在册成员皆可入选（非荣誉殿堂/影视部）",
      pool: st.members.filter(m => m.status === "active" && !m.hall && m.team !== "HALL" && m.pop != null),
      count: count,
      confirmLabel: unit + " 名单敲定 →",
      cardInfo: m => m.team + " · 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.setUnit18(unit, ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 小分队 DEMOON 成军点将窗（2019 通用·官方钦点）：七人，全团在册成员皆可选
     （本部+分团，非荣誉殿堂/影视部）；生效逻辑在 engine.setDemoon19。 */
  showDemoon19Picker(onDone) {
    const st = Game.st;
    this.showMultiPick({
      title: "小分队 DEMOON · 点将7人",
      sub: "DEMOON——七人小分队，走酷飒暗黑的舞台路线，名单由公司（你）指定，全团在册成员皆可入选（非荣誉殿堂/影视部）",
      pool: st.members.filter(m => (m.status === "active" || m.status === "branch") && !m.hall && m.team !== "HALL" && m.pop != null),
      count: 7,
      confirmLabel: "DEMOON 名单敲定 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam : m.team) + " · 人气" + m.pop + (m.status === "branch" ? " · 分团" : ""),
      onConfirm: ids => {
        const res = Game.setDemoon19(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 小分队补员链式点将窗（2020 通用·疫情固粉）：逐队补足空缺至编制上限——
     原成员（粉丝票选/钦点）保留不动，只点新成员；生效逻辑在 engine.applyUnitFill20。 */
  showUnitFill20Picker(onDone) {
    const st = Game.st;
    const info = Game.unitFill20Info(st);
    const assign = {};
    const cap = { HO2: 2, BlueV: 5, DEMOON: 7 };
    const step = i => {
      if (i >= info.length) {
        const res = Game.applyUnitFill20(assign);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
        return;
      }
      const it = info[i];
      this.showMultiPick({
        title: "小分队 " + it.unit + " · 补员" + it.vac + "人",
        sub: "原成员（粉丝一票一票投出来的，不可替换）保留：" + it.cur.join("、") + "——从在籍成员中补足编制（" + cap[it.unit] + " 人）；非荣誉殿堂/影视部、未属其他小分队",
        pool: st.members.filter(m => m.status === "active" && !m.hall && m.team !== "HALL" && m.pop != null && !Game.memberSubUnit(st, m.name)),
        count: it.vac,
        confirmLabel: it.unit + " 补员名单敲定 →",
        cardInfo: m => (m.status === "branch" ? m.branchTeam : m.team) + " · 人气" + m.pop,
        onConfirm: ids => { assign[it.unit] = ids; step(i + 1); },
      });
    };
    step(0);
  },

  /* 红白歌会·中国预赛出征名单窗（2018 复刻路线专属）：全团（本部+分团在册、非殿堂）
     点将五人；生效逻辑在 engine.setKohakuSquad。 */
  showKohakuPicker(onDone) {
    const st = Game.st;
    this.showMultiPick({
      title: "红白歌会 · 中国预赛 出征名单",
      sub: "全团在册成员皆可点将（本部 + 分团，非殿堂）——预赛表现优异者将获邀赴日参加年末红白决赛（复刻路线专属）",
      pool: st.members.filter(m => (m.status === "active" || m.status === "branch") && !m.hall && m.team !== "HALL" && m.pop != null && m.pop > 0),
      count: 5,
      confirmLabel: "名单敲定，上报东京 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam : m.team) + " · 人气" + m.pop + (m.status === "branch" ? " · 分团" : ""),
      onConfirm: ids => {
        const res = Game.setKohakuSquad(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 北原里英东京毕业公演 · 赴日名单窗（2018 复刻路线专属）：其效力队伍点将五人；
     生效逻辑在 engine.kitaharaSend（五人羁绊+10 人气+3，公演落幕北原里英退团）。 */
  showKitaharaPicker(onDone) {
    const st = Game.st;
    const kh = st.members.find(m => m.name === "北原里英" && m.status === "active");
    const team = kh ? kh.team : "SII";
    this.showMultiPick({
      title: "北原里英毕业公演 · 赴日名单",
      sub: "北原里英效力 Team " + team + "——从该队点将五人，赴东京送她最后一程（复刻路线专属）",
      pool: st.members.filter(m => m.status === "active" && m.team === team && m.pop != null && !m.hall
        && m.name !== "北原里英"),   // 排除寿星本人——毕业公演主角不上赴日名单
      count: 5,
      confirmLabel: "名单敲定，随她赴东京 →",
      cardInfo: m => "Team " + m.team + " · 人气" + m.pop,
      onConfirm: ids => {
        const res = Game.kitaharaSend(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 安置分批点将窗（2026 解散路线）：每批名额 上海3 / 广州2 / 重庆2。
     点击卡片循环分配：未定 → 上海 → 广州 → 重庆 → 未定；名额满后不可再选。
     确认时未分配者协商解约离团（备注「解散安置」）。落地逻辑在 engine.settleBatch。 */
  showSettleBatchPicker(batchIds) {
    const st = Game.st;
    const QUOTA = { sh: 3, gz: 2, cq: 2 };
    const DST = [
      { key: "sh", label: "调往上海 · 预备生", cls: "on-sh" },
      { key: "gz", label: "调往广州 GNZ48 · 预备生", cls: "on-gz" },
      { key: "cq", label: "调往重庆 CKG48 · 预备生", cls: "on-cq" },
    ];
    const dst = {};   // id → "sh"|"gz"|"cq"
    const count = key => Object.values(dst).filter(v => v === key).length;
    const cur0 = id => dst[id];
    const c = this.card("安置名单 · 第" + (st.cgt.settled + 1) + "批",
      "点击卡片循环分配去处：上海 3 人 / 广州 2 人 / 重庆 2 人。未分配者将协商解约离团（解散安置）");
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "本批名单敲定 →");
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = "上海 " + count("sh") + "/" + QUOTA.sh + " · 广州 " + count("gz") + "/" + QUOTA.gz + " · 重庆 " + count("cq") + "/" + QUOTA.cq;
      confirmBtn.disabled = !(count("sh") === QUOTA.sh && count("gz") === QUOTA.gz && count("cq") === QUOTA.cq);
    };
    for (const id of batchIds) {
      const m = st.members.find(x => x.id === id);
      if (!m) continue;
      const b = this.el("button", "pick-btn", "");
      const paint = () => {
        const cur = dst[id];
        DST.forEach(d => { if (d.cls) b.classList.remove(d.cls); });   // 空 cls remove 会抛 SyntaxError（同 showTeamAssignPicker 修复）
        let label;
        if (!cur) { label = "点击分配去处"; }
        else {
          const d = DST.find(x => x.key === cur);
          if (d.cls) b.classList.add(d.cls);
          label = d.label;
        }
        b.innerHTML = m.name + '<span class="pb-team">' + label + "</span>";
      };
      b.onclick = () => {
        let nextIdx = cur0(id) ? DST.findIndex(x => x.key === cur0(id)) + 1 : 0;
        /* 从下一档开始找有空位的档位；全满则重置为未分配 */
        for (; nextIdx < DST.length; nextIdx++) {
          const k = DST[nextIdx].key;
          if (count(k) < QUOTA[k]) { dst[id] = k; paint(); refresh(); return; }
        }
        delete dst[id]; paint(); refresh();
      };
      paint();
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      const dest = { sh: [], gz: [], cq: [] };
      for (const id in dst) dest[dst[id]].push(id);
      const res = Game.settleBatch(dest);
      this.closeModal();
      this.renderGame();
      this.toast(res.text);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——本批名单必须敲定
  },

  /* 四队循环分配窗核心（SII→NII→HII→X 点击循环，无名额限制；全员分配后可确认）
     cfg = { title, sub, pool, teams?, confirmLabel, defaultKey?, initial?, onConfirm(dst) }
     defaultKey（点将窗低点击量规范，2026-XX 用户规则）：可选「默认去向」——所有成员预填为
     默认去向，点击卡片仅在「默认 → 各可选去向 → 默认」间循环；确认键立即可用。
     玩家只需点需要变更去向的成员，未点的全部走默认（如 BEJ48 解散：默认留旗，
     仅点上调者）——严禁出现「不逐人点完一圈就无法确认」的设计。 */
  showTeamAssignPicker(cfg) {
    const TEAMS = cfg.teams || [
      { key: "SII", label: "升入 Team SII", cls: "on-sii" },
      { key: "NII", label: "升入 Team NII", cls: "on-nii" },
      { key: "HII", label: "升入 Team HII", cls: "on-hii" },
      { key: "X",   label: "升入 Team X",   cls: "on-x" },
    ];
    const targets = cfg.pool;
    const dst = Object.assign({}, cfg.initial || {});   // id → 预填去向（可选）
    /* 低点击量规范：有 defaultKey 时，未预填的成员统一预填默认去向（确认键立即可用） */
    if (cfg.defaultKey && TEAMS.some(t => t.key === cfg.defaultKey)) {
      for (const m of targets) if (!(m.id in dst)) dst[m.id] = cfg.defaultKey;
    }
    const count = key => Object.values(dst).filter(v => v === key).length;
    const c = this.card(cfg.title, cfg.sub);
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", cfg.confirmLabel);
    confirmBtn.disabled = true;
    const refresh = () => {
      counter.textContent = TEAMS.map(t => t.key + " " + count(t.key)).join(" · ") +
        "（共 " + targets.length + " 人）";
      confirmBtn.disabled = Object.keys(dst).length !== targets.length;
    };
    for (const m of targets) {
      const b = this.el("button", "pick-btn", "");
      const paint = () => {
        TEAMS.forEach(t => { if (t.cls) b.classList.remove(t.cls); });   // 空 cls 直接 remove 会抛 SyntaxError（2020 安置/一期生窗点击无反应的根因）
        const cur = dst[m.id];
        let label;
        if (!cur) label = "点击选择去向";
        else {
          const t = TEAMS.find(x => x.key === cur);
          if (t && t.cls) b.classList.add(t.cls);
          label = (t ? t.label : cur) + (cfg.defaultKey === cur ? "（默认）" : "");
        }
        b.innerHTML = m.name + (cfg.cardInfo ? '<span class="pb-team">' + cfg.cardInfo(m) + " · </span>" : "") + '<span class="pb-team">' + label + "</span>";
      };
      b.onclick = () => {
        if (cfg.defaultKey) {
          /* 默认去向模式：默认 → 第一个非默认去向 → … → 回到默认（不出现空档） */
          const others = TEAMS.filter(t => t.key !== cfg.defaultKey);
          const idx = others.findIndex(t => t.key === dst[m.id]);
          dst[m.id] = idx < 0 ? others[0].key : (idx + 1 < others.length ? others[idx + 1].key : cfg.defaultKey);
        } else {
          const nextIdx = dst[m.id] ? TEAMS.findIndex(x => x.key === dst[m.id]) + 1 : 0;
          if (nextIdx >= TEAMS.length) delete dst[m.id];
          else dst[m.id] = TEAMS[nextIdx].key;
        }
        paint(); refresh();
      };
      paint();
      grid.appendChild(b);
    }
    refresh();   // 构建后先刷一次（预填 initial 的场景——如分团 TOP1「不兼任」——确认键需立即可用）
    confirmBtn.onclick = () => {
      this.closeModal();
      cfg.onConfirm(dst);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——必须完成分配
  },

  /* 预备生汇报公演升格窗（2018/2019）：每场公演升格 2 人（候选不足时按实际人数），
     逐人定队（FT 仅在成立后可选）；落地在 engine.promotePrepStage */
  showPrepStagePromotePicker(onDone) {
    const st = Game.st;
    const targets = Game.prepStageCandidates(st).slice(0, 2);
    const teams = [
      { key: "SII", label: "升入 Team SII", cls: "on-sii" },
      { key: "NII", label: "升入 Team NII", cls: "on-nii" },
      { key: "HII", label: "升入 Team HII", cls: "on-hii" },
      { key: "X",   label: "升入 Team X",   cls: "on-x" },
    ];
    if (Game.keptXiiInRoster(st)) teams.push({ key: "XII", label: "升入 Team XII", cls: "on-xii" });   // XII 保留时视同正常本部队伍
    if (st.flags.ftFormed && st.members.some(m => m.status === "active" && m.team === "FT"))
      teams.push({ key: "FT", label: "升入 Team FT", cls: "on-ft" });
    this.showTeamAssignPicker({
      title: "汇报公演 · 升格定队",
      sub: "本场公演表现优异的预备生（点击卡片循环切换队伍；分团预备生升入本部各队为上调）",
      pool: targets,
      teams: teams,
      confirmLabel: "升格名单敲定 →",
      onConfirm: dst => {
        const res = Game.promotePrepStage(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 分团安置窗（2020 主线①，两阶段优化·少点击）：
     有保旗 → 阶段①先勾选留任旗号成员（≤16人）；阶段②统一本部定队，
     各队距满编 20 人的空位标注在选项上，默认全部预填 IDFT，只点想上调的人；
     无保旗 → 直接阶段②。确认后仍未决定的自动落 IDFT（engine.applyReorg20 兼容 null）。
     本部每队 13~20 全校验不变，统一落地在 engine.applyReorg20 */
  showReorg20Picker() {
    const st = Game.st;
    const KEPT = Game.keptBranchFlags20(st);
    const flagNote = team => {
      if (st.decisions.mengbo20 === team) return "✔ 旗号已保留（孟波个人出资）——可留任 16 人挂分团名";
      if (st.decisions.self20Flag === "keep" && st.decisions.branchPost === team) return "✔ 旗号已保留（你自费保留）——可留任 16 人挂分团名";
      return "✘ 旗号未保留——队伍解散，成员上调本部或移入 IDFT";
    };
    const headTeams = Game.headTeams(st);
    const curCnt = {};
    headTeams.forEach(t => { curCnt[t] = st.members.filter(m => m.status === "active" && m.team === t && !m.hall).length; });

    /* 阶段②：本部定队（默认 IDFT，未决定自动落 IDFT） */
    const stageHead = stayIds => {
      const pool = st.members.filter(m => m.status === "branch"
        && (m.branchTeam === "SHY48" || m.branchTeam === "CKG48") && !stayIds.has(m.id));
      if (!pool.length) {   // 全员留任 → 直接落地
        const assign = {};
        for (const id of stayIds) assign[id] = "stay";
        const res = Game.applyReorg20(assign);
        this.renderGame();
        if (res.vn) this.playScene(res.vn, () => this.toast(res.text));
        else this.toast(res.text);
        return;
      }
      const teamOpts = headTeams.map(t => ({
        key: t, cls: "on-" + t.toLowerCase(),
        label: "上调 Team " + t + "（空 " + Math.max(0, 20 - curCnt[t]) + " 位）",
      }));
      teamOpts.push({ key: "idft", label: "移籍 IDFT（默认）", cls: "" });
      const initial = {};
      for (const m of pool) initial[m.id] = "idft";   // 预填 IDFT：可直接确认，只点想上调的人
      this.showTeamAssignPicker({
        title: "分团安置名单 · 本部定队",
        sub: "点击卡片切换去向（默认全部移籍 IDFT，只点想上调的人；确认后未改动的自动落 IDFT）——"
          + "各队距满编 20 人的空位已标注，上调本部享人气羁绊红利；本部每队 13~20 人"
          + (Game.keptXiiInRoster(st) ? "（XII 保留编制，同为去向）" : ""),
        pool: pool,
        teams: teamOpts,
        initial: initial,
        confirmLabel: "安置名单敲定 →",
        cardInfo: m => m.branchTeam,
        onConfirm: dst => {
          const assign = {};
          for (const m of pool) assign[m.id] = (dst[m.id] && headTeams.indexOf(dst[m.id]) >= 0) ? dst[m.id] : "idft";
          for (const id of stayIds) assign[id] = "stay";
          const res = Game.applyReorg20(assign);
          this.renderGame();
          if (res.vn) this.playScene(res.vn, () => this.toast(res.text));
          else this.toast(res.text);
        },
      });
    };

    /* 阶段①（有保旗时）：先勾选留任旗号成员（≤16人） */
    const keptTeam = KEPT.find(t => st.members.some(m => m.status === "branch" && m.branchTeam === t));
    if (keptTeam) {
      const targets = st.members.filter(m => m.status === "branch" && m.branchTeam === keptTeam);
      const stayIds = new Set();
      const c = this.card("分团安置名单 · " + keptTeam + " 留任拍板",
        "「" + keptTeam + "」先勾选留任旗号的成员（至多 16 人；未勾选者进入下一步本部定队）——旗号状态：" + flagNote(keptTeam));
      const counter = this.el("p", "modal-text", "");
      const grid = this.el("div", "pick-grid");
      const btn = this.el("button", "btn btn-primary modal-close", "留任名单敲定 → 本部定队");
      const refresh = () => {
        counter.textContent = "留任 " + stayIds.size + " / 16 人（该团共 " + targets.length + " 人）";
        btn.disabled = stayIds.size > 16;
      };
      for (const m of targets) {
        const b = this.el("button", "pick-btn", "");
        const paint = () => {
          b.classList.toggle("on", stayIds.has(m.id));
          b.innerHTML = m.name + '<span class="pb-team">' + (stayIds.has(m.id) ? "✔ 留任旗号" : "未勾选 → 本部定队") + "</span>";
        };
        b.onclick = () => {
          if (stayIds.has(m.id)) stayIds.delete(m.id); else stayIds.add(m.id);
          paint(); refresh();
        };
        paint();
        grid.appendChild(b);
      }
      refresh();
      btn.onclick = () => { this.closeModal(); stageHead(stayIds); };
      c.appendChild(counter); c.appendChild(grid); c.appendChild(btn);
      this.modal(c);   // 不给关闭按钮——必须完成安置
    } else stageHead(new Set());
  },

  /* 2020总选新机制·分团TOP1兼任本部安排窗（用户口径）：每个分团 TOP1 都可安排，
     逐人选定本部队（XII 保留时同队待遇）或「不兼任」（预填，可直接确认）；
     落地在 engine.applyGe20Branch1（兼任不调动） */
  showGe20Branch1Picker(onDone) {
    const st = Game.st;
    const names = Array.isArray(st.flags.ge20BranchTop1) ? st.flags.ge20BranchTop1 : (st.flags.ge20BranchTop1 ? [st.flags.ge20BranchTop1] : []);
    const targets = names.map(n => st.members.find(x => x.name === n && x.status === "branch")).filter(Boolean);
    if (!targets.length) { if (onDone) onDone(); return; }
    const teams = Game.headTeams(st).map(t => ({ key: t, label: "兼任 Team " + t, cls: "on-" + t.toLowerCase() }));
    teams.push({ key: "none", label: "不兼任（留在分团）", cls: "" });
    const initial = {};
    for (const m of targets) initial[m.id] = "none";   // 预填「不兼任」：可直接确认
    this.showTeamAssignPicker({
      title: "分团 TOP1 · 兼任安排",
      sub: "2020总选各分团的第一名——兼不兼、兼到哪支队伍，逐人拍板（兼任不调动，保留分团在册）",
      pool: targets,
      teams: teams,
      initial: initial,
      confirmLabel: "兼任官宣 →",
      cardInfo: m => m.branchTeam + " · 人气" + (m.pop || 0),
      onConfirm: dst => {
        const res = Game.applyGe20Branch1(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 2020总选新机制·入榜IDFT升格移籍拍板窗（用户口径）：升格本部（XII 保留时同队待遇）/
     移籍分团（挂分团名）/ 留任 IDFT；落地在 engine.applyGe20Idft */
  showGe20IdftPicker(onDone) {
    const st = Game.st;
    const targets = (st.flags.ge20Idft || [])
      .map(n => st.members.find(m => m.name === n && m.status === "idft")).filter(Boolean);
    const teams = Game.headTeams(st).map(t => ({ key: t, label: "升格 Team " + t, cls: "on-" + t.toLowerCase() }));
    for (const b of ["BEJ48", "GNZ48", "SHY48", "CKG48"].concat(st.teb19 && st.teb19.open ? ["TEB48"] : []))
      teams.push({ key: b, label: "移籍 分团 " + b + "（挂分团名）", cls: "" });
    teams.push({ key: "stay", label: "留任 IDFT", cls: "" });
    this.showTeamAssignPicker({
      title: "入榜训练生 · 升格移籍拍板",
      sub: "2020总选入榜的 IDFT 成员（点击卡片循环切换；升格本部入编现役，移籍分团挂分团名，或留池继续练）",
      pool: targets,
      teams: teams,
      confirmLabel: "去向名单敲定 →",
      cardInfo: m => "IDFT · 人气" + (m.pop || 0) + (m.pwr != null ? " 实力" + m.pwr : ""),
      onConfirm: dst => {
        const res = Game.applyGe20Idft(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* BEJ48 解散编号·拍板窗（2020·9月事件②）：上调本部每队≤3（XII 保留时同队待遇，
     预备生队伍不可接收）；其余默认留任挂分团名（低点击量规范：玩家只需点上调者，
     未点的成员一键确认即全部留旗）；落地在 engine.applyBej20 */
  showBej20Picker(onDone) {
    const st = Game.st;
    const targets = st.members.filter(m => m.status === "branch" && m.branchTeam === "BEJ48");
    const teams = Game.headTeams(st).map(t => ({ key: t, label: "上调 Team " + t + "（≤3人）", cls: "on-" + t.toLowerCase() }));
    teams.push({ key: "stay", label: "留任 BEJ48（挂分团名）", cls: "" });
    this.showTeamAssignPicker({
      title: "BEJ48 编号谢幕 · 留旗/上调拍板",
      sub: "默认全员留任 BEJ48（挂分团名，保留旗号）——只需点击要上调本部的成员并循环选队伍（每队至多接收 3 人，预备生队伍不占不接收）；不点的成员确认后全部留旗。",
      pool: targets,
      teams: teams,
      defaultKey: "stay",
      confirmLabel: "名单敲定 →",
      cardInfo: m => m.branchLabel || "成员",
      onConfirm: dst => {
        const res = Game.applyBej20(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* GNZ48 首次分团内大重组窗（2020·10月事件，用户口径）：分班公演收官、恢复队伍公演，
     Team G / Team NIII / Team Z 重新编成（人数限制同本部队伍 13~20 人），
     未编入队伍者转 GNZ48 预备生；落地在 engine.applyGnzReorg20 */
  showGnzReorg20Picker(onDone) {
    const st = Game.st;
    const targets = st.members.filter(m => m.status === "branch" && m.branchTeam === "GNZ48");
    const teams = [
      { key: "G",    label: "编入 Team G",    cls: "on-g" },
      { key: "NIII", label: "编入 Team NIII", cls: "on-niii" },
      { key: "Z",    label: "编入 Team Z",    cls: "on-z" },
      { key: "prep", label: "转入 GNZ48 预备生", cls: "" },
    ];
    const curKey = { "Team G": "G", "Team NIII": "NIII", "Team Z": "Z", "预备生": "prep" };
    const initial = {};
    for (const m of targets) { const k = curKey[m.branchLabel]; if (k) initial[m.id] = k; }   // 预填现编队
    this.showTeamAssignPicker({
      title: "GNZ48 分团内大重组 · 逐人拍板",
      sub: "分班公演落幕、队伍公演回归——为每位广州成员编定队伍（点击卡片循环切换；每队 13~20 人，同本部队伍限制；未编入队伍者转 GNZ48 预备生）",
      pool: targets,
      teams: teams,
      initial: initial,
      confirmLabel: "重组名单敲定 →",
      cardInfo: m => (m.branchLabel || "GNZ48") + (m.captain ? " · 队长" : m.vice ? " · 副队长" : ""),
      onConfirm: dst => {
        const res = Game.applyGnzReorg20(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 电商女团浪彩少女AW9 预备役点将窗（2020·9月事件①）：全团在册（本部/分团）、
     非殿堂、未属 AW9 者可选九人；落地在 engine.setAW9Reserve（含史实成员自动挂载） */
  /* 【全线通用·战略重组】①目标队选择窗（人数<10 的队伍） */
  showStrategicReorgTeamPicker() {
    const st = Game.st;
    const targets = Game.strategicReorgTargets(st);
    const c = this.card("战略重组 · 选择目标队伍",
      "人数不足 10 人的队伍：点将补员至最少 13 人（至多 20 人）；耗 1 行动点。");
    const box = this.el("div", "modal-choices ft-group");
    for (const t of targets) {
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>Team " + t + "</b><span>当前 " + Game.teamRoster(st, t).length + " 人 · 重组后需至少 13 人</span>";
      b.onclick = () => { this.closeModal(); this.showStrategicReorgPicker(t); };
      box.appendChild(b);
    }
    c.appendChild(box);
    this.modal(c);
  },

  /* 【全线通用·战略重组】②补员点将窗：其他队伍/预备生/分团在册成员均可调入；
     精确补足至 13 人（落地在 Game.applyStrategicReorg）。 */
  showStrategicReorgPicker(team) {
    const st = Game.st;
    const cur = Game.teamRoster(st, team);
    const need = Math.max(0, 13 - cur.length);
    const pool = st.members.filter(m => !m.hall && (m.status === "active" || m.status === "branch")
      && Game.teamKeyOf(m) !== team)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    this.showMultiPick({
      title: "战略重组 · Team " + team + " 补员点将",
      sub: "当前 " + cur.length + " 人，需补员 " + need + " 人至 13 人（其他队伍/预备生/分团在册成员均可调入；分团成员将上调入编）",
      pool: pool, count: need,
      confirmLabel: "重组落地 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : (m.team === "PREP" ? "预备生 · " : m.team + " · ")) + "人气" + (m.pop || 0),
      onConfirm: ids => {
        const res = Game.applyStrategicReorg(team, ids);
        this.renderGame();
        this.toast(res.text);
      },
    });
  },

  /* 【2021 主线③】海外选秀五人点将窗：全团在册非殿堂成员；落地在 Game.setGp21Squad */
  showGp21Picker() {
    const st = Game.st;
    const pool = st.members.filter(m => m.status === "active" && !m.hall)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    this.showMultiPick({
      title: "海外选秀 · 出征点将五人",
      sub: "鹅厂选秀海外平台播出 · 全年严打下的五个名额（低调、能打、扛得住三个月封闭集训）",
      pool: pool, count: 5,
      confirmLabel: "出征名单敲定 →",
      cardInfo: m => m.team + " · 人气" + (m.pop || 0) + (m.pwr != null ? " 实力" + m.pwr : ""),
      onConfirm: ids => {
        const res = Game.setGp21Squad(ids);
        this.renderGame();
        if (res.vn) this.playScene(res.vn, () => this.toast(res.text));
        else this.toast(res.text);
      },
    });
  },

  /* 【2021·AW9 满员机制】预备役补员点将窗（1 人）：非殿堂、未属 AW9 正式名单的在册成员 */
  showAw9r21Picker() {
    const st = Game.st;
    const formal = st.decisions.unitsAW9 || [];
    const pool = st.members.filter(m => (m.status === "active" || m.status === "branch") && !m.hall
      && formal.indexOf(m.name) < 0 && (m.note || "").indexOf("浪彩少女AW9") < 0)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    this.showMultiPick({
      title: "AW9 预备役 · 补员点将一人",
      sub: "满员机制（用户口径）：预备役补齐，随时准备顶上正式成员的空缺",
      pool: pool, count: 1,
      confirmLabel: "入列预备役 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.team + " · ") + "人气" + (m.pop || 0),
      onConfirm: ids => {
        const res = Game.setAw9r21Pick(ids);
        this.renderGame();
        this.toast(res.text);
      },
    });
  },

  /* 【2021·两线通用】《最佳拍档》· 钦点 5 组拍档（4月，不耗 AP）：
     全团可选、两两组队、不可跨团指定（每组两人须同团）；「不钦点」则全团走自动组队。
     落地在 Game.setGePicked21；余下成员 4 月末由引擎按好感度团内自动组队并公布。 */
  showB21PickPicker() {
    const st = Game.st;
    const pairs = [];
    const usedIds = {};
    const remaining = () => Game.bp21Pool(st).filter(m => !usedIds[m.id]);
    const pickOnePair = () => {
      if (pairs.length >= 5) { finish(); return; }
      const pool = remaining().sort((a, b) => (b.pop || 0) - (a.pop || 0));
      if (pool.length < 2) { finish(); return; }
      this.showMultiPick({
        title: "《最佳拍档》· 总监钦点（第 " + (pairs.length + 1) + "/5 组）",
        sub: "点将 2 人为一组拍档——不可跨团指定（两人须同团）；余下成员由节目组按好感度团内自动组队",
        pool: pool, count: 2,
        confirmLabel: "确认这一组 →",
        alt: { label: "「就点这几组 →」", sub: "不点满 5 组也可提前结束（余下成员走自动组队）", fn: () => finish() },
        cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.status === "idft" ? "IDFT · " : m.team + " · ") + "人气" + (m.pop || 0) + " 关系值详见成员关系网",
        onConfirm: ids => {
          const ms = ids.map(id => st.members.find(x => x.id === id)).filter(Boolean);
          if (ms.length === 2 && Game.bp21KeyOf(ms[0]) !== Game.bp21KeyOf(ms[1])) {
            this.toast("不可跨团指定：" + ms[0].name + "（" + Game.bp21KeyOf(ms[0]) + "）与 " + ms[1].name + "（" + Game.bp21KeyOf(ms[1]) + "）不同团。");
            pickOnePair(); return;
          }
          ids.forEach(id => { usedIds[id] = true; });
          const names = ms.map(m => m.name);
          if (names.length === 2) pairs.push(names);
          pickOnePair();
        },
      });
    };
    const finish = () => {
      const r = Game.setGePicked21(pairs);
      this.renderGame();
      this.toast(r.text);
    };
    const c = this.card("《最佳拍档》· 总监钦点",
      "钦点 5 组门面拍档（每组两人须同团）；余下成员按好感度团内自动组队，4 月末公布，未组队者进入单身赛道（5月起可补配）。 不钦点则全团走自动组队。");
    const box = this.el("div", "modal-choices ft-group");
    const opt = (label, sub, fn) => {
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>" + label + "</b><span>" + sub + "</span>";
      b.onclick = () => { this.closeModal(); fn(); };
      box.appendChild(b);
    };
    opt("「开始钦点。」", "链式点将 5 组，每组 2 人（同团限制）", () => pickOnePair());
    opt("「不钦点，全团自动组队。」", "余下成员全部按好感度团内自动组队（4月末公布）", finish);
    c.appendChild(box);
    this.modal(c);
  },

  /* 【2021·两线通用】《最佳拍档》· 单身赛道补配（5月起至期限前，不耗 AP）：
     为未组队成员两两配对（不限同团）；期限月首奇数剔除人气最低者、其余自动配对。
     落地在 Game.setGeSupPairs21。 */
  showB21SinglesPicker() {
    const st = Game.st;
    const picked = [];
    const usedIds = {};
    const dl = Game.bp21Deadline();
    const remaining = () => Game.bp21RemainingSingles(st)
      .map(n => st.members.find(m => m.name === n)).filter(Boolean).filter(m => !usedIds[m.id]);
    const pickOnePair = () => {
      const pool = remaining().sort((a, b) => (b.pop || 0) - (a.pop || 0));
      if (pool.length < 2) { finish(); return; }
      this.showMultiPick({
        title: "《最佳拍档》· 单身赛道补配（已配 " + picked.length + " 组）",
        sub: "为单身赛道成员配对拍档（不限同团）；期限 " + dl + " 月月首收口——人数为单时剔除人气最低者，未配对者自动配对",
        pool: pool, count: 2,
        confirmLabel: "确认这一组 →",
        cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.status === "idft" ? "IDFT · " : m.team + " · ") + "人气" + (m.pop || 0) + " 羁绊" + (m.bond || 0)
          + ((m.bond || 0) >= 70 ? "（✚默契加成候选）" : ""),
        onConfirm: ids => {
          ids.forEach(id => { usedIds[id] = true; });
          const names = ids.map(id => { const m = st.members.find(x => x.id === id); return m ? m.name : null; }).filter(Boolean);
          if (names.length === 2) picked.push(names);
          pickOnePair();
        },
      });
    };
    const finish = () => {
      const r = Game.setGeSupPairs21(picked);
      this.renderGame();
      this.toast(r.text);
    };
    const c = this.card("《最佳拍档》· 单身赛道补配",
      "4月自动组队后仍未配上拍档的成员在此补配（不限同团）。期限前未配对的，节目组将按好感度自动配对；人数为单时剔除人气最低者。");
    const box = this.el("div", "modal-choices ft-group");
    const b = this.el("button", "ft-opt", "");
    b.innerHTML = "<b>「开始补配。」</b><span>链式两两配对，可连续多组</span>";
    b.onclick = () => { this.closeModal(); pickOnePair(); };
    box.appendChild(b);
    const b2 = this.el("button", "ft-opt", "");
    b2.innerHTML = "<b>「交给节目组自动配对。」</b><span>期限月首按好感度自动配对</span>";
    b2.onclick = () => { this.closeModal(); this.toast("已登记：期限月首未配对成员将按好感度自动配对。"); };
    box.appendChild(b2);
    c.appendChild(box);
    this.modal(c);
  },

  /* 【2021·方案一】《最佳拍档》总选组队窗：链式二人组队——
     每次点将 2 人为一组，可连续组多组；「组队完毕」落地在 Game.setGePairs21（未组队者个人参赛）。 */
  showGePairs21Picker() {
    const st = Game.st;
    const pairs = [];
    const usedIds = {};
    const remaining = () => st.members.filter(m => (m.status === "active" || m.status === "idft") && !m.hall && !usedIds[m.id]);
    const pickOnePair = () => {
      const pool = remaining().sort((a, b) => (b.pop || 0) - (a.pop || 0));
      if (pool.length < 2) { finish(); return; }
      this.showMultiPick({
        title: "《最佳拍档》· 组队（第 " + (pairs.length + 1) + " 组）",
        sub: "点将 2 人为一组搭档（总选人气为两人之和；组内双方羁绊均≥70 时开榜额外加成）",
        pool: pool, count: 2,
        confirmLabel: "确认这一组 →",
        cardInfo: m => (m.status === "idft" ? "IDFT · " : m.team + " · ") + "人气" + (m.pop || 0) + " 羁绊" + (m.bond || 0)
          + ((m.bond || 0) >= 70 ? "（✚默契加成候选）" : ""),
        onConfirm: ids => {
          ids.forEach(id => { usedIds[id] = true; });
          const names = ids.map(id => { const m = st.members.find(x => x.id === id); return m ? m.name : null; }).filter(Boolean);
          if (names.length === 2) pairs.push(names);
          pickOnePair();
        },
      });
    };
    const finish = () => {
      const res = Game.setGePairs21(pairs);
      this.renderGame();
      this.toast(res.text);
    };
    /* 先给一次选择：组队或全员个人参赛 */
    const c = this.card("《最佳拍档》· 总选组队",
      "组队制总选：两人一组参赛，总选人气为两人之和；组内双方羁绊均≥70 时额外加成。不组队的成员以个人身份参赛。");
    const box = this.el("div", "modal-choices ft-group");
    const opt = (label, sub, fn) => {
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>" + label + "</b><span>" + sub + "</span>";
      b.onclick = () => { this.closeModal(); fn(); };
      box.appendChild(b);
    };
    opt("「开始组队。」", "链式二人组队，可连续组多组", () => pickOnePair());
    opt("「今年全员个人参赛。」", "不组队：沿用个人人气开榜", finish);
    c.appendChild(box);
    this.modal(c);
  },

  showAW9Picker(onDone) {
    const st = Game.st;
    const pool = st.members.filter(m => (m.status === "active" || m.status === "branch") && !m.hall
      && (m.note || "").indexOf("浪彩少女AW9") < 0)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    this.showMultiPick({
      title: "浪彩少女AW9 · 预备役点将九人",
      sub: "电商直播间与云公演串场轮班（本部+分团在册成员皆可选，非殿堂、未属 AW9）",
      pool: pool, count: 9,
      confirmLabel: "官宣成团 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.team + " · ") + "人气" + (m.pop || 0),
      onConfirm: ids => {
        const res = Game.setAW9Reserve(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 【2020·11月】《燃野少年的天空》选角点将窗：配角名额 1~2 人（含影视部 HALL 成员）；
     落地在 engine.applyRanye20（count=2 争取配角 / 1 龙套历练）。 */
  showRanyePicker(count, onDone) {
    const st = Game.st;
    const pool = st.members.filter(m => m.status === "active" || m.status === "branch")
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    this.showMultiPick({
      title: "《燃野少年的天空》· 选角点将" + count + "人",
      sub: (count >= 2 ? "争取到的两个配角名额" : "一个配角名额 + 若干不露脸的群像龙套") + "——全团在册成员（含分团、影视部）皆可选",
      pool: pool, count: count,
      confirmLabel: "参演名单敲定 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : (m.hall ? "影视部 · " : m.team + " · ")) + "人气" + (m.pop || 0) + (m.pwr != null ? " 实力" + m.pwr : ""),
      onConfirm: ids => {
        const res = Game.applyRanye20(count, ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* TEB48 成员安置窗（2020 主线④·复刻线）：上调本部各队或返回日本；落地在 engine.applyTeb20 */
  showTeb20Picker() {
    const st = Game.st;
    const targets = st.members.filter(m => m.status === "branch" && m.branchTeam === "TEB48");
    const teams = [
      { key: "SII", label: "上调 Team SII", cls: "on-sii" },
      { key: "NII", label: "上调 Team NII", cls: "on-nii" },
      { key: "HII", label: "上调 Team HII", cls: "on-hii" },
      { key: "X",   label: "上调 Team X",   cls: "on-x" },
    ];
    if (Game.keptXiiInRoster(st)) teams.push({ key: "XII", label: "上调 Team XII", cls: "on-xii" });   // XII 保留时视同正常本部队伍
    teams.push({ key: "japan", label: "离团 · 返回日本", cls: "" });
    this.showTeamAssignPicker({
      title: "TEB48 交还 · 安置名单",
      sub: "和平分手前，为每位台北成员安排去向（点击卡片循环切换；未安置者将返回日本）",
      pool: targets,
      teams: teams,
      confirmLabel: "安置名单敲定 →",
      onConfirm: dst => {
        const res = Game.applyTeb20(dst);
        this.renderGame();
        if (res.vn) this.playScene(res.vn, () => this.toast(res.text));
        else this.toast(res.text);
      },
    });
  },

  /* 一期生合约窗（2020 主线⑤）：逐人续约/影视约/毕业/转工作人员（默认预填续约，
     低点击量规范：只点需变更的成员）；影视约需演技达标（ACT_FILM_MIN，引擎校验）；
     赵嘉敏不进安置（各路线均排除，用户口径）；落地在 engine.applyGen1 */
  showGen1Picker() {
    const st = Game.st;
    const targets = st.members.filter(m => m.gen === "一期生" && (m.status === "active" || m.status === "rest")
      && m.name !== "赵嘉敏");
    const teams = [
      { key: "renew", label: "说服续约", cls: "" },
      { key: "film",  label: "影视约续约（需演技≥" + Game.ACT_FILM_MIN + "）", cls: "" },
      { key: "grad",  label: "合约期满毕业", cls: "" },
      { key: "staff", label: "转为工作人员", cls: "" },
    ];
    this.showTeamAssignPicker({
      title: "一期生合约 · 逐人拍板",
      sub: "一期生合约年内到期——默认全员续约（成功进「丝芭传媒」分类）；只需点击需变更的成员：影视约续约（需演技≥" + Game.ACT_FILM_MIN + "，基础概率+5%，成功转入影视部）/ 毕业 / 转岗。",
      pool: targets,
      teams: teams,
      defaultKey: "renew",
      cardInfo: m => (m.skills ? "演技" + m.skills.ac + " · " : "") + (m.status === "rest" ? "暂休" : m.team),
      confirmLabel: "合约名单敲定 →",
      onConfirm: dst => {
        const res = Game.applyGen1(dst);
        this.renderGame();
        this.toast(res.text);
      },
    });
  },

  /* CGT48 移籍预备生升格窗（2026 解散路线）：落地逻辑在 engine.promoteCgt */
  showCgtPromotePicker(onDone) {
    const st = Game.st;
    const targets = st.members.filter(m => m.gen === "CGT48移籍" && m.team === "PREP" && m.status === "active");
    this.showTeamAssignPicker({
      title: "升格名单 · 选择队伍",
      sub: "为每位 CGT48 移籍预备生选择归队（点击卡片循环切换队伍）；全员分配后可确认",
      pool: targets,
      confirmLabel: "升格名单敲定 →",
      onConfirm: dst => {
        const res = Game.promoteCgt(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 二十三期预备生升格窗（2026 年 2 月，含 22 期应籽言一并转正）；落地在 engine.promoteTeams23。
     注意排除 CGT48 移籍预备生——她们的升格走 5 月联动事件（flags.cgtPromoted 线） */
  showP23PromotePicker(onDone) {
    const st = Game.st;
    const targets = st.members.filter(m => m.team === "PREP" && m.status === "active" && m.gen !== "CGT48移籍");
    this.showTeamAssignPicker({
      title: "二十三期升格名单 · 选择队伍",
      sub: "为二十三期预备生选择归队（22 期应籽言一并转正）；点击卡片循环切换队伍",
      pool: targets,
      confirmLabel: "升格名单敲定 →",
      onConfirm: dst => {
        const res = Game.promoteTeams23(dst);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 开拓者六人点将窗（2017 分团线伏笔：六人随总监移籍 SHY48/CKG48） */
  showPioneerPicker(onDone) {
    const st = Game.st;
    const target = st.decisions.branchPost;
    const city = target === "SHY48" ? "沈阳" : "重庆";
    this.showMultiPick({
      title: "开拓者名单 · 点将六人",
      sub: "明年一月随你移籍" + city + "（" + target + "）。BEJ48/GNZ48 成员无影响；SNH48 高人气成员（⚠）可能不满，有概率提出离团",
      pool: st.members.filter(m => m.status === "active" || m.status === "branch"),
      count: 6,
      confirmLabel: "名单敲定，共赴新河 →",
      cardInfo: m => m.status === "branch"
        ? m.branchTeam + " " + (m.branchLabel || "")
        : m.team + " · 人气" + m.pop + (m.pop >= 60 ? " ⚠高人气" : ""),
      onConfirm: ids => {
        const res = Game.pioneerPick(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 特训三项（用户口径 2026-XX：唱功/舞蹈/MC 各自独立行动）：成员选择窗（按目标技能升序：优先补短板） */
  showCoachPicker(skillId) {
    const SK = { coachVo: ["vo", "唱功"], coachDa: ["da", "舞蹈"], coachMc: ["mc", "MC"] };
    const key = SK[skillId] ? SK[skillId][0] : "vo", skName = SK[skillId] ? SK[skillId][1] : "唱功";
    const val = m => m.skills ? m.skills[key] : (m.pwr || 0);
    const c = this.card(skName + "特训 · 选择成员", "选择一名成员进行一对一" + skName + "特训（" + skName + "+6 羁绊+4 资金-20万" + "）");
    const grid = this.el("div", "pick-grid");
    for (const m of Game.activeMembers(Game.st).slice().sort((a, b) => val(a) - val(b))) {
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = m.name + '<span class="pb-team">' + m.team + " · "
        + (m.skills ? "唱功" + m.skills.vo + " 舞蹈" + m.skills.da + " MC" + m.skills.mc : "实力" + (m.pwr || 0))
        + " · 羁绊" + m.bond + "</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.doAction(skillId, { memberId: m.id });
        if (!res) return;
        this.renderGame();
        this.toast(res.text);
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "先不练了（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* 2017 线：公演制作的队伍选择窗（选队后播放制作/排练场景，选项内落地数值）；复刻模式文案随 jpMode 切换 */
  showOrigPicker() {
    const st = Game.st;
    const rep = Game.isReplicate(st);
    const TEAMS = ["SII", "NII", "HII", "X"].filter(t => !st.orig[t]);
    const c = this.card(rep ? "复刻公演排练 · 选择队伍" : "原创公演制作 · 选择队伍", rep
      ? "排练日方授权的四套新复刻公演（主线⑥）；每套排练成本 40万"
      : "为本部四队各制作一套原创公演（主线⑥）；每套耗资 "
        + (st.decisions.akbSplit === "original" || st.flags.originalSongsStarted ? "60万（源头计划曲库支援）" : "80万"));
    const grid = this.el("div", "pick-grid");
    for (const t of TEAMS) {
      const members = st.members.filter(m => m.status === "active" && m.team === t && m.pwr != null);
      const avg = members.length ? Math.round(members.reduce((s, m) => s + m.pwr, 0) / members.length) : 0;
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = "Team " + t + '<span class="pb-team">队内平均实力 ' + avg + (st.orig[t] ? " · ✔ 已完成" : "") + "</span>";
      b.onclick = () => {
        this.closeModal();
        this.playScene(STORY.scenes17.orig(t), () => this.renderGame());
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "再考虑一下（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* 【2018 主线④】《双面偶像》复刻承办队伍选择窗（队伍平均实力影响复刻效果） */
  showSm18TeamPicker() {
    const st = Game.st;
    const teams = st.flags.xiiKept18 ? ["SII", "NII", "HII", "X", "XII"] : ["SII", "NII", "HII", "X"];
    const c = this.card("《双面偶像》复刻 · 选择承办队伍", "由哪支队伍把广州的舞台复刻到本部？队伍平均实力越高，复刻效果越好（主线④）");
    const grid = this.el("div", "pick-grid");
    for (const t of teams) {
      const members = st.members.filter(m => m.status === "active" && m.team === t && m.pwr != null);
      const avg = members.length ? Math.round(members.reduce((s, m) => s + m.pwr, 0) / members.length) : 0;
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = "Team " + t + '<span class="pb-team">队内平均实力 ' + avg + "（" + members.length + " 人）</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.setSm18Team(t);
        this.renderGame();
        this.playScene(res.vn, () => this.renderGame());
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "再考虑一下（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* 【v0.13.1】队伍团建（全线通用）：选择要团建的队伍（本部各队/预备生/各分团） */
  showTeamBldPicker() {
    const st = Game.st;
    Game.syncTeams(st);
    const keys = [...new Set(st.members.map(m => Game.teamKeyOf(m)).filter(Boolean))];
    const c = this.card("队伍团建 · 选择队伍",
      "聚餐、剧本杀还是密室逃脱？让她们自己投票决定——你只管买单。\n（耗资 15 万：磨合度 +6 · 士气 +2 · 队友关系小幅升温）");
    const grid = this.el("div", "pick-grid");
    for (const k of keys) {
      const n = Game.teamRoster(st, k).length;
      const chem = st.chem[k] != null ? st.chem[k] : Game.calcChem(st, k);
      const low = chem < Game.REL_CHEM_LOW;
      const b = this.el("button", "pick-btn", "");
      const label = k === "PREP" ? "预备生" : (k.length <= 3 ? "Team " + k : k);
      b.innerHTML = label + '<span class="pb-team">磨合度 ' + chem + (low ? " ⚠" : "") + " · " + n + " 人</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.doAction("teamBld", { team: k });
        this.renderGame();
        if (res && res.text) this.toast(res.text);
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "再考虑一下（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* 【全线通用·成员属性系统 v2】培训成员守则：选择要培训的队伍（本部各队/预备生/各分团，
     全队失格值-20，耗资15万；低点击量规范：单选一队一键确认，无逐人操作） */
  showDqRulePicker() {
    const st = Game.st;
    const keys = [...new Set(st.members
      .filter(m => (m.status === "active" || m.status === "branch") && !m.hall && m.dq != null)
      .map(m => Game.teamKeyOf(m)).filter(Boolean))];
    const c = this.card("培训成员守则 · 选择队伍",
      "守则宣讲、案例警示、随堂测验——把规矩重新刻进心里。\n（耗资 15 万：全队失格值 -20 · 士气 +1）");
    const grid = this.el("div", "pick-grid");
    for (const k of keys) {
      const roster = Game.teamRoster(st, k).filter(m => !m.hall && m.dq != null);
      const maxDq = roster.length ? Math.max(...roster.map(m => m.dq || 0)) : 0;
      const b = this.el("button", "pick-btn", "");
      const label = k === "PREP" ? "预备生" : (k.length <= 3 ? "Team " + k : k);
      b.innerHTML = label + '<span class="pb-team">' + roster.length + " 人 · 全队最高失格值 " + maxDq + (maxDq >= Game.DQ_LINE ? " ⚠" : "") + "</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.doAction("dqTrain", { team: k });
        this.renderGame();
        if (res && res.text) this.toast(res.text);
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "再考虑一下（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  /* ========================================================================
     【全线通用】公演站位调整（用户口径 2026-10-26）：
     逐队拍板（每队 1 行动点，一次只显示一队，含分团）；
     大歌 16 人站位（≤16 人时全员必须有站位，>16 人至多 16 个站位）+
     solo/双人/三人/四人/五人 unit 各一（每人至多 2 个 unit，同 unit 好感度上升）；
     一键安排按总选成绩自动排站。 ======================================================================== */
  showStageTeamPicker() {
    const st = Game.st;
    const teams = Game.stageTeams(st);
    const stg = Game.stageInit(st);
    const c = this.card("公演站位调整 · 选择队伍",
      "总选落幕，公演站位可以重新排了。逐队拍板：大歌 16 人站位 + solo/双人/三人/四人/五人 unit 各一。\n（每队 1 行动点；年末仍未拍板的队伍，将默认按总选成绩自动排站）");
    const grid = this.el("div", "pick-grid");
    for (const t of teams) {
      const n = Game.teamRoster(st, t).length;
      const b = this.el("button", "pick-btn", "");
      const label = t.length <= 3 ? "Team " + t : t;
      b.innerHTML = label + '<span class="pb-team">' + (stg.done[t] ? "已拍板 ✓（可重排） · " : "未拍板 · ") + n + " 人</span>";
      b.onclick = () => {
        this.closeModal();
        const r = Game.doAction("stageSet", { team: t });
        if (r && r.tone === "stageEdit") this.showStageEditor(t);
        else if (r && r.text) { this.renderGame(); this.toast(r.text); }
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "返回（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  showStageEditor(team) {
    const st = Game.st;
    const roster = Game.stageRoster(st, team);   /* 含兼任成员（剧情兼任/分团TOP1兼任本部） */
    const stg = Game.stageInit(st);
    /* 编辑态：pos {id:rank} / units {solo,duo,trio,quad,quint} / sel 当前选中成员 */
    const pos = {}, units = { solo: [], duo: [], trio: [], quad: [], quint: [] };
    if (stg.done[team] && stg.pos[team]) {
      for (const id in stg.pos[team]) pos[id] = stg.pos[team][id];
      for (const k in units) units[k] = (stg.units[team] && stg.units[team][k] || []).slice();
    }
    let sel = null;
    const geRank = {};
    const top = (st.geResult && Array.isArray(st.geResult.top48)) ? st.geResult.top48 : [];
    for (const r of top) if (r.team === team) geRank[r.name] = r.rank;
    /* 队内基准排名（stageBaseline：总选名次在前，未入名单同级垫底）——拍板反馈即以此为基准 */
    const base = Game.stageBaseline(st, team);
    const rankInTeam = {};
    base.forEach((id, i) => { rankInTeam[id] = i + 1; });
    const sizes = { solo: 1, duo: 2, trio: 3, quad: 4, quint: 5 };
    const uLabels = { solo: "solo unit", duo: "双人 unit", trio: "三人 unit", quad: "四人 unit", quint: "五人 unit" };
    const byId = id => roster.find(m => m.id === id);
    const nameOf = id => { const m = byId(id); return m ? m.name : "?"; };
    const unitCount = id => ["solo","duo","trio","quad","quint"].reduce((s,k) => s + (units[k].indexOf(id) >= 0 ? 1 : 0), 0);

    const c = this.card("公演站位 · " + (team.length <= 3 ? "Team " + team : team), "");
    const body = this.el("div", "stage-editor");
    c.appendChild(body);
    const errBox = this.el("div", "", "");
    errBox.style.cssText = "color:#c0392b;font-size:12px;min-height:16px;margin:4px 0";

    const render = () => {
      body.innerHTML = "";
      const placedN = Object.keys(pos).length;
      const info = this.el("div", "", "");
      info.style.cssText = "font-size:12px;color:#666;margin-bottom:6px";
      info.textContent = "在册 " + roster.length + " 人 · 已排站位 " + placedN + "/16" +
        (roster.length > 16 ? "（超员：只有 16 个站位，其余欠席）" : "（全员必须有站位）");
      body.appendChild(info);

      /* 站位槽 16 格 */
      const grid = this.el("div", "stage-pos-grid");
      grid.style.cssText = "display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-bottom:8px";
      for (let r = 1; r <= 16; r++) {
        const id = Object.keys(pos).find(k => pos[k] === r);
        const cell = this.el("div", "stage-slot", "");
        cell.style.cssText = "border:1px solid #ccc;border-radius:6px;padding:4px 2px;text-align:center;font-size:12px;min-height:34px;cursor:pointer;color:#333;background:" + (id ? "#eef5ff" : "#fafafa");
        if (id) {
          cell.innerHTML = "<b>" + r + "</b> " + nameOf(id);
          cell.onclick = () => { delete pos[id]; render(); };
        } else {
          cell.innerHTML = "<b>" + r + "</b> 号位";
          cell.onclick = () => { if (sel && !Object.keys(pos).some(k => pos[k] === r)) { pos[sel] = r; sel = null; render(); } };
        }
        grid.appendChild(cell);
      }
      body.appendChild(grid);

      /* unit 五行 */
      for (const k of ["solo", "duo", "trio", "quad", "quint"]) {
        const row = this.el("div", "stage-unit-row");
        row.style.cssText = "display:flex;align-items:center;gap:4px;margin-bottom:4px;font-size:12px";
        const lab = this.el("div", "", uLabels[k]);
        lab.style.cssText = "width:70px;flex:none;color:#555";
        row.appendChild(lab);
        for (let i = 0; i < sizes[k]; i++) {
          const id = units[k][i];
          const cell = this.el("div", "stage-slot", "");
          cell.style.cssText = "border:1px dashed #aaa;border-radius:6px;padding:3px 6px;cursor:pointer;color:#333;background:" + (id ? "#fff7e6" : "#fafafa");
          if (id) {
            cell.textContent = nameOf(id);
            cell.onclick = () => { units[k].splice(units[k].indexOf(id), 1); render(); };
          } else {
            cell.textContent = "+";
            cell.onclick = () => {
              if (!sel) return;
              if (unitCount(sel) >= 2) { errBox.textContent = nameOf(sel) + " 已编入 2 个 unit（每人至多两个）。"; return; }
              units[k].push(sel); sel = null; render();
            };
          }
          row.appendChild(cell);
        }
        body.appendChild(row);
      }

      /* 成员点将区 */
      const memLab = this.el("div", "", "点将（点击成员选中，再点站位/unit 落位；点已落位项可移除）：");
      memLab.style.cssText = "font-size:12px;color:#555;margin:6px 0 4px";
      body.appendChild(memLab);
      const chips = this.el("div", "stage-chips");
      chips.style.cssText = "display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px";
      for (const m of roster) {
        const chip = this.el("div", "stage-chip", "");
        const placed = pos[m.id] ? pos[m.id] + "号位" : "";
        const uc = unitCount(m.id);
        const rk = rankInTeam[m.id] || "?";
        chip.style.cssText = "border:1px solid " + (sel === m.id ? "#e67e22" : "#bbb") + ";border-radius:14px;padding:3px 8px;font-size:12px;cursor:pointer;color:#333;background:" + (sel === m.id ? "#fdebd0" : placed ? "#d6eaf8" : "#f4f4f4") + ";" + (uc ? "box-shadow:0 0 0 2px #f7dc6f inset;" : "");
        chip.innerHTML = "<b>" + m.name + "</b> <span style=\"color:#1a5276\">队内#" + rk + "</span>" +
          (Game.memberConcurTeam(st, m) === team ? ' <span style="color:#7d3c98">兼任</span>' : '') +
          (geRank[m.name] ? ' <span style="color:#2471a3">GE#' + geRank[m.name] + "</span>" : ' <span style="color:#888">未入名单</span>') +
          (placed ? " · " + placed : "") + (uc ? " · unit×" + uc : "");
        chip.onclick = () => { sel = sel === m.id ? null : m.id; errBox.textContent = ""; render(); };
        chips.appendChild(chip);
      }
      body.appendChild(chips);
      body.appendChild(errBox);
    };
    render();

    const btnRow = this.el("div", "stage-btns");
    btnRow.style.cssText = "display:flex;gap:8px;flex-wrap:wrap;margin-top:8px";
    const mkBtn = (label, cls, fn) => {
      const b = this.el("button", "btn " + cls, label);
      b.onclick = fn; btnRow.appendChild(b); return b;
    };
    mkBtn("一键安排（按总选成绩）", "btn-ghost", () => {
      const a = Game.autoStageAssign(st, team);
      for (const k in pos) delete pos[k];
      for (const k in a.pos) pos[k] = a.pos[k];
      for (const k in units) units[k] = a.units[k].slice();
      sel = null; errBox.textContent = ""; render();
    });
    mkBtn("清空", "btn-ghost", () => {
      for (const k in pos) delete pos[k];
      for (const k in units) units[k] = [];
      sel = null; errBox.textContent = ""; render();
    });
    mkBtn("确定拍板（1 行动点）", "btn-primary", () => {
      const err = Game.validateStage(st, team, { pos: pos, units: units });
      if (err) { errBox.textContent = err; return; }
      const res = Game.doAction("stageSet", { team: team, assign: { pos: pos, units: units } });
      this.closeModal();
      this.renderGame();
      if (res && res.text) this.toast(res.text);
      /* 拍完一队回主界面，行动点留给玩家自由安排；继续排站需再次点击行动 */
    });
    mkBtn("返回", "btn-ghost", () => this.closeModal());
    c.appendChild(btnRow);
    this.modal(c);
  },

  /* 【2016·3月】《纯洁心灵·逐梦演艺圈》同名主题曲 MV 队伍点将窗：点将一支队伍全员参演；
     落地在 engine.applyZhumeng16。队伍列表由在册成员所在队伍动态生成（XII 保留时同理列出）。 */
  showZhumeng16Picker(onDone) {
    const st = Game.st;
    Game.syncTeams(st);
    const keys = [...new Set(st.members.filter(m => m.status === "active").map(m => m.team).filter(Boolean))];
    const c = this.card("《纯洁心灵·逐梦演艺圈》 · 点将队伍",
      "点将一支队伍，全员参演同名主题曲 MV。\n（全队每人人气+2 演技+1 羁绊+2；通告费 +20万 · 热度+3）");
    const grid = this.el("div", "pick-grid");
    for (const k of keys) {
      const n = st.members.filter(m => m.status === "active" && m.team === k).length;
      const b = this.el("button", "pick-btn", "");
      b.innerHTML = (k.length <= 3 ? "Team " + k : k) + '<span class="pb-team">' + n + " 人在册</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.applyZhumeng16(k);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    this.modal(c);
  },

  /* 【2018 主线①】组阁编制会（两阶段）：逐人定队 → 队长队副任命 → 引擎落笔（Game.applyReorg18）。
     规则：每队下限13 / 上限20（主力16+替补4，按人气自动划档）；FT 随组阁成立；
     编入预备生 ≤16 人（本部成员羁绊-4；分团成员上调预备生视为上调、享红利）；
     落编者移籍分团（BEJ→GNZ→SHY→CKG 轮替，羁绊-8）；分团上调候选享「上调红利」。
     onDone：月末链回调（编制会经 3 月末事件 pickMode 转交时传入，落地后恢复链推进）。 */
  showReorg18Picker(onDone) {
    const st = Game.st;
    /* 【兜底】XII 去留未定时先补问（正常流程 1 月张怡事件已问；
       若玩家先于 1 月月末启动组阁，张怡事件不再触发，在此补上同一抉择） */
    if (st.decisions.xiiKeep18 == null) { this.showXiiKeepChoice(onDone); return; }
    const kept = !!st.flags.xiiKept18;
    const TEAMS = kept ? ["SII", "NII", "HII", "X", "XII", "FT"] : ["SII", "NII", "HII", "X", "FT"];
    const pools = Game.reorg18Pools(st);
    const assign = {};   // id → 队伍 | "prep"(编入/留任预备生) | "drop" | "stay"
    /* 默认值：本部成员留原队；预备生默认留任（不计入编入上限）；
       XII 解散时 XII 成员默认落编；分团候选默认留任 */
    for (const m of pools.head) {
      if (m.team === "PREP") assign[m.id] = "prep";
      else assign[m.id] = (kept || m.team !== "XII") ? m.team : "drop";
    }
    for (const m of pools.branch) assign[m.id] = "stay";

    /* ---- 实时计数：每队名册 + 主力/替补划档 ---- */
    const rosterOf = () => {
      const byTeam = {}; TEAMS.forEach(t => { byTeam[t] = []; });
      for (const m of pools.head.concat(pools.branch)) {
        const t = assign[m.id];
        if (t && TEAMS.indexOf(t) >= 0) byTeam[t].push(m);
      }
      for (const t of TEAMS) byTeam[t].sort((a, b) => (b.pop || 0) - (a.pop || 0));
      return byTeam;
    };

    /* ================= 阶段一：逐人定队 ================= */
    const c = this.card("组阁编制会 · 逐人定队",
      "点击卡片循环选择新队伍；落编者将移籍分团（BEJ→GNZ→SHY→CKG 轮替，羁绊-8）。" +
      "每队下限 13 人、上限 20 人（前 16 主力 · 其余替补）；Team FT 随组阁成立" + (kept ? "；XII 保留编制" : "；XII 解散、全员重编") +
      "；正式成员可编入预备生至多 16 人（羁绊-4，轻于落编），预备生可留任或直接定队升格（人气+4 羁绊+4）" +
      (pools.branch.length ? "；带 ★ 的分团成员可上调本部/预备生（视为上调、享红利）" : ""));
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "名册敲定，进入队长任命 →");
    confirmBtn.disabled = true;

    const refresh = () => {
      const byTeam = rosterOf();
      let bad = false;
      const parts = TEAMS.map(t => {
        const n = byTeam[t].length;
        const sub = Math.max(0, n - 16);
        const out = n < 13 || n > 20;
        if (out) bad = true;
        return "Team " + t + " " + n + " 人" + (out ? "⚠" : "✔") + (n > 16 ? "（主力16·替补" + sub + "）" : "");
      });
      /* 编入预备生计数：仅正式成员降入 + 分团上调预备生（预备生留任不计） */
      const prepN = pools.head.filter(m => m.team !== "PREP" && assign[m.id] === "prep").length
        + pools.branch.filter(m => assign[m.id] === "prep").length;
      if (prepN > 16) bad = true;
      const dropN = pools.head.filter(m => assign[m.id] === "drop").length;
      counter.textContent = parts.join(" · ") + " · 编入预备生 " + prepN + "/16 · 落编移籍 " + dropN + " 人" +
        (bad ? "　——人数越界（队伍或预备生）" : "　——可以确认");
      confirmBtn.disabled = bad;
    };

    /* 本部成员：按现队分节（预备生=九期生等一并参编） */
    for (const t of ["SII", "NII", "HII", "X", "XII"]) {
      const list = pools.head.filter(m => m.team === t);
      if (!list.length) continue;
      grid.appendChild(this.el("div", "pick-section", "—— 原 Team " + t + (t === "XII" && !kept ? "（解散·全员重编）" : "") + " ——"));
      for (const m of list) {
        grid.appendChild(this.makeReorgBtn(m, TEAMS, assign, refresh, true));
      }
    }
    {
      /* 预备生节：默认留任；可选入各队（直接定队升格） */
      const list = pools.head.filter(m => m.team === "PREP");
      if (list.length) {
        grid.appendChild(this.el("div", "pick-section", "—— 预备生（PREP）· 默认留任；可选入各队直接定队 ——"));
        for (const m of list) {
          grid.appendChild(this.makeReorgBtn(m, TEAMS, assign, refresh, "prep"));
        }
      }
    }
    /* 分团上调候选 */
    if (pools.branch.length) {
      grid.appendChild(this.el("div", "pick-section", "—— 分团上调候选（★ 默认留任；上调本部/预备生享红利）——"));
      for (const m of pools.branch) {
        grid.appendChild(this.makeReorgBtn(m, TEAMS, assign, refresh, false));
      }
    }
    confirmBtn.onclick = () => this.showReorg18Captains(TEAMS, pools, assign, onDone);
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——编制会必须完成
    refresh();
  },

  /* 组阁编制会 · 前置：Team XII 去留（与 1 月张怡事件同一决策 tag/效果，见 Game.confirmXiiKeep18）。
     落定后自动进入编制会主体（保留=XII 参与编组；取消=XII 成员默认落编、全员重编）。 */
  showXiiKeepChoice(onDone) {
    const c = this.card("组阁编制会 · Team XII 去留",
      "编制名单落笔前的最后一项确认——XII 的去留将决定本次编制的对象（此项通常在 1 月张怡的请求中决定）");
    const box = this.el("div", "modal-choices");
    const mk = (label, hint, keep) => {
      const b = this.el("button", "ft-opt", "");
      b.innerHTML = "<b>" + label + "</b><span>" + hint + "</span>";
      b.onclick = () => {
        const res = Game.confirmXiiKeep18(keep);
        this.closeModal();
        this.toast(res.text);
        this.renderGame();
        this.showReorg18Picker(onDone);
      };
      box.appendChild(b);
    };
    mk("「XII 保留。名字我来保，成绩你们自己挣。」", "保留 XII 编制：士气+4；组阁多一步编制确认；XII 参与本次编组", true);
    mk("「XII 的名字停在最好的时候。孩子们，往前走。」", "取消 XII 编制：资金+20；组阁三步完成；XII 成员全员重编（默认落编分团）", false);
    c.appendChild(box);
    this.modal(c);   // 不给关闭按钮——去留必须先落定
  },

  /* 组阁编制会：单张成员卡（点击循环选择目标）。
     kind=true（本部正式成员）：循环 当前队→各队→预备生→落编；
     kind="prep"（本部预备生）：循环 留任预备生→各队；
     kind=false（分团候选）：循环 各队→预备生→留任。 */
  makeReorgBtn(m, TEAMS, assign, refresh, kind) {
    const b = this.el("button", "pick-btn", "");
    const isPrep = kind === "prep";
    const order = isPrep ? ["prep"].concat(TEAMS)
      : kind ? TEAMS.concat(["prep", "drop"]) : TEAMS.concat(["prep", "stay"]);
    const CLS = { SII: "on-sii", NII: "on-nii", HII: "on-hii", X: "on-x", XII: "on-xii", FT: "on-ft", prep: "on-prep", drop: "on-drop", stay: "" };
    const labelOf = t => {
      if (t === "prep") return isPrep ? "留任预备生" : "→ 预备生（PREP）";
      if (t === "drop") return "落编 · 移籍分团";
      if (t === "stay") return "★ 留任分团";
      return "→ Team " + t;
    };
    const paint = () => {
      Object.keys(CLS).forEach(k => { if (CLS[k]) b.classList.remove(CLS[k]); });
      const cur = assign[m.id];
      if (CLS[cur]) b.classList.add(CLS[cur]);
      const mark = kind ? (isPrep ? "☆ " : "") : "★ ";
      b.innerHTML = mark + m.name + '<span class="pb-team">' + labelOf(cur) + " · 人气" + (m.pop || 0) + "</span>";
    };
    b.onclick = () => {
      const idx = order.indexOf(assign[m.id]);
      assign[m.id] = order[(idx + 1) % order.length];
      paint(); refresh();
    };
    paint();
    return b;
  },

  /* 组阁编制会 · 阶段二：队长队副任命（每队 1 队长必须 / 队副至多 1；现职仍在队内则预填） */
  showReorg18Captains(TEAMS, pools, assign, onDone) {
    const byTeam = {}; TEAMS.forEach(t => { byTeam[t] = []; });
    for (const m of pools.head.concat(pools.branch)) {
      const t = assign[m.id];
      if (t && TEAMS.indexOf(t) >= 0) byTeam[t].push(m);
    }
    for (const t of TEAMS) byTeam[t].sort((a, b) => (b.pop || 0) - (a.pop || 0));
    const role = {};   // id → "cap" | "vice"
    /* 预填：现任队长/队副仍在该队 → 保留；XII 保留且无现职队长 → 张怡预填；
       其余无现职队长的队伍（如新成立的 FT）预填人气最高者——玩家可点击更换 */
    for (const t of TEAMS) {
      const cap0 = byTeam[t].find(m => m.captain);
      const vice0 = byTeam[t].find(m => m.vice);
      if (cap0) role[cap0.id] = "cap";
      if (vice0) role[vice0.id] = "vice";
      if (!cap0 && t === "XII") {
        const zy = byTeam[t].find(m => m.name === "张怡");
        if (zy) role[zy.id] = "cap";
      }
      if (!byTeam[t].some(m => role[m.id] === "cap")) {
        const top = byTeam[t][0];
        if (top) role[top.id] = "cap";
      }
    }
    const c = this.card("组阁编制会 · 队长队副任命",
      "点击成员卡片循环：未任 → 队长 → 队副 → 未任。每队必须任命一名队长，队副可选（结果在成员卡上显示徽标）");
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "公布新编制名单 →");
    confirmBtn.disabled = true;
    const refresh = () => {
      let bad = false;
      const parts = TEAMS.map(t => {
        const cap = byTeam[t].filter(m => role[m.id] === "cap").length;
        const vice = byTeam[t].filter(m => role[m.id] === "vice").length;
        const out = cap !== 1 || vice > 1;
        if (out) bad = true;
        return "Team " + t + (out ? " 队长⚠" : " ✔") + (vice ? "·副×" + vice : "");
      });
      counter.textContent = parts.join(" · ") + (bad ? "　——每队恰一名队长（队副至多一名）" : "　——可以公布");
      confirmBtn.disabled = bad;
    };
    for (const t of TEAMS) {
      grid.appendChild(this.el("div", "pick-section", "—— Team " + t + "（" + byTeam[t].length + " 人）——"));
      for (const m of byTeam[t]) {
        const b = this.el("button", "pick-btn", "");
        const paint = () => {
          b.classList.remove("on-cap", "on-vice");
          const r = role[m.id];
          if (r === "cap") b.classList.add("on-cap");
          if (r === "vice") b.classList.add("on-vice");
          b.innerHTML = m.name + '<span class="pb-team">' + (r === "cap" ? "队长" : r === "vice" ? "队副" : "点击任命") + " · 人气" + (m.pop || 0) + "</span>";
        };
        b.onclick = () => {
          if (role[m.id]) {
            delete role[m.id];   // 已任 → 摘下
          } else {
            const hasCap = byTeam[t].some(x => role[x.id] === "cap");
            const hasVice = byTeam[t].some(x => role[x.id] === "vice");
            role[m.id] = !hasCap ? "cap" : (!hasVice ? "vice" : "cap");   // 无队长授队长；有队长无队副授队副；都满则顶替队长
          }
          /* 每队至多一正一副：新授者顶替同队旧任（保留刚点的这位） */
          const caps = byTeam[t].filter(x => role[x.id] === "cap");
          if (caps.length > 1) { const other = caps.find(x => x.id !== m.id); if (other) delete role[other.id]; }
          const vices = byTeam[t].filter(x => role[x.id] === "vice");
          if (vices.length > 1) { const other = vices.find(x => x.id !== m.id); if (other) delete role[other.id]; }
          paint(); refresh();
        };
        paint();
        grid.appendChild(b);
      }
    }
    confirmBtn.onclick = () => {
      const captains = {};
      for (const t of TEAMS) {
        captains[t] = { captain: null, vice: null };
        for (const m of byTeam[t]) {
          if (role[m.id] === "cap") captains[t].captain = m.id;
          if (role[m.id] === "vice") captains[t].vice = m.id;
        }
      }
      const res = Game.applyReorg18(assign, captains);
      if (res.tone === "blocked") { this.toast(res.text); return; }
      this.closeModal();
      this.renderGame();
      /* onDone：月末链回调——公布会 VN 播完后恢复链推进（行动触发的路径无 onDone） */
      this.playScene(res.vn, () => { this.renderGame(); if (onDone) onDone(); });
      this.toast(res.text);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——任命必须完成
    refresh();
  },

  /* ========================================================================
     2019 主线②二次组阁编制会（两阶段，结构同 2018）：
     阶段一：逐人定队（本部各队 / 预备生 / 发配分团【仅保留的分团可选】/ 移籍 IDFT）
     阶段二：队长队副任命 → Game.applyReorg19 落地
     史实：二次组阁恒定取消 Team FT（FT 不入编制目标，成员默认发配/IDFT）；
     2018 保留了 XII 则本次也保留；推进 TEB48 且开业后，TEB48 预备生入预备生选项。 */
  showReorg19Picker(onDone) {
    const st = Game.st;
    const nar = Game.reorg19Narrative(st);
    const keptXII = !!st.flags.xiiKept18 && st.members.some(m => m.status === "active" && m.team === "XII");
    const TEAMS = ["SII", "NII", "HII", "X"].concat(keptXII ? ["XII"] : []);
    /* 孟波保旗（仅 giveup 线）：该分团旗号保留，至多 16 人留任为旗号预备生队伍 */
    const flag19 = (st.decisions.branch19Keep === "giveup" && st.decisions.branchFlag19) ? st.decisions.branchFlag19 : null;
    const BR = ["BEJ48", "GNZ48"].concat(st.decisions.branch19Keep === "keep" ? ["SHY48", "CKG48"] : []).concat(flag19 ? [flag19] : []);
    const pools = Game.reorg19Pools(st);
    const assign = {};   // id → 队伍 | "prep" | "BEJ48"…(发配分团) | "idft"
    /* 默认值：本部正式成员留原队（FT 解散时默认发配首分团）；预备生默认留任；
       分团移交成员默认移籍 IDFT */
    for (const m of pools.head) {
      if (m.team === "PREP") { assign[m.id] = "prep"; continue; }
      if (m.team === "FT") { assign[m.id] = BR.length ? BR[0] : "idft"; continue; }
      assign[m.id] = TEAMS.indexOf(m.team) >= 0 ? m.team : "idft";
    }
    for (const m of pools.dissolved) assign[m.id] = (flag19 && m.branchTeam === flag19) ? flag19 : "idft";
    /* TEB48 预备生：默认留任台北，可调往本部预备生 */
    for (const m of (pools.teb || [])) assign[m.id] = "TEB48";

    /* ---- 实时计数 ---- */
    const rosterOf = () => {
      const byTeam = {}; TEAMS.forEach(t => { byTeam[t] = []; });
      for (const m of pools.head.concat(pools.dissolved)) {
        const t = assign[m.id];
        if (t && TEAMS.indexOf(t) >= 0) byTeam[t].push(m);
      }
      for (const t of TEAMS) byTeam[t].sort((a, b) => (b.pop || 0) - (a.pop || 0));
      return byTeam;
    };

    /* ================= 阶段一：逐人定队 ================= */
    const c = this.card("二次组阁编制会 · 逐人定队",
      nar.text + "\n\n点击卡片循环选择去向；发配分团羁绊-6，移籍 IDFT（训练生池）羁畔-6。"
      + "本部每队下限 13 人、上限 20 人（前 16 主力 · 其余替补）；预备生队伍至多 16 人"
      + (keptXII ? "；XII 保留编制" : "") + "；FT 解散——成员重新排队"
      + (pools.dissolved.length ? "；带 ★ 的为停运分团移交成员（可入本部/其余分团/预备生，或移籍 IDFT）" : "")
      + (flag19 ? "；" + flag19 + " 旗号保留（孟波出资）——留任至多 16 人，为旗号预备生队伍（无剧场收入）" : "")
      + (pools.teb && pools.teb.length ? "；◆ 为 TEB48 预备生（默认留任台北，可调往本部预备生）" : ""));
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "名册敲定，进入队长任命 →");
    confirmBtn.disabled = true;

    const refresh = () => {
      const byTeam = rosterOf();
      let bad = false;
      const parts = TEAMS.map(t => {
        const n = byTeam[t].length;
        const sub = Math.max(0, n - 16);
        const out = n < 13 || n > 20;
        if (out) bad = true;
        return "Team " + t + " " + n + " 人" + (out ? "⚠" : "✔") + (n > 16 ? "（主力16·替补" + sub + "）" : "");
      });
      const prepN = pools.head.concat(pools.dissolved, pools.teb || []).filter(m => assign[m.id] === "prep" && (m.team !== "PREP" || m.status === "branch")).length;
      if (prepN > 16) bad = true;
      const flagN = flag19 ? pools.head.concat(pools.dissolved).filter(m => assign[m.id] === flag19).length : 0;
      if (flagN > 16) bad = true;
      const brN = pools.head.concat(pools.dissolved).filter(m => BR.indexOf(assign[m.id]) >= 0).length;
      const idftN = pools.head.concat(pools.dissolved).filter(m => assign[m.id] === "idft").length;
      counter.textContent = parts.join(" · ") + " · 编入预备生 " + prepN + "/16" + (flag19 ? " · " + flag19 + " 旗号留任 " + flagN + "/16" : "") + " · 发配分团 " + brN + " 人 · 移籍IDFT " + idftN + " 人"
        + (bad ? "　——人数越界（队伍或预备生）" : "　——可以确认");
      confirmBtn.disabled = bad;
    };

    /* 单张成员卡：点击循环选择去向 */
    const makeBtn19 = (m, order) => {
      const b = this.el("button", "pick-btn", "");
      const CLS = Object.assign({ SII: "on-sii", NII: "on-nii", HII: "on-hii", X: "on-x", XII: "on-xii", FT: "on-ft", prep: "on-prep", idft: "on-drop" }, flag19 ? {} : null);
      if (flag19) CLS[flag19] = "on-prep";
      const labelOf = t => {
        if (t === "TEB48") return "留任 TEB48（台北）";
        if (t === "prep") return m.team === "PREP" ? "留任预备生" : (m.branchTeam === "TEB48" ? "→ 调往本部预备生" : "→ 预备生（PREP）");
        if (t === "idft") return "移籍 IDFT（训练生池）";
        if (t === flag19) return (m.status === "branch" && m.branchTeam === t) ? "★ 旗号留任" + t : "→ 旗号留任 " + t;
        if (BR.indexOf(t) >= 0) return (m.status === "branch" && m.branchTeam === t) ? "★ 留任" + t : "→ 发配 " + t;
        return (m.status === "active" && m.team === t) ? "留任 Team " + t : "→ Team " + t;
      };
      const paint = () => {
        Object.keys(CLS).forEach(k => { if (CLS[k]) b.classList.remove(CLS[k]); });
        const cur = assign[m.id];
        if (CLS[cur]) b.classList.add(CLS[cur]);
        const mark = m.branchTeam === "TEB48" ? "◆ " : m.status === "branch" ? "★ " : (m.team === "PREP" ? "☆ " : "");
        b.innerHTML = mark + m.name + '<span class="pb-team">' + labelOf(cur) + " · 人气" + (m.pop || 0) + "</span>";
      };
      b.onclick = () => {
        const idx = order.indexOf(assign[m.id]);
        assign[m.id] = order[(idx + 1) % order.length];
        paint(); refresh();
      };
      paint();
      return b;
    };

    /* 本部成员：按现队分节（预备生一并参编） */
    for (const t of ["SII", "NII", "HII", "X", "XII", "FT"]) {
      const list = pools.head.filter(m => m.team === t);
      if (!list.length) continue;
      grid.appendChild(this.el("div", "pick-section", "—— Team " + t + (t === "FT" ? "（解散·重新排队）" : t === "XII" && !keptXII ? "（解散·全员重编）" : "") + " ——"));
      const order = TEAMS.concat(BR, ["prep", "idft"]);
      for (const m of list) grid.appendChild(makeBtn19(m, order));
    }
    {
      const list = pools.head.filter(m => m.team === "PREP");
      if (list.length) {
        grid.appendChild(this.el("div", "pick-section", "—— 预备生（PREP）· 默认留任；可选入各队直接定队 ——"));
        const order = ["prep"].concat(TEAMS, BR, ["idft"]);
        for (const m of list) grid.appendChild(makeBtn19(m, order));
      }
    }
    if (pools.teb && pools.teb.length) {
      grid.appendChild(this.el("div", "pick-section", "—— TEB48 预备生（◆ 默认留任台北；可调往本部预备生）——"));
      const order = ["TEB48", "prep"];
      for (const m of pools.teb) grid.appendChild(makeBtn19(m, order));
    }
    if (pools.dissolved.length) {
      grid.appendChild(this.el("div", "pick-section", "—— 停运分团移交成员（★ 默认移籍 IDFT" + (flag19 ? "；其旗号团成员默认旗号留任" : "") + "）——"));
      const order = TEAMS.concat(BR, ["prep", "idft"]);
      for (const m of pools.dissolved) grid.appendChild(makeBtn19(m, order));
    }
    confirmBtn.onclick = () => this.showReorg19Captains(TEAMS, pools, assign, nar, onDone);
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——编制会必须完成
    refresh();
  },

  /* 二次组阁编制会 · 阶段二：队长队副任命（每队 1 队长必须 / 队副至多 1；现职仍在队内则预填） */
  showReorg19Captains(TEAMS, pools, assign, nar, onDone) {
    const st = Game.st;
    const byTeam = {}; TEAMS.forEach(t => { byTeam[t] = []; });
    for (const m of pools.head.concat(pools.dissolved)) {
      const t = assign[m.id];
      if (t && TEAMS.indexOf(t) >= 0) byTeam[t].push(m);
    }
    for (const t of TEAMS) byTeam[t].sort((a, b) => (b.pop || 0) - (a.pop || 0));
    const role = {};   // id → "cap" | "vice"
    /* 预填：现任队长/队副仍在该队 → 保留；无现职队长的队伍预填人气最高者 */
    for (const t of TEAMS) {
      const cap0 = byTeam[t].find(m => m.captain);
      const vice0 = byTeam[t].find(m => m.vice);
      if (cap0) role[cap0.id] = "cap";
      if (vice0) role[vice0.id] = "vice";
      if (!byTeam[t].some(m => role[m.id] === "cap")) {
        const top = byTeam[t][0];
        if (top) role[top.id] = "cap";
      }
    }
    const c = this.card("二次组阁编制会 · 队长队副任命",
      "点击成员卡片循环：未任 → 队长 → 队副 → 未任。每队必须任命一名队长，队副可选（结果在成员卡上显示徽标）");
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "公布新编制名单 →");
    confirmBtn.disabled = true;
    const refresh = () => {
      let bad = false;
      const parts = TEAMS.map(t => {
        const cap = byTeam[t].filter(m => role[m.id] === "cap").length;
        const vice = byTeam[t].filter(m => role[m.id] === "vice").length;
        const out = cap !== 1 || vice > 1;
        if (out) bad = true;
        return "Team " + t + (out ? " 队长⚠" : " ✔") + (vice ? "·副×" + vice : "");
      });
      counter.textContent = parts.join(" · ") + (bad ? "　——每队恰一名队长（队副至多一名）" : "　——可以公布");
      confirmBtn.disabled = bad;
    };
    for (const t of TEAMS) {
      grid.appendChild(this.el("div", "pick-section", "—— Team " + t + "（" + byTeam[t].length + " 人）——"));
      for (const m of byTeam[t]) {
        const b = this.el("button", "pick-btn", "");
        const paint = () => {
          b.classList.remove("on-cap", "on-vice");
          const r = role[m.id];
          if (r === "cap") b.classList.add("on-cap");
          if (r === "vice") b.classList.add("on-vice");
          b.innerHTML = m.name + '<span class="pb-team">' + (r === "cap" ? "队长" : r === "vice" ? "队副" : "点击任命") + " · 人气" + (m.pop || 0) + "</span>";
        };
        b.onclick = () => {
          if (role[m.id]) {
            delete role[m.id];
          } else {
            const hasCap = byTeam[t].some(x => role[x.id] === "cap");
            const hasVice = byTeam[t].some(x => role[x.id] === "vice");
            role[m.id] = !hasCap ? "cap" : (!hasVice ? "vice" : "cap");
          }
          const caps = byTeam[t].filter(x => role[x.id] === "cap");
          if (caps.length > 1) { const other = caps.find(x => x.id !== m.id); if (other) delete role[other.id]; }
          const vices = byTeam[t].filter(x => role[x.id] === "vice");
          if (vices.length > 1) { const other = vices.find(x => x.id !== m.id); if (other) delete role[other.id]; }
          paint(); refresh();
        };
        paint();
        grid.appendChild(b);
      }
    }
    confirmBtn.onclick = () => {
      const captains = {};
      for (const t of TEAMS) {
        captains[t] = { captain: null, vice: null };
        for (const m of byTeam[t]) {
          if (role[m.id] === "cap") captains[t].captain = m.id;
          if (role[m.id] === "vice") captains[t].vice = m.id;
        }
      }
      const res = Game.applyReorg19(assign, captains);
      if (res.tone === "blocked") { this.toast(res.text); return; }
      this.closeModal();
      this.renderGame();
      /* onDone：月末链回调——公布会 VN 播完后恢复链推进（行动触发的路径无 onDone） */
      this.playScene(res.vn, () => { this.renderGame(); if (onDone) onDone(); });
      this.toast(res.text);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——任命必须完成
    refresh();
  },

  /* 【2019 主线③】年度招新拍板窗：候选池 DATA.recruit2019（BEJ48 七期 8 人 + GNZ48 七期 4 人）。
     逐人循环选择：本部预备生 / 各分团预备生（仅保留的分团）/ 暂不招录。
     默认 = 考据归属分团；落地在 Game.applyRecruit19（assign 以姓名为键）。 */
  showRecruit19Picker(onDone) {
    const st = Game.st;
    const BR = ["BEJ48", "GNZ48"].concat(st.decisions.branch19Keep === "keep" ? ["SHY48", "CKG48"] : []);
    const pool = (DATA.recruit2019 || []).filter(r => !st.members.some(x => x.name === r.name));
    const assign = {};   // 姓名 → "PREP" | 分团id | "none"
    for (const r of pool) assign[r.name] = r.branch && BR.indexOf(r.branch) >= 0 ? r.branch : "PREP";

    const c = this.card("年度招新 · 归属拍板",
      "十二个名额，一个一个看。点击卡片循环选择去向：本部预备生 / 各分团预备生 / 暂不招录。"
      + "队伍归属一律为预备生——是金子，明年编制会上见。");
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "名单公布，招新收官 →");
    confirmBtn.disabled = true;

    const refresh = () => {
      const n = { PREP: 0 };
      for (const t of BR) n[t] = 0;
      let none = 0;
      for (const r of pool) {
        const a = assign[r.name];
        if (a === "none") none++;
        else if (a === "PREP") n.PREP++;
        else if (n[a] != null) n[a]++;
      }
      counter.textContent = "本部预备生 " + n.PREP + " · " + BR.map(t => t + " " + n[t]).join(" · ")
        + " · 暂不招录 " + none + "（共 " + pool.length + " 人）";
      confirmBtn.disabled = false;
    };

    const CLS = { PREP: "on-prep", BEJ48: "on-bej", GNZ48: "on-gnz", SHY48: "on-shy", CKG48: "on-ckg", none: "on-drop" };
    for (const r of pool) {
      const order = ["PREP"].concat(BR, ["none"]);
      const b = this.el("button", "pick-btn", "");
      const labelOf = a => a === "PREP" ? "→ 本部预备生" : a === "none" ? "暂不招录" : "→ " + a + " 预备生";
      const paint = () => {
        Object.keys(CLS).forEach(k => { if (CLS[k]) b.classList.remove(CLS[k]); });
        const cur = assign[r.name];
        if (CLS[cur]) b.classList.add(CLS[cur]);
        b.innerHTML = r.name + '<span class="pb-team">' + labelOf(cur) + " · " + r.gen + "</span>";
      };
      b.onclick = () => {
        const idx = order.indexOf(assign[r.name]);
        assign[r.name] = order[(idx + 1) % order.length];
        paint(); refresh();
      };
      paint();
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      const res = Game.applyRecruit19(assign);
      if (res.tone === "blocked") { this.toast(res.text); return; }
      this.closeModal();
      this.renderGame();
      this.playScene(res.vn, () => { this.renderGame(); if (onDone) onDone(); });
      this.toast(res.text);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——拍板必须完成
    refresh();
  },

  /* 【2019 主线①第四段】TEB48 派遣移籍决定窗：全团（非殿堂）点将 0~5 人，可以一个不派。
     去年点将出征鹅厂选秀的成员不在此列（封闭集训/限定团线承载）。
     落地在 Game.setTeb19Squad；确认后 TEB48 开业首演。 */
  showTeb19Picker() {
    const st = Game.st;
    const show18Set = Game.show18SquadNameSet(st);
    const pool = st.members.filter(m => m.status === "active" && !m.hall && m.team !== "HALL" && !show18Set.has(m.name))
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    const picked = new Set();
    const c = this.card("TEB48 · 派遣移籍决定",
      "筹建的最后一步：是否派遣成员移籍台北，作为 TEB48 的创始骨干？全团至多 5 人——也可以一个都不派（日方出人、我们运营）。"
      + "被派遣者：人气+6 羁绊-6，移籍 TEB48（台湾分团标签页）"
      + (show18Set.size ? "\n（去年出征选秀的 " + show18Set.size + " 位成员正在封闭集训，不在候选之列）" : ""));
    const counter = this.el("p", "modal-text", "");
    const grid = this.el("div", "pick-grid");
    const confirmBtn = this.el("button", "btn btn-primary modal-close", "拍板，开业首演 →");
    const refresh = () => {
      counter.textContent = "已选 " + picked.size + " / 至多 5 人" + (picked.size ? "（可不选——确认即空派）" : "（可不选——确认即空派）");
    };
    for (const m of pool) {
      const b = this.el("button", "pick-btn", "");
      const paint = () => {
        b.classList.toggle("on", picked.has(m.id));
        b.innerHTML = m.name + '<span class="pb-team">' + (m.team === "PREP" ? "预备生" : "Team " + m.team) + " · 人气" + (m.pop || 0) + "</span>";
      };
      b.onclick = () => {
        if (picked.has(m.id)) { picked.delete(m.id); }
        else if (picked.size < 5) { picked.add(m.id); }
        else { this.toast("至多派遣 5 人——先取消一位再选"); return; }
        paint(); refresh();
      };
      paint();
      grid.appendChild(b);
    }
    confirmBtn.onclick = () => {
      const res = Game.setTeb19Squad([...picked]);
      this.closeModal();
      this.renderGame();
      this.playScene(res.vn, () => { this.renderGame(); });
      this.toast(res.text);
    };
    c.appendChild(counter);
    c.appendChild(grid);
    c.appendChild(confirmBtn);
    this.modal(c);   // 不给关闭按钮——拍板必须完成
    refresh();
  },

  /* 【2018 主线⑤】选秀派遣点将窗：全团（非殿堂）选 11 人；葛佳慧承诺 → 选 10 人+她自动占位 */
  showShow18Picker() {
    const st = Game.st;
    const autoGjh = st.decisions.gejiahui17 === "promise" && st.members.some(m => m.name === "葛佳慧" && m.status === "active");
    const need = autoGjh ? 10 : 11;
    const pool = st.members.filter(m => m.status === "active" && !m.hall && m.team !== "HALL" && m.pop != null);
    this.showMultiPick({
      title: "选秀派遣 · 点将" + need + "人",
      sub: "备战鹅厂选秀（主线⑤）——" + (autoGjh ? "葛佳慧依约自动占一席，再选 " + need + " 人" : "从全团非殿堂成员中选 11 人出征")
        + "；分团成员亦可上调（人气羁绊将在集训中提升）",
      pool: pool, count: need,
      confirmLabel: "名单敲定，封闭集训 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.team + " · ") + "人气" + m.pop + (m.pwr != null ? " 实力" + m.pwr : ""),
      onConfirm: ids => {
        const res = Game.setShow18Squad(ids);
        this.renderGame();
        this.toast(res.text);
      },
    });
  },

  /* 【2019 复刻线】AKB48亚洲盛典（曼谷）七人点将窗：除 2018 选秀派遣成员外全团可点
     （本部+分团在籍、非殿堂）；生效逻辑在 engine.asiaFest19Squad。 */
  showAsiaFest19Picker(onDone) {
    const st = Game.st;
    const squadIds = (st.show18 && Array.isArray(st.show18.squad)) ? st.show18.squad : [];
    const pool = st.members.filter(m =>
      (m.status === "active" || m.status === "branch") && !m.hall && m.pop != null
      && squadIds.indexOf(m.id) < 0)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    this.showMultiPick({
      title: "AKB48亚洲盛典 · 曼谷远征 点将7人",
      sub: "史上第一次全亚洲团体大集结——三月末，曼谷。选秀派遣成员备战在即不可抽调，其余在籍成员（含分团）皆可点将",
      pool: pool, count: 7,
      confirmLabel: "名单敲定，办理签证 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.team + " · ") + "人气" + m.pop + (m.pwr != null ? " 实力" + m.pwr : ""),
      onConfirm: ids => {
        const res = Game.asiaFest19Squad(ids);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 【2018 通用】《国风美少年》内推名额：全团在籍成员（非殿堂）单人点将；
     生效逻辑在 engine.guofeng18Pick。 */
  showGuofeng18Picker(onDone) {
    const st = Game.st;
    const pool = st.members.filter(m => (m.status === "active" || m.status === "branch") && !m.hall && m.pop != null)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    this.showMultiPick({
      title: "《国风美少年》· 内推名额 点将1人",
      sub: "免海选直进录制——全团在籍成员（含分团，非殿堂）皆可推；谁去，谁的国风舞台首秀就成了",
      pool: pool, count: 1,
      confirmLabel: "名额敲定 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.team + " · ") + "人气" + m.pop + (m.pwr != null ? " 实力" + m.pwr : ""),
      onConfirm: ids => {
        const res = Game.guofeng18Pick(ids[0]);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      },
    });
  },

  /* 【2019 通用】双选秀邀约点将窗：鹅厂选秀第三季（key="T"）/ 爱奇艺选秀第二季（key="I"）。
     除成团成员（2018 限定团，status="rest"）外全团可点（含分团、非殿堂）；
     两家都参加时 excludeIds 传入首批名单，避免同一人连轴两班集训；
     结算逻辑在 engine.show19Squad / engine.show19Finalize。 */
  showShow19Picker(key, excludeIds, onDone) {
    const st = Game.st;
    const info = key === "T"
      ? { name: "鹅厂选秀第三季 · 女团季", sub: "去年那批孩子的成色，平台记着呢——七个正式名额，封闭集训即刻启动" }
      : { name: "爱奇艺选秀第二季", sub: "新平台的第二次邀请——七个正式名额，封闭集训即刻启动" };
    const pool = st.members.filter(m =>
      (m.status === "active" || m.status === "branch") && !m.hall && m.pop != null
      && (excludeIds || []).indexOf(m.id) < 0)
      .sort((a, b) => (b.pop || 0) - (a.pop || 0));
    this.showMultiPick({
      title: info.name + " · 派遣点将7人",
      sub: info.sub + "——除 2018 成团成员外全团可点（含分团）",
      pool: pool, count: 7,
      confirmLabel: "名单敲定，封闭集训 →",
      cardInfo: m => (m.status === "branch" ? m.branchTeam + " · " : m.team + " · ") + "人气" + m.pop + (m.pwr != null ? " 实力" + m.pwr : ""),
      onConfirm: ids => {
        const picked = Game.show19Squad(key, ids);
        this.renderGame();
        this.toast(info.name + "派遣名单敲定（" + picked.names.length + " 人）");
        if (onDone) onDone(picked);
      },
    });
  },

  /* 【2019 通用】双选秀邀约·二选一窗：先定平台，再进七人点将窗。 */
  showShow19OnePicker(onDone) {
    const c = this.card("双选秀邀约 · 二选一", "两个平台只能接一家——镜头资源、档期与集训周期都要算进去。总监，去哪家？");
    const box = this.el("div", "vn-choices");
    const go = key => {
      this.closeModal();
      this.showShow19Picker(key, null, picked => {
        const res = Game.show19Finalize("one", key, picked);
        this.renderGame();
        this.toast(res.text);
        if (onDone) onDone();
      });
    };
    const bt = this.el("button", "vn-choice", "鹅厂选秀第三季（女团季）——去年的成功让对方开价更诚意，热度盘子更大");
    bt.onclick = e => { e.stopPropagation(); go("T"); };
    const bi = this.el("button", "vn-choice", "爱奇艺选秀第二季——竞争相对温和，镜头更集中");
    bi.onclick = e => { e.stopPropagation(); go("I"); };
    box.appendChild(bt); box.appendChild(bi);
    c.appendChild(box);
    this.modal(c);
  },

  showMemberPicker() {
    const c = this.card("走访成员", "选择一位成员谈心（羁绊+12 士气+3 叶盛负担-8；分团成员为巡访）");
    const grid = this.el("div", "pick-grid");
    /* v0.11.10：分团成员（branch）一并可选——移籍分团不中断羁绊培养 */
    const pool = Game.st.members.filter(m => m.status === "active" || m.status === "branch");
    for (const m of pool.slice().sort((a, b) => b.bond - a.bond)) {
      const b = this.el("button", "pick-btn", "");
      const teamLabel = m.status === "branch" ? (m.branchTeam || m.team) + (m.branchLabel ? " · " + m.branchLabel : "") : m.team;
      b.innerHTML = m.name + '<span class="pb-team">' + teamLabel + " · 羁绊" + m.bond + "</span>";
      b.onclick = () => {
        this.closeModal();
        const res = Game.doAction("visit", { memberId: m.id });
        if (!res) return;
        this.renderGame();
        if (res.vn) this.playScene(res.vn, () => { this.renderGame(); this.toast(res.text); });
        else { this.toast(res.text); this.renderGame(); }
      };
      grid.appendChild(b);
    }
    c.appendChild(grid);
    const cancel = this.el("button", "btn btn-ghost modal-close", "先不聊了（不消耗行动）");
    cancel.onclick = () => this.closeModal();
    c.appendChild(cancel);
    this.modal(c);
  },

  onMonthEnd() {
    const st = Game.st;
    if (st.ap > 0 && !confirm("本月还有 " + st.ap + " 点行动力，确定提前进入月末结算？")) return;
    const steps = Game.endMonth();
    this.playSteps(steps, () => {
      if (st.month >= 12) return;          // 12月由结局步骤接管
      Game.advanceMonth();
      const startSteps = Game.monthStart();
      this.playSteps(startSteps, () => this.renderGame());
    });
  },

  /* ---------------- 成员页 ---------------- */

  renderMembers() {
    const st = Game.st;
    const filter = this.$("team-filter");
    filter.innerHTML = "";
    /* 标签页按 era 组装：2016 = 五队 + 分团两页；2017 = 五队+预备生+四分团；2026 = 本部队 + 三分团 */
    let teams;
    if (st.era === "2026") {
      teams = [["all", "全部"]];
      for (const t of DATA2026.teams) teams.push([t.id, t.short]);
      teams.push(["HALL", "荣誉殿堂"], ["film", "影视部"]);   // v0.14.9 分类拆分：殿堂=总选连霸（hallIdol）/ 影视部=事件转影视（film）
      for (const b of DATA2026.branches) teams.push([b.id, b.id]);
      teams.push(["rest", "暂休"], ["honorGrad", "荣誉毕业生"], ["siba", "丝芭传媒"], ["left", "已离团"]);
    } else if (st.era === "2027") {
      teams = [["all", "全部"]];
      for (const t of DATA2026.teams) teams.push([t.id, t.short]);
      teams.push(["HALL", "荣誉殿堂"], ["film", "影视部"]);   // v0.14.9 分类拆分
      for (const b of DATA2026.branches) teams.push([b.id, b.id]);
      teams.push(["WHN48", "WHN48"], ["rest", "暂休"], ["honorGrad", "荣誉毕业生"], ["siba", "丝芭传媒"], ["left", "已离团"]);
    } else if (st.era === "2017") {
      teams = [["all", "全部"], ["SII", "SII"], ["NII", "NII"], ["HII", "HII"], ["X", "X"], ["XII", "XII"], ["PREP", "预备生"],
               ["BEJ48", "BEJ48"], ["GNZ48", "GNZ48"], ["SHY48", "SHY48"], ["CKG48", "CKG48"], ["HALL", "荣誉殿堂"], ["film", "影视部"], ["rest", "暂休"], ["left", "已离团"]];
    } else if (st.era === "2018" || st.era === "2019" || st.era === "2020" || st.era === "2021") {
      teams = [["all", "全部"], ["SII", "SII"], ["NII", "NII"], ["HII", "HII"], ["X", "X"], ["XII", "XII"], ["PREP", "预备生"],
               ["BEJ48", "BEJ48"], ["GNZ48", "GNZ48"], ["SHY48", "SHY48"], ["CKG48", "CKG48"], ["HALL", "荣誉殿堂"], ["film", "影视部"], ["rest", "暂休"], ["idft", "IDFT"], ["staff", "工作人员"], ["honorGrad", "荣誉毕业生"], ["siba", "丝芭传媒"], ["left", "已离团"]];
      if (st.flags.ftFormed) teams.splice(6, 0, ["FT", "FT"]);   // 组阁：Team FT 成立后入列
      /* 2019/2020：分团停运后标签页按在册成员动态裁剪；TEB48 开业后入列。
         【修复】原表达式 (m.branchTeam === k || m.note || "").indexOf(k) 存在
         优先级错误：branchTeam 命中时括号值为 true，true.indexOf 直接抛
         TypeError——只要有 SHY48/CKG48 成员在册（2019 保旗线 / 2020 keep 线，
         含快速通道与正常游玩），成员页与整个主界面渲染即中断（日志页随之中断）。 */
      if (st.era === "2019" || st.era === "2020") {
        teams = teams.filter(([k]) =>
          !(k === "SHY48" || k === "CKG48") || st.members.some(m =>
            ((m.status === "branch" || m.status === "idft" || m.status === "active" || m.status === "rest")
              && (m.branchTeam === k || String(m.note || "").indexOf(k) >= 0))
            || (k === "SHY48" && m.team === "SHY48") || (k === "CKG48" && m.team === "CKG48")));
        if (st.flags.teb19Open && st.members.some(m => m.branchTeam === "TEB48" || m.team === "TEB48")) teams.splice(teams.findIndex(([k]) => k === "HALL"), 0, ["TEB48", "TEB48"]);
      }
    } else {
      teams = [["all", "全部"], ["SII", "SII"], ["NII", "NII"], ["HII", "HII"], ["X", "X"], ["XII", "XII"],
               ["BEJ48", "BEJ48"], ["GNZ48", "GNZ48"], ["rest", "暂休"], ["left", "已离团"]];
    }
    for (const [k, label] of teams) {
      const chip = this.el("button", "tf-chip" + (this._memberFilter === k ? " on" : ""), label);
      chip.onclick = () => { this._memberFilter = k; this.renderMembers(); };
      filter.appendChild(chip);
    }
    const list = this.$("member-list");
    list.innerHTML = "";
    let members = st.members.slice();
    const isBranchTab = ["BEJ48", "GNZ48", "CKG48", "SHY48", "CGT48", "WHN48", "TEB48"].includes(this._memberFilter);
    /* 「全部」= 全部在册（active + 暂休）；已离团、IDFT、分团另有独立页签 */
    if (this._memberFilter === "all") members = members.filter(m => m.status === "active" || m.status === "rest" || m.status === "staff");
    else if (isBranchTab)
      members = members.filter(m => m.status === "branch" && m.branchTeam === this._memberFilter);
    else if (this._memberFilter === "rest") members = members.filter(m => m.status === "rest");
    else if (this._memberFilter === "honorGrad") members = members.filter(m => m.honorGrad);   // 荣誉毕业生（2020 一期生毕业分类）
    else if (this._memberFilter === "siba") members = members.filter(m => m.siba);             // 丝芭传媒（续约成功/转岗分类）
    else if (this._memberFilter === "idft") members = members.filter(m => m.status === "idft");
    else if (this._memberFilter === "left") members = members.filter(m => m.status === "left");
    else if (this._memberFilter === "HALL") members = members.filter(m => m.hallIdol);   // 荣誉殿堂：仅总选连霸成员（v0.14.9 分类拆分）
    else if (this._memberFilter === "film") members = members.filter(m => m.film);       // 影视部：经事件转入影视发展的艺人
    else members = members.filter(m => m.team === this._memberFilter && m.status === "active");

    Game.syncTeams(st);   // 【v0.13.0】刷新磨合度（本月内发生的组阁/移籍/升格等立即反映）
    members.sort((a, b) => b.pop - a.pop);
    /* 【v0.13.0】队伍磨合度头卡：队伍标签页（本部各队/预备生/分团）置顶展示 */
    if (st.chem && st.chem[this._memberFilter] != null) {
      const chem = st.chem[this._memberFilter];
      const stable = st.chemStable[this._memberFilter] || 0;
      const hit = teams.find(([k]) => k === this._memberFilter);
      const label = hit ? hit[1] : this._memberFilter;
      const low = chem < Game.REL_CHEM_LOW;
      const chemNote = stable >= 3
        ? "稳定运营 · 连续 " + stable + " 个月无人员变动，每月磨合 +1"
        : stable >= 1
          ? "磨合期 · " + stable + " 个月无人员变动（满 3 个月起每月 +1）"
          : "刚经历人员变动，磨合度已按现成员重算";
      const head = this.el("div", "team-chem" + (low ? " low" : ""), "");
      head.innerHTML = "<div class='tc-top'><b>" + label + " · 队伍磨合度</b><span>" + chem + " / 100</span></div>"
        + "<div class='tc-bar'><i style='width:" + chem + "%'></i></div>"
        + "<div class='tc-note'>" + chemNote + (low ? " · 磨合过低，队内关系每月随机磨损" : "") + "</div>";
      list.appendChild(head);
    }
    for (const m of members) {
      const isBranch = m.status === "branch";
      const isHall = m.team === "HALL" || m.hall;             // HALL 在册（殿堂/影视部机制位）
      const badgeTeam = isBranch ? m.branchTeam : m.team;   // 分团成员显示分团队徽
      const badgeText = badgeTeam === "HALL" ? (m.film ? "影视部" : "荣誉殿堂") : badgeTeam;
      const card = this.el("div", "member-card" + (m.status === "left" ? " mc-left" : isBranch ? " mc-branch" : m.hall ? " mc-hall" : "") + " mc-click");
      card.title = "点击查看成员详情";
      card.onclick = () => this.showMemberDetail(m);   // 【成员属性系统 v2】点击查看详情
      const picSrc = this.portraitSrc(m);
      if (picSrc) {
        const img = document.createElement("img");
        img.className = "mc-portrait";
        img.src = picSrc;
        img.alt = m.name;
        img.onerror = () => img.remove();          // 图片缺失时自动隐藏，不占位
        card.appendChild(img);
      }
      const nameRow = this.el("div", "mc-name", "");
      nameRow.appendChild(this.el("span", "team-badge tb-" + badgeTeam, badgeText));
      nameRow.appendChild(document.createTextNode(m.name));
      if (m.hall) nameRow.appendChild(this.el("span", "mc-flag", "殿堂"));
      if (m.honorGrad) nameRow.appendChild(this.el("span", "mc-flag", "荣誉毕业生"));   // 2020 一期生毕业分类
      if (m.siba) nameRow.appendChild(this.el("span", "mc-flag", "丝芭传媒"));         // 续约成功/转岗分类
      if (m.captain) nameRow.appendChild(this.el("span", "mc-flag", "队长"));
      else if (m.vice) nameRow.appendChild(this.el("span", "mc-flag", "副队"));
      else if (m.sub) nameRow.appendChild(this.el("span", "mc-flag", "替补"));   // 2018 组阁：每队主力16+替补4
      card.appendChild(nameRow);
      /* 2026 分团成员为简卡：仅姓名 + 队伍标注（用户要求），无人气/羁绊条 */
      const simple = isBranch && !m.pop && !m.bond;
      const metaText = (m.gen || "")
        + (isBranch ? " · " + (m.branchLabel || m.branchTeam) : "")
        + (m.hallIdol ? " · 荣誉殿堂" : "")            // 总选连霸升堂（v0.14.9 分类拆分）
        + (m.film ? " · 影视部" : "")                  // 事件转入影视发展
        + (m.honorGrad ? " · 荣誉毕业生" : "")
        + (m.siba ? " · 丝芭传媒" : "")
        + (!isBranch ? (m.status === "rest" ? " · 暂休" : m.status === "idft" ? " · IDFT" : m.status === "staff" ? " · 工作人员" : m.status === "left" ? " · 已离团" : "") : "")
        + (!isBranch && m.note && m.status !== "active" ? " · " + m.note : "");
      card.appendChild(this.el("div", "mc-meta", metaText));
      if (simple) { list.appendChild(card); continue; }
      const popBar = this.el("div", "mc-bar pop"); popBar.innerHTML = "<i style=\"width:" + m.pop + "%\"></i>";
      card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "人气"), this.el("span", "", m.pop)]));
      card.appendChild(popBar);
      /* 实力条（2017 线：成员卡新增实力计数） */
      if (m.pwr != null) {
        const pwrBar = this.el("div", "mc-bar pop"); pwrBar.innerHTML = "<i style=\"width:" + m.pwr + "%;background:#6fd7ff\"></i>";
        card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "实力"), this.el("span", "", m.pwr)]));
        card.appendChild(pwrBar);
      }
      if (m.status === "active") {
        const bondBar = this.el("div", "mc-bar bond"); bondBar.innerHTML = "<i style=\"width:" + m.bond + "%\"></i>";
        card.appendChild(this.el("div", "mc-bar-label", [this.el("span", "", "羁绊"), this.el("span", "", m.bond)]));
        card.appendChild(bondBar);
      }
      /* 【v0.13.0】队友关系（预备生时期不计成员关系）：展示交情最好的三位同队成员 */
      const tk = Game.teamKeyOf(m);
      if (tk && tk !== "PREP") {
        const rels = st.members
          .filter(x => x.id !== m.id && Game.teamKeyOf(x) === tk)
          .map(x => ({ name: x.name, v: Game.relGet(st, m.id, x.id) }))
          .filter(r => r.v != null)
          .sort((a, b) => b.v - a.v)
          .slice(0, 3);
        if (rels.length) card.appendChild(this.el("div", "mc-rels", "队友关系：" + rels.map(r => r.name + " " + r.v).join(" · ")));
      }
      list.appendChild(card);
    }
  },

  /* 成员立绘：assets/image/portraits/<id>.jpg（与 Maker 移植线同一套素材）；无立绘返回 null */
  portraitSrc(m) {
    const ids = [m.id];
    if (m.id === "yangbingyi26") ids.push("yangbingyi");   // 2026 线同一年代卡共用一套立绘
    for (const id of ids) {
      if (PORTRAITS[id]) return "assets/image/portraits/" + PORTRAITS[id] + ".jpg";
    }
    return null;
  },

  /* 【成员属性系统 v2】成员详情弹窗（点击成员卡查看）：
     原成员卡内容 + 四维技能（唱功/舞蹈/MC/演技）+ 历史最高总选排名 + 失格值。 */
  showMemberDetail(m) {
    const st = Game.st;
    const c = this.card(m.name, (m.gen || "") + (m.captain ? " · 队长" : m.vice ? " · 副队长" : ""));
    const picSrc = this.portraitSrc(m);
    if (picSrc) {
      const img = document.createElement("img");
      img.className = "mc-portrait";
      img.src = picSrc;
      img.alt = m.name;
      img.onerror = () => img.remove();
      c.appendChild(img);
    }
    /* 队伍与状态行 */
    const cate = (m.hallIdol ? "荣誉殿堂" : "") + (m.film ? (m.hallIdol ? " · 影视部" : "影视部") : "");
    const statusText = m.status === "branch" ? (m.branchTeam + " · " + (m.branchLabel || ""))
      : m.team === "HALL" ? (cate || "HALL")
      : m.status === "rest" ? "暂休"
      : m.status === "idft" ? "IDFT"
      : m.status === "staff" ? "工作人员"
      : m.status === "left" ? "已离团"
      : (m.team === "PREP" ? "预备生" : "Team " + m.team);
    const sub = Game.memberSubUnit(st, m.name);
    const row = (label, val) => {
      const r = this.el("div", "settle-row");
      r.appendChild(this.el("span", "", label));
      const right = this.el("span", "sr-val", "");
      right.appendChild(document.createTextNode(val));
      r.appendChild(right);
      return r;
    };
    c.appendChild(row("所属", statusText));
    if (sub) c.appendChild(row("小分队", sub));
    if (m.join) c.appendChild(row("入团", m.join));
    if (m.honorGrad) c.appendChild(row("分类", "荣誉毕业生"));
    if (m.siba) c.appendChild(row("分类", "丝芭传媒"));
    /* 属性条（人气/羁绊/实力） */
    const bar = (label, v, color) => {
      const b = this.el("div", "mc-bar-label", [this.el("span", "", label), this.el("span", "", v)]);
      const barEl = this.el("div", "mc-bar pop");
      barEl.innerHTML = "<i style=\"width:" + Math.max(0, Math.min(100, v)) + "%;background:" + color + "\"></i>";
      return [b, barEl];
    };
    if (m.pop != null) { const p = bar("人气", m.pop, "#ff9ec7"); c.appendChild(p[0]); c.appendChild(p[1]); }
    if (m.bond != null) { const b = bar("羁绊", m.bond, "#f2b8ff"); c.appendChild(b[0]); c.appendChild(b[1]); }
    if (m.pwr != null) { const p = bar("实力", m.pwr, "#6fd7ff"); c.appendChild(p[0]); c.appendChild(p[1]); }
    /* 四维技能（唱功/舞蹈/MC/演技；仅装配实力系统的成员显示） */
    if (m.skills) {
      const SK = [["vo", "唱功", "#ffd76f"], ["da", "舞蹈", "#7fd7a8"], ["mc", "MC", "#f2a0c0"], ["ac", "演技", "#b39dff"]];
      for (const [k, label, color] of SK) {
        const v = m.skills[k];
        const b = bar(label, v, color);
        c.appendChild(b[0]); c.appendChild(b[1]);
      }
    }
    /* 历史最高排名（总选 top48 口径，越小越好） */
    c.appendChild(row("历史最高排名", m.bestRank != null ? "第 " + m.bestRank + " 名" : "尚未入榜"));
    /* 失格值（≥DQ_LINE 警示色；达标会触发随机违规事件） */
    if (m.dq != null) {
      const warn = m.dq >= Game.DQ_LINE;
      const b = bar("失格值" + (warn ? "（风险）" : ""), m.dq, warn ? "#ff7f7f" : "#c9c9c9");
      c.appendChild(b[0]); c.appendChild(b[1]);
      if (warn) c.appendChild(this.el("div", "modal-text", "失格值已达 " + Game.DQ_LINE + " 线——随时可能触发违规风波。"));
    }
    if (m.note) c.appendChild(this.el("p", "modal-text", m.note));
    /* 【修复 2026-XX】关闭按钮（此前仅有提示文案、无任何关闭途径，弹窗无法关闭） */
    const closeBtn = this.el("button", "btn btn-ghost modal-close", "关闭");
    closeBtn.onclick = () => this.closeModal();
    c.appendChild(closeBtn);
    this.modal(c);
    /* 遮罩空白区点击也可关闭（仅限本弹窗；closeModal 时自动摘除监听） */
    const root = this.$("modal-root");
    const backdrop = e => {
      if (e.target === root) {
        root.removeEventListener("click", backdrop);
        this._modalBackdrop = null;
        this.closeModal();
      }
    };
    root.addEventListener("click", backdrop);
    this._modalBackdrop = backdrop;
  },

  /* ---------------- 日志页 ---------------- */

  renderLog() {
    const st = Game.st;
    const box = this.$("log-list");
    box.innerHTML = "";
    if (!st.log.length) {
      box.appendChild(this.el("p", "modal-text", "还没有记录。"));
      return;
    }
    for (const entry of st.log) {
      box.appendChild(this.el("div", "log-item t-" + entry.tone, "【" + entry.month + "月】" + entry.text));
    }
  },

  /* ---------------- 标签页 ---------------- */

  switchTab(name) {
    document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
    ["board", "members", "log", "sys"].forEach(t => {
      this.$("tab-" + t).classList.toggle("hidden", t !== name);
    });
  },

  initTabs() {
    document.querySelectorAll(".tab").forEach(t => {
      t.onclick = () => this.switchTab(t.dataset.tab);
    });
  },

  /* ---------------- 系统页 ---------------- */

  initSys() {
    this.$("btn-save").onclick = () => this.toast(Game.save() ? "已保存" : "保存失败");
    this.$("btn-load").onclick = () => {
      const st = Game.load();
      if (!st) { this.toast("没有找到存档"); return; }
      this.enterGame(false);
    };
    this.$("btn-export-code").onclick = () => {
      const code = Game.exportCode();
      if (!code) { this.toast("还没有可导出的存档"); return; }
      this.showCodeModal({
        title: "导出存档码",
        sub: "复制下面整段文字并保存到别处（备忘录/聊天框均可）。换目录、换浏览器、换电脑时，用它即可恢复进度。",
        code: code,
        readonly: true,
        confirmLabel: "复制到剪贴板",
        onConfirm: (ta, close) => {
          ta.select();
          let okCopy = false;
          try { okCopy = document.execCommand("copy"); } catch (e) {}
          if (!okCopy && navigator.clipboard) { navigator.clipboard.writeText(ta.value); okCopy = true; }
          close();
          this.toast(okCopy ? "已复制到剪贴板——请粘贴保存好" : "已全选，请手动复制（Ctrl+C）");
        },
      });
    };
    this.$("btn-import-code").onclick = () => {
      this.showCodeModal({
        title: "导入存档码",
        sub: "粘贴之前导出的存档码（以 SG48V1. 开头），确认后覆盖当前进度。",
        code: "",
        readonly: false,
        confirmLabel: "确认导入",
        onConfirm: (ta, close) => {
          const r = Game.importCode(ta.value);
          this.toast(r.msg);
          if (r.ok) { this.renderGame(); close(); }
        },
      });
    };
    this.$("btn-export-file").onclick = () => this.downloadSaveFile();
    this.$("btn-import-file").onclick = () => this.pickSaveFile(() => { this.renderGame(); this.toast("可点击「读取存档」继续经营"); });
    this.$("btn-to-title").onclick = () => {
      if (confirm("放弃当前任期并回到标题？（存档会保留，可从标题「继续」）")) {
        Game.save();
        this.showTitle();
      }
    };
  },

  showTitle() {
    this.showScreen("screen-title");
    this.initTitle();
  },

  /* ---------------- 结局 ---------------- */

  /* 【总结任期·翻页式】任意年份的年度结算画面（结局面板「总结任期」按钮，不再限定最新剧本年份）
     都可打开；从 2016 开局到当前年份逐页回放，一年一页：决策记录 / 年度获利 / 年度喜爱成员 / 关键成绩。
     数据源：st.termLog（UI 选项钩子 Game.logTermChoice 写入，全程累积）、
     st.termArchive（跨年时引擎 termArchiveYear 归档，含资金/实力/喜爱/关键成绩快照）、
     当前年用实时值算。老存档无归档的年份显示缺页提示，不凑空账。 */
  showTermSummary() {
    const st = Game.st;
    const years = [];
    for (let y = 2016; y <= parseInt(st.era, 10); y++) years.push(String(y));
    let page = years.length - 1;   // 默认最后一页（当前年）

    const cur = st.era;
    const c = this.card("总结任期 · " + (st.playerName || ""),
      "从 2016 开局到现在：拍板、账本与人，一年一页");
    const titleEl = this.el("p", "modal-text", "");
    titleEl.style.fontWeight = "bold";
    const bodyEl = this.el("div", "");
    const navEl = this.el("p", "modal-text", "");
    c.appendChild(titleEl);
    c.appendChild(bodyEl);
    c.appendChild(navEl);

    const renderPage = () => {
      const era = years[page];
      const isCur = era === cur;
      const arc = isCur ? null : (st.termArchive || {})[era];
      const yearLog = (st.termLog || []).filter(e => e.era === era);
      titleEl.textContent = "―――― " + era + " ――――（第 " + (page + 1) + "/" + years.length + " 页）";
      bodyEl.innerHTML = "";

      if (!isCur && !arc) {
        bodyEl.appendChild(this.el("p", "modal-text",
          "该年归档缺失（旧版存档跨年时未记录），此页仅存当年的拍板流水。"));
      }

      /* 决策记录 */
      if (yearLog.length) {
        for (const e of yearLog)
          bodyEl.appendChild(this.el("p", "modal-text", e.era + "年" + e.month + "月，你在「" + e.event + "」的事件中做出了「" + e.choice + "」的决定。"));
      } else {
        bodyEl.appendChild(this.el("p", "modal-text", "这一年没有留下逐项拍板的记录。"));
      }

      /* 年度获利（年末资金 - 年初资金） */
      const mS = isCur ? (st.history && st.history["money" + (parseInt(era, 10) - 1)]) : (arc ? arc.moneyStart : null);
      const mE = isCur ? st.money : (arc ? arc.moneyEnd : null);
      if (mS != null && mE != null) {
        const p = mE - mS;
        bodyEl.appendChild(this.el("p", "modal-text", p >= 0
          ? "你在" + era + "年为丝芭赚了 " + p + " 万（年初 " + mS + " 万 → 年末 " + mE + " 万）。"
          : "你在" + era + "年为丝芭亏了 " + (-p) + " 万（年初 " + mS + " 万 → 年末 " + mE + " 万）。"));
      } else if (isCur) {
        bodyEl.appendChild(this.el("p", "modal-text", "该年账本缺了年初那一页（快速通道开局年份之前无流水）。"));
      }

      /* 年度喜爱成员 */
      const fav = isCur ? (() => {
        const bb = st.bondBase || {};
        let top = null, topD = 0;
        for (const m of st.members) {
          if (m.status !== "active") continue;
          const d = (m.bond || 0) - (bb[m.name] || 0);
          if (d > topD) { topD = d; top = m; }
        }
        return top ? { name: top.name, d: topD } : null;
      })() : (arc ? arc.favorite : null);
      bodyEl.appendChild(this.el("p", "modal-text", fav
        ? era + "年你对" + fav.name + "特别的关心（羁绊 +" + fav.d + "）。"
        : "这一年，你把心思平摊给了每一个孩子。"));

      /* 关键成绩：当前年实时算；历史年取归档快照（旧档无快照按 — 兕底） */
      bodyEl.appendChild(this.el("p", "modal-text", "—— " + era + " 关键成绩 ——"));
      const dash = "—";
      const rows = [
        ["拍板笔数（本年）", yearLog.length + " 项"],
        ["总决选第一名", isCur ? (st.geResult && st.geResult.top1 ? st.geResult.top1 : dash)
          : (arc && arc.top1 ? arc.top1 : (arc ? dash : "归档缺失"))],
        ["金曲大赏", isCur ? (st.rtDone ? st.rtScore + " / 100" : dash)
          : (arc && arc.rtScore === "cancelled" ? "已取消"
            : arc && arc.rtScore != null ? arc.rtScore + " / 100" : (arc ? dash : "归档缺失"))],
        ["全团平均实力", isCur ? Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"
          : arc && arc.pwrEnd != null ? arc.pwrEnd + "（年初 " + arc.pwrStart + "）" : "归档缺失"],
        ["年末热度 / 士气", isCur ? st.heat + " / " + st.morale
          : arc && arc.heat != null ? arc.heat + " / " + arc.morale : (arc ? dash : "归档缺失")],
      ];
      for (const [k, v] of rows) {
        const r = this.el("div", "settle-row");
        r.appendChild(this.el("span", "", k));
        r.appendChild(this.el("span", "sr-val", v));
        bodyEl.appendChild(r);
      }

      /* 翻页导航 */
      navEl.innerHTML = "";
      const prev = this.el("button", "btn", "← " + (page > 0 ? years[page - 1] : ""));
      prev.disabled = page <= 0;
      prev.onclick = () => { if (page > 0) { page--; renderPage(); } };
      const next = this.el("button", "btn", (page < years.length - 1 ? years[page + 1] : "") + " →");
      next.disabled = page >= years.length - 1;
      next.onclick = () => { if (page < years.length - 1) { page++; renderPage(); } };
      navEl.appendChild(prev);
      navEl.appendChild(document.createTextNode("  "));
      navEl.appendChild(next);
    };
    renderPage();

    const btn = this.el("button", "btn btn-primary modal-close", "合上任期纪念册 →");
    btn.onclick = () => this.closeModal();
    c.appendChild(btn);
    this.modal(c);
  },

  showEnding(grade) {
    const st = Game.st;
    const endingsSrc = st.era === "2027" ? STORY.endings27
      : st.era === "2026" ? STORY.endings26
      : st.era === "2021" ? STORY.endings21
      : st.era === "2020" ? STORY.endings20
      : st.era === "2019" ? STORY.endings19
      : st.era === "2018" ? STORY.endings18
      : st.era === "2017" ? STORY.endings17 : STORY.endings;
    const ending = endingsSrc[grade] || endingsSrc.C;
    Game.clearSave();
    this.$("ending-rank").textContent = ending.rank;
    this.$("ending-title").textContent = ending.title;
    /* 结局正文支持函数（按 2026 成都决策 / WHN48 状态分叉，见 data_story_2027.js endings27） */
    this.$("ending-text").textContent = typeof ending.text === "function" ? ending.text(st) : ending.text;

    const stats = this.$("ending-stats");
    stats.innerHTML = "";
    const styleNames = st.era === "2018" || st.era === "2019" || st.era === "2020" || st.era === "2021"
      ? { steady18: "稳进派", polish18: "淬炼派", hype18: "造势派", steady19: "稳进派", polish19: "淬炼派", hype19: "造势派", steady20: "守成派", polish20: "淬炼派", hype20: "造势派", steady21: "守成派", shop21: "开拓派", health21: "人事派" }
      : st.era === "2027"
      ? { steady27: "守正派", polish27: "淬炼派", hype27: "造势派" }
      : st.era === "2026"
      ? { steady: "守成派", content: "内容派", people: "人事派" }
      : st.era === "2017"
      ? { stable: "稳进派", content17: "淬炼派", hype: "造势派" }
      : { pragmatic: "实干派", communicator: "沟通派", visionary: "造势派" };
    const rows = st.era === "2018" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["全团大重组", st.reorg18.done ? "✔ 新编制落地（" + (st.flags.xiiKept18 ? "XII 保留" : "XII 谢幕") + " · FT 成立）" : st.reorg18.ready ? "筹备完毕 · 编制会 3 月末召开" : st.reorg18.stage >= 1 ? "筹备到第 " + st.reorg18.stage + " 步" : "未启动"],
      ["预备生公演升格", (st.prep18.promoted || 0) + " 人（含分团上调）"],
      ["选秀派遣", (st.show18.done ? "✔ " + (st.show18.squad ? st.show18.squad.length : 0) + " 人完成首轮录制" : st.show18.squad ? "集训中" : "未启动")
        + (st.show18.album ? " · ✔ 葛佳慧专辑已发行" : "")],
      ["总决选第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年度金曲", this.goldTopText(st)],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2027" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["WHN48", st.flags.wh27Main
        ? (st.branch27.open ? "✔ " + st.branch27.openMonth + " 月首演亮灯" : st.branch27.stage >= 1 ? "筹备到第 " + st.branch27.stage + " 阶段" : "未启动")
        : "未立项（守成路线）"],
      ["影视部焕新", st.film.done ? "✔ " + st.film.doneMonth + " 月开播" : st.film.stage >= 1 ? "推进到第 " + st.film.stage + " 阶段" : "未启动"],
      ["总决选第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtCancelled ? "✘ 已取消" : st.rtDone ? st.rtScore + " / 100" : "—"],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2020" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["分团安置", st.decisions.branch19Keep === "keep"
        ? (st.reorg20.done ? "✔ 已完成（" + (Game.keptBranchFlags20(st).join("、") || "无旗号保留") + "）" : "未完成")
        : "去年已善后"],
      ["防疫与返工", st.covid20.done ? "✔ 全年零感染零事故" : st.covid20.stage >= 1 ? "部署完成 · 返工待落地" : "未启动"],
      ["云公演", st.cloud20.done ? "✔ 已开演 " + st.cloud20.held + " 场" : st.cloud20.stage >= 1 ? "推进到第 " + (st.cloud20.stage + 1) + "/3 步" : "未启动"],
      ["和平分手", Game.isReplicate(st) ? (st.teb20.done ? "✔ TEB48 交还日方" : "未完成") : "非复刻线"],
      ["一期生合约", st.gen1.done ? "✔ 已逐人拍板" : "未完成"],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2021" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["年度活动模式", st.decisions.geMode21 === "partner" ? "《最佳拍档》改造总选（组队制）" : st.decisions.geMode21 === "classic" ? "传统总选 · 投票给作品" : "未拍板"],
      ["电商领域", st.aw9shop21.done ? "✔ AW9 直播常态化运营" : st.aw9shop21.stage >= 1 ? "推进到第 " + (st.aw9shop21.stage + 1) + "/3 步" : "未启动"],
      ["疫苗接种", st.vaccine21.done ? "✔ 全团两针 100%" : st.vaccine21.stage >= 1 ? "第一针完成" : "未启动"],
      ["海外选秀", st.gp21.done ? "✔ 出征集训完成（" + (st.decisions.gp21Squad || []).join("、") + "）" : st.decisions.gp21Squad ? "点将完成 · 集训待推进" : "未启动"],
      ["总选举第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2019" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["二次组阁", st.reorg19.done ? "✔ 新编制落地（调队/预备生/分团/IDFT 全部归位）" : st.reorg19.stage >= 1 ? "编制会进行中" : "未启动"],
      ["TEB48", st.decisions.teb19Push === "go"
        ? (st.teb19.open ? "✔ " + st.teb19.openMonth + " 月开业首演（派遣移籍 " + ((st.decisions.teb19Squad || []).length) + " 人）" : "筹建到第 " + (st.teb19.stage + 1) + "/4 步")
        : "今年未立项"],
      ["年度招新", st.recruit19.done ? "✔ 本部 " + st.recruit19.hq + " 人 · 分团 " + st.recruit19.br + " 人（预备生入池）" : "未启动"],
      ["限定团", st.flags.unit19Formed ? "✔ " + (st.unit19.members || []).join("、") : "未成团"],
      ["总决选第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年度金曲", this.goldTopText(st)],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2026" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["CGT48", st.cgt.closed
        ? (st.cgt.settleDone ? "✔ 已解散·前成员妥善安置" : "✘ 已解散（安置 " + (st.cgt.settled || 0) + "/3）")
        : st.cgt.open ? "✔ " + st.cgt.openMonth + " 月重启首演" : st.cgt.stage >= 1 ? "重建进行到第 " + st.cgt.stage + " 阶段" : "未启动"],
      ["末位淘汰", "执行 " + st.elim.executed + " · 调往CGT " + st.elim.transferred + " · 缓刑 " + st.elim.defied],
      ["总选举第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏", st.rtCancelled ? "✘ 已取消" : st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : st.era === "2017" ? [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["双团开设", (st.branch17.shyOpen ? "✔ SHY48 " + st.branch17.shyOpenMonth + " 月开业" : "SHY48 未开业")
        + "　|　" + (st.branch17.ckgOpen ? "✔ CKG48 " + st.branch17.ckgOpenMonth + " 月开业" : "CKG48 未开业")],
      ["总决选第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏评价", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年度金曲", this.goldTopText(st)],
      ["原创公演", Game.origCount(st) + " / 4 套"],
      ["全团平均实力", Game.avgPwr(st) + "（年初 " + (st.pwrBase || 0) + "）"],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ] : [
      ["年度总分", grade === "S" ? "★★★★★" : grade === "A" ? "★★★★" : grade === "B" ? "★★★" : "★★"],
      ["分团", st.branch.announce ? "✔ " + st.branch.city + " · " + st.branch.announceMonth + "月官宣" : "未成立"],
      ["总选举第一名", st.geResult ? st.geResult.top1 : "—"],
      ["金曲大赏评价", st.rtDone ? st.rtScore + " / 100" : "—"],
      ["年度金曲", this.goldTopText(st)],
      ["年末资金", st.money + " 万"],
      ["年末热度 / 士气", st.heat + " / " + st.morale],
      ["管理风格", styleNames[st.startStyle] || "—"],
    ];
    for (const [k, v] of rows) {
      const r = this.el("div", "settle-row");
      r.appendChild(this.el("span", "", k));
      r.appendChild(this.el("span", "sr-val", v));
      stats.appendChild(r);
    }
    this.showScreen("screen-ending");
    this.$("btn-ending-restart").onclick = () => this.showStart();
    this.$("btn-ending-title").onclick = () => this.showTitle();
    /* 【「进入下一年」入口】2016→2017「本部新章」/ 2017→2018「星阵重列」/ 2020→2021「春潮」/
       2026→2027「大河新篇」：继承年末成员卡与经营状态开启续写线（破产结局除外）。 */
    if ((st.era === "2016" || st.era === "2017" || st.era === "2018" || st.era === "2019" || st.era === "2020" || st.era === "2026") && grade !== "bankrupt") {
      const oldNext = document.getElementById("btn-ending-next");
      if (oldNext) oldNext.remove();   // 防重复：上一次结局界面的残留按钮（点击会回跳旧线）先移除
      const btnNext = this.el("button", "btn btn-primary", "进入下一年 →");
      btnNext.id = "btn-ending-next";
      btnNext.onclick = () => {
        if (st.era === "2026") Game.carryTo2027();
        else if (st.era === "2020") Game.carryTo2021();
        else if (st.era === "2019") Game.carryTo2020();
        else if (st.era === "2018") Game.carryTo2019();
        else if (st.era === "2017") Game.carryTo2018();
        else Game.carryTo2017();
        this.showPrologue();
      };
      this.$("btn-ending-restart").parentElement.insertBefore(btnNext, this.$("btn-ending-title"));
    }
    /* 【总结任期·翻页式】不再限定最新剧本年份：任意一年的结算画面都可打开总结任期，
       从 2016 开局到当前年逐页回放（跨年由引擎 termArchiveYear 追加归档，无需判定最新年份） */
    {
      const oldTerm = document.getElementById("btn-ending-term");
      if (oldTerm) oldTerm.remove();   // 防重复：残留按钮先移除
      const btnTerm = this.el("button", "btn btn-primary", "总结任期 →");
      btnTerm.id = "btn-ending-term";
      btnTerm.onclick = () => this.showTermSummary();
      this.$("btn-ending-restart").parentElement.insertBefore(btnTerm, this.$("btn-ending-title"));
    }
  },
};
